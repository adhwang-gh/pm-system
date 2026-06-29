'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const GOLD = '#3D5A80'
const BG = '#F7F7F5'
const BORDER = '#E8E8E4'
const SURFACE = '#FFFFFF'
const TEXT = '#1A1A18'
const MUTED = '#9A9A92'

const NOTIFS = [
  { id: '1', tag: 'STATUS', text: 'Q3 Campaign Brief marked as Done', time: '2h ago' },
  { id: '2', tag: 'COMMENT', text: 'James Park commented on "Landing page redesign"', time: '4h ago' },
  { id: '3', tag: 'ASSIGN', text: 'You were assigned to "SEO blog posts"', time: '1d ago' },
  { id: '4', tag: 'DUE', text: 'Deadline tomorrow: "Product launch copy"', time: '1d ago' },
]

export default function MondayTopBar() {
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [userName, setUserName] = useState('Guest')

  useEffect(() => {
    const saved = localStorage.getItem('pm_user_name')
    if (saved) setUserName(saved)
  }, [])

  const unread = NOTIFS.filter(n => !readIds.has(n.id)).length
  const markAllRead = () => setReadIds(new Set(NOTIFS.map(n => n.id)))

  const btnStyle = (active = false): React.CSSProperties => ({
    width: 30, height: 30, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? `${GOLD}18` : 'transparent', border: 'none', cursor: 'pointer',
    color: active ? GOLD : MUTED, fontSize: 13, position: 'relative', transition: 'all 0.15s',
  })

  return (
    <div style={{ height: 42, background: BG, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 4, padding: '0 16px', flexShrink: 0, position: 'relative', zIndex: 40 }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 16 }}>
        <div style={{ width: 22, height: 22, borderRadius: 3, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#FFFFFF', fontFamily: 'Jost, sans-serif', letterSpacing: '0.02em' }}>P</div>
        <span style={{ fontWeight: 500, color: TEXT, fontSize: 13, fontFamily: 'Jost, sans-serif', letterSpacing: '0.04em' }}>PM System</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Notifications */}
      <div style={{ position: 'relative' }}>
        <button style={btnStyle(showNotifs)} onClick={() => { setShowNotifs(v => !v); setShowProfile(false) }} title="Notifications">
          ◈
          {unread > 0 && (
            <span style={{ position: 'absolute', top: 3, right: 3, width: 12, height: 12, background: GOLD, borderRadius: '50%', fontSize: 8, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{unread}</span>
          )}
        </button>
        {showNotifs && (
          <div style={{ position: 'absolute', right: 0, top: 38, width: 320, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 50, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: TEXT, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Notifications</span>
              {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 10, color: GOLD, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.04em' }}>Mark all read</button>}
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {NOTIFS.map(n => (
                <div key={n.id} onClick={() => setReadIds(prev => new Set([...prev, n.id]))}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', borderBottom: `1px solid #EBEBEA`, background: !readIds.has(n.id) ? '#F5F5F2' : 'transparent' }}>
                  <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.08em', color: readIds.has(n.id) ? '#D0D0CC' : GOLD, background: readIds.has(n.id) ? '#F3F3F0' : `${GOLD}18`, padding: '2px 5px', borderRadius: 2, flexShrink: 0 }}>{n.tag}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 11, color: readIds.has(n.id) ? MUTED : TEXT, margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.text}</p>
                    <p style={{ fontSize: 10, color: '#D0D0CC', margin: '2px 0 0' }}>{n.time}</p>
                  </div>
                  {!readIds.has(n.id) && <div style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', fontSize: 10, color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 10, textDecoration: 'none', marginLeft: 4, letterSpacing: '0.04em' }}>
        ← Notion
      </Link>

      {/* Profile */}
      <div style={{ position: 'relative', marginLeft: 6 }}>
        <button onClick={() => { setShowProfile(v => !v); setShowNotifs(false) }}
          style={{ width: 26, height: 26, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: 9, fontWeight: 700, border: 'none', cursor: 'pointer', letterSpacing: '0.04em' }}>
          {userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
        </button>
        {showProfile && (
          <div style={{ position: 'absolute', right: 0, top: 34, width: 200, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 50, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 12, color: TEXT, fontWeight: 500 }}>{userName}</div>
            </div>
            {[
              { label: 'Profile settings', action: () => {} },
              { label: 'Notification preferences', action: () => {} },
              { label: 'Keyboard shortcuts', action: () => {} },
            ].map(item => (
              <button key={item.label} onClick={item.action}
                style={{ width: '100%', textAlign: 'left', padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: MUTED, letterSpacing: '0.02em' }}>
                {item.label}
              </button>
            ))}
            <div style={{ borderTop: `1px solid ${BORDER}`, padding: '4px 0' }}>
              <Link href="/" style={{ display: 'block', padding: '9px 16px', fontSize: 11, color: '#C0392B', textDecoration: 'none', letterSpacing: '0.02em' }}>
                Exit PM System
              </Link>
            </div>
          </div>
        )}
      </div>

      {(showNotifs || showProfile) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => { setShowNotifs(false); setShowProfile(false) }} />
      )}
    </div>
  )
}
