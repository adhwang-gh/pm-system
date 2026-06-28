'use client'

import { useState, useEffect, useRef } from 'react'
import { Page } from '@/lib/types'

interface Props {
  pages: Page[]
  onSelect: (id: string) => void
  onClose: () => void
}

export default function SearchModal({ pages, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const results = query.trim()
    ? pages.filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
    : pages.slice(0, 8)

  useEffect(() => { setIdx(0) }, [query])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[idx]) { onSelect(results[idx].id); onClose() }
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[560px] bg-[#1A1A24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/8">
          <span className="text-gray-500">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search pages…"
            className="flex-1 bg-transparent text-white text-base outline-none placeholder-gray-600"
          />
          <kbd className="text-xs text-gray-600 bg-white/5 px-2 py-1 rounded border border-white/10">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-600 text-sm">No pages found</div>
          ) : (
            results.map((page, i) => (
              <button
                key={page.id}
                onClick={() => { onSelect(page.id); onClose() }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === idx ? 'bg-[#7B68EE]/20 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
              >
                <span className="text-lg shrink-0">{page.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{page.title || 'Untitled'}</div>
                  <div className="text-xs text-gray-600">{page.is_database ? 'Database' : 'Page'}</div>
                </div>
                {i === idx && <kbd className="text-xs text-gray-600 shrink-0">↵</kbd>}
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-white/8 flex items-center gap-4 text-xs text-gray-600">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  )
}
