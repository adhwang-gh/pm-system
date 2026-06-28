'use client'

import { useEffect, useState } from 'react'
import { Page, DbColumn, DbRow } from '@/lib/types'

interface Props {
  pages: Page[]
  onNavigate: (pageId: string) => void
}

const STATUS_COLORS: Record<string, string> = {
  'Research': '#3B82F6', 'Content brief': '#8B5CF6', 'Production': '#10B981',
  'Review': '#F59E0B', 'Published': '#6B7280', 'Done': '#10B981',
  'In Progress': '#3B82F6', 'Not Started': '#4B5563', 'Blocked': '#EF4444',
}
const PRIORITY_COLORS: Record<string, string> = { Urgent: '#EF4444', High: '#F59E0B', Medium: '#3B82F6', Low: '#6B7280' }

function Bar({ label, value, max, color, suffix = '' }: { label: string; value: number; max: number; color: string; suffix?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm text-gray-300 truncate max-w-[160px]">{label}</span>
        </div>
        <span className="text-sm text-gray-500 shrink-0">{value}{suffix}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${max ? (value / max) * 100 : 0}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export default function OverviewDashboard({ pages, onNavigate }: Props) {
  const [allColumns, setAllColumns] = useState<DbColumn[]>([])
  const [allRows, setAllRows] = useState<DbRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const dbs = pages.filter(p => p.is_database === 1)
    if (dbs.length === 0) { setLoading(false); return }
    Promise.all(dbs.map(async db => {
      try {
        const [cr, rr] = await Promise.all([fetch(`/api/databases/${db.id}`), fetch(`/api/databases/${db.id}/rows`)])
        return { cols: await cr.json() as DbColumn[], rows: await rr.json() as DbRow[] }
      } catch { return { cols: [], rows: [] } }
    })).then(results => {
      setAllColumns(results.flatMap(r => r.cols))
      setAllRows(results.flatMap(r => r.rows))
      setLoading(false)
    })
  }, [pages])

  const statusCol = allColumns.find(c => c.name === 'Status')
  const priorityCol = allColumns.find(c => c.name === 'Priority')
  const progressCol = allColumns.find(c => c.name === 'Progress')
  const titleCol = allColumns.find(c => c.name === 'Task') ?? allColumns[0]

  const statusCounts: Record<string, number> = {}
  const priorityCounts: Record<string, number> = {}
  let totalProgress = 0, progressCount = 0

  allRows.forEach(row => {
    if (statusCol) { const s = String(row.data[statusCol.id] ?? ''); if (s) statusCounts[s] = (statusCounts[s] ?? 0) + 1 }
    if (priorityCol) { const p = String(row.data[priorityCol.id] ?? ''); if (p) priorityCounts[p] = (priorityCounts[p] ?? 0) + 1 }
    if (progressCol) { const v = Number(row.data[progressCol.id] ?? 0); if (v > 0) { totalProgress += v; progressCount++ } }
  })

  const done = (statusCounts['Done'] ?? 0) + (statusCounts['Published'] ?? 0)
  const avgProgress = progressCount > 0 ? Math.round(totalProgress / progressCount) : 0
  const maxStatus = Math.max(...Object.values(statusCounts), 1)
  const databases = pages.filter(p => p.is_database === 1)
  const recentRows = [...allRows].slice(-6).reverse()

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#111118] text-gray-500">
      <div className="w-5 h-5 border-2 border-[#7B68EE] border-t-transparent rounded-full animate-spin mr-3" />
      Loading overview…
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto bg-[#111118]">
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Overview</h1>
          <p className="text-gray-500 text-sm">Your workspace at a glance</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { icon: '📋', label: 'Total tasks', value: allRows.length, color: 'bg-[#7B68EE]/20 text-[#7B68EE]' },
            { icon: '✅', label: 'Completed', value: `${done}/${allRows.length}`, sub: allRows.length ? `${Math.round(done/allRows.length*100)}% done` : '', color: 'bg-emerald-500/20 text-emerald-400' },
            { icon: '📈', label: 'Avg progress', value: `${avgProgress}%`, color: 'bg-blue-500/20 text-blue-400' },
            { icon: '🗄', label: 'Databases', value: databases.length, color: 'bg-orange-500/20 text-orange-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#1A1A24] border border-white/8 rounded-xl p-5 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${s.color}`}>{s.icon}</div>
              <div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
                {s.sub && <div className="text-xs text-gray-600 mt-0.5">{s.sub}</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-[#1A1A24] border border-white/8 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Tasks by Status</h3>
            {Object.keys(statusCounts).length === 0 ? <p className="text-gray-600 text-sm">No data yet</p> : (
              <div className="space-y-3">
                {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([s, count]) => (
                  <Bar key={s} label={s} value={count} max={maxStatus} color={STATUS_COLORS[s] ?? '#6B7280'} />
                ))}
              </div>
            )}
          </div>
          <div className="bg-[#1A1A24] border border-white/8 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Tasks by Priority</h3>
            {Object.keys(priorityCounts).length === 0 ? <p className="text-gray-600 text-sm">No priority data</p> : (
              <div className="space-y-3">
                {(['Urgent','High','Medium','Low'] as const).filter(p => priorityCounts[p]).map(p => (
                  <Bar key={p} label={p} value={priorityCounts[p]} max={allRows.length} color={PRIORITY_COLORS[p]} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent tasks */}
        <div className="bg-[#1A1A24] border border-white/8 rounded-xl p-5 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Recent Tasks</h3>
          {recentRows.length === 0 ? <p className="text-gray-600 text-sm">No tasks yet</p> : (
            <div className="space-y-2">
              {recentRows.map(row => {
                const title = titleCol ? String(row.data[titleCol.id] ?? 'Untitled') : 'Untitled'
                const status = statusCol ? String(row.data[statusCol.id] ?? '') : ''
                const priority = priorityCol ? String(row.data[priorityCol.id] ?? '') : ''
                const progress = progressCol ? Number(row.data[progressCol.id] ?? 0) : 0
                return (
                  <div key={row.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[status] ?? '#4B5563' }} />
                    <span className="text-sm text-gray-200 flex-1 truncate">{title}</span>
                    {progress > 0 && (
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#7B68EE]" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-gray-600">{progress}%</span>
                      </div>
                    )}
                    {priority && <span className="text-xs shrink-0" style={{ color: PRIORITY_COLORS[priority] }}>{priority}</span>}
                    {status && <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full shrink-0">{status}</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Databases */}
        <div className="bg-[#1A1A24] border border-white/8 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Databases</h3>
          {databases.length === 0 ? <p className="text-gray-600 text-sm">No databases yet</p> : (
            <div className="grid grid-cols-3 gap-3">
              {databases.map(db => (
                <button key={db.id} onClick={() => onNavigate(db.id)}
                  className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left transition-colors">
                  <span className="text-2xl">{db.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{db.title}</div>
                    <div className="text-xs text-gray-600">Database</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
