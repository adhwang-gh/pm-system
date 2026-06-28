import { NextResponse } from 'next/server'
import { getTurso, toRows } from '@/lib/tursoClient'
import { initMondaySchema } from '@/lib/mondayDb'
import { randomUUID } from 'crypto'

const INTEGRATION_TYPES = ['slack', 'zapier', 'gcal', 'github', 'figma', 'gmail']

async function ensureDefaults(turso: ReturnType<typeof getTurso>, boardId: string) {
  for (const type of INTEGRATION_TYPES) {
    const existing = await turso.execute({ sql: 'SELECT id FROM monday_integrations WHERE board_id = ? AND type = ?', args: [boardId, type] })
    if (existing.rows.length === 0) {
      await turso.execute({ sql: 'INSERT INTO monday_integrations (id, board_id, type, connected, config) VALUES (?, ?, ?, 0, ?)', args: [randomUUID(), boardId, type, '{}'] })
    }
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await initMondaySchema()
  const { id } = await params
  const turso = getTurso()
  await ensureDefaults(turso, id)
  const res = await turso.execute({ sql: 'SELECT * FROM monday_integrations WHERE board_id = ?', args: [id] })
  return NextResponse.json(toRows(res.rows).map(r => ({ ...r, config: JSON.parse(r.config as string) })))
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await initMondaySchema()
  await params
  const turso = getTurso()
  const body = await req.json()
  const { integrationId, connected, config } = body
  if (connected !== undefined) await turso.execute({ sql: "UPDATE monday_integrations SET connected = ?, updated_at = datetime('now') WHERE id = ?", args: [connected ? 1 : 0, integrationId] })
  if (config !== undefined) await turso.execute({ sql: "UPDATE monday_integrations SET config = ?, updated_at = datetime('now') WHERE id = ?", args: [JSON.stringify(config), integrationId] })
  const row = (await turso.execute({ sql: 'SELECT * FROM monday_integrations WHERE id = ?', args: [integrationId] })).rows[0]
  return NextResponse.json({ ...Object.fromEntries(Object.entries(row)), config: JSON.parse(row.config as string) })
}
