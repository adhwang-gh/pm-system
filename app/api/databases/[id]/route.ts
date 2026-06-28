import { NextResponse } from 'next/server'
import { getTurso, toRows, initNotionSchema } from '@/lib/tursoClient'
import { randomUUID } from 'crypto'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await initNotionSchema()
  const { id } = await params
  const turso = getTurso()
  const res = await turso.execute({ sql: 'SELECT * FROM db_columns WHERE page_id = ? ORDER BY position ASC', args: [id] })
  return NextResponse.json(toRows(res.rows).map(c => ({ ...c, options: (() => { try { return JSON.parse(c.options as string) } catch { return [] } })() })))
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const turso = getTurso()
  const body = await req.json()
  const colId = randomUUID()
  const { name = 'Column', type = 'text', options = [] } = body
  const maxPosRes = await turso.execute({ sql: 'SELECT MAX(position) as m FROM db_columns WHERE page_id = ?', args: [id] })
  const maxPos = Number(maxPosRes.rows[0]?.m ?? -1)
  await turso.execute({ sql: 'INSERT INTO db_columns (id, page_id, name, type, options, position) VALUES (?, ?, ?, ?, ?, ?)', args: [colId, id, name, type, JSON.stringify(options), maxPos + 1] })
  const col = (await turso.execute({ sql: 'SELECT * FROM db_columns WHERE id = ?', args: [colId] })).rows[0]
  return NextResponse.json({ ...Object.fromEntries(Object.entries(col)), options: JSON.parse(col.options as string) }, { status: 201 })
}
