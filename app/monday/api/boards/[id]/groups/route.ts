import { NextResponse } from 'next/server'
import { getTurso } from '@/lib/tursoClient'
import { randomUUID } from 'crypto'

const GROUP_COLORS = ['#52504C', '#9C7C32', '#C9A24B', '#B0221B', '#8A8478']

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const turso = getTurso()
  const body = await req.json()
  const gid = randomUUID()
  const maxPosRes = await turso.execute({ sql: 'SELECT MAX(position) as m FROM monday_groups WHERE board_id = ?', args: [id] })
  const maxPos = Number(maxPosRes.rows[0]?.m ?? -1)
  const colorIdx = (maxPos + 1) % GROUP_COLORS.length
  await turso.execute({ sql: 'INSERT INTO monday_groups (id, board_id, title, color, position) VALUES (?, ?, ?, ?, ?)', args: [gid, id, body.title ?? 'New Group', body.color ?? GROUP_COLORS[colorIdx], maxPos + 1] })
  const group = (await turso.execute({ sql: 'SELECT * FROM monday_groups WHERE id = ?', args: [gid] })).rows[0]
  return NextResponse.json(Object.fromEntries(Object.entries(group)), { status: 201 })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await params
  const turso = getTurso()
  const body = await req.json()
  const { groupId, title, collapsed } = body
  if (title !== undefined) await turso.execute({ sql: 'UPDATE monday_groups SET title = ? WHERE id = ?', args: [title, groupId] })
  if (collapsed !== undefined) await turso.execute({ sql: 'UPDATE monday_groups SET collapsed = ? WHERE id = ?', args: [collapsed ? 1 : 0, groupId] })
  const group = (await turso.execute({ sql: 'SELECT * FROM monday_groups WHERE id = ?', args: [groupId] })).rows[0]
  return NextResponse.json(Object.fromEntries(Object.entries(group)))
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await params
  const turso = getTurso()
  const { groupId } = await req.json()
  await turso.execute({ sql: 'DELETE FROM monday_items WHERE group_id = ?', args: [groupId] })
  await turso.execute({ sql: 'DELETE FROM monday_groups WHERE id = ?', args: [groupId] })
  return NextResponse.json({ ok: true })
}
