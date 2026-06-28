'use client'

import { useEffect, useState } from 'react'

const GOLD = '#C9A24B'
const BG = '#141414'
const SURFACE = '#1C1C1C'
const BORDER = '#2A2A2A'
const TEXT = '#EDE8DD'
const MUTED = '#8A8478'

interface Integration {
  id: string; board_id: string; type: string; connected: number
  config: Record<string, string>; updated_at: string
}

const INTEGRATIONS = [
  { type: 'slack',  name: 'Slack',           desc: 'Post notifications when items change.',        configFields: [{ key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/...' }] },
  { type: 'zapier', name: 'Zapier',           desc: 'Trigger Zaps on item create/update/delete.',   configFields: [{ key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://hooks.zapier.com/hooks/catch/...' }] },
  { type: 'gcal',   name: 'Google Calendar',  desc: 'Export timeline items as an .ics file.',       configFields: [], exportable: true },
  { type: 'github', name: 'GitHub',           desc: 'Link a GitHub repo to this board.',            configFields: [{ key: 'repo_url', label: 'Repository URL', placeholder: 'https://github.com/org/repo' }] },
  { type: 'figma',  name: 'Figma',            desc: 'Link your Figma project for reference.',       configFields: [{ key: 'figma_url', label: 'Figma File URL', placeholder: 'https://figma.com/file/...' }] },
  { type: 'gmail',  name: 'Gmail',            desc: 'Send email notifications via webhook.',        configFields: [{ key: 'webhook_url', label: 'Email Webhook URL', placeholder: 'https://...' }] },
]

export default function IntegrateModal({ boardId, onClose }: { boardId: string; onClose: () => void }) {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [configDraft, setConfigDraft] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/monday/api/boards/${boardId}/integrations`).then(r => r.json()).then(setIntegrations)
  }, [boardId])

  const getIntegration = (type: string) => integrations.find(i => i.type === type)

  const openConfig = (type: string) => {
    setConfigDraft(getIntegration(type)?.config ?? {})
    setSelected(type)
    setTestResult(null)
  }

  const save = async (type: string, connected: boolean) => {
    setSaving(true)
    const integration = getIntegration(type)
    if (!integration) return
    const res = await fetch(`/monday/api/boards/${boardId}/integrations`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ integrationId: integration.id, connected, config: configDraft }),
    })
    const updated = await res.json()
    setIntegrations(prev => prev.map(i => i.id === updated.id ? updated : i))
    setSaving(false); setSelected(null)
  }

  const disconnect = async (type: string) => {
    const integration = getIntegration(type)
    if (!integration) return
    await fetch(`/monday/api/boards/${boardId}/integrations`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ integrationId: integration.id, connected: false, config: {} }),
    })
    setIntegrations(prev => prev.map(i => i.type === type ? { ...i, connected: 0, config: {} } : i))
  }

  const testWebhook = async () => {
    const url = configDraft.webhook_url
    if (!url) return
    setTestResult('Sending test…')
    try {
      await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: 'PM System', event: 'test' }) })
      setTestResult('Sent. Check your destination.')
    } catch { setTestResult('Could not reach URL. Check it and try again.') }
  }

  const selectedDef = INTEGRATIONS.find(i => i.type === selected)
  const selectedIntegration = selected ? getIntegration(selected) : null

  const inputStyle: React.CSSProperties = { width: '100%', background: '#0D0D0D', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 12px', color: TEXT, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.8)', width: 560, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: `1px solid ${BORDER}` }}>
          {selected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setSelected(null)} style={{ color: MUTED, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>←</button>
              <div>
                <div style={{ color: '#F0F0F0', fontWeight: 700, fontSize: 14 }}>{selectedDef?.name}</div>
                <div style={{ color: MUTED, fontSize: 11, marginTop: 2 }}>{selectedDef?.desc}</div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ color: '#F0F0F0', fontWeight: 700, fontSize: 16 }}>Integrations</div>
              <div style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>Connect external tools to this board</div>
            </div>
          )}
          <button onClick={onClose} style={{ color: MUTED, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {!selected ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 16 }}>
              {INTEGRATIONS.map(def => {
                const integration = getIntegration(def.type)
                const isConnected = integration?.connected === 1
                return (
                  <div key={def.type} onClick={() => openConfig(def.type)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, border: `1px solid ${isConnected ? GOLD + '44' : BORDER}`, borderRadius: 12, cursor: 'pointer', background: isConnected ? `${GOLD}08` : SURFACE, transition: 'all 0.15s' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: isConnected ? GOLD : '#D0D0D0' }}>{def.name}</span>
                        {isConnected && <span style={{ fontSize: 9, background: `${GOLD}22`, color: GOLD, padding: '2px 6px', borderRadius: 99, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connected</span>}
                      </div>
                      <p style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{def.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {selectedDef?.exportable ? (
                <>
                  <div style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}33`, borderRadius: 10, padding: 14, fontSize: 13, color: TEXT }}>
                    Export all timeline items as an .ics file importable into Google Calendar, Apple Calendar, or Outlook.
                  </div>
                  <button onClick={() => window.open(`/monday/api/boards/${boardId}/export/ics`, '_blank')}
                    style={{ width: '100%', padding: '12px 0', background: GOLD, color: '#000', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    Download .ics Calendar File
                  </button>
                </>
              ) : (
                <>
                  {selectedDef?.configFields.map(field => (
                    <div key={field.key}>
                      <label style={labelStyle}>{field.label}</label>
                      <input value={configDraft[field.key] ?? ''} onChange={e => setConfigDraft(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder} style={inputStyle} />
                    </div>
                  ))}

                  {(selectedDef?.type === 'slack' || selectedDef?.type === 'zapier' || selectedDef?.type === 'gmail') && configDraft.webhook_url && (
                    <div>
                      <button onClick={testWebhook} style={{ fontSize: 12, color: GOLD, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Send test ping</button>
                      {testResult && <p style={{ fontSize: 12, marginTop: 6, color: TEXT }}>{testResult}</p>}
                    </div>
                  )}

                  {selectedDef?.type === 'github' && configDraft.repo_url && (
                    <a href={configDraft.repo_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: GOLD }}>Open repository →</a>
                  )}
                  {selectedDef?.type === 'figma' && configDraft.figma_url && (
                    <a href={configDraft.figma_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: GOLD }}>Open Figma file →</a>
                  )}

                  <div style={{ background: '#0D0D0D', border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, fontSize: 11, color: '#444' }}>
                    {(selectedDef?.type === 'slack' || selectedDef?.type === 'zapier' || selectedDef?.type === 'gmail')
                      ? 'PM System will POST JSON to this URL on every item create/update/delete.'
                      : 'This URL is stored as a reference link for your team.'}
                  </div>

                  <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                    {selectedIntegration?.connected === 1 && (
                      <button onClick={() => disconnect(selected!)} style={{ padding: '8px 16px', border: '1px solid #c0392b44', color: '#c0392b', background: 'transparent', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>Disconnect</button>
                    )}
                    <button onClick={() => save(selected!, true)}
                      disabled={saving || ((selectedDef?.configFields?.length ?? 0) > 0 && !configDraft[(selectedDef?.configFields?.[0]?.key ?? '')]?.trim())}
                      style={{ flex: 1, padding: '8px 0', background: GOLD, color: '#000', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                      {saving ? 'Saving…' : selectedIntegration?.connected === 1 ? 'Update' : 'Connect'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
