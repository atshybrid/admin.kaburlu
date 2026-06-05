import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { logout } from '../../../utils/auth'

function generateSlug(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function TenantEditionsTab({ tenantContext }) {
  const router = useRouter()
  const tenantId = tenantContext?.tenant?.id

  const [editions, setEditions] = useState([])
  const [expandedEditionId, setExpandedEditionId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Edition form
  const [showEditionForm, setShowEditionForm] = useState(false)
  const [editingEdition, setEditingEdition] = useState(null)
  const [editionName, setEditionName] = useState('')
  const [editionSlug, setEditionSlug] = useState('')
  const [editionCoverImageUrl, setEditionCoverImageUrl] = useState('')
  const [editionIsActive, setEditionIsActive] = useState(true)
  const [editionSeoTitle, setEditionSeoTitle] = useState('')
  const [editionSeoDescription, setEditionSeoDescription] = useState('')
  const [editionSeoKeywords, setEditionSeoKeywords] = useState('')
  const [editionSlugTouched, setEditionSlugTouched] = useState(false)

  // Sub-edition form
  const [showSubEditionForm, setShowSubEditionForm] = useState(false)
  const [parentEditionId, setParentEditionId] = useState(null)
  const [editingSubEdition, setEditingSubEdition] = useState(null)
  const [subEditionName, setSubEditionName] = useState('')
  const [subEditionSlug, setSubEditionSlug] = useState('')
  const [subEditionDistrictId, setSubEditionDistrictId] = useState('')
  const [subEditionCoverImageUrl, setSubEditionCoverImageUrl] = useState('')
  const [subEditionIsActive, setSubEditionIsActive] = useState(true)
  const [subEditionSeoTitle, setSubEditionSeoTitle] = useState('')
  const [subEditionSeoDescription, setSubEditionSeoDescription] = useState('')
  const [subEditionSeoKeywords, setSubEditionSeoKeywords] = useState('')
  const [subEditionSlugTouched, setSubEditionSlugTouched] = useState(false)

  async function fetchWithAuth(url, options = {}) {
    const res = await fetch(url, options)
    if (res.status === 401) {
      logout()
      router.push('/')
      throw new Error('Unauthorized. Redirecting to login...')
    }
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(txt || `Error ${res.status}`)
    }
    return res
  }

  async function loadEditions() {
    if (!tenantId) return
    setBusy(true)
    setError('')
    try {
      const res = await fetchWithAuth(`/api/admin/proxy/api/v1/epaper/publication-editions?includeSubEditions=true&includeDeleted=false&tenantId=${tenantId}`)
      const data = await res.json()
      setEditions(data.items || [])
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  async function saveEdition() {
    if (!tenantId) return
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        name: editionName,
        slug: editionSlug,
        coverImageUrl: editionCoverImageUrl || null,
        isActive: editionIsActive,
        seoTitle: editionSeoTitle || null,
        seoDescription: editionSeoDescription || null,
        seoKeywords: editionSeoKeywords || null,
      }

      if (editingEdition) {
        // Update
        await fetchWithAuth(`/api/admin/proxy/api/v1/epaper/publication-editions/${editingEdition.id}?tenantId=${tenantId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        setSuccess('Edition updated successfully')
      } else {
        // Create
        await fetchWithAuth(`/api/admin/proxy/api/v1/epaper/publication-editions?tenantId=${tenantId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        setSuccess('Edition created successfully')
      }

      setShowEditionForm(false)
      resetEditionForm()
      await loadEditions()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  async function saveSubEdition() {
    if (!tenantId || !parentEditionId) return
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        name: subEditionName,
        slug: subEditionSlug,
        districtId: subEditionDistrictId || null,
        coverImageUrl: subEditionCoverImageUrl || null,
        isActive: subEditionIsActive,
        seoTitle: subEditionSeoTitle || null,
        seoDescription: subEditionSeoDescription || null,
        seoKeywords: subEditionSeoKeywords || null,
      }

      if (editingSubEdition) {
        // Update
        await fetchWithAuth(`/api/admin/proxy/api/v1/epaper/publication-editions/${parentEditionId}/sub-editions/${editingSubEdition.id}?tenantId=${tenantId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        setSuccess('Sub-edition updated successfully')
      } else {
        // Create
        await fetchWithAuth(`/api/admin/proxy/api/v1/epaper/publication-editions/${parentEditionId}/sub-editions?tenantId=${tenantId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        setSuccess('Sub-edition created successfully')
      }

      setShowSubEditionForm(false)
      resetSubEditionForm()
      await loadEditions()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  function resetEditionForm() {
    setEditingEdition(null)
    setEditionName('')
    setEditionSlug('')
    setEditionCoverImageUrl('')
    setEditionIsActive(true)
    setEditionSeoTitle('')
    setEditionSeoDescription('')
    setEditionSeoKeywords('')
    setEditionSlugTouched(false)
  }

  function resetSubEditionForm() {
    setEditingSubEdition(null)
    setParentEditionId(null)
    setSubEditionName('')
    setSubEditionSlug('')
    setSubEditionDistrictId('')
    setSubEditionCoverImageUrl('')
    setSubEditionIsActive(true)
    setSubEditionSeoTitle('')
    setSubEditionSeoDescription('')
    setSubEditionSeoKeywords('')
    setSubEditionSlugTouched(false)
  }

  function openEditEdition(edition) {
    setEditingEdition(edition)
    setEditionName(edition.name || '')
    setEditionSlug(edition.slug || '')
    setEditionCoverImageUrl(edition.coverImageUrl || '')
    setEditionIsActive(edition.isActive ?? true)
    setEditionSeoTitle(edition.seoTitle || '')
    setEditionSeoDescription(edition.seoDescription || '')
    setEditionSeoKeywords(edition.seoKeywords || '')
    setEditionSlugTouched(true)
    setShowEditionForm(true)
  }

  function openEditSubEdition(edition, subEdition) {
    setParentEditionId(edition.id)
    setEditingSubEdition(subEdition)
    setSubEditionName(subEdition.name || '')
    setSubEditionSlug(subEdition.slug || '')
    setSubEditionDistrictId(subEdition.districtId || '')
    setSubEditionCoverImageUrl(subEdition.coverImageUrl || '')
    setSubEditionIsActive(subEdition.isActive ?? true)
    setSubEditionSeoTitle(subEdition.seoTitle || '')
    setSubEditionSeoDescription(subEdition.seoDescription || '')
    setSubEditionSeoKeywords(subEdition.seoKeywords || '')
    setSubEditionSlugTouched(true)
    setShowSubEditionForm(true)
  }

  function openCreateSubEdition(editionId) {
    resetSubEditionForm()
    setParentEditionId(editionId)
    setShowSubEditionForm(true)
  }

  useEffect(() => {
    loadEditions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">ePaper Editions & Sub-editions</h3>
          <p className="text-sm text-slate-500">Manage publication editions and regional sub-editions</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={loadEditions} disabled={busy} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
            {busy ? '⏳' : '🔄'} Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              resetEditionForm()
              setShowEditionForm(true)
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm"
          >
            + New Edition
          </button>
        </div>
      </div>

      {/* Messages */}
      {success && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">{success}</div>}
      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 whitespace-pre-wrap">{error}</div>}

      {/* Editions List */}
      <div className="space-y-3">
        {editions.length === 0 && !busy && (
          <div className="text-center py-12 bg-slate-50 rounded-lg border">
            <div className="text-slate-400 text-sm">No editions found. Create your first edition to get started.</div>
          </div>
        )}

        {editions.map((edition) => (
          <div key={edition.id} className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  type="button"
                  onClick={() => setExpandedEditionId(expandedEditionId === edition.id ? null : edition.id)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {expandedEditionId === edition.id ? '▼' : '▶'}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900">{edition.name}</h4>
                    <span className="text-xs text-slate-500 font-mono">/{edition.slug}</span>
                    {edition.isActive ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Active</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">Inactive</span>
                    )}
                  </div>
                  {edition.seoTitle && <div className="text-xs text-slate-500 mt-1">{edition.seoTitle}</div>}
                  <div className="text-xs text-slate-400 mt-1">
                    {edition.subEditions?.length || 0} sub-edition(s)
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openCreateSubEdition(edition.id)}
                  className="px-3 py-1.5 rounded border text-xs font-medium hover:bg-slate-50"
                >
                  + Sub-edition
                </button>
                <button
                  type="button"
                  onClick={() => openEditEdition(edition)}
                  className="px-3 py-1.5 rounded border text-xs font-medium hover:bg-blue-50"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Sub-editions */}
            {expandedEditionId === edition.id && (
              <div className="border-t bg-slate-50 p-4">
                {(!edition.subEditions || edition.subEditions.length === 0) && (
                  <div className="text-sm text-slate-500 text-center py-4">No sub-editions yet</div>
                )}
                <div className="space-y-2">
                  {(edition.subEditions || []).map((sub) => (
                    <div key={sub.id} className="bg-white rounded border p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-slate-900">{sub.name}</span>
                          <span className="text-xs text-slate-500 font-mono">/{sub.slug}</span>
                          {sub.isActive ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Active</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">Inactive</span>
                          )}
                        </div>
                        {sub.seoTitle && <div className="text-xs text-slate-500 mt-1">{sub.seoTitle}</div>}
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditSubEdition(edition, sub)}
                        className="px-3 py-1.5 rounded border text-xs font-medium hover:bg-blue-50"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edition Form Modal */}
      {showEditionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingEdition ? 'Edit Edition' : 'New Edition'}</h3>
              <button type="button" onClick={() => setShowEditionForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                  <input
                    value={editionName}
                    onChange={(e) => {
                      const name = e.target.value
                      setEditionName(name)
                      if (!editingEdition && !editionSlugTouched) {
                        setEditionSlug(generateSlug(name))
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Main Edition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Slug *</label>
                  <input
                    value={editionSlug}
                    onChange={(e) => {
                      setEditionSlugTouched(true)
                      setEditionSlug(e.target.value)
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="main-edition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cover Image URL</label>
                <input value={editionCoverImageUrl} onChange={(e) => setEditionCoverImageUrl(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://..." />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={editionIsActive} onChange={(e) => setEditionIsActive(e.target.checked)} className="rounded" />
                  Active
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SEO Title</label>
                <input value={editionSeoTitle} onChange={(e) => setEditionSeoTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Latest Breaking News..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SEO Description</label>
                <textarea value={editionSeoDescription} onChange={(e) => setEditionSeoDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SEO Keywords</label>
                <input value={editionSeoKeywords} onChange={(e) => setEditionSeoKeywords(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="news, politics, business" />
              </div>
            </div>
            <div className="sticky bottom-0 bg-slate-50 border-t px-6 py-4 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setShowEditionForm(false)} className="px-4 py-2 rounded-lg border text-sm font-medium">Cancel</button>
              <button type="button" onClick={saveEdition} disabled={busy || !editionName || !editionSlug} className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {busy ? 'Saving...' : 'Save Edition'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-edition Form Modal */}
      {showSubEditionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingSubEdition ? 'Edit Sub-edition' : 'New Sub-edition'}</h3>
              <button type="button" onClick={() => setShowSubEditionForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                  <input
                    value={subEditionName}
                    onChange={(e) => {
                      const name = e.target.value
                      setSubEditionName(name)
                      if (!editingSubEdition && !subEditionSlugTouched) {
                        setSubEditionSlug(generateSlug(name))
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Telangana"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Slug *</label>
                  <input
                    value={subEditionSlug}
                    onChange={(e) => {
                      setSubEditionSlugTouched(true)
                      setSubEditionSlug(e.target.value)
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="telangana"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">District ID</label>
                <input value={subEditionDistrictId} onChange={(e) => setSubEditionDistrictId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Optional district ID" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cover Image URL</label>
                <input value={subEditionCoverImageUrl} onChange={(e) => setSubEditionCoverImageUrl(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://..." />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={subEditionIsActive} onChange={(e) => setSubEditionIsActive(e.target.checked)} className="rounded" />
                  Active
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SEO Title</label>
                <input value={subEditionSeoTitle} onChange={(e) => setSubEditionSeoTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SEO Description</label>
                <textarea value={subEditionSeoDescription} onChange={(e) => setSubEditionSeoDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SEO Keywords</label>
                <input value={subEditionSeoKeywords} onChange={(e) => setSubEditionSeoKeywords(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="sticky bottom-0 bg-slate-50 border-t px-6 py-4 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setShowSubEditionForm(false)} className="px-4 py-2 rounded-lg border text-sm font-medium">Cancel</button>
              <button type="button" onClick={saveSubEdition} disabled={busy || !subEditionName || !subEditionSlug} className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {busy ? 'Saving...' : 'Save Sub-edition'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
