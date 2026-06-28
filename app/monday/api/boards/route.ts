import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { initMondaySchema } from '@/lib/mondayDb'
import { randomUUID } from 'crypto'

export function GET() {
  initMondaySchema()
  const db = getDb()
  const boards = db.prepare('SELECT * FROM monday_boards ORDER BY created_at ASC').all()
  return NextResponse.json(boards)
}

export async function POST(req: Request) {
  initMondaySchema()
  const db = getDb()
  const body = await req.json()
  const boardId = randomUUID()
  db.prepare('INSERT INTO monday_boards (id, title, description) VALUES (?, ?, ?)').run(boardId, body.title ?? 'New Board', body.description ?? '')

  // Same rich columns as the seed board
  const cols = [
    { id: randomUUID(), title: 'PM', type: 'person', width: 60, options: '[]' },
    { id: randomUUID(), title: 'Overview', type: 'text', width: 220, options: '[]' },
    { id: randomUUID(), title: 'Project status', type: 'status', width: 180, options: JSON.stringify({ values: ['On track', "Haven't started yet", 'At risk', 'Stuck', 'Done'], colors: { 'On track': '#00C875', "Haven't started yet": '#C4C4C4', 'At risk': '#FDAB3D', 'Stuck': '#E2445C', 'Done': '#00C875' } }) },
    { id: randomUUID(), title: 'Priority', type: 'status', width: 140, options: JSON.stringify({ values: ['High', 'Medium', 'Low', 'Critical'], colors: { High: '#401694', Medium: '#5559DF', Low: '#579BFC', Critical: '#E2445C' } }) },
    { id: randomUUID(), title: 'Phase', type: 'status', width: 140, options: JSON.stringify({ values: ['Upcoming', 'Ongoing', 'Completed', 'Planning'], colors: { Upcoming: '#FF158A', Ongoing: '#FDAB3D', Completed: '#00C875', Planning: '#9D99B9' } }) },
    { id: randomUUID(), title: 'Timeline', type: 'timeline', width: 160, options: '[]' },
  ]
  cols.forEach((col, i) => {
    db.prepare('INSERT INTO monday_columns (id, board_id, title, type, options, width, position) VALUES (?, ?, ?, ?, ?, ?, ?)').run(col.id, boardId, col.title, col.type, col.options, col.width, i)
  })
  const [pmCol, overviewCol, statusCol, priorityCol, phaseCol, timelineCol] = cols

  // Three starter groups
  const groups = [
    { id: randomUUID(), title: 'Upcoming', color: '#0073EA', position: 0 },
    { id: randomUUID(), title: 'In Progress', color: '#FDAB3D', position: 1 },
    { id: randomUUID(), title: 'Completed', color: '#00C875', position: 2 },
  ]
  groups.forEach(g => {
    db.prepare('INSERT INTO monday_groups (id, board_id, title, color, position) VALUES (?, ?, ?, ?, ?)').run(g.id, boardId, g.title, g.color, g.position)
  })

  // Two sample items so the board doesn't look empty
  const sampleItems = [
    { group: 0, title: 'Project kickoff', pm: 'AH', overview: 'Initial planning and stakeholder alignment.', status: "Haven't started yet", priority: 'High', phase: 'Upcoming', start: '', end: '' },
    { group: 1, title: 'Research & discovery', pm: 'CPO', overview: 'User research and competitive analysis phase.', status: 'On track', priority: 'Medium', phase: 'Ongoing', start: '', end: '' },
  ]
  sampleItems.forEach((item, i) => {
    const g = groups[item.group]
    db.prepare('INSERT INTO monday_items (id, board_id, group_id, title, data, position) VALUES (?, ?, ?, ?, ?, ?)').run(
      randomUUID(), boardId, g.id, item.title,
      JSON.stringify({
        [pmCol.id]: item.pm,
        [overviewCol.id]: item.overview,
        [statusCol.id]: item.status,
        [priorityCol.id]: item.priority,
        [phaseCol.id]: item.phase,
        [timelineCol.id]: item.start && item.end ? `${item.start}|${item.end}` : '',
      }),
      i,
    )
  })

  const board = db.prepare('SELECT * FROM monday_boards WHERE id = ?').get(boardId)
  return NextResponse.json(board, { status: 201 })
}
