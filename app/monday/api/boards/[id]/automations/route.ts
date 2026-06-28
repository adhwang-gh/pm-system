import { NextResponse } from 'next/server'
import { getTurso, toRows } from '@/lib/tursoClient'
import { initMondaySchema } from '@/lib/mondayDb'
import { randomUUID } from 'crypto'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await initMondaySchema()
  const { id } = await params
  const turso = getTurso()
  const res = await turso.execute({ sql: 'SELECT * FROM monday_automations WHERE board_id = ? ORDER BY created_at ASC', args: [id] })
  return NextResponse.json(toRows(res.rows).map(r => ({ ...r, trigger_config: JSON.parse(r.trigger_config as string), action_config: JSON.parse(r.action_config as string) })))
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await initMondaySchema()
  const { id } = await params
  const turso = getTurso()
  const body = await req.json()
  const { name, trigger_type, trigger_config = {}, action_type, action_config = {} } = body
  const automId = randomUUID()
  await turso.execute({ sql: 'INSERT INTO monday_automations (id, board_id, name, trigger_type, trigger_config, action_type, action_config) VALUES (?, ?, ?, ?, ?, ?, ?)', args: [automId, id, name, trigger_type, JSON.stringify(trigger_config), action_type, JSON.stringify(action_config)] })
  const row = (await turso.execute({ sql: 'SELECT * FROM monday_automations WHERE id = ?', args: [automId] })).rows[0]
  return NextResponse.json({ ...Object.fromEntries(Object.entries(row)), trigger_config: JSON.parse(row.trigger_config as string), action_config: JSON.parse(row.action_config as string) }, { status: 201 })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await params
  const turso = getTurso()
  const body = await req.json()
  const { automId, active } = body
  if (active !== undefined) await turso.execute({ sql: 'UPDATE monday_automations SET active = ? WHERE id = ?', args: [active ? 1 : 0, automId] })
  const row = (await turso.execute({ sql: 'SELECT * FROM monday_automations WHERE id = ?', args: [automId] })).rows[0]
  return NextResponse.json({ ...Object.fromEntries(Object.entries(row)), trigger_config: JSON.parse(row.trigger_config as string), action_config: JSON.parse(row.action_config as string) })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await params
  const turso = getTurso()
  const { automId } = await req.json()
  await turso.execute({ sql: 'DELETE FROM monday_automations WHERE id = ?', args: [automId] })
  return NextResponse.json({ ok: true })
}
