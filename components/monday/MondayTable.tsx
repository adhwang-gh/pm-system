'use client'

import { useState, useEffect } from 'react'
import { MColumn, MGroup, MItem } from './types'
import MondayCell from './MondayCell'

const GOLD = '#3D5A80'
const BG = '#F7F7F5'
const SURFACE = '#FFFFFF'
const BORDER = '#E8E8E4'
const TEXT = '#1A1A18'
const MUTED = '#9A9A92'

interface Props {
  boardId: string
  groups: MGroup[]
  columns: MColumn[]
  items: MItem[]
  onUpdateItem: (itemId: string, title?: string, data?: Record<string, string | number>) => void
  onDeleteItem: (itemId: string) => void
  onAddItem: (groupId: string, title: string) => void
  onAddGroup: (title: string) => void
  onToggleGroup: (groupId: string, collapsed: boolean) => void
  userId?: string
}

type SortDir = 'asc' | 'desc'

function GroupSection({ group, columns, items, onUpdateItem, onDeleteItem, onAddItem, onToggle, hiddenCols, selectedIds, onToggleSelect, onSelectAll, userId, triggerAdd }: {
  group: MGroup; columns: MColumn[]; items: MItem[]; hiddenCols: Set<string>
  selectedIds: Set<string>; onToggleSelect: (id: string) => void; onSelectAll: (ids: string[]) => void
  onUpdateItem: (itemId: string, title?: string, data?: Record<string, string | number>) => void
  onDeleteItem: (itemId: string) => void; onAddItem: (title: string) => void; onToggle: (collapsed: boolean) => void
  userId?: string; triggerAdd?: number
}) {
  const [collapsed, setCollapsed] = useState(group.collapsed === 1)
  const [addingItem, setAddingItem] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => { if (triggerAdd) { setCollapsed(false); setAddingItem(true) } }, [triggerAdd])
  const visibleCols = columns.filter(c => !hiddenCols.has(c.id))
  const allSelected = items.length > 0 && items.every(it => selectedIds.has(it.id))

  const toggle = () => { const next = !collapsed; setCollapsed(next); onToggle(next) }
  const confirmAdd = () => { if (newTitle.trim()) onAddItem(newTitle.trim()); setNewTitle(''); setAddingItem(false) }

  return (
    <tbody>
      <tr>
        <td colSpan={visibleCols.length + 3} style={{ paddingTop: 16, paddingBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderLeft: `3px solid ${group.color}` }}>
            <button onClick={toggle} style={{ color: MUTED, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, width: 14 }}>{collapsed ? '▸' : '▾'}</button>
            <span style={{ fontWeight: 700, fontSize: 12, color: group.color, letterSpacing: '0.02em' }}>{group.title}</span>
            <span style={{ fontSize: 10, color: MUTED, background: '#F3F3F0', borderRadius: 99, padding: '1px 8px' }}>{items.length}</span>
          </div>
        </td>
      </tr>

      {!collapsed && (
        <tr style={{ background: '#FFFFFF' }}>
          <td style={{ width: 32, borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, borderLeft: `3px solid ${group.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0' }}>
              <input type="checkbox" checked={allSelected} onChange={() => onSelectAll(allSelected ? [] : items.map(i => i.id))} style={{ accentColor: GOLD, width: 13, height: 13, cursor: 'pointer' }} />
            </div>
          </td>
          <th style={{ borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, fontSize: 10, fontWeight: 700, color: MUTED, textAlign: 'left', padding: '8px 12px', minWidth: 280, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'IBM Plex Mono', monospace" }}>Project</th>
          {visibleCols.map(col => (
            <th key={col.id} style={{ borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, background: '#FFFFFF', fontSize: 10, fontWeight: 700, color: MUTED, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.06em', width: col.width, minWidth: col.width, fontFamily: "'IBM Plex Mono', monospace" }}>
              <div style={{ padding: '8px 8px' }}>{col.title}</div>
            </th>
          ))}
          <th style={{ borderBottom: `1px solid ${BORDER}`, width: 32, background: '#FFFFFF' }} />
        </tr>
      )}

      {!collapsed && items.map(item => (
        <ItemRow key={item.id} item={item} columns={visibleCols} groupColor={group.color}
          selected={selectedIds.has(item.id)} onToggleSelect={() => onToggleSelect(item.id)}
          onUpdateItem={onUpdateItem} onDelete={() => onDeleteItem(item.id)} userId={userId} />
      ))}

      {!collapsed && (
        <tr>
          <td style={{ borderLeft: `3px solid ${group.color}`, borderBottom: `1px solid ${BORDER}` }} />
          <td style={{ borderBottom: `1px solid ${BORDER}` }} colSpan={visibleCols.length + 2}>
            {addingItem ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px' }}>
                <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmAdd(); if (e.key === 'Escape') { setAddingItem(false); setNewTitle('') } }}
                  onBlur={confirmAdd} placeholder="Item name…"
                  style={{ fontSize: 13, border: `1px solid ${GOLD}`, borderRadius: 10, padding: '4px 8px', outline: 'none', flex: 1, maxWidth: 280, background: '#F3F3F0', color: TEXT }} />
                <button onClick={confirmAdd} style={{ fontSize: 11, background: GOLD, color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '4px 10px', cursor: 'pointer', fontWeight: 700 }}>Add</button>
                <button onClick={() => setAddingItem(false)} style={{ fontSize: 11, color: MUTED, background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setAddingItem(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', fontSize: 12, color: MUTED, background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                + Add project
              </button>
            )}
          </td>
        </tr>
      )}

      <tr><td colSpan={visibleCols.length + 3} style={{ height: 8 }} /></tr>
    </tbody>
  )
}

function ItemRow({ item, columns, groupColor, selected, onToggleSelect, onUpdateItem, onDelete, userId }: {
  item: MItem; columns: MColumn[]; groupColor: string; selected: boolean
  onToggleSelect: () => void
  onUpdateItem: (itemId: string, title?: string, data?: Record<string, string | number>) => void
  onDelete: () => void
  userId?: string
}) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [hovered, setHovered] = useState(false)
  return (
    <tr onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ borderBottom: `1px solid ${BORDER}`, background: selected ? `${GOLD}0D` : hovered ? '#FFFFFF' : 'transparent', transition: 'background 0.1s' }}>
      <td style={{ width: 32, borderRight: `1px solid ${BORDER}`, borderLeft: `3px solid ${groupColor}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0' }}>
          <input type="checkbox" checked={selected} onChange={onToggleSelect} style={{ accentColor: GOLD, width: 13, height: 13, cursor: 'pointer', opacity: selected || hovered ? 1 : 0, transition: 'opacity 0.15s' }} />
        </div>
      </td>
      <td style={{ borderRight: `1px solid ${BORDER}`, minWidth: 280 }}>
        {editingTitle ? (
          <input autoFocus defaultValue={item.title}
            onBlur={e => { onUpdateItem(item.id, e.target.value); setEditingTitle(false) }}
            onKeyDown={e => { if (e.key === 'Enter') { onUpdateItem(item.id, e.currentTarget.value); setEditingTitle(false) } if (e.key === 'Escape') setEditingTitle(false) }}
            style={{ width: '100%', padding: '8px 12px', fontSize: 13, outline: 'none', border: `1px solid ${GOLD}`, borderRadius: 10, background: '#F3F3F0', color: TEXT }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer' }} onDoubleClick={() => setEditingTitle(true)}>
            <span style={{ fontSize: 13, color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || 'Untitled'}</span>
            {hovered && <button onClick={e => { e.stopPropagation(); onDelete() }} style={{ color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, flexShrink: 0 }}>✕</button>}
          </div>
        )}
      </td>
      {columns.map(col => (
        <td key={col.id} style={{ borderRight: `1px solid ${BORDER}`, padding: 0, width: col.width, minWidth: col.width, maxWidth: col.width, position: 'relative' }}>
          <MondayCell col={col} value={item.data[col.id]} onChange={v => onUpdateItem(item.id, undefined, { [col.id]: v })} userId={userId} />
        </td>
      ))}
      <td style={{ width: 32 }} />
    </tr>
  )
}

export default function MondayTable({ groups, columns, items, onUpdateItem, onDeleteItem, onAddItem, onAddGroup, onToggleGroup, userId }: Props) {
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [showSort, setShowSort] = useState(false)
  const [showHide, setShowHide] = useState(false)
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set())
  const [filterStatus, setFilterStatus] = useState<string[]>([])
  const [sortColId, setSortColId] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [groupMode, setGroupMode] = useState<'group' | 'flat' | 'status' | 'priority' | 'phase'>('group')
  const [showGroupBy, setShowGroupBy] = useState(false)
  const [addTrigger, setAddTrigger] = useState(0)
  const [addingGroup, setAddingGroup] = useState(false)
  const [newGroupTitle, setNewGroupTitle] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const statusCols = columns.filter(c => c.type === 'status')
  const allStatusValues = Array.from(new Set(statusCols.flatMap(sc => {
    const opts = sc.options as { values?: string[] }
    return opts?.values ?? []
  })))

  let filtered = search
    ? items.filter(it => it.title.toLowerCase().includes(search.toLowerCase()) || Object.values(it.data).some(v => String(v).toLowerCase().includes(search.toLowerCase())))
    : items

  if (filterStatus.length > 0) {
    filtered = filtered.filter(it => statusCols.some(sc => filterStatus.includes(String(it.data[sc.id] ?? ''))))
  }

  if (sortColId) {
    filtered = [...filtered].sort((a, b) => {
      const av = sortColId === 'title' ? (a.title ?? '') : String(a.data[sortColId] ?? '')
      const bv = sortColId === 'title' ? (b.title ?? '') : String(b.data[sortColId] ?? '')
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }

  const toggleFilterStatus = (val: string) => setFilterStatus(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  const handleHeaderSort = (colId: string) => {
    if (sortColId === colId) {
      sortDir === 'asc' ? setSortDir('desc') : (setSortColId(null), setSortDir('asc'))
    } else { setSortColId(colId); setSortDir('asc') }
  }
  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const handleSelectAll = (ids: string[]) => setSelectedIds(ids.length === 0 ? new Set() : new Set(ids))
  const bulkDelete = () => { selectedIds.forEach(id => onDeleteItem(id)); setSelectedIds(new Set()) }
  const confirmAddGroup = () => { if (newGroupTitle.trim()) onAddGroup(newGroupTitle.trim()); setNewGroupTitle(''); setAddingGroup(false) }
  const activeFilterCount = filterStatus.length + (sortColId ? 1 : 0) + hiddenCols.size
  const visibleCols = columns.filter(c => !hiddenCols.has(c.id))

  const toolBtn = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', fontSize: 12,
    borderRadius: 7, cursor: 'pointer', border: `1px solid ${active ? GOLD + '55' : '#DDDDD8'}`,
    background: active ? `${GOLD}10` : 'transparent', color: active ? GOLD : '#555', transition: 'all 0.15s',
  })

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute', top: 36, left: 0, zIndex: 50, background: '#FFFFFF', border: `1px solid #DDDDD8`,
    borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', width: 200, padding: '6px 0',
  }

  const dropdownItem = (active = false): React.CSSProperties => ({
    width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px',
    fontSize: 12, color: active ? GOLD : '#888', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG }}>
      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 24px', background: GOLD, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected</span>
          <div style={{ flex: 1 }} />
          <button onClick={bulkDelete} style={{ fontSize: 12, color: '#FFFFFF', background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: 7, padding: '4px 12px', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
          <button onClick={() => setSelectedIds(new Set())} style={{ fontSize: 12, color: '#FFFFFF', background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: 7, padding: '4px 12px', cursor: 'pointer' }}>Deselect</button>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderBottom: `1px solid ${BORDER}`, background: SURFACE, flexShrink: 0, flexWrap: 'wrap' }}>
        <button onClick={() => setAddTrigger(n => n + 1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: GOLD, color: '#FFFFFF', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          + New project
        </button>

        <div style={{ width: 1, height: 18, background: '#DDDDD8', margin: '0 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F3F0', border: '1px solid #DDDDD8', borderRadius: 7, padding: '5px 10px' }}>
          <span style={{ color: '#6B7280', fontSize: 12 }}>⊕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"
            style={{ background: 'transparent', fontSize: 12, color: TEXT, outline: 'none', width: 100, border: 'none' }} />
          {search && <button onClick={() => setSearch('')} style={{ color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}>✕</button>}
        </div>

        {/* Filter */}
        <div style={{ position: 'relative' }}>
          <button style={toolBtn(showFilter || filterStatus.length > 0)} onClick={() => { setShowFilter(v => !v); setShowSort(false); setShowHide(false) }}>
            Filter {filterStatus.length > 0 && <span style={{ background: GOLD, color: '#FFFFFF', fontSize: 9, borderRadius: 99, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{filterStatus.length}</span>}
          </button>
          {showFilter && (
            <div style={dropdownStyle}>
              {statusCols.length === 0 ? (
                <div style={{ padding: '8px 14px', fontSize: 12, color: '#6B7280' }}>No status columns found</div>
              ) : statusCols.map((sc, si) => {
                const opts = sc.options as { values?: string[] }
                const vals = opts?.values ?? []
                return (
                  <div key={sc.id}>
                    {si > 0 && <div style={{ borderTop: `1px solid #E8E8E4`, margin: '4px 0' }} />}
                    <div style={{ padding: '6px 14px 4px', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{sc.title}</div>
                    {vals.map(val => (
                      <button key={val} onClick={() => toggleFilterStatus(val)} style={dropdownItem(filterStatus.includes(val))}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, border: `1px solid ${filterStatus.includes(val) ? GOLD : '#333'}`, background: filterStatus.includes(val) ? GOLD : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {filterStatus.includes(val) && <span style={{ color: '#FFFFFF', fontSize: 8, fontWeight: 900 }}>✓</span>}
                        </div>
                        {val}
                      </button>
                    ))}
                  </div>
                )
              })}
              {filterStatus.length > 0 && (
                <button onClick={() => setFilterStatus([])} style={{ ...dropdownItem(), color: '#c0392b', borderTop: `1px solid #E8E8E4`, marginTop: 4 }}>Clear filters</button>
              )}
            </div>
          )}
        </div>

        {/* Sort */}
        <div style={{ position: 'relative' }}>
          <button style={toolBtn(showSort || !!sortColId)} onClick={() => { setShowSort(v => !v); setShowFilter(false); setShowHide(false) }}>
            Sort {sortColId && <span style={{ fontSize: 10, opacity: 0.7 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
          </button>
          {showSort && (
            <div style={dropdownStyle}>
              <div style={{ padding: '4px 14px 8px', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid #E8E8E4`, marginBottom: 4 }}>Sort by</div>
              <button onClick={() => { setSortColId(null); setSortDir('asc'); setShowSort(false) }} style={dropdownItem(!sortColId)}>None</button>
              <button onClick={() => { setSortColId('title'); setSortDir(sortColId === 'title' && sortDir === 'asc' ? 'desc' : 'asc'); setShowSort(false) }} style={dropdownItem(sortColId === 'title')}>
                Project name {sortColId === 'title' && <span>{sortDir === 'asc' ? 'A→Z' : 'Z→A'}</span>}
              </button>
              {columns.map(col => (
                <button key={col.id} onClick={() => { handleHeaderSort(col.id); setShowSort(false) }} style={dropdownItem(sortColId === col.id)}>
                  {col.title} {sortColId === col.id && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hide */}
        <div style={{ position: 'relative' }}>
          <button style={toolBtn(showHide || hiddenCols.size > 0)} onClick={() => { setShowHide(v => !v); setShowFilter(false); setShowSort(false) }}>
            Hide {hiddenCols.size > 0 && <span style={{ background: GOLD, color: '#FFFFFF', fontSize: 9, borderRadius: 99, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{hiddenCols.size}</span>}
          </button>
          {showHide && (
            <div style={dropdownStyle}>
              <div style={{ padding: '4px 14px 8px', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid #E8E8E4`, marginBottom: 4 }}>Columns</div>
              {columns.map(col => (
                <button key={col.id} onClick={() => setHiddenCols(prev => { const n = new Set(prev); n.has(col.id) ? n.delete(col.id) : n.add(col.id); return n })} style={dropdownItem(!hiddenCols.has(col.id))}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, border: `1px solid ${!hiddenCols.has(col.id) ? GOLD : '#333'}`, background: !hiddenCols.has(col.id) ? GOLD : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {!hiddenCols.has(col.id) && <span style={{ color: '#FFFFFF', fontSize: 8, fontWeight: 900 }}>✓</span>}
                  </div>
                  {col.title}
                </button>
              ))}
              {hiddenCols.size > 0 && <button onClick={() => setHiddenCols(new Set())} style={{ ...dropdownItem(true), borderTop: `1px solid #E8E8E4`, marginTop: 4 }}>Show all</button>}
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button style={toolBtn(showGroupBy || groupMode !== 'group')} onClick={() => { setShowGroupBy(v => !v); setShowFilter(false); setShowSort(false); setShowHide(false) }}>
            Group by{groupMode !== 'group' ? `: ${groupMode.charAt(0).toUpperCase() + groupMode.slice(1)}` : ''}
          </button>
          {showGroupBy && (
            <div style={dropdownStyle}>
              <div style={{ padding: '4px 14px 8px', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid #E8E8E4`, marginBottom: 4 }}>Group by</div>
              {(['group', 'flat', 'status', 'priority', 'phase'] as const).map(m => (
                <button key={m} onClick={() => { setGroupMode(m); setShowGroupBy(false) }} style={dropdownItem(groupMode === m)}>
                  {m === 'group' ? 'None (default)' : m.charAt(0).toUpperCase() + m.slice(1)}
                  {groupMode === m && <span style={{ marginLeft: 'auto', color: GOLD }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button onClick={() => { setFilterStatus([]); setSortColId(null); setHiddenCols(new Set()) }}
            style={{ fontSize: 11, color: '#c0392b', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      {(showFilter || showSort || showHide || showGroupBy) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => { setShowFilter(false); setShowSort(false); setShowHide(false); setShowGroupBy(false) }} />
      )}

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', background: BG }}>
        {groups.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '64px 32px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>This workspace is empty</h3>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>Add a project or create a group to get started</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => onAddItem('', 'New project')} style={{ padding: '8px 16px', background: GOLD, color: '#FFFFFF', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ New project</button>
              <button onClick={() => onAddGroup('Group 1')} style={{ padding: '8px 16px', background: 'transparent', color: '#6B7280', border: '1px solid #DDDDD8', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>+ Add group</button>
            </div>
          </div>
        ) : groupMode === 'group' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            {groups.map((group, gi) => {
              const groupItems = filtered.filter(it => it.group_id === group.id)
              return (
                <GroupSection key={group.id} group={group} columns={columns} items={groupItems} hiddenCols={hiddenCols}
                  selectedIds={selectedIds} onToggleSelect={toggleSelect}
                  onSelectAll={(ids) => handleSelectAll(ids)}
                  onUpdateItem={onUpdateItem} onDeleteItem={onDeleteItem}
                  onAddItem={(title) => onAddItem(group.id, title)}
                  onToggle={(c) => onToggleGroup(group.id, c)} userId={userId}
                  triggerAdd={gi === 0 ? addTrigger : undefined} />
              )
            })}
            <tbody>
              <tr>
                <td colSpan={visibleCols.length + 3} style={{ paddingTop: 8, paddingBottom: 16, paddingLeft: 24 }}>
                  {addingGroup ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input autoFocus value={newGroupTitle} onChange={e => setNewGroupTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') confirmAddGroup(); if (e.key === 'Escape') { setAddingGroup(false); setNewGroupTitle('') } }}
                        placeholder="Group name…"
                        style={{ fontSize: 13, border: `1px solid ${GOLD}`, borderRadius: 10, padding: '4px 8px', outline: 'none', maxWidth: 240, background: '#F3F3F0', color: TEXT }} />
                      <button onClick={confirmAddGroup} style={{ fontSize: 11, background: GOLD, color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '4px 10px', cursor: 'pointer', fontWeight: 700 }}>Create</button>
                      <button onClick={() => { setAddingGroup(false); setNewGroupTitle('') }} style={{ fontSize: 11, color: MUTED, background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setAddingGroup(true)} style={{ fontSize: 12, color: MUTED, background: 'none', border: 'none', cursor: 'pointer' }}>
                      + Add new group
                    </button>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#FFFFFF' }}>
                <td style={{ width: 32, borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0' }}>
                    <input type="checkbox" style={{ accentColor: GOLD, width: 13, height: 13, cursor: 'pointer' }}
                      checked={filtered.length > 0 && filtered.every(it => selectedIds.has(it.id))}
                      onChange={() => { const allSel = filtered.every(it => selectedIds.has(it.id)); handleSelectAll(allSel ? [] : filtered.map(i => i.id)) }} />
                  </div>
                </td>
                <th onClick={() => handleHeaderSort('title')} style={{ borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, fontSize: 10, fontWeight: 700, color: MUTED, textAlign: 'left', padding: '8px 12px', minWidth: 280, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', userSelect: 'none', fontFamily: "'IBM Plex Mono', monospace" }}>
                  Project {sortColId === 'title' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                {visibleCols.map(col => (
                  <th key={col.id} onClick={() => handleHeaderSort(col.id)}
                    style={{ borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, fontSize: 10, fontWeight: 700, color: MUTED, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', userSelect: 'none', width: col.width, minWidth: col.width, fontFamily: "'IBM Plex Mono', monospace" }}>
                    <div style={{ padding: '8px 8px' }}>{col.title} {sortColId === col.id && (sortDir === 'asc' ? '↑' : '↓')}</div>
                  </th>
                ))}
                <th style={{ borderBottom: `1px solid ${BORDER}`, width: 32 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <ItemRow key={item.id} item={item} columns={visibleCols}
                  groupColor={groups.find(g => g.id === item.group_id)?.color ?? '#444'}
                  selected={selectedIds.has(item.id)} onToggleSelect={() => toggleSelect(item.id)}
                  onUpdateItem={onUpdateItem} onDelete={() => onDeleteItem(item.id)} userId={userId} />
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={visibleCols.length + 3} style={{ textAlign: 'center', padding: '48px', fontSize: 13, color: MUTED }}>No items match your filters</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
