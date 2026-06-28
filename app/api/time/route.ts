import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { randomUUID } from 'crypto'

export function GET() {
  const db = getDb()
  return NextResponse.json(db.prepare('SELECT * FROM time_entries ORDER BY created_at DESC').all())
}

export async function POST(req: Request) {
  const db = getDb()
  const body = await req.json()
  const id = randomUUID()
  const { description = '', project = '', duration_minutes = 0, started_at = null } = body
  db.prepare('INSERT INTO time_entries (id, description, project, duration_minutes, started_at) VALUES (?, ?, ?, ?, ?)').run(id, description, project, duration_minutes, started_at)
  return NextResponse.json(db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id), { status: 201 })
}

export async function PATCH(req: Request) {
  const db = getDb()
  const body = await req.json()
  const { id, duration_minutes, description, project } = body
  if (duration_minutes !== undefined) db.prepare('UPDATE time_entries SET duration_minutes = ? WHERE id = ?').run(duration_minutes, id)
  if (description !== undefined) db.prepare('UPDATE time_entries SET description = ? WHERE id = ?').run(description, id)
  if (project !== undefined) db.prepare('UPDATE time_entries SET project = ? WHERE id = ?').run(project, id)
  return NextResponse.json(db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id))
}

export async function DELETE(req: Request) {
  const db = getDb()
  const { id } = await req.json()
  db.prepare('DELETE FROM time_entries WHERE id = ?').run(id)
  return NextResponse.json({ ok: true })
}
