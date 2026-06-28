import { NextResponse } from 'next/server'
import { getTurso } from '@/lib/tursoClient'
import { initMondaySchema } from '@/lib/mondayDb'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  await initMondaySchema()
  const { inviteToken, name, email } = await req.json()
  if (!inviteToken || !name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'invite token, name, and email required' }, { status: 400 })
  }

  const turso = getTurso()

  // Validate invite
  const inv = (await turso.execute({ sql: 'SELECT * FROM pm_invites WHERE id = ?', args: [inviteToken] })).rows[0]
  if (!inv) return NextResponse.json({ error: 'Invalid invite link' }, { status: 403 })
  if (Number(inv.used) >= 1) return NextResponse.json({ error: 'This invite link has already been used' }, { status: 403 })

  // Check if email already registered
  const existing = (await turso.execute({ sql: 'SELECT * FROM pm_users WHERE email = ?', args: [email.toLowerCase().trim()] })).rows[0]
  if (existing) return NextResponse.json({ error: 'This email is already registered. Use the login option instead.' }, { status: 409 })

  const userId = randomUUID()
  await turso.execute({ sql: 'INSERT INTO pm_users (id, email, name, user_id) VALUES (?, ?, ?, ?)', args: [randomUUID(), email.toLowerCase().trim(), name.trim(), userId] })
  await turso.execute({ sql: 'UPDATE pm_invites SET used = 1, used_by_email = ? WHERE id = ?', args: [email.toLowerCase().trim(), inviteToken] })

  return NextResponse.json({ userId, name: name.trim(), email: email.toLowerCase().trim() }, { status: 201 })
}
