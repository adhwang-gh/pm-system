import { NextResponse } from 'next/server'
import { getTurso } from '@/lib/tursoClient'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; rowId: string }> }) {
  const { rowId } = await params
  const turso = getTurso()
  const body = await req.json()
  const existingRes = await turso.execute({ sql: 'SELECT data FROM db_rows WHERE id = ?', args: [rowId] })
  if (!existingRes.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const merged = { ...JSON.parse(existingRes.rows[0].data as string), ...body.data }
  await turso.execute({ sql: 'UPDATE db_rows SET data = ? WHERE id = ?', args: [JSON.stringify(merged), rowId] })
  const row = (await turso.execute({ sql: 'SELECT * FROM db_rows WHERE id = ?', args: [rowId] })).rows[0]
  return NextResponse.json({ ...Object.fromEntries(Object.entries(row)), data: JSON.parse(row.data as string) })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; rowId: string }> }) {
  const { rowId } = await params
  const turso = getTurso()
  await turso.execute({ sql: 'DELETE FROM db_rows WHERE id = ?', args: [rowId] })
  return NextResponse.json({ ok: true })
}
