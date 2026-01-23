import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { toast } from '../../../components/ui/Toast.jsx'
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx'
import DatePicker from '../../../components/epaper/DatePicker'
import EditionCard from '../../../components/epaper/EditionCard'
import { logout } from '../../../utils/auth'
import { useLayout } from '../../../components/dashboard/DashboardLayout'

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

function EPaperManageContent() {
  const router = useRouter()
  const { user } = useLayout()
  const roleStr = normalizeRole(user)
  const canOverrideTenant = parseOverrideRoles().includes(roleStr)

  const [tenantId, setTenantId] = useState('')
  const [tenants, setTenants] = useState([])
  const [issueDate, setIssueDate] = useState(todayYmd())
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [loadingIssueId, setLoadingIssueId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [issueToDelete, setIssueToDelete] = useState(null)

  const fetchTextOrRedirect = useCallback(async (url, init) => {
    const res = await fetch(url, init)
    if (res.status === 401) {
      logout()
      router.replace('/')
      throw new Error('Unauthorized')
    }
    const text = await res.text()
    if (!res.ok) throw new Error(text || `Request failed: ${res.status}`)
    return text
  }, [router])

  const loadTenants = useCallback(async () => {
    if (!canOverrideTenant) return
    try {
      const text = await fetchTextOrRedirect('/api/admin/proxy/tenants?full=true')
      const data = JSON.parse(text)
      const items = Array.isArray(data) ? data : (data?.data || data?.items || [])
      const list = Array.isArray(items) ? items : []
      setTenants(list)
      if (!tenantId && list[0]?.id) setTenantId(list[0].id)
    } catch (err) {
      console.error('Failed to load tenants:', err)
    }
  }, [canOverrideTenant, tenantId, fetchTextOrRedirect])

  const loadIssues = useCallback(async () => {
    if (!issueDate) return
    
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const params = new URLSearchParams({ issueDate })
      if (canOverrideTenant && tenantId) {
        params.set('tenantId', tenantId)
      }

      const text = await fetchTextOrRedirect(`/api/admin/epaper/pdf-issues?${params.toString()}`)
      const data = JSON.parse(text)
      const items = data?.items || data?.data?.items || data?.data || []
      setIssues(Array.isArray(items) ? items : [])
    } catch (err) {
      setError(err?.message || 'Failed to load issues')
      setIssues([])
    } finally {
      setLoading(false)
    }
  }, [issueDate, tenantId, canOverrideTenant, fetchTextOrRedirect])

  useEffect(() => {
    loadTenants()
  }, [loadTenants])

  useEffect(() => {
    loadIssues()
  }, [loadIssues])

  const handlePublish = async (issue) => {
    setActionLoading(true)
    setLoadingIssueId(issue.id)
    setError('')
    setSuccess('')
    
    try {
      const params = new URLSearchParams()
      if (canOverrideTenant && tenantId) {
        params.set('tenantId', tenantId)
      }

      const body = {
        issueId: issue.id,
        publishedAt: new Date().toISOString()
      }

      const res = await fetch(`/api/admin/epaper/publish-issue?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.status === 401) {
        logout()
        router.replace('/')
        return
      }

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to publish')
      }

      setSuccess(`${issue.edition?.name || 'Edition'} published successfully!`)
      toast.success('Issue published')
      loadIssues()
    } catch (err) {
      const msg = err?.message || 'Failed to publish issue'
      setError(msg)
      toast.error(msg)
    } finally {
      setActionLoading(false)
      setLoadingIssueId(null)
    }
  }

  const handleUnpublish = async (issue) => {
    setActionLoading(true)
    setLoadingIssueId(issue.id)
    setError('')
    setSuccess('')
    
    try {
      const params = new URLSearchParams()
      if (canOverrideTenant && tenantId) {
        params.set('tenantId', tenantId)
      }

      const body = {
        issueId: issue.id,
        publishedAt: null
      }

      const res = await fetch(`/api/admin/epaper/publish-issue?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.status === 401) {
        logout()
        router.replace('/')
        return
      }

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to unpublish')
      }

      setSuccess(`${issue.edition?.name || 'Edition'} unpublished successfully!`)
      toast.success('Issue unpublished')
      loadIssues()
    } catch (err) {
      const msg = err?.message || 'Failed to unpublish issue'
      setError(msg)
      toast.error(msg)
    } finally {
      setActionLoading(false)
      setLoadingIssueId(null)
    }
  }

  const handleDelete = (issue) => {
    setIssueToDelete(issue)
    setDeleteOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">ePaper Management</h1>
              <p className="text-gray-600">Manage and publish your daily editions</p>
            </div>
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

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            {/* Tenant Selector (SUPER_ADMIN only) */}
            {canOverrideTenant && tenants.length > 0 && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant
                </label>
                <select
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || t.id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Picker */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Date
              </label>
              <DatePicker value={issueDate} onChange={setIssueDate} />
            </div>
          </div>
        </div>

        {/* Alerts */}
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
            <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
              ×
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading editions...</p>
            </div>
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
              No editions uploaded for {new Date(issueDate).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
            <button
              onClick={() => router.push('/admin/epaper/upload')}
              className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Upload Edition
            </button>
          </div>
        )}

        {/* Editions Grid */}
        {!loading && issues.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {issues.length} {issues.length === 1 ? 'Edition' : 'Editions'} Found
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {issues.map((issue) => (
                <EditionCard
                  key={issue.id}
                  issue={issue}
                  onPublish={handlePublish}
                  onUnpublish={handleUnpublish}
                  onDelete={handleDelete}
                  loading={actionLoading}
                  loadingIssueId={loadingIssueId}
                  userRole={roleStr}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setIssueToDelete(null) }}
        onConfirm={async () => {
          if (!issueToDelete) return
          setActionLoading(true)
          setLoadingIssueId(issueToDelete.id)
          setError('')
          setSuccess('')
          try {
            const params = new URLSearchParams()
            if (canOverrideTenant && tenantId) {
              params.set('tenantId', tenantId)
            }
            const res = await fetch(`/api/admin/epaper/issues/${issueToDelete.id}${params.toString() ? `?${params.toString()}` : ''}`, {
              method: 'DELETE'
            })
            if (res.status === 401) {
              logout()
              router.replace('/')
              return
            }
            if (!res.ok) {
              const text = await res.text()
              throw new Error(text || 'Failed to delete')
            }
            setSuccess(`${issueToDelete.edition?.name || 'Edition'} deleted successfully!`)
            toast.success('Issue deleted')
            setDeleteOpen(false)
            setIssueToDelete(null)
            loadIssues()
          } catch (err) {
            const msg = err?.message || 'Failed to delete issue'
            setError(msg)
            toast.error(msg)
          } finally {
            setActionLoading(false)
            setLoadingIssueId(null)
          }
        }}
        title="Delete ePaper issue"
        message={`This action cannot be undone. Proceed to delete ${issueToDelete?.edition?.name || 'this edition'}?`}
        confirmText={actionLoading ? 'Deleting…' : 'Delete'}
        cancelText="Cancel"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  )
}

export default function EPaperManagePage() {
  return (
    <DashboardLayout>
      <EPaperManageContent />
    </DashboardLayout>
  )
}
