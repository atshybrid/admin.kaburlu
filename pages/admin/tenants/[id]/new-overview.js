/**
 * Modern Tenant Overview Page
 * Clean, card-based layout showing tenant details with PRGI management
 */
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import SuperAdminLayout from '../../../../components/admin/SuperAdminLayout'
import Button from '../../../../components/ui/Button'
import Spinner from '../../../../components/ui/Spinner'
import Badge from '../../../../components/ui/Badge'
import Card from '../../../../components/ui/Card'
import ConfirmDialog from '../../../../components/ui/ConfirmDialog2'
import EntityFormModal from '../../../../components/admin/modals/EntityFormModal'
import { tenantsApi, entityApi } from '../../../../lib/api/tenantApi'
import { prgiApi } from '../../../../lib/api/services/prgiApi'

// Status Badge Component
function StatusBadge({ status }) {
  const variants = {
    'VERIFIED': 'success',
    'ACTIVE': 'success',
    'PENDING': 'warning',
    'REJECTED': 'danger',
    'INACTIVE': 'default',
  }
  return <Badge variant={variants[status] || 'default'}>{status || 'Unknown'}</Badge>
}

// Format date helper
function formatDateTime(dateString) {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  } catch {
    return '—'
  }
}

// Info Row Component
function InfoRow({ label, value, fullWidth = false }) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
      <dd className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
        {value || '—'}
      </dd>
    </div>
  )
}

