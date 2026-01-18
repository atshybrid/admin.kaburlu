import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getToken as getStoredAuth } from '../../utils/auth'
import { getDomainSettings, putDomainSettings, patchDomainSettings } from '../../lib/domainSettingsApi'

function getAuthToken() {
  const stored = getStoredAuth()
  return stored?.token || ''
}

function getApiBase() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com').replace(/\/$/, '')
}

async function apiGetJson(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, cache: 'no-store' })
  const text = await res.text()
  if (!res.ok) throw new Error(text || `GET ${url} ${res.status}`)
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export default function TenantDomainSettingsView() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null) // { tenantId, domainId }
  const [domainOnlySettings, setDomainOnlySettings] = useState(null)
  const [effectiveSettings, setEffectiveSettings] = useState(null)
  const [jsonText, setJsonText] = useState('')
  const [patchText, setPatchText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const token = getAuthToken()
        const ts = await apiGetJson(`${getApiBase()}/api/v1/tenants?full=true`, token)
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

  async function reloadSelected(rowOverride) {
    const row = rowOverride || selected
    if (!row) return
    setError('')
    setDomainOnlySettings(null)
    setEffectiveSettings(null)
    setJsonText('')
    setPatchText('')

    try {
      const token = getAuthToken()
      const data = await getDomainSettings({ tenantId: row.tenantId, domainId: row.domainId, token })
      const settings = data?.settings || {}
      const effective = data?.effective || {}
      setDomainOnlySettings(settings)
      setEffectiveSettings(effective)
      setJsonText(JSON.stringify(settings, null, 2))
      setPatchText(JSON.stringify({ branding: settings?.branding || {} }, null, 2))
    } catch (e) {
      setError(e.message || 'Failed to fetch settings')
    }
  }

  async function openSettings(row) {
    setSelected(row)
    setOpen(true)
    await reloadSelected(row)
  }

  async function savePutReplace() {
    if (!selected) return
    setSaving(true)
    setError('')
    try {
      const token = getAuthToken()
      const parsed = JSON.parse(jsonText || '{}')
      await putDomainSettings({ tenantId: selected.tenantId, domainId: selected.domainId, token, data: parsed })
      await reloadSelected()
    } catch (e) {
      setError(e.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function savePatchMerge() {
    if (!selected) return
    setSaving(true)
    setError('')
    try {
      const token = getAuthToken()
      const patch = JSON.parse(patchText || '{}')
      await patchDomainSettings({ tenantId: selected.tenantId, domainId: selected.domainId, token, data: patch })
      await reloadSelected()
    } catch (e) {
      setError(e.message || 'Failed to patch settings')
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
      {!getAuthToken() ? (
        <div className="text-sm text-red-600">
          Missing auth token. Please login again.
        </div>
      ) : null}
      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : (
        <div className="card-surface">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400">
                <th className="text-left px-3 py-2">Domain</th>
                <th className="text-left px-3 py-2">Tenant</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.domainId} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{r.domain}</td>
                  <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{r.tenantName}</td>
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
        <div className={`absolute inset-0 bg-black/40 dark:bg-black/60 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
        <div className={`absolute right-0 top-0 h-full w-[32rem] max-w-[90vw] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl transform transition-transform ${open ? 'translate-x-0' : 'translate-x-full'} flex flex-col`} role="dialog" aria-modal="true">
          <div className="h-14 px-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Edit Domain Settings</div>
              {selected && <div className="text-[11px] text-gray-500 dark:text-gray-400">{selected.domain} · Tenant {selected.tenantId}</div>}
            </div>
            <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300" onClick={() => setOpen(false)}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {!domainOnlySettings ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Fetching settings…</div>
            ) : (
              <div className="space-y-5">
                <section>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">Domain Settings (editable JSON)</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">PUT replaces entire JSON. PATCH merges only top-level keys (shallow).</div>
                    </div>
                    <button onClick={() => reloadSelected()} className="btn-base px-3 py-1.5" disabled={saving}>Reload</button>
                  </div>
                  <textarea
                    className="mt-2 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    rows={16}
                    value={jsonText}
                    onChange={e => setJsonText(e.target.value)}
                  />
                </section>

                <section>
                  <div className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">PATCH payload (optional)</div>
                  <textarea
                    className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    rows={7}
                    value={patchText}
                    onChange={e => setPatchText(e.target.value)}
                  />
                </section>

                <section>
                  <div className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Effective Settings (read-only merged)</div>
                  <pre className="w-full rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 text-xs overflow-auto max-h-[18rem]">
                    {JSON.stringify(effectiveSettings || {}, null, 2)}
                  </pre>
                </section>

                <section>
                  <div className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Saved for domain (read-only)</div>
                  <pre className="w-full rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 text-xs overflow-auto max-h-[12rem]">
                    {JSON.stringify(domainOnlySettings || {}, null, 2)}
                  </pre>
                </section>
              </div>
            )}
          </div>
          <div className="h-14 px-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
            <button className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => setOpen(false)}>Cancel</button>
            <button className="px-3 py-2 rounded bg-gray-900 dark:bg-gray-700 text-white disabled:opacity-50 hover:bg-gray-800 dark:hover:bg-gray-600" disabled={saving} onClick={savePatchMerge}>{saving ? 'Saving…' : 'Save PATCH'}</button>
            <button className="px-3 py-2 rounded bg-brand text-white disabled:opacity-50 hover:opacity-90" disabled={saving} onClick={savePutReplace}>{saving ? 'Saving…' : 'Save PUT'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
