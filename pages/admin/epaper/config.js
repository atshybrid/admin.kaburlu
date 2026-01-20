import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import SuperAdminLayout from '../../../components/admin/SuperAdminLayout'
import { logout } from '../../../utils/auth'
import { useLayout } from '../../../components/admin/SuperAdminLayout'

function normalizeRole(user) {
  const role = user?.role || user?.roleName || user?.userRole || user?.role?.name || ''
  const roleName = typeof role === 'string' ? role : (role?.name || '')
  return String(roleName).toUpperCase().replace(/[_\s-]/g, '')
}

function parseOverrideRoles() {
  const raw = process.env.NEXT_PUBLIC_TENANT_OVERRIDE_ROLES || 'SUPER_ADMIN,SUPERADMIN'
  return raw
    .split(',')
    .map((s) => String(s || '').trim().toUpperCase().replace(/[_\s-]/g, ''))
    .filter(Boolean)
}

function EPaperConfigContent() {
  const router = useRouter()
  const { user } = useLayout()
  const roleStr = normalizeRole(user)
  const canOverrideTenant = parseOverrideRoles().includes(roleStr)

  const [tenantId, setTenantId] = useState('')
  const [tenants, setTenants] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  async function fetchTextOrRedirect(url, init) {
    const res = await fetch(url, init)
    if (res.status === 401) {
      logout()
      router.replace('/')
      throw new Error('Unauthorized')
    }
    const text = await res.text()
    if (!res.ok) throw new Error(text || `Request failed: ${res.status}`)
    return text
  }

  async function loadTenants() {
    if (!canOverrideTenant) return
    const text = await fetchTextOrRedirect('/api/admin/proxy/tenants?full=true')
    const data = JSON.parse(text)
    const items = Array.isArray(data) ? data : (data?.data || data?.items || [])
    const list = Array.isArray(items) ? items : []
    setTenants(list)
    if (!tenantId && list[0]?.id) setTenantId(list[0].id)
  }

  useEffect(() => {
    loadTenants().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setBusy(true)
    setError('')
    setData(null)
    try {
      const params = new URLSearchParams()
      if (canOverrideTenant && tenantId.trim()) params.set('tenantId', tenantId.trim())
      const text = await fetchTextOrRedirect(`/api/admin/epaper/public-config?${params.toString()}`)
      setData(JSON.parse(text))
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  async function setPdf() {
    setBusy(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (canOverrideTenant && tenantId.trim()) params.set('tenantId', tenantId.trim())
      await fetchTextOrRedirect(`/api/admin/epaper/public-config/type?${params.toString()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'PDF' }),
      })
      await load()
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">ePaper (PDF) — Public Config</h1>
          <p className="text-sm text-slate-500">SUPER_ADMIN-only endpoints; provide tenantId if managing another tenant.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">{error}</div>
        )}

        <div className="bg-white rounded-xl border p-5 space-y-4">
          {canOverrideTenant && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tenant (override)</label>
              <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name || t.slug || t.id}</option>
                ))}
              </select>
              <div className="mt-1 text-xs text-slate-500">Only included in requests when your role allows tenant override.</div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button onClick={load} disabled={busy} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium disabled:opacity-60">Load config</button>
            <button onClick={setPdf} disabled={busy} className="px-4 py-2 rounded-lg border text-sm disabled:opacity-60">Set type = PDF</button>
          </div>

          {data && (
            <pre className="text-xs bg-slate-50 border rounded-lg p-3 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
          )}
        </div>
      </div>
  )
}

export default function EPaperConfigPage() {
  return (
    <SuperAdminLayout title="ePaper Config">
      <EPaperConfigContent />
    </SuperAdminLayout>
  )
}
