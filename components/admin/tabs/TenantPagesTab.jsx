/**
 * TenantPagesTab - Manage tenant legal pages (Privacy, Terms, etc.)
 * API: 
 *   GET /tenants/:tenantId/pages
 *   GET /tenants/:tenantId/pages/:slug
 *   PUT /tenants/:tenantId/pages/:slug (upsert)
 *   PATCH /tenants/:tenantId/pages/:slug
 *   DELETE /tenants/:tenantId/pages/:slug
 */
import { useState, useEffect, useCallback } from 'react'
import { pagesApi } from '../../../lib/api/tenantApi'

export default function TenantPagesTab({ tenantContext }) {
  const { tenant, refreshTenant } = tenantContext
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPage, setSelectedPage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  
  const [form, setForm] = useState({
    title: '',
    contentHtml: '',
    meta: { keywords: '' },
    published: true
  })

  const defaultPages = [
    { slug: 'privacy-policy', title: 'Privacy Policy', icon: '🔒' },
    { slug: 'terms-of-service', title: 'Terms of Service', icon: '📜' },
    { slug: 'about-us', title: 'About Us', icon: '👥' },
    { slug: 'contact', title: 'Contact', icon: '📧' },
    { slug: 'refund-policy', title: 'Refund Policy', icon: '💰' }
  ]

  const loadPages = useCallback(async () => {
    if (!tenant?.id) return
    setLoading(true)
    try {
      const data = await pagesApi.list(tenant.id)
      setPages(Array.isArray(data) ? data : (data?.data || []))
    } catch (e) {
      console.error('Failed to load pages', e)
      setPages([])
    } finally {
      setLoading(false)
    }
  }, [tenant?.id])

  useEffect(() => {
    loadPages()
  }, [loadPages])

  const handleSelectPage = async (page) => {
    setSelectedPage(page)
    setError('')
    
    // Try to load existing page content
    const existing = pages.find(p => p.slug === page.slug)
    if (existing) {
      // Fetch full content if we have the page
      try {
        const fullPage = await pagesApi.get(tenant.id, page.slug)
        setForm({
          title: fullPage.title || page.title,
          contentHtml: fullPage.contentHtml || '',
          meta: fullPage.meta || { keywords: '' },
          published: fullPage.published !== false
        })
      } catch (e) {
        // Fall back to basic info
        setForm({
          title: existing.title || page.title,
          contentHtml: existing.contentHtml || '',
          meta: existing.meta || { keywords: '' },
          published: existing.published !== false
        })
      }
    } else {
      setForm({
        title: page.title,
        contentHtml: '',
        meta: { keywords: '' },
        published: true
      })
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!selectedPage) return
    
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      await pagesApi.upsert(tenant.id, selectedPage.slug, form)
      setSuccess('Page saved successfully')
      await loadPages()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedPage) return
    if (!confirm(`Are you sure you want to delete "${selectedPage.title}"?`)) return
    
    setSaving(true)
    setError('')
    
    try {
      await pagesApi.delete(tenant.id, selectedPage.slug)
      setSelectedPage(null)
      await loadPages()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const getPageStatus = (slug) => {
    const page = pages.find(p => p.slug === slug)
    if (!page) return 'missing'
    if (!page.contentHtml || page.contentHtml.trim().length < 50) return 'draft'
    return page.published ? 'published' : 'unpublished'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Legal Pages</h2>
        <p className="text-sm text-slate-500">Manage legal and informational pages</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Page List */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
            <h3 className="font-medium text-slate-900">Pages</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-brand rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="divide-y">
              {defaultPages.map((page) => {
                const status = getPageStatus(page.slug)
                return (
                  <button
                    key={page.slug}
                    onClick={() => handleSelectPage(page)}
                    className={`w-full p-3 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                      selectedPage?.slug === page.slug ? 'bg-brand/5' : ''
                    }`}
                  >
                    <span className="text-xl">{page.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-sm">{page.title}</div>
                      <div className="text-xs text-slate-500 truncate">/{page.slug}</div>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      status === 'published' 
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : status === 'draft'
                        ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        : 'bg-slate-50 text-slate-500 border'
                    }`}>
                      {status === 'published' ? 'Published' : status === 'draft' ? 'Draft' : 'Not Set'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {selectedPage ? (
            <form onSubmit={handleSave} className="bg-white rounded-xl border overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedPage.icon}</span>
                  <h3 className="font-medium text-slate-900">{selectedPage.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPage(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => setForm({...form, title: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
                    <input
                      type="text"
                      value={selectedPage?.slug || ''}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50"
                      readOnly
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meta Keywords</label>
                  <input
                    type="text"
                    value={form.meta?.keywords || ''}
                    onChange={e => setForm({...form, meta: { ...form.meta, keywords: e.target.value }})}
                    placeholder="privacy, data protection, terms"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Content (HTML)</label>
                  <textarea
                    value={form.contentHtml}
                    onChange={e => setForm({...form, contentHtml: e.target.value})}
                    rows={15}
                    placeholder="<h1>Page Title</h1><p>Your content here...</p>"
                    className="w-full px-3 py-2 border rounded-lg text-sm font-mono resize-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.published}
                      onChange={e => setForm({...form, published: e.target.checked})}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">Published</span>
                  </label>
                </div>
              </div>
              
              <div className="p-4 border-t bg-slate-50 flex justify-between">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving || !pages.find(p => p.slug === selectedPage?.slug)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPage(null)}
                    className="px-4 py-2 border rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-brand text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Page'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-white rounded-xl border p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-medium text-slate-900 mb-1">Select a page to edit</h3>
              <p className="text-sm text-slate-500">
                Click on a page from the list to start editing its content
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