export default function TenantOverviewPage() {
  const router = useRouter()
  const { id } = router.query
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // PRGI action states
  const [actionLoading, setActionLoading] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  
  // Entity form state
  const [showEntityForm, setShowEntityForm] = useState(false)

  useEffect(() => {
    if (!id) return

    async function fetchTenant() {
      setLoading(true)
      setError('')
      try {
        const data = await tenantsApi.get(id)
        setTenant(data)
      } catch (err) {
        console.error('Failed to fetch tenant:', err)
        setError(err.message || 'Failed to load tenant details')
      } finally {
        setLoading(false)
      }
    }

    fetchTenant()
  }, [id])
  
  // Handle entity create/update success
  const handleEntitySuccess = (updatedEntity) => {
    setTenant(prev => ({ ...prev, entity: updatedEntity }))
  }

  // PRGI Actions
  const handleSubmit = async () => {
    setActionLoading(true)
    try {
      const result = await prgiApi.submit(id)
      setTenant(prev => ({ ...prev, ...result }))
      setShowSubmitDialog(false)
    } catch (err) {
      alert(err.message || 'Failed to submit PRGI')
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerify = async () => {
    setActionLoading(true)
    try {
      const result = await prgiApi.verify(id)
      setTenant(prev => ({ ...prev, ...result }))
      setShowVerifyDialog(false)
    } catch (err) {
      alert(err.message || 'Failed to verify PRGI')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    setActionLoading(true)
    try {
      const result = await prgiApi.reject(id, rejectReason)
      setTenant(prev => ({ ...prev, ...result }))
      setShowRejectDialog(false)
      setRejectReason('')
    } catch (err) {
      alert(err.message || 'Failed to reject PRGI')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-600">Loading tenant...</span>
        </div>
      </SuperAdminLayout>
    )
  }

  if (error) {
    return (
      <SuperAdminLayout>
        <div className="px-6 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Tenant</h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="ghost" onClick={() => router.back()}>
                  Go Back
                </Button>
                <Button variant="primary" onClick={() => router.reload()}>
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SuperAdminLayout>
    )
  }

  if (!tenant) {
    return (
      <SuperAdminLayout>
        <div className="px-6 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gray-600">Tenant not found</p>
            <Button variant="primary" onClick={() => router.push('/admin/tenants')} className="mt-4">
              Back to Tenants
            </Button>
          </div>
        </div>
      </SuperAdminLayout>
    )
  }

  return (
    <SuperAdminLayout>
      <div className="px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/admin/tenants" className="hover:text-blue-600">
              Tenants
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{tenant.name}</span>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
              <p className="text-gray-600 mt-1">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{tenant.slug}</code>
              </p>
            </div>
            <StatusBadge status={tenant.prgiStatus} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow label="Tenant Name" value={tenant.name} />
                  <InfoRow label="Slug" value={tenant.slug} />
                  <InfoRow label="State" value={tenant.state?.name || tenant.stateName} />
                  <InfoRow label="PRGI Number" value={tenant.prgiNumber} />
                  <InfoRow label="PRGI Status" value={
                    <StatusBadge status={tenant.prgiStatus} />
                  } />
                </dl>
              </div>
            </Card>

            {/* PRGI Details Card */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">PRGI Details</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow label="Submitted At" value={formatDateTime(tenant.prgiSubmittedAt)} />
                  <InfoRow label="Verified At" value={formatDateTime(tenant.prgiVerifiedAt)} />
                  <InfoRow label="Rejected At" value={formatDateTime(tenant.prgiRejectedAt)} />
                  {tenant.prgiRejectionReason && (
                    <InfoRow 
                      label="Rejection Reason" 
                      value={tenant.prgiRejectionReason}
                      fullWidth
                    />
                  )}
                </dl>
              </div>
            </Card>

            {/* Timestamps Card */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow label="Created At" value={formatDateTime(tenant.createdAt)} />
                  <InfoRow label="Updated At" value={formatDateTime(tenant.updatedAt)} />
                </dl>
              </div>
            </Card>
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* PRGI Actions Card */}
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">PRGI Actions</h3>
                <div className="space-y-2">
                  {tenant.prgiStatus === 'PENDING' && (
                    <Button 
                      variant="primary" 
                      className="w-full justify-center"
                      size="sm"
                      onClick={() => setShowSubmitDialog(true)}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Submit for Verification
                    </Button>
                  )}
                  
                  {tenant.prgiStatus === 'SUBMITTED' && (
                    <>
                      <Button 
                        variant="primary" 
                        className="w-full justify-center bg-green-600 hover:bg-green-700"
                        size="sm"
                        onClick={() => setShowVerifyDialog(true)}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Approve PRGI
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-center text-red-600 border-red-300 hover:bg-red-50"
                        size="sm"
                        onClick={() => setShowRejectDialog(true)}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Reject PRGI
                      </Button>
                    </>
                  )}
                  
                  {tenant.prgiStatus === 'VERIFIED' && (
                    <div className="text-center py-2">
                      <div className="inline-flex items-center text-green-600 text-sm font-medium">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        PRGI Verified
                      </div>
                    </div>
                  )}
                  
                  {tenant.prgiStatus === 'REJECTED' && (
                    <Button 
                      variant="primary" 
                      className="w-full justify-center"
                      size="sm"
                      onClick={() => setShowSubmitDialog(true)}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Resubmit PRGI
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Tenant
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    size="sm"
                    onClick={() => setShowEntityForm(true)}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {tenant?.entity ? 'Edit Entity' : 'Create Entity'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Tenant ID Card */}
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Tenant ID</h3>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all block">
                  {tenant.id}
                </code>
              </div>
            </Card>

            {/* State Details Card */}
            {tenant.state && (
              <Card>
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">State Details</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs text-gray-500">State Name</dt>
                      <dd className="text-sm text-gray-900 font-medium">{tenant.state.name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">State ID</dt>
                      <dd className="text-xs text-gray-600 break-all font-mono">{tenant.state.id}</dd>
                    </div>
                  </dl>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* PRGI Action Dialogs */}
        
        {/* Submit Dialog */}
        <ConfirmDialog
          isOpen={showSubmitDialog}
          onClose={() => setShowSubmitDialog(false)}
          onConfirm={handleSubmit}
          title="Submit PRGI for Verification"
          message="Are you sure you want to submit this PRGI for verification? This action will notify the verification team."
          confirmText="Submit"
          variant="primary"
          loading={actionLoading}
        />

        {/* Verify Dialog */}
        <ConfirmDialog
          isOpen={showVerifyDialog}
          onClose={() => setShowVerifyDialog(false)}
          onConfirm={handleVerify}
          title="Approve PRGI"
          message="Are you sure you want to approve this PRGI? This will mark the tenant as verified."
          confirmText="Approve"
          variant="primary"
          loading={actionLoading}
        />

        {/* Reject Dialog */}
        <ConfirmDialog
          isOpen={showRejectDialog}
          onClose={() => {
            setShowRejectDialog(false)
            setRejectReason('')
          }}
          onConfirm={handleReject}
          title="Reject PRGI"
          message="Please provide a reason for rejecting this PRGI."
          confirmText="Reject"
          cancelText="Cancel"
          variant="danger"
          loading={actionLoading}
        >
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
            rows={4}
          />
        </ConfirmDialog>

        {/* Entity Form Modal */}
        <EntityFormModal
          isOpen={showEntityForm}
          onClose={() => setShowEntityForm(false)}
          onSuccess={handleEntitySuccess}
          tenantId={id}
          existingEntity={tenant?.entity}
        />
      </div>
    </SuperAdminLayout>
  )
}
