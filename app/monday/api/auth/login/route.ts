import { NextResponse } from 'next/server'
import { getTurso } from '@/lib/tursoClient'
import { initMondaySchema } from '@/lib/mondayDb'

const COLORS = ['#3D5A80','#5C7A99','#6B7280','#9A9A92','#4B5563','#374151','#475569','#64748B']

function toInitials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2) || '?'
}

export async function POST(req: Request) {
  await initMondaySchema()
  const { email } = await req.json()
  if (!email?.trim()) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const turso = getTurso()
  const user = (await turso.execute({ sql: 'SELECT * FROM pm_users WHERE email = ?', args: [email.toLowerCase().trim()] })).rows[0]
  if (!user) return NextResponse.json({ error: 'No account found for that email. Check your spelling or create an account.' }, { status: 404 })

  const userId = String(user.user_id)
  const name = String(user.name)

  // Ensure they exist in pm_members (idempotent)
  await turso.execute({
    sql: 'INSERT OR IGNORE INTO pm_members (id, user_id, name, initials, color) VALUES (?, ?, ?, ?, ?)',
    args: [userId, userId, name, toInitials(name), COLORS[0]]
  })

  return NextResponse.json({ userId, name, email: user.email })
}
