'use client'

import { useEffect, useState, useCallback } from 'react'
import { PMember } from './MondayCell'

const GOLD = '#3D5A80'
const BORDER = '#E8E8E4'
const MUTED = '#9A9A92'
const TEXT = '#1A1A18'

interface Update {
  id: string
  member_key: string
  week_of: string
  progress: string
  plan: string
  problems: string
  products: string
  updated_at: string
}

interface Draft {
  progress: string
  plan: string
  problems: string
  products: string
}

function getSunday(date: Date): string {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() - d.getUTCDay())
  return d.toISOString().slice(0, 10)
}

function formatWeek(weekOf: string) {
  const d = new Date(weekOf + 'T00:00:00Z')
  const end = new Date(d)
  end.setUTCDate(d.getUTCDate() + 6)
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`
}

function MemberCard({ member, update, isEditing, onEdit, onSave, onCancel, isMe }: {
  member: PMember
  update: Update | undefined
  isEditing: boolean
  onEdit: () => void
  onSave: (draft: Draft) => void
  onCancel: () => void
  isMe: boolean
}) {
  const [draft, setDraft] = useState<Draft>({
    progress: update?.progress ?? '',
    plan: update?.plan ?? '',
    problems: update?.problems ?? '',
    products: update?.products ?? '',
  })

  useEffect(() => {
    setDraft({ progress: update?.progress ?? '', plan: update?.plan ?? '', problems: update?.problems ?? '', products: update?.products ?? '' })
  }, [update])

  const hasUpdate = update && (update.progress || update.plan || update.problems || update.products)
  const fields: { key: keyof Draft; label: string; placeholder: string }[] = [
    { key: 'progress', label: 'Progress', placeholder: 'What did you accomplish this week?' },
    { key: 'plan', label: 'Plan', placeholder: "What's the plan for next week?" },
    { key: 'problems', label: 'Problems', placeholder: 'Any blockers or challenges?' },
    { key: 'products', label: 'Products', placeholder: 'Which projects are you working on?' },
  ]

  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${isEditing ? GOLD + '44' : BORDER}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#FFFFFF', flexShrink: 0 }}>
          {member.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.name}{isMe && <span style={{ marginLeft: 6, fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '0.08em' }}>YOU</span>}
          </div>
          {hasUpdate && <div style={{ fontSize: 10, color: MUTED }}>Updated {new Date(update!.updated_at).toLocaleDateString()}</div>}
        </div>
        {isMe && (
          isEditing ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => onSave(draft)} style={{ fontSize: 11, background: GOLD, color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '4px 10px', cursor: 'pointer', fontWeight: 700 }}>Save</button>
              <button onClick={onCancel} style={{ fontSize: 11, color: MUTED, background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
            </div>
          ) : (
            <button onClick={onEdit} style={{ fontSize: 11, color: GOLD, background: 'transparent', border: `1px solid ${GOLD}44`, borderRadius: 10, padding: '4px 10px', cursor: 'pointer' }}>
              {hasUpdate ? 'Edit' : 'Add update'}
            </button>
          )
        )}
      </div>

      <div style={{ padding: '12px 16px' }}>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {fields.map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{f.label}</div>
                <textarea value={draft[f.key]} onChange={e => setDraft(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} rows={2}
                  style={{ width: '100%', background: '#FAFAF8', border: `1px solid #DDDDD8`, borderRadius: 7, padding: '7px 10px', fontSize: 12, color: TEXT, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
            ))}
          </div>
        ) : hasUpdate ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fields.filter(f => update![f.key]).map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: TEXT, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{update![f.key]}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#374151', fontStyle: 'italic', padding: '8px 0' }}>No update submitted yet</div>
        )}
      </div>
    </div>
  )
}

export default function WeeklyUpdatesView({ userId }: { userId?: string }) {
  const [members, setMembers] = useState<PMember[]>([])
  const [updates, setUpdates] = useState<Update[]>([])
  const [weekOf, setWeekOf] = useState(() => getSunday(new Date()))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [myMemberId, setMyMemberId] = useState('')

  useEffect(() => {
    setMyMemberId(localStorage.getItem('pm_user_member_id') ?? '')
  }, [])

  const pmHeaders: Record<string, string> = userId ? { 'X-Pm-User-Id': userId } : {}

  const load = useCallback(() => {
    fetch('/monday/api/members', { headers: pmHeaders }).then(r => r.json()).then(setMembers)
    fetch(`/monday/api/updates?week_of=${weekOf}`).then(r => r.json()).then(setUpdates)
  }, [weekOf, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const handleSave = async (memberId: string, draft: Draft) => {
    const res = await fetch('/monday/api/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_key: memberId, week_of: weekOf, ...draft }),
    })
    const saved = await res.json()
    setUpdates(prev => [...prev.filter(u => !(u.member_key === memberId && u.week_of === weekOf)), saved])
    setEditingId(null)
  }

  const isCurrentWeek = weekOf === getSunday(new Date())
  const submitted = updates.filter(u => u.progress || u.plan || u.problems || u.products).length

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F7F7F5', padding: '28px 32px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <h1 style={{ color: '#1A1A18', fontWeight: 700, fontSize: 22, margin: 0 }}>Weekly Updates</h1>
            <p style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>Progress · Plan · Problems · Products</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{submitted}/{members.length} submitted</span>
            <div style={{ width: 80, height: 4, background: '#E8E8E4', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ width: `${members.length ? (submitted / members.length) * 100 : 0}%`, height: '100%', background: GOLD, borderRadius: 10, transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <button onClick={() => { const d = new Date(weekOf + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 7); setWeekOf(d.toISOString().slice(0, 10)); setEditingId(null) }}
            style={{ background: '#F5F5F2', border: '1px solid #DDDDD8', borderRadius: 7, padding: '5px 12px', color: '#888', cursor: 'pointer', fontSize: 13 }}>← Prev</button>
          <div style={{ background: '#F5F5F2', border: `1px solid ${GOLD}55`, borderRadius: 10, padding: '5px 16px', color: GOLD, fontWeight: 600, fontSize: 13 }}>
            {formatWeek(weekOf)}{isCurrentWeek && <span style={{ marginLeft: 8, fontSize: 10, color: '#888', fontWeight: 400 }}>this week</span>}
          </div>
          <button onClick={() => { const d = new Date(weekOf + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 7); const n = d.toISOString().slice(0, 10); if (n <= getSunday(new Date())) { setWeekOf(n); setEditingId(null) } }}
            disabled={isCurrentWeek} style={{ background: '#F5F5F2', border: '1px solid #DDDDD8', borderRadius: 7, padding: '5px 12px', color: isCurrentWeek ? '#333' : '#888', cursor: isCurrentWeek ? 'default' : 'pointer', fontSize: 13 }}>Next →</button>
        </div>
      </div>

      {members.length === 0 ? (
        <div style={{ color: '#6B7280', textAlign: 'center', padding: '60px 0', fontSize: 14 }}>
          No team members yet. Add people via the person column in any board.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {members.map(m => (
            <MemberCard
              key={m.id}
              member={m}
              update={updates.find(u => u.member_key === m.id)}
              isEditing={editingId === m.id}
              onEdit={() => setEditingId(m.id)}
              onSave={draft => handleSave(m.id, draft)}
              onCancel={() => setEditingId(null)}
              isMe={m.id === myMemberId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
