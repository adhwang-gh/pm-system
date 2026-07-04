'use client'

import { useEffect, useState, useCallback } from 'react'
import { MBoard, MColumn, MGroup, MItem } from '@/components/monday/types'
import MondaySidebar, { NavView } from '@/components/monday/MondaySidebar'
import MondayTopBar from '@/components/monday/MondayTopBar'
import MondayTable from '@/components/monday/MondayTable'
import WeeklyUpdatesView from '@/components/monday/WeeklyUpdatesView'

const GOLD = '#3D5A80'

interface BoardData { board: MBoard; groups: MGroup[]; columns: MColumn[]; items: MItem[] }

/* ─── Modals ─── */
/* ─── Profile modal ─── */
function ProfileModal({ userId, currentName, onClose, onSaved }: { userId: string; currentName: string; onClose: () => void; onSaved: (name: string) => void }) {
  const [name, setName] = useState(currentName)
  const [saving, setSaving] = useState(false)
  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    const res = await fetch('/monday/api/auth/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'X-Pm-User-Id': userId }, body: JSON.stringify({ name: name.trim() }) })
    if (res.ok) {
      const data = await res.json()
      localStorage.setItem('pm_user_name', data.name)
      onSaved(data.name)
      onClose()
    }
    setSaving(false)
  }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div style={{ background: '#FFFFFF', border: '1px solid #DDDDD8', borderRadius: 16, padding: '28px 28px', width: 380, boxShadow: '0 16px 48px rgba(0,0,0,0.16)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#1A1A18', marginBottom: 4 }}>Edit profile</div>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>Update your display name.</div>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onClose() }}
          placeholder="Your full name" style={{ width: '100%', background: '#F5F5F2', border: '1px solid #DDDDD8', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1A1A18', outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, border: '1px solid #DDDDD8', color: '#6B7280', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={!name.trim() || saving} style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, background: GOLD, color: '#FFFFFF', border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>Save</button>
        </div>
      </div>
    </div>
  )
}


