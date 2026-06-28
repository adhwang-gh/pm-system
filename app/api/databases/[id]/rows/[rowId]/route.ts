import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; rowId: string }> }) {
  const { rowId } = await params
  const db = getDb()
  const body = await req.json()
  const existing = db.prepare('SELECT data FROM db_rows WHERE id = ?').get(rowId) as { data: string } | undefined
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const merged = { ...JSON.parse(existing.data), ...body.data }
  db.prepare('UPDATE db_rows SET data = ? WHERE id = ?').run(JSON.stringify(merged), rowId)
  const row = db.prepare('SELECT * FROM db_rows WHERE id = ?').get(rowId) as { data: string } & Record<string, unknown>
  return NextResponse.json({ ...row, data: JSON.parse(row.data) })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; rowId: string }> }) {
  const { rowId } = await params
  const db = getDb()
  db.prepare('DELETE FROM db_rows WHERE id = ?').run(rowId)
  return NextResponse.json({ ok: true })
}
