import { NextResponse } from 'next/server'
import { getTurso, toRows, initNotionSchema } from '@/lib/tursoClient'
import { randomUUID } from 'crypto'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await initNotionSchema()
  const { id } = await params
  const turso = getTurso()
  const res = await turso.execute({ sql: 'SELECT * FROM db_rows WHERE page_id = ? ORDER BY position ASC', args: [id] })
  return NextResponse.json(toRows(res.rows).map(r => ({ ...r, data: (() => { try { return JSON.parse(r.data as string) } catch { return {} } })() })))
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await initNotionSchema()
  const { id } = await params
  const turso = getTurso()
  const body = await req.json()
  const rowId = randomUUID()
  const data = body.data ?? {}
  const maxPosRes = await turso.execute({ sql: 'SELECT MAX(position) as m FROM db_rows WHERE page_id = ?', args: [id] })
  const maxPos = Number(maxPosRes.rows[0]?.m ?? -1)
  await turso.execute({ sql: 'INSERT INTO db_rows (id, page_id, data, position) VALUES (?, ?, ?, ?)', args: [rowId, id, JSON.stringify(data), maxPos + 1] })
  const row = (await turso.execute({ sql: 'SELECT * FROM db_rows WHERE id = ?', args: [rowId] })).rows[0]
  return NextResponse.json({ ...Object.fromEntries(Object.entries(row)), data: JSON.parse(row.data as string) }, { status: 201 })
}
