import { useEffect, useState } from 'react'
import { getToken } from '../../utils/auth'
import Loader from '../Loader'

export default function LanguagesView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [openCreate, setOpenCreate] = useState(false)

  async function fetchLanguages() {
    try {
      setError('')
      setLoading(true)
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/languages`, {
        headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const json = await res.json()
      const list = Array.isArray(json) ? json : (json?.data || [])
      setRows(list)
    } catch (e) {
      setError(e.message || 'Failed to load languages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLanguages() }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Languages</h2>
        <div className="flex items-center gap-2">
          <button onClick={fetchLanguages} className="px-3 py-2 text-sm rounded border hover:bg-gray-50">Refresh</button>
          <button onClick={()=>setOpenCreate(true)} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark">Add Language</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Code</th>
                <th className="text-left px-4 py-2">Native Name</th>
                <th className="text-left px-4 py-2">Direction</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Created</th>
                <th className="text-left px-4 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-4 py-6" colSpan={7}>
                    <Loader size={72} label="Loading languages..." />
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr><td className="px-4 py-4 text-red-600" colSpan={7}>{error}</td></tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr><td className="px-4 py-4 text-gray-500" colSpan={7}>No languages found.</td></tr>
              )}
              {!loading && !error && rows.map((l) => (
                <tr key={l.id || l.code} className="border-t">
                  <td className="px-4 py-2 font-medium text-gray-800">{l.name || '-'}</td>
                  <td className="px-4 py-2">{l.code || '-'}</td>
                  <td className="px-4 py-2">{l.nativeName || '-'}</td>
                  <td className="px-4 py-2">{l.direction || '-'}</td>
                  <td className="px-4 py-2">{l.isDeleted ? 'Deleted' : 'Active'}</td>
                  <td className="px-4 py-2">{l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2">{l.updatedAt ? new Date(l.updatedAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {openCreate && (
        <CreateLanguageModal onClose={()=>setOpenCreate(false)} onCreated={()=>{ setOpenCreate(false); fetchLanguages() }} />
      )}
    </div>
  )
}

function CreateLanguageModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Name is required'); return }
    if (!code.trim()) { setError('Code is required'); return }
    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = { name: name.trim(), code: code.trim() }
      const res = await fetch(`${base}/api/v1/languages`, {
        method: 'POST',
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(()=>null)
      if (!res.ok) { const msg = (json && (json.message || json.error)) || `Create failed: ${res.status}`; throw new Error(msg) }
      if (onCreated) onCreated(json?.data || null)
      onClose()
      setName(''); setCode('')
    } catch (e) { setError(e.message || 'Failed to create language') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">Add Language</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Name</label>
            <input className="mt-1 w-full border rounded p-2" value={name} onChange={e=>setName(e.target.value)} placeholder="English" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">Code</label>
            <input className="mt-1 w-full border rounded p-2" value={code} onChange={e=>setCode(e.target.value)} placeholder="en" required />
          </div>
          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
          <div className="pt-2 flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving? 'Creating...' : 'Create Language'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
