import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { randomUUID } from 'crypto'

const GROUP_COLORS = ['#0073EA', '#FDAB3D', '#00C875', '#E2445C', '#FF158A', '#9D99B9', '#401694']

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const body = await req.json()
  const gid = randomUUID()
  const maxPos = (db.prepare('SELECT MAX(position) as m FROM monday_groups WHERE board_id = ?').get(id) as { m: number | null }).m ?? -1
  const colorIdx = ((maxPos + 1) % GROUP_COLORS.length)
  db.prepare('INSERT INTO monday_groups (id, board_id, title, color, position) VALUES (?, ?, ?, ?, ?)').run(gid, id, body.title ?? 'New Group', body.color ?? GROUP_COLORS[colorIdx], maxPos + 1)
  return NextResponse.json(db.prepare('SELECT * FROM monday_groups WHERE id = ?').get(gid), { status: 201 })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const body = await req.json()
  // body: { groupId, title?, collapsed? }
  const { groupId, title, collapsed } = body
  if (title !== undefined) db.prepare('UPDATE monday_groups SET title = ? WHERE id = ?').run(title, groupId)
  if (collapsed !== undefined) db.prepare('UPDATE monday_groups SET collapsed = ? WHERE id = ?').run(collapsed ? 1 : 0, groupId)
  return NextResponse.json(db.prepare('SELECT * FROM monday_groups WHERE id = ?').get(groupId))
}
