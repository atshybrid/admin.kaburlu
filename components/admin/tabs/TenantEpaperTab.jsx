import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { logout } from '../../../utils/auth'
import { useLayout } from '../SuperAdminLayout'

function normalizeRole(user) {
  const role = user?.role || user?.roleName || user?.userRole || user?.role?.name || ''
  const roleName = typeof role === 'string' ? role : (role?.name || '')
  return String(roleName).toUpperCase().replace(/[\s_-]/g, '')
}

function parseOverrideRoles() {
  const raw = process.env.NEXT_PUBLIC_TENANT_OVERRIDE_ROLES || 'SUPER_ADMIN,SUPERADMIN'
  return raw
    .split(',')
    .map((s) => String(s || '').trim().toUpperCase().replace(/[\s_-]/g, ''))
    .filter(Boolean)
}

export default function TenantEpaperTab({ tenantContext }) {
  const router = useRouter()
  const { user } = useLayout()
  const roleStr = normalizeRole(user)
  const canOverrideTenant = useMemo(() => parseOverrideRoles().includes(roleStr), [roleStr])

  const tenantId = tenantContext?.tenantId

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [config, setConfig] = useState(null)

  const [type, setType] = useState('PDF')
  const [multiEditionEnabled, setMultiEditionEnabled] = useState(false)

  async function fetchJsonOrRedirect(url, init) {
    const res = await fetch(url, init)
    if (res.status === 401) {
      logout()
      router.replace('/')
      throw new Error('Unauthorized')
    }

    const text = await res.text()
    let json = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      // ignore
    }

    if (!res.ok) {
      const message = json?.message || json?.error || text || `Request failed: ${res.status}`
      throw new Error(message)
    }

    return json
  }

  async function load() {
    if (!tenantId) return
    setBusy(true)
    setError('')
    try {
      const params = new URLSearchParams({ tenantId })
      const data = await fetchJsonOrRedirect(`/api/admin/epaper/public-config?${params.toString()}`)
      setConfig(data)
      if (data?.type) setType(data.type)
      if (typeof data?.multiEditionEnabled === 'boolean') setMultiEditionEnabled(data.multiEditionEnabled)
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  async function saveType() {
    if (!tenantId) return
    setBusy(true)
    setError('')
    try {
      const params = new URLSearchParams({ tenantId })
      const data = await fetchJsonOrRedirect(`/api/admin/epaper/public-config/type?${params.toString()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      setConfig(data)
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  async function saveMultiEdition() {
    if (!tenantId) return
    setBusy(true)
    setError('')
    try {
      const params = new URLSearchParams({ tenantId })
      const data = await fetchJsonOrRedirect(`/api/admin/epaper/public-config/multi-edition?${params.toString()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ multiEditionEnabled }),
      })
      setConfig(data)
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  if (!canOverrideTenant) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="text-lg font-semibold text-slate-900">ePaper Config</div>
        <div className="mt-2 text-sm text-slate-600">
          Your role doesn’t allow tenant override. Enable it by setting `NEXT_PUBLIC_TENANT_OVERRIDE_ROLES` and ensuring the backend allows it.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-slate-900">ePaper Config</div>
            <div className="text-sm text-slate-500">Tenant: <span className="font-mono">{tenantId}</span></div>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={busy}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-60"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">{error}</div>
        )}

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border p-4">
            <div className="font-semibold text-slate-900 mb-3">Type</div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mode</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="PDF">PDF</option>
              <option value="BLOCK">BLOCK</option>
            </select>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={saveType}
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium disabled:opacity-60"
              >
                Save type
              </button>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="font-semibold text-slate-900 mb-3">Multi-edition</div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={!!multiEditionEnabled}
                onChange={(e) => setMultiEditionEnabled(e.target.checked)}
              />
              Enable multiple editions
            </label>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={saveMultiEdition}
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium disabled:opacity-60"
              >
                Save multi-edition
              </button>
            </div>
          </div>
        </div>

        {config && (
          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Raw response</div>
            <pre className="text-xs bg-slate-50 border rounded-lg p-3 overflow-auto">{JSON.stringify(config, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
