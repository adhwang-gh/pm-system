'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Page } from '@/lib/types'

type SpecialView = 'overview' | 'report' | 'calendar' | 'files' | 'time' | 'team' | 'messages' | null

interface Props {
  pages: Page[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNewPage: (parentId?: string, isDatabase?: boolean) => void
  onDeletePage: (id: string) => void
  onShowSearch: () => void
  onShowOverview: () => void
  onShowReport: () => void
  onShowCalendar: () => void
  onShowFiles: () => void
  onShowTime: () => void
  onShowTeam: () => void
  onShowMessages: () => void
  activeSpecial: SpecialView
}

function PageItem({ page, pages, depth, selectedId, onSelect, onNewPage, onDeletePage }: {
  page: Page; pages: Page[]; depth: number; selectedId: string | null
  onSelect: (id: string) => void; onNewPage: (parentId?: string, isDatabase?: boolean) => void; onDeletePage: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const children = pages.filter(p => p.parent_id === page.id)
  return (
    <div>
      <div
        className={`group flex items-center gap-1.5 py-1 rounded-md cursor-pointer transition-colors ${selectedId === page.id ? 'bg-[#7B68EE]/25 text-white' : 'text-[#9DA5B4] hover:bg-white/5 hover:text-white'}`}
        style={{ paddingLeft: `${12 + depth * 14}px`, paddingRight: '8px' }}
        onClick={() => onSelect(page.id)}
      >
        <button className="w-4 h-4 flex items-center justify-center shrink-0 text-[10px] opacity-50"
          onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}>
          {children.length > 0 ? (expanded ? '▾' : '▸') : ''}
        </button>
        <span className="text-sm shrink-0">{page.icon}</span>
        <span className="text-sm truncate flex-1 font-medium">{page.title || 'Untitled'}</span>
        <button className="opacity-0 group-hover:opacity-100 text-[#9DA5B4] hover:text-white text-xs px-1"
          onClick={e => { e.stopPropagation(); onNewPage(page.id, false) }} title="Add child page">+</button>
        <button className="opacity-0 group-hover:opacity-100 text-[#9DA5B4] hover:text-red-400 text-[10px] px-1 shrink-0"
          onClick={e => { e.stopPropagation(); if (confirm(`Delete "${page.title}"?`)) onDeletePage(page.id) }}>✕</button>
      </div>
      {expanded && children.map(child => (
        <PageItem key={child.id} page={child} pages={pages} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} onNewPage={onNewPage} onDeletePage={onDeletePage} />
      ))}
    </div>
  )
}

const NAV_ICONS = [
  { icon: '🔍', label: 'Search', action: 'search' },
  { icon: '🏠', label: 'Home', action: 'home' },
  { icon: '📊', label: 'Overview', action: 'overview' },
  { icon: '📈', label: 'Reports', action: 'report' },
  { icon: '👥', label: 'People', action: 'team' },
  { icon: '💬', label: 'Chat', action: 'messages' },
]

const BOTTOM_NAV = [
  { icon: '🗓', label: 'Calendar', action: 'calendar' as SpecialView },
  { icon: '📁', label: 'Files', action: 'files' as SpecialView },
  { icon: '⏱', label: 'Time', action: 'time' as SpecialView },
]

