/**
 * ML Training Data Upload — ePaper Layout Learning
 * Upload historical newspaper PDFs to train the auto-layout engine.
 * Separate from regular ePaper issue upload.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import FullScreenLoader from '../../../components/FullScreenLoader'
import { getToken, logout } from '../../../utils/auth'
import { useLayout } from '../../../components/admin/LayoutContext'
import { useRouter } from 'next/router'
import {
  Brain,
  Upload,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ChevronDown,
  Database,
  Layers,
  PlusCircle,
  ExternalLink,
  RefreshCw,
  Eye,
} from 'lucide-react'

const MAX_PDF_BYTES = 100 * 1024 * 1024 // 100 MB

const LAYOUT_STYLES = [
  { value: 'broadsheet', label: 'Broadsheet (Large)' },
  { value: 'tabloid', label: 'Tabloid (Half-size)' },
  { value: 'berliner', label: 'Berliner / Nordic' },
  { value: 'magazine', label: 'Magazine-style' },
  { value: 'other', label: 'Other' },
]

const COLUMN_COUNTS = ['3', '4', '5', '6', '7', '8']

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

function todayYmd() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Single queued file row
function TrainingFileRow({ item, onRemove, onMetaChange, uploading }) {
  return (
    <div className={`rounded-xl border p-4 transition-all ${
      item.status === 'done'
        ? 'border-emerald-200 bg-emerald-50'
        : item.status === 'error'
        ? 'border-red-200 bg-red-50'
        : item.status === 'uploading'
        ? 'border-blue-200 bg-blue-50'
        : 'border-slate-200 bg-white'
    }`}>
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="mt-1 flex-shrink-0">
          {item.status === 'done' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          {item.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
          {item.status === 'uploading' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
          {item.status === 'idle' && <FileText className="w-5 h-5 text-slate-400" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800 truncate">{item.file.name}</p>
            <span className="text-xs text-slate-500 flex-shrink-0">{formatFileSize(item.file.size)}</span>
          </div>

          {item.status === 'error' && (
            <p className="text-xs text-red-600 mt-1">{item.errorMsg}</p>
          )}
          {item.status === 'done' && (
            <p className="text-xs text-emerald-700 mt-1">Uploaded successfully</p>
          )}

          {/* Metadata fields — shown when idle */}
          {item.status === 'idle' && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Issue Date</label>
                <input
                  type="date"
                  value={item.meta.issueDate}
                  onChange={(e) => onMetaChange(item.id, 'issueDate', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-violet-400 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Layout Style</label>
                <select
                  value={item.meta.layoutStyle}
                  onChange={(e) => onMetaChange(item.id, 'layoutStyle', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-violet-400 focus:outline-none bg-white"
                >
                  {LAYOUT_STYLES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Columns</label>
                <select
                  value={item.meta.columns}
                  onChange={(e) => onMetaChange(item.id, 'columns', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-violet-400 focus:outline-none bg-white"
                >
                  {COLUMN_COUNTS.map((c) => (
                    <option key={c} value={c}>{c} columns</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Language</label>
                <input
                  type="text"
                  placeholder="e.g. Telugu"
                  value={item.meta.language}
                  onChange={(e) => onMetaChange(item.id, 'language', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-violet-400 focus:outline-none bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Remove button */}
        {!uploading && item.status !== 'uploading' && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="flex-shrink-0 text-slate-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {item.status === 'uploading' && (
        <div className="mt-3 h-1.5 bg-blue-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

// Drop zone
function DropZone({ onFiles }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type === 'application/pdf')
      if (files.length) onFiles(files)
    },
    [onFiles]
  )

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`rounded-2xl border-2 border-dashed cursor-pointer transition-all p-10 flex flex-col items-center justify-center gap-3 select-none ${
        dragOver
          ? 'border-violet-400 bg-violet-50 scale-[1.01]'
          : 'border-slate-300 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/40'
      }`}
    >
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
        <Upload className="w-7 h-7 text-white" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-700">Drop newspaper PDFs here</p>
        <p className="text-sm text-slate-500 mt-1">or click to browse — multiple files allowed</p>
      </div>
      <span className="text-xs text-slate-400">PDF only · max 100 MB per file</span>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || [])
          if (files.length) onFiles(files)
          e.target.value = ''
        }}
      />
    </div>
  )
}

function TrainingContent() {
  const router = useRouter()
  const { user } = useLayout()

  const [tenants, setTenants] = useState([])
  const [tenantId, setTenantId] = useState('')
  const [tenantsLoading, setTenantsLoading] = useState(false)

  const [queue, setQueue] = useState([]) // { id, file, meta, status, progress, errorMsg }
  const [uploading, setUploading] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [doneCount, setDoneCount] = useState(0)

  // ---- Samples list ----
  const [samples, setSamples] = useState([])
  const [samplesLoading, setSamplesLoading] = useState(false)
  const [samplesError, setSamplesError] = useState('')

  // ---- Tenant load ----
  useEffect(() => {
    if (!user) return
    setTenantsLoading(true)
    fetch('/api/admin/proxy/tenants?full=true')
      .then(async (res) => {
        if (res.status === 401) { logout(); router.replace('/'); return }
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data?.data || data?.items || [])
        setTenants(list)
        if (list[0]?.id) setTenantId(list[0].id)
      })
      .catch(() => {})
      .finally(() => setTenantsLoading(false))
  }, [user, router])

  // ---- Load samples ----
  const loadSamples = useCallback(async () => {
    setSamplesLoading(true)
    setSamplesError('')
    try {
      const authToken = getToken()?.token
      const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL
        ? String(process.env.NEXT_PUBLIC_BACKEND_URL).replace(/\/$/, '')
        : 'https://app.kaburlumedia.com/api/v1'
      const params = new URLSearchParams()
      if (tenantId) params.set('tenantId', tenantId)
      params.set('limit', '50')
      const res = await fetch(`${apiBase}/epaper/ml-training/samples?${params}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      })
      if (res.status === 401) { logout(); router.replace('/'); return }
      if (!res.ok) { setSamplesError(`Failed to load samples (${res.status})`); return }
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data?.data || data?.samples || data?.items || [])
      setSamples(list)
    } catch (err) {
      setSamplesError(err?.message || 'Network error')
    } finally {
      setSamplesLoading(false)
    }
  }, [tenantId, router])

  useEffect(() => {
    if (!user) return
    loadSamples()
  }, [user, tenantId, loadSamples])

  // ---- File add ----
  const addFiles = useCallback((files) => {
    setGlobalError('')
    const toAdd = []
    for (const file of files) {
      if (file.type !== 'application/pdf') continue
      if (file.size > MAX_PDF_BYTES) {
        setGlobalError(`"${file.name}" exceeds 100 MB — skipped`)
        continue
      }
      toAdd.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        meta: {
          issueDate: todayYmd(),
          layoutStyle: 'tabloid',
          columns: '5',
          language: 'Telugu',
        },
        status: 'idle',
        progress: 0,
        errorMsg: '',
      })
    }
    setQueue((prev) => [...prev, ...toAdd])
  }, [])

  const removeItem = useCallback((id) => {
    setQueue((prev) => prev.filter((q) => q.id !== id))
  }, [])

  const updateMeta = useCallback((id, key, value) => {
    setQueue((prev) =>
      prev.map((q) => (q.id === id ? { ...q, meta: { ...q.meta, [key]: value } } : q))
    )
  }, [])

  const updateItemStatus = (id, patch) => {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)))
  }

  // ---- Upload single file ----
  async function uploadOne(item) {
    updateItemStatus(item.id, { status: 'uploading', progress: 5 })

    // Step 1: get upload config
    const configRes = await fetch('/api/admin/media/upload-config')
    if (configRes.status === 401) { logout(); router.replace('/'); throw new Error('Unauthorized') }
    if (!configRes.ok) throw new Error('Failed to get upload config')
    const { uploadUrl, token } = await configRes.json()

    updateItemStatus(item.id, { progress: 20 })

    // Step 2: upload PDF to storage
    const form = new FormData()
    form.append('file', item.file)
    form.append('kind', 'pdf')
    form.append('folder', 'epaper/training')

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (uploadRes.status === 401) { logout(); router.replace('/'); throw new Error('Unauthorized') }
    if (!uploadRes.ok) {
      const txt = await uploadRes.text()
      throw new Error(txt || `Upload failed: ${uploadRes.status}`)
    }
    const uploadData = await uploadRes.json()
    const pdfUrl = uploadData?.publicUrl
    if (!pdfUrl) throw new Error('Upload did not return publicUrl')

    updateItemStatus(item.id, { progress: 70 })

    // Step 3: register as training sample on live backend
    const authToken = getToken()?.token
    const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL
      ? String(process.env.NEXT_PUBLIC_BACKEND_URL).replace(/\/$/, '')
      : 'https://app.kaburlumedia.com/api/v1'
    const payload = {
      pdfUrl,
      issueDate: item.meta.issueDate,
      layoutStyle: item.meta.layoutStyle,
      columns: Number(item.meta.columns),
      language: item.meta.language,
      fileName: item.file.name,
      ...(tenantId ? { tenantId } : {}),
    }

    const registerRes = await fetch(`${apiBase}/epaper/ml-training/samples`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(payload),
    })

    if (registerRes.status === 401) { logout(); router.replace('/'); throw new Error('Unauthorized') }
    if (registerRes.status === 409) throw new Error('This PDF has already been registered as a training sample')
    if (!registerRes.ok) {
      const errTxt = await registerRes.text()
      throw new Error(errTxt || `Registration failed: ${registerRes.status}`)
    }

    updateItemStatus(item.id, { status: 'done', progress: 100 })
  }

  // ---- Upload all ----
  async function startUpload() {
    const pending = queue.filter((q) => q.status === 'idle')
    if (!pending.length) return
    setUploading(true)
    setGlobalError('')
    let done = 0
    for (const item of pending) {
      try {
        await uploadOne(item)
        done++
      } catch (err) {
        updateItemStatus(item.id, { status: 'error', errorMsg: err?.message || String(err) })
      }
    }
    setDoneCount((prev) => prev + done)
    setUploading(false)
  }

  const idleCount = queue.filter((q) => q.status === 'idle').length
  const doneItems = queue.filter((q) => q.status === 'done').length
  const errorItems = queue.filter((q) => q.status === 'error').length

  // Reload samples after a successful upload batch
  const prevDoneCount = useRef(doneCount)
  useEffect(() => {
    if (doneCount > prevDoneCount.current) {
      prevDoneCount.current = doneCount
      loadSamples()
    }
  }, [doneCount, loadSamples])

  return (
    <>
      <FullScreenLoader show={uploading} message="Uploading training data..." />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
        <div className="max-w-4xl mx-auto p-6 space-y-6">

          {/* ── Header ── */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg flex-shrink-0">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900">ML Training Data</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200">
                    Layout AI
                  </span>
                </div>
                <p className="text-slate-500 mt-1 text-sm">
                  Upload historical newspaper PDFs to teach the auto-layout engine. These are stored separately from live ePaper issues.
                </p>
                <div className="mt-3 flex items-center gap-6 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-violet-400" /> Training samples collected</span>
                  <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-purple-400" /> Stored in <code className="font-mono bg-slate-100 px-1 rounded">epaper/training/</code></span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Global error ── */}
          {globalError && (
            <div className="flex items-start gap-3 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{globalError}</p>
              <button onClick={() => setGlobalError('')} className="ml-auto text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Newspaper selector ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-500" /> Newspaper (Tenant)
            </h2>
            {tenantsLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-violet-400" /> Loading...
              </div>
            ) : (
              <div className="relative">
                <select
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-400 focus:outline-none appearance-none bg-white pr-8"
                >
                  <option value="">— All / Unassigned —</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.name || t.id}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          {/* ── Drop zone ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Upload className="w-4 h-4 text-violet-500" /> Add PDFs to Queue
            </h2>
            <DropZone onFiles={addFiles} />
          </div>

          {/* ── Queue ── */}
          {queue.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-violet-500" />
                  Queue
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">{queue.length}</span>
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {doneItems > 0 && <span className="text-emerald-600 font-medium">{doneItems} done</span>}
                  {errorItems > 0 && <span className="text-red-600 font-medium">{errorItems} failed</span>}
                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => setQueue([])}
                      className="text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear all
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {queue.map((item) => (
                  <TrainingFileRow
                    key={item.id}
                    item={item}
                    onRemove={removeItem}
                    onMetaChange={updateMeta}
                    uploading={uploading}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Action bar ── */}
          {queue.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center justify-between gap-4">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{idleCount}</span> file{idleCount !== 1 ? 's' : ''} ready to upload
              </p>
              <button
                type="button"
                disabled={uploading || idleCount === 0}
                onClick={startUpload}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all
                  bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-md
                  hover:from-violet-700 hover:to-purple-800 hover:shadow-lg
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                ) : (
                  <><Brain className="w-4 h-4" /> Upload Training Data</>
                )}
              </button>
            </div>
          )}

          {/* ── Registered Samples ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Eye className="w-4 h-4 text-violet-500" />
                Registered Training Samples
                {samples.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">{samples.length}</span>
                )}
              </h2>
              <button
                type="button"
                onClick={loadSamples}
                disabled={samplesLoading}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${samplesLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {samplesError && (
              <div className="mx-6 my-4 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {samplesError}
              </div>
            )}

            {samplesLoading && !samples.length ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                Loading samples...
              </div>
            ) : !samples.length ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                <Database className="w-8 h-8 text-slate-300" />
                <p className="text-sm">No training samples registered yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wide">
                      <th className="text-left px-4 py-2.5 font-semibold">File</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Issue Date</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Layout</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Cols</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Language</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Registered</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {samples.map((s, idx) => {
                      const fileName = s.fileName || s.pdfUrl?.split('/').pop() || '—'
                      const issueDate = s.issueDate ? new Date(s.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
                      const createdAt = s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
                      return (
                        <tr key={s.id || idx} className="hover:bg-violet-50/40 transition-colors">
                          <td className="px-4 py-2.5">
                            <span className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                              <span className="max-w-[160px] truncate font-medium text-slate-700" title={fileName}>{fileName}</span>
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">{issueDate}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100 capitalize">
                              {s.layoutStyle || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center text-slate-600">{s.columns ?? '—'}</td>
                          <td className="px-4 py-2.5 text-slate-600">{s.language || '—'}</td>
                          <td className="px-4 py-2.5 text-slate-400">{createdAt}</td>
                          <td className="px-4 py-2.5">
                            {s.pdfUrl ? (
                              <a
                                href={s.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 transition-colors"
                                title={s.pdfUrl}
                              >
                                <ExternalLink className="w-3 h-3" />
                                Preview
                              </a>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── What happens next ── */}
          <div className="bg-gradient-to-br from-violet-900 to-purple-900 rounded-2xl p-6 text-white">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-300" /> How Layout AI Training Works
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  step: '01',
                  title: 'Upload PDFs',
                  desc: 'Upload historical newspaper editions with correct metadata (date, layout style, columns).',
                },
                {
                  step: '02',
                  title: 'Feature Extraction',
                  desc: 'Backend parses each PDF to extract article regions, word counts, image positions, and block assignments.',
                },
                {
                  step: '03',
                  title: 'Auto-Layout',
                  desc: 'The trained model predicts block codes and page arrangement for new editions automatically.',
                },
              ].map((s) => (
                <div key={s.step} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-3xl font-black text-violet-300 mb-2">{s.step}</div>
                  <div className="font-semibold text-sm mb-1">{s.title}</div>
                  <div className="text-xs text-violet-200 leading-relaxed">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

export default function EPaperTrainingPage() {
  return (
    <DashboardLayout title="ML Training Data | ePaper">
      <TrainingContent />
    </DashboardLayout>
  )
}
