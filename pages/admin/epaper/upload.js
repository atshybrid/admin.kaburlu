import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import SuperAdminLayout from '../../../components/admin/SuperAdminLayout'
import FullScreenLoader from '../../../components/FullScreenLoader'
import { logout } from '../../../utils/auth'
import { useLayout } from '../../../components/admin/LayoutContext'
import { Upload, Calendar, FileText, Newspaper, Check, AlertCircle, Zap } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'

// Format file size for display
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Target size for compression (2MB)
const TARGET_SIZE_MB = 2
const TARGET_SIZE_BYTES = TARGET_SIZE_MB * 1024 * 1024

// Advanced PDF compression with image optimization
async function compressPdf(file, onProgress) {
  try {
    onProgress?.('Reading PDF...')
    const arrayBuffer = await file.arrayBuffer()
    const originalSize = arrayBuffer.byteLength

    // If file is already under target size, just do light optimization
    if (originalSize <= TARGET_SIZE_BYTES) {
      onProgress?.('PDF is already optimized size, applying light compression...')
      return await lightCompression(file, arrayBuffer, originalSize, onProgress)
    }

    // For larger files, use advanced compression with image re-rendering
    onProgress?.('Large PDF detected, applying advanced compression...')
    return await advancedCompression(file, arrayBuffer, originalSize, onProgress)
  } catch (err) {
    console.warn('PDF compression failed, using original:', err)
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      savedPercent: 0,
      wasCompressed: false,
      error: err.message,
    }
  }
}

// Light compression for small files - structural optimization only
async function lightCompression(file, arrayBuffer, originalSize, onProgress) {
  try {
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      updateMetadata: false,
    })

    onProgress?.('Optimizing PDF structure...')
    const pages = pdfDoc.getPages()
    
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 100,
    })

    const compressedSize = compressedBytes.byteLength
    const savedPercent = ((originalSize - compressedSize) / originalSize * 100).toFixed(1)

    if (compressedSize < originalSize) {
      const compressedFile = new File([compressedBytes], file.name, { type: 'application/pdf' })
      return {
        file: compressedFile,
        originalSize,
        compressedSize,
        savedPercent: parseFloat(savedPercent),
        wasCompressed: true,
        pageCount: pages.length,
        compressionType: 'light',
      }
    }
    
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savedPercent: 0,
      wasCompressed: false,
      pageCount: pages.length,
      compressionType: 'none',
    }
  } catch (err) {
    throw err
  }
}