export default function Sidebar({ pages, selectedId, onSelect, onNewPage, onDeletePage, onShowSearch, onShowOverview, onShowReport, onShowCalendar, onShowFiles, onShowTime, onShowTeam, onShowMessages, activeSpecial }: Props) {
  const roots = pages.filter(p => !p.parent_id)
  const [activeRail, setActiveRail] = useState('Home')

  const handleRail = (action: string, label: string) => {
    setActiveRail(label)
    if (action === 'search') { onShowSearch(); return }
    if (action === 'overview') { onShowOverview(); return }
    if (action === 'report') { onShowReport(); return }
    if (action === 'team') { onShowTeam(); return }
    if (action === 'messages') { onShowMessages(); return }
    if (action === 'home') { const p = pages[0]; if (p) onSelect(p.id); return }
    onShowOverview()
  }

  const handleBottom = (action: SpecialView) => {
    if (action === 'calendar') onShowCalendar()
    else if (action === 'files') onShowFiles()
    else if (action === 'time') onShowTime()
  }

  return (
    <div className="flex h-full shrink-0">
      {/* Icon rail */}
      <div className="w-14 flex flex-col items-center bg-[#0F0F13] border-r border-white/5 py-3 gap-1">
        <div className="w-8 h-8 rounded-lg bg-[#7B68EE] flex items-center justify-center text-white font-bold text-sm mb-3 cursor-pointer select-none">A</div>
        {NAV_ICONS.map(n => (
          <button key={n.label} onClick={() => handleRail(n.action, n.label)} title={n.label}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors ${(activeRail === n.label && (activeSpecial === (n.action === 'team' ? 'team' : n.action === 'messages' ? 'messages' : n.action === 'overview' ? 'overview' : n.action === 'report' ? 'report' : null))) || (activeRail === n.label && !activeSpecial && n.action === 'home') ? 'bg-[#7B68EE]/30 text-white' : 'text-[#6B7280] hover:bg-white/5 hover:text-white'}`}>
            {n.icon}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={onShowSearch} title="Search (⌘K)"
          className="w-9 h-9 rounded-full bg-[#7B68EE] flex items-center justify-center text-white text-sm font-semibold hover:bg-[#6A5ACD] transition-colors">AH</button>
      </div>

      {/* Nav panel */}
      <div className="w-56 flex flex-col bg-[#16161C] border-r border-white/5">
        <div className="px-3 py-3 border-b border-white/5">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer group">
            <span className="text-[#7B68EE]">⭐</span>
            <span className="text-white font-semibold text-sm flex-1 truncate">My Workspace</span>
            <span className="text-[#9DA5B4] text-xs opacity-0 group-hover:opacity-100">▾</span>
          </div>
        </div>

        <div className="px-3 py-2">
          <button onClick={onShowSearch}
            className="w-full flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/8 rounded-lg text-[#9DA5B4] hover:text-white text-sm transition-colors text-left">
            <span className="text-xs">🔍</span>
            <span className="text-xs">Search…</span>
            <kbd className="ml-auto text-[10px] bg-white/5 px-1 rounded border border-white/10">⌘K</kbd>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Pages</span>
            <div className="flex items-center gap-1">
              <button onClick={() => onNewPage(undefined, false)} className="text-[#6B7280] hover:text-white text-sm w-4 h-4 flex items-center justify-center transition-colors">+</button>
            </div>
          </div>
          {roots.map(page => (
            <PageItem key={page.id} page={page} pages={pages} depth={0} selectedId={selectedId} onSelect={onSelect} onNewPage={onNewPage} onDeletePage={onDeletePage} />
          ))}
        </div>

        {/* Bottom nav — all functional */}
        <div className="border-t border-white/5 px-2 py-2 space-y-0.5">
          {BOTTOM_NAV.map(item => (
            <button key={item.label} onClick={() => handleBottom(item.action)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors text-left ${activeSpecial === item.action ? 'bg-[#7B68EE]/20 text-white' : 'text-[#6B7280] hover:bg-white/5 hover:text-white'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        <div className="border-t border-white/5 px-2 py-2 space-y-0.5">
          <button onClick={onShowOverview}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors text-left ${activeSpecial === 'overview' ? 'bg-[#7B68EE]/20 text-white' : 'text-[#6B7280] hover:bg-white/5 hover:text-white'}`}>
            🗃 Overview
          </button>
          <button onClick={onShowReport}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors text-left ${activeSpecial === 'report' ? 'bg-[#7B68EE]/20 text-white' : 'text-[#6B7280] hover:bg-white/5 hover:text-white'}`}>
            📊 Report
          </button>
        </div>

        <div className="border-t border-white/5 px-4 py-2">
          <button onClick={() => onNewPage(undefined, true)} className="w-full flex items-center gap-2 py-1.5 text-[#6B7280] hover:text-white text-xs transition-colors">
            <span>+</span> New database
          </button>
          <button onClick={() => onNewPage(undefined, false)} className="w-full flex items-center gap-2 py-1.5 text-[#6B7280] hover:text-white text-xs transition-colors">
            <span>+</span> New page
          </button>
          <Link href="/monday" className="w-full flex items-center gap-2 py-1.5 text-[#6B7280] hover:text-white text-xs transition-colors mt-1 border-t border-white/5 pt-2">
            <span>📋</span> monday.com view →
          </Link>
        </div>
      </div>
    </div>
  )
}
