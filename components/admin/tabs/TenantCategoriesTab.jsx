/**
 * TenantCategoriesTab - Manage tenant-specific category settings
 */
import { useState, useEffect, useContext } from 'react'
import { getToken } from '../../../utils/auth'

// Use local proxy to avoid CORS
function getApiBase() {
  if (typeof window !== 'undefined') return '/api/proxy'
  return (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.kaburlumedia.com').replace(/\/$/, '') + '/api/v1'
}

export default function TenantCategoriesTab({ tenantContext }) {
  const { tenant, categories, refreshCategories } = tenantContext
  const [languages, setLanguages] = useState([])
  const [allCategories, setAllCategories] = useState([])
  const [selectedLang, setSelectedLang] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedSlugs, setSelectedSlugs] = useState(new Set())

  useEffect(() => {
    loadLanguages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (categories && categories.length > 0) {
      // Map categories to slugs
      setSelectedSlugs(new Set(categories.map(c => c.slug || c.categorySlug)))
    }
  }, [categories])

  const loadLanguages = async () => {
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

  const loadCategories = async () => {
    if (!selectedLang) return
    setLoading(true)
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/categories?languageCode=${selectedLang}`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAllCategories(Array.isArray(data) ? data : (data?.data || []))
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedLang) loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLang])

  const toggleCategory = (slug) => {
    const newSet = new Set(selectedSlugs)
    if (newSet.has(slug)) {
      newSet.delete(slug)
    } else {
      newSet.add(slug)
    }
    setSelectedSlugs(newSet)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/tenants/${tenant.id}/categories`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify({ categorySlugs: Array.from(selectedSlugs) })
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      refreshCategories()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
          <p className="text-sm text-slate-500">Select categories to display on this tenant</p>
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
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Current selections summary */}
      <div className="p-4 bg-slate-50 rounded-lg border">
        <div className="text-sm text-slate-600">
          <strong>{selectedSlugs.size}</strong> categories selected
        </div>
      </div>

      {/* Category grid */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-brand rounded-full animate-spin mx-auto" />
          </div>
        ) : allCategories.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No categories for this language</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
            {allCategories.map((cat) => {
              const isSelected = selectedSlugs.has(cat.slug)
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.slug)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-brand/10 border-brand ring-1 ring-brand'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      isSelected ? 'bg-brand border-brand' : 'border-slate-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {cat.translatedName || cat.translation?.name || cat.name}
                    </span>
                  </div>
                  {cat.slug && (
                    <div className="text-xs text-slate-500 mt-1 ml-6">{cat.slug}</div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
