import { NextResponse } from 'next/server'
import { getTurso, toRows } from '@/lib/tursoClient'
import { initMondaySchema } from '@/lib/mondayDb'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await initMondaySchema()
  const turso = getTurso()
  const [boardRes, groupsRes, columnsRes, itemsRes] = await Promise.all([
    turso.execute({ sql: 'SELECT * FROM monday_boards WHERE id = ?', args: [id] }),
    turso.execute({ sql: 'SELECT * FROM monday_groups WHERE board_id = ? ORDER BY position', args: [id] }),
    turso.execute({ sql: 'SELECT * FROM monday_columns WHERE board_id = ? ORDER BY position', args: [id] }),
    turso.execute({ sql: 'SELECT * FROM monday_items WHERE board_id = ? ORDER BY position', args: [id] }),
  ])

  const board = boardRes.rows[0] ? Object.fromEntries(Object.entries(boardRes.rows[0])) : null
  const groups = toRows(groupsRes.rows)
  const columns = toRows(columnsRes.rows).map(c => ({ ...c, options: (() => { try { return JSON.parse(c.options as string) } catch { return [] } })() }))
  const items = toRows(itemsRes.rows).map(it => ({ ...it, data: (() => { try { return JSON.parse(it.data as string) } catch { return {} } })() }))

  return NextResponse.json({ board, groups, columns, items })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const turso = getTurso()
  const body = await req.json()
  if (body.title !== undefined) {
    await turso.execute({ sql: 'UPDATE monday_boards SET title = ? WHERE id = ?', args: [body.title, id] })
  }
  const board = (await turso.execute({ sql: 'SELECT * FROM monday_boards WHERE id = ?', args: [id] })).rows[0]
  return NextResponse.json(Object.fromEntries(Object.entries(board)))
}
