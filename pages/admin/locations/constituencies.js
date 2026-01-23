/**
 * Admin Assembly Constituencies Page
 * /admin/locations/constituencies route
 */
import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { getToken } from '../../../utils/auth'

function getApiBase() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com').replace(/\/$/, '')
}

function ConstituenciesContent() {
  const [constituencies, setConstituencies] = useState([])
  const [states, setStates] = useState([])
  const [selectedState, setSelectedState] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newConst, setNewConst] = useState({ name: '', code: '', stateId: '' })
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

  const loadConstituencies = async () => {
    if (!selectedState) return
    setLoading(true)
    setError('')
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/states/${selectedState}/assembly-constituencies`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      setConstituencies(Array.isArray(data) ? data : (data?.data || []))
    } catch (e) {
      setError(e.message || 'Failed to load constituencies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedState) {
      loadConstituencies()
      setNewConst(prev => ({ ...prev, stateId: selectedState }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newConst.name.trim() || !newConst.stateId) return
    
    setSaving(true)
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/assembly-constituencies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(newConst)
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      setNewConst({ name: '', code: '', stateId: selectedState })
      setShowAdd(false)
      loadConstituencies()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredConst = constituencies.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.code?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Assembly Constituencies</h1>
          <p className="text-sm text-slate-500">Manage constituencies by state</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            {states.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm w-36"
          />
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark"
          >
            Add Constituency
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex gap-4">
            <input
              placeholder="Constituency name"
              value={newConst.name}
              onChange={e => setNewConst({...newConst, name: e.target.value})}
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              required
            />
            <input
              placeholder="Code (optional)"
              value={newConst.code}
              onChange={e => setNewConst({...newConst, code: e.target.value})}
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
        ) : filteredConst.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No constituencies found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
            {filteredConst.map((c) => (
              <div key={c.id} className="border rounded-lg p-3 hover:bg-slate-50 transition-colors">
                <div className="font-medium text-slate-900">{c.name}</div>
                {c.code && (
                  <div className="text-xs text-slate-500 mt-1">Code: {c.code}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminConstituencies() {
  return (
    <DashboardLayout title="Constituencies">
      <ConstituenciesContent />
    </DashboardLayout>
  )
}
