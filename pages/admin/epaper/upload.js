import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import SuperAdminLayout from '../../../components/admin/SuperAdminLayout'
import FullScreenLoader from '../../../components/FullScreenLoader'
import { logout } from '../../../utils/auth'
import { useLayout } from '../../../components/admin/SuperAdminLayout'

function todayYmd() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function normalizeRole(user) {
  const role = user?.role || user?.roleName || user?.userRole || user?.role?.name || ''
  const roleName = typeof role === 'string' ? role : (role?.name || '')
  return String(roleName).toUpperCase().replace(/[_\s-]/g, '')
}

function parseOverrideRoles() {
  const raw = process.env.NEXT_PUBLIC_TENANT_OVERRIDE_ROLES || 'SUPER_ADMIN,SUPERADMIN'
  return raw
    .split(',')
    .map((s) => String(s || '').trim().toUpperCase().replace(/[_\s-]/g, ''))
    .filter(Boolean)
}

function EPaperUploadContent() {
  const router = useRouter()
  const { user } = useLayout()
  const roleStr = normalizeRole(user)
  const canOverrideTenant = parseOverrideRoles().includes(roleStr)

  const [tenantId, setTenantId] = useState('')
  const [tenants, setTenants] = useState([])

  const [issueDate, setIssueDate] = useState(todayYmd())
  const [editions, setEditions] = useState([])
  const [targetKind, setTargetKind] = useState('edition')
  const [editionId, setEditionId] = useState('')
  const [subEditionId, setSubEditionId] = useState('')

  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [issuePreview, setIssuePreview] = useState(null)

  const selectedEdition = useMemo(
    () => editions.find((e) => e.id === editionId) || null,
    [editions, editionId]
  )

  async function fetchTextOrRedirect(url, init) {
    const res = await fetch(url, init)
    if (res.status === 401) {
      logout()
      router.replace('/')
      throw new Error('Unauthorized')
    }
    const text = await res.text()
    if (!res.ok) throw new Error(text || `Request failed: ${res.status}`)
    return text
  }

  async function loadTenants() {
    if (!canOverrideTenant) return
    const text = await fetchTextOrRedirect('/api/admin/proxy/api/v1/tenants?full=true')
    const data = JSON.parse(text)
    const items = Array.isArray(data) ? data : (data?.data || data?.items || [])
    const list = Array.isArray(items) ? items : []
    setTenants(list)
    if (!tenantId && list[0]?.id) setTenantId(list[0].id)
  }

  async function loadEditions() {
    setError('')
    const params = new URLSearchParams({ includeSubEditions: 'true' })
    if (canOverrideTenant && tenantId) params.set('tenantId', tenantId)
    const text = await fetchTextOrRedirect(`/api/admin/epaper/publication-editions?${params.toString()}`)
    const data = JSON.parse(text)
    const items = data?.items || data?.data?.items || data?.data || []
    const list = Array.isArray(items) ? items : []
    setEditions(list)
    const hasSelected = !!(editionId && list.some((e) => e.id === editionId))
    if ((!editionId || !hasSelected) && list[0]?.id) {
      setEditionId(list[0].id)
      setSubEditionId('')
    }
  }

  useEffect(() => {
    loadTenants().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadEditions().catch((e) => setError(e?.message || String(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  useEffect(() => {
    // keep target consistent
    if (targetKind === 'edition') setSubEditionId('')
    if (targetKind === 'subEdition') {
      if (selectedEdition?.subEditions?.length && !subEditionId) {
        setSubEditionId(selectedEdition.subEditions[0].id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKind, editionId])

  async function fetchIssuePreview(nextIssueDate, nextEditionId, nextSubEditionId) {
    const params = new URLSearchParams({ issueDate: nextIssueDate })
    if (nextSubEditionId) params.set('subEditionId', nextSubEditionId)
    else params.set('editionId', nextEditionId)
    if (canOverrideTenant && tenantId) params.set('tenantId', tenantId)

    const text = await fetchTextOrRedirect(`/api/admin/epaper/pdf-issues?${params.toString()}`)
    return JSON.parse(text)
  }

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setResult(null)
    setIssuePreview(null)

    try {
      if (!file) throw new Error('Please choose a PDF file')
      if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) throw new Error('issueDate must be YYYY-MM-DD')

      if (targetKind === 'edition' && !editionId) throw new Error('Please select an edition')
      if (targetKind === 'subEdition' && !subEditionId) throw new Error('Please select a sub-edition')

      // Step 1: upload to media (Bunny/CDN) via server proxy
      const form = new FormData()
      form.append('file', file)
      form.append('kind', 'pdf')
      form.append('folder', 'epaper/pdfs')

      const uploadText = await fetchTextOrRedirect('/api/admin/media/upload', { method: 'POST', body: form })
      const uploadData = JSON.parse(uploadText)

      const pdfUrl = uploadData?.publicUrl
      if (!pdfUrl) throw new Error('Upload did not return publicUrl')

      // Step 2: create issue by URL
      const payload = {
        pdfUrl,
        issueDate,
        ...(targetKind === 'subEdition' ? { subEditionId } : { editionId }),
      }

      const createParams = new URLSearchParams()
      if (canOverrideTenant && tenantId) createParams.set('tenantId', tenantId)
      const createUrl = `/api/admin/epaper/pdf-issues/upload-by-url${createParams.toString() ? `?${createParams.toString()}` : ''}`

      const createText = await fetchTextOrRedirect(createUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const created = JSON.parse(createText)
      setResult(created)

      // Step 3: fetch issue details (pages preview)
      const preview = await fetchIssuePreview(issueDate, editionId, subEditionId)
      setIssuePreview(preview)
    } catch (e2) {
      setError(e2?.message || String(e2))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <FullScreenLoader show={busy} message="Publishing PDF..." />
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">ePaper (PDF) — Upload Issue</h1>
          <p className="text-sm text-slate-500">Uploads PDF to Media, then creates/replaces the daily issue by URL.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">{error}</div>
        )}

        <form onSubmit={onSubmit} className="bg-white rounded-xl border p-5 space-y-4">
          {canOverrideTenant && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tenant (override)</label>
              <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name || t.slug || t.id}</option>
                ))}
              </select>
              <div className="mt-1 text-xs text-slate-500">Only allowed for roles: {process.env.NEXT_PUBLIC_TENANT_OVERRIDE_ROLES || 'SUPER_ADMIN'}.</div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Issue date</label>
              <input value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="YYYY-MM-DD" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target</label>
              <select value={targetKind} onChange={(e) => setTargetKind(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="edition">Edition</option>
                <option value="subEdition">Sub-edition</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Edition</label>
              <select value={editionId} onChange={(e) => setEditionId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                {editions.map((ed) => (
                  <option key={ed.id} value={ed.id}>{ed.name}</option>
                ))}
              </select>
            </div>
          </div>

          {targetKind === 'subEdition' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sub-edition</label>
              <select value={subEditionId} onChange={(e) => setSubEditionId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                {(selectedEdition?.subEditions || []).map((se) => (
                  <option key={se.id} value={se.id}>{se.name}</option>
                ))}
              </select>
              {!selectedEdition?.subEditions?.length && (
                <div className="mt-2 text-xs text-slate-500">No sub-editions for this edition.</div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">PDF file</label>
            <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm" />
          </div>

          <div className="flex items-center gap-3">
            <button disabled={busy} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium disabled:opacity-60">
              {busy ? 'Uploading…' : 'Upload & Create Issue'}
            </button>
            <button type="button" onClick={() => loadEditions().catch((e) => setError(e?.message || String(e)))} className="px-4 py-2 rounded-lg border text-sm">
              Refresh editions
            </button>
          </div>
        </form>

        {result?.issue && (
          <div className="mt-6 bg-white rounded-xl border p-5">
            <div className="font-semibold text-slate-900 mb-2">Created issue</div>
            <div className="text-sm text-slate-700">ID: <span className="font-mono">{result.issue.id}</span></div>
            <div className="text-sm text-slate-700">Pages: {result.issue.pageCount ?? '—'}</div>
            {result.issue.coverImageUrl && (
              <div className="mt-3">
                <img src={result.issue.coverImageUrl} alt="cover" className="max-w-xs rounded-lg border" />
              </div>
            )}
          </div>
        )}

        {issuePreview?.issue && (
          <div className="mt-6 bg-white rounded-xl border p-5">
            <div className="font-semibold text-slate-900 mb-2">Preview pages</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(issuePreview.issue.pages || []).slice(0, 12).map((p) => (
                <a key={p.pageNumber} href={p.imageUrl} target="_blank" rel="noreferrer" className="block">
                  <img src={p.imageUrl} alt={`p${p.pageNumber}`} className="w-full rounded-lg border" />
                  <div className="mt-1 text-xs text-slate-500">Page {p.pageNumber}</div>
                </a>
              ))}
            </div>
            {!issuePreview.issue.pages?.length && (
              <div className="text-sm text-slate-500">No pages returned.</div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default function EPaperUploadPage() {
  return (
    <SuperAdminLayout title="ePaper Upload">
      <EPaperUploadContent />
    </SuperAdminLayout>
  )
}
