import Database from 'better-sqlite3'
import path from 'path'
import { randomUUID } from 'crypto'

const DB_PATH = path.join(process.cwd(), 'notion.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  initSchema(_db)
  seedIfEmpty(_db)
  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Untitled',
      content TEXT DEFAULT '{}',
      parent_id TEXT,
      icon TEXT DEFAULT '📄',
      is_database INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS db_columns (
      id TEXT PRIMARY KEY,
      page_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      options TEXT DEFAULT '[]',
      position INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS db_rows (
      id TEXT PRIMARY KEY,
      page_id TEXT NOT NULL,
      data TEXT DEFAULT '{}',
      position INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Untitled Event',
      date TEXT NOT NULL,
      end_date TEXT,
      time TEXT DEFAULT '',
      color TEXT DEFAULT '#7B68EE',
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'file',
      size TEXT DEFAULT '',
      url TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS time_entries (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL DEFAULT '',
      project TEXT DEFAULT '',
      duration_minutes INTEGER DEFAULT 0,
      started_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)
}

const AVATARS = ['🧑‍💻', '👩‍🎨', '🧑‍🚀', '👩‍💼', '🧑‍🔬']

function randomAvatar() {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)]
}

function seedIfEmpty(db: Database.Database) {
  const count = (db.prepare('SELECT COUNT(*) as c FROM pages').get() as { c: number }).c
  if (count > 0) return

  // Getting started page
  const gettingStartedId = randomUUID()
  db.prepare(`INSERT INTO pages (id, title, content, icon, is_database) VALUES (?, ?, ?, ?, 0)`).run(
    gettingStartedId,
    'Getting Started',
    JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Welcome 👋' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Use the sidebar to navigate pages and databases. Click any page in the sidebar to open it, or use the + button to create new pages.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Features' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Block-based rich text editor with "/" slash commands' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nested pages with collapsible sidebar navigation' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Database views: Table, Kanban, and List' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Drag cards between kanban columns' }] }] },
        ]},
      ]
    }),
    '👋',
  )

  // PH Marketing project database
  const dbPageId = randomUUID()
  db.prepare(`INSERT INTO pages (id, title, icon, is_database) VALUES (?, ?, ?, 1)`).run(dbPageId, 'PH Marketing', '⭐')

  const colTask = randomUUID()
  const colStatus = randomUUID()
  const colPriority = randomUUID()
  const colTags = randomUUID()
  const colAssignees = randomUUID()
  const colDue = randomUUID()
  const colProgress = randomUUID()
  const colTime = randomUUID()
  const colComments = randomUUID()
  const colTaskId = randomUUID()

  db.prepare(`INSERT INTO db_columns (id, page_id, name, type, options, position) VALUES (?, ?, ?, ?, ?, ?)`).run(colTask, dbPageId, 'Task', 'text', '[]', 0)
  db.prepare(`INSERT INTO db_columns (id, page_id, name, type, options, position) VALUES (?, ?, ?, ?, ?, ?)`).run(colStatus, dbPageId, 'Status', 'select', JSON.stringify(['Research', 'Content brief', 'Production', 'Review', 'Published']), 1)
  db.prepare(`INSERT INTO db_columns (id, page_id, name, type, options, position) VALUES (?, ?, ?, ?, ?, ?)`).run(colPriority, dbPageId, 'Priority', 'select', JSON.stringify(['Low', 'Medium', 'High', 'Urgent']), 2)
  db.prepare(`INSERT INTO db_columns (id, page_id, name, type, options, position) VALUES (?, ?, ?, ?, ?, ?)`).run(colTags, dbPageId, 'Tags', 'text', '[]', 3)
  db.prepare(`INSERT INTO db_columns (id, page_id, name, type, options, position) VALUES (?, ?, ?, ?, ?, ?)`).run(colAssignees, dbPageId, 'Assignees', 'text', '[]', 4)
  db.prepare(`INSERT INTO db_columns (id, page_id, name, type, options, position) VALUES (?, ?, ?, ?, ?, ?)`).run(colDue, dbPageId, 'Due Date', 'date', '[]', 5)
  db.prepare(`INSERT INTO db_columns (id, page_id, name, type, options, position) VALUES (?, ?, ?, ?, ?, ?)`).run(colProgress, dbPageId, 'Progress', 'number', '[]', 6)
  db.prepare(`INSERT INTO db_columns (id, page_id, name, type, options, position) VALUES (?, ?, ?, ?, ?, ?)`).run(colTime, dbPageId, 'Time', 'text', '[]', 7)
  db.prepare(`INSERT INTO db_columns (id, page_id, name, type, options, position) VALUES (?, ?, ?, ?, ?, ?)`).run(colComments, dbPageId, 'Comments', 'number', '[]', 8)
  db.prepare(`INSERT INTO db_columns (id, page_id, name, type, options, position) VALUES (?, ?, ?, ?, ?, ?)`).run(colTaskId, dbPageId, 'Task ID', 'text', '[]', 9)

  const rows = [
    { task: 'Ways to get a slipping project back on track', status: 'Research', priority: 'High', tags: 'Open,TOFU', assignees: '🧑‍💻', due: '2026-05-27', progress: 0, time: '2h', comments: 0, taskId: '#235645' },
    { task: 'Top Asana alternatives', status: 'Research', priority: 'High', tags: 'Important,BOFU', assignees: '👩‍🎨', due: '2026-05-27', progress: 10, time: '1h', comments: 3, taskId: '#235648' },
    { task: 'Tools for entrepreneurs', status: 'Content brief', priority: 'Medium', tags: 'MOFU', assignees: '🧑‍💻,👩‍🎨', due: '2026-05-24', progress: 30, time: '6h', comments: 5, taskId: '#235686' },
    { task: 'What are OKRs?', status: 'Content brief', priority: 'Medium', tags: 'TOFU', assignees: '🧑‍🚀', due: '2026-05-30', progress: 30, time: '4h', comments: 3, taskId: '#235710' },
    { task: 'How to automate repetitive tasks', status: 'Production', priority: 'Urgent', tags: 'In-progress,MOFU', assignees: '👩‍💼', due: '2026-05-23', progress: 0, time: '2d', comments: 6, taskId: '#235686' },
    { task: 'Project manager daily tasks', status: 'Production', priority: 'Urgent', tags: 'Urgent,TOFU', assignees: '🧑‍🔬', due: '2026-05-22', progress: 80, time: '3d', comments: 2, taskId: '#235710' },
    { task: 'How to better meet deadlines', status: 'Review', priority: 'High', tags: 'MOFU', assignees: '🧑‍💻', due: '2026-05-28', progress: 90, time: '1d', comments: 2, taskId: '#235720' },
    { task: 'Making mistakes at work', status: 'Review', priority: 'Medium', tags: 'TOFU', assignees: '👩‍🎨', due: '2026-05-29', progress: 70, time: '4h', comments: 1, taskId: '#235725' },
  ]

  rows.forEach((r, i) => {
    db.prepare(`INSERT INTO db_rows (id, page_id, data, position) VALUES (?, ?, ?, ?)`).run(
      randomUUID(),
      dbPageId,
      JSON.stringify({
        [colTask]: r.task,
        [colStatus]: r.status,
        [colPriority]: r.priority,
        [colTags]: r.tags,
        [colAssignees]: r.assignees,
        [colDue]: r.due,
        [colProgress]: r.progress,
        [colTime]: r.time,
        [colComments]: r.comments,
        [colTaskId]: r.taskId,
      }),
      i,
    )
  })

  // Sub-pages
  const subPages = [
    { title: 'PH articles', icon: '📝', progress: '2/10' },
    { title: 'Guest posts', icon: '✍️', progress: '5/15' },
    { title: 'Social media', icon: '📱', progress: '3/8' },
    { title: 'Email campaign', icon: '📧', progress: '1/7' },
  ]
  subPages.forEach(sp => {
    db.prepare(`INSERT INTO pages (id, title, icon, parent_id, is_database) VALUES (?, ?, ?, ?, 0)`).run(randomUUID(), sp.title, sp.icon, dbPageId, 0)
  })
}
