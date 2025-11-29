import { useEffect, useState, useMemo } from 'react'
import { getToken } from '../../utils/auth'

export default function RazorpaySettingsView() {
  const [tenants, setTenants] = useState([])
  const [loadingTenants, setLoadingTenants] = useState(true)
  const [tenantId, setTenantId] = useState('')
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)

  // List view state for tenant Razorpay configs
  const [configs, setConfigs] = useState([])
  const [configsMeta, setConfigsMeta] = useState({ page: 1, pageSize: 50, total: 0, totalPages: 0 })
  const [loadingConfigs, setLoadingConfigs] = useState(false)
  const [search, setSearch] = useState('')
  const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
  const configuredTenantIds = useMemo(() => new Set(configs.filter(c => c.tenant?.id).map(c => c.tenant.id)), [configs])

  async function fetchTenants() {
    setLoadingTenants(true)
    try {
      const t = getToken()
      const res = await fetch(`${base}/api/v1/tenants`, { headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` } })
      const json = await res.json().catch(()=>null)
      const list = Array.isArray(json) ? json : (json?.data || [])
      setTenants(list)
    } catch {
      setTenants([])
    } finally {
      setLoadingTenants(false)
    }
  }

  useEffect(() => { fetchTenants(); fetchConfigs(configsMeta.page, configsMeta.pageSize) }, [])
  useEffect(() => { if (tenantId) viewConfig(); else { setConfig(null); setError('') } }, [tenantId])

  async function fetchConfigs(page = 1, pageSize = 50, active = true) {
    setLoadingConfigs(true)
    try {
      const t = getToken()
      const url = `${base}/api/v1/tenants/razorpay-configs?active=${active}&page=${page}&pageSize=${pageSize}`
      const res = await fetch(url, { headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` } })
      const json = await res.json().catch(()=>null)
      const data = Array.isArray(json) ? json : (json?.data || [])
      const meta = (json?.meta || { page, pageSize, total: data.length, totalPages: 1 })
      setConfigs(data)
      setConfigsMeta(meta)
    } catch {
      setConfigs([])
    } finally {
      setLoadingConfigs(false)
    }
  }

  async function viewConfig() {
    if (!tenantId) { setError('Select a tenant'); return }
    setError('')
    setLoading(true)
    setConfig(null)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/tenants/${tenantId}/razorpay-config`, { headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` } })
      if (res.status === 404) {
        const j = await res.json().catch(()=>null)
        setError((j && (j.error || j.message)) || 'Tenant Razorpay config not set')
        setOpenCreate(true)
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const json = await res.json().catch(()=>null)
      setConfig(json || null)
    } catch (e) {
      setError(e.message || 'Failed to load config')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* List view */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Tenant Razorpay Settings</h2>
            <div className="mt-2 flex items-center gap-2">
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tenant or key..." className="px-3 py-2 text-sm border rounded w-64" />
              <button onClick={()=>fetchConfigs(1, configsMeta.pageSize)} className="px-2 py-2 text-xs rounded border bg-white hover:bg-gray-50" disabled={loadingConfigs}>Refresh</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>{ const avail = tenants.filter(t => !configuredTenantIds.has(t.id)); setTenantId(avail[0]?.id || ''); setConfig(null); setOpenCreate(true); setError(''); }} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark">Add Config</button>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 px-2">Tenant</th>
                <th className="py-2 px-2">Key ID</th>
                <th className="py-2 px-2">Active</th>
                <th className="py-2 px-2">Updated</th>
                <th className="py-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingConfigs ? (
                <tr><td className="py-3 px-2" colSpan={5}>Loading...</td></tr>
              ) : ((configs.filter(r => {
                const q = search.trim().toLowerCase()
                if (!q) return true
                const tn = (r.tenant?.name || '').toLowerCase()
                const kid = (r.keyId || '').toLowerCase()
                return tn.includes(q) || kid.includes(q)
              })).length === 0 ? (
                <tr><td className="py-3 px-2" colSpan={5}>No configs found.</td></tr>
              ) : configs.filter(r => {
                const q = search.trim().toLowerCase()
                if (!q) return true
                const tn = (r.tenant?.name || '').toLowerCase()
                const kid = (r.keyId || '').toLowerCase()
                return tn.includes(q) || kid.includes(q)
              }).map(r => (
                <tr key={r.id} className="border-t">
                  <td className="py-2 px-2 font-medium">{r.tenant?.name || 'Global'}</td>
                  <td className="py-2 px-2">{r.keyId}</td>
                  <td className="py-2 px-2">{String(r.active)}</td>
                  <td className="py-2 px-2 text-gray-500">{new Date(r.updatedAt || r.createdAt).toLocaleString()}</td>
                  <td className="py-2 px-2">
                    {r.tenant?.id ? (
                      <button onClick={() => { setTenantId(r.tenant.id); viewConfig(); setOpenEdit(true); }} className="px-2 py-1 text-xs rounded bg-brand text-white hover:bg-brand-dark">Edit</button>
                    ) : (
                      <span className="text-xs text-gray-500">Global config</span>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
          <div>Page {configsMeta.page} of {configsMeta.totalPages || 1}</div>
          <div className="flex items-center gap-2">
            <button disabled={configsMeta.page <= 1} onClick={() => { const p = Math.max(1, configsMeta.page - 1); fetchConfigs(p, configsMeta.pageSize); setConfigsMeta(m => ({ ...m, page: p })) }} className="px-2 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-50">Prev</button>
            <button disabled={configsMeta.page >= (configsMeta.totalPages || 1)} onClick={() => { const p = Math.min(configsMeta.totalPages || 1, configsMeta.page + 1); fetchConfigs(p, configsMeta.pageSize); setConfigsMeta(m => ({ ...m, page: p })) }} className="px-2 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
      {/* Side drawer editor */}
      {openCreate && (
        <RazorpayDrawer
          mode="create"
          tenants={tenants}
          loadingTenants={loadingTenants}
          tenantId={tenantId}
          setTenantId={setTenantId}
          error={error}
          loading={loading}
          config={null}
          onClose={()=>setOpenCreate(false)}
          onAfterSave={()=>{ setOpenCreate(false); fetchConfigs(configsMeta.page, configsMeta.pageSize) }}
          viewConfig={viewConfig}
          setError={setError}
          configuredTenantIds={configuredTenantIds}
        />
      )}
      {openEdit && config && (
        <RazorpayDrawer
          mode="edit"
          tenants={tenants}
          loadingTenants={loadingTenants}
          tenantId={tenantId}
          setTenantId={setTenantId}
          error={error}
          loading={loading}
          config={config}
          onClose={()=>setOpenEdit(false)}
          onAfterSave={()=>{ setOpenEdit(false); fetchConfigs(configsMeta.page, configsMeta.pageSize) }}
          viewConfig={viewConfig}
          setError={setError}
          configuredTenantIds={configuredTenantIds}
        />
      )}
    </div>
  )
}

// Drawer component using existing Create/Edit modals content but as side drawer
function RazorpayDrawer({ mode, tenants, loadingTenants, tenantId, setTenantId, error, loading, config, onClose, onAfterSave, viewConfig, setError, configuredTenantIds }) {
  // Integrated form state
  const [keyId, setKeyId] = useState('')
  const [keySecret, setKeySecret] = useState('')
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Initialize form when switching mode or receiving config
  useEffect(() => {
    if (mode === 'edit' && config) {
      setKeyId(config.keyId || '')
      setKeySecret('') // keep blank; user can enter new secret
      setActive(Boolean(config.active))
    } else if (mode === 'create') {
      setKeyId('')
      setKeySecret('')
      setActive(true)
    }
    setFormError('')
  }, [mode, config])

  const canSubmit = tenantId && keyId.trim() && (mode === 'edit' || keySecret.trim())

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!tenantId) { setFormError('Tenant is required'); return }
    if (!keyId.trim()) { setFormError('Key ID is required'); return }
    if (mode === 'create' && !keySecret.trim()) { setFormError('Key Secret is required'); return }
    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = { keyId: keyId.trim(), active: Boolean(active) }
      if (mode === 'create' || keySecret.trim()) payload.keySecret = keySecret.trim()
      const method = mode === 'create' ? 'POST' : 'PUT'
      const res = await fetch(`${base}/api/v1/tenants/${tenantId}/razorpay-config`, {
        method,
        headers: { 'accept': '*/*', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(()=>null)
      if (!res.ok) {
        const msg = (json && (json.message || json.error)) || `${method} failed: ${res.status}`
        throw new Error(`${msg}`)
      }
      // Success: refresh list & (for edit) refresh config
      if (mode === 'edit') {
        await viewConfig()
      }
      onAfterSave()
    } catch (e) {
      setFormError(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const availableTenants = mode === 'create' ? tenants.filter(t => !configuredTenantIds.has(t.id)) : tenants

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">{mode === 'create' ? 'Add Razorpay Config' : 'Edit Razorpay Config'}</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          <div>
            <label className="text-sm text-gray-600">Tenant</label>
            <select className="mt-1 w-full px-3 py-2 text-sm border rounded bg-white" value={tenantId} onChange={e=>{ setTenantId(e.target.value); if(mode==='edit') viewConfig(); }} disabled={loadingTenants}>
              {loadingTenants ? (<option>Loading...</option>) : (<>
                <option value="">Select tenant</option>
                {availableTenants.map(t => (<option key={t.id} value={t.id}>{t.name || t.title || 'Tenant'}</option>))}
              </>)}
            </select>
          </div>
          {mode === 'edit' && !loading && config && (
            <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-2 space-y-1">
              <div><span className="font-medium">Existing Key ID:</span> {config.keyId || '-'}</div>
              <div><span className="font-medium">Secret (masked):</span> {config.keySecretMasked || '-'}</div>
              <div><span className="font-medium">Active:</span> {String(config.active)}</div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-700">Key ID</label>
            <input className="mt-1 w-full border rounded p-2 text-sm" value={keyId} onChange={e=>setKeyId(e.target.value)} placeholder="rzp_test_..." />
          </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">{mode==='create' ? 'Key Secret' : 'Key Secret (optional)'}</label>
              <input className="mt-1 w-full border rounded p-2 text-sm" value={keySecret} onChange={e=>setKeySecret(e.target.value)} placeholder={mode==='edit' ? 'leave blank to keep existing' : 'secret'} />
            </div>
          <div className="flex items-center gap-2">
            <input id="rp_active" type="checkbox" className="h-4 w-4" checked={active} onChange={e=>setActive(e.target.checked)} />
            <label htmlFor="rp_active" className="text-sm text-gray-700">Active</label>
          </div>
          {(error || formError) && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{formError || error}</div>}
          {mode==='create' && availableTenants.length===0 && (
            <div className="text-xs text-gray-600">All tenants already have a Razorpay config.</div>
          )}
          <div className="pt-2 flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={saving || !canSubmit} className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving ? (mode==='create' ? 'Creating...' : 'Saving...') : (mode==='create' ? 'Create Config' : 'Save Changes')}</button>
            {mode==='edit' && tenantId && <button type="button" onClick={()=>viewConfig()} className="px-3 py-2 rounded border bg-white hover:bg-gray-50">Reload</button>}
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateRazorpayConfigModal({ tenantId, onClose, onCreated }) {
  const [keyId, setKeyId] = useState('')
  const [keySecret, setKeySecret] = useState('')
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!tenantId) { setError('Tenant is required'); return }
    if (!keyId.trim() || !keySecret.trim()) { setError('Key ID and Secret are required'); return }
    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = { keyId: keyId.trim(), keySecret: keySecret.trim(), active }
      const res = await fetch(`${base}/api/v1/tenants/${tenantId}/razorpay-config`, {
        method: 'POST',
        headers: { 'accept': '*/*', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(()=>null)
      if (!res.ok) { const msg = (json && (json.message || json.error)) || `Create failed: ${res.status}`; throw new Error(`${msg} | Sent Payload: ${JSON.stringify(payload)}`) }
      if (onCreated) onCreated(json || null)
    } catch (e) { setError(e.message || 'Failed to create config') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">Add Razorpay Config</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Key ID</label>
            <input className="mt-1 w-full border rounded p-2" value={keyId} onChange={e=>setKeyId(e.target.value)} placeholder="rzp_test_..." required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">Key Secret</label>
            <input className="mt-1 w-full border rounded p-2" value={keySecret} onChange={e=>setKeySecret(e.target.value)} placeholder="secret" required />
          </div>
          <div className="flex items-center gap-2">
            <input id="active" type="checkbox" className="h-4 w-4" checked={active} onChange={e=>setActive(e.target.checked)} />
            <label htmlFor="active" className="text-sm text-gray-700">Active</label>
          </div>
          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
          <div className="pt-2 flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving? 'Creating...' : 'Create Config'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditRazorpayConfigModal({ tenantId, initial, onClose, onSaved }) {
  const [keyId, setKeyId] = useState(initial?.keyId || '')
  const [keySecret, setKeySecret] = useState('')
  const [active, setActive] = useState(Boolean(initial?.active))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!tenantId) { setError('Tenant is required'); return }
    if (!keyId.trim()) { setError('Key ID is required'); return }
    // keySecret can be optional for update; send if provided
    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = { keyId: keyId.trim(), active }
      if (keySecret.trim()) payload.keySecret = keySecret.trim()
      const res = await fetch(`${base}/api/v1/tenants/${tenantId}/razorpay-config`, {
        method: 'PUT',
        headers: { 'accept': '*/*', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(()=>null)
      if (!res.ok) { const msg = (json && (json.message || json.error)) || `Update failed: ${res.status}`; throw new Error(`${msg} | Sent Payload: ${JSON.stringify(payload)}`) }
      if (onSaved) onSaved(json || null)
    } catch (e) { setError(e.message || 'Failed to update config') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">Edit Razorpay Config</div>
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
            <input id="active_edit" type="checkbox" className="h-4 w-4" checked={active} onChange={e=>setActive(e.target.checked)} />
            <label htmlFor="active_edit" className="text-sm text-gray-700">Active</label>
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
