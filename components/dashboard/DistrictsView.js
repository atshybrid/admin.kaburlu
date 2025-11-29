import { useEffect, useState } from 'react'
import { getToken } from '../../utils/auth'
import Loader from '../Loader'

export default function DistrictsView() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [states, setStates] = useState([])
  const [loadingStates, setLoadingStates] = useState(true)
  const [stateId, setStateId] = useState('')
  const [openCreate, setOpenCreate] = useState(false)
  const [editing, setEditing] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [openBulk, setOpenBulk] = useState(false)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  async function fetchStates() {
    setLoadingStates(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/states`, { headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` } })
      const json = await res.json()
      const list = Array.isArray(json) ? json : (json?.data || [])
      setStates(list)
      // Default remains "All" (no state preselected)
    } catch {
      setStates([])
    } finally { setLoadingStates(false) }
  }

  async function fetchAllDistricts() {
    try {
      setError('')
      setLoading(true)
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/districts?includeDeleted=true&page=${page}&pageSize=${pageSize}`, {
        headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (!res.ok && res.status !== 404) throw new Error(`Request failed: ${res.status}`)
      const json = await res.json().catch(()=>null)
      const list = Array.isArray(json) ? json : (json?.data || [])
      const meta = (!Array.isArray(json) && json?.meta) || null
      setTotalPages(meta?.totalPages || 1)
      setTotal(meta?.total || list.length)
      setRows(list)
      setError('')
    } catch (e) {
      if (e.message && /404/.test(e.message)) {
        setRows([])
        setError('')
      } else {
        setRows([])
        setError(e.message || 'Failed to load districts')
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchDistrictsByState(id) {
    if (!id) return
    try {
      setError('')
      setLoading(true)
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/districts?stateId=${encodeURIComponent(id)}&includeDeleted=true&page=${page}&pageSize=${pageSize}`, {
        headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (res.status === 404) {
        setRows([])
        setError('')
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const json = await res.json()
      const list = Array.isArray(json) ? json : (json?.data || [])
      const meta = (!Array.isArray(json) && json?.meta) || null
      setTotalPages(meta?.totalPages || 1)
      setTotal(meta?.total || list.length)
      setRows(list)
    } catch (e) {
      setError(e.message || 'Failed to load districts')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStates(); fetchAllDistricts() }, [])
  useEffect(() => {
    if (stateId) fetchDistrictsByState(stateId); else fetchAllDistricts()
  }, [stateId, page, pageSize])

  async function toggleDeleted(d) {
    if (!d?.id) return
    const nextDeleted = !d.isDeleted
    const ok = typeof window !== 'undefined' ? window.confirm(`${nextDeleted ? 'Mark deleted' : 'Restore'} district ${d.name || ''}?`) : true
    if (!ok) return
    setError('')
    setTogglingId(d.id)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = { name: d.name, isDeleted: nextDeleted }
      const res = await fetch(`${base}/api/v1/districts/${d.id}`, {
        method: 'PUT',
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(()=>null)
      if (!res.ok) {
        const msg = (json && (json.message || json.error)) || `Toggle failed: ${res.status}`
        throw new Error(`${msg} | Sent Payload: ${JSON.stringify(payload)}`)
      }
      if (stateId) await fetchDistrictsByState(stateId); else await fetchAllDistricts()
    } catch (e) {
      setError(e.message || 'Failed to toggle district')
    } finally {
      setTogglingId(null)
    }
  }

  const normalizedQuery = (query || '').trim().toLowerCase()
  const displayRows = normalizedQuery
    ? rows.filter(d => String(d?.name || '').toLowerCase().includes(normalizedQuery))
    : rows

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Districts</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">State</label>
          <select className="px-2 py-2 text-sm border rounded bg-white" value={stateId} onChange={e=>setStateId(e.target.value)} disabled={loadingStates}>
            {loadingStates ? (
              <option>Loading...</option>
            ) : (
              <>
                <option value="">All States</option>
                {states.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </>
            )}
          </select>
          <input
            className="px-2 py-2 text-sm border rounded bg-white w-56"
            placeholder="Search districts"
            value={query}
            onChange={e=>setQuery(e.target.value)}
          />
          <button onClick={()=> stateId ? fetchDistrictsByState(stateId) : fetchAllDistricts()} className="px-3 py-2 text-sm rounded border hover:bg-gray-50">Refresh</button>
          <button onClick={()=>setOpenCreate(true)} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark">Add District</button>
          <button onClick={()=>setOpenBulk(true)} className="px-3 py-2 text-sm rounded border hover:bg-gray-50">Bulk Upload</button>
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
              {loading && (
                <tr>
                  <td className="px-4 py-6" colSpan={5}>
                    <Loader size={72} label="Loading districts..." />
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr><td className="px-4 py-4 text-red-600" colSpan={5}>{error}</td></tr>
              )}
              {!loading && !error && displayRows.length === 0 && (
                <tr><td className="px-4 py-6 text-gray-500 text-center" colSpan={5}>{normalizedQuery ? 'No matching districts' : (stateId ? 'No districts in this state' : 'No districts found')}</td></tr>
              )}
              {!loading && !error && displayRows.map((d) => (
                <tr key={d.id || d.name} className="border-t">
                  <td className="px-4 py-2 font-medium text-gray-800">{d.name || '-'}</td>
                  <td className="px-4 py-2">{d.isDeleted ? 'Deleted' : 'Active'}</td>
                  <td className="px-4 py-2">{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2">{d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={()=>setEditing(d)}>Edit</button>
                      <button
                        className={`px-2 py-1 text-xs rounded border disabled:opacity-50 ${d.isDeleted ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-red-300 text-red-700 hover:bg-red-50'}`}
                        disabled={togglingId===d.id}
                        onClick={()=>toggleDeleted(d)}
                      >{togglingId===d.id ? (d.isDeleted ? 'Restoring...' : 'Deleting...') : (d.isDeleted ? 'Restore' : 'Delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing page {page} of {totalPages} {total ? `(total ${total})` : ''}
        </div>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 rounded border" disabled={page<=1 || loading} onClick={()=> setPage(p => Math.max(1, p-1))}>Prev</button>
          <button className="px-2 py-1 rounded border" disabled={page>=totalPages || loading} onClick={()=> setPage(p => Math.min(totalPages, p+1))}>Next</button>
          <select className="ml-2 px-2 py-1 border rounded bg-white" value={pageSize} onChange={e=>setPageSize(Number(e.target.value))} disabled={loading}>
            {[10,20,50].map(s => (<option key={s} value={s}>{s}/page</option>))}
          </select>
        </div>
      </div>
      {openCreate && (
        <CreateDistrictModal
          stateId={stateId}
          states={states}
          onClose={()=>setOpenCreate(false)}
          onCreated={()=>{ setOpenCreate(false); stateId ? fetchDistrictsByState(stateId) : fetchAllDistricts() }}
        />
      )}
      {editing && (
        <EditDistrictModal
          district={editing}
          onClose={()=>setEditing(null)}
          onSaved={()=>{ setEditing(null); if (stateId) fetchDistrictsByState(stateId); else fetchAllDistricts() }}
        />
      )}
      {openBulk && (
        <BulkUploadDistrictsModal
          stateId={stateId}
          onClose={()=>setOpenBulk(false)}
          onUploaded={()=>{ setOpenBulk(false); stateId ? fetchDistrictsByState(stateId) : fetchAllDistricts() }}
        />
      )}
    </div>
  )
}

function EditDistrictModal({ district, onClose, onSaved }) {
  const [name, setName] = useState(district?.name || '')
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
      const payload = name.trim()
      const res = await fetch(`${base}/api/v1/districts/${district.id}`, {
        method: 'PUT',
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(()=>null)
      if (!res.ok) {
        const msg = (json && (json.message || json.error)) || `Update failed: ${res.status}`
        throw new Error(`${msg} | Sent Payload: ${JSON.stringify(payload)}`)
      }
      if (onSaved) onSaved(json?.data || null)
      onClose()
    } catch (e) { setError(e.message || 'Failed to update district') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">Edit District</div>
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

function CreateDistrictModal({ stateId, states = [], onClose, onCreated }) {
  const [name, setName] = useState('')
  const [selectedStateId, setSelectedStateId] = useState(stateId || (states[0]?.id || ''))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setSelectedStateId(stateId || (states[0]?.id || ''))
  }, [stateId, states])

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Name is required'); return }
    if (!selectedStateId) { setError('State is required'); return }
    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = { name: name.trim(), stateId: selectedStateId }
      const res = await fetch(`${base}/api/v1/districts`, {
        method: 'POST',
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(()=>null)
      if (!res.ok) { const msg = (json && (json.message || json.error)) || `Create failed: ${res.status}`; throw new Error(msg) }
      if (onCreated) onCreated(json?.data || null)
      onClose()
      setName('')
    } catch (e) { setError(e.message || 'Failed to create district') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">Add District</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Name</label>
            <input className="mt-1 w-full border rounded p-2" value={name} onChange={e=>setName(e.target.value)} placeholder="New District" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">State</label>
            <select className="mt-1 w-full border rounded p-2 bg-white" value={selectedStateId} onChange={e=>setSelectedStateId(e.target.value)}>
              <option value="">Select state</option>
              {Array.isArray(states) && states.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
          <div className="pt-2 flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving? 'Creating...' : 'Create District'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BulkUploadDistrictsModal({ stateId, onClose, onUploaded }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const sampleCsv = `name,stateId\nDistrict One,REPLACE_STATE_ID\nDistrict Two,REPLACE_STATE_ID\n\nname,stateName\nDistrict Three,Telangana\nDistrict Four,Andhra Pradesh`

  async function handleUpload(e) {
    e.preventDefault()
    setError('')
    if (!file) { setError('CSV file is required'); return }
    setUploading(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${base}/api/v1/districts/bulk-upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t?.token || ''}` },
        body: form
      })
      const json = await res.json().catch(()=>null)
      if (!res.ok) { const msg = (json && (json.message || json.error)) || `Upload failed: ${res.status}`; throw new Error(msg) }
      if (onUploaded) onUploaded(json?.data || null)
      onClose()
    } catch (e) { setError(e.message || 'Failed to upload CSV') } finally { setUploading(false) }
  }

  function downloadSample() {
    try {
      const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'districts-sample.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">Bulk Upload Districts</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleUpload} className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          <div>
            <label className="block text-xs font-semibold text-gray-700">CSV File</label>
            <input type="file" accept=".csv,text/csv" onChange={e=>setFile(e.target.files?.[0] || null)} />
            {file && <div className="mt-1 text-xs text-gray-600">Selected: {file.name}</div>}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700">Sample CSV</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={downloadSample} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">Download</button>
                <button type="button" onClick={()=>navigator.clipboard.writeText(sampleCsv)} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">Copy</button>
              </div>
            </div>
            <pre className="text-xs bg-gray-100 border rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap">{sampleCsv}</pre>
            <ul className="mt-2 text-xs text-gray-600 list-disc pl-5 space-y-1">
              <li><strong>name</strong>: required</li>
              <li><strong>stateId</strong> OR <strong>stateName</strong>: one required</li>
            </ul>
          </div>
          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
          <div className="pt-2 flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={uploading || !file} className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{uploading? 'Uploading...' : (file? 'Upload CSV' : 'Select CSV')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
