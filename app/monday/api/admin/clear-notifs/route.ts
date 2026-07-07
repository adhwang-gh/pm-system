import { NextResponse } from 'next/server'
import { getTurso } from '@/lib/tursoClient'

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('key') !== 'stele-clear-2025') return NextResponse.json({ ok: false }, { status: 403 })
  const turso = getTurso()
  const res = await turso.execute('DELETE FROM pm_notifications')
  return NextResponse.json({ deleted: res.rowsAffected })
}
