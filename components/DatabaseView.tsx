'use client'

import { useEffect, useState, useCallback } from 'react'
import { DbColumn, DbRow, Page, ViewType } from '@/lib/types'
import TableView from './TableView'
import KanbanView from './KanbanView'
import ListView from './ListView'
import GanttView from './GanttView'
import CalendarView from './CalendarView'
import CardModal from './CardModal'

type ExtendedView = ViewType | 'gantt' | 'calendar'

interface Props {
  page: Page
}

export default function DatabaseView({ page }: Props) {
  const [columns, setColumns] = useState<DbColumn[]>([])
  const [rows, setRows] = useState<DbRow[]>([])
  const [view, setView] = useState<ExtendedView>('kanban')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openRow, setOpenRow] = useState<DbRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [colsRes, rowsRes] = await Promise.all([
      fetch(`/api/databases/${page.id}`),
      fetch(`/api/databases/${page.id}/rows`),
    ])
    setColumns(await colsRes.json())
    setRows(await rowsRes.json())
    setLoading(false)
  }, [page.id])

  useEffect(() => { load() }, [load])

  const addRow = async (statusValue?: string) => {
    const statusCol = columns.find(c => c.name === 'Status')
    const data: Record<string, string> = {}
    if (statusCol && statusValue) data[statusCol.id] = statusValue
    const res = await fetch(`/api/databases/${page.id}/rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    })
    const row = await res.json()
    setRows(prev => [...prev, row])
    // Auto-open the new row for editing
    setOpenRow(row)
  }

  const updateRow = async (rowId: string, data: Record<string, string | number | boolean>) => {
    const res = await fetch(`/api/databases/${page.id}/rows/${rowId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    })
    const updated = await res.json()
    setRows(prev => prev.map(r => r.id === rowId ? updated : r))
    if (openRow?.id === rowId) setOpenRow(updated)
  }

  const deleteRow = async (rowId: string) => {
    await fetch(`/api/databases/${page.id}/rows/${rowId}`, { method: 'DELETE' })
    setRows(prev => prev.filter(r => r.id !== rowId))
    if (openRow?.id === rowId) setOpenRow(null)
  }

  const addColumn = async () => {
    const name = prompt('Column name:')
    if (!name) return
    const type = prompt('Type (text / number / select / date / checkbox):', 'text') as DbColumn['type'] || 'text'
    let options: string[] = []
    if (type === 'select') {
      const raw = prompt('Options (comma separated):') || ''
      options = raw.split(',').map(s => s.trim()).filter(Boolean)
    }
    const res = await fetch(`/api/databases/${page.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, options }),
    })
    const col = await res.json()
    setColumns(prev => [...prev, col])
  }

  const filteredRows = search
    ? rows.filter(r => Object.values(r.data).some(v => String(v).toLowerCase().includes(search.toLowerCase())))
    : rows

  const tabs: { id: ExtendedView; label: string; icon: string }[] = [
    { id: 'kanban', label: 'Board', icon: '⬡' },
    { id: 'table', label: 'Table', icon: '⊞' },
    { id: 'list', label: 'List', icon: '☰' },
    { id: 'gantt', label: 'Gantt', icon: '📅' },
    { id: 'calendar', label: 'Calendar', icon: '🗓' },
  ]

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#111118]">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-white/8 bg-[#13131A] shrink-0">
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === t.id
                  ? 'bg-[#7B68EE] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-xs">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 w-48">
            <span className="text-gray-500 text-sm">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none flex-1"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors">
            ⧗ Filter
          </button>
          <button
            onClick={() => addRow()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#7B68EE] hover:bg-[#6A5ACD] rounded-lg transition-colors shadow-sm"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Page header */}
      <div className="px-8 pt-6 pb-4 shrink-0 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{page.icon}</span>
          <h1 className="text-2xl font-bold text-white">{page.title}</h1>
          <span className="text-xs text-gray-600 bg-white/5 px-2 py-1 rounded-full">{rows.length} items</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        {loading ? (
          <div className="flex items-center gap-3 text-gray-500 py-16">
            <div className="w-4 h-4 border-2 border-[#7B68EE] border-t-transparent rounded-full animate-spin" />
            Loading…
          </div>
        ) : view === 'table' ? (
          <TableView columns={columns} rows={filteredRows} pageId={page.id} onAddRow={() => addRow()} onUpdateRow={updateRow} onDeleteRow={deleteRow} onAddColumn={addColumn} />
        ) : view === 'kanban' ? (
          <KanbanView columns={columns} rows={filteredRows} onAddRow={addRow} onUpdateRow={updateRow} onDeleteRow={deleteRow} onCardClick={setOpenRow} />
        ) : view === 'list' ? (
          <ListView columns={columns} rows={filteredRows} onAddRow={() => addRow()} onDeleteRow={deleteRow} onRowClick={setOpenRow} />
        ) : view === 'gantt' ? (
          <GanttView columns={columns} rows={filteredRows} onRowClick={setOpenRow} />
        ) : (
          <CalendarView columns={columns} rows={filteredRows} onRowClick={setOpenRow} />
        )}
      </div>

      {/* Card detail modal */}
      <CardModal
        row={openRow}
        columns={columns}
        onClose={() => setOpenRow(null)}
        onUpdate={updateRow}
        onDelete={deleteRow}
      />
    </div>
  )
}
