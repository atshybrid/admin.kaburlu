import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

function getToken() {
  if (typeof window === 'undefined') return ''
  try { return localStorage.getItem('token') || '' } catch { return '' }
}

async function apiGet(url) {
  const token = getToken()
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'accept': 'application/json' } })
  if (!res.ok) throw new Error(`GET ${url} ${res.status}`)
  return res.json()
}

async function apiPut(url, body) {
  const token = getToken()
  const res = await fetch(url, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`PUT ${url} ${res.status}`)
  return res.json()
}

export default function TenantDomainSettingsView() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null) // { tenantId, domainId }
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const ts = await apiGet(`${process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com'}/api/v1/tenants?full=true`)
        if (!mounted) return
        setTenants((ts.items || ts?.data || ts) || [])
      } catch (e) {
        setError(e.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const rows = useMemo(() => {
    const out = []
    for (const t of (tenants || [])) {
      const tenantId = t.id || t.tenantId || t._id
      const tenantName = t.name || t.tenantName
      for (const d of (t.domains || [])) {
        out.push({
          domainId: d.id || d.domainId || d._id || d.domain,
          tenantId,
          domain: d.domain || d.host || d.name,
          tenantName
        })
      }
    }
    return out
  }, [tenants])

  async function openSettings(row) {
    setSelected(row)
    setOpen(true)
    setSettings(null)
    try {
      const data = await apiGet(`${process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com'}/api/v1/tenants/${row.tenantId}/domains/${row.domainId}/settings`)
      setSettings(data.settings || data.effective || data)
    } catch (e) {
      setError(e.message || 'Failed to fetch settings')
    }
  }

  async function saveSettings() {
    if (!selected) return
    setSaving(true)
    setError('')
    try {
      await apiPut(`${process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com'}/api/v1/tenants/${selected.tenantId}/domains/${selected.domainId}/settings`, { settings })
      setOpen(false)
    } catch (e) {
      setError(e.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Domain Settings</h2>
        <Link href="/dashboard?tab=tenants"><a className="text-sm text-brand">Back to Tenants</a></Link>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : (
        <div className="card-surface">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left px-3 py-2">Domain</th>
                <th className="text-left px-3 py-2">Tenant</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.domainId} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">{r.domain}</td>
                  <td className="px-3 py-2">{r.tenantName}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => openSettings(r)} className="btn-base px-3 py-1.5">View & Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* side drawer */}
      <div className={`fixed inset-0 z-30 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
        <div className={`absolute right-0 top-0 h-full w-[32rem] max-w-[90vw] bg-white border-l shadow-xl transform transition-transform ${open ? 'translate-x-0' : 'translate-x-full'} flex flex-col`} role="dialog" aria-modal="true">
          <div className="h-14 px-4 border-b flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Edit Domain Settings</div>
              {selected && <div className="text-[11px] text-gray-500">{selected.domain} · Tenant {selected.tenantId}</div>}
            </div>
            <button className="p-2 rounded hover:bg-gray-100" onClick={() => setOpen(false)}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {!settings ? (
              <div className="text-sm text-gray-500">Fetching settings…</div>
            ) : (
              <div className="space-y-6">
                {/* SEO */}
                <section>
                  <div className="text-sm font-semibold mb-2">SEO</div>
                  <div className="grid grid-cols-2 gap-3">
                    <TextInput label="Canonical Base URL" value={settings.seo?.canonicalBaseUrl || ''} onChange={v => setSettings(s => ({ ...s, seo: { ...(s.seo||{}), canonicalBaseUrl: v } }))} />
                    <TextInput label="OG Image URL" value={settings.seo?.ogImageUrl || ''} onChange={v => setSettings(s => ({ ...s, seo: { ...(s.seo||{}), ogImageUrl: v } }))} />
                    <TextInput label="Default Meta Title" value={settings.seo?.defaultMetaTitle || ''} onChange={v => setSettings(s => ({ ...s, seo: { ...(s.seo||{}), defaultMetaTitle: v } }))} />
                    <TextInput label="Default Meta Description" value={settings.seo?.defaultMetaDescription || ''} onChange={v => setSettings(s => ({ ...s, seo: { ...(s.seo||{}), defaultMetaDescription: v } }))} />
                  </div>
                </section>

                {/* Theme */}
                <section>
                  <div className="text-sm font-semibold mb-2">Theme</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select label="Theme" value={settings.theme?.theme || 'light'} options={[{value:'light',label:'Light'},{value:'dark',label:'Dark'}]} onChange={v => setSettings(s => ({ ...s, theme: { ...(s.theme||{}), theme: v } }))} />
                    <TextInput label="Primary Color" value={settings.theme?.colors?.primary || ''} onChange={v => setSettings(s => ({ ...s, theme: { ...(s.theme||{}), colors: { ...(s.theme?.colors||{}), primary: v } } }))} />
                    <TextInput label="Secondary Color" value={settings.theme?.colors?.secondary || ''} onChange={v => setSettings(s => ({ ...s, theme: { ...(s.theme||{}), colors: { ...(s.theme?.colors||{}), secondary: v } } }))} />
                    <TextInput label="Accent Color" value={settings.theme?.colors?.accent || ''} onChange={v => setSettings(s => ({ ...s, theme: { ...(s.theme||{}), colors: { ...(s.theme?.colors||{}), accent: v } } }))} />
                    <TextInput label="Header Layout" value={settings.theme?.layout?.header || ''} onChange={v => setSettings(s => ({ ...s, theme: { ...(s.theme||{}), layout: { ...(s.theme?.layout||{}), header: v } } }))} />
                    <TextInput label="Footer Layout" value={settings.theme?.layout?.footer || ''} onChange={v => setSettings(s => ({ ...s, theme: { ...(s.theme||{}), layout: { ...(s.theme?.layout||{}), footer: v } } }))} />
                  </div>
                </section>

                {/* Branding */}
                <section>
                  <div className="text-sm font-semibold mb-2">Branding</div>
                  <div className="grid grid-cols-2 gap-3">
                    <TextInput label="Logo URL" value={settings.branding?.logoUrl || ''} onChange={v => setSettings(s => ({ ...s, branding: { ...(s.branding||{}), logoUrl: v } }))} />
                    <TextInput label="Favicon URL" value={settings.branding?.faviconUrl || ''} onChange={v => setSettings(s => ({ ...s, branding: { ...(s.branding||{}), faviconUrl: v } }))} />
                  </div>
                </section>

                {/* Content */}
                <section>
                  <div className="text-sm font-semibold mb-2">Content</div>
                  <div className="grid grid-cols-2 gap-3">
                    <TextInput label="Default Language" value={settings.content?.defaultLanguage || ''} onChange={v => setSettings(s => ({ ...s, content: { ...(s.content||{}), defaultLanguage: v } }))} />
                  </div>
                </section>

                {/* Custom CSS */}
                <section>
                  <div className="text-sm font-semibold mb-2">Custom CSS</div>
                  <Textarea label="CSS" value={settings.customCss || ''} onChange={v => setSettings(s => ({ ...s, customCss: v }))} rows={6} />
                </section>
              </div>
            )}
          </div>
          <div className="h-14 px-4 border-t flex items-center justify-end gap-2">
            <button className="px-3 py-2 rounded bg-gray-100" onClick={() => setOpen(false)}>Cancel</button>
            <button className="px-3 py-2 rounded bg-brand text-white disabled:opacity-50" disabled={saving} onClick={saveSettings}>{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TextInput({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="text-[12px] text-gray-600 mb-1">{label}</div>
      <input className="w-full rounded border px-2 py-1.5 text-sm" value={value} onChange={e => onChange(e.target.value)} />
    </label>
  )
}

function Select({ label, value, options, onChange }) {
  return (
    <label className="block">
      <div className="text-[12px] text-gray-600 mb-1">{label}</div>
      <select className="w-full rounded border px-2 py-1.5 text-sm" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

function Textarea({ label, value, onChange, rows=4 }) {
  return (
    <label className="block">
      <div className="text-[12px] text-gray-600 mb-1">{label}</div>
      <textarea className="w-full rounded border px-2 py-1.5 text-sm" rows={rows} value={value} onChange={e => onChange(e.target.value)} />
    </label>
  )
}
