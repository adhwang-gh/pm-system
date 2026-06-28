'use client'

import { useMemo } from 'react'
import { DbColumn, DbRow } from '@/lib/types'

interface Props {
  columns: DbColumn[]
  rows: DbRow[]
  onRowClick: (row: DbRow) => void
}

const STATUS_COLORS: Record<string, string> = {
  'Research': 'bg-blue-500',
  'Content brief': 'bg-purple-500',
  'Production': 'bg-emerald-500',
  'Review': 'bg-orange-500',
  'Published': 'bg-gray-500',
  'Done': 'bg-emerald-500',
  'In Progress': 'bg-blue-500',
  'Not Started': 'bg-gray-600',
}

const PRIORITY_COLORS: Record<string, string> = {
  'Urgent': 'border-l-red-500',
  'High': 'border-l-orange-500',
  'Medium': 'border-l-yellow-500',
  'Low': 'border-l-gray-600',
}

export default function GanttView({ columns, rows, onRowClick }: Props) {
  const col = (name: string) => columns.find(c => c.name.toLowerCase().includes(name.toLowerCase()))
  const titleCol = col('task') ?? columns[0]
  const dueCol = col('due')
  const statusCol = col('status')
  const priorityCol = col('priority')
  const progressCol = col('progress')

  const { weeks, startDate, totalDays } = useMemo(() => {
    const dates = rows.map(r => dueCol ? new Date(String(r.data[dueCol.id] ?? '')) : null).filter((d): d is Date => !!d && !isNaN(d.getTime()))
    const now = new Date()
    const minDate = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : now
    const maxDate = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : now

    // Pad by 1 week on each side
    const start = new Date(minDate)
    start.setDate(start.getDate() - 7)
    start.setDate(start.getDate() - start.getDay()) // snap to Sunday

    const end = new Date(maxDate)
    end.setDate(end.getDate() + 14)

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    const weeks: Date[] = []
    const cur = new Date(start)
    while (cur <= end) {
      weeks.push(new Date(cur))
      cur.setDate(cur.getDate() + 7)
    }

    return { weeks, startDate: start, totalDays }
  }, [rows, dueCol])

  const DAY_WIDTH = 28 // px per day

  function dayOffset(date: Date): number {
    return Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  const today = new Date()
  const todayOffset = dayOffset(today)

  return (
    <div className="overflow-auto rounded-xl border border-white/8 bg-[#13131A]">
      <div style={{ minWidth: `${340 + totalDays * DAY_WIDTH}px` }}>
        {/* Header */}
        <div className="flex border-b border-white/8 sticky top-0 bg-[#13131A] z-10">
          <div className="w-80 shrink-0 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-white/8">
            Task
          </div>
          <div className="flex-1 relative">
            {weeks.map((week, i) => (
              <div
                key={i}
                className="absolute top-0 h-full border-l border-white/8 flex items-center px-2"
                style={{ left: dayOffset(week) * DAY_WIDTH }}
              >
                <span className="text-xs text-gray-600 whitespace-nowrap">
                  {week.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        {rows.map(row => {
          const title = titleCol ? String(row.data[titleCol.id] ?? 'Untitled') : 'Untitled'
          const status = statusCol ? String(row.data[statusCol.id] ?? '') : ''
          const priority = priorityCol ? String(row.data[priorityCol.id] ?? '') : ''
          const progress = progressCol ? Number(row.data[progressCol.id] ?? 0) : 0
          const due = dueCol ? new Date(String(row.data[dueCol.id] ?? '')) : null
          const isValidDate = due && !isNaN(due.getTime())

          const barColor = STATUS_COLORS[status] ?? 'bg-[#7B68EE]'
          const barEnd = isValidDate ? dayOffset(due) : null
          // Estimate start as 3 days before due (or 7 if no progress info)
          const duration = Math.max(3, Math.round(progress > 0 ? (progress / 100) * 14 : 5))
          const barStart = barEnd !== null ? Math.max(0, barEnd - duration) : null

          return (
            <div
              key={row.id}
              className={`flex border-b border-white/5 hover:bg-white/3 cursor-pointer transition-colors group border-l-2 ${PRIORITY_COLORS[priority] ?? 'border-l-transparent'}`}
              onClick={() => onRowClick(row)}
            >
              {/* Label */}
              <div className="w-80 shrink-0 px-4 py-3 border-r border-white/8 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${barColor}`} />
                <span className="text-sm text-gray-200 truncate flex-1 group-hover:text-white">{title}</span>
                {progress > 0 && (
                  <span className="text-xs text-gray-600 shrink-0">{progress}%</span>
                )}
              </div>

              {/* Timeline */}
              <div className="flex-1 relative" style={{ height: '44px' }}>
                {/* Today line */}
                {todayOffset >= 0 && todayOffset <= totalDays && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-[#7B68EE]/50 z-10"
                    style={{ left: todayOffset * DAY_WIDTH }}
                  />
                )}
                {/* Week grid */}
                {weeks.map((week, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-l border-white/5"
                    style={{ left: dayOffset(week) * DAY_WIDTH }}
                  />
                ))}
                {/* Bar */}
                {barStart !== null && barEnd !== null && (
                  <div
                    className={`absolute top-3 h-5 rounded-full ${barColor} opacity-80 flex items-center px-2 overflow-hidden`}
                    style={{
                      left: barStart * DAY_WIDTH,
                      width: Math.max(duration * DAY_WIDTH, 40),
                    }}
                  >
                    <div
                      className="h-full bg-white/30 rounded-full absolute left-0 top-0"
                      style={{ width: `${progress}%` }}
                    />
                    {isValidDate && (
                      <span className="text-[10px] text-white font-medium relative z-10 whitespace-nowrap">
                        {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
