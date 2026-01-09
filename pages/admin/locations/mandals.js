/**
 * Admin Mandals Page
 * /admin/locations/mandals route
 */
import { useState, useEffect } from 'react'
import SuperAdminLayout from '../../../components/admin/SuperAdminLayout'
import { getToken } from '../../../utils/auth'

function getApiBase() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com').replace(/\/$/, '')
}

function MandalsContent() {
  const [mandals, setMandals] = useState([])
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [selectedState, setSelectedState] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newMandal, setNewMandal] = useState({ name: '', districtId: '' })
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
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/states/${selectedState}/districts`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data?.data || [])
        setDistricts(list)
        if (list.length > 0) {
          setSelectedDistrict(list[0].id)
        } else {
          setSelectedDistrict('')
          setMandals([])
        }
      }
    } catch (e) {
      console.error('Failed to load districts', e)
    }
  }

  useEffect(() => {
    if (selectedState) loadDistricts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState])

  const loadMandals = async () => {
    if (!selectedDistrict) return
    setLoading(true)
    setError('')
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/districts/${selectedDistrict}/mandals`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      setMandals(Array.isArray(data) ? data : (data?.data || []))
    } catch (e) {
      setError(e.message || 'Failed to load mandals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedDistrict) {
      loadMandals()
      setNewMandal(prev => ({ ...prev, districtId: selectedDistrict }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrict])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newMandal.name.trim() || !newMandal.districtId) return
    
    setSaving(true)
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/mandals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(newMandal)
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      setNewMandal({ name: '', districtId: selectedDistrict })
      setShowAdd(false)
      loadMandals()
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
          <h1 className="text-xl font-bold text-slate-900">Mandals</h1>
          <p className="text-sm text-slate-500">Manage mandals by district</p>
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
          <select
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            {districts.length === 0 ? (
              <option value="">No districts</option>
            ) : (
              districts.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))
            )}
          </select>
          <button
            onClick={() => setShowAdd(!showAdd)}
            disabled={!selectedDistrict}
            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50"
          >
            Add Mandal
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex gap-4">
            <input
              placeholder="Mandal name"
              value={newMandal.name}
              onChange={e => setNewMandal({...newMandal, name: e.target.value})}
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
        ) : mandals.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No mandals for this district</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mandals.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default function AdminMandals() {
  return (
    <SuperAdminLayout title="Mandals">
      <MandalsContent />
    </SuperAdminLayout>
  )
}
