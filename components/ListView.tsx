'use client'

import { DbColumn, DbRow } from '@/lib/types'

interface Props {
  columns: DbColumn[]
  rows: DbRow[]
  onAddRow: () => void
  onDeleteRow: (rowId: string) => void
  onRowClick: (row: DbRow) => void
}

const TAG_COLORS: Record<string, string> = {
  'Done': 'bg-emerald-500/20 text-emerald-400',
  'In Progress': 'bg-blue-500/20 text-blue-400',
  'Not Started': 'bg-gray-500/20 text-gray-400',
  'Research': 'bg-blue-500/20 text-blue-400',
  'Production': 'bg-emerald-500/20 text-emerald-400',
  'Review': 'bg-orange-500/20 text-orange-400',
  'Content brief': 'bg-purple-500/20 text-purple-400',
  'Published': 'bg-gray-500/20 text-gray-400',
  'High': 'bg-orange-500/20 text-orange-400',
  'Urgent': 'bg-red-500/20 text-red-400',
  'Medium': 'bg-yellow-500/20 text-yellow-400',
  'Low': 'bg-gray-500/20 text-gray-400',
}

export default function ListView({ columns, rows, onAddRow, onDeleteRow, onRowClick }: Props) {
  const titleCol = columns[0]
  const otherCols = columns.slice(1, 5)

  return (
    <div className="space-y-2">
      {rows.map(row => (
        <div key={row.id} onClick={() => onRowClick(row)} className="group flex items-center gap-4 px-5 py-3.5 bg-[#1A1A24] border border-white/8 rounded-xl hover:border-white/15 hover:shadow-lg hover:shadow-black/20 transition-all cursor-pointer">
          <div className="flex-1 font-medium text-white text-sm">
            {titleCol ? String(row.data[titleCol.id] || 'Untitled') : 'Untitled'}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {otherCols.map(col => {
              const val = String(row.data[col.id] ?? '')
              if (!val) return null
              const colorClass = TAG_COLORS[val]
              return colorClass ? (
                <span key={col.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>{val}</span>
              ) : (
                <span key={col.id} className="text-xs text-gray-500">{val}</span>
              )
            })}
          </div>
          <button
            onClick={() => onDeleteRow(row.id)}
            className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 text-sm shrink-0"
          >✕</button>
        </div>
      ))}
      <button
        onClick={onAddRow}
        className="flex items-center gap-2 px-5 py-3.5 text-sm text-gray-600 hover:text-gray-400 transition-colors"
      >
        + New row
      </button>
    </div>
  )
}
