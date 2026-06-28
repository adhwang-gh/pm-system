'use client'

import { useState } from 'react'
import { MBoard } from './types'

export type NavView = 'home' | 'mywork' | 'inbox' | 'board' | 'updates'

interface Props {
  boards: MBoard[]
  selectedBoardId: string | null
  onSelectBoard: (id: string) => void
  onNewBoard: (title: string) => void
  onNavSelect: (view: NavView) => void
  activeNav: NavView
  collapsed: boolean
  onToggleCollapse: () => void
}

const NAV: { icon: string; label: string; view: NavView }[] = [
  { icon: '⬜', label: 'Home', view: 'home' },
  { icon: '◈', label: 'My Work', view: 'mywork' },
  { icon: '◻', label: 'Inbox', view: 'inbox' },
  { icon: '◆', label: 'Weekly Updates', view: 'updates' },
]

const GOLD = '#C9A24B'
const BG = '#0B0B0B'
const SURFACE = '#141414'
const BORDER = '#1E1E1E'
const TEXT = '#EDE8DD'
const MUTED = '#8A8478'
const FAINT = '#2E2E2A'

const JOST: React.CSSProperties = { fontFamily: "'Jost', sans-serif" }
const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }

export default function MondaySidebar({ boards, selectedBoardId, onSelectBoard, onNewBoard, onNavSelect, activeNav, collapsed, onToggleCollapse }: Props) {
  const [workspaceOpen, setWorkspaceOpen] = useState(true)
  const [showNewBoard, setShowNewBoard] = useState(false)
  const [newBoardTitle, setNewBoardTitle] = useState('')

  const confirmNewBoard = () => {
    if (!newBoardTitle.trim()) return
    onNewBoard(newBoardTitle.trim())
    setNewBoardTitle('')
    setShowNewBoard(false)
  }

  if (collapsed) {
    return (
      <div style={{ width: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', background: BG, borderRight: `1px solid ${BORDER}`, paddingTop: 12, gap: 6 }}>
        <button onClick={onToggleCollapse} style={{ color: MUTED, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, marginBottom: 8 }}>{'›'}</button>
        {NAV.map(n => (
          <button key={n.label} onClick={() => onNavSelect(n.view)} title={n.label}
            style={{ width: 32, height: 32, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, cursor: 'pointer', border: 'none', background: activeNav === n.view ? `${GOLD}18` : 'transparent', color: activeNav === n.view ? GOLD : MUTED, transition: 'all 0.15s' }}>
            {n.icon}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div style={{ width: 220, display: 'flex', flexDirection: 'column', background: BG, borderRight: `1px solid ${BORDER}` }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 16px 14px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ width: 22, height: 22, borderRadius: 3, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#000', flexShrink: 0, ...JOST }}>P</div>
        <span style={{ fontWeight: 500, color: TEXT, fontSize: 13, letterSpacing: '0.05em', ...JOST }}>PM System</span>
        <div style={{ flex: 1 }} />
        <button onClick={onToggleCollapse} style={{ color: MUTED, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>{'‹'}</button>
      </div>

      {/* Global nav */}
      <div style={{ padding: '8px 8px', borderBottom: `1px solid ${BORDER}` }}>
        {NAV.map(n => (
          <button key={n.label} onClick={() => onNavSelect(n.view)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer', border: 'none', textAlign: 'left', background: activeNav === n.view ? `${GOLD}15` : 'transparent', color: activeNav === n.view ? GOLD : MUTED, fontWeight: activeNav === n.view ? 500 : 400, transition: 'all 0.15s', ...JOST, letterSpacing: '0.02em' }}>
            <span style={{ fontSize: 10 }}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </div>

      {/* Boards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        <button onClick={() => setWorkspaceOpen(v => !v)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'none', border: 'none', cursor: 'pointer', color: FAINT, fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', ...MONO }}>
          <span>{workspaceOpen ? '▾' : '▸'}</span>
          Workspaces
        </button>

        {workspaceOpen && (
          <div style={{ marginTop: 4 }}>
            {boards.map(board => {
              const active = activeNav === 'board' && selectedBoardId === board.id
              return (
                <button key={board.id} onClick={() => { onNavSelect('board'); onSelectBoard(board.id) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer', border: 'none', textAlign: 'left', background: active ? `${GOLD}15` : 'transparent', color: active ? GOLD : MUTED, borderLeft: active ? `2px solid ${GOLD}` : '2px solid transparent', transition: 'all 0.15s', ...JOST }}>
                  <span style={{ fontSize: 9 }}>{'▪'}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{board.title}</span>
                </button>
              )
            })}

            {showNewBoard ? (
              <div style={{ padding: '6px 4px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input autoFocus value={newBoardTitle} onChange={e => setNewBoardTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmNewBoard(); if (e.key === 'Escape') { setShowNewBoard(false); setNewBoardTitle('') } }}
                  placeholder="Board name..."
                  style={{ background: SURFACE, border: `1px solid ${GOLD}44`, borderRadius: 4, padding: '6px 10px', fontSize: 12, color: TEXT, outline: 'none', width: '100%', boxSizing: 'border-box', ...JOST }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={confirmNewBoard} disabled={!newBoardTitle.trim()}
                    style={{ flex: 1, padding: '5px 0', background: GOLD, color: '#000', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: newBoardTitle.trim() ? 1 : 0.4, ...JOST }}>Create</button>
                  <button onClick={() => { setShowNewBoard(false); setNewBoardTitle('') }}
                    style={{ flex: 1, padding: '5px 0', background: SURFACE, color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowNewBoard(true)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer', border: 'none', textAlign: 'left', background: 'transparent', color: FAINT, ...JOST }}>
                + Add workspace
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 10, fontWeight: 700, ...JOST }}>AH</div>
          <div>
            <div style={{ fontSize: 12, color: TEXT, fontWeight: 500, ...JOST }}>Addison Hwang</div>
            <div style={{ fontSize: 10, color: MUTED, ...MONO }}>Admin</div>
          </div>
        </div>
      </div>
    </div>
  )
}
