import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id)
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(page)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const body = await req.json()
  const fields = Object.keys(body).filter(k => ['title', 'content', 'icon', 'parent_id'].includes(k))
  if (fields.length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  const sets = fields.map(f => `${f} = ?`).join(', ')
  const values = fields.map(f => body[f])
  db.prepare(`UPDATE pages SET ${sets}, updated_at = datetime('now') WHERE id = ?`).run(...values, id)
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id)
  return NextResponse.json(page)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  db.prepare('DELETE FROM db_rows WHERE page_id = ?').run(id)
  db.prepare('DELETE FROM db_columns WHERE page_id = ?').run(id)
  db.prepare('DELETE FROM pages WHERE id = ?').run(id)
  return NextResponse.json({ ok: true })
}
