'use client'

import { useState, useRef, useEffect } from 'react'
import { MColumn } from './types'

const GOLD = '#C9A24B'
const BG = '#141414'
const SURFACE = '#1C1C1C'
const BORDER = '#2A2A2A'
const TEXT = '#EDE8DD'
const MUTED = '#8A8478'

export interface PMember {
  id: string
  name: string
  initials: string
  color: string
}

interface Props {
  col: MColumn
  value: string | number | undefined
  onChange: (v: string | number) => void
  userId?: string
}

function MemberAvatar({ member, size = 28 }: { member: PMember; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 800, fontSize: size * 0.36, flexShrink: 0 }} title={member.name}>
      {member.initials}
    </div>
  )
}

function getStatusColor(col: MColumn, value: string): string {
  const opts = col.options as { colors?: Record<string, string> }
  return opts?.colors?.[value] ?? '#333'
}

function getStatusValues(col: MColumn): string[] {
  const opts = col.options as { values?: string[] }
  return opts?.values ?? []
}

export default function MondayCell({ col, value, onChange, userId }: Props) {
  const [editing, setEditing] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')
  const [members, setMembers] = useState<PMember[]>([])
  const [addingName, setAddingName] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const str = String(value ?? '')

  // Fetch members when person picker opens
  useEffect(() => {
    if (col.type === 'person' && editing) {
      const h = userId ? { 'X-Pm-User-Id': userId } : {}
      fetch('/monday/api/members', { headers: h }).then(r => r.json()).then(setMembers).catch(() => {})
    }
  }, [col.type, editing])

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute', top: 38, left: 0, zIndex: 50,
    background: BG, border: `1px solid ${BORDER}`,
    borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
    minWidth: 160,
  }

  /* ── Status ── */
  if (col.type === 'status') {
    const color = str ? getStatusColor(col, str) : '#1A1A1A'
    const values = getStatusValues(col)
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <button onClick={() => setShowPicker(v => !v)}
          style={{ width: '100%', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer', background: color, color: str ? '#fff' : MUTED, letterSpacing: '0.06em', transition: 'opacity 0.1s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingLeft: 6, paddingRight: 6 }}>
          {str || '—'}
        </button>
        {showPicker && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowPicker(false)} />
            <div style={{ ...dropdownStyle, paddingTop: 4, paddingBottom: 4 }}>
              <div style={{ padding: '4px 12px 8px', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${BORDER}`, marginBottom: 4 }}>{col.title}</div>
              {values.map(v => (
                <button key={v} onClick={() => { onChange(v); setShowPicker(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: getStatusColor(col, v), flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: TEXT }}>{v}</span>
                </button>
              ))}
              <button onClick={() => { onChange(''); setShowPicker(false) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: 'none', border: 'none', cursor: 'pointer', borderTop: `1px solid ${BORDER}`, marginTop: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, border: `1px solid ${BORDER}`, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: MUTED }}>Clear</span>
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  /* ── Person ── */
  if (col.type === 'person') {
    const selectedIds = str ? str.split(',').filter(Boolean) : []
    const filtered = members.filter(m =>
      !search || m.name.toLowerCase().includes(search.toLowerCase())
    )

    const toggle = (id: string) => {
      const next = selectedIds.includes(id) ? selectedIds.filter(k => k !== id) : [...selectedIds, id]
      onChange(next.join(','))
    }

    const addMember = async () => {
      const name = addingName.trim()
      if (!name) return
      const h = userId ? { 'Content-Type': 'application/json', 'X-Pm-User-Id': userId } : { 'Content-Type': 'application/json' }
    const res = await fetch('/monday/api/members', { method: 'POST', headers: h, body: JSON.stringify({ name }) })
      const m = await res.json()
      setMembers(prev => [...prev, m])
      toggle(m.id)
      setAddingName('')
      setShowAddInput(false)
    }

    return (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 36, padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => { setEditing(v => !v); setSearch(''); setShowAddInput(false) }}>
          {selectedIds.length === 0 ? (
            <button style={{ width: 26, height: 26, borderRadius: '50%', border: `1px dashed ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: MUTED, background: 'none', cursor: 'pointer' }}>+</button>
          ) : (
            <div style={{ display: 'flex' }}>
              {selectedIds.slice(0, 3).map((id, i) => {
                const m = members.find(t => t.id === id)
                return m
                  ? <div key={id} style={{ marginLeft: i > 0 ? -6 : 0, border: '1px solid #0A0A0A', borderRadius: '50%' }}><MemberAvatar member={m} size={26} /></div>
                  : <div key={id} style={{ width: 26, height: 26, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: TEXT, marginLeft: i > 0 ? -6 : 0, border: '1px solid #0A0A0A' }}>?</div>
              })}
              {selectedIds.length > 3 && (
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: TEXT, marginLeft: -6, border: '1px solid #0A0A0A' }}>+{selectedIds.length - 3}</div>
              )}
            </div>
          )}
        </div>

        {editing && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => { setEditing(false); setSearch(''); setShowAddInput(false) }} />
            <div style={{ ...dropdownStyle, width: 240, overflow: 'hidden' }}>
              <div style={{ padding: 8, borderBottom: `1px solid ${BORDER}` }}>
                <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people…"
                  style={{ width: '100%', background: '#0D0D0D', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '5px 10px', fontSize: 12, color: TEXT, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}>
                {filtered.length === 0 && !showAddInput && (
                  <div style={{ padding: '8px 12px', fontSize: 12, color: MUTED }}>No people yet</div>
                )}
                {filtered.map(m => {
                  const selected = selectedIds.includes(m.id)
                  return (
                    <button key={m.id} onClick={() => toggle(m.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: selected ? `${GOLD}10` : 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <MemberAvatar member={m} size={26} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                      </div>
                      {selected && <span style={{ color: GOLD, fontSize: 12, flexShrink: 0 }}>✓</span>}
                    </button>
                  )
                })}
              </div>

              {/* Add person */}
              <div style={{ borderTop: `1px solid ${BORDER}`, padding: 8 }}>
                {showAddInput ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input autoFocus value={addingName} onChange={e => setAddingName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addMember(); if (e.key === 'Escape') { setShowAddInput(false); setAddingName('') } }}
                      placeholder="Full name…"
                      style={{ flex: 1, background: '#0D0D0D', border: `1px solid ${GOLD}55`, borderRadius: 6, padding: '4px 8px', fontSize: 12, color: TEXT, outline: 'none' }} />
                    <button onClick={addMember} style={{ fontSize: 11, background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontWeight: 700 }}>Add</button>
                  </div>
                ) : (
                  <button onClick={() => setShowAddInput(true)}
                    style={{ width: '100%', fontSize: 11, color: GOLD, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', textAlign: 'left', letterSpacing: '0.04em' }}>
                    + Add person
                  </button>
                )}
              </div>

              {selectedIds.length > 0 && (
                <div style={{ borderTop: `1px solid ${BORDER}`, padding: 8 }}>
                  <button onClick={() => { onChange(''); setEditing(false) }}
                    style={{ width: '100%', fontSize: 11, color: MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  /* ── Timeline ── */
  if (col.type === 'timeline') {
    const [start, end] = str.split('|')
    const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) } catch { return d } }
    const label = str ? `${fmtDate(start)} – ${fmtDate(end)}` : ''
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 36, padding: '0 6px', overflow: 'hidden' }}>
        {str ? (
          <button onClick={() => setEditing(true)}
            style={{ fontSize: 10, fontWeight: 500, color: TEXT, background: '#1C1C1C', border: `1px solid ${BORDER}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
            {label}
          </button>
        ) : (
          <button onClick={() => setEditing(true)} style={{ fontSize: 11, color: MUTED, background: 'none', border: 'none', cursor: 'pointer' }}>Set dates</button>
        )}
        {editing && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }} onClick={() => setEditing(false)}>
            <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20, width: 240, boxShadow: '0 8px 32px rgba(0,0,0,0.8)' }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F0F0F0', marginBottom: 14 }}>Timeline</div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Start date</label>
              <input type="date" defaultValue={start} id="tl-start"
                style={{ width: '100%', background: '#0D0D0D', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: TEXT, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>End date</label>
              <input type="date" defaultValue={end} id="tl-end"
                style={{ width: '100%', background: '#0D0D0D', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: TEXT, outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} />
              <button
                onClick={() => {
                  const s = (document.getElementById('tl-start') as HTMLInputElement)?.value
                  const e = (document.getElementById('tl-end') as HTMLInputElement)?.value
                  if (s && e) onChange(`${s}|${e}`)
                  setEditing(false)
                }}
                style={{ width: '100%', background: GOLD, color: '#000', border: 'none', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ── Text / default ── */
  if (editing) {
    return (
      <input ref={inputRef} autoFocus defaultValue={str}
        onBlur={e => { onChange(e.target.value); setEditing(false) }}
        onKeyDown={e => { if (e.key === 'Enter') { onChange(e.currentTarget.value); setEditing(false) } if (e.key === 'Escape') setEditing(false) }}
        style={{ width: '100%', height: 36, padding: '0 8px', fontSize: 12, outline: 'none', background: SURFACE, border: `1px solid ${GOLD}`, borderRadius: 0, color: TEXT, boxSizing: 'border-box' }}
      />
    )
  }

  return (
    <div onClick={() => setEditing(true)}
      style={{ height: 36, padding: '0 8px', display: 'flex', alignItems: 'center', fontSize: 12, color: str ? TEXT : '#333', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {str || '—'}
    </div>
  )
}
