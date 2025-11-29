import { useEffect, useState } from 'react'
import { getToken } from '../../utils/auth'

export default function GlobalRazorpaySettingsView() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openEdit, setOpenEdit] = useState(false)

  async function fetchGlobal() {
    setError('')
    setLoading(true)
    setConfig(null)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/admin/razorpay-config/global`, { headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` } })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const json = await res.json().catch(()=>null)
      setConfig(json || null)
    } catch (e) {
      setError(e.message || 'Failed to load global config')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchGlobal() }, [])

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Global Razorpay Settings</h2>
        <button className="px-3 py-2 text-sm rounded border hover:bg-gray-50" onClick={fetchGlobal} disabled={loading}>Refresh</button>
      </div>
      {error && (<div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>)}
      {loading && (<div className="mt-4 text-sm text-gray-600">Loading...</div>)}
      {!loading && config && (
        <div className="mt-4">
          <table className="text-sm">
            <tbody>
              <tr><td className="pr-3 text-gray-600">Key ID</td><td>{config.keyId || '-'}</td></tr>
              <tr><td className="pr-3 text-gray-600">Key Secret (masked)</td><td>{config.keySecretMasked || '-'}</td></tr>
              <tr><td className="pr-3 text-gray-600">Active</td><td>{String(config.active)}</td></tr>
              <tr><td className="pr-3 text-gray-600">Created</td><td>{config.createdAt ? new Date(config.createdAt).toLocaleString() : '-'}</td></tr>
              <tr><td className="pr-3 text-gray-600">Updated</td><td>{config.updatedAt ? new Date(config.updatedAt).toLocaleString() : '-'}</td></tr>
            </tbody>
          </table>
          <div className="mt-3">
            <button className="px-3 py-2 text-sm rounded border hover:bg-gray-50" onClick={()=>setOpenEdit(true)}>Edit Global Config</button>
          </div>
        </div>
      )}
      {openEdit && config && (
        <EditGlobalRazorpayModal
          initial={config}
          onClose={()=>setOpenEdit(false)}
          onSaved={()=>{ setOpenEdit(false); fetchGlobal() }}
        />
      )}
    </div>
  )
}

function EditGlobalRazorpayModal({ initial, onClose, onSaved }) {
  const [keyId, setKeyId] = useState(initial?.keyId || '')
  const [keySecret, setKeySecret] = useState('')
  const [active, setActive] = useState(Boolean(initial?.active))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!keyId.trim()) { setError('Key ID is required'); return }
    // keySecret can be optional; send only if provided
    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = { keyId: keyId.trim(), active }
      if (keySecret.trim()) payload.keySecret = keySecret.trim()
      const res = await fetch(`${base}/api/v1/admin/razorpay-config/global`, {
        method: 'PUT',
        headers: { 'accept': '*/*', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(()=>null)
      if (!res.ok) { const msg = (json && (json.message || json.error)) || `Update failed: ${res.status}`; throw new Error(`${msg} | Sent Payload: ${JSON.stringify(payload)}`) }
      if (onSaved) onSaved(json || null)
    } catch (e) { setError(e.message || 'Failed to update global config') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">Edit Global Razorpay Config</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Key ID</label>
            <input className="mt-1 w-full border rounded p-2" value={keyId} onChange={e=>setKeyId(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">Key Secret (optional)</label>
            <input className="mt-1 w-full border rounded p-2" value={keySecret} onChange={e=>setKeySecret(e.target.value)} placeholder="leave blank to keep existing" />
          </div>
          <div className="flex items-center gap-2">
            <input id="active_global" type="checkbox" className="h-4 w-4" checked={active} onChange={e=>setActive(e.target.checked)} />
            <label htmlFor="active_global" className="text-sm text-gray-700">Active</label>
          </div>
          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
          <div className="pt-2 flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
