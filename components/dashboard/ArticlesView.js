import { useEffect, useMemo, useState } from 'react'
import { getToken } from '../../utils/auth'
import Loader from '../Loader'

export default function ArticlesView() {
  const [domains, setDomains] = useState([])
  const [domainsLoading, setDomainsLoading] = useState(true)
  const [domainsError, setDomainsError] = useState('')
  const [domain, setDomain] = useState('')

  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [openCreate, setOpenCreate] = useState(false)
  const [openView, setOpenView] = useState(false)
  const [viewItem, setViewItem] = useState(null)

  // Load domains for selector
  useEffect(() => {
    let cancelled = false
    async function loadDomains() {
      setDomainsError('')
      setDomainsLoading(true)
      try {
        const t = getToken()
        const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
        const res = await fetch(`${base}/api/v1/domains`, {
          headers: { 'accept': '*/*', ...(t?.token ? { 'Authorization': `Bearer ${t.token}` } : {}) }
        })
        if (!res.ok) throw new Error(`Domains failed: ${res.status}`)
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data?.data || [])
        if (!cancelled) {
          setDomains(list)
          // pick first primary domain if available
          const preferred = list.find(d => d.isPrimary)?.domain || list[0]?.domain || ''
          setDomain(prev => prev || preferred)
        }
      } catch (e) {
        if (!cancelled) setDomainsError(e.message || 'Failed to load domains')
      } finally {
        if (!cancelled) setDomainsLoading(false)
      }
    }
    loadDomains()
    return () => { cancelled = true }
  }, [])

  // Load articles whenever domain/page/pageSize changes
  useEffect(() => {
    let cancelled = false
    async function loadArticles() {
      if (!domain) { setItems([]); setTotal(0); return }
      setError('')
      setLoading(true)
      try {
        const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
        const url = new URL(`${base}/api/v1/public/articles`)
        url.searchParams.set('page', String(page))
        url.searchParams.set('pageSize', String(pageSize))
        const res = await fetch(url.toString(), {
          headers: { 'accept': 'application/json', 'X-Tenant-Domain': domain }
        })
        if (!res.ok) throw new Error(`Articles failed: ${res.status}`)
        const json = await res.json()
        const list = Array.isArray(json) ? json : (json?.items || [])
        if (!cancelled) {
          setItems(list)
          setTotal(Number(json?.total || list.length || 0))
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load articles')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadArticles()
    return () => { cancelled = true }
  }, [domain, page, pageSize])

  const totalPages = useMemo(() => {
    if (!pageSize) return 1
    return Math.max(1, Math.ceil((total || 0) / pageSize))
  }, [total, pageSize])

  function resetAndReload(newDomain) {
    setDomain(newDomain)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Articles</div>
          <div className="text-xs text-gray-600">List public articles scoped by tenant domain</div>
        </div>
        <div className="flex items-center gap-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Domain {domainsLoading && <span className="ml-1 text-gray-400">(loading)</span>}</label>
            <select className="mt-1 w-72 max-w-full border rounded p-2 bg-white" value={domain} onChange={e=>resetAndReload(e.target.value)} disabled={domainsLoading || !!domainsError}>
              <option value="">{domainsLoading ? 'Loading domains...' : (domainsError ? 'Failed to load domains' : 'Select a domain')}</option>
              {domains.map(d => <option key={d.id} value={d.domain}>{d.domain}{d.isPrimary ? ' (primary)' : ''}</option>)}
            </select>
            {domainsError && <div className="text-[11px] text-red-600 mt-1">{domainsError}</div>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">Page size</label>
            <select className="mt-1 border rounded p-2 bg-white" value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)||20); setPage(1) }}>
              {[10,20,30,50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark" onClick={() => setOpenCreate(true)}>New Article</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading && (
          <div className="p-8"><Loader size={64} label="Loading articles..." /></div>
        )}
        {error && !loading && (
          <div className="p-4 text-xs text-red-600 bg-red-50 border border-red-100">{error}</div>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-2">Title</th>
                  <th className="text-left px-4 py-2">Type</th>
                  <th className="text-left px-4 py-2">Language</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-left px-4 py-2">Views</th>
                  <th className="text-left px-4 py-2">Created</th>
                  <th className="text-right px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td className="px-4 py-6 text-gray-500" colSpan={7}>No articles found.</td></tr>
                )}
                {items.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-800 line-clamp-2">{a.title || '-'}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
                        {Array.isArray(a.images) && a.images[0] ? (
                          <img src={a.images[0]} alt="thumb" className="h-6 w-10 object-cover rounded border" />
                        ) : null}
                        <span>{a.categories?.[0]?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 uppercase text-[11px]">{a.type || '-'}</td>
                    <td className="px-4 py-2">{a.language?.name || a.language?.code || '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] border ${a.status==='PUBLISHED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>{a.status || '-'}</span>
                    </td>
                    <td className="px-4 py-2">{a.viewCount ?? 0}</td>
                    <td className="px-4 py-2">{new Date(a.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">
                      <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={()=>{ setViewItem(a); setOpenView(true) }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-gray-600">Page {page} of {totalPages} · Total {total}</div>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 text-xs rounded border disabled:opacity-50" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={loading || page<=1}>Prev</button>
          <button className="px-2 py-1 text-xs rounded border disabled:opacity-50" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={loading || page>=totalPages}>Next</button>
        </div>
      </div>

      {openCreate && (
        <NewArticleDrawer onClose={() => setOpenCreate(false)} onCreated={() => { setOpenCreate(false); /* list may not reflect without matching domain */ }} />
      )}
      {openView && viewItem && (
        <ArticleDetailDrawer item={viewItem} domain={domain} onClose={() => { setOpenView(false); setViewItem(null) }} />
      )}
    </div>
  )
}

function NewArticleDrawer({ onClose, onCreated }) {
  const [tenants, setTenants] = useState([])
  const [languages, setLanguages] = useState([])
  const [categories, setCategories] = useState([])
  const [loadingTenants, setLoadingTenants] = useState(true)
  const [loadingLangs, setLoadingLangs] = useState(true)
  const [loadingCats, setLoadingCats] = useState(false)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const [tenantId, setTenantId] = useState('')
  const [languageCode, setLanguageCode] = useState('')
  const [languageId, setLanguageId] = useState('')
  const [categoryIds, setCategoryIds] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contentHtml, setContentHtml] = useState('')
  const [h1, setH1] = useState('')
  const [h2, setH2] = useState('')
  const [h3csv, setH3csv] = useState('')
  const [sections, setSections] = useState([]) // {heading, level, paragraphsCsv}
  const [images, setImages] = useState([])
  const [type, setType] = useState('reporter')
  const [isPublished, setIsPublished] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function loadTenants() {
      try {
        setLoadingTenants(true)
        const t = getToken()
        const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
        const res = await fetch(`${base}/api/v1/tenants`, {
          headers: { 'accept': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` }
        })
        const json = await res.json().catch(()=>[])
        const list = Array.isArray(json) ? json : (json?.data || [])
        if (!cancelled) {
          setTenants(list)
          if (!tenantId && list[0]?.id) setTenantId(list[0].id)
        }
      } finally { if (!cancelled) setLoadingTenants(false) }
    }
    async function loadLangs() {
      try {
        setLoadingLangs(true)
        const t = getToken()
        const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
        const res = await fetch(`${base}/api/v1/languages`, {
          headers: { 'accept': '*/*', 'Authorization': `Bearer ${t?.token || ''}` }
        })
        const json = await res.json().catch(()=>[])
        const list = Array.isArray(json) ? json : (json?.data || [])
        if (!cancelled) {
          setLanguages(list)
          if (!languageCode && list[0]?.code) {
            setLanguageCode(list[0].code)
            setLanguageId(list[0].id)
          }
        }
      } finally { if (!cancelled) setLoadingLangs(false) }
    }
    loadTenants(); loadLangs()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadCategories() {
      if (!languageId) { setCategories([]); return }
      setLoadingCats(true)
      try {
        const t = getToken()
        const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
        const res = await fetch(`${base}/api/v1/categories?languageId=${encodeURIComponent(languageId)}` ,{
          headers: { 'accept': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` }
        })
        const json = await res.json().catch(()=>[])
        const list = Array.isArray(json) ? json : (json?.data || [])
        if (!cancelled) setCategories(list)
      } finally { if (!cancelled) setLoadingCats(false) }
    }
    loadCategories()
    return () => { cancelled = true }
  }, [languageId])

  function toggleCategory(id) {
    setCategoryIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  function updateLanguage(code) {
    setLanguageCode(code)
    const m = (languages || []).find(l => l.code === code)
    setLanguageId(m?.id || '')
    setCategoryIds([])
  }

  function addSection() {
    setSections(s => [...s, { heading: '', level: 2, paragraphsCsv: '' }])
  }
  function updateSection(idx, key, value) {
    setSections(s => s.map((it,i)=> i===idx ? { ...it, [key]: value } : it))
  }
  function removeSection(idx) { setSections(s => s.filter((_,i)=>i!==idx)) }

  async function uploadMedia(file) {
    const t = getToken()
    const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${base}/api/v1/media/upload`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${t?.token || ''}` }, body: fd
    })
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
    const json = await res.json()
    return json.publicUrl || json.url || json.location
  }

  async function handleSave(e) {
    e?.preventDefault?.()
    setMsg('')
    if (!tenantId) return setMsg('Please select tenant')
    if (!languageCode) return setMsg('Please select language')
    if (!title.trim()) return setMsg('Title is required')
    setSaving(true)
    try {
      const payload = {
        tenantId,
        languageCode,
        title: title.trim(),
        content: content?.trim() || undefined,
        images,
        categoryIds,
        type,
        isPublished,
      }
      const h3 = (h3csv || '').split(',').map(s=>s.trim()).filter(Boolean)
      const secs = (sections || []).map(s => ({ heading: (s.heading||'').trim(), level: Number(s.level)||2, paragraphs: (s.paragraphsCsv||'').split('\n').map(p=>p.trim()).filter(Boolean) })).filter(x=>x.heading || x.paragraphs?.length)
      if (h1) payload.h1 = h1
      if (h2) payload.h2 = h2
      if (h3.length) payload.h3 = h3
      if (secs.length) payload.sections = secs
      if (contentHtml?.trim()) payload.contentHtml = contentHtml.trim()

      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const res = await fetch(`${base}/api/v1/articles/tenant`, {
        method: 'POST',
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const txt = await res.text().catch(()=> '')
        throw new Error(`Create failed: ${res.status}${txt?` - ${txt}`:''}`)
      }
      if (onCreated) onCreated()
    } catch (e) {
      setMsg(e.message || 'Failed to create article')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-xl flex flex-col">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">New Article</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-6">
          {msg && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{msg}</div>}
          <section>
            <div className="text-sm font-semibold mb-2">Context</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block">
                <div className="text-[12px] text-gray-600 mb-1">Tenant {loadingTenants && <span className="text-gray-400">(loading)</span>}</div>
                <select className="w-full rounded border px-2 py-1.5 text-sm bg-white" value={tenantId} onChange={e=>setTenantId(e.target.value)} disabled={loadingTenants}>
                  <option value="">{loadingTenants ? 'Loading...' : 'Select tenant'}</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
              <label className="block">
                <div className="text-[12px] text-gray-600 mb-1">Language {loadingLangs && <span className="text-gray-400">(loading)</span>}</div>
                <select className="w-full rounded border px-2 py-1.5 text-sm bg-white" value={languageCode} onChange={e=>updateLanguage(e.target.value)} disabled={loadingLangs}>
                  <option value="">{loadingLangs ? 'Loading...' : 'Select language'}</option>
                  {languages.map(l => <option key={l.id} value={l.code}>{l.name} ({l.code})</option>)}
                </select>
              </label>
              <label className="block">
                <div className="text-[12px] text-gray-600 mb-1">Type</div>
                <select className="w-full rounded border px-2 py-1.5 text-sm bg-white" value={type} onChange={e=>setType(e.target.value)}>
                  <option value="reporter">Reporter</option>
                  <option value="editorial">Editorial</option>
                </select>
              </label>
            </div>
          </section>
          <section>
            <div className="text-sm font-semibold mb-2">Basics</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block sm:col-span-2">
                <div className="text-[12px] text-gray-600 mb-1">Title</div>
                <input className="w-full rounded border px-2 py-1.5 text-sm" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Budget Highlights 2025" required />
              </label>
              <label className="flex items-center gap-2 text-sm select-none">
                <input type="checkbox" checked={isPublished} onChange={e=>setIsPublished(e.target.checked)} /> Publish now
              </label>
            </div>
            <div className="mt-3">
              <div className="text-[12px] text-gray-600 mb-1">Content (plain)</div>
              <textarea rows={5} className="w-full rounded border px-2 py-1.5 text-sm" value={content} onChange={e=>setContent(e.target.value)} placeholder="Key points from the budget..." />
            </div>
          </section>
          <section>
            <div className="text-sm font-semibold mb-2">Images</div>
            <div className="flex items-center gap-2">
              <UrlOrUpload onUploaded={(url)=>setImages(imgs=>[...imgs, url])} />
            </div>
            {images.length>0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {images.map((url,i)=> (
                  <div key={i} className="relative">
                    <img src={url} alt="img" className="h-16 w-24 object-cover rounded border" />
                    <button type="button" className="absolute -top-2 -right-2 bg-white border rounded-full w-6 h-6 flex items-center justify-center" onClick={()=>setImages(imgs=>imgs.filter((_,idx)=>idx!==i))}>
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section>
            <div className="text-sm font-semibold mb-2">Categories {loadingCats && <span className="text-gray-400">(loading)</span>}</div>
            <div className="max-h-40 overflow-auto border rounded">
              {categories.length===0 ? (
                <div className="p-3 text-gray-500 text-sm">{loadingCats ? 'Loading...' : 'No categories found for selected language.'}</div>
              ) : (
                <ul className="divide-y">
                  {categories.map(c => (
                    <li key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={categoryIds.includes(c.id)} onChange={()=>toggleCategory(c.id)} />
                        <span>{c.name || c.translation?.name || c.slug}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
          <section>
            <div className="text-sm font-semibold mb-2">Advanced (optional)</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block"><div className="text-[12px] text-gray-600 mb-1">H1</div><input className="w-full rounded border px-2 py-1.5 text-sm" value={h1} onChange={e=>setH1(e.target.value)} /></label>
              <label className="block"><div className="text-[12px] text-gray-600 mb-1">H2</div><input className="w-full rounded border px-2 py-1.5 text-sm" value={h2} onChange={e=>setH2(e.target.value)} /></label>
              <label className="block"><div className="text-[12px] text-gray-600 mb-1">H3 (comma separated)</div><input className="w-full rounded border px-2 py-1.5 text-sm" value={h3csv} onChange={e=>setH3csv(e.target.value)} placeholder="Direct taxes, Infra" /></label>
            </div>
            <div className="mt-3">
              <div className="text-[12px] text-gray-600 mb-1 flex items-center justify-between">
                <span>Content HTML (rich editor)</span>
                <button type="button" className="px-2 py-1 text-xs rounded border" onClick={()=>setContentHtml('')}>Clear</button>
              </div>
              <RichHtmlEditor value={contentHtml} onChange={setContentHtml} onInsertImage={async () => {
                // Reuse upload helper by prompting for upload or URL
                return new Promise((resolve) => {
                  const fileInput = document.createElement('input')
                  fileInput.type = 'file'
                  fileInput.accept = 'image/*'
                  fileInput.onchange = async (e) => {
                    const f = e.target.files && e.target.files[0]
                    if (f) {
                      try {
                        const t = getToken()
                        const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
                        const fd = new FormData(); fd.append('file', f)
                        const res = await fetch(`${base}/api/v1/media/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${t?.token || ''}` }, body: fd })
                        const json = await res.json();
                        const link = json.publicUrl || json.url || json.location
                        resolve(link)
                      } catch { resolve('') }
                    } else {
                      const u = window.prompt('Image URL')
                      resolve(u || '')
                    }
                  }
                  fileInput.click()
                })
              }} />
              <div className="text-[11px] text-gray-500 mt-1">The HTML produced here is sent as <code>contentHtml</code> in the payload.</div>
            </div>
            <div className="mt-3">
              <div className="text-[12px] text-gray-600 mb-1 flex items-center justify-between">Sections <button type="button" className="px-2 py-1 text-xs rounded border" onClick={addSection}>Add</button></div>
              {sections.length===0 ? (
                <div className="text-sm text-gray-500">No sections added.</div>
              ) : (
                <div className="space-y-3">
                  {sections.map((s,idx)=> (
                    <div key={idx} className="border rounded p-2 grid grid-cols-1 sm:grid-cols-6 gap-2 items-start">
                      <div className="sm:col-span-3">
                        <div className="text-[12px] text-gray-600 mb-1">Heading</div>
                        <input className="w-full rounded border px-2 py-1.5 text-sm" value={s.heading} onChange={e=>updateSection(idx,'heading', e.target.value)} />
                      </div>
                      <div>
                        <div className="text-[12px] text-gray-600 mb-1">Level</div>
                        <select className="w-full rounded border px-2 py-1.5 text-sm bg-white" value={s.level} onChange={e=>updateSection(idx,'level', e.target.value)}>
                          {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-[12px] text-gray-600 mb-1">Paragraphs (one per line)</div>
                        <textarea rows={3} className="w-full rounded border px-2 py-1.5 text-sm" value={s.paragraphsCsv} onChange={e=>updateSection(idx,'paragraphsCsv', e.target.value)} />
                      </div>
                      <div className="flex items-center"><button type="button" className="px-2 py-1 text-xs rounded border" onClick={()=>removeSection(idx)}>Remove</button></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </form>
        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
          <button type="button" className="px-3 py-2 rounded border" onClick={onClose}>Cancel</button>
          <button type="button" className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60" disabled={saving} onClick={handleSave}>{saving ? 'Creating…' : 'Create Article'}</button>
        </div>
      </div>
    </div>
  )
}

function UrlOrUpload({ onUploaded }) {
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)

  async function doUpload(file) {
    setBusy(true)
    try {
      const t = getToken()
      const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${base}/api/v1/media/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${t?.token || ''}` }, body: fd })
      const json = await res.json();
      const link = json.publicUrl || json.url || json.location
      if (onUploaded) onUploaded(link)
    } catch {}
    finally { setBusy(false) }
  }

  return (
    <div className="flex items-center gap-2">
      <input className="w-72 max-w-full rounded border px-2 py-1.5 text-sm" placeholder="https://..." value={url} onChange={e=>setUrl(e.target.value)} />
      <button type="button" className="px-2 py-1.5 text-xs rounded border" onClick={()=>{ if (url) { onUploaded(url); setUrl('') } }}>Add URL</button>
      <button type="button" className="px-2 py-1.5 text-xs rounded border" onClick={() => { const input = document.createElement('input'); input.type='file'; input.accept='image/*'; input.onchange = e=>{ const file=e.target.files?.[0]; if(file) doUpload(file) }; input.click() }}>{busy ? 'Uploading...' : 'Upload'}</button>
    </div>
  )
}

function ArticleDetailDrawer({ item, domain, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setErr(''); setLoading(true)
      try {
        const base = (process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com')
        // Try detail endpoint; fallback to list item if not available
        const res = await fetch(`${base}/api/v1/public/articles/${encodeURIComponent(item?.id)}`, {
          headers: { 'accept': 'application/json', ...(domain ? { 'X-Tenant-Domain': domain } : {}) }
        })
        if (res.ok) {
          const json = await res.json().catch(()=>null)
          if (!cancelled) setDetail(json || null)
        } else {
          if (!cancelled) setDetail(null)
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Failed to load article detail')
      } finally { if (!cancelled) setLoading(false) }
    }
    if (item?.id) load(); else { setDetail(null); setLoading(false) }
    return () => { cancelled = true }
  }, [item?.id, domain])

  function fmtDate(iso){ try{ return new Date(iso).toLocaleString() } catch { return iso || '-' } }
  function sanitizeHTML(html) {
    if (!html) return ''
    return String(html).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi,'')
  }
  const src = detail || item || {}
  const html = src?.contentHtml || src?.contentJson?.contentHtml || ''
  const safeHtml = sanitizeHTML(html)
  const h1 = src?.h1 || src?.contentJson?.h1
  const h2 = src?.h2 || src?.contentJson?.h2
  const h3 = src?.h3 || src?.contentJson?.h3
  const sections = src?.sections || src?.contentJson?.sections || []
  const plain = src?.content || src?.shortNews || src?.longNews || ''
  const images = Array.isArray(src?.images) ? src.images : []
  const categories = Array.isArray(src?.categories) ? src.categories : []

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-xl flex flex-col">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="min-w-0">
            <div className="font-semibold truncate">{src?.title || 'Article'}</div>
            <div className="text-[11px] text-gray-600 truncate">{src?.id} · {src?.language?.name || src?.language?.code || '-'} · {src?.status}</div>
          </div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading && <Loader size={48} label="Loading article…" />}
          {err && !loading && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{err}</div>}
          <section>
            <div className="text-xs text-gray-600">Created</div>
            <div className="text-sm">{fmtDate(src?.createdAt)}</div>
          </section>
          {images.length>0 && (
            <section>
              <div className="text-sm font-semibold mb-2">Images</div>
              <div className="flex flex-wrap gap-2">
                {images.map((url,i)=> (
                  <a key={i} href={url} target="_blank" rel="noreferrer"><img src={url} alt="img" className="h-20 w-32 object-cover rounded border" /></a>
                ))}
              </div>
            </section>
          )}
          {categories.length ? (
            <section>
              <div className="text-sm font-semibold mb-2">Categories</div>
              <div className="flex flex-wrap gap-2">
                {categories.map(c => (
                  <span key={c.id} className="px-2 py-0.5 text-[11px] rounded border bg-gray-50 text-gray-700">{c.name || c.slug}</span>
                ))}
              </div>
            </section>
          ) : null}
          {safeHtml ? (
            <section>
              <div className="text-sm font-semibold mb-2">Content</div>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: safeHtml }} />
            </section>
          ) : (
            <section>
              {(h1 || h2) && (
                <div className="mb-3">
                  {h1 && <h1 className="text-2xl font-bold">{h1}</h1>}
                  {h2 && <h2 className="text-lg text-gray-700">{h2}</h2>}
                </div>
              )}
              {Array.isArray(h3) && h3.length>0 && (
                <ul className="list-disc list-inside text-sm text-gray-700 mb-3">
                  {h3.map((x,i)=>(<li key={i}>{x}</li>))}
                </ul>
              )}
              {Array.isArray(sections) && sections.length>0 && (
                <div className="space-y-4">
                  {sections.map((s,i)=> (
                    <div key={i}>
                      {!!s.heading && <div className="text-lg font-semibold mb-1">{s.heading}</div>}
                      {Array.isArray(s.paragraphs) && s.paragraphs.map((p,j)=> (
                        <p key={j} className="text-sm text-gray-800">{p}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {!h1 && !h2 && !h3 && !sections?.length && (
                plain ? (
                  <div>
                    <div className="text-sm font-semibold mb-2">Content</div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{plain}</p>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No content available.</div>
                )
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function RichHtmlEditor({ value, onChange, onInsertImage }) {
  const [html, setHtml] = useState(value || '')
  const ref = useMemo(() => ({ el: null }), [])

  useEffect(() => { setHtml(value || '') }, [value])

  useEffect(() => {
    if (ref.el && ref.el.innerHTML !== html) {
      ref.el.innerHTML = html || ''
    }
  }, [html, ref])

  function cmd(command, arg) {
    document.execCommand(command, false, arg)
    if (ref.el) onChange?.(ref.el.innerHTML)
  }

  async function insertImage() {
    const url = onInsertImage ? await onInsertImage() : window.prompt('Image URL')
    if (url) cmd('insertImage', url)
  }

  return (
    <div className="border rounded">
      <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
        <button type="button" className="px-2 py-1 text-xs rounded border" onClick={()=>cmd('bold')}>Bold</button>
        <button type="button" className="px-2 py-1 text-xs rounded border" onClick={()=>cmd('italic')}>Italic</button>
        <button type="button" className="px-2 py-1 text-xs rounded border" onClick={()=>cmd('underline')}>Underline</button>
        <span className="mx-1 w-px bg-gray-300" />
        <button type="button" className="px-2 py-1 text-xs rounded border" onClick={()=>cmd('formatBlock','H1')}>H1</button>
        <button type="button" className="px-2 py-1 text-xs rounded border" onClick={()=>cmd('formatBlock','H2')}>H2</button>
        <button type="button" className="px-2 py-1 text-xs rounded border" onClick={()=>cmd('formatBlock','H3')}>H3</button>
        <span className="mx-1 w-px bg-gray-300" />
        <button type="button" className="px-2 py-1 text-xs rounded border" onClick={()=>cmd('insertUnorderedList')}>Bullets</button>
        <button type="button" className="px-2 py-1 text-xs rounded border" onClick={()=>cmd('insertOrderedList')}>Numbered</button>
        <button type="button" className="px-2 py-1 text-xs rounded border" onClick={()=>{ const url = window.prompt('Link URL'); if(url){ cmd('createLink', url) } }}>Link</button>
        <button type="button" className="px-2 py-1 text-xs rounded border" onClick={insertImage}>Image</button>
        <span className="mx-1 w-px bg-gray-300" />
        <button type="button" className="px-2 py-1 text-xs rounded border" onClick={()=>cmd('removeFormat')}>Clear</button>
      </div>
      <div
        ref={(el)=>{ ref.el = el }}
        className="min-h-[160px] p-3 prose max-w-none focus:outline-none"
        contentEditable
        suppressContentEditableWarning
        onInput={(e)=> onChange?.(e.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
