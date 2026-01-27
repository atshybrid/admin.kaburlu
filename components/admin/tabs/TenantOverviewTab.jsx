/**
 * Tenant Overview Tab - Status overview and quick info
 */

import { useState } from 'react'
import { getToken } from '../../../utils/auth'

// Use local proxy to avoid CORS
function getApiBase() {
  if (typeof window !== 'undefined') return '/api/proxy'
  return (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.kaburlumedia.com').replace(/\/$/, '') + '/api/v1'
}

function StatusBadge({ status }) {
  const styles = {
    'VERIFIED': 'bg-green-50 text-green-700 border-green-200',
    'ACTIVE': 'bg-green-50 text-green-700 border-green-200',
    'APPROVED': 'bg-green-50 text-green-700 border-green-200',
    'SUBMITTED': 'bg-blue-50 text-blue-700 border-blue-200',
    'PENDING': 'bg-amber-50 text-amber-700 border-amber-200',
    'REJECTED': 'bg-red-50 text-red-700 border-red-200',
    'INACTIVE': 'bg-slate-50 text-slate-600 border-slate-200',
  }
  const labels = {
    'VERIFIED': 'Verified',
    'ACTIVE': 'Active',
    'APPROVED': 'Approved',
    'SUBMITTED': 'Submitted',
    'PENDING': 'Pending',
    'REJECTED': 'Rejected',
    'INACTIVE': 'Inactive',
  }
  const normalized = (status || '').toUpperCase()
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${styles[normalized] || styles['PENDING']}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        normalized === 'VERIFIED' || normalized === 'ACTIVE' || normalized === 'APPROVED' ? 'bg-green-500' :
        normalized === 'SUBMITTED' ? 'bg-blue-500' :
        normalized === 'REJECTED' ? 'bg-red-500' :
        normalized === 'PENDING' ? 'bg-amber-500' : 'bg-slate-400'
      }`} />
      {labels[normalized] || status || 'Unknown'}
    </span>
  )
}

function InfoCard({ title, children, action }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-sm text-slate-900">{value || '—'}</div>
    </div>
  )
}

function isApprovedLike(record) {
  if (!record) return false
  if (record.isApproved === true) return true
  const status = String(record.status || record.prgiStatus || '').toUpperCase()
  return status === 'VERIFIED' || status === 'ACTIVE'
}

export default function TenantOverviewTab({ tenantContext }) {
  const { tenant, entity, domains = [], categories = [], razorpay, refreshTenant, refreshEntity, refreshDomains } = tenantContext || {}

  const tenantId = tenant?.id
  const [approving, setApproving] = useState({ tenant: false, entity: false })
  const [verifyingDomain, setVerifyingDomain] = useState(null) // Track which domain is being verified
  
  const primaryDomain = domains.find(d => d.isPrimary)
  const activeDomains = domains.filter(d => d.status === 'ACTIVE' || d.status === 'VERIFIED')

  const tenantApproved = isApprovedLike(tenant)
  const entityApproved = isApprovedLike(entity)
  
  // Debug: Log tenant status
  console.log('🔍 Tenant Overview Debug:', {
    tenantId,
    prgiStatus: tenant?.prgiStatus,
    isApproved: tenant?.isApproved,
    tenantApproved,
  })
  
  // Check if domain is verified/active
  const isDomainVerified = (domain) => {
    if (!domain) return false
    const status = String(domain.status || '').toUpperCase()
    return status === 'VERIFIED' || status === 'ACTIVE'
  }
  
  // Handle domain verification
  const handleVerifyDomain = async (domainId) => {
    if (!domainId) return
    setVerifyingDomain(domainId)
    try {
      const t = getToken()
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${t?.token || ''}`,
      }
      
      // POST /domains/:id/verify
      const res = await fetch(`${getApiBase()}/domains/${domainId}/verify`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ method: 'MANUAL', force: false }),
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || data.message || `Failed: ${res.status}`)
      }
      
      // Refresh domains list
      await refreshDomains?.()
      // Best-effort second refresh
      setTimeout(() => refreshDomains?.(), 800)
    } catch (e) {
      alert(e?.message || 'Failed to verify domain')
    } finally {
      setVerifyingDomain(null)
    }
  }

  const handleApproveTenant = async () => {
    if (!tenantId) return
    if (tenantApproved) return
    setApproving(prev => ({ ...prev, tenant: true }))
    try {
      const t = getToken()
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${t?.token || ''}`,
      }

      // Correct API: POST /prgi/{tenantId}/verify
      const url = `${getApiBase()}/prgi/${tenantId}/verify`
      const res = await fetch(url, { method: 'POST', headers })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || data.message || `Failed: ${res.status}`)
      }

      await refreshTenant?.()
      // Best-effort second refresh to avoid eventual-consistency lag
      setTimeout(() => refreshTenant?.(), 800)
    } catch (e) {
      alert(e?.message || 'Failed to approve tenant')
    } finally {
      setApproving(prev => ({ ...prev, tenant: false }))
    }
  }
  
  // Handle tenant rejection
  const handleRejectTenant = async () => {
    if (!tenantId) return
    if (tenantApproved) return
    
    const reason = window.prompt('Enter rejection reason (optional):')
    if (reason === null) return // User cancelled
    
    setApproving(prev => ({ ...prev, rejecting: true }))
    try {
      const t = getToken()
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${t?.token || ''}`,
      }

      // API: POST /prgi/{tenantId}/reject
      const url = `${getApiBase()}/prgi/${tenantId}/reject`
      const res = await fetch(url, { 
        method: 'POST', 
        headers,
        body: JSON.stringify({ reason: reason || '' }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || data.message || `Failed: ${res.status}`)
      }

      await refreshTenant?.()
      setTimeout(() => refreshTenant?.(), 800)
    } catch (e) {
      alert(e?.message || 'Failed to reject tenant')
    } finally {
      setApproving(prev => ({ ...prev, rejecting: false }))
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-slate-900">{domains.length}</div>
          <div className="text-sm text-slate-500">Domains</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-slate-900">{categories.length}</div>
          <div className="text-sm text-slate-500">Categories</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-slate-900">{activeDomains.length}</div>
          <div className="text-sm text-slate-500">Active Domains</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-slate-900">{razorpay?.keyId ? '✓' : '—'}</div>
          <div className="text-sm text-slate-500">Payments</div>
        </div>
      </div>

      {/* Verification / Approval */}
      <InfoCard title="Verification & Approvals">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-slate-900">Tenant Approval</div>
              <div className="text-xs text-slate-500">Controls tenant activation in the platform</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                tenantApproved
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {tenantApproved ? 'Approved' : 'Pending'}
              </span>
              {!tenantApproved && (
                <>
                  <button
                    onClick={handleApproveTenant}
                    disabled={approving.tenant || approving.rejecting}
                    className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {approving.tenant ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={handleRejectTenant}
                    disabled={approving.tenant || approving.rejecting}
                    className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {approving.rejecting ? 'Rejecting...' : 'Reject'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </InfoCard>

      {/* Basic Info */}
      <InfoCard title="Basic Information">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name" value={tenant?.name} />
          <Field label="Slug" value={tenant?.slug} />
          <Field label="PRGI Number" value={tenant?.prgiNumber} />
          <div>
            <div className="text-xs text-slate-500 mb-1">Status</div>
            <StatusBadge status={tenant?.prgiStatus} />
          </div>
        </div>
      </InfoCard>

      {/* Entity Summary */}
      <InfoCard 
        title="Registration Entity"
        action={entity ? null : (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Not configured</span>
        )}
      >
        {entity ? (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Registration Title" value={entity.registrationTitle} />
            <Field label="Language" value={entity.language?.name} />
            <Field label="Publisher" value={entity.publisherName} />
            <Field label="Periodicity" value={entity.periodicity} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Entity registration is required for tenant setup. Go to the Entity tab to configure.
          </p>
        )}
      </InfoCard>

      {/* Domains Summary */}
      <InfoCard 
        title="Domains"
        action={domains.length === 0 ? (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">No domains</span>
        ) : null}
      >
        {domains.length > 0 ? (
          <div className="space-y-2">
            {domains.slice(0, 3).map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{d.domain}</span>
                  {d.isPrimary && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-brand/10 text-brand rounded">Primary</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={d.status} />
                  {/* Show Verify button only if domain is NOT verified */}
                  {!isDomainVerified(d) && (
                    <button
                      onClick={() => handleVerifyDomain(d.id)}
                      disabled={verifyingDomain === d.id}
                      className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {verifyingDomain === d.id ? 'Verifying...' : 'Verify'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {domains.length > 3 && (
              <p className="text-xs text-slate-500">+{domains.length - 3} more domains</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No domains configured. Go to the Domains tab to add your first domain.
          </p>
        )}
      </InfoCard>
    </div>
  )
}
