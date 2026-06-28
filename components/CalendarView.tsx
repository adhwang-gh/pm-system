'use client'

import { useState, useMemo } from 'react'
import { DbColumn, DbRow } from '@/lib/types'

interface Props {
  columns: DbColumn[]
  rows: DbRow[]
  onRowClick: (row: DbRow) => void
}

const STATUS_COLORS: Record<string, string> = {
  'Research': 'bg-blue-500/80',
  'Content brief': 'bg-purple-500/80',
  'Production': 'bg-emerald-500/80',
  'Review': 'bg-orange-500/80',
  'Published': 'bg-gray-500/80',
  'Done': 'bg-emerald-500/80',
  'In Progress': 'bg-blue-500/80',
  'Not Started': 'bg-gray-600/80',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function CalendarView({ columns, rows, onRowClick }: Props) {
  const [date, setDate] = useState(new Date())
  const col = (name: string) => columns.find(c => c.name.toLowerCase().includes(name.toLowerCase()))
  const titleCol = col('task') ?? columns[0]
  const dueCol = col('due')
  const statusCol = col('status')

  const year = date.getFullYear()
  const month = date.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const tasksByDay = useMemo(() => {
    const map: Record<number, DbRow[]> = {}
    rows.forEach(row => {
      if (!dueCol) return
      const due = new Date(String(row.data[dueCol.id] ?? ''))
      if (isNaN(due.getTime())) return
      if (due.getFullYear() === year && due.getMonth() === month) {
        const d = due.getDate()
        if (!map[d]) map[d] = []
        map[d].push(row)
      }
    })
    return map
  }, [rows, dueCol, year, month])

  const today = new Date()
  const isToday = (d: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d

  // Pad grid
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="flex flex-col h-full">
      {/* Month nav */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setDate(new Date(year, month - 1, 1))}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
        >‹</button>
        <h2 className="text-lg font-semibold text-white min-w-[180px] text-center">
          {MONTHS[month]} {year}
        </h2>
        <button
          onClick={() => setDate(new Date(year, month + 1, 1))}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
        >›</button>
        <button
          onClick={() => setDate(new Date())}
          className="ml-2 px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >Today</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px mb-px">
        {DAYS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px flex-1 bg-white/5 rounded-xl overflow-hidden border border-white/8">
        {cells.map((day, i) => {
          const tasks = day ? (tasksByDay[day] ?? []) : []
          return (
            <div
              key={i}
              className={`min-h-[100px] p-2 flex flex-col gap-1 ${day ? 'bg-[#13131A] hover:bg-[#1A1A24]' : 'bg-[#0F0F15]'} transition-colors`}
            >
              {day && (
                <>
                  <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-[#7B68EE] text-white' : 'text-gray-500'}`}>
                    {day}
                  </div>
                  {tasks.slice(0, 3).map(row => {
                    const title = titleCol ? String(row.data[titleCol.id] ?? 'Untitled') : 'Untitled'
                    const status = statusCol ? String(row.data[statusCol.id] ?? '') : ''
                    const color = STATUS_COLORS[status] ?? 'bg-[#7B68EE]/80'
                    return (
                      <button
                        key={row.id}
                        onClick={() => onRowClick(row)}
                        className={`w-full text-left text-[10px] text-white px-1.5 py-0.5 rounded truncate ${color} hover:opacity-90 transition-opacity`}
                      >
                        {title}
                      </button>
                    )
                  })}
                  {tasks.length > 3 && (
                    <span className="text-[10px] text-gray-600">+{tasks.length - 3} more</span>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
