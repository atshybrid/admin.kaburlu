/**
 * TenantReportersTab - Manage tenant reporters
 * API:
 *   GET /tenants/:tenantId/reporters
 *   GET /tenants/:tenantId/reporters/:reporterId
 *   POST /tenants/:tenantId/reporters
 *   PUT /tenants/:tenantId/reporters/:reporterId
 *   PATCH /tenants/:tenantId/reporters/:reporterId/auto-publish
 */
import { useState, useEffect, useCallback } from 'react'
import { reportersApi } from '../../../lib/api/tenantApi'

export default function TenantReportersTab({ tenantContext }) {
  const { tenant } = tenantContext
  const [reporters, setReporters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  
  const [form, setForm] = useState({
    mobileNumber: '',
    fullName: '',
    designationId: '',
    level: 'DISTRICT',
    stateId: '',
    districtId: ''
  })

  const loadReporters = useCallback(async () => {
    if (!tenant?.id) return
    setLoading(true)
    try {
      const data = await reportersApi.list(tenant.id)
      setReporters(Array.isArray(data) ? data : (data?.data || []))
    } catch (e) {
      console.error('Failed to load reporters', e)
      setReporters([])
    } finally {
      setLoading(false)
    }
  }, [tenant?.id])

  useEffect(() => {
    loadReporters()
  }, [loadReporters])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.mobileNumber.trim()) return
    
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      await reportersApi.create(tenant.id, form)
      setForm({ mobileNumber: '', fullName: '', designationId: '', level: 'DISTRICT', stateId: '', districtId: '' })
      setShowAdd(false)
      setSuccess('Reporter added successfully')
      await loadReporters()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleAutoPublish = async (reporter) => {
    try {
      await reportersApi.setAutoPublish(tenant.id, reporter.id, !reporter.autoPublish)
      await loadReporters()
    } catch (e) {
      console.error('Failed to update auto-publish', e)
    }
  }

  const toggleActive = async (reporter) => {
    try {
      await reportersApi.update(tenant.id, reporter.id, { active: !reporter.active })
      await loadReporters()
    } catch (e) {
      console.error('Failed to update status', e)
    }
  }

  const filteredReporters = reporters.filter(r =>
    r.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    r.mobileNumber?.toLowerCase().includes(search.toLowerCase()) ||
    r.designation?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: reporters.length,
    active: reporters.filter(r => r.active).length,
    pending: reporters.filter(r => r.kycStatus === 'PENDING').length,
    subscribed: reporters.filter(r => r.subscriptionActive).length
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Reporters</h2>
          <p className="text-sm text-slate-500">Manage reporters for this tenant</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search reporters..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm w-48"
          />
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark"
          >
            Add Reporter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-sm text-slate-500">Total Reporters</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-slate-500">Active</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-slate-500">Pending KYC</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.subscribed}</div>
          <div className="text-sm text-slate-500">Subscribed</div>
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

      {/* Add Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border p-6">
          <h3 className="font-medium text-slate-900 mb-4">Add New Reporter</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={form.fullName}
                onChange={e => setForm({...form, fullName: e.target.value})}
                placeholder="Full name"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                value={form.mobileNumber}
                onChange={e => setForm({...form, mobileNumber: e.target.value})}
                placeholder="9876543210"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
              <select
                value={form.level}
                onChange={e => setForm({...form, level: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="STATE">State</option>
                <option value="DISTRICT">District</option>
                <option value="ASSEMBLY">Assembly</option>
                <option value="MANDAL">Mandal</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Reporter'}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 border rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reporters List */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-brand rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredReporters.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {reporters.length === 0 ? 'No reporters yet' : 'No reporters match your search'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Reporter</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Level</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">KYC</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Auto-Publish</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredReporters.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.profilePhotoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={r.profilePhotoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white text-xs font-medium">
                          {r.fullName?.charAt(0)?.toUpperCase() || 'R'}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-900">{r.fullName}</div>
                        {r.designation?.name && (
                          <div className="text-xs text-slate-500">{r.designation.name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-600">{r.mobileNumber}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      r.level === 'STATE' ? 'bg-purple-50 text-purple-700' :
                      r.level === 'DISTRICT' ? 'bg-blue-50 text-blue-700' :
                      r.level === 'ASSEMBLY' ? 'bg-indigo-50 text-indigo-700' :
                      'bg-green-50 text-green-700'
                    }`}>
                      {r.level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      r.kycStatus === 'APPROVED'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : r.kycStatus === 'PENDING'
                        ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {r.kycStatus || 'PENDING'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      r.active
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {r.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleAutoPublish(r)}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        r.autoPublish ? 'bg-brand' : 'bg-slate-200'
                      }`}
                    >
                      <span className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform ${
                        r.autoPublish ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(r)}
                        className="text-xs text-brand hover:underline"
                      >
                        {r.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <span className="text-slate-200">|</span>
                      <button className="text-xs text-slate-500 hover:text-brand">
                        View ID Card
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
