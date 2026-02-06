/**
 * TenantAdminsTab - Manage tenant admins (TENANT_ADMIN)
 * Backend APIs:
 *   GET  /admin/tenants/:tenantId/admins
 *   POST /admin/tenants/:tenantId/admins
 *   PUT  /admin/tenants/:tenantId/admins (upsert by mobileNumber)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { tenantAdminsApi } from '../../../lib/api/tenantApi'

function formatIso(v) {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (isNaN(d.getTime())) return String(v)
    return d.toLocaleString()
  } catch {
    return String(v)
  }
}

function normalizeMobile(v) {
  return String(v || '').trim().replace(/\s+/g, '')
}

function Pill({ ok, labelOk = 'Active', labelNo = 'Inactive' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] ${ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {ok ? labelOk : labelNo}
    </span>
  )
}

export default function TenantAdminsTab({ tenantContext }) {
  const tenantId = tenantContext?.tenant?.id

  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [mode, setMode] = useState('create') // create | upsert
  const [saving, setSaving] = useState(false)

  const [lastCredentials, setLastCredentials] = useState(null)

  const [form, setForm] = useState({
    mobileNumber: '',
    fullName: '',
    mpin: '',
    resetMpin: false,
    active: true,
  })

  const loadAdmins = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setError('')

    try {
      const data = await tenantAdminsApi.list(tenantId)
      const list = Array.isArray(data) ? data : (data?.admins || data?.data?.admins || [])
      setAdmins(Array.isArray(list) ? list : [])
    } catch (e) {
      setAdmins([])
      setError(e?.message || 'Failed to load admins')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    loadAdmins()
  }, [loadAdmins])

  const stats = useMemo(() => {
    const total = admins.length
    const active = admins.filter(a => a?.active).length
    return { total, active }
  }, [admins])

  const filtered = useMemo(() => {
    const q = String(search || '').trim().toLowerCase()
    if (!q) return admins
    return admins.filter(a => (
      String(a?.fullName || '').toLowerCase().includes(q) ||
      String(a?.mobileNumber || '').toLowerCase().includes(q) ||
      String(a?.designation || '').toLowerCase().includes(q) ||
      String(a?.level || '').toLowerCase().includes(q)
    ))
  }, [admins, search])

  const openCreate = () => {
    setMode('create')
    setLastCredentials(null)
    setSuccess('')
    setError('')
    setForm({ mobileNumber: '', fullName: '', mpin: '', resetMpin: false, active: true })
    setShowForm(true)
  }

  const openEdit = (admin) => {
    setMode('upsert')
    setLastCredentials(null)
    setSuccess('')
    setError('')
    setForm({
      mobileNumber: normalizeMobile(admin?.mobileNumber),
      fullName: String(admin?.fullName || ''),
      mpin: '',
      resetMpin: false,
      active: admin?.active !== false,
    })
    setShowForm(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!tenantId) return

    const mobileNumber = normalizeMobile(form.mobileNumber)
    const fullName = String(form.fullName || '').trim()

    if (!mobileNumber || !fullName) {
      setError('Mobile number and full name are required')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      let resp
      if (mode === 'create') {
        resp = await tenantAdminsApi.create(tenantId, { mobileNumber, fullName })
        setSuccess(resp?.message || 'Tenant admin created successfully')
      } else {
        const payload = {
          mobileNumber,
          fullName,
          active: !!form.active,
          resetMpin: !!form.resetMpin,
        }
        if (String(form.mpin || '').trim()) payload.mpin = String(form.mpin || '').trim()

        resp = await tenantAdminsApi.upsert(tenantId, payload)
        const action = resp?.action ? ` (${resp.action})` : ''
        setSuccess((resp?.message || 'Admin upserted successfully') + action)
      }

      if (resp?.loginCredentials) {
        setLastCredentials(resp.loginCredentials)
      } else {
        setLastCredentials(null)
      }

      setShowForm(false)
      await loadAdmins()

      setTimeout(() => setSuccess(''), 4000)
    } catch (e2) {
      setError(e2?.message || 'Request failed')
    } finally {
      setSaving(false)
    }
  }

  const hasAdmins = admins.length > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Admins</h2>
          <p className="text-sm text-slate-500">View and manage tenant admin users (create via POST, update/upsert via PUT).</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search admins..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm w-48"
          />
          <button
            onClick={loadAdmins}
            className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-slate-50"
          >
            Refresh
          </button>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark"
          >
            Add Admin
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-sm text-slate-500">Total Admins</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-slate-500">Active</div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
          {success}
        </div>
      )}

      {lastCredentials?.mobileNumber && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="font-medium text-blue-900">Login credentials</div>
          <div className="text-sm text-blue-800 mt-1">Mobile: <span className="font-mono">{lastCredentials.mobileNumber}</span></div>
          {lastCredentials?.mpin && (
            <div className="text-sm text-blue-800">MPIN: <span className="font-mono">{lastCredentials.mpin}</span></div>
          )}
          <div className="text-xs text-blue-700 mt-2">Share securely. Consider forcing MPIN reset after first login if needed.</div>
        </div>
      )}

      {/* Create/Update Form */}
      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-slate-900">
                {mode === 'create' ? 'Create Tenant Admin' : 'Update / Upsert Admin'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {mode === 'create'
                  ? 'Uses POST /admin/tenants/:tenantId/admins'
                  : 'Uses PUT /admin/tenants/:tenantId/admins (mobileNumber is unique key)'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-2 border rounded-lg text-sm hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                value={form.mobileNumber}
                onChange={e => setForm(prev => ({ ...prev, mobileNumber: e.target.value }))}
                placeholder="9876543210"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={form.fullName}
                onChange={e => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Full name"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
            </div>

            {mode === 'upsert' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">MPIN (optional)</label>
                  <input
                    type="text"
                    value={form.mpin}
                    onChange={e => setForm(prev => ({ ...prev, mpin: e.target.value }))}
                    placeholder="New MPIN"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700 mt-6">
                    <input
                      type="checkbox"
                      checked={!!form.resetMpin}
                      onChange={e => setForm(prev => ({ ...prev, resetMpin: e.target.checked }))}
                    />
                    Reset MPIN
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700 mt-6">
                    <input
                      type="checkbox"
                      checked={!!form.active}
                      onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))}
                    />
                    Active
                  </label>
                </div>
              </>
            )}
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : (mode === 'create' ? 'Create Admin' : 'Save Changes')}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setShowForm(false)
                setLastCredentials(null)
              }}
              className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading admins…</div>
        ) : !hasAdmins ? (
          <div className="p-6">
            <div className="text-sm text-slate-700 font-medium">No admins found for this tenant.</div>
            <div className="text-xs text-slate-500 mt-1">Create the first tenant admin using the button above.</div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <div className="text-sm text-slate-700">Found <span className="font-semibold">{admins.length}</span> admin(s).</div>
              <div className="text-xs text-slate-500">If already verified, use Update (PUT) to change name/active/reset MPIN.</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Mobile</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Designation</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Level</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Created</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={`${a?.userId || a?.reporterId || a?.mobileNumber}`} className="border-b last:border-b-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{a?.fullName || '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{a?.mobileNumber || '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{a?.role || '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{a?.designation || '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{a?.level || '—'}</td>
                      <td className="px-4 py-3"><Pill ok={a?.active !== false} /></td>
                      <td className="px-4 py-3 text-slate-700">{formatIso(a?.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(a)}
                          className="px-3 py-1.5 border rounded-lg text-xs hover:bg-white"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
