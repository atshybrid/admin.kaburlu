import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import SuperAdminLayout from '../../../components/admin/SuperAdminLayout'
import DatePicker from '../../../components/epaper/DatePicker'
import { getToken, logout } from '../../../utils/auth'
import { toast } from '../../../components/ui/Toast.jsx'
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx'
import { Trash } from 'lucide-react'

function todayYmd() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function EPaperIndex() {
  const router = useRouter()
  const [issueDate, setIssueDate] = useState(todayYmd())
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 50
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [issueToDelete, setIssueToDelete] = useState(null)
  const [highlightIssueId, setHighlightIssueId] = useState(null)
  const [shareBannerIssue, setShareBannerIssue] = useState(null)

  const loadIssues = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const token = getToken()
      if (!token) {
        logout()
        router.push('/')
        return
      }

      const res = await fetch(
        `/api/admin/proxy/epaper/issues/all-by-date?issueDate=${issueDate}&includePages=true&page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (res.status === 401) {
        logout()
        router.push('/')
        return
      }

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || `Failed to load issues: ${res.status}`)
      }

      const data = await res.json()
      setIssues(data.issues || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err) {
      console.error('Error loading issues:', err)
      setError(err.message || 'Failed to load issues')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initialize date/highlight from query params if present
    const qDate = router.query?.date
    const qHighlight = router.query?.highlight
    if (typeof qDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(qDate)) {
      setIssueDate(qDate)
    }
    if (typeof qHighlight === 'string') {
      setHighlightIssueId(qHighlight)
    }
    loadIssues()
  }, [issueDate, page])

  // When issues load, resolve the highlighted issue and show a share/copy banner
  useEffect(() => {
    if (!highlightIssueId || !Array.isArray(issues) || issues.length === 0) {
      setShareBannerIssue(null)
      return
    }
    const found = issues.find((i) => String(i.id) === String(highlightIssueId))
    setShareBannerIssue(found || null)
  }, [issues, highlightIssueId])

  const handleDeleteClick = (issue) => {
    setIssueToDelete(issue)
    setDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!issueToDelete) return
    setDeleteLoading(true)
    setError('')
    setSuccess('')
    try {
      const params = new URLSearchParams()
      if (issueToDelete?.tenant?.id) params.set('tenantId', issueToDelete.tenant.id)
      const url = `/api/admin/epaper/issues/${issueToDelete.id}${params.toString() ? `?${params.toString()}` : ''}`
      const res = await fetch(url, { method: 'DELETE' })
      if (res.status === 401) {
        logout()
        router.push('/')
        return
      }
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || 'Failed to delete issue')
      }
      setSuccess('Issue deleted successfully')
      toast.success('Issue deleted successfully')
      setDeleteOpen(false)
      setIssueToDelete(null)
      await loadIssues()
    } catch (err) {
      const msg = err?.message || 'Failed to delete issue'
      setError(msg)
      toast.error(msg)
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <SuperAdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">ePaper Management</h1>
                <p className="text-gray-600">View and manage all ePaper editions</p>
              </div>
              <button
                onClick={() => router.push('/admin/epaper/upload')}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors shadow-md"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Epaper
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Date
                </label>
                <DatePicker
                  value={issueDate}
                  onChange={(date) => {
                    setIssueDate(date)
                    setPage(1)
                  }}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={loadIssues}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
            <div className="font-semibold">ePaper rules</div>
            <ul className="mt-1 list-disc list-inside">
              <li>Only one issue per tenant + date + edition/sub-edition.</li>
              <li>To replace, delete the old issue then upload new PDF.</li>
              <li>Max PDF size is 100MB; large files are uploaded directly to storage.</li>
            </ul>
          </div>

          {/* Share banner (after successful upload) */}
          {shareBannerIssue && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-sm text-green-800">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-semibold">Issue published</div>
                  <p className="mt-1">Share or copy the link for {shareBannerIssue.edition?.name || 'Edition'} on {formatDate(shareBannerIssue.issueDate || issueDate)}.</p>
                  {(() => {
                    const shareUrl = shareBannerIssue.canonicalUrl || shareBannerIssue.pdfUrl
                    if (!shareUrl) return null
                    return (
                      <div className="mt-2">
                        <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="text-green-700 underline break-all">
                          {shareUrl}
                        </a>
                      </div>
                    )
                  })()}
                  {(() => {
                    const previewImg = shareBannerIssue.ogImage || shareBannerIssue.coverImageUrl
                    if (!previewImg) return null
                    return (
                      <div className="mt-3">
                        <img src={previewImg} alt="Share preview" className="max-h-24 rounded border border-green-200" />
                      </div>
                    )
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const shareUrl = shareBannerIssue.canonicalUrl || shareBannerIssue.pdfUrl
                    if (!shareUrl) return null
                    return (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shareUrl).then(() => toast.success('Copied link')).catch(() => toast.error('Copy failed'))
                        }}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                      >
                        Copy Link
                      </button>
                    )
                  })()}
                  <button
                    onClick={() => setShareBannerIssue(null)}
                    className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                ×
              </button>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-900">Success</h3>
                <p className="text-sm text-green-700 mt-1">{success}</p>
              </div>
              <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800">×</button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading editions...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && issues.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No editions found</h3>
              <p className="text-gray-600 mb-6">
                No editions uploaded for {formatDate(issueDate)}
              </p>
              <button
                onClick={() => router.push('/admin/epaper/upload')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload First Edition
              </button>
            </div>
          )}

          {/* Table */}
          {!loading && issues.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Tenant
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Edition
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Sub Edition
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Pages
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {issues.map((issue) => (
                      <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {issue.tenant?.name || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {issue.tenant?.slug || ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {issue.edition?.name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {issue.edition?.slug || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {issue.subEdition?.name || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900">
                              {issue.pageCount || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(issue.createdAt)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTime(issue.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {issue.pdfUrl && (
                              <a
                                href={issue.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View PDF
                              </a>
                            )}
                            {issue.coverImageUrl && (
                              <a
                                href={issue.coverImageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg font-medium hover:bg-purple-100 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Cover
                              </a>
                            )}
                            {/* Copy canonical or PDF link */}
                            { (issue.canonicalUrl || issue.pdfUrl) && (
                              <button
                                onClick={() => {
                                  const shareUrl = issue.canonicalUrl || issue.pdfUrl
                                  navigator.clipboard.writeText(shareUrl).then(() => toast.success('Copied link')).catch(() => toast.error('Copy failed'))
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8m-6 8h6a2 2 0 002-2V8a2 2 0 00-2-2h-3.5L12 4H8a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Copy Link
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteClick(issue)}
                              disabled={deleteLoading && issueToDelete?.id === issue.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                                deleteLoading && issueToDelete?.id === issue.id
                                  ? 'bg-red-100 text-red-400 cursor-not-allowed'
                                  : 'bg-red-50 text-red-600 hover:bg-red-100'
                              }`}
                              title="Delete issue"
                            >
                              {deleteLoading && issueToDelete?.id === issue.id ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              ) : (
                                <Trash className="w-4 h-4" />
                              )}
                              {deleteLoading && issueToDelete?.id === issue.id ? 'Deleting…' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <ConfirmDialog
          isOpen={deleteOpen}
          onClose={() => { setDeleteOpen(false); setIssueToDelete(null) }}
          onConfirm={confirmDelete}
          title="Delete ePaper issue"
          message={`This will permanently remove the issue for ${issueToDelete ? new Date(issueToDelete.createdAt).toLocaleDateString('en-US') : ''}. PDF file and generated images may also be cleaned up. Proceed?`}
          confirmText={deleteLoading ? 'Deleting…' : 'Delete'}
          cancelText="Cancel"
          variant="danger"
          loading={deleteLoading}
        />
      </div>
    </SuperAdminLayout>
  )
}
