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

    // Step 3: register as training sample
    const authToken = getToken()?.token
    const payload = {
      pdfUrl,
      issueDate: item.meta.issueDate,
      layoutStyle: item.meta.layoutStyle,
      columns: Number(item.meta.columns),
      language: item.meta.language,
      fileName: item.file.name,
      ...(tenantId ? { tenantId } : {}),
    }

    const registerRes = await fetch('/api/admin/epaper/training-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(payload),
    })

    if (registerRes.status === 401) { logout(); router.replace('/'); throw new Error('Unauthorized') }
    // 404 / not-yet-implemented → still mark done (PDF is stored, metadata registration pending backend)
    if (!registerRes.ok && registerRes.status !== 404 && registerRes.status !== 501) {
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
