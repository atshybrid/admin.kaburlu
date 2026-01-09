/**
 * TenantReportersTab - Manage tenant reporters
 */
import { useState, useEffect } from 'react'
import { getToken } from '../../../utils/auth'

// Use local proxy to avoid CORS
function getApiBase() {
  if (typeof window !== 'undefined') return '/api/proxy'
  return (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.kaburlumedia.com').replace(/\/$/, '') + '/api/v1'
}

export default function TenantReportersTab({ tenantContext }) {
  const { tenant } = tenantContext
  const [reporters, setReporters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    district: '',
    status: 'active'
  })

  const loadReporters = async () => {
    setLoading(true)
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/tenants/${tenant.id}/reporters`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (res.ok) {
        const data = await res.json()
        setReporters(Array.isArray(data) ? data : (data?.data || []))
      } else {
        setReporters([])
      }
    } catch (e) {
      console.error('Failed to load reporters', e)
      setReporters([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tenant?.id) loadReporters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    
    setSaving(true)
    setError('')
    
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/tenants/${tenant.id}/reporters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      setForm({ name: '', email: '', phone: '', designation: '', district: '', status: 'active' })
      setShowAdd(false)
      loadReporters()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (reporter) => {
    try {
      const t = getToken()
      const newStatus = reporter.status === 'active' ? 'inactive' : 'active'
      const res = await fetch(`${getApiBase()}/api/v1/tenants/${tenant.id}/reporters/${reporter.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) loadReporters()
    } catch (e) {
      console.error('Failed to update status', e)
    }
  }

  const filteredReporters = reporters.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.designation?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: reporters.length,
    active: reporters.filter(r => r.status === 'active').length,
    pending: reporters.filter(r => r.status === 'pending').length
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
      <div className="grid grid-cols-3 gap-4">
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
          <div className="text-sm text-slate-500">Pending</div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Add Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border p-6">
          <h3 className="font-medium text-slate-900 mb-4">Add New Reporter</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                placeholder="Full name"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                value={form.designation}
                onChange={e => setForm({...form, designation: e.target.value})}
                placeholder="Senior Reporter"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
              <input
                type="text"
                value={form.district}
                onChange={e => setForm({...form, district: e.target.value})}
                placeholder="District name"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm({...form, status: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
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
                <th className="text-left px-4 py-3 font-medium text-slate-600">Designation</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">District</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredReporters.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white text-xs font-medium">
                        {r.name?.charAt(0)?.toUpperCase() || 'R'}
                      </div>
                      <span className="font-medium text-slate-900">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-600">{r.email}</div>
                    {r.phone && <div className="text-xs text-slate-400">{r.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.designation || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{r.district || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      r.status === 'active'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : r.status === 'pending'
                        ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {r.status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStatus(r)}
                        className="text-xs text-brand hover:underline"
                      >
                        {r.status === 'active' ? 'Deactivate' : 'Activate'}
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
