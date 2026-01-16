/**
 * Modern Tenants List Page
 * Clean, responsive data table with search and create functionality
 */
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import SuperAdminLayout from '../../../components/admin/SuperAdminLayout'
import { CreateTenantModal } from '../../../components/admin/modals/CreateTenantModal'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Badge } from '../../../components/ui/Badge'
import { tenantsApi } from '../../../lib/api/tenantApi'

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
function formatDate(dateString) {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date)
  } catch {
    return '—'
  }
}

// Create Tenant Modal
function CreateTenantModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [prgiNumber, setPrgiNumber] = useState('')
  const [stateId, setStateId] = useState('')
  const [states, setStates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    async function loadStates() {
      try {
        const t = getToken()
        const res = await fetch(`${getApiBase()}/states`, {
          headers: { 'Authorization': `Bearer ${t?.token || ''}` }
        })
        if (res.ok) {
          const data = await res.json()
          setStates(Array.isArray(data) ? data : (data?.data || []))
        }
      } catch (e) {
        console.error('Failed to load states', e)
      }
    }
    loadStates()
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setError('Name is required')
    if (!stateId) return setError('State is required')
    
    setError('')
    setLoading(true)
    
    try {
      const t = getToken()
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      
      const payload = {
        name: name.trim(),
        slug,
        prgiNumber: prgiNumber.trim() || undefined,
        stateId
      }
      
      // 🔍 DEBUG: Log full request details
      console.group('🚀 CREATE TENANT REQUEST')
      console.log('📍 URL:', `${getApiBase()}/tenants`)
      console.log('🔑 Token exists:', !!t?.token)
      console.log('🔑 Token preview:', t?.token ? t.token.substring(0, 50) + '...' : 'NO TOKEN!')
      console.log('📦 Payload:', payload)
      console.groupEnd()
      
      const res = await fetch(`${getApiBase()}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(payload)
      })
      
      console.log('📬 Response:', res.status, res.statusText)
      
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Failed: ${res.status} - ${text}`)
      }
      
      const created = await res.json()
      setName('')
      setPrgiNumber('')
      setStateId('')
      onCreated(created?.data || created)
      onClose()
    } catch (e) {
      setError(e.message || 'Failed to create tenant')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b">
          <h3 className="font-semibold text-lg">Create Tenant</h3>
          <p className="text-sm text-slate-500">Add a new news publication tenant</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tenant Name *</label>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              placeholder="Daily Telangana News"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">PRGI Number</label>
            <input
              value={prgiNumber}
              onChange={e => setPrgiNumber(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              placeholder="PRGI-TS-2025-01987"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">State *</label>
            <select
              required
              value={stateId}
              onChange={e => setStateId(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white"
            >
              <option value="">Select a state</option>
              {states.map(s => (
                <option key={s.id} value={s.id}>{s.name || s.stateName}</option>
              ))}
            </select>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
          
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TenantsContent() {
  const router = useRouter()
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const fetchTenants = async () => {
    setLoading(true)
    setError('')
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/tenants?full=true`, {
        headers: { 'Authorization': `Bearer ${t?.token || ''}` },
        cache: 'no-store'
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      setTenants(Array.isArray(data) ? data : (data?.data || []))
    } catch (e) {
      setError(e.message || 'Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTenants() }, [])

  const filteredTenants = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return tenants
    return tenants.filter(t => 
      (t.name || '').toLowerCase().includes(q) ||
      (t.slug || '').toLowerCase().includes(q) ||
      (t.prgiNumber || '').toLowerCase().includes(q) ||
      (t.domains || []).some(d => (d.domain || '').toLowerCase().includes(q))
    )
  }, [tenants, search])

  const handleCreated = (newTenant) => {
    setTenants(prev => [newTenant, ...prev])
    // Navigate to the new tenant's detail page
    if (newTenant?.id) {
      router.push(`/admin/tenants/${newTenant.id}`)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tenants</h1>
          <p className="text-sm text-slate-500">Manage all news publication tenants</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark flex items-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Tenant
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tenants..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
          />
        </div>
      </div>

      {/* Tenants List */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-brand rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading tenants...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={fetchTenants} className="mt-2 text-sm text-brand hover:underline">
              Try again
            </button>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">
              {search ? 'No tenants match your search' : 'No tenants created yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Tenant</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Domains</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Language</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Setup</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTenants.map((t) => {
                  const primaryDomain = (t.domains || []).find(d => d.isPrimary)?.domain
                  const domainCount = (t.domains || []).length
                  const hasEntity = !!t.entity
                  const hasCategories = (t.categories || []).length > 0
                  const setupSteps = [hasEntity, domainCount > 0, hasCategories].filter(Boolean).length
                  
                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{t.name}</div>
                        <div className="text-xs text-slate-500">{t.prgiNumber || t.slug}</div>
                      </td>
                      <td className="px-4 py-3">
                        {domainCount > 0 ? (
                          <div>
                            <div className="text-slate-900">{primaryDomain || (t.domains || [])[0]?.domain}</div>
                            {domainCount > 1 && (
                              <div className="text-xs text-slate-500">+{domainCount - 1} more</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">No domains</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {t.entity?.language?.name || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={t.prgiStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brand rounded-full"
                              style={{ width: `${(setupSteps / 3) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{setupSteps}/3</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/tenants/${t.id}`}
                          className="px-3 py-1.5 bg-brand text-white text-xs rounded-lg font-medium hover:bg-brand-dark"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateTenantModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
    </div>
  )
}

export default function AdminTenants() {
  return (
    <SuperAdminLayout title="Tenants">
      <TenantsContent />
    </SuperAdminLayout>
  )
}
