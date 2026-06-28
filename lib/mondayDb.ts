import { getTurso } from './tursoClient'
import { randomUUID } from 'crypto'

let _initialized = false

export async function initMondaySchema() {
  if (_initialized) return
  const turso = getTurso()
  await turso.batch([
    { sql: `CREATE TABLE IF NOT EXISTS monday_boards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Untitled Board',
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS monday_groups (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      title TEXT NOT NULL,
      color TEXT DEFAULT '#52504C',
      position INTEGER DEFAULT 0,
      collapsed INTEGER DEFAULT 0
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS monday_columns (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text',
      options TEXT DEFAULT '[]',
      width INTEGER DEFAULT 160,
      position INTEGER DEFAULT 0
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS monday_items (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      data TEXT DEFAULT '{}',
      position INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS monday_integrations (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      type TEXT NOT NULL,
      connected INTEGER DEFAULT 0,
      config TEXT DEFAULT '{}',
      updated_at TEXT DEFAULT (datetime('now'))
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS monday_automations (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      name TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      trigger_config TEXT DEFAULT '{}',
      action_type TEXT NOT NULL,
      action_config TEXT DEFAULT '{}',
      active INTEGER DEFAULT 1,
      run_count INTEGER DEFAULT 0,
      last_run TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS pm_teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      lead_key TEXT NOT NULL,
      position INTEGER DEFAULT 0
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS pm_team_members (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      member_key TEXT NOT NULL,
      position INTEGER DEFAULT 0
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS weekly_updates (
      id TEXT PRIMARY KEY,
      member_key TEXT NOT NULL,
      week_of TEXT NOT NULL,
      progress TEXT DEFAULT '',
      plan TEXT DEFAULT '',
      problems TEXT DEFAULT '',
      products TEXT DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(member_key, week_of)
    )`, args: [] },
  ], 'write')
  _initialized = true
  await seedTeamsIfEmpty(turso)
  await seedMondayIfEmpty(turso)
}

async function seedTeamsIfEmpty(turso: ReturnType<typeof getTurso>) {
  const res = await turso.execute('SELECT COUNT(*) as c FROM pm_teams')
  const count = Number(res.rows[0]?.c ?? 0)
  if (count > 0) return

  const teams = [
    { name: "Shawn's Team", lead_key: 'CEO', members: ['CEO', 'AH', 'MKT'], position: 0 },
    { name: "Aryan's Team", lead_key: 'CTO', members: ['CTO', 'ENG1', 'ENG2'], position: 1 },
    { name: "Ian's Team",   lead_key: 'CPO', members: ['CPO', 'DES'], position: 2 },
  ]

  for (const t of teams) {
    const teamId = randomUUID()
    await turso.execute({ sql: 'INSERT INTO pm_teams (id, name, lead_key, position) VALUES (?, ?, ?, ?)', args: [teamId, t.name, t.lead_key, t.position] })
    for (let i = 0; i < t.members.length; i++) {
      await turso.execute({ sql: 'INSERT INTO pm_team_members (id, team_id, member_key, position) VALUES (?, ?, ?, ?)', args: [randomUUID(), teamId, t.members[i], i] })
    }
  }
}

async function seedMondayIfEmpty(turso: ReturnType<typeof getTurso>) {
  const res = await turso.execute('SELECT COUNT(*) as c FROM monday_boards')
  const count = Number(res.rows[0]?.c ?? 0)
  if (count > 0) return

  const boardId = randomUUID()
  await turso.execute({ sql: 'INSERT INTO monday_boards (id, title, description) VALUES (?, ?, ?)', args: [boardId, 'High-level projects overview', 'Track all major projects across the organization'] })

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
    { id: randomUUID(), title: 'Upcoming projects', color: '#52504C', position: 0 },
    { id: randomUUID(), title: 'Ongoing projects', color: '#9C7C32', position: 1 },
    { id: randomUUID(), title: 'Completed projects', color: '#C9A24B', position: 2 },
  ]
  for (const g of groups) {
    await turso.execute({ sql: 'INSERT INTO monday_groups (id, board_id, title, color, position) VALUES (?, ?, ?, ?, ?)', args: [g.id, boardId, g.title, g.color, g.position] })
  }

  const items = [
    { group: 0, title: 'Website Revamp for Q3 Campaign', pm: 'AH', overview: 'The current company website needs a full redesign for the Q3 marketing push.', status: "Haven't started yet", priority: 'Medium', phase: 'Upcoming', start: '2025-07-01', end: '2025-09-15' },
    { group: 0, title: 'Cloud Infrastructure Migration', pm: 'CTO', overview: 'This project proposes a complete cloud migration of our on-prem servers.', status: "Haven't started yet", priority: 'Low', phase: 'Upcoming', start: '2025-05-29', end: '2025-12-01' },
    { group: 1, title: 'Sustainability Initiative Kickoff', pm: 'CPO', overview: 'This project proposes the company-wide sustainability roadmap.', status: 'On track', priority: 'Medium', phase: 'Ongoing', start: '2025-05-20', end: '2025-08-31' },
    { group: 1, title: 'Mobile App Redesign', pm: 'CTO', overview: 'Full redesign of the mobile app UX based on user research findings.', status: 'At risk', priority: 'High', phase: 'Ongoing', start: '2025-06-01', end: '2025-09-01' },
    { group: 2, title: 'AI-Powered Customer Support Bot', pm: 'AH', overview: 'With growing customer support load, this bot handles Tier-1 queries automatically.', status: 'On track', priority: 'High', phase: 'Completed', start: '2025-06-01', end: '2025-06-30' },
    { group: 2, title: 'Q1 Financial Audit', pm: 'CEO', overview: 'Annual financial audit completed ahead of schedule.', status: 'On track', priority: 'Medium', phase: 'Completed', start: '2025-01-15', end: '2025-03-31' },
  ]

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const g = groups[item.group]
    await turso.execute({
      sql: 'INSERT INTO monday_items (id, board_id, group_id, title, data, position) VALUES (?, ?, ?, ?, ?, ?)',
      args: [randomUUID(), boardId, g.id, item.title, JSON.stringify({
        [pmCol.id]: item.pm,
        [overviewCol.id]: item.overview,
        [statusCol.id]: item.status,
        [priorityCol.id]: item.priority,
        [phaseCol.id]: item.phase,
        [timelineCol.id]: `${item.start}|${item.end}`,
      }), i],
    })
  }
}
