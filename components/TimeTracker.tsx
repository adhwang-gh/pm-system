'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface TimeEntry { id: string; description: string; project: string; duration_minutes: number; started_at: string | null; created_at: string }

function fmtDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function fmtTimer(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

const PROJECT_COLORS: Record<string, string> = {}
const PALETTE = ['#7B68EE','#3B82F6','#10B981','#F59E0B','#EF4444','#EC4899','#06B6D4']
let colorIdx = 0
function projectColor(p: string) {
  if (!p) return '#4B5563'
  if (!PROJECT_COLORS[p]) { PROJECT_COLORS[p] = PALETTE[colorIdx++ % PALETTE.length] }
  return PROJECT_COLORS[p]
}

export default function TimeTracker() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [desc, setDesc] = useState('')
  const [project, setProject] = useState('')
  const [startTime, setStartTime] = useState<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const [manualDur, setManualDur] = useState('')
  const [manualDesc, setManualDesc] = useState('')
  const [manualProj, setManualProj] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/time')
    setEntries(await res.json())
  }, [])

  useEffect(() => { load() }, [load])

  const startTimer = () => {
    setRunning(true)
    setElapsed(0)
    const start = new Date()
    setStartTime(start)
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
  }

  const stopTimer = async () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    const minutes = Math.max(1, Math.round(elapsed / 60))
    const res = await fetch('/api/time', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: desc || 'Untitled task', project, duration_minutes: minutes, started_at: startTime?.toISOString() }),
    })
    const entry = await res.json()
    setEntries(prev => [entry, ...prev])
    setElapsed(0)
    setDesc('')
    setProject('')
  }

  const logManual = async () => {
    const parts = manualDur.match(/(\d+h)?\s*(\d+m)?/)
    let minutes = 0
    if (parts) {
      const h = parts[1] ? parseInt(parts[1]) : 0
      const m = parts[2] ? parseInt(parts[2]) : 0
      minutes = h * 60 + m
    }
    if (!minutes || !manualDesc) return
    const res = await fetch('/api/time', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: manualDesc, project: manualProj, duration_minutes: minutes }),
    })
    const entry = await res.json()
    setEntries(prev => [entry, ...prev])
    setManualDur(''); setManualDesc(''); setManualProj('')
  }

  const deleteEntry = async (id: string) => {
    await fetch('/api/time', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  // Stats
  const totalMins = entries.reduce((s, e) => s + e.duration_minutes, 0)
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayMins = entries.filter(e => e.created_at?.startsWith(todayStr)).reduce((s, e) => s + e.duration_minutes, 0)
  const projects = Array.from(new Set(entries.map(e => e.project).filter(Boolean)))
  const byProject = projects.map(p => ({
    name: p,
    minutes: entries.filter(e => e.project === p).reduce((s, e) => s + e.duration_minutes, 0)
  })).sort((a, b) => b.minutes - a.minutes)

  return (
    <div className="flex-1 overflow-y-auto bg-[#111118]">
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Time Tracker</h1>
          <p className="text-gray-500 text-sm">Track time spent on projects and tasks</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Today', value: fmtDuration(todayMins), icon: '☀️' },
            { label: 'Total logged', value: fmtDuration(totalMins), icon: '📊' },
            { label: 'Entries', value: entries.length, icon: '📋' },
          ].map(s => (
            <div key={s.label} className="bg-[#1A1A24] border border-white/8 rounded-xl p-4 flex items-center gap-4">
              <div className="text-2xl">{s.icon}</div>
              <div>
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Timer */}
          <div className="col-span-2 bg-[#1A1A24] border border-white/8 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Timer</h3>
            <div className="text-5xl font-mono font-bold text-white text-center mb-5 tabular-nums">
              {fmtTimer(elapsed)}
            </div>
            <div className="space-y-3 mb-5">
              <input value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="What are you working on?"
                disabled={running}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#7B68EE] disabled:opacity-50 transition-colors" />
              <input value={project} onChange={e => setProject(e.target.value)}
                placeholder="Project (optional)"
                disabled={running}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#7B68EE] disabled:opacity-50 transition-colors" />
            </div>
            <button
              onClick={running ? stopTimer : startTimer}
              className={`w-full py-3 rounded-xl text-white font-bold text-base transition-all shadow-lg ${running ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-[#7B68EE] hover:bg-[#6A5ACD] shadow-[#7B68EE]/20'}`}>
              {running ? '⏹ Stop & Save' : '▶ Start Timer'}
            </button>
          </div>

          {/* Manual log */}
          <div className="bg-[#1A1A24] border border-white/8 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Log Manually</h3>
            <div className="space-y-3">
              <input value={manualDesc} onChange={e => setManualDesc(e.target.value)}
                placeholder="Task description"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#7B68EE]" />
              <input value={manualProj} onChange={e => setManualProj(e.target.value)}
                placeholder="Project"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#7B68EE]" />
              <input value={manualDur} onChange={e => setManualDur(e.target.value)}
                placeholder="Duration: 2h 30m"
                onKeyDown={e => { if (e.key === 'Enter') logManual() }}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#7B68EE]" />
              <button onClick={logManual}
                className="w-full py-2 bg-white/8 hover:bg-white/15 text-white text-sm font-medium rounded-lg transition-colors border border-white/10">
                + Log Time
              </button>
            </div>
          </div>
        </div>

        {/* By project */}
        {byProject.length > 0 && (
          <div className="bg-[#1A1A24] border border-white/8 rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">By Project</h3>
            <div className="space-y-3">
              {byProject.map(p => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: projectColor(p.name) }} />
                      <span className="text-sm text-gray-300">{p.name}</span>
                    </div>
                    <span className="text-sm text-gray-400">{fmtDuration(p.minutes)}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(p.minutes / totalMins) * 100}%`, backgroundColor: projectColor(p.name) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent entries */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">History</h3>
          {entries.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              <div className="text-4xl mb-2">⏱</div>
              <p>No time entries yet. Start the timer above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map(e => (
                <div key={e.id} className="group flex items-center gap-4 px-4 py-3 bg-[#1A1A24] border border-white/8 rounded-xl hover:border-white/15 transition-all">
                  {e.project && <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: projectColor(e.project) }} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{e.description}</p>
                    {e.project && <p className="text-xs text-gray-500">{e.project}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-white">{fmtDuration(e.duration_minutes)}</div>
                    <div className="text-xs text-gray-600">{new Date(e.created_at).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => deleteEntry(e.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-sm transition-all shrink-0">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
