import { NextResponse } from 'next/server'
import { getTurso, toRows } from '@/lib/tursoClient'
import { randomUUID } from 'crypto'

async function fireWebhooks(turso: ReturnType<typeof getTurso>, boardId: string, eventType: string, payload: Record<string, unknown>) {
  const webhookTypes = ['slack', 'zapier']
  for (const type of webhookTypes) {
    const res = await turso.execute({ sql: 'SELECT * FROM monday_integrations WHERE board_id = ? AND type = ? AND connected = 1', args: [boardId, type] })
    const integration = res.rows[0]
    if (!integration) continue
    const config = JSON.parse(integration.config as string) as { webhook_url?: string }
    if (!config.webhook_url) continue
    fetch(config.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'PM System', board_id: boardId, event: eventType, ...payload }),
    }).catch(() => {})
  }
}

async function applyAutomations(turso: ReturnType<typeof getTurso>, boardId: string, itemId: string, oldData: Record<string, unknown>, newData: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await turso.execute({ sql: 'SELECT * FROM monday_automations WHERE board_id = ? AND active = 1', args: [boardId] })
  const automations = toRows(res.rows)
  let merged = { ...newData }

  for (const auto of automations) {
    const tc = JSON.parse(auto.trigger_config as string) as { col_id?: string; value?: string }
    const ac = JSON.parse(auto.action_config as string) as { col_id?: string; value?: string; member_key?: string }

    if (auto.trigger_type === 'status_change' && tc.col_id && tc.value) {
      const oldVal = String(oldData[tc.col_id] ?? '')
      const newVal = String(merged[tc.col_id] ?? '')
      if (oldVal !== tc.value && newVal === tc.value) {
        if (auto.action_type === 'set_field' && ac.col_id && ac.value !== undefined) merged[ac.col_id] = ac.value
        if (auto.action_type === 'assign_pm' && ac.col_id && ac.member_key) merged[ac.col_id] = ac.member_key
        await turso.execute({ sql: "UPDATE monday_automations SET run_count = run_count + 1, last_run = datetime('now') WHERE id = ?", args: [auto.id as string] })
      }
    }
  }
  return merged
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const turso = getTurso()
  const body = await req.json()
  const { group_id, title = '', data = {} } = body

  const automRes = await turso.execute({ sql: "SELECT * FROM monday_automations WHERE board_id = ? AND active = 1 AND trigger_type = 'item_created'", args: [id] })
  const automations = toRows(automRes.rows)
  let finalData = { ...data }
  for (const auto of automations) {
    const ac = JSON.parse(auto.action_config as string) as { col_id?: string; value?: string; member_key?: string }
    if (auto.action_type === 'assign_pm' && ac.col_id && ac.member_key) finalData[ac.col_id] = ac.member_key
    if (auto.action_type === 'set_field' && ac.col_id && ac.value !== undefined) finalData[ac.col_id] = ac.value
    await turso.execute({ sql: "UPDATE monday_automations SET run_count = run_count + 1, last_run = datetime('now') WHERE id = ?", args: [auto.id as string] })
  }

  const itemId = randomUUID()
  const maxPosRes = await turso.execute({ sql: 'SELECT MAX(position) as m FROM monday_items WHERE board_id = ? AND group_id = ?', args: [id, group_id] })
  const maxPos = Number(maxPosRes.rows[0]?.m ?? -1)
  await turso.execute({ sql: 'INSERT INTO monday_items (id, board_id, group_id, title, data, position) VALUES (?, ?, ?, ?, ?, ?)', args: [itemId, id, group_id, title, JSON.stringify(finalData), maxPos + 1] })
  const item = (await turso.execute({ sql: 'SELECT * FROM monday_items WHERE id = ?', args: [itemId] })).rows[0]
  await fireWebhooks(turso, id, 'item_created', { item_title: title, group_id })
  return NextResponse.json({ ...Object.fromEntries(Object.entries(item)), data: JSON.parse(item.data as string) }, { status: 201 })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = await params
  const turso = getTurso()
  const body = await req.json()
  const { itemId, title, data } = body

  if (title !== undefined) await turso.execute({ sql: 'UPDATE monday_items SET title = ? WHERE id = ?', args: [title, itemId] })

  if (data !== undefined) {
    const existingRes = await turso.execute({ sql: 'SELECT data, title FROM monday_items WHERE id = ?', args: [itemId] })
    const existing = existingRes.rows[0]
    if (existing) {
      const oldData = JSON.parse(existing.data as string)
      const merged = { ...oldData, ...data }
      const afterAuto = await applyAutomations(turso, boardId, itemId, oldData, merged)
      await turso.execute({ sql: 'UPDATE monday_items SET data = ? WHERE id = ?', args: [JSON.stringify(afterAuto), itemId] })
      const changedKeys = Object.keys(data).filter(k => oldData[k] !== data[k])
      if (changedKeys.length > 0) await fireWebhooks(turso, boardId, 'item_updated', { item_id: itemId, changed_fields: changedKeys })
    }
  }

  const item = (await turso.execute({ sql: 'SELECT * FROM monday_items WHERE id = ?', args: [itemId] })).rows[0]
  return NextResponse.json({ ...Object.fromEntries(Object.entries(item)), data: JSON.parse(item.data as string) })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = await params
  const turso = getTurso()
  const body = await req.json()
  const { itemId } = body
  const itemRes = await turso.execute({ sql: 'SELECT title FROM monday_items WHERE id = ?', args: [itemId] })
  const item = itemRes.rows[0]
  await turso.execute({ sql: 'DELETE FROM monday_items WHERE id = ?', args: [itemId] })
  await fireWebhooks(turso, boardId, 'item_deleted', { item_title: item?.title ?? '' })
  return NextResponse.json({ ok: true })
}
