import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { initMondaySchema } from '@/lib/mondayDb'
import { randomUUID } from 'crypto'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  initMondaySchema()
  const { id } = await params
  const db = getDb()
  const rows = db.prepare('SELECT * FROM monday_automations WHERE board_id = ? ORDER BY created_at ASC').all(id)
  return NextResponse.json((rows as Record<string, unknown>[]).map((r) => ({
    ...r,
    trigger_config: JSON.parse(r.trigger_config as string),
    action_config: JSON.parse(r.action_config as string),
  })))
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  initMondaySchema()
  const { id } = await params
  const db = getDb()
  const body = await req.json()
  const { name, trigger_type, trigger_config = {}, action_type, action_config = {} } = body
  const automId = randomUUID()
  db.prepare('INSERT INTO monday_automations (id, board_id, name, trigger_type, trigger_config, action_type, action_config) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    automId, id, name, trigger_type, JSON.stringify(trigger_config), action_type, JSON.stringify(action_config)
  )
  const row = db.prepare('SELECT * FROM monday_automations WHERE id = ?').get(automId) as Record<string, unknown>
  return NextResponse.json({ ...row, trigger_config: JSON.parse(row.trigger_config as string), action_config: JSON.parse(row.action_config as string) }, { status: 201 })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await params
  const db = getDb()
  const body = await req.json()
  const { automId, active } = body
  if (active !== undefined) db.prepare('UPDATE monday_automations SET active = ? WHERE id = ?').run(active ? 1 : 0, automId)
  const row = db.prepare('SELECT * FROM monday_automations WHERE id = ?').get(automId) as Record<string, unknown>
  return NextResponse.json({ ...row, trigger_config: JSON.parse(row.trigger_config as string), action_config: JSON.parse(row.action_config as string) })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await params
  const db = getDb()
  const { automId } = await req.json()
  db.prepare('DELETE FROM monday_automations WHERE id = ?').run(automId)
  return NextResponse.json({ ok: true })
}
