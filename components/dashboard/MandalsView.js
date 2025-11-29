import { useEffect, useState } from 'react'
import { getToken } from '../../utils/auth'
import Loader from '../Loader'

export default function MandalsView() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [districts, setDistricts] = useState([])
  const [loadingDistricts, setLoadingDistricts] = useState(true)
  const [districtId, setDistrictId] = useState('')
  const [openCreate, setOpenCreate] = useState(false)
  const [editing, setEditing] = useState(null)
  const [query, setQuery] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [openBulk, setOpenBulk] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

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

  async function fetchMandalsByDistrict(id) {
    if (!id) return
    try {
      setError('')
      setLoading(true)
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const url = `${base}/api/v1/mandals?districtId=${encodeURIComponent(id)}&includeDeleted=true&page=${page}&pageSize=${pageSize}`
      const res = await fetch(url, { headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` } })
      if (res.status === 404) {
        setRows([])
        setError('')
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const json = await res.json().catch(()=>null)
      const list = Array.isArray(json) ? json : (json?.data || [])
      const meta = (!Array.isArray(json) && json?.meta) || null
      setTotalPages(meta?.totalPages || 1)
      setTotal(meta?.total || list.length)
      setRows(list)
    } catch (e) {
      setRows([])
      setError(e.message || 'Failed to load mandals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAllDistricts() }, [])
  useEffect(() => { if (districtId) fetchMandalsByDistrict(districtId); else { setRows([]); setError('') } }, [districtId, page, pageSize])

  const normalizedQuery = (query || '').trim().toLowerCase()
  const displayRows = normalizedQuery
    ? rows.filter(m => String(m?.name || '').toLowerCase().includes(normalizedQuery))
    : rows

  async function deleteMandal(m) {
    if (!m?.id) return
    if (typeof window !== 'undefined') {
      const ok = window.confirm(`Delete mandal ${m.name || ''}?`)
      if (!ok) return
    }
    setDeletingId(m.id)
    setError('')
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/mandals/${m.id}`, {
        method: 'DELETE',
        headers: { 'accept': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) {
        const txt = await res.text().catch(()=> '')
        throw new Error(`Delete failed: ${res.status}${txt?` - ${txt}`:''}`)
      }
      if (districtId) await fetchMandalsByDistrict(districtId)
    } catch (e) {
      setError(e.message || 'Failed to delete mandal')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mandals</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">District</label>
          <DistrictComboBox
            loading={loadingDistricts}
            districts={districts}
            value={districtId}
            onChange={setDistrictId}
          />
          <input
            className="px-2 py-2 text-sm border rounded bg-white w-56"
            placeholder="Search mandals"
            value={query}
            onChange={e=>setQuery(e.target.value)}
            disabled={!districtId}
          />
          <button onClick={()=> districtId && fetchMandalsByDistrict(districtId)} className="px-3 py-2 text-sm rounded border hover:bg-gray-50" disabled={!districtId}>Refresh</button>
          <button onClick={()=>setOpenCreate(true)} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark">Add Mandal</button>
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
              {!districtId && (
                <tr><td className="px-4 py-6 text-gray-500" colSpan={5}>Select a district to view mandals</td></tr>
              )}
              {districtId && loading && (
                <tr>
                  <td className="px-4 py-6" colSpan={5}>
                    <Loader size={72} label="Loading mandals..." />
                  </td>
                </tr>
              )}
              {districtId && error && !loading && (
                <tr><td className="px-4 py-4 text-red-600" colSpan={5}>{error}</td></tr>
              )}
              {districtId && !loading && !error && displayRows.length === 0 && (
                <tr><td className="px-4 py-6 text-gray-500 text-center" colSpan={5}>{normalizedQuery ? 'No matching mandals' : 'No mandals in this district'}</td></tr>
              )}
              {districtId && !loading && !error && displayRows.map((m) => (
                <tr key={m.id || m.name} className="border-t">
                  <td className="px-4 py-2 font-medium text-gray-800">{m.name || '-'}</td>
                  <td className="px-4 py-2">{m.isDeleted ? 'Deleted' : 'Active'}</td>
                  <td className="px-4 py-2">{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2">{m.updatedAt ? new Date(m.updatedAt).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={()=>setEditing(m)}>Edit</button>
                      <button
                        className="px-2 py-1 text-xs rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                        disabled={deletingId===m.id}
                        onClick={()=>deleteMandal(m)}
                      >{deletingId===m.id? 'Deleting...' : 'Delete'}</button>
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
          {districtId ? (
            <>Showing page {page} of {totalPages} {total ? `(total ${total})` : ''}</>
          ) : (
            <span>Select a district to view pages</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 rounded border" disabled={!districtId || page<=1 || loading} onClick={()=> setPage(p => Math.max(1, p-1))}>Prev</button>
          <button className="px-2 py-1 rounded border" disabled={!districtId || page>=totalPages || loading} onClick={()=> setPage(p => Math.min(totalPages, p+1))}>Next</button>
          <select className="ml-2 px-2 py-1 border rounded bg-white" value={pageSize} onChange={e=>setPageSize(Number(e.target.value))} disabled={!districtId || loading}>
            {[10,20,50].map(s => (<option key={s} value={s}>{s}/page</option>))}
          </select>
        </div>
      </div>

      {openCreate && (
        <CreateMandalModal
          districtId={districtId}
          districts={districts}
          onClose={()=>setOpenCreate(false)}
          onCreated={()=>{ setOpenCreate(false); if (districtId) fetchMandalsByDistrict(districtId) }}
        />
      )}
      {editing && (
        <EditMandalModal
          mandal={editing}
          onClose={()=>setEditing(null)}
          onSaved={()=>{ setEditing(null); if (districtId) fetchMandalsByDistrict(districtId) }}
        />
      )}
      {openBulk && (
        <BulkUploadMandalsModal
          districtId={districtId}
          onClose={()=>setOpenBulk(false)}
          onUploaded={()=>{ setOpenBulk(false); if (districtId) fetchMandalsByDistrict(districtId) }}
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

  useEffect(() => {
    if (!open) setQ('')
  }, [open])

  return (
    <div className="relative w-72">
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen(o => !o)}
        className={`w-full px-3 py-2 text-sm border rounded bg-white flex items-center justify-between ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <span className="truncate text-left">{selected ? selected.name : 'Select district'}</span>
        <svg className={`w-4 h-4 ml-2 ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded shadow-lg">
          <div className="p-2 border-b">
            <input
              autoFocus
              className="w-full px-2 py-2 text-sm border rounded bg-white"
              placeholder="Search districts"
              value={q}
              onChange={e=>setQ(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${value === '' ? 'bg-brand/10 text-brand' : ''}`}
            >
              Select district
            </button>
            {list.map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => { onChange(d.id); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${value === d.id ? 'bg-brand/10 text-brand' : ''}`}
              >
                {d.name}
              </button>
            ))}
            {list.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No districts</div>
            )}
          </div>
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  )
}

function CreateMandalModal({ districtId, districts = [], onClose, onCreated }) {
  const [name, setName] = useState('')
  const [selectedDistrictId, setSelectedDistrictId] = useState(districtId || (districts[0]?.id || ''))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isAssemblyConstituency, setIsAssemblyConstituency] = useState(false)

  useEffect(() => {
    setSelectedDistrictId(districtId || (districts[0]?.id || ''))
  }, [districtId, districts])

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Name is required'); return }
    if (!selectedDistrictId) { setError('District is required'); return }
    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = { name: name.trim(), districtId: selectedDistrictId, isAssemblyConstituency }
      const res = await fetch(`${base}/api/v1/mandals`, {
        method: 'POST',
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(()=>null)
      if (!res.ok) { const msg = (json && (json.message || json.error)) || `Create failed: ${res.status}`; throw new Error(msg) }
      if (onCreated) onCreated(json?.data || null)
      onClose()
      setName('')
      setIsAssemblyConstituency(false)
    } catch (e) { setError(e.message || 'Failed to create mandal') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">Add Mandal</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Name</label>
            <input className="mt-1 w-full border rounded p-2" value={name} onChange={e=>setName(e.target.value)} placeholder="New Mandal" required />
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
          <div className="flex items-center gap-2">
            <input id="isAssemblyConstituency" type="checkbox" className="h-4 w-4" checked={isAssemblyConstituency} onChange={e=>setIsAssemblyConstituency(e.target.checked)} />
            <label htmlFor="isAssemblyConstituency" className="text-sm text-gray-700">Is Assembly Constituency</label>
          </div>
          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
          <div className="pt-2 flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving? 'Creating...' : 'Create Mandal'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditMandalModal({ mandal, onClose, onSaved }) {
  const [name, setName] = useState(mandal?.name || '')
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
      // API expects raw JSON string body representing name
      const res = await fetch(`${base}/api/v1/mandals/${mandal.id}`, {
        method: 'PUT',
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(name.trim())
      })
      const json = await res.json().catch(()=>null)
      if (!res.ok) { const msg = (json && (json.message || json.error)) || `Update failed: ${res.status}`; throw new Error(msg) }
      if (onSaved) onSaved(json?.data || null)
      onClose()
    } catch (e) { setError(e.message || 'Failed to update mandal') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">Edit Mandal</div>
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


function BulkUploadMandalsModal({ districtId, onClose, onUploaded }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const sampleCsv = `name,districtId,isAssemblyConstituency\nMandal One,REPLACE_DISTRICT_ID,true\nMandal Two,REPLACE_DISTRICT_ID,false\n\nname,districtName,isAssemblyConstituency\nMandal Three,Hyderabad,yes\nMandal Four,Warangal,no`

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
      const res = await fetch(`${base}/api/v1/mandals/bulk-upload`, {
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
      a.download = 'mandals-sample.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">Bulk Upload Mandals</div>
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
              <li><strong>districtId</strong> OR <strong>districtName</strong>: one required</li>
              <li><strong>isAssemblyConstituency</strong>: optional (true/false/1/yes)</li>
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
