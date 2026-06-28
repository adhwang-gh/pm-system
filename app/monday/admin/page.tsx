'use client'

import { useState, useEffect } from 'react'

const GOLD = '#C9A24B'
const BG = '#0B0B0B'
const SURFACE = '#111'
const BORDER = '#1E1E1E'
const TEXT = '#EDE8DD'
const MUTED = '#8A8478'

interface Invite { id: string; label: string; used: number; used_by_email: string | null; created_at: string }

const BASE = typeof window !== 'undefined' ? window.location.origin : ''

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [invites, setInvites] = useState<Invite[]>([])
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const load = async (s: string) => {
    const res = await fetch('/monday/api/admin/invites', { headers: { 'X-Admin-Secret': s } })
    if (!res.ok) { setError('Wrong password'); return }
    setInvites(await res.json())
    setAuthed(true)
    setError('')
  }

  const create = async () => {
    const res = await fetch('/monday/api/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
      body: JSON.stringify({ label }),
    })
    const inv = await res.json()
    setInvites(prev => [inv, ...prev])
    setLabel('')
  }

  const remove = async (id: string) => {
    await fetch('/monday/api/admin/invites', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
      body: JSON.stringify({ id }),
    })
    setInvites(prev => prev.filter(i => i.id !== id))
  }

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/monday?invite=${id}`
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'IBM Plex Mono, monospace' }}>
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '36px 32px', width: 360 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 6 }}>Admin Panel</div>
        <div style={{ fontSize: 11, color: MUTED, marginBottom: 24 }}>Enter admin password to manage invites</div>
        <input autoFocus type="password" value={secret} onChange={e => setSecret(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') load(secret) }}
          placeholder="Admin password"
          style={{ width: '100%', background: '#0D0D0D', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: TEXT, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
        {error && <div style={{ fontSize: 11, color: '#B0221B', marginBottom: 10 }}>{error}</div>}
        <button onClick={() => load(secret)} style={{ width: '100%', background: GOLD, color: '#000', border: 'none', borderRadius: 8, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Enter
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'IBM Plex Mono, monospace', padding: '40px 32px', maxWidth: 760, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Invite Manager</div>
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 32 }}>Create invite links to share with people you want to give access to the PM system</div>

      {/* Create */}
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px', marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Create invite link</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={label} onChange={e => setLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') create() }}
            placeholder="Label (e.g. 'for Sarah')"
            style={{ flex: 1, background: '#0D0D0D', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 12px', fontSize: 12, color: TEXT, outline: 'none' }} />
          <button onClick={create} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Generate link
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Invites ({invites.length})
      </div>
      {invites.length === 0 && (
        <div style={{ fontSize: 12, color: '#333', padding: '24px 0' }}>No invites yet. Generate one above.</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {invites.map(inv => (
          <div key={inv.id} style={{ background: SURFACE, border: `1px solid ${Number(inv.used) ? '#1A1A1A' : BORDER}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, opacity: Number(inv.used) ? 0.5 : 1 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{inv.label || 'Unnamed invite'}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: Number(inv.used) ? '#555' : GOLD, background: Number(inv.used) ? '#1A1A1A' : `${GOLD}18`, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.06em' }}>
                  {Number(inv.used) ? `USED · ${inv.used_by_email}` : 'UNUSED'}
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {`${typeof window !== 'undefined' ? window.location.origin : ''}/monday?invite=${inv.id}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {!Number(inv.used) && (
                <button onClick={() => copyLink(inv.id)}
                  style={{ fontSize: 11, color: copied === inv.id ? GOLD : MUTED, background: 'none', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>
                  {copied === inv.id ? 'Copied!' : 'Copy link'}
                </button>
              )}
              <button onClick={() => remove(inv.id)}
                style={{ fontSize: 11, color: '#B0221B', background: 'none', border: `1px solid #B0221B33`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
