import { NextResponse } from 'next/server'
import { getTurso, initNotionSchema } from '@/lib/tursoClient'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await initNotionSchema()
  const { id } = await params
  const turso = getTurso()
  const res = await turso.execute({ sql: 'SELECT * FROM pages WHERE id = ?', args: [id] })
  if (!res.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(Object.fromEntries(Object.entries(res.rows[0])))
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const turso = getTurso()
  const body = await req.json()
  const fields = Object.keys(body).filter(k => ['title', 'content', 'icon', 'parent_id'].includes(k))
  if (fields.length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  for (const f of fields) {
    await turso.execute({ sql: `UPDATE pages SET ${f} = ?, updated_at = datetime('now') WHERE id = ?`, args: [body[f], id] })
  }
  const page = (await turso.execute({ sql: 'SELECT * FROM pages WHERE id = ?', args: [id] })).rows[0]
  return NextResponse.json(Object.fromEntries(Object.entries(page)))
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const turso = getTurso()
  await turso.batch([
    { sql: 'DELETE FROM db_rows WHERE page_id = ?', args: [id] },
    { sql: 'DELETE FROM db_columns WHERE page_id = ?', args: [id] },
    { sql: 'DELETE FROM pages WHERE id = ?', args: [id] },
  ], 'write')
  return NextResponse.json({ ok: true })
}
