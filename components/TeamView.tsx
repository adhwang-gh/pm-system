'use client'

import { useState } from 'react'

interface Member {
  id: string
  name: string
  role: string
  email: string
  initials: string
  color: string
}

const INITIAL: Member[] = [
  { id: '1', name: 'Addison Hwang', role: 'Admin', email: 'addison@arcelispartners.com', initials: 'AH', color: '#7B68EE' },
  { id: '2', name: 'Sarah Kim', role: 'Editor', email: 'sarah@arcelispartners.com', initials: 'SK', color: '#10B981' },
  { id: '3', name: 'James Park', role: 'Viewer', email: 'james@arcelispartners.com', initials: 'JP', color: '#3B82F6' },
  { id: '4', name: 'Mia Chen', role: 'Editor', email: 'mia@arcelispartners.com', initials: 'MC', color: '#F59E0B' },
]

const ROLES = ['Admin', 'Editor', 'Viewer']
const COLORS = ['#7B68EE', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4']

export default function TeamView() {
  const [members, setMembers] = useState<Member[]>(INITIAL)
  const [showInvite, setShowInvite] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Editor')
  const [search, setSearch] = useState('')

  const addMember = () => {
    if (!name.trim() || !email.trim()) return
    const parts = name.trim().split(' ')
    const initials = parts.map(p => p[0]?.toUpperCase() ?? '').join('').slice(0, 2)
    const color = COLORS[members.length % COLORS.length]
    setMembers(prev => [...prev, { id: Date.now().toString(), name: name.trim(), role, email: email.trim(), initials, color }])
    setName(''); setEmail(''); setRole('Editor')
    setShowInvite(false)
  }

  const removeMember = (id: string) => setMembers(prev => prev.filter(m => m.id !== id))

  const filtered = search ? members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())) : members

  return (
    <div className="flex-1 overflow-y-auto bg-[#111118]">
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Team</h1>
            <p className="text-gray-500 text-sm">{members.length} members in this workspace</p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="px-4 py-2 bg-[#7B68EE] text-white rounded-lg text-sm font-semibold hover:bg-[#6A5ACD] transition-colors"
          >
            + Invite member
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 mb-6">
          <span className="text-gray-500">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members…"
            className="bg-transparent text-sm text-white placeholder-gray-600 outline-none flex-1"
          />
        </div>

        {/* Members list */}
        <div className="bg-[#1A1A24] border border-white/8 rounded-2xl overflow-hidden mb-6">
          <div className="flex items-center gap-4 px-5 py-3 border-b border-white/5">
            <div className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Member</div>
            <div className="w-32 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</div>
            <div className="w-48 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</div>
            <div className="w-8" />
          </div>
          {filtered.map(m => (
            <div key={m.id} className="group flex items-center gap-4 px-5 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: m.color }}>
                  {m.initials}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{m.name}</div>
                  <div className="text-xs text-gray-500">{m.id === '1' ? 'You' : 'Active'}</div>
                </div>
              </div>
              <div className="w-32">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${m.role === 'Admin' ? 'bg-[#7B68EE]/20 text-[#7B68EE]' : m.role === 'Editor' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-gray-400'}`}>
                  {m.role}
                </span>
              </div>
              <div className="w-48 text-sm text-gray-400 truncate">{m.email}</div>
              {m.id !== '1' && (
                <button onClick={() => removeMember(m.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-sm transition-all w-8 text-center">✕</button>
              )}
              {m.id === '1' && <div className="w-8" />}
            </div>
          ))}
        </div>

        {/* Roles legend */}
        <div className="bg-[#1A1A24] border border-white/8 rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Role permissions</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { role: 'Admin', color: '#7B68EE', perms: ['Can edit all pages', 'Manage team members', 'Delete workspace', 'Manage settings'] },
              { role: 'Editor', color: '#10B981', perms: ['Can edit all pages', 'Create new pages', 'Comment on pages', 'Cannot delete workspace'] },
              { role: 'Viewer', color: '#6B7280', perms: ['Can view all pages', 'Can comment on pages', 'Cannot edit content', 'Cannot manage members'] },
            ].map(r => (
              <div key={r.role} className="p-4 bg-white/3 rounded-xl border border-white/5">
                <div className="text-sm font-semibold mb-3" style={{ color: r.color }}>{r.role}</div>
                <ul className="space-y-1.5">
                  {r.perms.map(p => (
                    <li key={p} className="text-xs text-gray-500 flex items-start gap-1.5">
                      <span className="text-[10px] mt-0.5" style={{ color: r.color }}>●</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowInvite(false)}>
          <div className="bg-[#1A1A24] border border-white/10 rounded-2xl p-6 w-[420px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-1">Invite team member</h2>
            <p className="text-gray-500 text-sm mb-5">They'll get access to this workspace immediately.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Full name</label>
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#7B68EE] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email address</label>
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addMember() }}
                  placeholder="jane@company.com"
                  type="email"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#7B68EE] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#7B68EE] transition-colors"
                >
                  {ROLES.map(r => <option key={r} value={r} className="bg-[#1A1A24]">{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInvite(false)}
                className="flex-1 py-2.5 border border-white/10 text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
              >Cancel</button>
              <button
                onClick={addMember}
                disabled={!name.trim() || !email.trim()}
                className="flex-1 py-2.5 bg-[#7B68EE] text-white rounded-lg text-sm font-semibold hover:bg-[#6A5ACD] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >Invite</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
