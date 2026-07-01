import { NextResponse } from 'next/server'
import { getTurso } from '@/lib/tursoClient'
import { ensureNotificationsTable } from '@/lib/mondayDb'

function getUserId(req: Request) { return req.headers.get('X-Pm-User-Id') ?? '' }

export async function GET(req: Request) {
  await ensureNotificationsTable()
  const userId = getUserId(req)
  if (!userId) return NextResponse.json([])
  const turso = getTurso()
  const res = await turso.execute({ sql: 'SELECT * FROM pm_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', args: [userId] })
  return NextResponse.json(res.rows.map(r => Object.fromEntries(Object.entries(r))))
}

export async function POST(req: Request) {
  await ensureNotificationsTable()
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ ok: false })
  const turso = getTurso()
  const { action, id, all } = await req.json()
  if (action === 'mark_read') {
    if (all) await turso.execute({ sql: 'UPDATE pm_notifications SET read = 1 WHERE user_id = ?', args: [userId] })
    else if (id) await turso.execute({ sql: 'UPDATE pm_notifications SET read = 1 WHERE id = ? AND user_id = ?', args: [id, userId] })
  }
  return NextResponse.json({ ok: true })
}
