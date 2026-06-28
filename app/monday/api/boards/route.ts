import { NextResponse } from 'next/server'
import { getTurso, toRows } from '@/lib/tursoClient'
import { initMondaySchema } from '@/lib/mondayDb'
import { randomUUID } from 'crypto'

export async function GET() {
  await initMondaySchema()
  const turso = getTurso()
  const res = await turso.execute('SELECT * FROM monday_boards ORDER BY created_at ASC')
  return NextResponse.json(toRows(res.rows))
}

export async function POST(req: Request) {
  await initMondaySchema()
  const turso = getTurso()
  const body = await req.json()
  const boardId = randomUUID()
  await turso.execute({ sql: 'INSERT INTO monday_boards (id, title, description) VALUES (?, ?, ?)', args: [boardId, body.title ?? 'New Board', body.description ?? ''] })

  const cols = [
    { id: randomUUID(), title: 'PM', type: 'person', width: 60, options: '[]' },
    { id: randomUUID(), title: 'Overview', type: 'text', width: 220, options: '[]' },
    { id: randomUUID(), title: 'Project status', type: 'status', width: 180, options: JSON.stringify({ values: ['On track', "Haven't started yet", 'At risk', 'Stuck', 'Done'], colors: { 'On track': '#C9A24B', "Haven't started yet": '#52504C', 'At risk': '#9C7C32', 'Stuck': '#B0221B', 'Done': '#C9A24B' } }) },
    { id: randomUUID(), title: 'Priority', type: 'status', width: 140, options: JSON.stringify({ values: ['High', 'Medium', 'Low', 'Critical'], colors: { High: '#C9A24B', Medium: '#9C7C32', Low: '#52504C', Critical: '#B0221B' } }) },
    { id: randomUUID(), title: 'Phase', type: 'status', width: 140, options: JSON.stringify({ values: ['Upcoming', 'Ongoing', 'Completed', 'Planning'], colors: { Upcoming: '#52504C', Ongoing: '#9C7C32', Completed: '#C9A24B', Planning: '#8A8478' } }) },
    { id: randomUUID(), title: 'Timeline', type: 'timeline', width: 160, options: '[]' },
  ]
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i]
    await turso.execute({ sql: 'INSERT INTO monday_columns (id, board_id, title, type, options, width, position) VALUES (?, ?, ?, ?, ?, ?, ?)', args: [col.id, boardId, col.title, col.type, col.options, col.width, i] })
  }
  const [pmCol, overviewCol, statusCol, priorityCol, phaseCol, timelineCol] = cols

  const groups = [
    { id: randomUUID(), title: 'Upcoming', color: '#52504C', position: 0 },
    { id: randomUUID(), title: 'In Progress', color: '#9C7C32', position: 1 },
    { id: randomUUID(), title: 'Completed', color: '#C9A24B', position: 2 },
  ]
  for (const g of groups) {
    await turso.execute({ sql: 'INSERT INTO monday_groups (id, board_id, title, color, position) VALUES (?, ?, ?, ?, ?)', args: [g.id, boardId, g.title, g.color, g.position] })
  }

  const sampleItems = [
    { group: 0, title: 'Project kickoff', pm: 'AH', overview: 'Initial planning and stakeholder alignment.', status: "Haven't started yet", priority: 'High', phase: 'Upcoming' },
    { group: 1, title: 'Research & discovery', pm: 'CPO', overview: 'User research and competitive analysis phase.', status: 'On track', priority: 'Medium', phase: 'Ongoing' },
  ]
  for (let i = 0; i < sampleItems.length; i++) {
    const item = sampleItems[i]
    const g = groups[item.group]
    await turso.execute({
      sql: 'INSERT INTO monday_items (id, board_id, group_id, title, data, position) VALUES (?, ?, ?, ?, ?, ?)',
      args: [randomUUID(), boardId, g.id, item.title, JSON.stringify({ [pmCol.id]: item.pm, [overviewCol.id]: item.overview, [statusCol.id]: item.status, [priorityCol.id]: item.priority, [phaseCol.id]: item.phase, [timelineCol.id]: '' }), i],
    })
  }

  const board = (await turso.execute({ sql: 'SELECT * FROM monday_boards WHERE id = ?', args: [boardId] })).rows[0]
  return NextResponse.json(Object.fromEntries(Object.entries(board)), { status: 201 })
}
