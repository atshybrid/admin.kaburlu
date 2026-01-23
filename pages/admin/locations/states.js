/**
 * Admin States Page
 * /admin/locations/states route
 */
import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { getToken } from '../../../utils/auth'

function getApiBase() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com').replace(/\/$/, '')
}

function StatesContent() {
  const [states, setStates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newState, setNewState] = useState({ name: '', code: '' })
  const [saving, setSaving] = useState(false)

  const loadStates = async () => {
    setLoading(true)
    setError('')
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/states`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      setStates(Array.isArray(data) ? data : (data?.data || []))
    } catch (e) {
      setError(e.message || 'Failed to load states')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStates()
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newState.name.trim()) return
    
    setSaving(true)
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/states`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(newState)
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      setNewState({ name: '', code: '' })
      setShowAdd(false)
      loadStates()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredStates = states.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.code?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">States</h1>
          <p className="text-sm text-slate-500">Manage states and regions</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search states..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm w-48"
          />
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark"
          >
            Add State
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex gap-4">
            <input
              placeholder="State name"
              value={newState.name}
              onChange={e => setNewState({...newState, name: e.target.value})}
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              required
            />
            <input
              placeholder="Code (e.g., AP, TS)"
              value={newState.code}
              onChange={e => setNewState({...newState, code: e.target.value})}
              className="w-32 px-3 py-2 border rounded-lg text-sm"
            />
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-brand rounded-full animate-spin mx-auto" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : filteredStates.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No states found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Code</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Districts</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredStates.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.code || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {s.districts?.length || s._count?.districts || 0} districts
                    </span>
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

export default function AdminStates() {
  return (
    <DashboardLayout title="States">
      <StatesContent />
    </DashboardLayout>
  )
}
