import { NextResponse } from 'next/server'
import { getTurso, toRows } from '@/lib/tursoClient'
import { initMondaySchema } from '@/lib/mondayDb'

export async function GET() {
  await initMondaySchema()
  const turso = getTurso()
  const [teamsRes, membersRes] = await Promise.all([
    turso.execute('SELECT * FROM pm_teams ORDER BY position'),
    turso.execute('SELECT * FROM pm_team_members ORDER BY position'),
  ])
  const teams = toRows(teamsRes.rows)
  const members = toRows(membersRes.rows)
  return NextResponse.json(teams.map(t => ({
    ...t,
    members: members.filter(m => m.team_id === t.id).map(m => m.member_key),
  })))
}
