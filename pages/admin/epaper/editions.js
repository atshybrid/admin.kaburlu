import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import SuperAdminLayout from '../../../components/admin/SuperAdminLayout'
import { logout } from '../../../utils/auth'
import { useLayout } from '../../../components/admin/LayoutContext'
import { Calendar, FileText, Eye, Download, Newspaper, RefreshCw, ExternalLink, Copy, Check, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import Image from 'next/image'
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx'
import { toast } from '../../../components/ui/Toast.jsx'

function todayYmd() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Get Chronicle URL for the ePaper issue - use canonicalUrl from API if available
function getChronicleUrl(issue) {
  // Use canonicalUrl from backend if available (preferred)
  if (issue?.canonicalUrl) {
    return issue.canonicalUrl
  }
  
  // Fallback: build URL manually
  // Format date as YYYY-MM-DD (strip time component if present)
  const formatDate = (dateStr) => {
    if (!dateStr) return todayYmd()
    // Handle ISO timestamps like "2026-01-21T00:00:00.000Z"
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0]
    }
    return dateStr
  }
  
  const issueDate = formatDate(issue?.issueDate)
  const editionSlug = issue?.edition?.slug || 'main-edition'
  const subEditionSlug = issue?.subEdition?.slug || ''
  
  // Try to find primary ePaper domain
  const primaryDomain = issue?.tenant?.domains?.find(d => d.isPrimary && d.kind === 'EPAPER') || 
                        issue?.tenant?.domains?.find(d => d.kind === 'EPAPER') ||
                        issue?.tenant?.domains?.find(d => d.isPrimary) ||
                        issue?.tenant?.domains?.[0]
  
  if (primaryDomain?.domain) {
    if (subEditionSlug) {
      return `https://${primaryDomain.domain}/${editionSlug}/${subEditionSlug}/${issueDate}`
    }
    return `https://${primaryDomain.domain}/${editionSlug}/${issueDate}`
  }
  
  // Final fallback using tenant slug
  const tenantSlug = issue?.tenant?.slug || 'unknown'
  if (subEditionSlug) {
    return `https://${tenantSlug}.kaburlumedia.com/${editionSlug}/${subEditionSlug}/${issueDate}`
  }
  return `https://${tenantSlug}.kaburlumedia.com/${editionSlug}/${issueDate}`
}

