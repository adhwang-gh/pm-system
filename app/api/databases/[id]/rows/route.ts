import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { randomUUID } from 'crypto'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const rows = db.prepare('SELECT * FROM db_rows WHERE page_id = ? ORDER BY position ASC').all(id) as Array<{ data: string } & Record<string, unknown>>
  return NextResponse.json(rows.map(r => ({ ...r, data: JSON.parse(r.data as string) })))
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const body = await req.json()
  const rowId = randomUUID()
  const data = body.data ?? {}
  const maxPos = (db.prepare('SELECT MAX(position) as m FROM db_rows WHERE page_id = ?').get(id) as { m: number | null }).m ?? -1
  db.prepare('INSERT INTO db_rows (id, page_id, data, position) VALUES (?, ?, ?, ?)').run(rowId, id, JSON.stringify(data), maxPos + 1)
  const row = db.prepare('SELECT * FROM db_rows WHERE id = ?').get(rowId) as { data: string } & Record<string, unknown>
  return NextResponse.json({ ...row, data: JSON.parse(row.data) }, { status: 201 })
}
