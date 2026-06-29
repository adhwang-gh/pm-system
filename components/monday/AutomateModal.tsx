'use client'

import { useEffect, useState } from 'react'

const GOLD = '#3D5A80'
const BG = '#FFFFFF'
const SURFACE = '#F3F3F0'
const BORDER = '#DDDDD8'
const TEXT = '#1A1A18'
const MUTED = '#9A9A92'

interface Automation {
  id: string; board_id: string; name: string; trigger_type: string
  trigger_config: Record<string, string>; action_type: string; action_config: Record<string, string>
  active: number; run_count: number; last_run: string | null; created_at: string
}

interface Column { id: string; title: string; type: string }

const STATUS_OPTIONS = ['Not Started', 'Working on it', 'Done', 'Stuck']
const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low']
const TRIGGER_TYPES = [{ value: 'status_change', label: 'Status changes to…' }, { value: 'item_created', label: 'Item is created' }]
const ACTION_TYPES = [{ value: 'set_field', label: 'Set a field to…' }, { value: 'assign_pm', label: 'Assign team member…' }]

function formatRunTime(lastRun: string | null) {
  if (!lastRun) return 'Never'
  return new Date(lastRun + 'Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const selectStyle: React.CSSProperties = { width: '100%', background: '#FAFAF8', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '7px 10px', color: TEXT, fontSize: 12, outline: 'none', boxSizing: 'border-box' }
const inputStyle: React.CSSProperties = { ...selectStyle, fontFamily: 'inherit' }
const labelStyle: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, display: 'block' }

export default function AutomateModal({ boardId, onClose }: { boardId: string; onClose: () => void }) {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [triggerType, setTriggerType] = useState('status_change')
  const [triggerColId, setTriggerColId] = useState('')
  const [triggerValue, setTriggerValue] = useState('')
  const [actionType, setActionType] = useState('set_field')
  const [actionColId, setActionColId] = useState('')
  const [actionValue, setActionValue] = useState('')
  const [automName, setAutomName] = useState('')

  useEffect(() => {
    fetch(`/monday/api/boards/${boardId}/automations`).then(r => r.json()).then(setAutomations)
    fetch(`/monday/api/boards/${boardId}`).then(r => r.json()).then(d => setColumns(d.columns ?? []))
  }, [boardId])

  const statusCols = columns.filter(c => c.type === 'status')
  const allCols = columns

  const toggle = async (autom: Automation) => {
    const res = await fetch(`/monday/api/boards/${boardId}/automations`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ automId: autom.id, active: autom.active === 0 }),
    })
    const updated = await res.json()
    setAutomations(prev => prev.map(a => a.id === updated.id ? updated : a))
  }

  const deleteAutom = async (automId: string) => {
    await fetch(`/monday/api/boards/${boardId}/automations`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ automId }),
    })
    setAutomations(prev => prev.filter(a => a.id !== automId))
  }

  const resetForm = () => { setTriggerType('status_change'); setTriggerColId(''); setTriggerValue(''); setActionType('set_field'); setActionColId(''); setActionValue(''); setAutomName('') }

  const buildName = () => {
    const tl = triggerType === 'item_created' ? 'When item created' : `When status → ${triggerValue || '?'}`
    const al = actionType === 'assign_pm' ? `assign ${actionValue}` : `set ${columns.find(c => c.id === actionColId)?.title ?? actionColId} = ${actionValue}`
    return `${tl}, ${al}`
  }

  const save = async () => {
    setSaving(true)
    const trigger_config = triggerType === 'status_change' ? { col_id: triggerColId, value: triggerValue } : {}
    const action_config = actionType === 'set_field' ? { col_id: actionColId, value: actionValue } : { col_id: actionColId, member_key: actionValue }
    const name = automName.trim() || buildName()
    const res = await fetch(`/monday/api/boards/${boardId}/automations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, trigger_type: triggerType, trigger_config, action_type: actionType, action_config }),
    })
    const created = await res.json()
    setAutomations(prev => [...prev, created])
    setSaving(false); setAdding(false); resetForm()
  }

  const canSave = triggerType === 'item_created' ? actionColId && actionValue : triggerColId && triggerValue && actionColId && actionValue
  const selectedTriggerCol = columns.find(c => c.id === triggerColId)
  const selectedActionCol = columns.find(c => c.id === actionColId)
  const getValueOptions = (col: Column | undefined) => { if (!col) return []; if (col.type === 'status') return STATUS_OPTIONS; if (col.type === 'priority') return PRIORITY_OPTIONS; return [] }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }} onClick={onClose}>
      <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 18, boxShadow: '0 24px 64px rgba(0,0,0,0.10)', width: 580, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: `1px solid ${BORDER}` }}>
          <div>
            <div style={{ color: '#1A1A18', fontWeight: 700, fontSize: 16 }}>Automations</div>
            <div style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>Rules that run automatically when conditions are met</div>
          </div>
          <button onClick={onClose} style={{ color: MUTED, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {automations.length === 0 && !adding && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: MUTED }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⚡</div>
              <p style={{ fontWeight: 600, color: '#6B7280', margin: 0 }}>No automations yet</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Add one below to get started</p>
            </div>
          )}

          {automations.map(autom => (
            <div key={autom.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, border: `1px solid ${autom.active ? BORDER : '#F5F5F2'}`, borderRadius: 14, background: SURFACE, opacity: autom.active ? 1 : 0.55, transition: 'all 0.15s' }}>
              {/* Toggle */}
              <button onClick={() => toggle(autom)} style={{ marginTop: 2, flexShrink: 0, width: 36, height: 20, borderRadius: 99, background: autom.active ? GOLD : '#333', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 2, width: 16, height: 16, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', transition: 'transform 0.2s', transform: autom.active ? 'translateX(18px)' : 'translateX(2px)' }} />
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, lineHeight: 1.4 }}>{autom.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>Ran {autom.run_count} time{autom.run_count !== 1 ? 's' : ''}</span>
                  {autom.last_run && <span style={{ fontSize: 11, color: '#6B7280' }}>Last: {formatRunTime(autom.last_run)}</span>}
                  <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 99, fontWeight: 800, textTransform: 'uppercase', background: autom.active ? `${GOLD}20` : '#222', color: autom.active ? GOLD : '#444', letterSpacing: '0.05em' }}>{autom.active ? 'Active' : 'Paused'}</span>
                </div>
              </div>

              <button onClick={() => deleteAutom(autom.id)} style={{ color: '#374151', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, flexShrink: 0, marginTop: 2 }}>✕</button>
            </div>
          ))}

          {adding && (
            <div style={{ border: `1px solid ${GOLD}44`, borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, background: `${GOLD}06` }}>
              <div style={{ color: '#D0D0D0', fontWeight: 700, fontSize: 13 }}>New Automation</div>

              <div>
                <label style={labelStyle}>Name (optional)</label>
                <input value={automName} onChange={e => setAutomName(e.target.value)} placeholder={buildName() || 'Auto-generated'} style={inputStyle} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>When…</label>
                <select value={triggerType} onChange={e => { setTriggerType(e.target.value); setTriggerColId(''); setTriggerValue('') }} style={selectStyle}>
                  {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {triggerType === 'status_change' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={triggerColId} onChange={e => { setTriggerColId(e.target.value); setTriggerValue('') }} style={{ ...selectStyle, flex: 1 }}>
                      <option value="">Pick column…</option>
                      {(statusCols.length > 0 ? statusCols : allCols).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <select value={triggerValue} onChange={e => setTriggerValue(e.target.value)} disabled={!triggerColId} style={{ ...selectStyle, flex: 1, opacity: triggerColId ? 1 : 0.4 }}>
                      <option value="">Pick value…</option>
                      {getValueOptions(selectedTriggerCol).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>Then…</label>
                <select value={actionType} onChange={e => { setActionType(e.target.value); setActionColId(''); setActionValue('') }} style={selectStyle}>
                  {ACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {actionType === 'set_field' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={actionColId} onChange={e => { setActionColId(e.target.value); setActionValue('') }} style={{ ...selectStyle, flex: 1 }}>
                      <option value="">Pick column…</option>
                      {allCols.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    {selectedActionCol && getValueOptions(selectedActionCol).length > 0 ? (
                      <select value={actionValue} onChange={e => setActionValue(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                        <option value="">Pick value…</option>
                        {getValueOptions(selectedActionCol).map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    ) : (
                      <input value={actionValue} onChange={e => setActionValue(e.target.value)} placeholder="Value…" disabled={!actionColId} style={{ ...inputStyle, flex: 1, opacity: actionColId ? 1 : 0.4 }} />
                    )}
                  </div>
                )}
                {actionType === 'assign_pm' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={actionColId} onChange={e => setActionColId(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                      <option value="">Pick PM column…</option>
                      {(allCols.filter(c => c.type === 'person').length > 0 ? allCols.filter(c => c.type === 'person') : allCols).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <select value={actionValue} onChange={e => setActionValue(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                      <option value="">Pick person…</option>
                      {/* Person options loaded dynamically — placeholder */}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button onClick={() => { setAdding(false); resetForm() }} style={{ padding: '8px 16px', border: `1px solid ${BORDER}`, color: MUTED, background: 'transparent', borderRadius: 10, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                <button onClick={save} disabled={saving || !canSave} style={{ flex: 1, padding: '8px 0', background: canSave ? GOLD : '#333', color: canSave ? '#000' : '#555', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: canSave ? 'pointer' : 'default', transition: 'all 0.15s' }}>
                  {saving ? 'Saving…' : 'Create Automation'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!adding && (
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${BORDER}` }}>
            <button onClick={() => setAdding(true)} style={{ width: '100%', padding: '10px 0', border: `1px dashed ${GOLD}44`, color: GOLD, background: 'transparent', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              + Add Automation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
