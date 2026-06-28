import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { randomUUID } from 'crypto'

export function GET() {
  const db = getDb()
  const pages = db.prepare('SELECT * FROM pages ORDER BY created_at ASC').all()
  return NextResponse.json(pages)
}

export async function POST(req: Request) {
  const db = getDb()
  const body = await req.json()
  const id = randomUUID()
  const { title = 'Untitled', parent_id = null, icon = '📄', is_database = 0 } = body
  db.prepare(`INSERT INTO pages (id, title, parent_id, icon, is_database) VALUES (?, ?, ?, ?, ?)`).run(id, title, parent_id, icon, is_database)

  // Auto-seed columns for new databases
  if (is_database === 1) {
    const cols = [
      { name: 'Task', type: 'text', options: '[]', pos: 0 },
      { name: 'Status', type: 'select', options: JSON.stringify(['Not Started', 'In Progress', 'Done', 'Blocked']), pos: 1 },
      { name: 'Priority', type: 'select', options: JSON.stringify(['Low', 'Medium', 'High', 'Urgent']), pos: 2 },
      { name: 'Due Date', type: 'date', options: '[]', pos: 3 },
    ]
    for (const col of cols) {
      db.prepare('INSERT INTO db_columns (id, page_id, name, type, options, position) VALUES (?, ?, ?, ?, ?, ?)').run(randomUUID(), id, col.name, col.type, col.options, col.pos)
    }
  }

  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id)
  return NextResponse.json(page, { status: 201 })
}
