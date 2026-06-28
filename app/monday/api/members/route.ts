import { NextResponse } from 'next/server'
import { getTurso, toRows } from '@/lib/tursoClient'
import { initMondaySchema } from '@/lib/mondayDb'
import { randomUUID } from 'crypto'

const COLORS = ['#C9A24B','#9C7C32','#8A8478','#52504C','#B0221B','#6B7280','#4B5563','#374151','#D97706','#7C3AED']

function toInitials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2) || '?'
}

export async function GET() {
  await initMondaySchema()
  const turso = getTurso()
  const res = await turso.execute('SELECT * FROM pm_members ORDER BY created_at ASC')
  return NextResponse.json(toRows(res.rows))
}

export async function POST(req: Request) {
  await initMondaySchema()
  const turso = getTurso()
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  // Assign next color in rotation
  const countRes = await turso.execute('SELECT COUNT(*) as c FROM pm_members')
  const idx = Number(countRes.rows[0]?.c ?? 0) % COLORS.length
  const id = randomUUID()
  await turso.execute({ sql: 'INSERT INTO pm_members (id, name, initials, color) VALUES (?, ?, ?, ?)', args: [id, name.trim(), toInitials(name), COLORS[idx]] })
  const row = (await turso.execute({ sql: 'SELECT * FROM pm_members WHERE id = ?', args: [id] })).rows[0]
  return NextResponse.json(Object.fromEntries(Object.entries(row)), { status: 201 })
}

export async function DELETE(req: Request) {
  const turso = getTurso()
  const { id } = await req.json()
  await turso.execute({ sql: 'DELETE FROM pm_members WHERE id = ?', args: [id] })
  return NextResponse.json({ ok: true })
}
