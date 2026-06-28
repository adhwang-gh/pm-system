'use client'

import { useEffect, useState, useCallback } from 'react'
import { Page } from '@/lib/types'
import Sidebar from '@/components/Sidebar'
import Editor from '@/components/Editor'
import DatabaseView from '@/components/DatabaseView'
import OverviewDashboard from '@/components/OverviewDashboard'
import ReportView from '@/components/ReportView'
import CalendarTracker from '@/components/CalendarTracker'
import FilesView from '@/components/FilesView'
import TimeTracker from '@/components/TimeTracker'
import TeamView from '@/components/TeamView'
import MessagesView from '@/components/MessagesView'
import SearchModal from '@/components/SearchModal'

type SpecialView = 'overview' | 'report' | 'calendar' | 'files' | 'time' | 'team' | 'messages' | null

export default function Home() {
  const [pages, setPages] = useState<Page[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [specialView, setSpecialView] = useState<SpecialView>(null)
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    fetch('/api/pages').then(r => r.json()).then((data: Page[]) => {
      setPages(data)
      if (data.length > 0) setSelectedId(data[0].id)
    })
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(v => !v) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const selectedPage = pages.find(p => p.id === selectedId) ?? null

  const handleNewPage = async (parentId?: string, isDatabase = false) => {
    const res = await fetch('/api/pages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: isDatabase ? 'New Database' : 'Untitled', parent_id: parentId ?? null, icon: isDatabase ? '📋' : '📄', is_database: isDatabase ? 1 : 0 }),
    })
    const page: Page = await res.json()
    setPages(prev => [...prev, page])
    setSelectedId(page.id)
    setSpecialView(null)
  }

  const handleDeletePage = async (id: string) => {
    if (!confirm('Delete this page?')) return
    await fetch(`/api/pages/${id}`, { method: 'DELETE' })
    setPages(prev => prev.filter(p => p.id !== id))
    if (selectedId === id) { setSelectedId(pages.find(p => p.id !== id)?.id ?? null); setSpecialView(null) }
  }

  const handleUpdate = async (title: string, content: string) => {
    if (!selectedId) return
    const res = await fetch(`/api/pages/${selectedId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    })
    const updated: Page = await res.json()
    setPages(prev => prev.map(p => p.id === selectedId ? updated : p))
  }

  const goSpecial = (v: SpecialView) => { setSpecialView(v); setSelectedId(null) }
  const goPage = (id: string) => { setSelectedId(id); setSpecialView(null) }

  return (
    <div className="flex h-full bg-[#111118]">
      <Sidebar
        pages={pages}
        selectedId={specialView ? null : selectedId}
        onSelect={goPage}
        onNewPage={handleNewPage}
        onDeletePage={handleDeletePage}
        onShowSearch={() => setShowSearch(true)}
        onShowOverview={() => goSpecial('overview')}
        onShowReport={() => goSpecial('report')}
        onShowCalendar={() => goSpecial('calendar')}
        onShowFiles={() => goSpecial('files')}
        onShowTime={() => goSpecial('time')}
        onShowTeam={() => goSpecial('team')}
        onShowMessages={() => goSpecial('messages')}
        activeSpecial={specialView}
      />
      <main className="flex-1 overflow-hidden flex flex-col">
        {specialView === 'overview' ? <OverviewDashboard pages={pages} onNavigate={goPage} />
          : specialView === 'report' ? <ReportView pages={pages} />
          : specialView === 'calendar' ? <CalendarTracker />
          : specialView === 'files' ? <FilesView />
          : specialView === 'time' ? <TimeTracker />
          : specialView === 'team' ? <TeamView />
          : specialView === 'messages' ? <MessagesView />
          : !selectedPage ? (
            <div className="flex-1 flex items-center justify-center bg-[#111118] text-gray-600">
              <div className="text-center">
                <div className="text-6xl mb-4">🗒️</div>
                <p className="text-lg mb-4">Select a page or create a new one</p>
                <button onClick={() => handleNewPage()} className="px-4 py-2 bg-[#7B68EE] text-white rounded-lg text-sm hover:bg-[#6A5ACD] transition-colors">+ New page</button>
              </div>
            </div>
          ) : selectedPage.is_database === 1
            ? <DatabaseView key={selectedPage.id} page={selectedPage} />
            : <Editor key={selectedPage.id} page={selectedPage} onUpdate={handleUpdate} />
        }
      </main>

      {showSearch && (
        <SearchModal pages={pages} onSelect={goPage} onClose={() => setShowSearch(false)} />
      )}
    </div>
  )
}
