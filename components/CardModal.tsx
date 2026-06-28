'use client'

import { useState, useEffect, useRef } from 'react'
import { DbColumn, DbRow } from '@/lib/types'

interface Props {
  row: DbRow | null
  columns: DbColumn[]
  onClose: () => void
  onUpdate: (rowId: string, data: Record<string, string | number | boolean>) => void
  onDelete: (rowId: string) => void
}

const TAG_COLORS: Record<string, string> = {
  'Open': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'TOFU': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'BOFU': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'MOFU': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Important': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Urgent': 'bg-red-500/20 text-red-400 border-red-500/30',
  'In-progress': 'bg-blue-600/20 text-blue-300 border-blue-500/30',
}

function FieldRow({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2 group">
      <div className="flex items-center gap-2 w-36 shrink-0 text-gray-500 text-sm pt-1">
        <span className="text-xs">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export default function CardModal({ row, columns, onClose, onUpdate, onDelete }: Props) {
  const [data, setData] = useState<Record<string, string | number | boolean>>(row?.data ?? {})
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (row) {
      setData(row.data)
      setTimeout(() => titleRef.current?.focus(), 50)
    }
  }, [row?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!row) return null

  const col = (name: string) => columns.find(c => c.name.toLowerCase().includes(name.toLowerCase()))
  const titleCol = col('task') ?? columns[0]
  const statusCol = col('status')
  const priorityCol = col('priority')
  const tagsCol = col('tags')
  const assigneesCol = col('assignee')
  const dueCol = col('due')
  const progressCol = col('progress')
  const timeCol = col('time')
  const commentsCol = col('comment')
  const taskIdCol = col('task id')

  const save = (colId: string, value: string | number | boolean) => {
    const updated = { ...data, [colId]: value }
    setData(updated)
    onUpdate(row.id, { [colId]: value })
  }

  const tags = tagsCol ? String(data[tagsCol.id] ?? '').split(',').map(t => t.trim()).filter(Boolean) : []
  const status = statusCol ? String(data[statusCol.id] ?? '') : ''
  const priority = priorityCol ? String(data[priorityCol.id] ?? '') : ''
  const progress = progressCol ? Number(data[progressCol.id] ?? 0) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[580px] h-full bg-[#13131A] border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2 flex-1">
            {taskIdCol && <span className="text-xs text-gray-600 font-mono">{String(data[taskIdCol.id] ?? '')}</span>}
            {status && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">{status}</span>
            )}
          </div>
          <button
            onClick={() => { onDelete(row.id); onClose() }}
            className="text-gray-600 hover:text-red-400 text-sm px-2 py-1 rounded hover:bg-white/5 transition-colors"
          >
            🗑 Delete
          </button>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Title */}
          {titleCol && (
            <input
              ref={titleRef}
              value={String(data[titleCol.id] ?? '')}
              onChange={e => save(titleCol.id, e.target.value)}
              placeholder="Task title…"
              className="w-full text-2xl font-bold text-white bg-transparent outline-none placeholder-gray-700 mb-6 leading-tight"
            />
          )}

          {/* Tags */}
          {tagsCol && (
            <div className="mb-5">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map(t => (
                  <span key={t} className={`text-xs px-2 py-0.5 rounded border font-semibold ${TAG_COLORS[t] ?? 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>{t}</span>
                ))}
              </div>
              <input
                value={String(data[tagsCol.id] ?? '')}
                onChange={e => save(tagsCol.id, e.target.value)}
                placeholder="Tags (comma separated: TOFU, Important…)"
                className="text-xs text-gray-500 bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/5 focus:border-[#7B68EE]/50 w-full transition-colors"
              />
            </div>
          )}

          <div className="space-y-1 bg-[#1A1A24] rounded-xl px-4 py-2 border border-white/5 mb-5">
            {statusCol && (
              <FieldRow label="Status" icon="🔵">
                <select
                  value={String(data[statusCol.id] ?? '')}
                  onChange={e => save(statusCol.id, e.target.value)}
                  className="bg-transparent text-sm text-white outline-none cursor-pointer hover:text-[#7B68EE] transition-colors w-full"
                >
                  <option value="" className="bg-[#1A1A24]">—</option>
                  {statusCol.options.map(o => <option key={o} value={o} className="bg-[#1A1A24]">{o}</option>)}
                </select>
              </FieldRow>
            )}
            {priorityCol && (
              <FieldRow label="Priority" icon="🚦">
                <select
                  value={String(data[priorityCol.id] ?? '')}
                  onChange={e => save(priorityCol.id, e.target.value)}
                  className="bg-transparent text-sm text-white outline-none cursor-pointer hover:text-[#7B68EE] transition-colors w-full"
                >
                  <option value="" className="bg-[#1A1A24]">—</option>
                  {priorityCol.options.map(o => <option key={o} value={o} className="bg-[#1A1A24]">{o}</option>)}
                </select>
              </FieldRow>
            )}
            {assigneesCol && (
              <FieldRow label="Assignees" icon="👤">
                <input
                  value={String(data[assigneesCol.id] ?? '')}
                  onChange={e => save(assigneesCol.id, e.target.value)}
                  placeholder="🧑‍💻, 👩‍🎨…"
                  className="bg-transparent text-sm text-white outline-none placeholder-gray-700 w-full"
                />
              </FieldRow>
            )}
            {dueCol && (
              <FieldRow label="Due date" icon="📅">
                <input
                  type="date"
                  value={String(data[dueCol.id] ?? '')}
                  onChange={e => save(dueCol.id, e.target.value)}
                  className="bg-transparent text-sm text-white outline-none cursor-pointer [color-scheme:dark] w-full"
                />
              </FieldRow>
            )}
            {timeCol && (
              <FieldRow label="Time estimate" icon="⏱">
                <input
                  value={String(data[timeCol.id] ?? '')}
                  onChange={e => save(timeCol.id, e.target.value)}
                  placeholder="e.g. 2h, 1d…"
                  className="bg-transparent text-sm text-white outline-none placeholder-gray-700 w-full"
                />
              </FieldRow>
            )}
            {taskIdCol && (
              <FieldRow label="Task ID" icon="#">
                <input
                  value={String(data[taskIdCol.id] ?? '')}
                  onChange={e => save(taskIdCol.id, e.target.value)}
                  placeholder="#235645"
                  className="bg-transparent text-sm text-gray-400 outline-none placeholder-gray-700 font-mono w-full"
                />
              </FieldRow>
            )}
          </div>

          {/* Progress */}
          {progressCol && (
            <div className="bg-[#1A1A24] rounded-xl px-4 py-3 border border-white/5 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Progress</span>
                <span className="text-sm font-semibold text-white">{progress}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${progress >= 80 ? 'bg-emerald-500' : progress >= 40 ? 'bg-blue-500' : 'bg-gray-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={e => save(progressCol.id, Number(e.target.value))}
                className="w-full accent-[#7B68EE]"
              />
            </div>
          )}

          {/* Comments field */}
          {commentsCol && (
            <div className="bg-[#1A1A24] rounded-xl px-4 py-3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-gray-400">💬 Comments</span>
              </div>
              <input
                type="number"
                min={0}
                value={String(data[commentsCol.id] ?? 0)}
                onChange={e => save(commentsCol.id, Number(e.target.value))}
                className="bg-transparent text-sm text-white outline-none w-full"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
