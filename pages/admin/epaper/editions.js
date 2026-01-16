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

function EPaperEditionsContent() {
  const router = useRouter()
  const { user } = useLayout()
  const roleStr = normalizeRole(user)
  const canOverrideTenant = parseOverrideRoles().includes(roleStr)

  const [tenantId, setTenantId] = useState('')
  const [tenants, setTenants] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [editions, setEditions] = useState([])

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
    const text = await fetchTextOrRedirect('/api/admin/proxy/api/v1/tenants?full=true')
    const data = JSON.parse(text)
    const items = Array.isArray(data) ? data : (data?.data || data?.items || [])
    const list = Array.isArray(items) ? items : []
    setTenants(list)
    if (!tenantId && list[0]?.id) setTenantId(list[0].id)
  }

  const [newEdition, setNewEdition] = useState({
    name: '',
    slug: '',
    coverImageUrl: '',
    isActive: true,
  })

  const [newSub, setNewSub] = useState({
    editionId: '',
    name: '',
    slug: '',
    isActive: true,
  })

  async function load() {
    setError('')
    const params = new URLSearchParams({ includeSubEditions: 'true' })
    if (canOverrideTenant && tenantId) params.set('tenantId', tenantId)
    const text = await fetchTextOrRedirect(`/api/admin/epaper/publication-editions?${params.toString()}`)
    const data = JSON.parse(text)
    const items = data?.items || data?.data?.items || data?.data || []
    setEditions(Array.isArray(items) ? items : [])
    if (!newSub.editionId && Array.isArray(items) && items[0]?.id) {
      setNewSub((s) => ({ ...s, editionId: items[0].id }))
    }
  }

  useEffect(() => {
    loadTenants().catch(() => {})
    load().catch((e) => setError(e?.message || String(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load().catch((e) => setError(e?.message || String(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  async function createEdition(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const body = {
        name: newEdition.name.trim(),
        slug: (newEdition.slug.trim() || newEdition.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')),
        stateId: null,
        coverImageUrl: newEdition.coverImageUrl.trim() || null,
        isActive: !!newEdition.isActive,
      }

      const params = new URLSearchParams()
      if (canOverrideTenant && tenantId) params.set('tenantId', tenantId)

      await fetchTextOrRedirect(`/api/admin/epaper/publication-editions${params.toString() ? `?${params.toString()}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      setNewEdition({ name: '', slug: '', coverImageUrl: '', isActive: true })
      await load()
    } catch (e2) {
      setError(e2?.message || String(e2))
    } finally {
      setBusy(false)
    }
  }

  async function createSubEdition(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const body = {
        editionId: newSub.editionId,
        name: newSub.name.trim(),
        slug: (newSub.slug.trim() || newSub.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')),
        districtId: null,
        isActive: !!newSub.isActive,
      }

      const params = new URLSearchParams()
      if (canOverrideTenant && tenantId) params.set('tenantId', tenantId)

      await fetchTextOrRedirect(`/api/admin/epaper/publication-sub-editions${params.toString() ? `?${params.toString()}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      setNewSub((s) => ({ ...s, name: '', slug: '', isActive: true }))
      await load()
    } catch (e2) {
      setError(e2?.message || String(e2))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">ePaper (PDF) — Editions</h1>
          <p className="text-sm text-slate-500">Manage editions and sub-editions used by PDF issues.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {canOverrideTenant && (
            <div className="lg:col-span-2 bg-white rounded-xl border p-5">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tenant (override)</label>
              <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name || t.slug || t.id}</option>
                ))}
              </select>
            </div>
          )}
          <form onSubmit={createEdition} className="bg-white rounded-xl border p-5 space-y-3">
            <div className="font-semibold text-slate-900">Create edition</div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input value={newEdition.name} onChange={(e) => setNewEdition((s) => ({ ...s, name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Slug (optional)</label>
              <input value={newEdition.slug} onChange={(e) => setNewEdition((s) => ({ ...s, slug: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cover image URL (optional)</label>
              <input value={newEdition.coverImageUrl} onChange={(e) => setNewEdition((s) => ({ ...s, coverImageUrl: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={newEdition.isActive} onChange={(e) => setNewEdition((s) => ({ ...s, isActive: e.target.checked }))} />
              Active
            </label>
            <div className="flex items-center gap-3">
              <button disabled={busy} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium disabled:opacity-60">Create</button>
              <button type="button" onClick={() => load().catch((e) => setError(e?.message || String(e)))} className="px-4 py-2 rounded-lg border text-sm">Refresh</button>
            </div>
          </form>

          <form onSubmit={createSubEdition} className="bg-white rounded-xl border p-5 space-y-3">
            <div className="font-semibold text-slate-900">Create sub-edition</div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Edition</label>
              <select value={newSub.editionId} onChange={(e) => setNewSub((s) => ({ ...s, editionId: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                {editions.map((ed) => (
                  <option key={ed.id} value={ed.id}>{ed.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input value={newSub.name} onChange={(e) => setNewSub((s) => ({ ...s, name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Slug (optional)</label>
              <input value={newSub.slug} onChange={(e) => setNewSub((s) => ({ ...s, slug: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={newSub.isActive} onChange={(e) => setNewSub((s) => ({ ...s, isActive: e.target.checked }))} />
              Active
            </label>
            <button disabled={busy} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium disabled:opacity-60">Create</button>
          </form>
        </div>

        <div className="mt-6 bg-white rounded-xl border overflow-hidden">
          <div className="px-5 py-3 border-b bg-slate-50 font-semibold text-slate-800">Current editions</div>
          <div className="divide-y">
            {editions.map((ed) => (
              <div key={ed.id} className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900">{ed.name} <span className="text-xs text-slate-500">({ed.slug})</span></div>
                    <div className="text-xs text-slate-500">ID: <span className="font-mono">{ed.id}</span></div>
                  </div>
                  {ed.coverImageUrl && <img src={ed.coverImageUrl} alt="cover" className="w-16 h-16 rounded-lg border object-cover" />}
                </div>

                {!!ed.subEditions?.length && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sub-editions</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {ed.subEditions.map((se) => (
                        <div key={se.id} className="rounded-lg border px-3 py-2 text-sm">
                          <div className="font-medium text-slate-800">{se.name} <span className="text-xs text-slate-500">({se.slug})</span></div>
                          <div className="text-xs text-slate-500">ID: <span className="font-mono">{se.id}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {!editions.length && (
              <div className="p-8 text-center text-slate-500">No editions yet.</div>
            )}
          </div>
        </div>
      </div>
  )
}

export default function EPaperEditionsPage() {
  return (
    <SuperAdminLayout title="ePaper Editions">
      <EPaperEditionsContent />
    </SuperAdminLayout>
  )
}
