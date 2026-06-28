import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { initMondaySchema } from '@/lib/mondayDb'
import { randomUUID } from 'crypto'

export async function GET(req: Request) {
  initMondaySchema()
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const weekOf = searchParams.get('week_of')
  const rows = weekOf
    ? db.prepare('SELECT * FROM weekly_updates WHERE week_of = ?').all(weekOf)
    : db.prepare('SELECT * FROM weekly_updates ORDER BY week_of DESC').all()
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  initMondaySchema()
  const db = getDb()
  const { member_key, week_of, progress = '', plan = '', problems = '', products = '' } = await req.json()
  if (!member_key || !week_of) return NextResponse.json({ error: 'member_key and week_of required' }, { status: 400 })

  const existing = db.prepare('SELECT id FROM weekly_updates WHERE member_key = ? AND week_of = ?').get(member_key, week_of) as { id: string } | undefined
  if (existing) {
    db.prepare("UPDATE weekly_updates SET progress=?, plan=?, problems=?, products=?, updated_at=datetime('now') WHERE id=?")
      .run(progress, plan, problems, products, existing.id)
    return NextResponse.json(db.prepare('SELECT * FROM weekly_updates WHERE id = ?').get(existing.id))
  }

  const id = randomUUID()
  db.prepare('INSERT INTO weekly_updates (id, member_key, week_of, progress, plan, problems, products) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, member_key, week_of, progress, plan, problems, products)
  return NextResponse.json(db.prepare('SELECT * FROM weekly_updates WHERE id = ?').get(id), { status: 201 })
}
