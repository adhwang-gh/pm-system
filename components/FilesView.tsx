'use client'

import { useEffect, useState } from 'react'

interface FileEntry { id: string; name: string; type: string; size: string; url: string; tags: string; created_at: string }

const FILE_ICONS: Record<string, string> = {
  pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
  ppt: '📋', pptx: '📋', png: '🖼️', jpg: '🖼️', jpeg: '🖼️',
  gif: '🖼️', mp4: '🎬', mp3: '🎵', zip: '🗜️', folder: '📁',
  link: '🔗', file: '📎',
}

const FILE_TYPES = ['file', 'folder', 'link', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'mp4', 'zip']

function FileModal({ onAdd, onClose }: { onAdd: (f: Partial<FileEntry>) => void; onClose: () => void }) {
  const [form, setForm] = useState<Partial<FileEntry>>({ type: 'file', name: '' })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1A1A24] border border-white/10 rounded-2xl shadow-2xl w-[420px] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-lg">Add File</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Name</label>
            <input autoFocus value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="filename.pdf"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#7B68EE]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Type</label>
              <select value={form.type ?? 'file'} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#7B68EE] [color-scheme:dark]">
                {FILE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Size</label>
              <input value={form.size ?? ''} onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                placeholder="2.4 MB"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#7B68EE]" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">URL / Path (optional)</label>
            <input value={form.url ?? ''} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://… or /path/to/file"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#7B68EE]" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Tags (comma separated)</label>
            <input value={form.tags ?? ''} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="design, marketing, q3"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#7B68EE]" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => { if (form.name) { onAdd(form); onClose() } }}
            className="flex-1 bg-[#7B68EE] hover:bg-[#6A5ACD] text-white py-2 rounded-lg text-sm font-semibold transition-colors">Add File</button>
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-sm border border-white/10 rounded-lg hover:bg-white/5 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function FilesView() {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetch('/api/files').then(r => r.json()).then(setFiles)
  }, [])

  const addFile = async (form: Partial<FileEntry>) => {
    const res = await fetch('/api/files', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const f = await res.json()
    setFiles(prev => [f, ...prev])
  }

  const deleteFile = async (id: string) => {
    await fetch('/api/files', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const types = ['all', ...Array.from(new Set(files.map(f => f.type)))]
  const filtered = files.filter(f => {
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.tags.toLowerCase().includes(search.toLowerCase())
    const matchType = filter === 'all' || f.type === filter
    return matchSearch && matchType
  })

  const totalSize = files.filter(f => f.size).length

  return (
    <div className="flex-1 overflow-y-auto bg-[#111118]">
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Files</h1>
            <p className="text-gray-500 text-sm">{files.length} files · {totalSize} with sizes tracked</p>
          </div>
          <div className="flex-1" />
          <button onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-lg transition-colors">
            {view === 'grid' ? '☰' : '⊞'}
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#7B68EE] hover:bg-[#6A5ACD] text-white rounded-lg text-sm font-semibold transition-colors">
            + Add File
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
            <span className="text-gray-500 text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files…"
              className="bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none flex-1" />
          </div>
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {types.slice(0, 6).map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${filter === t ? 'bg-[#7B68EE] text-white' : 'text-gray-400 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-lg mb-2">No files yet</p>
            <button onClick={() => setShowModal(true)} className="text-[#7B68EE] hover:text-[#9D8FFF] text-sm transition-colors">+ Add your first file</button>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-4 gap-4">
            {filtered.map(f => {
              const icon = FILE_ICONS[f.type] ?? FILE_ICONS['file']
              const tags = f.tags ? f.tags.split(',').map(t => t.trim()).filter(Boolean) : []
              return (
                <div key={f.id} className="group bg-[#1A1A24] border border-white/8 rounded-xl p-4 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 transition-all">
                  <div className="text-4xl mb-3 text-center">{icon}</div>
                  <p className="text-sm font-medium text-white truncate text-center mb-1">{f.name}</p>
                  {f.size && <p className="text-xs text-gray-600 text-center">{f.size}</p>}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 justify-center">
                      {tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 bg-white/5 text-gray-400 rounded">{t}</span>)}
                    </div>
                  )}
                  {f.url && (
                    <a href={f.url} target="_blank" rel="noopener noreferrer"
                      className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-[#7B68EE] hover:text-[#9D8FFF] transition-colors">
                      🔗 Open
                    </a>
                  )}
                  <button onClick={() => deleteFile(f.id)} className="mt-2 w-full text-[10px] text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">Delete</button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-[#13131A] rounded-xl border border-white/8 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Size</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tags</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Added</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => {
                  const icon = FILE_ICONS[f.type] ?? FILE_ICONS['file']
                  const tags = f.tags ? f.tags.split(',').map(t => t.trim()).filter(Boolean) : []
                  return (
                    <tr key={f.id} className="group border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3 flex items-center gap-3">
                        <span className="text-xl">{icon}</span>
                        <div>
                          <p className="text-sm font-medium text-white">{f.name}</p>
                          {f.url && <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#7B68EE] hover:text-[#9D8FFF] truncate max-w-xs block">{f.url}</a>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 uppercase">{f.type}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{f.size || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 bg-white/5 text-gray-400 rounded">{t}</span>)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{new Date(f.created_at).toLocaleDateString()}</td>
                      <td className="px-2 py-3">
                        <button onClick={() => deleteFile(f.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-sm transition-all">✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showModal && <FileModal onAdd={addFile} onClose={() => setShowModal(false)} />}
    </div>
  )
}