// Advanced compression - renders pages as images and rebuilds PDF
async function advancedCompression(file, arrayBuffer, originalSize, onProgress) {
  try {
    // Dynamically import pdfjs-dist (only when needed)
    onProgress?.('Loading PDF renderer...')
    const pdfjsLib = await import('pdfjs-dist')
    
    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

    // Load PDF with pdf.js
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdfDocument = await loadingTask.promise
    const pageCount = pdfDocument.numPages

    // Calculate optimal quality based on file size and page count
    // Target: ~2MB total, so per-page budget varies
    const perPageBudget = TARGET_SIZE_BYTES / pageCount
    
    // Start with high quality and adjust if needed
    let quality = 0.85 // 85% JPEG quality - good balance
    let scale = 1.5 // Render at 1.5x for clarity
    
    // For very large files or many pages, be more aggressive
    if (originalSize > 20 * 1024 * 1024 || pageCount > 20) {
      quality = 0.75
      scale = 1.2
    } else if (originalSize > 10 * 1024 * 1024 || pageCount > 10) {
      quality = 0.80
      scale = 1.3
    }

    onProgress?.(`Compressing ${pageCount} pages...`)

    // Create new PDF document
    const newPdfDoc = await PDFDocument.create()
    
    // Process each page
    for (let i = 1; i <= pageCount; i++) {
      onProgress?.(`Processing page ${i} of ${pageCount}...`)
      
      const page = await pdfDocument.getPage(i)
      const viewport = page.getViewport({ scale })
      
      // Create canvas for rendering
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Render page to canvas
      await page.render({
        canvasContext: ctx,
        viewport: viewport,
      }).promise
      
      // Convert to JPEG with specified quality
      const jpegDataUrl = canvas.toDataURL('image/jpeg', quality)
      const jpegBytes = Uint8Array.from(atob(jpegDataUrl.split(',')[1]), c => c.charCodeAt(0))
      
      // Embed image in new PDF
      const jpegImage = await newPdfDoc.embedJpg(jpegBytes)
      
      // Add page with same dimensions as original
      const originalViewport = page.getViewport({ scale: 1 })
      const newPage = newPdfDoc.addPage([originalViewport.width, originalViewport.height])
      
      // Draw image to fill page
      newPage.drawImage(jpegImage, {
        x: 0,
        y: 0,
        width: originalViewport.width,
        height: originalViewport.height,
      })
      
      // Clean up
      canvas.remove()
    }

    onProgress?.('Finalizing compressed PDF...')
    
    // Save with optimization
    const compressedBytes = await newPdfDoc.save({
      useObjectStreams: true,
    })
    
    const compressedSize = compressedBytes.byteLength
    const savedPercent = ((originalSize - compressedSize) / originalSize * 100).toFixed(1)

    console.log(`Advanced PDF Compression: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (${savedPercent}% saved)`)

    // Only use compressed if significantly smaller
    if (compressedSize < originalSize * 0.9) {
      const compressedFile = new File([compressedBytes], file.name, { type: 'application/pdf' })
      return {
        file: compressedFile,
        originalSize,
        compressedSize,
        savedPercent: parseFloat(savedPercent),
        wasCompressed: true,
        pageCount,
        compressionType: 'advanced',
        quality: Math.round(quality * 100),
      }
    }
    
    // If compression didn't help much, return original
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savedPercent: 0,
      wasCompressed: false,
      pageCount,
      compressionType: 'skipped',
    }
  } catch (err) {
    console.warn('Advanced compression failed, falling back to light:', err)
    // Fallback to light compression
    return await lightCompression(file, arrayBuffer, originalSize, onProgress)
  }
}

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
  const [compressionInfo, setCompressionInfo] = useState(null)

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
    setBusyMessage('Preparing upload...')
    setError('')
    setResult(null)
    setIssuePreview(null)
    setCompressionInfo(null)

    try {
      if (!file) throw new Error('Please choose a PDF file')
      if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) throw new Error('issueDate must be YYYY-MM-DD')

      // Validate tenant selection for SUPER_ADMIN/DESK_EDITOR
      if (canOverrideTenant && !tenantId) {
        throw new Error('Please select a newspaper before uploading')
      }

      if (targetKind === 'edition' && !editionId) throw new Error('Please select an edition')
      if (targetKind === 'subEdition' && !subEditionId) throw new Error('Please select a sub-edition')

      // Step 1: Compress PDF (without quality loss)
      setBusyMessage('Compressing PDF...')
      const compressionResult = await compressPdf(file, (msg) => setBusyMessage(msg))
      setCompressionInfo(compressionResult)
      
      const fileToUpload = compressionResult.file
      console.log('Compression result:', {
        originalSize: formatFileSize(compressionResult.originalSize),
        compressedSize: formatFileSize(compressionResult.compressedSize),
        savedPercent: compressionResult.savedPercent,
        wasCompressed: compressionResult.wasCompressed,
        pageCount: compressionResult.pageCount,
      })

      console.log('Upload payload:', {
        issueDate,
        tenantId,
        editionId,
        subEditionId,
        targetKind,
        fileName: fileToUpload.name,
        fileSize: formatFileSize(fileToUpload.size),
      })

      // Step 2: Get upload config (backend URL + token) to bypass Vercel's 4.5MB limit
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

      // Step 3: Upload directly to backend (bypasses Vercel serverless function limit)
      setBusyMessage('Uploading PDF...')
      const form = new FormData()
      form.append('file', fileToUpload)
      form.append('kind', 'pdf')
      form.append('folder', 'epaper/pdfs')

      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: form,
      })

      if (uploadRes.status === 401) {
        logout()
        router.replace('/')
        throw new Error('Unauthorized')
      }

      const uploadText = await uploadRes.text()
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

      // Step 5: fetch issue details (pages preview) - optional, don't fail if this errors
      setBusyMessage('Loading preview...')
      try {
        const preview = await fetchIssuePreview(issueDate, editionId, subEditionId)
        if (preview) setIssuePreview(preview)
      } catch (previewErr) {
        console.warn('Could not fetch preview:', previewErr)
        // Don't throw - upload was successful
      }
    } catch (e2) {
      setError(e2?.message || String(e2))
    } finally {
      setBusy(false)
      setBusyMessage('Uploading PDF...')
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
                {busy ? 'Uploading…' : 'Upload & Publish Issue'}
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

              {/* Compression Info */}
              {compressionInfo && (
                <div className="bg-purple-50 rounded-xl p-4 mb-4 border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-900">PDF Optimization</span>
                    {compressionInfo.compressionType === 'advanced' && (
                      <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">Advanced</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-purple-600">Original:</span>
                      <span className="ml-1 font-medium text-purple-900">{formatFileSize(compressionInfo.originalSize)}</span>
                    </div>
                    <div>
                      <span className="text-purple-600">Optimized:</span>
                      <span className="ml-1 font-medium text-purple-900">{formatFileSize(compressionInfo.compressedSize)}</span>
                    </div>
                    {compressionInfo.wasCompressed && compressionInfo.savedPercent > 0 && (
                      <div>
                        <span className="text-purple-600">Saved:</span>
                        <span className="ml-1 font-medium text-green-600">{compressionInfo.savedPercent}%</span>
                      </div>
                    )}
                    {compressionInfo.pageCount && (
                      <div>
                        <span className="text-purple-600">Pages:</span>
                        <span className="ml-1 font-medium text-purple-900">{compressionInfo.pageCount}</span>
                      </div>
                    )}
                  </div>
                  {compressionInfo.quality && (
                    <div className="mt-2 text-xs text-purple-600">
                      Image quality: {compressionInfo.quality}% (optimized for fast loading)
                    </div>
                  )}
                </div>
              )}

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
