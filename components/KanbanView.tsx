'use client'

import { useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { DbColumn, DbRow } from '@/lib/types'

interface Props {
  columns: DbColumn[]
  rows: DbRow[]
  onAddRow: (statusValue?: string) => void
  onUpdateRow: (rowId: string, data: Record<string, string | number | boolean>) => void
  onDeleteRow: (rowId: string) => void
  onCardClick: (row: DbRow) => void
}

const TAG_COLORS: Record<string, string> = {
  'Open': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  'TOFU': 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  'BOFU': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  'MOFU': 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
  'Important': 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  'Urgent': 'bg-red-500/20 text-red-400 border border-red-500/30',
  'In-progress': 'bg-blue-600/20 text-blue-300 border border-blue-500/30',
  'default': 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
}

const PRIORITY_ICON: Record<string, string> = {
  'Urgent': '🔴',
  'High': '🟠',
  'Medium': '🟡',
  'Low': '🟢',
}

const STATUS_COLORS: Record<string, { bg: string; header: string; dot: string }> = {
  'Research': { bg: 'bg-[#1E1E28]', header: 'text-blue-400', dot: 'bg-blue-400' },
  'Content brief': { bg: 'bg-[#1E1E28]', header: 'text-purple-400', dot: 'bg-purple-400' },
  'Production': { bg: 'bg-[#1E1E28]', header: 'text-emerald-400', dot: 'bg-emerald-400' },
  'Review': { bg: 'bg-[#1E1E28]', header: 'text-orange-400', dot: 'bg-orange-400' },
  'Published': { bg: 'bg-[#1E1E28]', header: 'text-gray-400', dot: 'bg-gray-400' },
  '': { bg: 'bg-[#1E1E28]', header: 'text-gray-400', dot: 'bg-gray-500' },
}

function TagBadge({ tag }: { tag: string }) {
  const cls = TAG_COLORS[tag] ?? TAG_COLORS['default']
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${cls}`}>{tag}</span>
}

function Avatar({ emoji }: { emoji: string }) {
  return (
    <div className="w-6 h-6 rounded-full bg-[#2E2E3A] border-2 border-[#1A1A24] flex items-center justify-center text-xs -ml-1 first:ml-0">
      {emoji}
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  if (!value) return null
  const color = value >= 80 ? 'bg-emerald-500' : value >= 40 ? 'bg-blue-500' : 'bg-gray-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] text-gray-400 shrink-0">{value}%</span>
    </div>
  )
}

function KanbanCard({
  row,
  cols,
  onDelete,
  onClick,
}: {
  row: DbRow
  cols: { task?: string; status?: string; priority?: string; tags?: string; assignees?: string; due?: string; progress?: string; time?: string; comments?: string; taskId?: string }
  onDelete: () => void
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: row.id })
  const d = row.data

  const title = cols.task ? String(d[cols.task] ?? '') : ''
  const tags = cols.tags ? String(d[cols.tags] ?? '').split(',').map(t => t.trim()).filter(Boolean) : []
  const assignees = cols.assignees ? String(d[cols.assignees] ?? '').split(',').map(a => a.trim()).filter(Boolean) : []
  const due = cols.due ? String(d[cols.due] ?? '') : ''
  const progress = cols.progress ? Number(d[cols.progress] ?? 0) : 0
  const time = cols.time ? String(d[cols.time] ?? '') : ''
  const comments = cols.comments ? Number(d[cols.comments] ?? 0) : 0
  const taskId = cols.taskId ? String(d[cols.taskId] ?? '') : ''
  const priority = cols.priority ? String(d[cols.priority] ?? '') : ''

  const dueFmt = due ? new Date(due).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : ''

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined, opacity: isDragging ? 0.4 : 1 }}
      className="group bg-[#1A1A24] border border-white/8 rounded-xl p-3.5 mb-2.5 cursor-grab active:cursor-grabbing hover:border-white/15 transition-all hover:shadow-lg hover:shadow-black/20"
      onClick={e => { if (!isDragging) onClick() }}
    >
      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {tags.map(t => <TagBadge key={t} tag={t} />)}
        </div>
      )}

      {/* Title */}
      <div className="flex items-start gap-2 mb-3">
        <p className="text-sm font-medium text-white leading-snug flex-1">{title || 'Untitled'}</p>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-xs shrink-0 mt-0.5"
        >✕</button>
      </div>

      {/* Meta rows */}
      <div className="space-y-1.5 mb-3">
        {taskId && (
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span className="text-gray-600">#</span>
            <span>Task ID</span>
            <span className="ml-auto text-gray-400">{taskId}</span>
          </div>
        )}
        {assignees.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span>👤</span>
            <span>Assignees</span>
            <div className="ml-auto flex">
              {assignees.map((a, i) => <Avatar key={i} emoji={a} />)}
            </div>
          </div>
        )}
        {dueFmt && (
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span>📅</span>
            <span>Due date</span>
            <span className="ml-auto text-gray-400">{dueFmt}</span>
          </div>
        )}
        {progress > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span>📈</span>
            <span>Progress</span>
            <div className="ml-auto w-24">
              <ProgressBar value={progress} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center pt-2 border-t border-white/5">
        {comments > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-gray-500">
            <span>💬</span> {comments}
          </span>
        )}
        <div className="flex-1" />
        {priority && (
          <span className="text-xs mr-2" title={priority}>{PRIORITY_ICON[priority] ?? ''}</span>
        )}
        {time && (
          <span className="text-[11px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">{time}</span>
        )}
      </div>
    </div>
  )
}

function KanbanColumn({
  status,
  theme,
  rows,
  colKeys,
  onAddRow,
  onDeleteRow,
  onCardClick,
}: {
  status: string
  theme: { bg: string; header: string; dot: string }
  rows: DbRow[]
  colKeys: Record<string, string | undefined>
  onAddRow: () => void
  onDeleteRow: (id: string) => void
  onCardClick: (row: DbRow) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status || '__none__' })

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2 h-2 rounded-full ${theme.dot}`} />
        <h3 className={`font-semibold text-sm ${theme.header}`}>{status || 'No Status'}</h3>
        <span className="text-xs text-gray-500 bg-white/5 px-1.5 py-0.5 rounded-full">{rows.length}</span>
        <div className="flex-1" />
        <button className="text-gray-600 hover:text-gray-400 text-sm w-5 h-5 flex items-center justify-center rounded hover:bg-white/5">+</button>
        <button className="text-gray-600 hover:text-gray-400 text-xs w-5 h-5 flex items-center justify-center rounded hover:bg-white/5">👤</button>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[80px] rounded-xl transition-colors ${isOver ? 'bg-white/5' : ''}`}
      >
        {rows.map(row => (
          <KanbanCard
            key={row.id}
            row={row}
            cols={colKeys}
            onDelete={() => onDeleteRow(row.id)}
            onClick={() => onCardClick(row)}
          />
        ))}
        <button
          onClick={onAddRow}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-400 hover:bg-white/5 rounded-lg transition-colors"
        >
          <span>+</span> New card
        </button>
      </div>
    </div>
  )
}

export default function KanbanView({ columns, rows, onAddRow, onUpdateRow, onDeleteRow, onCardClick }: Props) {
  const statusCol = columns.find(c => c.name === 'Status') ?? columns.find(c => c.type === 'select')

  const colKeys = useMemo(() => {
    const find = (name: string) => columns.find(c => c.name.toLowerCase().includes(name.toLowerCase()))?.id
    return {
      task: find('task'),
      status: find('status'),
      priority: find('priority'),
      tags: find('tags'),
      assignees: find('assignee'),
      due: find('due'),
      progress: find('progress'),
      time: find('time'),
      comments: find('comment'),
      taskId: find('task id'),
    }
  }, [columns])

  const statuses = useMemo(() => {
    if (!statusCol) return ['']
    return statusCol.options.length > 0 ? statusCol.options : ['']
  }, [statusCol])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || !statusCol) return
    const targetStatus = over.id === '__none__' ? '' : String(over.id)
    onUpdateRow(String(active.id), { [statusCol.id]: targetStatus })
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-5 overflow-x-auto pb-4 pt-1">
        {statuses.map(status => {
          const colRows = rows.filter(r => {
            const val = statusCol ? String(r.data[statusCol.id] ?? '') : ''
            return val === status
          })
          const theme = STATUS_COLORS[status] ?? STATUS_COLORS['']
          return (
            <KanbanColumn
              key={status || '__none__'}
              status={status}
              theme={theme}
              rows={colRows}
              colKeys={colKeys}
              onAddRow={() => onAddRow(status)}
              onDeleteRow={onDeleteRow}
              onCardClick={onCardClick}
            />
          )
        })}
      </div>
    </DndContext>
  )
}
