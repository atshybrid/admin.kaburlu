import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import SuperAdminLayout from '../../../components/admin/SuperAdminLayout'
import { logout } from '../../../utils/auth'
import { useLayout } from '../../../components/admin/SuperAdminLayout'
import { Calendar, FileText, Eye, Download } from 'lucide-react'

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
  const roleStr = normalizeRole(user)
  const canOverrideTenant = parseOverrideRoles().includes(roleStr)
  
  // Get user's tenant ID if they have one
  const userTenantId = user?.tenantId || user?.tenant?.id || ''

  const [tenantId, setTenantId] = useState('')
  const [tenants, setTenants] = useState([])
  const [tenantsLoading, setTenantsLoading] = useState(false)
  const [issueDate, setIssueDate] = useState(todayYmd())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [issues, setIssues] = useState([])

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
    // If user has a tenantId assigned directly, use it
    if (userTenantId && !canOverrideTenant) {
      setTenantId(userTenantId)
      return
    }
    
    setTenantsLoading(true)
    setError('')
    try {
      // Try user-accessible tenants first, then fall back to full list
      let list = []
      try {
        const text = await fetchTextOrRedirect('/api/admin/proxy/api/v1/users/me/tenants')
        const data = JSON.parse(text)
        const items = Array.isArray(data) ? data : (data?.data || data?.items || data?.tenants || [])
        list = Array.isArray(items) ? items : []
      } catch {
        // Fallback to full tenants list for admins
        const text = await fetchTextOrRedirect('/api/admin/proxy/api/v1/tenants?full=true')
        const data = JSON.parse(text)
        const items = Array.isArray(data) ? data : (data?.data || data?.items || [])
        list = Array.isArray(items) ? items : []
      }
      
      setTenants(list)
      // If user has a tenantId, use it as default, otherwise use first tenant
      if (!tenantId) {
        if (userTenantId && list.some(t => t.id === userTenantId)) {
          setTenantId(userTenantId)
        } else if (list[0]?.id) {
          setTenantId(list[0].id)
        }
      }
    } catch (e) {
      console.error('Failed to load tenants:', e)
      // If user has tenantId in their profile, use that
      if (userTenantId) {
        setTenantId(userTenantId)
        setTenants([{ id: userTenantId, name: user?.tenantName || 'Your Newspaper' }])
      }
    } finally {
      setTenantsLoading(false)
    }
  }

  async function loadIssues() {
    if (!tenantId || !issueDate) {
      setIssues([])
      return
    }

    setBusy(true)
    setError('')
    try {
      const params = new URLSearchParams({
        tenantId,
        issueDate
      })
      const text = await fetchTextOrRedirect(`/api/admin/proxy/api/v1/epaper/pdf-issues?${params.toString()}`)
      const data = JSON.parse(text)
      const items = data?.items || data?.data?.items || data?.data || []
      setIssues(Array.isArray(items) ? items : [])
    } catch (e) {
      setError(e?.message || String(e))
      setIssues([])
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    // Load tenants when user is available
    if (user) {
      loadTenants()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (tenantId && issueDate) {
      loadIssues()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, issueDate])

  const selectedTenant = tenants.find(t => t.id === tenantId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">ePaper Editions</h1>
              <p className="text-slate-600 mt-1">View and manage published ePaper issues by date</p>
            </div>
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

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Filter Options
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tenant Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Newspaper <span className="text-red-500">*</span>
              </label>
              {tenantsLoading ? (
                <div className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading newspapers...
                </div>
              ) : tenants.length > 0 ? (
                <select
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                >
                  <option value="">-- Choose Newspaper --</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || t.slug || t.id}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-4 py-3 border-2 border-amber-200 bg-amber-50 rounded-xl text-sm text-amber-700">
                  No newspapers available. Please contact administrator.
                </div>
              )}
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>
          </div>

          {selectedTenant && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {selectedTenant.name?.charAt(0) || 'N'}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{selectedTenant.name}</p>
                  <p className="text-xs text-slate-600">{selectedTenant.slug}</p>
                </div>
              </div>
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

          {!tenantId ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <FileText className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a Newspaper</h3>
              <p className="text-slate-600">Please select a newspaper from the dropdown above to view its published issues</p>
            </div>
          ) : busy ? (
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
              <p className="text-slate-600">No ePaper issues published for {issueDate}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Cover</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Edition</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Sub-Edition</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Pages</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Issue Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {issues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        {issue.coverImageUrl ? (
                          <img
                            src={issue.coverImageUrl}
                            alt="Cover"
                            className="w-16 h-20 object-cover rounded-lg border-2 border-slate-200 shadow-sm hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-16 h-20 bg-slate-100 rounded-lg border-2 border-slate-200 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{issue.edition?.name || 'N/A'}</div>
                        <div className="text-xs text-slate-500">{issue.edition?.slug || ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        {issue.subEdition ? (
                          <>
                            <div className="font-medium text-slate-800">{issue.subEdition.name}</div>
                            <div className="text-xs text-slate-500">{issue.subEdition.slug}</div>
                          </>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                          {issue.pageCount || 0} pages
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 font-medium">
                          {new Date(issue.issueDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {issue.pdfUrl && (
                            <>
                              <a
                                href={issue.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View
                              </a>
                              <a
                                href={issue.pdfUrl}
                                download
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
