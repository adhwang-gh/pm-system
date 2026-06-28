import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { initMondaySchema } from '@/lib/mondayDb'
import { randomUUID } from 'crypto'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  initMondaySchema()
  const db = getDb()
  const board = db.prepare('SELECT * FROM monday_boards WHERE id = ?').get(id)
  const groups = db.prepare('SELECT * FROM monday_groups WHERE board_id = ? ORDER BY position').all(id)
  const columns = db.prepare('SELECT * FROM monday_columns WHERE board_id = ? ORDER BY position').all(id) as Array<{ options: string } & Record<string, unknown>>
  const items = db.prepare('SELECT * FROM monday_items WHERE board_id = ? ORDER BY position').all(id) as Array<{ data: string } & Record<string, unknown>>

  return NextResponse.json({
    board,
    groups,
    columns: columns.map(c => ({ ...c, options: (() => { try { return JSON.parse(c.options) } catch { return [] } })() })),
    items: items.map(it => ({ ...it, data: (() => { try { return JSON.parse(it.data as string) } catch { return {} } })() })),
  })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const body = await req.json()
  if (body.title !== undefined) {
    db.prepare('UPDATE monday_boards SET title = ? WHERE id = ?').run(body.title, id)
  }
  return NextResponse.json(db.prepare('SELECT * FROM monday_boards WHERE id = ?').get(id))
}
