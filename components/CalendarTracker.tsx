'use client'

import { useEffect, useState, useCallback } from 'react'

interface CalEvent { id: string; title: string; date: string; end_date: string | null; time: string; color: string; description: string }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const COLORS = ['#7B68EE','#3B82F6','#10B981','#F59E0B','#EF4444','#EC4899','#8B5CF6','#06B6D4']

function EventModal({ event, onSave, onDelete, onClose }: {
  event: Partial<CalEvent> | null
  onSave: (e: Partial<CalEvent>) => void
  onDelete?: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState<Partial<CalEvent>>(event ?? {})
  if (!event) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1A1A24] border border-white/10 rounded-2xl shadow-2xl w-[440px] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-lg">{form.id ? 'Edit Event' : 'New Event'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Title</label>
            <input autoFocus value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Event title…"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#7B68EE] transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Date</label>
              <input type="date" value={form.date ?? ''} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#7B68EE] [color-scheme:dark]" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Time (optional)</label>
              <input type="time" value={form.time ?? ''} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#7B68EE] [color-scheme:dark]" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">End date (optional)</label>
            <input type="date" value={form.end_date ?? ''} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#7B68EE] [color-scheme:dark]" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <textarea value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Notes…" rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#7B68EE] resize-none transition-colors" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${form.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => { if (form.title && form.date) onSave(form) }}
            className="flex-1 bg-[#7B68EE] hover:bg-[#6A5ACD] text-white py-2 rounded-lg text-sm font-semibold transition-colors">
            {form.id ? 'Update' : 'Create'} Event
          </button>
          {form.id && onDelete && (
            <button onClick={onDelete} className="px-4 py-2 text-red-400 hover:text-red-300 text-sm border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors">Delete</button>
          )}
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-sm border border-white/10 rounded-lg hover:bg-white/5 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function CalendarTracker() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [date, setDate] = useState(new Date())
  const [modal, setModal] = useState<Partial<CalEvent> | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month')

  const load = useCallback(async () => {
    const res = await fetch('/api/calendar')
    setEvents(await res.json())
  }, [])

  useEffect(() => { load() }, [load])

  const saveEvent = async (form: Partial<CalEvent>) => {
    if (form.id) {
      await fetch('/api/calendar', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    } else {
      await fetch('/api/calendar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    await load()
    setModal(null)
  }

  const deleteEvent = async (id: string) => {
    await fetch('/api/calendar', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    await load()
    setModal(null)
  }

  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const isToday = (d: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d

  const eventsForDay = (d: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return events.filter(e => {
      if (e.date === dateStr) return true
      if (e.end_date && e.date <= dateStr && e.end_date >= dateStr) return true
      return false
    })
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)
  while (cells.length % 7 !== 0) cells.push(null)

  // Upcoming events for agenda strip
  const upcomingStr = new Date().toISOString().slice(0, 10)
  const upcoming = events.filter(e => e.date >= upcomingStr).slice(0, 5)

  return (
    <div className="flex-1 overflow-y-auto bg-[#111118]">
      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Calendar</h1>
            <p className="text-gray-500 text-sm">Schedule and track events</p>
          </div>
          <div className="flex-1" />
          {/* View switcher */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {(['month', 'week', 'agenda'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${viewMode === v ? 'bg-[#7B68EE] text-white' : 'text-gray-400 hover:text-white'}`}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => setModal({ color: '#7B68EE', date: new Date().toISOString().slice(0,10) })}
            className="flex items-center gap-2 px-4 py-2 bg-[#7B68EE] hover:bg-[#6A5ACD] text-white rounded-lg text-sm font-semibold transition-colors">
            + New Event
          </button>
        </div>

        {/* Month nav */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setDate(new Date(year, month - 1, 1))}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center">‹</button>
          <h2 className="text-lg font-semibold text-white w-44 text-center">{MONTHS[month]} {year}</h2>
          <button onClick={() => setDate(new Date(year, month + 1, 1))}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center">›</button>
          <button onClick={() => setDate(new Date())}
            className="px-3 py-1 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">Today</button>
        </div>

        {viewMode === 'agenda' ? (
          // Agenda view
          <div className="space-y-2">
            {events.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <div className="text-5xl mb-3">📅</div>
                <p>No events yet. Click + New Event to get started.</p>
              </div>
            ) : (
              events.sort((a, b) => a.date.localeCompare(b.date)).map(ev => (
                <div key={ev.id} onClick={() => setModal(ev)}
                  className="flex items-start gap-4 p-4 bg-[#1A1A24] border border-white/8 rounded-xl hover:border-white/15 cursor-pointer transition-all group">
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium text-sm">{ev.title}</span>
                      {ev.time && <span className="text-xs text-gray-500">{ev.time}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {new Date(ev.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                      {ev.end_date && ev.end_date !== ev.date && ` → ${new Date(ev.end_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </div>
                    {ev.description && <p className="text-xs text-gray-600 mt-1 truncate">{ev.description}</p>}
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteEvent(ev.id) }}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-sm transition-all">✕</button>
                </div>
              ))
            )}
          </div>
        ) : (
          // Month/Week grid
          <div className="bg-[#13131A] rounded-2xl border border-white/8 overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-white/8">
              {DAYS.map(d => (
                <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">{d}</div>
              ))}
            </div>
            {/* Calendar cells */}
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                const dayEvents = day ? eventsForDay(day) : []
                return (
                  <div key={i}
                    className={`min-h-[110px] p-2 border-b border-r border-white/5 flex flex-col ${day ? 'cursor-pointer hover:bg-white/3' : 'bg-[#0F0F15]'} transition-colors`}
                    onClick={() => day && setModal({ color: '#7B68EE', date: `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` })}
                  >
                    {day && (
                      <>
                        <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday(day) ? 'bg-[#7B68EE] text-white' : 'text-gray-400'}`}>
                          {day}
                        </div>
                        <div className="space-y-0.5 flex-1">
                          {dayEvents.slice(0, 3).map(ev => (
                            <div key={ev.id}
                              onClick={e => { e.stopPropagation(); setModal(ev) }}
                              className="text-[11px] text-white rounded px-1.5 py-0.5 truncate hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: ev.color + 'CC' }}>
                              {ev.time && <span className="opacity-70 mr-1">{ev.time.slice(0,5)}</span>}
                              {ev.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-gray-500">+{dayEvents.length - 3} more</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Upcoming strip */}
        {viewMode !== 'agenda' && upcoming.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Upcoming</h3>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {upcoming.map(ev => (
                <div key={ev.id} onClick={() => setModal(ev)}
                  className="shrink-0 bg-[#1A1A24] border border-white/8 rounded-xl p-3 w-44 cursor-pointer hover:border-white/20 transition-all">
                  <div className="w-2 h-2 rounded-full mb-2" style={{ backgroundColor: ev.color }} />
                  <p className="text-sm font-medium text-white truncate">{ev.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(ev.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  {ev.time && <p className="text-xs text-gray-600">{ev.time}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <EventModal
        event={modal}
        onSave={saveEvent}
        onDelete={modal?.id ? () => deleteEvent(modal.id!) : undefined}
        onClose={() => setModal(null)}
      />
    </div>
  )
}
