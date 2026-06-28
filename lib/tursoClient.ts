import { createClient, type Client } from '@libsql/client'

let _client: Client | null = null

export function getTurso(): Client {
  if (_client) return _client
  _client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  return _client
}

// Convert libsql Row objects to plain JS objects for safe JSON serialization
export function toRows(rows: ArrayLike<Record<string, unknown>>): Record<string, unknown>[] {
  return Array.from(rows).map(row => Object.fromEntries(Object.entries(row)))
}

let _notionInitialized = false

export async function initNotionSchema() {
  if (_notionInitialized) return
  const turso = getTurso()
  await turso.batch([
    { sql: `CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Untitled',
      content TEXT DEFAULT '{}',
      parent_id TEXT,
      icon TEXT DEFAULT '📄',
      is_database INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS db_columns (
      id TEXT PRIMARY KEY,
      page_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      options TEXT DEFAULT '[]',
      position INTEGER DEFAULT 0
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS db_rows (
      id TEXT PRIMARY KEY,
      page_id TEXT NOT NULL,
      data TEXT DEFAULT '{}',
      position INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`, args: [] },
  ], 'write')
  _notionInitialized = true
  await seedNotionIfEmpty(turso)
}

async function seedNotionIfEmpty(turso: Client) {
  const res = await turso.execute('SELECT COUNT(*) as c FROM pages')
  const count = Number(res.rows[0]?.c ?? 0)
  if (count > 0) return

  const { randomUUID } = await import('crypto')

  const gettingStartedId = randomUUID()
  await turso.execute({
    sql: `INSERT INTO pages (id, title, content, icon, is_database) VALUES (?, ?, ?, ?, 0)`,
    args: [gettingStartedId, 'Getting Started', JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Welcome 👋' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Use the sidebar to navigate pages and databases.' }] },
      ]
    }), '👋'],
  })

  const dbPageId = randomUUID()
  await turso.execute({ sql: `INSERT INTO pages (id, title, icon, is_database) VALUES (?, ?, ?, 1)`, args: [dbPageId, 'PH Marketing', '⭐'] })

  const colDefs = [
    { name: 'Task', type: 'text', options: '[]', pos: 0 },
    { name: 'Status', type: 'select', options: JSON.stringify(['Research', 'Content brief', 'Production', 'Review', 'Published']), pos: 1 },
    { name: 'Priority', type: 'select', options: JSON.stringify(['Low', 'Medium', 'High', 'Urgent']), pos: 2 },
    { name: 'Assignees', type: 'text', options: '[]', pos: 3 },
    { name: 'Due Date', type: 'date', options: '[]', pos: 4 },
    { name: 'Progress', type: 'number', options: '[]', pos: 5 },
  ]
  const colIds: string[] = []
  for (const col of colDefs) {
    const cid = randomUUID()
    colIds.push(cid)
    await turso.execute({ sql: 'INSERT INTO db_columns (id, page_id, name, type, options, position) VALUES (?, ?, ?, ?, ?, ?)', args: [cid, dbPageId, col.name, col.type, col.options, col.pos] })
  }
  const [taskId, statusId, priorityId, assigneesId, dueId, progressId] = colIds

  const rows = [
    { task: 'Website Revamp for Q3', status: 'Research', priority: 'High', assignees: 'AH', due: '2026-07-15', progress: 10 },
    { task: 'Blog post: Top PM tools', status: 'Content brief', priority: 'Medium', assignees: 'MKT', due: '2026-07-20', progress: 30 },
    { task: 'Social media campaign', status: 'Production', priority: 'Urgent', assignees: 'AH', due: '2026-07-10', progress: 60 },
    { task: 'Email newsletter', status: 'Review', priority: 'High', assignees: 'MKT', due: '2026-07-08', progress: 80 },
    { task: 'SEO audit', status: 'Published', priority: 'Low', assignees: 'AH', due: '2026-06-30', progress: 100 },
  ]
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    await turso.execute({
      sql: 'INSERT INTO db_rows (id, page_id, data, position) VALUES (?, ?, ?, ?)',
      args: [randomUUID(), dbPageId, JSON.stringify({ [taskId]: r.task, [statusId]: r.status, [priorityId]: r.priority, [assigneesId]: r.assignees, [dueId]: r.due, [progressId]: r.progress }), i],
    })
  }
}