/* ─── Home view ─── */
function HomeView({ boards, allBoardData, onSelectBoard, userName, memberCount }: { boards: MBoard[]; allBoardData: Record<string, BoardData>; onSelectBoard: (id: string) => void; userName: string | null; memberCount: number }) {
  const totalItems = Object.values(allBoardData).reduce((s, d) => s + d.items.length, 0)
  return (
    <div className="flex-1 overflow-y-auto px-8 py-8" style={{ background: '#F7F7F5' }}>
      <h1 className="text-2xl font-bold mb-1" style={{ color: '#1A1A18' }}>Welcome back{userName ? `, ${userName}` : ''}</h1>
      <p className="text-sm mb-8" style={{ color: '#6B7280' }}>Here&apos;s what&apos;s happening across your workspace</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total boards', value: boards.length, sub: 'in your workspace' },
          { label: 'Total items', value: totalItems, sub: 'across all boards' },
          { label: 'Team members', value: memberCount, sub: 'on your team' },
        ].map(s => (
          <div key={s.label} className="rounded-xl flex items-center gap-4" style={{ background: '#FFFFFF', border: '1px solid #E8E8E4', padding: '14px 20px' }}>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: GOLD, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#1A1A18', marginTop: 2 }}>{s.label}</div>
              <div style={{ fontSize: 10, color: '#9A9A92', marginTop: 1 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xs font-bold mb-3 uppercase tracking-widest" style={{ color: '#374151' }}>Workspaces</h2>
      <div className="grid grid-cols-2 gap-4">
        {boards.map(b => {
          const data = allBoardData[b.id]
          const itemCount = data?.items.length ?? 0
          return (
            <button key={b.id} onClick={() => onSelectBoard(b.id)}
              className="rounded-xl p-5 text-left transition-all"
              style={{ background: '#FFFFFF', border: '1px solid #E8E8E4' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1A1A18' }}>{b.title}</div>
                <div style={{ fontSize: 11, color: '#9A9A92' }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</div>
              </div>
              {data && data.items.slice(0, 3).map(it => (
                <div key={it.id} style={{ fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                  · {it.title || 'Untitled'}
                </div>
              ))}
              {data && (() => {
                const sc = data.columns.find(c => c.type === 'status')
                const opts = sc?.options as { colors?: Record<string, string> }
                const counts = data.items.reduce((acc, it) => {
                  const val = sc ? String(it.data[sc.id] ?? '') : ''
                  if (val) acc[val] = (acc[val] ?? 0) + 1
                  return acc
                }, {} as Record<string, number>)
                const SEMANTIC: Record<string, string> = { 'on track': '#16a34a', 'at risk': '#ca8a04', 'stuck': '#dc2626', 'done': '#94a3b8' }
                const entries = Object.entries(counts)
                return (
                  <>
                    <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden" style={{ background: '#E8E8E4', marginTop: 8 }}>
                      {entries.map(([v, count]) => <div key={v} className="h-full" style={{ backgroundColor: opts?.colors?.[v] ?? '#333', flex: count }} />)}
                    </div>
                    {entries.length > 0 && (
                      <div style={{ display: 'flex', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
                        {entries.map(([v, count]) => {
                          const color = SEMANTIC[v.toLowerCase()] ?? opts?.colors?.[v] ?? '#94a3b8'
                          return (
                            <span key={v} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: '#6B7280' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
                              {v} ({count})
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </>
                )
              })()}
              <div style={{ fontSize: 10, color: '#9A9A92', marginTop: 6, textAlign: 'right' }}>Open →</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── My Work view ─── */
function MyWorkView({ allBoardData, myMemberId }: { allBoardData: Record<string, BoardData>; myMemberId: string }) {
  const MY_KEY = myMemberId
  const myItems: (MItem & { boardTitle: string; boardId: string })[] = []
  Object.values(allBoardData).forEach(d => {
    const personCol = d.columns.find(c => c.type === 'person')
    d.items.forEach(it => {
      const assignees = personCol ? String(it.data[personCol.id] ?? '').split(',') : []
      if (assignees.includes(MY_KEY)) myItems.push({ ...it, boardTitle: d.board.title, boardId: d.board.id })
    })
  })

  const BORDER = '#E8E8E4'
  const MUTED = '#9A9A92'

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px 48px', background: '#F7F7F5' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#1A1A18', marginBottom: 4 }}>My Work</div>
        <div style={{ fontSize: 11, color: MUTED }}>{myItems.length} item{myItems.length !== 1 ? 's' : ''} assigned to you across all boards</div>
      </div>

      {myItems.length === 0 ? (
        <div style={{ padding: '48px 0', color: '#9A9A92' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ marginBottom: 12 }}>
            <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M9 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p style={{ margin: '0 0 6px', fontWeight: 500, color: '#1A1A18', fontSize: 14 }}>No items assigned to you yet</p>
          <p style={{ margin: 0, fontSize: 12, color: '#9A9A92', maxWidth: 320, lineHeight: 1.5 }}>Open any board, click the PM column on a row, and select your name to assign items to yourself.</p>
        </div>
      ) : (
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 160px', padding: '10px 20px', background: '#FFFFFF', borderBottom: `1px solid ${BORDER}` }}>
            {['Item', 'Board', 'Status'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#D0D0CC' }}>{h}</div>
            ))}
          </div>
          {myItems.map(item => {
            const data = Object.values(allBoardData).find(d => d.board.id === item.boardId)
            const statusCol = data?.columns.find(c => c.type === 'status' && c.title === 'Project status')
            const status = statusCol ? String(item.data[statusCol.id] ?? '') : ''
            const statusColor = statusCol ? (statusCol.options as { colors?: Record<string, string> })?.colors?.[status] ?? '#6B7280' : '#6B7280'
            return (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 200px 160px', padding: '12px 20px', borderBottom: `1px solid #EBEBEA`, background: 'transparent' }}>
                <div style={{ fontSize: 12, color: '#1A1A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 16 }}>{item.title || 'Untitled'}</div>
                <div style={{ fontSize: 11, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.boardTitle}</div>
                <div>
                  {status && (() => {
                    const h = statusColor.replace('#', '')
                    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16)
                    const isLight = (r*299+g*587+b*114)/1000 > 160
                    return <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 3, backgroundColor: statusColor, color: isLight ? '#374151' : '#fff', letterSpacing: '0.04em' }}>{status}</span>
                  })()}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Inbox view ─── */
function InboxView({ userId }: { userId: string }) {
  type Notif = { id: string; type: string; text: string; board_title: string; item_title: string; read: number; created_at: string }
  const [items, setItems] = useState<Notif[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(true)
  const BORDER = '#E8E8E4'
  const MUTED = '#9A9A92'

  useEffect(() => {
    if (!userId) return
    fetch('/monday/api/notifications', { headers: { 'X-Pm-User-Id': userId } })
      .then(r => r.json()).then(data => { setItems(Array.isArray(data) ? data : []); setLoadingNotifs(false) })
      .catch(() => setLoadingNotifs(false))
  }, [userId])

  const markRead = async (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, read: 1 } : i))
    await fetch('/monday/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Pm-User-Id': userId }, body: JSON.stringify({ action: 'mark_read', id }) })
  }
  const markAllRead = async () => {
    setItems(prev => prev.map(i => ({ ...i, read: 1 })))
    await fetch('/monday/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Pm-User-Id': userId }, body: JSON.stringify({ action: 'mark_read', all: true }) })
  }

  const tagLabel = (type: string) => ({ status: 'STATUS', person: 'ASSIGN' }[type] ?? type.toUpperCase().slice(0, 7))
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso + (iso.includes('Z') ? '' : 'Z')).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  const unread = items.filter(i => !i.read).length

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px 48px', background: '#F7F7F5' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#1A1A18', marginBottom: 4 }}>Inbox</div>
          <div style={{ fontSize: 11, color: MUTED }}>{unread} unread notification{unread !== 1 ? 's' : ''}</div>
        </div>
        {unread > 0 && (
          <button onClick={e => { e.stopPropagation(); markAllRead() }} style={{ fontSize: 11, color: GOLD, background: 'none', border: `1px solid ${GOLD}44`, borderRadius: 10, padding: '5px 12px', cursor: 'pointer', letterSpacing: '0.06em' }}>
            Mark all read
          </button>
        )}
      </div>
      {loadingNotifs ? (
        <div style={{ color: '#9A9A92', fontSize: 13 }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#9A9A92' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ marginBottom: 12 }}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
          </svg>
          <p style={{ margin: '0 0 6px', fontWeight: 500, color: '#1A1A18', fontSize: 14 }}>You&apos;re all caught up</p>
          <p style={{ margin: 0, fontSize: 12, color: '#9A9A92', maxWidth: 280, lineHeight: 1.5 }}>Notifications will appear here when project statuses change or items are assigned.</p>
        </div>
      ) : (
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
          {items.map(item => (
            <div key={item.id} onClick={() => markRead(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: `1px solid #EBEBEA`, background: !item.read ? '#FFFFFF' : 'transparent', cursor: 'pointer' }}>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: item.read ? '#D0D0CC' : GOLD, background: item.read ? '#F3F3F0' : `${GOLD}18`, padding: '2px 6px', borderRadius: 3, flexShrink: 0, minWidth: 60, textAlign: 'center' }}>{tagLabel(item.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: !item.read ? '#1A1A18' : MUTED, margin: 0, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.text}</p>
              </div>
              <span style={{ fontSize: 10, color: '#D0D0CC', flexShrink: 0 }}>{timeAgo(item.created_at)}</span>
              {!item.read && <div style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Auth gate ─── */
function AuthGate({ onDone }: { onDone: (userId: string, name: string) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('register')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const save = (data: { userId: string; name: string; email: string }) => {
    localStorage.setItem('pm_user_id', data.userId)
    localStorage.setItem('pm_user_name', data.name)
    localStorage.setItem('pm_user_email', data.email)
    localStorage.setItem('pm_user_member_id', data.userId)
    onDone(data.userId, data.name)
  }

  const register = async () => {
    if (!name.trim() || !email.trim()) return
    setLoading(true); setError('')
    const res = await fetch('/monday/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), email: email.trim() }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    save(data)
  }

  const login = async () => {
    if (!email.trim()) return
    setLoading(true); setError('')
    const res = await fetch('/monday/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    save(data)
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: '#F5F5F2', border: '1px solid #DDDDD8', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1A1A18', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F7F5' }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #DDDDD8', borderRadius: 18, padding: '40px 36px', width: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.12)' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1A1A18', marginBottom: 4, letterSpacing: '0.02em' }}>
          {mode === 'register' ? 'Create your account' : 'Sign in'}
        </div>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 28 }}>
          {mode === 'register' ? 'Enter your name and email to get started.' : 'Enter your email to access your workspace.'}
        </div>

        {mode === 'register' && (
          <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') register() }} placeholder="Your full name" style={inputStyle} />
        )}

        <input autoFocus={mode === 'login'} value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') mode === 'register' ? register() : login() }} placeholder="Email address" type="email" style={inputStyle} />

        {error && <div style={{ fontSize: 12, color: '#C0392B', marginBottom: 12, lineHeight: 1.4 }}>{error}</div>}

        <button onClick={mode === 'register' ? register : login}
          disabled={loading || !email.trim() || (mode === 'register' && !name.trim())}
          style={{ width: '100%', background: GOLD, color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1, marginTop: 4 }}>
          {loading ? '…' : mode === 'register' ? 'Create account' : 'Sign in'}
        </button>

        <div style={{ marginTop: 16, fontSize: 11, color: '#6B7280', textAlign: 'center' }}>
          {mode === 'register'
            ? <>Already have an account? <button onClick={() => { setMode('login'); setError('') }} style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}>Sign in</button></>
            : <>New here? <button onClick={() => { setMode('register'); setError('') }} style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}>Create an account</button></>}
        </div>
      </div>
    </div>
  )
}

/* ─── Main page ─── */
export default function PMSystemPage() {
  const [boards, setBoards] = useState<MBoard[]>([])
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [boardData, setBoardData] = useState<BoardData | null>(null)
  const [allBoardData, setAllBoardData] = useState<Record<string, BoardData>>({})
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeNav, setActiveNav] = useState<NavView>('board')
  const [showBoardMenu, setShowBoardMenu] = useState(false)
  const [renamingBoard, setRenamingBoard] = useState(false)
  const [renameVal, setRenameVal] = useState('')
  const [userName, setUserName] = useState<string | null>(null)
  const [myMemberId, setMyMemberId] = useState<string>('')
  const [showAuth, setShowAuth] = useState(false)
  const [memberCount, setMemberCount] = useState(0)
  const [userId, setUserId] = useState<string>('')
  const [savedToast, setSavedToast] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check auth state on mount
  useEffect(() => {
    const uid = localStorage.getItem('pm_user_id')
    const savedName = localStorage.getItem('pm_user_name')
    if (uid && savedName) {
      setUserId(uid)
      setUserName(savedName)
      setMyMemberId(localStorage.getItem('pm_user_member_id') ?? uid)
    } else {
      setShowAuth(true)
    }
    setIsMobile(window.innerWidth < 768)
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const pmHeaders: Record<string, string> = userId ? { 'X-Pm-User-Id': userId } : {}

  // Fetch canonical name from DB (fixes truncated name stored at registration)
  useEffect(() => {
    if (!userId) return
    fetch('/monday/api/auth/me', { headers: { 'X-Pm-User-Id': userId } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.name) { setUserName(data.name); localStorage.setItem('pm_user_name', data.name) } })
      .catch(() => {})
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!userId) return
    fetch('/monday/api/boards', { headers: pmHeaders }).then(r => r.json()).then((data: MBoard[]) => {
      setBoards(data)
      if (data.length > 0) setSelectedBoardId(data[0].id)
    })
    fetch('/monday/api/members', { headers: pmHeaders }).then(r => r.json()).then((data: unknown[]) => setMemberCount(Array.isArray(data) ? data.length : 0))
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadBoard = useCallback(async (id: string) => {
    setLoading(true)
    const res = await fetch(`/monday/api/boards/${id}`, { headers: pmHeaders })
    const data = await res.json()
    setBoardData(data)
    setAllBoardData(prev => ({ ...prev, [id]: data }))
    setLoading(false)
  }, [])

  useEffect(() => { if (selectedBoardId) loadBoard(selectedBoardId) }, [selectedBoardId, loadBoard])

  // Pre-load all boards for Home/My Work
  useEffect(() => {
    boards.forEach(b => {
      if (!allBoardData[b.id]) {
        fetch(`/monday/api/boards/${b.id}`, { headers: pmHeaders }).then(r => r.json()).then(data => {
          setAllBoardData(prev => ({ ...prev, [b.id]: data }))
        })
      }
    })
  }, [boards]) // eslint-disable-line react-hooks/exhaustive-deps

  const addBoard = async (title: string) => {
    const res = await fetch('/monday/api/boards', { method: 'POST', headers: { 'Content-Type': 'application/json', ...pmHeaders }, body: JSON.stringify({ title }) })
    const board = await res.json()
    setBoards(prev => [...prev, board])
    setSelectedBoardId(board.id)
    setActiveNav('board')
  }

  const renameBoard = () => {
    if (!renameVal.trim() || !boardData) return
    setBoardData(prev => prev ? { ...prev, board: { ...prev.board, title: renameVal.trim() } } : prev)
    setBoards(prev => prev.map(b => b.id === selectedBoardId ? { ...b, title: renameVal.trim() } : b))
    setRenamingBoard(false)
    setShowBoardMenu(false)
  }

  const deleteBoard = () => {
    if (!selectedBoardId || !confirm(`Delete "${boardData?.board.title}"?`)) return
    setBoards(prev => prev.filter(b => b.id !== selectedBoardId))
    setSelectedBoardId(boards.find(b => b.id !== selectedBoardId)?.id ?? null)
    setBoardData(null)
    setShowBoardMenu(false)
    setActiveNav('home')
  }

  const addItem = async (groupId: string, title: string) => {
    if (!selectedBoardId || !boardData) return
    // If no group exists yet, create one first then add the item
    let targetGroupId = groupId
    if (!groupId || !boardData.groups.some(g => g.id === groupId)) {
      const gr = await fetch(`/monday/api/boards/${selectedBoardId}/groups`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Group 1' }),
      })
      const newGroup = await gr.json()
      setBoardData(prev => prev ? { ...prev, groups: [...prev.groups, newGroup] } : prev)
      targetGroupId = newGroup.id
    }
    const res = await fetch(`/monday/api/boards/${selectedBoardId}/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: targetGroupId, title }),
    })
    const item = await res.json()
    // Auto-assign current user to PM column
    const pmCol = boardData.columns.find(c => c.type === 'person')
    if (pmCol && userId) {
      await fetch(`/monday/api/boards/${selectedBoardId}/items`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, data: { [pmCol.id]: userId } }),
      })
      item.data = { ...item.data, [pmCol.id]: userId }
    }
    setBoardData(prev => prev ? { ...prev, items: [...prev.items, item] } : prev)
  }

  const updateItem = async (itemId: string, title?: string, data?: Record<string, string | number>) => {
    if (!selectedBoardId) return
    const res = await fetch(`/monday/api/boards/${selectedBoardId}/items`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, title, data }),
    })
    const updated = await res.json()
    setBoardData(prev => prev ? { ...prev, items: prev.items.map(it => it.id === itemId ? updated : it) } : prev)
    setSavedToast(true)
    setTimeout(() => setSavedToast(false), 1800)
  }

  const deleteItem = async (itemId: string) => {
    if (!selectedBoardId) return
    await fetch(`/monday/api/boards/${selectedBoardId}/items`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    })
    setBoardData(prev => prev ? { ...prev, items: prev.items.filter(it => it.id !== itemId) } : prev)
  }

  const addGroup = async (title: string) => {
    if (!selectedBoardId) return
    const res = await fetch(`/monday/api/boards/${selectedBoardId}/groups`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    const group = await res.json()
    setBoardData(prev => prev ? { ...prev, groups: [...prev.groups, group] } : prev)
  }

  const deleteGroup = async (groupId: string) => {
    if (!selectedBoardId) return
    await fetch(`/monday/api/boards/${selectedBoardId}/groups`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId }),
    })
    setBoardData(prev => prev ? {
      ...prev,
      groups: prev.groups.filter(g => g.id !== groupId),
      items: prev.items.filter(it => it.group_id !== groupId),
    } : prev)
  }

  const toggleGroup = async (groupId: string, collapsed: boolean) => {
    if (!selectedBoardId) return
    await fetch(`/monday/api/boards/${selectedBoardId}/groups`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, collapsed }),
    })
  }

  const handleNavSelect = (view: NavView) => {
    setActiveNav(view)
    if (view === 'board' && !selectedBoardId && boards.length > 0) setSelectedBoardId(boards[0].id)
  }

  return (
    <div className="flex flex-col h-full">
      {isMobile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F7F7F5', padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🖥️</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1A1A18', marginBottom: 8 }}>PM System works best on desktop</div>
          <div style={{ fontSize: 13, color: '#6B7280', maxWidth: 300, lineHeight: 1.6 }}>Please open this on a laptop or desktop for the full experience. The table view isn&apos;t optimized for small screens yet.</div>
        </div>
      )}
      <MondayTopBar />
      {savedToast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100, background: '#1A1A18', color: '#FFFFFF', fontSize: 12, fontWeight: 500, padding: '8px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
          <span style={{ color: '#4ADE80' }}>✓</span> Saved
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <MondaySidebar
          boards={boards}
          selectedBoardId={selectedBoardId}
          onSelectBoard={id => { setSelectedBoardId(id); setActiveNav('board') }}
          onNewBoard={addBoard}
          onNavSelect={handleNavSelect}
          activeNav={activeNav}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(v => !v)}
          userName={userName}
          onProfileEdit={() => setShowProfile(true)}
        />

        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#F7F7F5' }}>
          {activeNav === 'home' && (
            <HomeView boards={boards} allBoardData={allBoardData} onSelectBoard={id => { setSelectedBoardId(id); setActiveNav('board') }} userName={userName} memberCount={memberCount} />
          )}
          {activeNav === 'mywork' && <MyWorkView allBoardData={allBoardData} myMemberId={myMemberId} />}
          {activeNav === 'inbox' && <InboxView userId={userId} />}
          {activeNav === 'updates' && <WeeklyUpdatesView userId={userId} />}

          {activeNav === 'board' && (
            loading || !boardData ? (
              <div className="flex items-center justify-center flex-1" style={{ color: '#6B7280' }}>
                <div className="w-5 h-5 border-t-transparent rounded-full animate-spin mr-3" style={{ border: `2px solid ${GOLD}`, borderTopColor: 'transparent' }} />
                Loading board…
              </div>
            ) : (
              <>
                {/* Board header */}
                <div className="px-6 pt-5 pb-0 shrink-0" style={{ borderBottom: '1px solid #E8E8E4', background: '#F7F7F5' }}>
                  <div className="flex items-center gap-3 mb-4">
                    {renamingBoard ? (
                      <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') renameBoard(); if (e.key === 'Escape') setRenamingBoard(false) }}
                        onBlur={renameBoard}
                        className="text-xl font-bold outline-none" style={{ color: '#1A1A18', background: 'transparent', borderBottom: `2px solid ${GOLD}` }} />
                    ) : (
                      <h1 className="text-xl font-bold" style={{ color: '#1A1A18' }}>{boardData.board.title}</h1>
                    )}

                    {/* Board options dropdown */}
                    <div className="relative">
                      <button onClick={() => { setShowBoardMenu(v => !v); setRenameVal(boardData.board.title) }}
                        className="text-sm px-1 rounded transition-colors" style={{ color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>▾</button>
                      {showBoardMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowBoardMenu(false)} />
                          <div className="absolute top-8 left-0 z-50 rounded-xl shadow-xl w-44 py-1" style={{ background: '#FFFFFF', border: '1px solid #DDDDD8' }}>
                            <button onClick={() => { setRenamingBoard(true); setShowBoardMenu(false) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm" style={{ color: '#C0C0C0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                              Rename workspace
                            </button>
                            <button onClick={() => { navigator.clipboard.writeText(window.location.href); setShowBoardMenu(false) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm" style={{ color: '#C0C0C0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                              Copy link
                            </button>
                            <div className="my-1" style={{ borderTop: '1px solid #E8E8E4' }} />
                            <button onClick={deleteBoard} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm" style={{ color: '#c0392b', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                              Delete workspace
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex-1" />
                    <div title="Coming soon" style={{ cursor: 'not-allowed' }}><button disabled className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg" style={{ color: '#C0C0C0', border: '1px solid #EBEBEA', background: 'transparent', cursor: 'not-allowed' }}>Integrate</button></div>
                    <div title="Coming soon" style={{ cursor: 'not-allowed' }}><button disabled className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg" style={{ color: '#C0C0C0', border: '1px solid #EBEBEA', background: 'transparent', cursor: 'not-allowed' }}>Automate</button></div>
                    <div title="Coming soon" style={{ cursor: 'not-allowed' }}><button disabled className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg" style={{ background: '#C0C0C0', color: '#FFFFFF', border: 'none', cursor: 'not-allowed' }}>Invite</button></div>
                  </div>

                  {/* Tabs */}
                  <div className="flex items-center gap-0">
                    <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold -mb-px" style={{ color: GOLD, borderBottom: `2px solid ${GOLD}`, background: 'none', border: 'none', cursor: 'pointer' }}>
                      Main table
                    </button>
                  </div>
                </div>

                <MondayTable
                  boardId={selectedBoardId!}
                  groups={boardData.groups}
                  columns={boardData.columns}
                  items={boardData.items}
                  onUpdateItem={updateItem}
                  onDeleteItem={deleteItem}
                  onAddItem={addItem}
                  onAddGroup={addGroup}
                  onToggleGroup={toggleGroup}
                  onDeleteGroup={deleteGroup}
                  userId={userId}
                />
              </>
            )
          )}
        </div>
      </div>

      {showAuth && <AuthGate onDone={(uid, name) => { setUserId(uid); setUserName(name); setMyMemberId(uid); setShowAuth(false) }} />}
      {showProfile && userName && <ProfileModal userId={userId} currentName={userName} onClose={() => setShowProfile(false)} onSaved={name => { setUserName(name); setMyMemberId(userId) }} />}
    </div>
  )
}
