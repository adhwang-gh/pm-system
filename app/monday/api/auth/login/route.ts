import { NextResponse } from 'next/server'
import { getTurso } from '@/lib/tursoClient'
import { initMondaySchema } from '@/lib/mondayDb'

export async function POST(req: Request) {
  await initMondaySchema()
  const { email } = await req.json()
  if (!email?.trim()) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const turso = getTurso()
  const user = (await turso.execute({ sql: 'SELECT * FROM pm_users WHERE email = ?', args: [email.toLowerCase().trim()] })).rows[0]
  if (!user) return NextResponse.json({ error: 'No account found for that email. Check your invite link to register.' }, { status: 404 })

  return NextResponse.json({ userId: user.user_id, name: user.name, email: user.email })
}
