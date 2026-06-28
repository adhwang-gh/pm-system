import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { randomUUID } from 'crypto'

export function GET() {
  const db = getDb()
  return NextResponse.json(db.prepare('SELECT * FROM files ORDER BY created_at DESC').all())
}

export async function POST(req: Request) {
  const db = getDb()
  const body = await req.json()
  const id = randomUUID()
  const { name, type = 'file', size = '', url = '', tags = '' } = body
  db.prepare('INSERT INTO files (id, name, type, size, url, tags) VALUES (?, ?, ?, ?, ?, ?)').run(id, name, type, size, url, tags)
  return NextResponse.json(db.prepare('SELECT * FROM files WHERE id = ?').get(id), { status: 201 })
}

export async function DELETE(req: Request) {
  const db = getDb()
  const { id } = await req.json()
  db.prepare('DELETE FROM files WHERE id = ?').run(id)
  return NextResponse.json({ ok: true })
}
