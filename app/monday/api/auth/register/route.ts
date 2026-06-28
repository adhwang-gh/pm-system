import { NextResponse } from 'next/server'
import { getTurso } from '@/lib/tursoClient'
import { initMondaySchema } from '@/lib/mondayDb'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  await initMondaySchema()
  const { name, email } = await req.json()
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  const turso = getTurso()
  const existing = (await turso.execute({ sql: 'SELECT * FROM pm_users WHERE email = ?', args: [email.toLowerCase().trim()] })).rows[0]
  if (existing) return NextResponse.json({ error: 'This email is already registered. Sign in instead.' }, { status: 409 })

  const userId = randomUUID()
  await turso.execute({ sql: 'INSERT INTO pm_users (id, email, name, user_id) VALUES (?, ?, ?, ?)', args: [randomUUID(), email.toLowerCase().trim(), name.trim(), userId] })

  return NextResponse.json({ userId, name: name.trim(), email: email.toLowerCase().trim() }, { status: 201 })
}
