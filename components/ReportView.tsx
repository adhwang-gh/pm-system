'use client'

import { useEffect, useState } from 'react'
import { Page, DbColumn, DbRow } from '@/lib/types'

interface Props { pages: Page[] }

const STATUS_COLORS: Record<string, string> = {
  'Research': '#3B82F6', 'Content brief': '#8B5CF6', 'Production': '#10B981',
  'Review': '#F59E0B', 'Published': '#6B7280', 'Done': '#10B981',
  'In Progress': '#3B82F6', 'Not Started': '#4B5563', 'Blocked': '#EF4444',
}

function PieChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0)
  if (!total) return <div className="text-gray-600 text-sm">No data</div>
  let cumAngle = -90
  const radius = 70, cx = 80, cy = 80, r = radius

  const arcs = slices.map(sl => {
    const pct = sl.value / total
    const startAngle = cumAngle
    const sweep = pct * 360
    cumAngle += sweep
    const start = polarToCart(cx, cy, r, startAngle)
    const end = polarToCart(cx, cy, r, startAngle + sweep)
    const largeArc = sweep > 180 ? 1 : 0
    return { ...sl, pct, d: `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z` }
  })

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {arcs.map((arc, i) => (
          <path key={i} d={arc.d} fill={arc.color} stroke="#1A1A24" strokeWidth="2">
            <title>{arc.label}: {arc.value} ({Math.round(arc.pct * 100)}%)</title>
          </path>
        ))}
        <circle cx={cx} cy={cy} r={r * 0.5} fill="#1A1A24" />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#6B7280" fontSize="9">total</text>
      </svg>
      <div className="space-y-2">
        {arcs.map((arc, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: arc.color }} />
            <span className="text-xs text-gray-300">{arc.label}</span>
            <span className="text-xs text-gray-500 ml-auto pl-4">{arc.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function polarToCart(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function BarChart({ data, max }: { data: { label: string; value: number; color: string }[]; max: number }) {
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400 truncate max-w-[180px]">{d.label}</span>
            <span className="text-xs text-gray-500">{d.value}</span>
          </div>
          <div className="h-6 bg-white/5 rounded overflow-hidden">
            <div className="h-full rounded flex items-center px-2 transition-all" style={{ width: `${max ? (d.value / max) * 100 : 0}%`, backgroundColor: d.color }}>
              {d.value > 0 && <span className="text-[10px] text-white font-medium whitespace-nowrap">{d.value}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ReportView({ pages }: Props) {
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
  const progressBuckets: Record<string, number> = { 'Not started (0%)': 0, 'Early (1–25%)': 0, 'Mid (26–75%)': 0, 'Almost done (76–99%)': 0, 'Complete (100%)': 0 }
  let totalProgress = 0, progressCount = 0

  allRows.forEach(row => {
    if (statusCol) { const s = String(row.data[statusCol.id] ?? ''); if (s) statusCounts[s] = (statusCounts[s] ?? 0) + 1 }
    if (priorityCol) { const p = String(row.data[priorityCol.id] ?? ''); if (p) priorityCounts[p] = (priorityCounts[p] ?? 0) + 1 }
    if (progressCol) {
      const v = Number(row.data[progressCol.id] ?? 0)
      if (v === 0) progressBuckets['Not started (0%)']++
      else if (v <= 25) progressBuckets['Early (1–25%)']++
      else if (v <= 75) progressBuckets['Mid (26–75%)']++
      else if (v < 100) progressBuckets['Almost done (76–99%)']++
      else progressBuckets['Complete (100%)']++
      if (v > 0) { totalProgress += v; progressCount++ }
    }
  })

  const done = (statusCounts['Done'] ?? 0) + (statusCounts['Published'] ?? 0)
  const avgProgress = progressCount > 0 ? Math.round(totalProgress / progressCount) : 0
  const maxStatus = Math.max(...Object.values(statusCounts), 1)

  // Due dates coming up
  const dueCol = allColumns.find(c => c.name === 'Due Date')
  const now = new Date().toISOString().slice(0, 10)
  const overdue = dueCol ? allRows.filter(r => String(r.data[dueCol.id] ?? '') < now && String(r.data[statusCol?.id ?? ''] ?? '') !== 'Done') : []
  const dueThisWeek = dueCol ? allRows.filter(r => {
    const d = String(r.data[dueCol.id] ?? '')
    const week = new Date(); week.setDate(week.getDate() + 7)
    return d >= now && d <= week.toISOString().slice(0, 10)
  }) : []

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#111118] text-gray-500">
      <div className="w-5 h-5 border-2 border-[#7B68EE] border-t-transparent rounded-full animate-spin mr-3" />
      Loading report…
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto bg-[#111118]">
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Report</h1>
          <p className="text-gray-500 text-sm">Analytics and insights across all your projects</p>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total tasks', value: allRows.length, icon: '📋', sub: '', color: '#7B68EE' },
            { label: 'Completion rate', value: `${allRows.length ? Math.round(done / allRows.length * 100) : 0}%`, icon: '✅', sub: `${done} completed`, color: '#10B981' },
            { label: 'Avg progress', value: `${avgProgress}%`, icon: '📈', sub: 'across active tasks', color: '#3B82F6' },
            { label: 'Due this week', value: dueThisWeek.length, icon: '📅', sub: `${overdue.length} overdue`, color: overdue.length > 0 ? '#EF4444' : '#F59E0B' },
          ].map(s => (
            <div key={s.label} className="bg-[#1A1A24] border border-white/8 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{s.icon}</span>
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              {s.sub && <div className="text-xs text-gray-600 mt-0.5">{s.sub}</div>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Status pie */}
          <div className="bg-[#1A1A24] border border-white/8 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Status Distribution</h3>
            <PieChart slices={Object.entries(statusCounts).map(([label, value]) => ({ label, value, color: STATUS_COLORS[label] ?? '#6B7280' }))} />
          </div>

          {/* Priority bar */}
          <div className="bg-[#1A1A24] border border-white/8 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Tasks by Status</h3>
            <BarChart
              data={Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value, color: STATUS_COLORS[label] ?? '#6B7280' }))}
              max={maxStatus}
            />
          </div>
        </div>

        {/* Progress distribution */}
        {progressCount > 0 && (
          <div className="bg-[#1A1A24] border border-white/8 rounded-xl p-5 mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Progress Distribution</h3>
            <div className="flex gap-2 h-24 items-end">
              {Object.entries(progressBuckets).map(([label, count]) => {
                const pct = allRows.length ? (count / allRows.length) * 100 : 0
                return (
                  <div key={label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500">{count}</span>
                    <div className="w-full rounded-t" style={{ height: `${Math.max(pct, 4)}%`, backgroundColor: '#7B68EE', opacity: 0.4 + (pct / 100) * 0.6 }} title={`${label}: ${count}`} />
                    <span className="text-[9px] text-gray-600 text-center leading-tight">{label.split(' ')[0]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Overdue & coming up */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#1A1A24] border border-white/8 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              🔴 Overdue <span className="text-red-400">({overdue.length})</span>
            </h3>
            {overdue.length === 0 ? <p className="text-gray-600 text-sm">Nothing overdue 🎉</p> : (
              <div className="space-y-2">
                {overdue.slice(0, 5).map(row => (
                  <div key={row.id} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <span className="text-sm text-gray-300 flex-1 truncate">{titleCol ? String(row.data[titleCol.id] ?? 'Untitled') : 'Untitled'}</span>
                    <span className="text-xs text-red-400 shrink-0">{dueCol ? String(row.data[dueCol.id] ?? '') : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-[#1A1A24] border border-white/8 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              📅 Due this week <span className="text-yellow-400">({dueThisWeek.length})</span>
            </h3>
            {dueThisWeek.length === 0 ? <p className="text-gray-600 text-sm">Nothing due this week</p> : (
              <div className="space-y-2">
                {dueThisWeek.slice(0, 5).map(row => (
                  <div key={row.id} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                    <span className="text-sm text-gray-300 flex-1 truncate">{titleCol ? String(row.data[titleCol.id] ?? 'Untitled') : 'Untitled'}</span>
                    <span className="text-xs text-gray-500 shrink-0">{dueCol ? String(row.data[dueCol.id] ?? '') : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