function EPaperEditionsContent() {
  const router = useRouter()
  const { user } = useLayout()

  const [issueDate, setIssueDate] = useState(todayYmd())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [issues, setIssues] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [expandedIssueId, setExpandedIssueId] = useState(null)
  const [copiedUrl, setCopiedUrl] = useState(null)
  
  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [issueToDelete, setIssueToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

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

  async function loadIssues() {
    if (!issueDate) {
      setIssues([])
      return
    }

    setBusy(true)
    setError('')
    try {
      const params = new URLSearchParams({
        issueDate,
        includePages: 'false',
        page: '1',
        limit: '50'
      })
      const text = await fetchTextOrRedirect(`/api/admin/proxy/epaper/issues/all-by-date?${params.toString()}`)
      const data = JSON.parse(text)
      
      // API returns { success, pagination, issues }
      const items = data?.issues || data?.data?.issues || data?.items || []
      setIssues(Array.isArray(items) ? items : [])
      
      if (data?.pagination) {
        setPagination(data.pagination)
      }
    } catch (e) {
      console.error('Failed to load issues:', e)
      setError(e?.message || String(e))
      setIssues([])
    } finally {
      setBusy(false)
    }
  }

  async function copyToClipboard(text, issueId) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedUrl(issueId)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Delete issue handlers
  function openDeleteConfirm(issue) {
    setIssueToDelete(issue)
    setShowDeleteConfirm(true)
  }

  function closeDeleteConfirm() {
    setShowDeleteConfirm(false)
    setIssueToDelete(null)
  }

  async function handleDeleteIssue() {
    if (!issueToDelete) return
    
    setDeleteLoading(true)
    try {
      const tenantId = issueToDelete.tenant?.id || issueToDelete.tenantId
      const params = new URLSearchParams()
      if (tenantId) params.set('tenantId', tenantId)
      
      const deleteUrl = `/api/admin/epaper/pdf-issues/${issueToDelete.id}${params.toString() ? `?${params.toString()}` : ''}`
      
      const res = await fetch(deleteUrl, { method: 'DELETE' })
      
      if (res.status === 401) {
        logout()
        router.replace('/')
        throw new Error('Unauthorized')
      }
      
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Delete failed: ${res.status}`)
      }
      
      toast.success('Issue deleted successfully')
      closeDeleteConfirm()
      
      // Refresh the list
      await loadIssues()
    } catch (e) {
      const msg = e?.message || String(e)
      toast.error(msg)
      setError(msg)
    } finally {
      setDeleteLoading(false)
    }
  }

  useEffect(() => {
    if (user && issueDate) {
      loadIssues()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, issueDate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">ePaper Editions</h1>
                <p className="text-slate-600 mt-1">View all published ePaper issues across newspapers</p>
              </div>
            </div>
            <button
              onClick={loadIssues}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 text-xl">⚠</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Date Filter */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Issue Date</label>
                <p className="text-xs text-slate-500">Select date to view published editions</p>
              </div>
            </div>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="px-4 py-3 border-2 border-slate-200 rounded-xl text-sm bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none min-w-[200px]"
            />
          </div>
          
          {/* Stats */}
          {!busy && issues.length > 0 && (
            <div className="mt-4 flex items-center gap-4 text-sm text-slate-600 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-medium">
                <Newspaper className="w-4 h-4" />
                {issues.length} {issues.length === 1 ? 'edition' : 'editions'} published
              </span>
              <span className="text-slate-400 hidden md:inline">•</span>
              <span>
                {new Date(issueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          )}
        </div>

        {/* Issues Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-700" />
              Published Issues
              {busy && (
                <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full animate-pulse">
                  Loading...
                </span>
              )}
            </h2>
          </div>

          {busy ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
              <p className="text-slate-600">Loading issues...</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
                <FileText className="w-10 h-10 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Issues Found</h3>
              <p className="text-slate-600">No ePaper issues published for {new Date(issueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {issues.map((issue) => {
                const chronicleUrl = getChronicleUrl(issue)
                const isExpanded = expandedIssueId === issue.id
                
                return (
                  <div key={issue.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Main Row */}
                    <div className="p-4 flex items-center gap-4">
                      {/* Expand/Collapse Toggle */}
                      <button
                        type="button"
                        onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                      
                      {/* Cover Thumbnail */}
                      <div className="relative w-12 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
                        {issue.coverImageUrl ? (
                          <Image
                            src={issue.coverImageUrl}
                            alt={`${issue.tenant?.name} - ${issue.edition?.name}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-5 h-5 text-slate-300" />
                          </div>
                        )}
                      </div>
                      
                      {/* Newspaper & Edition Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-slate-900">{issue.tenant?.name || 'Unknown'}</h4>
                          <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                            {issue.tenant?.slug}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm">
                          <span className="font-medium text-slate-700">{issue.edition?.name || 'Main Edition'}</span>
                          {issue.subEdition && (
                            <>
                              <span className="text-slate-400">/</span>
                              <span className="text-slate-600">{issue.subEdition.name}</span>
                            </>
                          )}
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            {issue.pageCount || 0} pages
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Share PDF Link */}
                        <a
                          href={chronicleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg transition-all border border-emerald-200"
                          title="Open Share PDF Link"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="hidden sm:inline">Share PDF</span>
                        </a>
                        
                        {issue.pdfUrl && (
                          <>
                            <a
                              href={issue.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline">View PDF</span>
                            </a>
                            <a
                              href={issue.pdfUrl}
                              download
                              className="inline-flex items-center justify-center p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </>
                        )}
                        
                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => openDeleteConfirm(issue)}
                          className="inline-flex items-center justify-center p-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition-all border border-red-200"
                          title="Delete Issue"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 ml-[52px] border-t border-slate-100 bg-slate-50/50">
                        <div className="pt-4 space-y-3">
                          {/* Share PDF Link Display */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[100px]">
                              Share PDF Link
                            </span>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <code className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 truncate font-mono">
                                {chronicleUrl}
                              </code>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(chronicleUrl, issue.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                  copiedUrl === issue.id
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {copiedUrl === issue.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                          
                          {/* PDF URL Display */}
                          {issue.pdfUrl && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[100px]">
                                PDF URL
                              </span>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <code className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 truncate font-mono">
                                  {issue.pdfUrl}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(issue.pdfUrl, `${issue.id}-pdf`)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                    copiedUrl === `${issue.id}-pdf`
                                      ? 'bg-green-100 text-green-700 border border-green-200'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  {copiedUrl === `${issue.id}-pdf` ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      Copied!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Additional Info */}
                          <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500">
                            {issue.edition?.slug && (
                              <span>
                                <span className="font-medium text-slate-600">Edition Slug:</span>{' '}
                                <code className="bg-slate-100 px-1.5 py-0.5 rounded">{issue.edition.slug}</code>
                              </span>
                            )}
                            {issue.subEdition?.slug && (
                              <span>
                                <span className="font-medium text-slate-600">Sub-edition Slug:</span>{' '}
                                <code className="bg-slate-100 px-1.5 py-0.5 rounded">{issue.subEdition.slug}</code>
                              </span>
                            )}
                            {issue.issueDate && (
                              <span>
                                <span className="font-medium text-slate-600">Issue Date:</span>{' '}
                                <code className="bg-slate-100 px-1.5 py-0.5 rounded">{issue.issueDate}</code>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteIssue}
        title="Delete ePaper Issue"
        message={
          issueToDelete
            ? `Are you sure you want to delete the issue for "${issueToDelete.tenant?.name || 'Unknown'}" - ${issueToDelete.edition?.name || 'Edition'} (${issueToDelete.issueDate || 'Unknown date'})? This action cannot be undone.`
            : 'Are you sure you want to delete this issue?'
        }
        confirmText="Delete Issue"
        cancelText="Cancel"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  )
}

export default function EPaperEditionsPage() {
  return (
    <SuperAdminLayout title="ePaper Editions">
      <EPaperEditionsContent />
    </SuperAdminLayout>
  )
}
