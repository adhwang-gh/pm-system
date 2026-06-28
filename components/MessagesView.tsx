'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  author: string
  initials: string
  color: string
  text: string
  ts: Date
}

const SEED: Message[] = [
  { id: '1', author: 'Sarah Kim', initials: 'SK', color: '#10B981', text: 'Hey team! Just updated the content brief for the Q3 campaign. Please review when you get a chance.', ts: new Date(Date.now() - 3600000 * 3) },
  { id: '2', author: 'James Park', initials: 'JP', color: '#3B82F6', text: 'Thanks Sarah, I\'ll take a look this afternoon. Also, the client approved the new landing page design 🎉', ts: new Date(Date.now() - 3600000 * 2) },
  { id: '3', author: 'Mia Chen', initials: 'MC', color: '#F59E0B', text: 'Great news! I\'ve moved the Production tasks to the Review stage. @Addison can you sign off on those?', ts: new Date(Date.now() - 3600000) },
]

function fmtTime(d: Date) {
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return d.toLocaleDateString()
}

export default function MessagesView() {
  const [messages, setMessages] = useState<Message[]>(SEED)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      author: 'Addison Hwang',
      initials: 'AH',
      color: '#7B68EE',
      text,
      ts: new Date(),
    }])
    setDraft('')
  }

  return (
    <div className="flex-1 flex flex-col bg-[#111118] overflow-hidden">
      {/* Header */}
      <div className="px-8 py-5 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#7B68EE]/20 flex items-center justify-center text-lg">💬</div>
          <div>
            <h1 className="text-lg font-bold text-white">Team Chat</h1>
            <p className="text-gray-500 text-xs">General workspace channel · 4 members</p>
          </div>
          <div className="flex-1" />
          <div className="flex -space-x-1.5">
            {[{ i: 'AH', c: '#7B68EE' }, { i: 'SK', c: '#10B981' }, { i: 'JP', c: '#3B82F6' }, { i: 'MC', c: '#F59E0B' }].map(m => (
              <div key={m.i} className="w-7 h-7 rounded-full border-2 border-[#111118] flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: m.c }}>{m.i}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {/* Date separator */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-xs text-gray-600">Today</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {messages.map(msg => {
          const isMe = msg.author === 'Addison Hwang'
          return (
            <div key={msg.id} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: msg.color }}>
                {msg.initials}
              </div>
              <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`flex items-baseline gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs font-semibold text-white">{isMe ? 'You' : msg.author}</span>
                  <span className="text-[10px] text-gray-600">{fmtTime(msg.ts)}</span>
                </div>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-[#7B68EE] text-white rounded-tr-sm' : 'bg-[#1A1A24] text-gray-200 border border-white/5 rounded-tl-sm'}`}>
                  {msg.text}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-8 py-4 border-t border-white/5 shrink-0">
        <div className="flex items-end gap-3 bg-[#1A1A24] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#7B68EE] transition-colors">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Message the team… (Enter to send)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none resize-none leading-relaxed"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            className="w-8 h-8 rounded-xl bg-[#7B68EE] flex items-center justify-center text-white hover:bg-[#6A5ACD] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
        <p className="text-[10px] text-gray-700 mt-1.5 text-center">Shift+Enter for new line · Enter to send</p>
      </div>
    </div>
  )
}
