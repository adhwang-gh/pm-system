'use client'

import { useEffect, useState, useCallback } from 'react'
import { TEAM_MEMBERS } from './MondayCell'

const GOLD = '#C9A24B'

interface Team {
  id: string
  name: string
  lead_key: string
  members: string[]
}

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

function getMember(key: string) {
  return TEAM_MEMBERS.find(m => m.key === key) ?? { key, name: key, color: '#555', initials: key.slice(0, 2) }
}

function getMondaySunday(date: Date): string {
  const d = new Date(date)
  const day = d.getUTCDay()
  // Go back to Monday of this week, then back one more to Sunday
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff - 1)
  // Actually: Sunday of the current week (start of week = Sunday)
  // week_of = the Sunday that starts the week being reported
  const sun = new Date(date)
  sun.setUTCDate(date.getUTCDate() - date.getUTCDay())
  return sun.toISOString().slice(0, 10)
}

function formatWeek(weekOf: string) {
  const d = new Date(weekOf + 'T00:00:00Z')
  const end = new Date(d)
  end.setUTCDate(d.getUTCDate() + 6)
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`
}

function Avatar({ memberKey, size = 32 }: { memberKey: string; size?: number }) {
  const m = getMember(memberKey)
  return (
    <div style={{ width: size, height: size, background: m.color, fontSize: size * 0.35, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
      {m.initials ?? m.name.slice(0, 2).toUpperCase()}
    </div>
  )
}

function MemberCard({ memberKey, update, isEditing, onEdit, onSave, onCancel, weekOf, currentUserKey }: {
  memberKey: string
  update: Update | undefined
  isEditing: boolean
  onEdit: () => void
  onSave: (draft: Draft) => void
  onCancel: () => void
  weekOf: string
  currentUserKey: string
}) {
  const m = getMember(memberKey)
  const isOwnCard = memberKey === currentUserKey
  const [draft, setDraft] = useState<Draft>({
    progress: update?.progress ?? '',
    plan: update?.plan ?? '',
    problems: update?.problems ?? '',
    products: update?.products ?? '',
  })

  useEffect(() => {
    setDraft({
      progress: update?.progress ?? '',
      plan: update?.plan ?? '',
      problems: update?.problems ?? '',
      products: update?.products ?? '',
    })
  }, [update])

  const hasUpdate = update && (update.progress || update.plan || update.problems || update.products)
  const isEmpty = !hasUpdate

  const fields: { key: keyof Draft; label: string; placeholder: string }[] = [
    { key: 'progress', label: 'Progress', placeholder: 'What did you accomplish? (2 sentences max)' },
    { key: 'plan', label: 'Plan', placeholder: 'What\'s the plan for this week? (2 sentences max)' },
    { key: 'problems', label: 'Problems', placeholder: 'Any blockers or challenges? (2 sentences max)' },
    { key: 'products', label: 'Products', placeholder: 'Which products/projects are you working on?' },
  ]

  return (
    <div style={{ background: '#1A1A1A', border: `1px solid ${isEditing ? GOLD : '#2A2A2A'}`, borderRadius: 12, padding: '16px', transition: 'border-color 0.15s' }}>
      {/* Member header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Avatar memberKey={memberKey} size={34} />
        <div style={{ flex: 1 }}>
          <div style={{ color: '#F0F0F0', fontWeight: 600, fontSize: 14 }}>{m.name}</div>
          {update?.updated_at && !isEditing && (
            <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>
              Updated {new Date(update.updated_at + 'Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>
        {isOwnCard && !isEditing && (
          <button onClick={onEdit} style={{ fontSize: 11, color: GOLD, border: `1px solid ${GOLD}33`, background: 'transparent', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontWeight: 600 }}>
            {isEmpty ? '+ Add update' : 'Edit'}
          </button>
        )}
      </div>

      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fields.map(f => (
            <div key={f.key}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{f.label}</div>
              <textarea
                value={draft[f.key]}
                onChange={e => setDraft(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                rows={2}
                style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 8, padding: '8px 10px', color: '#E0E0E0', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = GOLD)}
                onBlur={e => (e.target.style.borderColor = '#333')}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button onClick={onCancel} style={{ fontSize: 12, color: '#666', background: 'transparent', border: '1px solid #333', borderRadius: 7, padding: '5px 14px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => onSave(draft)} style={{ fontSize: 12, color: '#000', background: GOLD, border: 'none', borderRadius: 7, padding: '5px 14px', cursor: 'pointer', fontWeight: 700 }}>Save</button>
          </div>
        </div>
      ) : isEmpty ? (
        <div style={{ color: '#444', fontSize: 13, fontStyle: 'italic', paddingTop: 2 }}>No update submitted yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {fields.map(f => update?.[f.key] ? (
            <div key={f.key}>
              <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{f.label}</div>
              <div style={{ color: '#C0C0C0', fontSize: 13, lineHeight: 1.5 }}>{update[f.key]}</div>
            </div>
          ) : null)}
        </div>
      )}
    </div>
  )
}

function TeamSection({ team, updates, editingKey, onEdit, onSave, onCancel, weekOf, currentUserKey }: {
  team: Team
  updates: Update[]
  editingKey: string | null
  onEdit: (key: string) => void
  onSave: (key: string, draft: Draft) => void
  onCancel: () => void
  weekOf: string
  currentUserKey: string
}) {
  const [collapsed, setCollapsed] = useState(false)
  const allKeys = [team.lead_key, ...team.members]

  return (
    <div style={{ marginBottom: 28 }}>
      <button onClick={() => setCollapsed(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: 12, padding: '4px 0' }}>
        <span style={{ color: '#555', fontSize: 11 }}>{collapsed ? '▸' : '▾'}</span>
        <span style={{ color: GOLD, fontWeight: 700, fontSize: 14, letterSpacing: '0.02em' }}>{team.name}</span>
        <span style={{ color: '#444', fontSize: 11 }}>· {allKeys.length} member{allKeys.length !== 1 ? 's' : ''}</span>
      </button>

      {!collapsed && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {allKeys.map(key => (
            <MemberCard
              key={key}
              memberKey={key}
              update={updates.find(u => u.member_key === key)}
              isEditing={editingKey === key}
              onEdit={() => onEdit(key)}
              onSave={draft => onSave(key, draft)}
              onCancel={onCancel}
              weekOf={weekOf}
              currentUserKey={currentUserKey}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function WeeklyUpdatesView() {
  const [teams, setTeams] = useState<Team[]>([])
  const [updates, setUpdates] = useState<Update[]>([])
  const [weekOf, setWeekOf] = useState(() => getMondaySunday(new Date()))
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const currentUserKey = 'AH'

  const load = useCallback(() => {
    fetch('/monday/api/teams').then(r => r.json()).then(setTeams)
    fetch(`/monday/api/updates?week_of=${weekOf}`).then(r => r.json()).then(setUpdates)
  }, [weekOf])

  useEffect(() => { load() }, [load])

  const handleSave = async (memberKey: string, draft: Draft) => {
    const res = await fetch('/monday/api/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_key: memberKey, week_of: weekOf, ...draft }),
    })
    const saved = await res.json()
    setUpdates(prev => {
      const filtered = prev.filter(u => !(u.member_key === memberKey && u.week_of === weekOf))
      return [...filtered, saved]
    })
    setEditingKey(null)
  }

  const prevWeek = () => {
    const d = new Date(weekOf + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() - 7)
    setWeekOf(d.toISOString().slice(0, 10))
    setEditingKey(null)
  }

  const nextWeek = () => {
    const d = new Date(weekOf + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() + 7)
    const next = d.toISOString().slice(0, 10)
    if (next <= getMondaySunday(new Date())) {
      setWeekOf(next)
      setEditingKey(null)
    }
  }

  const isCurrentWeek = weekOf === getMondaySunday(new Date())
  const totalSubmitted = updates.filter(u => u.progress || u.plan || u.problems || u.products).length
  const totalMembers = teams.reduce((s, t) => s + 1 + t.members.length, 0)

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#0B0B0B', padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <h1 style={{ color: '#F0F0F0', fontWeight: 700, fontSize: 22, margin: 0 }}>Weekly Updates</h1>
            <p style={{ color: '#555', fontSize: 13, marginTop: 4 }}>Progress · Plan · Problems · Products — submitted every Sunday</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#555' }}>{totalSubmitted}/{totalMembers} submitted</span>
            <div style={{ width: 80, height: 4, background: '#222', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${totalMembers ? (totalSubmitted / totalMembers) * 100 : 0}%`, height: '100%', background: GOLD, borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>

        {/* Week nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <button onClick={prevWeek} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 7, padding: '5px 12px', color: '#888', cursor: 'pointer', fontSize: 13 }}>← Prev</button>
          <div style={{ background: '#1A1A1A', border: `1px solid ${GOLD}55`, borderRadius: 8, padding: '5px 16px', color: GOLD, fontWeight: 600, fontSize: 13 }}>
            {formatWeek(weekOf)}{isCurrentWeek && <span style={{ marginLeft: 8, fontSize: 10, color: '#888', fontWeight: 400 }}>this week</span>}
          </div>
          <button onClick={nextWeek} disabled={isCurrentWeek} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 7, padding: '5px 12px', color: isCurrentWeek ? '#333' : '#888', cursor: isCurrentWeek ? 'default' : 'pointer', fontSize: 13 }}>Next →</button>
        </div>
      </div>

      {/* Teams */}
      {teams.length === 0 ? (
        <div style={{ color: '#444', textAlign: 'center', padding: '60px 0', fontSize: 14 }}>Loading teams…</div>
      ) : (
        teams.map(team => (
          <TeamSection
            key={team.id}
            team={team}
            updates={updates}
            editingKey={editingKey}
            onEdit={setEditingKey}
            onSave={handleSave}
            onCancel={() => setEditingKey(null)}
            weekOf={weekOf}
            currentUserKey={currentUserKey}
          />
        ))
      )}
    </div>
  )
}
