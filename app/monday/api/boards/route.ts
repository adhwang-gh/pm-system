import { NextResponse } from 'next/server'
import { getTurso, toRows } from '@/lib/tursoClient'
import { initMondaySchema, seedForUser, migrateColorsAndCleanup } from '@/lib/mondayDb'
import { randomUUID } from 'crypto'

function getUserId(req: Request): string {
  return req.headers.get('X-Pm-User-Id') ?? 'anonymous'
}

export async function GET(req: Request) {
  await initMondaySchema()
  const userId = getUserId(req)
  await seedForUser(userId)
  await migrateColorsAndCleanup(userId)
  const turso = getTurso()
  const res = await turso.execute({ sql: 'SELECT * FROM monday_boards WHERE user_id = ? ORDER BY created_at ASC', args: [userId] })
  return NextResponse.json(toRows(res.rows))
}

export async function POST(req: Request) {
  await initMondaySchema()
  const userId = getUserId(req)
  const turso = getTurso()
  const body = await req.json()
  const boardId = randomUUID()
  await turso.execute({ sql: 'INSERT INTO monday_boards (id, user_id, title, description) VALUES (?, ?, ?, ?)', args: [boardId, userId, body.title ?? 'New Board', body.description ?? ''] })

  const cols = [
    { id: randomUUID(), title: 'PM', type: 'person', width: 60, options: '[]' },
    { id: randomUUID(), title: 'Overview', type: 'text', width: 220, options: '[]' },
    { id: randomUUID(), title: 'Project status', type: 'status', width: 180, options: JSON.stringify({ values: ['On track', "Haven't started yet", 'At risk', 'Stuck', 'Done'], colors: { 'On track': '#D1FAE5', "Haven't started yet": '#F1F5F9', 'At risk': '#FEF3C7', 'Stuck': '#FEE2E2', 'Done': '#DCFCE7' } }) },
    { id: randomUUID(), title: 'Priority', type: 'status', width: 140, options: JSON.stringify({ values: ['High', 'Medium', 'Low', 'Critical'], colors: { High: '#FEE2E2', Medium: '#FEF3C7', Low: '#DBEAFE', Critical: '#FECACA' } }) },
    { id: randomUUID(), title: 'Phase', type: 'status', width: 140, options: JSON.stringify({ values: ['Upcoming', 'Ongoing', 'Completed', 'Planning'], colors: { Upcoming: '#EDE9FE', Ongoing: '#DBEAFE', Completed: '#DCFCE7', Planning: '#EDE9FE' } }) },
    { id: randomUUID(), title: 'Timeline', type: 'timeline', width: 160, options: '[]' },
  ]
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i]
    await turso.execute({ sql: 'INSERT INTO monday_columns (id, board_id, title, type, options, width, position) VALUES (?, ?, ?, ?, ?, ?, ?)', args: [col.id, boardId, col.title, col.type, col.options, col.width, i] })
  }
  const [pmCol, overviewCol, statusCol, priorityCol, phaseCol, timelineCol] = cols

  const groups = [
    { id: randomUUID(), title: 'Upcoming', color: '#6366F1', position: 0 },
    { id: randomUUID(), title: 'In Progress', color: '#3B82F6', position: 1 },
    { id: randomUUID(), title: 'Completed', color: '#22C55E', position: 2 },
  ]
  for (const g of groups) {
    await turso.execute({ sql: 'INSERT INTO monday_groups (id, board_id, title, color, position) VALUES (?, ?, ?, ?, ?)', args: [g.id, boardId, g.title, g.color, g.position] })
  }

  await turso.execute({
    sql: 'INSERT INTO monday_items (id, board_id, group_id, title, data, position) VALUES (?, ?, ?, ?, ?, ?)',
    args: [randomUUID(), boardId, groups[0].id, 'First item', JSON.stringify({ [pmCol.id]: '', [overviewCol.id]: '', [statusCol.id]: "Haven't started yet", [priorityCol.id]: 'Medium', [phaseCol.id]: 'Upcoming', [timelineCol.id]: '' }), 0],
  })

  const board = (await turso.execute({ sql: 'SELECT * FROM monday_boards WHERE id = ?', args: [boardId] })).rows[0]
  return NextResponse.json(Object.fromEntries(Object.entries(board)), { status: 201 })
}
