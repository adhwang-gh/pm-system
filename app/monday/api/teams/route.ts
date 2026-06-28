import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { initMondaySchema } from '@/lib/mondayDb'

export async function GET() {
  initMondaySchema()
  const db = getDb()
  const teams = db.prepare('SELECT * FROM pm_teams ORDER BY position').all() as Array<Record<string, unknown>>
  const members = db.prepare('SELECT * FROM pm_team_members ORDER BY position').all() as Array<Record<string, unknown>>
  return NextResponse.json(teams.map(t => ({
    ...t,
    members: members.filter(m => m.team_id === t.id).map(m => m.member_key),
  })))
}
