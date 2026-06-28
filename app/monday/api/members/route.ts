import { NextResponse } from 'next/server'
import { getTurso, toRows } from '@/lib/tursoClient'
import { initMondaySchema } from '@/lib/mondayDb'
import { randomUUID } from 'crypto'

const COLORS = ['#C9A24B','#9C7C32','#8A8478','#52504C','#B0221B','#6B7280','#4B5563','#374151','#D97706','#7C3AED']

function toInitials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2) || '?'
}

function getUserId(req: Request): string {
  return req.headers.get('X-Pm-User-Id') ?? 'anonymous'
}

export async function GET(req: Request) {
  await initMondaySchema()
  const userId = getUserId(req)
  const turso = getTurso()
  const res = await turso.execute({ sql: 'SELECT * FROM pm_members WHERE user_id = ? ORDER BY created_at ASC', args: [userId] })
  return NextResponse.json(toRows(res.rows))
}

export async function POST(req: Request) {
  await initMondaySchema()
  const userId = getUserId(req)
  const turso = getTurso()
  const { name, id: providedId } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const countRes = await turso.execute({ sql: 'SELECT COUNT(*) as c FROM pm_members WHERE user_id = ?', args: [userId] })
  const idx = Number(countRes.rows[0]?.c ?? 0) % COLORS.length
  const id = providedId ?? randomUUID()
  await turso.execute({ sql: 'INSERT OR REPLACE INTO pm_members (id, user_id, name, initials, color) VALUES (?, ?, ?, ?, ?)', args: [id, userId, name.trim(), toInitials(name), COLORS[idx]] })
  const row = (await turso.execute({ sql: 'SELECT * FROM pm_members WHERE id = ?', args: [id] })).rows[0]
  return NextResponse.json(Object.fromEntries(Object.entries(row)), { status: 201 })
}

export async function DELETE(req: Request) {
  const userId = getUserId(req)
  const turso = getTurso()
  const { id } = await req.json()
  await turso.execute({ sql: 'DELETE FROM pm_members WHERE id = ? AND user_id = ?', args: [id, userId] })
  return NextResponse.json({ ok: true })
}
