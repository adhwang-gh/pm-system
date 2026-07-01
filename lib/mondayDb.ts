import { getTurso } from './tursoClient'
import { randomUUID } from 'crypto'

let _initialized = false

export async function initMondaySchema() {
  if (_initialized) return
  const turso = getTurso()
  await turso.batch([
    { sql: `CREATE TABLE IF NOT EXISTS monday_boards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'legacy',
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
    { sql: `CREATE TABLE IF NOT EXISTS pm_members (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'legacy',
      name TEXT NOT NULL,
      initials TEXT NOT NULL,
      color TEXT DEFAULT '#8A8478',
      created_at TEXT DEFAULT (datetime('now'))
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS pm_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS pm_invites (
      id TEXT PRIMARY KEY,
      label TEXT DEFAULT '',
      used INTEGER DEFAULT 0,
      used_by_email TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`, args: [] },
  ], 'write')

  // Migrations: add user_id if tables existed without it
  try { await turso.execute("ALTER TABLE monday_boards ADD COLUMN user_id TEXT NOT NULL DEFAULT 'legacy'") } catch {}
  try { await turso.execute("ALTER TABLE pm_members ADD COLUMN user_id TEXT NOT NULL DEFAULT 'legacy'") } catch {}

  _initialized = true
}

const STATUS_COLORS: Record<string, string> = {
  'Done': '#DCFCE7',
  'On track': '#D1FAE5',
  "Haven't started yet": '#F1F5F9',
  'At risk': '#FEF3C7',
  'Stuck': '#FEE2E2',
  'High': '#FEE2E2',
  'Medium': '#FEF3C7',
  'Low': '#DBEAFE',
  'Critical': '#FECACA',
  'Upcoming': '#EDE9FE',
  'Ongoing': '#DBEAFE',
  'Completed': '#DCFCE7',
  'Planning': '#EDE9FE',
}

export async function migrateColorsAndCleanup(userId: string) {
  const turso = getTurso()

  // Delete ghost "New project" rows that were auto-created by the old button
  await turso.execute({ sql: "DELETE FROM monday_items WHERE title = 'New project' AND (data = '{}' OR data = '')", args: [] })

  // Ensure user exists in pm_members (handles users who registered before the fix)
  const userRes = await turso.execute({ sql: 'SELECT * FROM pm_users WHERE user_id = ?', args: [userId] })
  const user = userRes.rows[0]
  if (user) {
    const name = String(user.name)
    const initials = name.trim().split(/\s+/).map((w: string) => w[0]?.toUpperCase() ?? '').join('').slice(0, 2) || '?'
    await turso.execute({
      sql: 'INSERT OR IGNORE INTO pm_members (id, user_id, name, initials, color) VALUES (?, ?, ?, ?, ?)',
      args: [userId, userId, name, initials, '#3D5A80'],
    })
  }

  // Update status column colors for all boards belonging to this user
  const boardsRes = await turso.execute({ sql: 'SELECT id FROM monday_boards WHERE user_id = ?', args: [userId] })
  for (const board of boardsRes.rows) {
    const colsRes = await turso.execute({ sql: "SELECT * FROM monday_columns WHERE board_id = ? AND type = 'status'", args: [board.id] })
    for (const col of colsRes.rows) {
      try {
        const opts = JSON.parse(String(col.options ?? '{}')) as { values?: string[]; colors?: Record<string, string> }
        const values = opts.values ?? []
        const newColors: Record<string, string> = {}
        for (const v of values) newColors[v] = STATUS_COLORS[v] ?? opts.colors?.[v] ?? '#94A3B8'
        await turso.execute({ sql: 'UPDATE monday_columns SET options = ? WHERE id = ?', args: [JSON.stringify({ ...opts, colors: newColors }), col.id] })
      } catch {}
    }
    // Update group colors to match new scheme
    const groupsRes = await turso.execute({ sql: 'SELECT * FROM monday_groups WHERE board_id = ?', args: [board.id] })
    for (const g of groupsRes.rows) {
      const title = String(g.title ?? '').toLowerCase()
      let color = String(g.color ?? '')
      if (['#52504c', '#9c7c32', '#c9a24b', '#8a8478', '#b0221b'].includes(color.toLowerCase())) {
        if (title.includes('upcom') || title.includes('plan')) color = '#6366F1'
        else if (title.includes('ongo') || title.includes('progress') || title.includes('active')) color = '#3B82F6'
        else if (title.includes('done') || title.includes('complet')) color = '#22C55E'
        else color = '#94A3B8'
        await turso.execute({ sql: 'UPDATE monday_groups SET color = ? WHERE id = ?', args: [color, g.id] })
      }
    }
  }
}

export async function seedForUser(userId: string) {
  const turso = getTurso()
  const res = await turso.execute({ sql: 'SELECT COUNT(*) as c FROM monday_boards WHERE user_id = ?', args: [userId] })
  if (Number(res.rows[0]?.c ?? 0) > 0) return

  const boardId = randomUUID()
  await turso.execute({ sql: 'INSERT INTO monday_boards (id, user_id, title, description) VALUES (?, ?, ?, ?)', args: [boardId, userId, 'Project Overview', 'Track all major projects across your workspace'] })

  const cols = [
    { id: randomUUID(), title: 'PM', type: 'person', width: 60, options: '[]' },
    { id: randomUUID(), title: 'Overview', type: 'text', width: 260, options: '[]' },
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
    { id: randomUUID(), title: 'Upcoming projects', color: '#6366F1', position: 0 },
    { id: randomUUID(), title: 'Ongoing projects', color: '#3B82F6', position: 1 },
    { id: randomUUID(), title: 'Completed projects', color: '#22C55E', position: 2 },
  ]
  for (const g of groups) {
    await turso.execute({ sql: 'INSERT INTO monday_groups (id, board_id, title, color, position) VALUES (?, ?, ?, ?, ?)', args: [g.id, boardId, g.title, g.color, g.position] })
  }

  const items = [
    { group: 0, title: 'Website Revamp', overview: 'Full redesign of the company website.', status: "Haven't started yet", priority: 'Medium', phase: 'Upcoming', start: '2025-07-01', end: '2025-09-15' },
    { group: 0, title: 'Cloud Migration', overview: 'Migrate on-prem servers to the cloud.', status: "Haven't started yet", priority: 'Low', phase: 'Upcoming', start: '2025-05-29', end: '2025-12-01' },
    { group: 1, title: 'Mobile App Redesign', overview: 'Full redesign of the mobile app UX.', status: 'On track', priority: 'High', phase: 'Ongoing', start: '2025-06-01', end: '2025-09-01' },
    { group: 2, title: 'Q1 Financial Audit', overview: 'Annual financial audit completed ahead of schedule.', status: 'Done', priority: 'Medium', phase: 'Completed', start: '2025-01-15', end: '2025-03-31' },
  ]
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const g = groups[item.group]
    await turso.execute({
      sql: 'INSERT INTO monday_items (id, board_id, group_id, title, data, position) VALUES (?, ?, ?, ?, ?, ?)',
      args: [randomUUID(), boardId, g.id, item.title, JSON.stringify({
        [pmCol.id]: '',
        [overviewCol.id]: item.overview,
        [statusCol.id]: item.status,
        [priorityCol.id]: item.priority,
        [phaseCol.id]: item.phase,
        [timelineCol.id]: `${item.start}|${item.end}`,
      }), i],
    })
  }
}

export async function ensureNotificationsTable() {
  const turso = getTurso()
  try {
    await turso.execute(`CREATE TABLE IF NOT EXISTS pm_notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      text TEXT NOT NULL,
      board_title TEXT DEFAULT '',
      item_title TEXT DEFAULT '',
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`)
  } catch {}
}
