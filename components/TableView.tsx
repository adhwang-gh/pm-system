'use client'

import { useState } from 'react'
import { DbColumn, DbRow } from '@/lib/types'

interface Props {
  pageId: string
  columns: DbColumn[]
  rows: DbRow[]
  onAddRow: () => void
  onUpdateRow: (rowId: string, data: Record<string, string | number | boolean>) => void
  onDeleteRow: (rowId: string) => void
  onAddColumn: () => void
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
  'Medium': 'bg-yellow-500/20 text-yellow-400',
  'Low': 'bg-gray-500/20 text-gray-400',
  'Urgent': 'bg-red-500/20 text-red-400',
}

function Cell({ col, value, onChange }: { col: DbColumn; value: string | number | boolean | undefined; onChange: (v: string | number | boolean) => void }) {
  const [editing, setEditing] = useState(false)
  const str = String(value ?? '')

  if (col.type === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={!!value}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 accent-[#7B68EE]"
      />
    )
  }

  if (col.type === 'select' && !editing) {
    const colorClass = TAG_COLORS[str] || 'bg-gray-500/20 text-gray-400'
    return (
      <div onClick={() => setEditing(true)} className="cursor-pointer">
        {str ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>{str}</span> : <span className="text-gray-700 text-sm">—</span>}
      </div>
    )
  }

  if (col.type === 'select' && editing) {
    return (
      <select
        autoFocus
        value={str}
        onChange={e => { onChange(e.target.value); setEditing(false) }}
        onBlur={() => setEditing(false)}
        className="text-sm bg-[#1E1E28] border border-[#7B68EE] rounded px-1 py-0.5 outline-none text-white"
      >
        <option value="">—</option>
        {col.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }

  if (editing) {
    return (
      <input
        autoFocus
        type={col.type === 'date' ? 'date' : col.type === 'number' ? 'number' : 'text'}
        defaultValue={str}
        onBlur={e => { onChange(col.type === 'number' ? Number(e.target.value) : e.target.value); setEditing(false) }}
        onKeyDown={e => { if (e.key === 'Enter') { onChange(col.type === 'number' ? Number(e.currentTarget.value) : e.currentTarget.value); setEditing(false) } }}
        className="w-full text-sm bg-[#1E1E28] border border-[#7B68EE] rounded px-1 py-0.5 outline-none text-white"
      />
    )
  }

  return (
    <div onClick={() => setEditing(true)} className="cursor-pointer text-sm text-gray-300 truncate min-h-[20px]">
      {str || <span className="text-gray-700">—</span>}
    </div>
  )
}

export default function TableView({ columns, rows, onAddRow, onUpdateRow, onDeleteRow, onAddColumn }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/8 bg-[#13131A]">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/8">
            {columns.map(col => (
              <th key={col.id} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[140px] bg-[#13131A]">
                {col.name}
              </th>
            ))}
            <th className="px-2 py-3 w-10 bg-[#13131A]">
              <button onClick={onAddColumn} className="text-gray-600 hover:text-gray-400 text-lg leading-none" title="Add column">+</button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} className={`group border-b border-white/5 hover:bg-white/3 transition-colors ${i % 2 === 0 ? '' : 'bg-white/2'}`}>
              {columns.map(col => (
                <td key={col.id} className="px-4 py-2.5">
                  <Cell
                    col={col}
                    value={row.data[col.id]}
                    onChange={v => onUpdateRow(row.id, { [col.id]: v })}
                  />
                </td>
              ))}
              <td className="px-2 py-2.5">
                <button
                  onClick={() => onDeleteRow(row.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 text-sm"
                >✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={onAddRow}
        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:text-gray-400 transition-colors"
      >
        <span>+</span> New row
      </button>
    </div>
  )
}
