import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { initMondaySchema } from '@/lib/mondayDb'
import { randomUUID } from 'crypto'

const INTEGRATION_TYPES = ['slack', 'zapier', 'gcal', 'github', 'figma', 'gmail']

function ensureDefaults(db: ReturnType<typeof getDb>, boardId: string) {
  INTEGRATION_TYPES.forEach(type => {
    const existing = db.prepare('SELECT id FROM monday_integrations WHERE board_id = ? AND type = ?').get(boardId, type)
    if (!existing) {
      db.prepare('INSERT INTO monday_integrations (id, board_id, type, connected, config) VALUES (?, ?, ?, 0, ?)').run(randomUUID(), boardId, type, '{}')
    }
  })
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  initMondaySchema()
  const { id } = await params
  const db = getDb()
  ensureDefaults(db, id)
  const rows = db.prepare('SELECT * FROM monday_integrations WHERE board_id = ?').all(id)
  return NextResponse.json((rows as Record<string, unknown>[]).map((r) => ({ ...r, config: JSON.parse(r.config as string) })))
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  initMondaySchema()
  const { id } = await params
  const db = getDb()
  const body = await req.json()
  const { integrationId, connected, config } = body

  if (connected !== undefined) db.prepare("UPDATE monday_integrations SET connected = ?, updated_at = datetime('now') WHERE id = ?").run(connected ? 1 : 0, integrationId)
  if (config !== undefined) db.prepare("UPDATE monday_integrations SET config = ?, updated_at = datetime('now') WHERE id = ?").run(JSON.stringify(config), integrationId)

  const row = db.prepare('SELECT * FROM monday_integrations WHERE id = ?').get(integrationId) as Record<string, unknown>
  return NextResponse.json({ ...row, config: JSON.parse(row.config as string) })
}
