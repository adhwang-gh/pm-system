import { NextResponse } from 'next/server'
import { getTurso, toRows } from '@/lib/tursoClient'
import { initMondaySchema } from '@/lib/mondayDb'
import { randomUUID } from 'crypto'

export async function GET(req: Request) {
  await initMondaySchema()
  const turso = getTurso()
  const { searchParams } = new URL(req.url)
  const weekOf = searchParams.get('week_of')
  const res = weekOf
    ? await turso.execute({ sql: 'SELECT * FROM weekly_updates WHERE week_of = ?', args: [weekOf] })
    : await turso.execute('SELECT * FROM weekly_updates ORDER BY week_of DESC')
  return NextResponse.json(toRows(res.rows))
}

export async function POST(req: Request) {
  await initMondaySchema()
  const turso = getTurso()
  const { member_key, week_of, progress = '', plan = '', problems = '', products = '' } = await req.json()
  if (!member_key || !week_of) return NextResponse.json({ error: 'member_key and week_of required' }, { status: 400 })

  const existingRes = await turso.execute({ sql: 'SELECT id FROM weekly_updates WHERE member_key = ? AND week_of = ?', args: [member_key, week_of] })
  const existing = existingRes.rows[0]
  if (existing) {
    await turso.execute({ sql: "UPDATE weekly_updates SET progress=?, plan=?, problems=?, products=?, updated_at=datetime('now') WHERE id=?", args: [progress, plan, problems, products, existing.id as string] })
    const row = (await turso.execute({ sql: 'SELECT * FROM weekly_updates WHERE id = ?', args: [existing.id as string] })).rows[0]
    return NextResponse.json(Object.fromEntries(Object.entries(row)))
  }

  const id = randomUUID()
  await turso.execute({ sql: 'INSERT INTO weekly_updates (id, member_key, week_of, progress, plan, problems, products) VALUES (?, ?, ?, ?, ?, ?, ?)', args: [id, member_key, week_of, progress, plan, problems, products] })
  const row = (await turso.execute({ sql: 'SELECT * FROM weekly_updates WHERE id = ?', args: [id] })).rows[0]
  return NextResponse.json(Object.fromEntries(Object.entries(row)), { status: 201 })
}
