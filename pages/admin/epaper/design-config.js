import { useCallback, useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useLayout } from '../../../components/dashboard/DashboardLayout'
import { logout } from '../../../utils/auth'
import epaperAdminApi from '../../../lib/api/services/epaperAdminApi'

function normalizeRole(user) {
  const role = user?.role || user?.roleName || user?.userRole || user?.role?.name || ''
  const roleName = typeof role === 'string' ? role : role?.name || ''
  return String(roleName).toUpperCase().replace(/[_\s-]/g, '')
}

function pretty(value) {
  return JSON.stringify(value || {}, null, 2)
}

function parseJson(text, fallback = {}) {
  try {
    return text?.trim() ? JSON.parse(text) : fallback
  } catch (e) {
    throw new Error(`Invalid JSON: ${e?.message || 'Unknown parse error'}`)
  }
}

function Card({ title, children, right }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm md:text-base font-semibold text-slate-900">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}

function JsonArea({ value, onChange, minRows = 10 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={minRows}
      className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/40"
    />
  )
}

function EPaperDesignConfigContent() {
  const { user } = useLayout()
  const role = normalizeRole(user)
  const isSuperAdmin = role === 'SUPERADMIN' || role === 'SUPERADMINISTRATOR' || role === 'SUPERADMINROLE' || role === 'SUPER_ADMIN'.replace(/[_\s-]/g, '')

  const [tenantId, setTenantId] = useState('')
  const [tenants, setTenants] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [settingsData, setSettingsData] = useState(null)
  const [settingsEdit, setSettingsEdit] = useState('{}')

  const [designData, setDesignData] = useState(null)
  const [designUpsertEdit, setDesignUpsertEdit] = useState('{}')
  const [designPatchEdit, setDesignPatchEdit] = useState('{\n  "footerText": "Footer text here"\n}')

  const [issuesData, setIssuesData] = useState([])
  const [issueYear, setIssueYear] = useState(String(new Date().getFullYear()))
  const [issueDate, setIssueDate] = useState('')
  const [issueEdit, setIssueEdit] = useState('{\n  "pageCount": 12,\n  "paperSellCost": 5,\n  "status": "DRAFT"\n}')

  const [editionsData, setEditionsData] = useState([])
  const [editionId, setEditionId] = useState('')
  const [subEditionId, setSubEditionId] = useState('')
  const [editionEdit, setEditionEdit] = useState('{\n  "name": "Main Edition",\n  "slug": "main-edition",\n  "isActive": true\n}')
  const [subEditionEdit, setSubEditionEdit] = useState('{\n  "name": "Hyderabad Edition",\n  "slug": "hyderabad",\n  "isActive": true\n}')

  const selectedEdition = useMemo(
    () => editionsData.find((item) => String(item?.id) === String(editionId)) || null,
    [editionsData, editionId]
  )

  const requireTenant = useCallback(() => {
    if (!tenantId) throw new Error('Select tenant first')
    return tenantId
  }, [tenantId])

  const loadTenants = useCallback(async () => {
    const res = await fetch('/api/admin/proxy/tenants?full=true')
    if (res.status === 401) {
      logout()
      throw new Error('Unauthorized')
    }
    if (!res.ok) throw new Error(`Failed to load tenants: ${res.status}`)
    const json = await res.json().catch(() => ({}))
    const list = Array.isArray(json) ? json : json?.data || json?.items || []
    setTenants(list)
    if (!tenantId && list[0]?.id) setTenantId(String(list[0].id))
  }, [tenantId])

  const loadSettings = useCallback(async () => {
    const t = requireTenant()
    const data = await epaperAdminApi.getSettings(t)
    setSettingsData(data)
    setSettingsEdit(pretty(data?.settings || data?.defaults || data || {}))
  }, [requireTenant])

  const loadDesignConfig = useCallback(async () => {
    const t = requireTenant()
    const data = await epaperAdminApi.getDesignConfig(t)
    setDesignData(data)
    setDesignUpsertEdit(pretty(data?.designConfig || data || {}))
    setIssuesData(Array.isArray(data?.issueEntries) ? data.issueEntries : [])
  }, [requireTenant])

  const loadEditions = useCallback(async () => {
    const t = requireTenant()
    const data = await epaperAdminApi.listPublicationEditions(t, true)
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []
    setEditionsData(items)
    if (!editionId && items[0]?.id) setEditionId(String(items[0].id))
  }, [editionId, requireTenant])

  const loadAll = useCallback(async () => {
    setBusy(true)
    setError('')
    setInfo('')
    try {
      await Promise.all([loadSettings(), loadDesignConfig(), loadEditions()])
      setInfo('Loaded settings, design config, issues, and editions.')
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }, [loadDesignConfig, loadEditions, loadSettings])

  useEffect(() => {
    if (isSuperAdmin) {
      loadTenants().catch((e) => setError(e?.message || String(e)))
    }
  }, [isSuperAdmin, loadTenants])

  const handleAction = async (action, message) => {
    setBusy(true)
    setError('')
    setInfo('')
    try {
      await action()
      setInfo(message)
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This screen is available only for SUPER_ADMIN.
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-lg md:text-xl font-bold text-slate-900">Epaper Design Config</h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Tenant-scoped Super Admin panel for ePaper settings, design config, issues, and editions.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="md:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-sm"
          >
            <option value="">Select tenant</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name || tenant.slug || tenant.id}
              </option>
            ))}
          </select>
          <button
            onClick={loadAll}
            disabled={busy || !tenantId}
            className="px-3 py-2 rounded-lg bg-brand text-white text-sm disabled:opacity-60"
          >
            {busy ? 'Loading...' : 'Load All'}
          </button>
          <button
            onClick={() => {
              setError('')
              setInfo('')
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          >
            Clear Messages
          </button>
        </div>
        {error ? <div className="mt-3 text-sm text-red-700">{error}</div> : null}
        {info ? <div className="mt-3 text-sm text-emerald-700">{info}</div> : null}
      </div>

      <Card
        title="1) /epaper/settings"
        right={
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(async () => {
                const t = requireTenant()
                await epaperAdminApi.initializeSettings(t)
                await loadSettings()
              }, 'Settings initialized and reloaded.')}
              disabled={busy || !tenantId}
              className="px-3 py-1.5 text-xs rounded border border-slate-300"
            >
              Initialize
            </button>
            <button
              onClick={() => handleAction(loadSettings, 'Settings loaded.')}
              disabled={busy || !tenantId}
              className="px-3 py-1.5 text-xs rounded bg-slate-900 text-white"
            >
              Reload
            </button>
          </div>
        }
      >
        <JsonArea value={settingsEdit} onChange={setSettingsEdit} />
        <div className="flex justify-end">
          <button
            onClick={() => handleAction(async () => {
              const t = requireTenant()
              const payload = parseJson(settingsEdit, {})
              await epaperAdminApi.updateSettings(t, payload)
              await loadSettings()
            }, 'Settings updated successfully.')}
            disabled={busy || !tenantId}
            className="px-4 py-2 rounded-lg bg-brand text-white text-sm disabled:opacity-60"
          >
            Save Settings (PUT)
          </button>
        </div>
        {settingsData ? (
          <div className="text-xs text-slate-500">Initialized: {String(!!settingsData?.initialized)}</div>
        ) : null}
      </Card>

      <Card
        title="2) /epaper/design-config"
        right={
          <button
            onClick={() => handleAction(loadDesignConfig, 'Design config loaded.')}
            disabled={busy || !tenantId}
            className="px-3 py-1.5 text-xs rounded bg-slate-900 text-white"
          >
            Reload
          </button>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-medium text-slate-700 mb-1">Upsert payload (POST/PUT)</div>
            <JsonArea value={designUpsertEdit} onChange={setDesignUpsertEdit} minRows={11} />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleAction(async () => {
                  const t = requireTenant()
                  const payload = parseJson(designUpsertEdit, {})
                  await epaperAdminApi.upsertDesignConfig(t, payload, 'POST')
                  await loadDesignConfig()
                }, 'Design config upserted using POST.')}
                disabled={busy || !tenantId}
                className="px-3 py-1.5 rounded border border-slate-300 text-xs"
              >
                Upsert (POST)
              </button>
              <button
                onClick={() => handleAction(async () => {
                  const t = requireTenant()
                  const payload = parseJson(designUpsertEdit, {})
                  await epaperAdminApi.upsertDesignConfig(t, payload, 'PUT')
                  await loadDesignConfig()
                }, 'Design config upserted using PUT.')}
                disabled={busy || !tenantId}
                className="px-3 py-1.5 rounded border border-slate-300 text-xs"
              >
                Upsert (PUT)
              </button>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-700 mb-1">Patch payload</div>
            <JsonArea value={designPatchEdit} onChange={setDesignPatchEdit} minRows={11} />
            <button
              onClick={() => handleAction(async () => {
                const t = requireTenant()
                const payload = parseJson(designPatchEdit, {})
                await epaperAdminApi.patchDesignConfig(t, payload)
                await loadDesignConfig()
              }, 'Design config patched.')}
              disabled={busy || !tenantId}
              className="mt-2 px-3 py-1.5 rounded bg-brand text-white text-xs disabled:opacity-60"
            >
              Patch (PATCH)
            </button>
          </div>
        </div>
      </Card>

      <Card title="3) /epaper/design-config/issues">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            value={issueYear}
            onChange={(e) => setIssueYear(e.target.value)}
            placeholder="Year (e.g. 2026)"
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <button
            onClick={() => handleAction(async () => {
              const t = requireTenant()
              const data = await epaperAdminApi.listIssueEntries(t, issueYear || undefined)
              const items = Array.isArray(data?.items) ? data.items : Array.isArray(data?.issueEntries) ? data.issueEntries : Array.isArray(data) ? data : []
              setIssuesData(items)
            }, 'Issue entries loaded.')}
            disabled={busy || !tenantId}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          >
            List Issues
          </button>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <button
            onClick={() => handleAction(async () => {
              const t = requireTenant()
              if (!issueDate) throw new Error('Select issue date')
              const payload = parseJson(issueEdit, {})
              await epaperAdminApi.createIssueEntry(t, { issueDate, ...payload })
              await loadDesignConfig()
            }, 'Issue entry created.')}
            disabled={busy || !tenantId}
            className="px-3 py-2 rounded-lg bg-brand text-white text-sm"
          >
            Create Issue
          </button>
        </div>
        <JsonArea value={issueEdit} onChange={setIssueEdit} minRows={7} />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleAction(async () => {
              const t = requireTenant()
              if (!issueDate) throw new Error('Select issue date')
              const payload = parseJson(issueEdit, {})
              await epaperAdminApi.updateIssueEntry(t, issueDate, payload, 'PUT')
              await loadDesignConfig()
            }, 'Issue entry updated (PUT).')}
            disabled={busy || !tenantId}
            className="px-3 py-1.5 rounded border border-slate-300 text-xs"
          >
            Update Issue (PUT)
          </button>
          <button
            onClick={() => handleAction(async () => {
              const t = requireTenant()
              if (!issueDate) throw new Error('Select issue date')
              const payload = parseJson(issueEdit, {})
              await epaperAdminApi.updateIssueEntry(t, issueDate, payload, 'PATCH')
              await loadDesignConfig()
            }, 'Issue entry patched (PATCH).')}
            disabled={busy || !tenantId}
            className="px-3 py-1.5 rounded border border-slate-300 text-xs"
          >
            Patch Issue
          </button>
          <button
            onClick={() => handleAction(async () => {
              const t = requireTenant()
              if (!issueDate) throw new Error('Select issue date')
              await epaperAdminApi.deleteIssueEntry(t, issueDate)
              await loadDesignConfig()
            }, 'Issue entry deleted.')}
            disabled={busy || !tenantId}
            className="px-3 py-1.5 rounded border border-red-300 text-red-700 text-xs"
          >
            Delete Issue
          </button>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 max-h-64 overflow-auto">
          <pre className="text-xs text-slate-700">{pretty(issuesData)}</pre>
        </div>
      </Card>

      <Card
        title="4) /epaper/publication-editions + sub-editions"
        right={
          <button
            onClick={() => handleAction(loadEditions, 'Editions loaded.')}
            disabled={busy || !tenantId}
            className="px-3 py-1.5 text-xs rounded bg-slate-900 text-white"
          >
            Reload
          </button>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-700">Edition payload</div>
            <JsonArea value={editionEdit} onChange={setEditionEdit} minRows={9} />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleAction(async () => {
                  const t = requireTenant()
                  const payload = parseJson(editionEdit, {})
                  await epaperAdminApi.createPublicationEdition(t, payload)
                  await loadEditions()
                }, 'Edition created.')}
                disabled={busy || !tenantId}
                className="px-3 py-1.5 rounded bg-brand text-white text-xs"
              >
                Create Edition
              </button>
              <input
                value={editionId}
                onChange={(e) => setEditionId(e.target.value)}
                placeholder="editionId"
                className="px-2 py-1.5 rounded border border-slate-300 text-xs"
              />
              <button
                onClick={() => handleAction(async () => {
                  const t = requireTenant()
                  if (!editionId) throw new Error('Provide editionId')
                  const payload = parseJson(editionEdit, {})
                  await epaperAdminApi.updatePublicationEdition(t, editionId, payload)
                  await loadEditions()
                }, 'Edition updated.')}
                disabled={busy || !tenantId}
                className="px-3 py-1.5 rounded border border-slate-300 text-xs"
              >
                Update Edition
              </button>
              <button
                onClick={() => handleAction(async () => {
                  const t = requireTenant()
                  if (!editionId) throw new Error('Provide editionId')
                  await epaperAdminApi.deletePublicationEdition(t, editionId)
                  await loadEditions()
                }, 'Edition deleted.')}
                disabled={busy || !tenantId}
                className="px-3 py-1.5 rounded border border-red-300 text-red-700 text-xs"
              >
                Delete Edition
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-700">Sub-edition payload</div>
            <JsonArea value={subEditionEdit} onChange={setSubEditionEdit} minRows={9} />
            <div className="flex gap-2 flex-wrap">
              <input
                value={subEditionId}
                onChange={(e) => setSubEditionId(e.target.value)}
                placeholder="subEditionId"
                className="px-2 py-1.5 rounded border border-slate-300 text-xs"
              />
              <button
                onClick={() => handleAction(async () => {
                  const t = requireTenant()
                  if (!editionId) throw new Error('Provide editionId')
                  const payload = parseJson(subEditionEdit, {})
                  await epaperAdminApi.createSubEdition(t, editionId, payload)
                  await loadEditions()
                }, 'Sub-edition created.')}
                disabled={busy || !tenantId}
                className="px-3 py-1.5 rounded bg-brand text-white text-xs"
              >
                Create Sub-edition
              </button>
              <button
                onClick={() => handleAction(async () => {
                  const t = requireTenant()
                  if (!editionId || !subEditionId) throw new Error('Provide editionId + subEditionId')
                  const payload = parseJson(subEditionEdit, {})
                  await epaperAdminApi.updateSubEdition(t, editionId, subEditionId, payload)
                  await loadEditions()
                }, 'Sub-edition updated.')}
                disabled={busy || !tenantId}
                className="px-3 py-1.5 rounded border border-slate-300 text-xs"
              >
                Update Sub-edition
              </button>
              <button
                onClick={() => handleAction(async () => {
                  const t = requireTenant()
                  if (!editionId || !subEditionId) throw new Error('Provide editionId + subEditionId')
                  await epaperAdminApi.deleteSubEdition(t, editionId, subEditionId)
                  await loadEditions()
                }, 'Sub-edition deleted.')}
                disabled={busy || !tenantId}
                className="px-3 py-1.5 rounded border border-red-300 text-red-700 text-xs"
              >
                Delete Sub-edition
              </button>
            </div>
            {selectedEdition ? (
              <div className="text-xs text-slate-500">
                Selected edition: <span className="font-medium text-slate-700">{selectedEdition?.name || selectedEdition?.id}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 max-h-80 overflow-auto">
          <pre className="text-xs text-slate-700">{pretty(editionsData)}</pre>
        </div>
      </Card>
    </div>
  )
}

export default function EPaperDesignConfigPage() {
  return (
    <DashboardLayout title="Epaper Design Config">
      <EPaperDesignConfigContent />
    </DashboardLayout>
  )
}
