/**
 * Admin Categories Page
 * /admin/categories route
 */
import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { getToken } from '../../utils/auth'

function getApiBase() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com').replace(/\/$/, '')
}

function CategoriesContent() {
  const [categories, setCategories] = useState([])
  const [languages, setLanguages] = useState([])
  const [selectedLang, setSelectedLang] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', slug: '' })
  const [saving, setSaving] = useState(false)

  // Load languages
  useEffect(() => {
    async function loadLanguages() {
      try {
        const t = getToken()
        const res = await fetch(`${getApiBase()}/api/v1/languages`, {
          headers: { 'Authorization': `Bearer ${t?.token || ''}` }
        })
        if (res.ok) {
          const data = await res.json()
          const list = Array.isArray(data) ? data : (data?.data || [])
          setLanguages(list)
          if (list.length > 0 && !selectedLang) {
            setSelectedLang(list[0].code || list[0].id)
          }
        }
      } catch (e) {
        console.error('Failed to load languages', e)
      }
    }
    loadLanguages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load categories by language
  const fetchCategories = async () => {
    if (!selectedLang) return
    setLoading(true)
    setError('')
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/categories?languageCode=${selectedLang}`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : (data?.data || []))
    } catch (e) {
      setError(e.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    if (selectedLang) fetchCategories() 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLang])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newCat.name.trim()) return
    
    setSaving(true)
    try {
      const t = getToken()
      const slug = newCat.slug.trim() || newCat.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const res = await fetch(`${getApiBase()}/api/v1/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify({
          name: newCat.name.trim(),
          slug,
          languageCode: selectedLang
        })
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      setNewCat({ name: '', slug: '' })
      setShowAdd(false)
      fetchCategories()
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
          <h1 className="text-xl font-bold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500">Manage content categories by language</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedLang}
            onChange={e => setSelectedLang(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            {languages.map(l => (
              <option key={l.id} value={l.code || l.id}>{l.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark"
          >
            Add Category
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex gap-4">
            <input
              placeholder="Category name"
              value={newCat.name}
              onChange={e => setNewCat({...newCat, name: e.target.value})}
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              required
            />
            <input
              placeholder="Slug (optional)"
              value={newCat.slug}
              onChange={e => setNewCat({...newCat, slug: e.target.value})}
              className="w-40 px-3 py-2 border rounded-lg text-sm"
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
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No categories for this language</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Translated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {c.translatedName || c.translation?.name || c.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.slug}</td>
                  <td className="px-4 py-3">
                    {c.translatedName || c.translation?.name ? (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700 border border-green-200">
                        Yes
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-slate-50 text-slate-500 border">
                        No
                      </span>
                    )}
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

export default function AdminCategories() {
  return (
    <DashboardLayout title="Categories">
      <CategoriesContent />
    </DashboardLayout>
  )
}
