import { useEffect, useState } from 'react'
import { getToken } from '../../utils/auth'
import Loader from '../Loader'

export default function AssemblyConstituenciesView() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [districts, setDistricts] = useState([])
  const [loadingDistricts, setLoadingDistricts] = useState(true)
  const [districtId, setDistrictId] = useState('')
  const [openCreate, setOpenCreate] = useState(false)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  async function fetchAllDistricts() {
    setLoadingDistricts(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/districts`, { headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` } })
      const json = await res.json().catch(()=>null)
      const list = Array.isArray(json) ? json : (json?.data || [])
      setDistricts(list)
    } catch {
      setDistricts([])
    } finally {
      setLoadingDistricts(false)
    }
  }

  async function fetchAssemblyByDistrict(id) {
    if (!id) return
    try {
      setError('')
      setLoading(true)
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const url = `${base}/api/v1/assembly-constituencies?districtId=${encodeURIComponent(id)}&includeDeleted=true`
      const res = await fetch(url, { headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` } })
      if (res.status === 404) { setRows([]); setError(''); setLoading(false); return }
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const json = await res.json().catch(()=>null)
      const list = Array.isArray(json) ? json : (json?.data || [])
      setRows(list)
    } catch (e) {
      setRows([])
      setError(e.message || 'Failed to load constituencies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAllDistricts() }, [])
  useEffect(() => { if (districtId) fetchAssemblyByDistrict(districtId); else { setRows([]); setError('') } }, [districtId])

  const normalizedQuery = (query || '').trim().toLowerCase()
  const displayRows = normalizedQuery ? rows.filter(r => String(r?.name || '').toLowerCase().includes(normalizedQuery)) : rows

  async function toggleDeleted(c) {
    if (!c?.id) return
    const nextDeleted = !c.isDeleted
    if (typeof window !== 'undefined') {
      const ok = window.confirm(`${nextDeleted ? 'Mark deleted' : 'Restore'} constituency ${c.name || ''}?`)
      if (!ok) return
    }
    setTogglingId(c.id)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = { name: c.name, isDeleted: nextDeleted }
      const res = await fetch(`${base}/api/v1/assembly-constituencies/${c.id}`, {
        method: 'PUT',
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(()=>null)
      if (!res.ok) {
        const msg = (json && (json.message || json.error)) || `Toggle failed: ${res.status}`
        throw new Error(`${msg} | Sent Payload: ${JSON.stringify(payload)}`)
      }
      if (districtId) fetchAssemblyByDistrict(districtId)
    } catch (e) {
      setError(e.message || 'Failed to toggle deleted state')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Assembly Constituencies</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm text-gray-600">District</label>
          <DistrictComboBox
            loading={loadingDistricts}
            districts={districts}
            value={districtId}
            onChange={setDistrictId}
          />
          <input
            className="px-2 py-2 text-sm border rounded bg-white w-56"
            placeholder="Search constituencies"
            value={query}
            onChange={e=>setQuery(e.target.value)}
            disabled={!districtId}
          />
          <button onClick={()=> districtId && fetchAssemblyByDistrict(districtId)} className="px-3 py-2 text-sm rounded border hover:bg-gray-50" disabled={!districtId}>Refresh</button>
          <button onClick={()=>setOpenCreate(true)} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark">Add Constituency</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Created</th>
                <th className="text-left px-4 py-2">Updated</th>
                <th className="text-left px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!districtId && (
                <tr><td className="px-4 py-6 text-gray-500" colSpan={4}>Select a district to view constituencies</td></tr>
              )}
              {districtId && loading && (
                <tr><td className="px-4 py-6" colSpan={4}><Loader size={72} label="Loading constituencies..." /></td></tr>
              )}
              {districtId && error && !loading && (
                <tr><td className="px-4 py-4 text-red-600" colSpan={4}>{error}</td></tr>
              )}
              {districtId && !loading && !error && displayRows.length === 0 && (
                <tr><td className="px-4 py-6 text-gray-500 text-center" colSpan={4}>{normalizedQuery ? 'No matching constituencies' : 'No constituencies in this district'}</td></tr>
              )}
              {districtId && !loading && !error && displayRows.map(c => (
                <tr key={c.id || c.name} className="border-t">
                  <td className="px-4 py-2 font-medium text-gray-800">{c.name || '-'}</td>
                  <td className="px-4 py-2">{c.isDeleted ? 'Deleted' : 'Active'}</td>
                  <td className="px-4 py-2">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2">{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={()=>setEditing(c)}>Edit</button>
                      <button
                        className={`px-2 py-1 text-xs rounded border disabled:opacity-50 ${c.isDeleted ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-red-300 text-red-700 hover:bg-red-50'}`}
                        disabled={togglingId===c.id}
                        onClick={()=>toggleDeleted(c)}
                      >{togglingId===c.id ? (c.isDeleted ? 'Restoring...' : 'Deleting...') : (c.isDeleted ? 'Restore' : 'Delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {openCreate && (
        <CreateAssemblyModal
          districtId={districtId}
          districts={districts}
          onClose={()=>setOpenCreate(false)}
          onCreated={()=>{ setOpenCreate(false); if (districtId) fetchAssemblyByDistrict(districtId) }}
        />
      )}
      {editing && (
        <EditAssemblyModal
          constituency={editing}
          onClose={()=>setEditing(null)}
          onSaved={()=>{ setEditing(null); if (districtId) fetchAssemblyByDistrict(districtId) }}
        />
      )}
    </div>
  )
}

function DistrictComboBox({ loading, districts = [], value, onChange }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const selected = districts.find(d => d.id === value) || null
  const list = (q ? districts.filter(d => String(d?.name || '').toLowerCase().includes(q.trim().toLowerCase())) : districts)
  useEffect(() => { if (!open) setQ('') }, [open])
  return (
    <div className="relative w-72">
      <button type="button" disabled={loading} onClick={() => setOpen(o => !o)} className={`w-full px-3 py-2 text-sm border rounded bg-white flex items-center justify-between ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}> 
        <span className="truncate text-left">{selected ? selected.name : 'Select district'}</span>
        <svg className={`w-4 h-4 ml-2 ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded shadow-lg">
          <div className="p-2 border-b">
            <input autoFocus className="w-full px-2 py-2 text-sm border rounded bg-white" placeholder="Search districts" value={q} onChange={e=>setQ(e.target.value)} />
          </div>
          <div className="max-h-64 overflow-auto">
            <button type="button" onClick={() => { onChange(''); setOpen(false) }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${value === '' ? 'bg-brand/10 text-brand' : ''}`}>Select district</button>
            {list.map(d => (
              <button key={d.id} type="button" onClick={() => { onChange(d.id); setOpen(false) }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${value === d.id ? 'bg-brand/10 text-brand' : ''}`}>{d.name}</button>
            ))}
            {list.length === 0 && (<div className="px-3 py-2 text-sm text-gray-500">No districts</div>)}
          </div>
        </div>
      )}
      {open && (<div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />)}
    </div>
  )
}

