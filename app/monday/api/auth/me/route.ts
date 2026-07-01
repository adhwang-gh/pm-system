import { NextResponse } from 'next/server'
import { getTurso } from '@/lib/tursoClient'
import { initMondaySchema } from '@/lib/mondayDb'

export async function GET(req: Request) {
  await initMondaySchema()
  const userId = req.headers.get('X-Pm-User-Id') ?? ''
  if (!userId) return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
  const turso = getTurso()
  const res = await turso.execute({ sql: 'SELECT name, email FROM pm_users WHERE user_id = ?', args: [userId] })
  if (!res.rows[0]) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ name: String(res.rows[0].name), email: String(res.rows[0].email) })
}

export async function PATCH(req: Request) {
  const userId = req.headers.get('X-Pm-User-Id') ?? ''
  if (!userId) return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })
  const turso = getTurso()
  const cleanName = (name as string).trim()
  const initials = cleanName.split(/\s+/).map((w: string) => w[0]?.toUpperCase() ?? '').join('').slice(0, 2) || '?'
  await turso.execute({ sql: 'UPDATE pm_users SET name = ? WHERE user_id = ?', args: [cleanName, userId] })
  await turso.execute({ sql: 'UPDATE pm_members SET name = ?, initials = ? WHERE id = ?', args: [cleanName, initials, userId] })
  return NextResponse.json({ name: cleanName })
}
