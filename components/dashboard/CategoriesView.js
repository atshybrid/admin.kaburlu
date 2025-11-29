import { useEffect, useMemo, useState } from 'react'
import Loader from '../Loader'
import { getToken } from '../../utils/auth'

export default function CategoriesView() {
  const [languages, setLanguages] = useState([])
  const [languageId, setLanguageId] = useState('')
  const [loadingLangs, setLoadingLangs] = useState(true)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openCreate, setOpenCreate] = useState(false)
  const [editing, setEditing] = useState(null)
  const [translatingId, setTranslatingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function loadLanguages() {
      setLoadingLangs(true)
      try {
        const t = getToken()
        const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
        const res = await fetch(`${base}/api/v1/languages`, { headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` } })
        const json = await res.json()
        const list = Array.isArray(json) ? json : (json?.data || [])
        if (!cancelled) {
          setLanguages(list)
          const english = list.find(l => (l.code || '').toLowerCase() === 'en' || (l.name || '').toLowerCase() === 'english')
          setLanguageId(english?.id || list[0]?.id || '')
        }
      } catch {
        if (!cancelled) setLanguages([])
      } finally {
        if (!cancelled) setLoadingLangs(false)
      }
    }
    loadLanguages()
    return () => { cancelled = true }
  }, [])

  const selectedLanguage = useMemo(() => languages.find(l => l.id === languageId), [languages, languageId])

  async function fetchCategories(id) {
    if (!id) return
    setLoading(true); setError('')
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/categories?languageId=${encodeURIComponent(id)}`, { headers: { 'accept': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` } })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const json = await res.json()
      const list = Array.isArray(json) ? json : (json?.data || [])
      setRows(list)
    } catch (e) {
      setError(e.message || 'Failed to load categories')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (languageId) fetchCategories(languageId) }, [languageId])

  async function retranslateCategory(cat) {
    if (!cat?.id) return
    setError('')
    setTranslatingId(cat.id)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/categories/${cat.id}/retranslate`, {
        method: 'POST',
        headers: { 'accept': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) {
        const txt = await res.text().catch(()=> '')
        throw new Error(`Translate failed: ${res.status}${txt?` - ${txt}`:''}`)
      }
      await fetchCategories(languageId)
    } catch (e) {
      setError(e.message || 'Failed to translate category')
    } finally {
      setTranslatingId(null)
    }
  }

  async function deleteCategory(cat) {
    if (!cat?.id) return
    const ok = typeof window !== 'undefined' ? window.confirm(`Delete category ${cat.name || ''}?`) : true
    if (!ok) return
    setError('')
    setDeletingId(cat.id)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/categories/${cat.id}`, {
        method: 'DELETE',
        headers: { 'accept': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) {
        const txt = await res.text().catch(()=> '')
        throw new Error(`Delete failed: ${res.status}${txt?` - ${txt}`:''}`)
      }
      await fetchCategories(languageId)
    } catch (e) {
      setError(e.message || 'Failed to delete category')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Categories</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Language</label>
          <select className="px-2 py-2 text-sm border rounded bg-white" value={languageId} onChange={e=>setLanguageId(e.target.value)} disabled={loadingLangs}>
            {loadingLangs ? (
              <option>Loading...</option>
            ) : (
              languages.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))
            )}
          </select>
          <button className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark" onClick={()=>setOpenCreate(true)} disabled={!languageId}>Add Category</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Slug</th>
                <th className="text-left px-4 py-2">Children</th>
                <th className="text-left px-4 py-2">Created</th>
                <th className="text-left px-4 py-2">Updated</th>
                <th className="text-left px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="px-4 py-6" colSpan={5}><Loader size={72} label={`Loading ${selectedLanguage?.name || ''} categories...`} /></td></tr>
              )}
              {error && !loading && (
                <tr><td className="px-4 py-4 text-red-600" colSpan={5}>{error}</td></tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr><td className="px-4 py-4 text-gray-500" colSpan={5}>No categories found.</td></tr>
              )}
              {!loading && !error && rows.map((c) => (
                <tr key={c.id || c.slug} className="border-t">
                  <td className="px-4 py-2 font-medium text-gray-800">{c.name || '-'}</td>
                  <td className="px-4 py-2">{c.slug || '-'}</td>
                  <td className="px-4 py-2">{Array.isArray(c.children) ? c.children.length : 0}</td>
                  <td className="px-4 py-2">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2">{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={()=>setEditing(c)}>Edit</button>
                      <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50 disabled:opacity-60" disabled={translatingId===c.id} onClick={()=>retranslateCategory(c)}>{translatingId===c.id ? 'Translating...' : 'Translate'}</button>
                      <button className="px-2 py-1 text-xs rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-60" disabled={deletingId===c.id} onClick={()=>deleteCategory(c)}>{deletingId===c.id ? 'Deleting...' : 'Delete'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {openCreate && (
        <CreateCategoryModal
          languageId={languageId}
          categories={rows}
          onClose={()=>setOpenCreate(false)}
          onCreated={()=>{ setOpenCreate(false); fetchCategories(languageId) }}
        />
      )}
      {editing && (
        <EditCategoryModal
          category={editing}
          categories={rows}
          onClose={()=>setEditing(null)}
          onSaved={()=>{ setEditing(null); fetchCategories(languageId) }}
        />
      )}
    </div>
  )
}

function CreateCategoryModal({ languageId, categories, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [parentId, setParentId] = useState('')
  const [iconFile, setIconFile] = useState(null)
  const [iconUrl, setIconUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function uploadIcon() {
    if (!iconFile) return
    setUploading(true); setError('')
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const form = new FormData()
      form.append('file', iconFile)
      form.append('key', (iconFile.name || 'icon'))
      form.append('filename', (iconFile.name || 'icon'))
      form.append('folder', '')
      form.append('kind', 'image')
      const res = await fetch(`${base}/api/v1/media/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${t?.token || ''}` }, body: form })
      const json = await res.json()
      if (!res.ok) { const msg = (json && (json.message || json.error)) || `Upload failed: ${res.status}`; throw new Error(msg) }
      const url = json?.publicUrl || ''
      setIconUrl(url)
    } catch (e) { setError(e.message || 'Failed to upload image') } finally { setUploading(false) }
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = {
        name: name.trim(),
        iconUrl: iconUrl || undefined,
        isActive: Boolean(isActive),
        parentId: parentId || undefined,
        languageId: languageId,
      }
      const res = await fetch(`${base}/api/v1/categories`, {
        method: 'POST',
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(()=>null)
      if (!res.ok) { const msg = (json && (json.message || json.error)) || `Create failed: ${res.status}`; throw new Error(msg) }
      if (onCreated) onCreated(json?.data || null)
      onClose()
      setName(''); setIsActive(true); setParentId(''); setIconFile(null); setIconUrl('')
    } catch (e) { setError(e.message || 'Failed to create category') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">Add Category</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Name</label>
            <input className="mt-1 w-full border rounded p-2" value={name} onChange={e=>setName(e.target.value)} placeholder="Technology" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">Icon Image</label>
            <div className="flex items-center gap-2">
              <input type="file" accept="image/*" onChange={e=>setIconFile(e.target.files?.[0] || null)} />
              <button type="button" className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={uploadIcon} disabled={!iconFile || uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
            </div>
            {iconUrl && <div className="mt-2"><img src={iconUrl} alt="icon" className="w-12 h-12 object-cover rounded border" /></div>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <input id="isActive" type="checkbox" checked={isActive} onChange={e=>setIsActive(e.target.checked)} />
              <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Parent (optional)</label>
              <select className="mt-1 w-full border rounded p-2 bg-white" value={parentId} onChange={e=>setParentId(e.target.value)}>
                <option value="">None</option>
                {Array.isArray(categories) && categories.map(c => (
                  <option key={c.id || c.slug} value={c.id || ''}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
          <div className="pt-2 flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving? 'Creating...' : 'Create Category'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditCategoryModal({ category, categories, onClose, onSaved }) {
  const [name, setName] = useState(category.name || '')
  const [isActive, setIsActive] = useState(category.isActive !== false)
  const [parentId, setParentId] = useState(category.parentId || '')
  const [iconFile, setIconFile] = useState(null)
  const [iconUrl, setIconUrl] = useState(category.iconUrl || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function uploadIcon() {
    if (!iconFile) return
    setUploading(true); setError('')
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const form = new FormData()
      form.append('file', iconFile)
      form.append('key', (iconFile.name || 'icon'))
      form.append('filename', (iconFile.name || 'icon'))
      form.append('folder', '')
      form.append('kind', 'image')
      const res = await fetch(`${base}/api/v1/media/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${t?.token || ''}` }, body: form })
      const json = await res.json()
      if (!res.ok) { const msg = (json && (json.message || json.error)) || `Upload failed: ${res.status}`; throw new Error(msg) }
      const url = json?.publicUrl || ''
      setIconUrl(url)
    } catch (e) { setError(e.message || 'Failed to upload image') } finally { setUploading(false) }
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const payload = {
        name: name.trim(),
        iconUrl: iconUrl || undefined,
        isActive: Boolean(isActive),
        parentId: parentId || undefined,
      }
      const res = await fetch(`${base}/api/v1/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(()=>null)
      if (!res.ok) { const msg = (json && (json.message || json.error)) || `Update failed: ${res.status}`; throw new Error(msg) }
      if (onSaved) onSaved(json?.data || null)
      onClose()
    } catch (e) { setError(e.message || 'Failed to update category') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">Edit Category</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Name</label>
            <input className="mt-1 w-full border rounded p-2" value={name} onChange={e=>setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">Icon Image</label>
            <div className="flex items-center gap-2">
              <input type="file" accept="image/*" onChange={e=>setIconFile(e.target.files?.[0] || null)} />
              <button type="button" className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={uploadIcon} disabled={!iconFile || uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
            </div>
            {iconUrl && <div className="mt-2"><img src={iconUrl} alt="icon" className="w-12 h-12 object-cover rounded border" /></div>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <input id="isActiveEdit" type="checkbox" checked={isActive} onChange={e=>setIsActive(e.target.checked)} />
              <label htmlFor="isActiveEdit" className="text-sm text-gray-700">Active</label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Parent (optional)</label>
              <select className="mt-1 w-full border rounded p-2 bg-white" value={parentId} onChange={e=>setParentId(e.target.value)}>
                <option value="">None</option>
                {Array.isArray(categories) && categories.map(c => (
                  <option key={c.id || c.slug} value={c.id || ''}>{c.name}</option>
                ))}
              </select>
            </div>
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
