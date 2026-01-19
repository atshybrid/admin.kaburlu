import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import SuperAdminLayout from '../../../components/admin/SuperAdminLayout'
import { logout } from '../../../utils/auth'
import { useLayout } from '../../../components/admin/LayoutContext'
import { Calendar, FileText, Eye, Download, Newspaper, RefreshCw } from 'lucide-react'
import Image from 'next/image'

function todayYmd() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function EPaperEditionsContent() {
  const router = useRouter()
  const { user } = useLayout()

  const [issueDate, setIssueDate] = useState(todayYmd())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [issues, setIssues] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 })

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

        {/* Issues Grid */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {issues.map((issue) => (
                <div key={issue.id} className="bg-white rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all overflow-hidden group">
                  {/* Cover Image */}
                  <div className="relative aspect-[3/4] bg-slate-100">
                    {issue.coverImageUrl ? (
                      <Image
                        src={issue.coverImageUrl}
                        alt={`${issue.tenant?.name} - ${issue.edition?.name}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-16 h-16 text-slate-300" />
                      </div>
                    )}
                    {/* Page count badge */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/70 text-white text-xs font-bold rounded-full">
                      {issue.pageCount || 0} pages
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-4 space-y-3">
                    {/* Newspaper name */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {issue.tenant?.name?.charAt(0) || 'N'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{issue.tenant?.name || 'Unknown'}</h3>
                        <p className="text-xs text-slate-500 truncate">{issue.tenant?.slug}</p>
                      </div>
                    </div>
                    
                    {/* Edition info */}
                    <div className="text-sm text-slate-700">
                      <span className="font-medium">{issue.edition?.name || 'Main Edition'}</span>
                      {issue.subEdition && (
                        <span className="text-slate-500"> / {issue.subEdition.name}</span>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      {issue.pdfUrl && (
                        <>
                          <a
                            href={issue.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
                          >
                            <Eye className="w-4 h-4" />
                            View PDF
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
