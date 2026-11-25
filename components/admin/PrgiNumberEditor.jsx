/**
 * Super Admin — update Tenant.prgiNumber (PATCH /tenants/:id). Entity row synced on backend.
 */
import { useState, useEffect } from 'react'
import { getToken } from '../../utils/auth'

function getApiBase() {
  if (typeof window !== 'undefined') return '/api/proxy'
  return (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.kaburlumedia.com').replace(/\/$/, '') + '/api/v1'
}

export default function PrgiNumberEditor({ tenantId, value, onSaved }) {
  const [draft, setDraft] = useState(value || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    setDraft(value || '')
  }, [value])

  const changed = String(draft || '').trim() !== String(value || '').trim()

  async function save() {
    const next = String(draft || '').trim()
    if (!next) {
      setMsg({ type: 'error', text: 'PRGI number required' })
      return
    }
    setSaving(true)
    setMsg({ type: '', text: '' })
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${t?.token || ''}`,
        },
        body: JSON.stringify({ prgiNumber: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || data.message || `Failed (${res.status})`)
      setMsg({ type: 'success', text: 'PRGI updated' })
      onSaved?.(data)
    } catch (e) {
      setMsg({ type: 'error', text: e.message || 'Update failed' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">PRGI registration number</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Webnews masthead + public tenant API. Corrections here (super admin only).
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="PRGI-TS-2025-01987"
          className="flex-1 font-mono text-sm px-3 py-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand"
        />
        <button
          type="button"
          onClick={save}
          disabled={!changed || saving}
          className="px-4 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Update PRGI'}
        </button>
      </div>
      {msg.text && (
        <p className={`text-xs ${msg.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>{msg.text}</p>
      )}
    </div>
  )
}