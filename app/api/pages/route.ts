import { NextResponse } from 'next/server'
import { getTurso, toRows, initNotionSchema } from '@/lib/tursoClient'
import { randomUUID } from 'crypto'

export async function GET() {
  await initNotionSchema()
  const turso = getTurso()
  const res = await turso.execute('SELECT * FROM pages ORDER BY created_at ASC')
  return NextResponse.json(toRows(res.rows))
}

export async function POST(req: Request) {
  await initNotionSchema()
  const turso = getTurso()
  const body = await req.json()
  const id = randomUUID()
  const { title = 'Untitled', parent_id = null, icon = '📄', is_database = 0 } = body
  await turso.execute({ sql: `INSERT INTO pages (id, title, parent_id, icon, is_database) VALUES (?, ?, ?, ?, ?)`, args: [id, title, parent_id, icon, is_database] })

  if (is_database === 1) {
    const cols = [
      { name: 'Task', type: 'text', options: '[]', pos: 0 },
      { name: 'Status', type: 'select', options: JSON.stringify(['Not Started', 'In Progress', 'Done', 'Blocked']), pos: 1 },
      { name: 'Priority', type: 'select', options: JSON.stringify(['Low', 'Medium', 'High', 'Urgent']), pos: 2 },
      { name: 'Due Date', type: 'date', options: '[]', pos: 3 },
    ]
    for (const col of cols) {
      await turso.execute({ sql: 'INSERT INTO db_columns (id, page_id, name, type, options, position) VALUES (?, ?, ?, ?, ?, ?)', args: [randomUUID(), id, col.name, col.type, col.options, col.pos] })
    }
  }

  const page = (await turso.execute({ sql: 'SELECT * FROM pages WHERE id = ?', args: [id] })).rows[0]
  return NextResponse.json(Object.fromEntries(Object.entries(page)), { status: 201 })
}
