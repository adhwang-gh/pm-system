import { NextResponse } from 'next/server'
import { getTurso, toRows } from '@/lib/tursoClient'
import { initMondaySchema } from '@/lib/mondayDb'
import { randomUUID } from 'crypto'

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'pm-admin-2024'

function checkAdmin(req: Request): boolean {
  return req.headers.get('X-Admin-Secret') === ADMIN_SECRET
}

export async function GET(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await initMondaySchema()
  const turso = getTurso()
  const invites = toRows((await turso.execute('SELECT * FROM pm_invites ORDER BY created_at DESC')).rows)
  return NextResponse.json(invites)
}

export async function POST(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await initMondaySchema()
  const { label } = await req.json()
  const turso = getTurso()
  const id = randomUUID()
  await turso.execute({ sql: 'INSERT INTO pm_invites (id, label) VALUES (?, ?)', args: [id, label ?? ''] })
  const inv = (await turso.execute({ sql: 'SELECT * FROM pm_invites WHERE id = ?', args: [id] })).rows[0]
  return NextResponse.json(Object.fromEntries(Object.entries(inv)), { status: 201 })
}

export async function DELETE(req: Request) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  const turso = getTurso()
  await turso.execute({ sql: 'DELETE FROM pm_invites WHERE id = ?', args: [id] })
  return NextResponse.json({ ok: true })
}