function CreateAssemblyModal({ districtId, districts = [], onClose, onCreated }) {
  const [name, setName] = useState('')
  const [selectedDistrictId, setSelectedDistrictId] = useState(districtId || (districts[0]?.id || ''))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setSelectedDistrictId(districtId || (districts[0]?.id || '')) }, [districtId, districts])

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Name is required'); return }
    if (!selectedDistrictId) { setError('District is required'); return }
    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = { name: name.trim(), districtId: selectedDistrictId }
      const res = await fetch(`${base}/api/v1/assembly-constituencies`, {
        method: 'POST',
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(()=>null)
      if (!res.ok) { const msg = (json && (json.message || json.error)) || `Create failed: ${res.status}`; throw new Error(msg) }
      if (onCreated) onCreated(json?.data || null)
      onClose()
      setName('')
    } catch (e) { setError(e.message || 'Failed to create constituency') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">Add Assembly Constituency</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Name</label>
            <input className="mt-1 w-full border rounded p-2" value={name} onChange={e=>setName(e.target.value)} placeholder="New Constituency" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">District</label>
            <select className="mt-1 w-full border rounded p-2 bg-white" value={selectedDistrictId} onChange={e=>setSelectedDistrictId(e.target.value)}>
              <option value="">Select district</option>
              {Array.isArray(districts) && districts.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
          <div className="pt-2 flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving? 'Creating...' : 'Create Constituency'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditAssemblyModal({ constituency, onClose, onSaved }) {
  const [name, setName] = useState(constituency?.name || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = { name: name.trim(), isDeleted: false }
      const res = await fetch(`${base}/api/v1/assembly-constituencies/${constituency.id}`, {
        method: 'PUT',
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(()=>null)
      if (!res.ok) {
        const baseMsg = (json && (json.message || json.error)) || `Update failed: ${res.status}`
        const detailed = `${baseMsg} | Sent Payload: ${JSON.stringify(payload)}`
        throw new Error(detailed)
      }
      if (onSaved) onSaved(json?.data || null)
      onClose()
    } catch (e) { setError(e.message || 'Failed to update constituency') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">Edit Assembly Constituency</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Name</label>
            <input className="mt-1 w-full border rounded p-2" value={name} onChange={e=>setName(e.target.value)} required />
          </div>
          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
          <div className="pt-2 flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
