import { NextResponse } from 'next/server'
import { getTurso } from '@/lib/tursoClient'
import { initMondaySchema } from '@/lib/mondayDb'
import { randomUUID } from 'crypto'

const COLORS = ['#3D5A80','#5C7A99','#6B7280','#9A9A92','#4B5563','#374151','#475569','#64748B']

function toInitials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2) || '?'
}

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
  const cleanEmail = email.toLowerCase().trim()
  const cleanName = name.trim()

  await turso.execute({ sql: 'INSERT INTO pm_users (id, email, name, user_id) VALUES (?, ?, ?, ?)', args: [randomUUID(), cleanEmail, cleanName, userId] })

  // Add to pm_members so they appear in PM picker and Weekly Updates
  const colorIdx = 0
  await turso.execute({
    sql: 'INSERT OR IGNORE INTO pm_members (id, user_id, name, initials, color) VALUES (?, ?, ?, ?, ?)',
    args: [userId, userId, cleanName, toInitials(cleanName), COLORS[colorIdx]]
  })

  return NextResponse.json({ userId, name: cleanName, email: cleanEmail }, { status: 201 })
}
