import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { randomUUID } from 'crypto'

export function GET() {
  const db = getDb()
  const events = db.prepare('SELECT * FROM calendar_events ORDER BY date ASC').all()
  return NextResponse.json(events)
}

export async function POST(req: Request) {
  const db = getDb()
  const body = await req.json()
  const id = randomUUID()
  const { title = 'Untitled Event', date, end_date = null, time = '', color = '#7B68EE', description = '' } = body
  db.prepare('INSERT INTO calendar_events (id, title, date, end_date, time, color, description) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, title, date, end_date, time, color, description)
  return NextResponse.json(db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(id), { status: 201 })
}

export async function PATCH(req: Request) {
  const db = getDb()
  const body = await req.json()
  const { id, ...fields } = body
  const allowed = ['title', 'date', 'end_date', 'time', 'color', 'description']
  const keys = Object.keys(fields).filter(k => allowed.includes(k))
  if (!keys.length) return NextResponse.json({ error: 'no fields' }, { status: 400 })
  const sets = keys.map(k => `${k} = ?`).join(', ')
  db.prepare(`UPDATE calendar_events SET ${sets} WHERE id = ?`).run(...keys.map(k => fields[k]), id)
  return NextResponse.json(db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(id))
}

export async function DELETE(req: Request) {
  const db = getDb()
  const { id } = await req.json()
  db.prepare('DELETE FROM calendar_events WHERE id = ?').run(id)
  return NextResponse.json({ ok: true })
}
