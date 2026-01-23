/**
 * Admin Districts Page
 * /admin/locations/districts route
 */
import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { getToken } from '../../../utils/auth'

function getApiBase() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com').replace(/\/$/, '')
}

function DistrictsContent() {
  const [districts, setDistricts] = useState([])
  const [states, setStates] = useState([])
  const [selectedState, setSelectedState] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newDistrict, setNewDistrict] = useState({ name: '', stateId: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadStates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadStates = async () => {
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/states`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data?.data || [])
        setStates(list)
        if (list.length > 0 && !selectedState) {
          setSelectedState(list[0].id)
        }
      }
    } catch (e) {
      console.error('Failed to load states', e)
    }
  }

  const loadDistricts = async () => {
    if (!selectedState) return
    setLoading(true)
    setError('')
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/states/${selectedState}/districts`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      setDistricts(Array.isArray(data) ? data : (data?.data || []))
    } catch (e) {
      setError(e.message || 'Failed to load districts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedState) {
      loadDistricts()
      setNewDistrict(prev => ({ ...prev, stateId: selectedState }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newDistrict.name.trim() || !newDistrict.stateId) return
    
    setSaving(true)
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/districts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(newDistrict)
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      setNewDistrict({ name: '', stateId: selectedState })
      setShowAdd(false)
      loadDistricts()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Districts</h1>
          <p className="text-sm text-slate-500">Manage districts by state</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            {states.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark"
          >
            Add District
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex gap-4">
            <input
              placeholder="District name"
              value={newDistrict.name}
              onChange={e => setNewDistrict({...newDistrict, name: e.target.value})}
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              required
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
        ) : districts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No districts for this state</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Mandals</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {districts.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{d.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {d.mandals?.length || d._count?.mandals || 0} mandals
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

export default function AdminDistricts() {
  return (
    <DashboardLayout title="Districts">
      <DistrictsContent />
    </DashboardLayout>
  )
}
