import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { randomUUID } from 'crypto'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const columns = db.prepare('SELECT * FROM db_columns WHERE page_id = ? ORDER BY position ASC').all(id) as Array<{ options: string } & Record<string, unknown>>
  return NextResponse.json(columns.map(c => ({ ...c, options: JSON.parse(c.options as string) })))
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const body = await req.json()
  const colId = randomUUID()
  const { name = 'Column', type = 'text', options = [] } = body
  const maxPos = (db.prepare('SELECT MAX(position) as m FROM db_columns WHERE page_id = ?').get(id) as { m: number | null }).m ?? -1
  db.prepare('INSERT INTO db_columns (id, page_id, name, type, options, position) VALUES (?, ?, ?, ?, ?, ?)').run(colId, id, name, type, JSON.stringify(options), maxPos + 1)
  const col = db.prepare('SELECT * FROM db_columns WHERE id = ?').get(colId) as { options: string } & Record<string, unknown>
  return NextResponse.json({ ...col, options: JSON.parse(col.options) }, { status: 201 })
}
