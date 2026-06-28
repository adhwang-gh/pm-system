import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { randomUUID } from 'crypto'

type DbRow = Record<string, unknown>

async function fireWebhooks(boardId: string, eventType: string, payload: Record<string, unknown>) {
  const db = getDb()
  const webhookTypes = ['slack', 'zapier']
  webhookTypes.forEach(type => {
    const integration = db.prepare("SELECT * FROM monday_integrations WHERE board_id = ? AND type = ? AND connected = 1").get(boardId, type) as DbRow | undefined
    if (!integration) return
    const config = JSON.parse(integration.config as string) as { webhook_url?: string }
    if (!config.webhook_url) return
    // Fire and forget — don't await so it doesn't block the response
    fetch(config.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'PM System', board_id: boardId, event: eventType, ...payload }),
    }).catch(() => {}) // ignore errors (user may have stale URL)
  })
}

function applyAutomations(boardId: string, itemId: string, oldData: Record<string, unknown>, newData: Record<string, unknown>, title: string): Record<string, unknown> {
  const db = getDb()
  const automations = db.prepare("SELECT * FROM monday_automations WHERE board_id = ? AND active = 1").all(boardId) as DbRow[]
  let merged = { ...newData }

  automations.forEach(auto => {
    const tc = JSON.parse(auto.trigger_config as string) as { col_id?: string; value?: string }
    const ac = JSON.parse(auto.action_config as string) as { col_id?: string; value?: string; member_key?: string }

    if (auto.trigger_type === 'status_change' && tc.col_id && tc.value) {
      const oldVal = String(oldData[tc.col_id] ?? '')
      const newVal = String(merged[tc.col_id] ?? '')
      if (oldVal !== tc.value && newVal === tc.value) {
        // Trigger fired — apply action
        if (auto.action_type === 'set_field' && ac.col_id && ac.value !== undefined) {
          merged[ac.col_id] = ac.value
        }
        if (auto.action_type === 'assign_pm' && ac.col_id && ac.member_key) {
          merged[ac.col_id] = ac.member_key
        }
        // Update run count
        db.prepare("UPDATE monday_automations SET run_count = run_count + 1, last_run = datetime('now') WHERE id = ?").run(auto.id)
      }
    }
  })

  return merged
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const body = await req.json()
  const { group_id, title = '', data = {} } = body

  // Apply item_created automations
  const automations = db.prepare("SELECT * FROM monday_automations WHERE board_id = ? AND active = 1 AND trigger_type = 'item_created'").all(id) as DbRow[]
  let finalData = { ...data }
  automations.forEach(auto => {
    const ac = JSON.parse(auto.action_config as string) as { col_id?: string; value?: string; member_key?: string }
    if (auto.action_type === 'assign_pm' && ac.col_id && ac.member_key) {
      finalData[ac.col_id] = ac.member_key
    }
    if (auto.action_type === 'set_field' && ac.col_id && ac.value !== undefined) {
      finalData[ac.col_id] = ac.value
    }
    db.prepare("UPDATE monday_automations SET run_count = run_count + 1, last_run = datetime('now') WHERE id = ?").run(auto.id)
  })

  const itemId = randomUUID()
  const maxPos = (db.prepare('SELECT MAX(position) as m FROM monday_items WHERE board_id = ? AND group_id = ?').get(id, group_id) as { m: number | null }).m ?? -1
  db.prepare('INSERT INTO monday_items (id, board_id, group_id, title, data, position) VALUES (?, ?, ?, ?, ?, ?)').run(itemId, id, group_id, title, JSON.stringify(finalData), maxPos + 1)
  const item = db.prepare('SELECT * FROM monday_items WHERE id = ?').get(itemId) as DbRow
  await fireWebhooks(id, 'item_created', { item_title: title, group_id })
  return NextResponse.json({ ...item, data: JSON.parse(item.data as string) }, { status: 201 })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = await params
  const db = getDb()
  const body = await req.json()
  const { itemId, title, data } = body

  if (title !== undefined) db.prepare('UPDATE monday_items SET title = ? WHERE id = ?').run(title, itemId)

  if (data !== undefined) {
    const existing = db.prepare('SELECT data, title FROM monday_items WHERE id = ?').get(itemId) as { data: string; title: string } | undefined
    if (existing) {
      const oldData = JSON.parse(existing.data)
      const merged = { ...oldData, ...data }
      // Apply automations (may mutate merged)
      const afterAuto = applyAutomations(boardId, itemId, oldData, merged, existing.title)
      db.prepare('UPDATE monday_items SET data = ? WHERE id = ?').run(JSON.stringify(afterAuto), itemId)
      // Fire webhooks for status changes
      const changedKeys = Object.keys(data).filter(k => oldData[k] !== data[k])
      if (changedKeys.length > 0) {
        await fireWebhooks(boardId, 'item_updated', { item_id: itemId, changed_fields: changedKeys })
      }
    }
  }

  const item = db.prepare('SELECT * FROM monday_items WHERE id = ?').get(itemId) as DbRow
  return NextResponse.json({ ...item, data: JSON.parse(item.data as string) })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = await params
  const db = getDb()
  const body = await req.json()
  const { itemId } = body
  const item = db.prepare('SELECT title FROM monday_items WHERE id = ?').get(itemId) as { title: string } | undefined
  db.prepare('DELETE FROM monday_items WHERE id = ?').run(itemId)
  await fireWebhooks(boardId, 'item_deleted', { item_title: item?.title ?? '' })
  return NextResponse.json({ ok: true })
}
