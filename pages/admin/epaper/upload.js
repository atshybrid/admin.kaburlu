import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import SuperAdminLayout from '../../../components/admin/SuperAdminLayout'
import FullScreenLoader from '../../../components/FullScreenLoader'
import { logout } from '../../../utils/auth'
import { useLayout } from '../../../components/admin/LayoutContext'
import { Upload, Calendar, FileText, Newspaper, Check, AlertCircle } from 'lucide-react'
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx'
import { toast } from '../../../components/ui/Toast.jsx'

// Format file size for display
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Max PDF size: 100MB
const MAX_PDF_SIZE_BYTES = 100 * 1024 * 1024

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
  const raw = process.env.NEXT_PUBLIC_TENANT_OVERRIDE_ROLES || 'SUPER_ADMIN,SUPERADMIN,DESK_EDITOR,DESKEDITOR'
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

  // Get user's tenant ID if they have one
  const userTenantId = user?.tenantId || user?.tenant?.id || ''

  const [tenantId, setTenantId] = useState('')
  const [tenants, setTenants] = useState([])
  const [tenantsLoading, setTenantsLoading] = useState(false)

  const [issueDate, setIssueDate] = useState(todayYmd())
  const [editions, setEditions] = useState([])
  const [targetKind, setTargetKind] = useState('edition')
  const [editionId, setEditionId] = useState('')
  const [subEditionId, setSubEditionId] = useState('')

  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [busyMessage, setBusyMessage] = useState('Uploading PDF...')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [issuePreview, setIssuePreview] = useState(null)
  const [existingIssue, setExistingIssue] = useState(null)
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false)
  const [replaceLoading, setReplaceLoading] = useState(false)

  // Cache pending upload params to use after confirm
  const [pendingUpload, setPendingUpload] = useState(null)

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
    setTenantsLoading(true)
    setError('')
    try {
      console.log('Loading tenants...')
      // Load tenants list - API works for DESK_EDITOR role
      const res = await fetch('/api/admin/proxy/tenants?full=true')
      console.log('Tenants API response status:', res.status)
      
      if (res.status === 401) {
        logout()
        router.replace('/')
        throw new Error('Unauthorized')
      }
      
      const text = await res.text()
      console.log('Tenants API raw response:', text.substring(0, 500))
      
      if (!res.ok) {
        throw new Error(text || `Request failed: ${res.status}`)
      }
      
      const data = JSON.parse(text)
      // Response is an array directly
      const list = Array.isArray(data) ? data : (data?.data || data?.items || [])
      console.log('Tenants loaded:', list.length, 'items')
      
      setTenants(list)
      // Set first tenant as default if no tenant selected
      if (!tenantId && list.length > 0) {
        setTenantId(list[0].id)
      }
    } catch (e) {
      console.error('Failed to load tenants:', e)
      setError('Failed to load newspapers: ' + (e?.message || String(e)))
    } finally {
      setTenantsLoading(false)
    }
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
    // Load tenants when user is available
    if (user) {
      loadTenants().catch((e) => {
        console.error('Tenant load error:', e)
        setError(e?.message || String(e))
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (tenantId) {
      loadEditions().catch((e) => setError(e?.message || String(e)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, issueDate])

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
    // Validate date format before making API call
    if (!nextIssueDate || !/^\d{4}-\d{2}-\d{2}$/.test(nextIssueDate)) {
      console.warn('Invalid issueDate for preview:', nextIssueDate)
      return null
    }
    
    const params = new URLSearchParams({ issueDate: nextIssueDate })
    if (nextSubEditionId) params.set('subEditionId', nextSubEditionId)
    else if (nextEditionId) params.set('editionId', nextEditionId)
    if (canOverrideTenant && tenantId) params.set('tenantId', tenantId)

    try {
      const text = await fetchTextOrRedirect(`/api/admin/epaper/pdf-issues?${params.toString()}`)
      return JSON.parse(text)
    } catch (err) {
      console.warn('Failed to fetch issue preview:', err)
      return null
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setBusyMessage('Checking for existing issue...')
    setError('')
    setResult(null)
    setIssuePreview(null)
    setExistingIssue(null)

    try {
      if (!file) throw new Error('Please choose a PDF file')
      if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) throw new Error('issueDate must be YYYY-MM-DD')

      // Validate max size 100MB
      if (file.size > MAX_PDF_SIZE_BYTES) {
        throw new Error(`PDF is too large. Max allowed is 100MB. Selected: ${formatFileSize(file.size)}`)
      }

      // Validate tenant selection for SUPER_ADMIN/DESK_EDITOR
      if (canOverrideTenant && !tenantId) {
        throw new Error('Please select a newspaper before uploading')
      }

      if (targetKind === 'edition' && !editionId) throw new Error('Please select an edition')
      if (targetKind === 'subEdition' && !subEditionId) throw new Error('Please select a sub-edition')
      // Step 1: Check if issue already exists
      const checkParams = new URLSearchParams({ issueDate })
      if (targetKind === 'subEdition') checkParams.set('subEditionId', subEditionId)
      else checkParams.set('editionId', editionId)
      if (canOverrideTenant && tenantId) checkParams.set('tenantId', tenantId)

      const checkText = await fetchTextOrRedirect(`/api/admin/epaper/issues/check-exists?${checkParams.toString()}`)
      const checkData = JSON.parse(checkText)
      if (checkData?.exists && checkData.issue) {
        // Ask user to confirm replace (delete then upload)
        setExistingIssue(checkData.issue)
        setPendingUpload({
          issueDate,
          editionId,
          subEditionId,
          targetKind,
          tenantId,
          file,
        })
        setShowReplaceConfirm(true)
        return
      }

      // No existing issue: proceed with upload
      await performUpload({
        issueDate,
        editionId,
        subEditionId,
        targetKind,
        tenantId,
        file,
      })
    } catch (e2) {
      const msg = e2?.message || String(e2)
      setError(msg)
      toast.error(msg)
    } finally {
      setBusy(false)
      setBusyMessage('Uploading PDF...')
    }
  }

  async function performUpload({ issueDate, editionId, subEditionId, targetKind, tenantId, file }) {
    // Step 2: Get upload config (backend URL + token)
    setBusy(true)
    setBusyMessage('Connecting to server...')
    const configRes = await fetch('/api/admin/media/upload-config')
    if (configRes.status === 401) {
      logout()
      router.replace('/')
      throw new Error('Unauthorized')
    }
    if (!configRes.ok) {
      throw new Error('Failed to get upload configuration')
    }
    const { uploadUrl, token } = await configRes.json()

    // Step 3: Upload directly to backend
    setBusyMessage('Uploading PDF...')
    const form = new FormData()
    form.append('file', file)
    form.append('kind', 'pdf')
    form.append('folder', 'epaper/pdfs')

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: form,
    })

    const uploadText = await uploadRes.text()
    if (uploadRes.status === 401) {
      logout()
      router.replace('/')
      throw new Error('Unauthorized')
    }
    if (uploadRes.status === 413) {
      throw new Error('Upload rejected: file too large (413). Please ensure the PDF is under 100MB or contact admin.')
    }
    if (!uploadRes.ok) {
      throw new Error(uploadText || `Upload failed: ${uploadRes.status}`)
    }

    const uploadData = JSON.parse(uploadText)
    const pdfUrl = uploadData?.publicUrl
    if (!pdfUrl) throw new Error('Upload did not return publicUrl')

    // Step 4: create issue by URL
    setBusyMessage('Creating ePaper issue...')
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
    toast.success('Issue published successfully')

    // Step 5: fetch issue details (pages preview) - optional
    setBusyMessage('Loading preview...')
    try {
      const preview = await fetchIssuePreview(issueDate, editionId, subEditionId)
      if (preview) setIssuePreview(preview)
    } catch (_) {
      // ignore
    }

    // Navigate to the ePaper table and highlight the newly created issue
    try {
      // Try to derive the created issue id from API response or preview
      const createdIssueId = created?.issue?.id || created?.id || created?.data?.id || created?.issueId
      let highlightId = createdIssueId
      if (!highlightId && issuePreview?.issues?.length === 1) {
        highlightId = issuePreview.issues[0].id
      }

      const params = new URLSearchParams()
      params.set('date', issueDate)
      if (highlightId) params.set('highlight', String(highlightId))
      router.push(`/admin/epaper?${params.toString()}`)
    } catch (_) {
      // If navigation fails, stay on the page; user can go manually
    }
  }

  return (
    <>
      <FullScreenLoader show={busy} message={busyMessage} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                <Upload className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Upload ePaper Issue</h1>
                <p className="text-slate-600 mt-1">Upload PDF to publish a new ePaper issue</p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-900">Error</h3>
                  <p className="text-sm text-red-700 mt-1 whitespace-pre-wrap">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Form */}
          <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <div className="font-medium">Upload guidelines</div>
              <ul className="mt-1 list-disc list-inside">
                <li>Max PDF size: 100MB.</li>
                <li>If an issue exists for the selected date + edition, you will be asked to delete it before replacing.</li>
                <li>Uploads go directly to storage for better performance.</li>
              </ul>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Issue Details
            </h2>

            {/* Tenant Selector - Always show for all users */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Newspaper <span className="text-red-500">*</span>
              </label>
              {tenantsLoading ? (
                <div className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading newspapers...
                </div>
              ) : tenants.length > 0 ? (
                <select
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm bg-white hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                >
                  <option value="">-- Select a newspaper --</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.name || t.slug || t.id}</option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-4 py-3 border-2 border-amber-200 bg-amber-50 rounded-xl text-sm text-amber-700">
                  No newspapers available. Please contact administrator.
                </div>
              )}
            </div>

            {/* Date and Target Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm bg-white hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                  placeholder="YYYY-MM-DD"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Newspaper className="w-4 h-4 inline mr-1" />
                  Target Type
                </label>
                <select
                  value={targetKind}
                  onChange={(e) => setTargetKind(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm bg-white hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                >
                  <option value="edition">Edition</option>
                  <option value="subEdition">Sub-edition</option>
                </select>
              </div>
            </div>

            {/* Edition and Sub-Edition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Edition
                </label>
                <select
                  value={editionId}
                  onChange={(e) => setEditionId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm bg-white hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                >
                  {editions.map((ed) => (
                    <option key={ed.id} value={ed.id}>{ed.name}</option>
                  ))}
                </select>
              </div>

              {targetKind === 'subEdition' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Sub-edition
                  </label>
                  <select
                    value={subEditionId}
                    onChange={(e) => setSubEditionId(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm bg-white hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                  >
                    {(selectedEdition?.subEditions || []).map((se) => (
                      <option key={se.id} value={se.id}>{se.name}</option>
                    ))}
                  </select>
                  {!selectedEdition?.subEditions?.length && (
                    <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      No sub-editions available for this edition
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                PDF File
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm bg-slate-50 hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600 file:cursor-pointer"
                />
                {file && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded-lg border border-green-200">
                    <Check className="w-4 h-4" />
                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={busy}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg shadow-purple-200 hover:shadow-xl"
              >
                <Upload className="w-4 h-4" />
                {busy ? 'Processing…' : 'Upload & Publish Issue'}
              </button>
              <button
                type="button"
                onClick={() => loadEditions().catch((e) => setError(e?.message || String(e)))}
                className="px-5 py-3 rounded-xl border-2 border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all"
              >
                Refresh Editions
              </button>
            </div>
          </form>

            {/* Replace Confirm Dialog */}
            <ConfirmDialog
              isOpen={showReplaceConfirm}
              onClose={() => { setShowReplaceConfirm(false); setExistingIssue(null); setPendingUpload(null) }}
              onConfirm={async () => {
                if (!existingIssue || !pendingUpload) return
                setReplaceLoading(true)
                setError('')
                try {
                  const params = new URLSearchParams()
                  if (canOverrideTenant && pendingUpload.tenantId) params.set('tenantId', pendingUpload.tenantId)
                  const delUrl = `/api/admin/epaper/issues/${existingIssue.id}${params.toString() ? `?${params.toString()}` : ''}`
                  await fetchTextOrRedirect(delUrl, { method: 'DELETE' })
                  setShowReplaceConfirm(false)
                  setExistingIssue(null)
                  await performUpload(pendingUpload)
                } catch (e) {
                  const msg = e?.message || String(e)
                  setError(msg)
                  toast.error(msg)
                } finally {
                  setReplaceLoading(false)
                  setPendingUpload(null)
                  setBusy(false)
                }
              }}
              title="Issue already exists"
              message={`An issue for ${issueDate} is already present (pages: ${existingIssue?.pageCount ?? '—'}). Do you want to replace it? This will delete the existing issue before re-uploading.`}
              confirmText={replaceLoading ? 'Replacing…' : 'Delete & Replace'}
              cancelText="Cancel"
              variant="warning"
              loading={replaceLoading}
            />

            {/* Success Result */}
          {result?.issue && (
            <div className="bg-white rounded-2xl shadow-lg border border-green-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Issue Published Successfully!</h3>
                  <p className="text-sm text-slate-600">Your ePaper issue has been uploaded and published</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">Issue ID:</span>
                  <span className="font-mono text-slate-900">{result.issue.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">Pages:</span>
                  <span className="font-semibold text-slate-900">{result.issue.pageCount ?? '—'}</span>
                </div>
              </div>
              {result.issue.coverImageUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Cover Preview:</p>
                  <img
                    src={result.issue.coverImageUrl}
                    alt="cover"
                    className="max-w-xs rounded-xl border-2 border-slate-200 shadow-md"
                  />
                </div>
              )}
            </div>
          )}

          {/* Page Preview */}
          {issuePreview?.issue && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Page Previews
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {(issuePreview.issue.pages || []).slice(0, 12).map((p) => (
                  <a
                    key={p.pageNumber}
                    href={p.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group block"
                  >
                    <div className="relative overflow-hidden rounded-lg border-2 border-slate-200 hover:border-purple-400 transition-all shadow-sm hover:shadow-md">
                      <img
                        src={p.imageUrl}
                        alt={`p${p.pageNumber}`}
                        className="w-full group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="mt-2 text-xs text-center text-slate-600 font-medium">
                      Page {p.pageNumber}
                    </div>
                  </a>
                ))}
              </div>
              {!issuePreview.issue.pages?.length && (
                <div className="text-sm text-slate-500 text-center py-8">No pages returned.</div>
              )}
            </div>
          )}
        </div>
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
