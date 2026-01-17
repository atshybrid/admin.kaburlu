/**
 * TenantDomainsTab - Complete domain management with verification, kind, and categories
 * APIs:
 * - POST /api/v1/tenants/:tenantId/domains (add)
 * - POST /api/v1/domains/:id/verify (verify)
 * - PATCH /api/v1/domains/:id/kind (set NEWS/EPAPER)
 * - PUT /api/v1/domains/:id/categories (link categories)
 * - DELETE /api/v1/tenants/:tenantId/domains/:id (remove)
 * 
 * Domain Rules:
 * - Max 1 custom domain (e.g., example.com)
 * - Max 1 subdomain (e.g., *.kaburlumedia.com)
 */
import { useState, useEffect } from 'react'
import { getToken } from '../../../utils/auth'

// Use local proxy to avoid CORS
function getApiBase() {
  if (typeof window !== 'undefined') return '/api/proxy'
  return (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.kaburlumedia.com').replace(/\/$/, '') + '/api/v1'
}

// Helper to check if domain is a subdomain of kaburlumedia.com
function isKaburluSubdomain(domain) {
  return domain?.endsWith('.kaburlumedia.com') || domain?.endsWith('.kaburlu.com')
}

// Helper to determine domain type
function getDomainType(domain) {
  if (!domain) return 'UNKNOWN'
  if (isKaburluSubdomain(domain)) return 'SUBDOMAIN'
  return 'CUSTOM'
}

function isVerifiedDomain(domain) {
  return domain?.status === 'ACTIVE' || domain?.status === 'VERIFIED'
}

function getEpaperDomain(baseDomain) {
  const d = (baseDomain || '').trim().toLowerCase()
  if (!d) return ''
  if (d.startsWith('epaper.')) return d
  return `epaper.${d}`
}

function isApprovedLike(record) {
  if (!record) return false
  if (record.isApproved === true) return true
  const status = String(record.status || record.prgiStatus || '').toUpperCase()
  return status === 'VERIFIED' || status === 'ACTIVE'
}

// Icons
const GlobeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const ShieldIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const TagIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
)

const ExternalIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)

// Status Badge
function StatusBadge({ status }) {
  const styles = {
    'ACTIVE': 'bg-green-50 text-green-700 border-green-200',
    'VERIFIED': 'bg-green-50 text-green-700 border-green-200',
    'PENDING': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'PENDING_VERIFICATION': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'FAILED': 'bg-red-50 text-red-700 border-red-200',
  }
  const displayStatus = status === 'PENDING_VERIFICATION' ? 'PENDING' : status
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${styles[status] || styles['PENDING']}`}>
      {displayStatus}
    </span>
  )
}

// Kind Badge
function KindBadge({ kind }) {
  if (!kind) return <span className="text-xs text-slate-400">—</span>
  const styles = {
    'NEWS': 'bg-blue-50 text-blue-700 border-blue-200',
    'EPAPER': 'bg-purple-50 text-purple-700 border-purple-200',
  }
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${styles[kind] || 'bg-slate-50 text-slate-600'}`}>
      {kind}
    </span>
  )
}

// Add Domain Modal - supports adding subdomain or custom domain
function AddDomainModal({ open, onClose, onAdded, tenantId, existingDomains = [] }) {
  const [domainType, setDomainType] = useState('subdomain') // 'subdomain' or 'custom'
  const [subdomain, setSubdomain] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check what's already added
  const hasSubdomain = existingDomains.some(d => isKaburluSubdomain(d.domain))
  const hasCustomDomain = existingDomains.some(d => !isKaburluSubdomain(d.domain))

  // Auto-select available option
  useEffect(() => {
    if (hasSubdomain && !hasCustomDomain) {
      setDomainType('custom')
    } else if (hasCustomDomain && !hasSubdomain) {
      setDomainType('subdomain')
    }
  }, [hasSubdomain, hasCustomDomain])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    let domainToAdd = ''
    if (domainType === 'subdomain') {
      if (!subdomain.trim()) {
        setError('Please enter a subdomain name')
        return
      }
      // Append .kaburlumedia.com
      domainToAdd = `${subdomain.trim().toLowerCase()}.kaburlumedia.com`
    } else {
      if (!customDomain.trim()) {
        setError('Please enter a domain name')
        return
      }
      domainToAdd = customDomain.trim().toLowerCase()
    }
    
    setError('')
    setLoading(true)
    
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/tenants/${tenantId}/domains`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify({ domain: domainToAdd, isPrimary })
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || data.message || `Failed: ${res.status}`)
      }
      
      setSubdomain('')
      setCustomDomain('')
      setIsPrimary(false)
      
      // Refresh domains list and close modal
      console.log('✅ Domain added successfully, refreshing list...')
      await onAdded()
      onClose()
    } catch (e) {
      console.error('❌ Failed to add domain:', e)
      setError(e.message || 'Failed to add domain')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const canAddSubdomain = !hasSubdomain
  const canAddCustom = !hasCustomDomain

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b">
          <h3 className="font-semibold text-lg">Add Domain</h3>
          <p className="text-sm text-slate-500">You can add 1 subdomain + 1 custom domain</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Domain Type Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={!canAddSubdomain}
              onClick={() => setDomainType('subdomain')}
              className={`p-4 border-2 rounded-xl text-left transition-all ${
                domainType === 'subdomain' ? 'border-brand bg-brand/5' : 'border-slate-200'
              } ${!canAddSubdomain ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300'}`}
            >
              <div className="text-2xl mb-2">🌐</div>
              <div className="font-medium text-slate-900 text-sm">Subdomain</div>
              <div className="text-xs text-slate-500">.kaburlumedia.com</div>
              {hasSubdomain && <div className="text-xs text-amber-600 mt-1">Already added</div>}
            </button>
            <button
              type="button"
              disabled={!canAddCustom}
              onClick={() => setDomainType('custom')}
              className={`p-4 border-2 rounded-xl text-left transition-all ${
                domainType === 'custom' ? 'border-brand bg-brand/5' : 'border-slate-200'
              } ${!canAddCustom ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300'}`}
            >
              <div className="text-2xl mb-2">🔗</div>
              <div className="font-medium text-slate-900 text-sm">Custom Domain</div>
              <div className="text-xs text-slate-500">Your own domain</div>
              {hasCustomDomain && <div className="text-xs text-amber-600 mt-1">Already added</div>}
            </button>
          </div>

          {/* Domain Input */}
          {domainType === 'subdomain' && canAddSubdomain && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subdomain Name</label>
              <div className="flex">
                <input
                  required
                  value={subdomain}
                  onChange={e => setSubdomain(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                  className="flex-1 px-3 py-2.5 border border-r-0 rounded-l-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  placeholder="yoursite"
                />
                <span className="px-3 py-2.5 bg-slate-100 border rounded-r-lg text-sm text-slate-600">
                  .kaburlumedia.com
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Only letters, numbers, and hyphens allowed
              </p>
            </div>
          )}

          {domainType === 'custom' && canAddCustom && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Custom Domain</label>
              <input
                required
                value={customDomain}
                onChange={e => setCustomDomain(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                placeholder="news.example.com"
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter your full domain (e.g., news.example.com)
              </p>
            </div>
          )}
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={e => setIsPrimary(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
            />
            <span className="text-sm text-slate-700">Set as primary domain</span>
          </label>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
          
          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || (!canAddSubdomain && !canAddCustom)} 
              className="flex-1 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Domain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Verify Domain Modal
function VerifyDomainModal({ open, onClose, domain, tenantId, onVerified }) {
  const [method, setMethod] = useState('MANUAL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleVerify = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    
    try {
      const t = getToken()
      const domainId = domain?.id
      
      const res = await fetch(`${getApiBase()}/domains/${domainId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify({ method, force: method === 'MANUAL' })
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || `Verification failed: ${res.status}`)
      }
      
      setSuccess('Domain verified successfully!')
      onVerified()
      setTimeout(() => onClose(), 1500)
    } catch (e) {
      setError(e.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  if (!open || !domain) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-5 border-b">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <ShieldIcon />
            Verify Domain
          </h3>
          <p className="text-sm text-slate-500 mt-1">{domain?.domain}</p>
        </div>
        
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Verification Method</label>
            <div className="space-y-2">
              {[
                { id: 'MANUAL', label: 'Manual Verification', desc: 'Admin manually verifies (recommended)' },
                { id: 'DNS_TXT', label: 'DNS TXT Record', desc: 'Add a TXT record to your DNS' },
              ].map(m => (
                <label 
                  key={m.id}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    method === m.id ? 'border-brand bg-brand/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">{m.label}</div>
                    <div className="text-xs text-slate-500">{m.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          {method === 'DNS_TXT' && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-700 mb-2">DNS Instructions</h4>
              <div className="text-xs text-slate-600 space-y-2">
                <p>Add a TXT record with:</p>
                <div className="bg-white p-2 rounded border font-mono text-[11px] break-all">
                  Name: _kaburlu-verify.{domain?.domain}<br/>
                  Value: {domain?.verificationToken || tenantId}
                </div>
              </div>
            </div>
          )}
          
          {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>}
          {success && <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-600">{success}</div>}
          
          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={handleVerify} disabled={loading} className="flex-1 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify Domain'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Set Domain Kind Modal
function SetKindModal({ open, onClose, domain, onUpdated }) {
  const [kind, setKind] = useState(domain?.kind || 'NEWS')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (domain) setKind(domain.kind || 'NEWS')
  }, [domain])

  const handleSave = async () => {
    setError('')
    setLoading(true)
    
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/domains/${domain.id}/kind`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify({ kind })
      })
      
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      onUpdated()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open || !domain) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b">
          <h3 className="font-semibold text-lg">Set Domain Type</h3>
          <p className="text-sm text-slate-500">{domain?.domain}</p>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {['NEWS', 'EPAPER'].map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`p-4 border-2 rounded-xl text-center transition-all ${
                  kind === k ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-2xl mb-2">{k === 'NEWS' ? '📰' : '📄'}</div>
                <div className="font-medium text-slate-900">{k}</div>
                <div className="text-xs text-slate-500">{k === 'NEWS' ? 'News website' : 'E-Paper portal'}</div>
              </button>
            ))}
          </div>
          
          {error && <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>}
          
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium text-slate-600">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="flex-1 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Manage Categories Modal
function ManageCategoriesModal({ open, onClose, domain, allCategories, onUpdated }) {
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (domain?.categories) {
      setSelected(domain.categories.map(c => c.slug || c))
    }
  }, [domain])

  const handleSave = async () => {
    setError('')
    setLoading(true)
    
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/domains/${domain.id}/categories`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify({ 
          categorySlugs: selected,
          createIfMissingTranslations: true 
        })
      })
      
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      onUpdated()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (slug) => {
    setSelected(prev => 
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  if (!open || !domain) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-5 border-b shrink-0">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <TagIcon />
            Manage Categories
          </h3>
          <p className="text-sm text-slate-500">{domain?.domain}</p>
        </div>
        
        <div className="p-5 overflow-auto flex-1">
          <div className="flex flex-wrap gap-2">
            {allCategories.map(cat => {
              const isSelected = selected.includes(cat.slug)
              return (
                <button
                  key={cat.id || cat.slug}
                  type="button"
                  onClick={() => toggleCategory(cat.slug)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isSelected 
                      ? 'bg-brand text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isSelected && <span className="mr-1">✓</span>}
                  {cat.name}
                </button>
              )
            })}
          </div>
          
          {selected.length > 0 && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">Selected ({selected.length})</div>
              <div className="text-sm text-slate-700">{selected.join(', ')}</div>
            </div>
          )}
          
          {error && <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>}
        </div>
        
        <div className="p-5 border-t shrink-0 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium text-slate-600">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {loading ? 'Saving...' : `Save (${selected.length} categories)`}
          </button>
        </div>
      </div>
    </div>
  )
}

// Domain Card
function DomainCard({ domain, tenantId, allCategories, onRefresh }) {
  const [showVerify, setShowVerify] = useState(false)
  const [showKind, setShowKind] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete domain ${domain.domain}?`)) return
    setDeleting(true)
    
    try {
      const t = getToken()
      await fetch(`${getApiBase()}/tenants/${tenantId}/domains/${domain.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${t?.token || ''}` }
      })
      onRefresh()
    } catch (e) {
      alert(e.message)
    } finally {
      setDeleting(false)
    }
  }

  const isVerified = domain.status === 'ACTIVE' || domain.status === 'VERIFIED'
  const categoryCount = domain.categories?.length || 0
  const domainTypeLabel = isKaburluSubdomain(domain.domain) ? 'Subdomain' : 'Custom'
  const domainTypeColor = isKaburluSubdomain(domain.domain) 
    ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
    : 'bg-emerald-50 text-emerald-700 border-emerald-200'

  return (
    <>
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
            <GlobeIcon />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 truncate">{domain.domain}</span>
              {domain.isPrimary && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-brand text-white rounded">Primary</span>
              )}
              <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${domainTypeColor}`}>
                {domainTypeLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={domain.status} />
              <KindBadge kind={domain.kind} />
            </div>
          </div>
          <a 
            href={`https://${domain.domain}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <ExternalIcon />
          </a>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Verification & Status Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2 bg-slate-50 rounded-lg">
              <div className="text-slate-500 mb-0.5">Verification Method</div>
              <div className="font-medium text-slate-700">
                {domain.verificationMethod || 'Not set'}
              </div>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <div className="text-slate-500 mb-0.5">Last Check Status</div>
              <div className="font-medium text-slate-700 flex items-center gap-1">
                {domain.lastCheckStatus === 'OK' ? (
                  <><span className="w-2 h-2 rounded-full bg-green-500"></span> OK</>
                ) : domain.lastCheckStatus ? (
                  <><span className="w-2 h-2 rounded-full bg-amber-500"></span> {domain.lastCheckStatus}</>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>
            </div>
            {!isVerified && domain.verificationToken && (
              <div className="col-span-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-amber-600 mb-0.5">Verification Token</div>
                <div className="font-mono text-amber-800 break-all text-[11px]">
                  {domain.verificationToken}
                </div>
              </div>
            )}
            {domain.verifiedAt && (
              <div className="p-2 bg-green-50 rounded-lg">
                <div className="text-green-600 mb-0.5">Verified At</div>
                <div className="font-medium text-green-700">
                  {new Date(domain.verifiedAt).toLocaleDateString()}
                </div>
              </div>
            )}
            {domain.lastCheckAt && (
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-slate-500 mb-0.5">Last Checked</div>
                <div className="font-medium text-slate-700">
                  {new Date(domain.lastCheckAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          {/* Categories summary */}
          <div>
            <div className="text-xs text-slate-500 mb-2">Linked Categories ({categoryCount})</div>
            {categoryCount > 0 ? (
              <div className="flex flex-wrap gap-1">
                {(domain.categories || []).slice(0, 5).map((cat, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                    {typeof cat === 'string' ? cat : cat.name || cat.slug}
                  </span>
                ))}
                {categoryCount > 5 && (
                  <span className="px-2 py-0.5 text-slate-400 text-xs">+{categoryCount - 5} more</span>
                )}
              </div>
            ) : (
              <p className="text-xs text-amber-600">No categories linked</p>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {!isVerified && (
              <button
                onClick={() => setShowVerify(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100"
              >
                <ShieldIcon />
                Verify
              </button>
            )}
            
            <button
              onClick={() => setShowKind(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200"
            >
              Set Type
            </button>
            
            <button
              onClick={() => setShowCategories(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200"
            >
              <TagIcon />
              Categories
            </button>
            
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium ml-auto"
            >
              <TrashIcon />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
      
      <VerifyDomainModal 
        open={showVerify} 
        onClose={() => setShowVerify(false)} 
        domain={domain} 
        tenantId={tenantId}
        onVerified={onRefresh} 
      />
      <SetKindModal 
        open={showKind} 
        onClose={() => setShowKind(false)} 
        domain={domain} 
        onUpdated={onRefresh} 
      />
      <ManageCategoriesModal 
        open={showCategories} 
        onClose={() => setShowCategories(false)} 
        domain={domain}
        allCategories={allCategories}
        onUpdated={onRefresh} 
      />
    </>
  )
}

export default function TenantDomainsTab({ tenantContext }) {
  const { tenant, entity, domains = [], categories = [], refreshDomains, refreshTenant, refreshEntity } = tenantContext || {}
  const tenantId = tenant?.id
  const [showAdd, setShowAdd] = useState(false)
  const [allCategories, setAllCategories] = useState([])
  const [approving, setApproving] = useState({})
  const [epaperActivating, setEpaperActivating] = useState(false)

  const tenantApproved = isApprovedLike(tenant)
  const entityApproved = isApprovedLike(entity)
  
  // Check if we can add more domains
  const hasSubdomain = domains.some(d => isKaburluSubdomain(d.domain))
  const hasCustomDomain = domains.some(d => !isKaburluSubdomain(d.domain))
  const canAddMore = !hasSubdomain || !hasCustomDomain

  const hasAnyVerifiedDomain = domains.some(isVerifiedDomain)
  const verifiedCustomDomain = domains.find(d => !isKaburluSubdomain(d.domain) && isVerifiedDomain(d))
  const epaperDomainName = getEpaperDomain(verifiedCustomDomain?.domain)
  const epaperDomain = domains.find(d => d?.kind === 'EPAPER' || d?.domain?.toLowerCase() === epaperDomainName)
  const canActivateEpaper = Boolean(verifiedCustomDomain && !epaperDomain && epaperDomainName)
  
  // Load all system categories for linking
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const t = getToken()
        const res = await fetch(`${getApiBase()}/categories`, {
          headers: { 'Authorization': `Bearer ${t?.token || ''}` }
        })
        if (res.ok) {
          const data = await res.json()
          setAllCategories(Array.isArray(data) ? data : (data?.data || []))
        }
      } catch (e) {
        console.error('Failed to load categories', e)
        // Fallback to tenant categories
        setAllCategories(categories)
      }
    }
    loadCategories()
  }, [categories])

  // Approval handler
  const handleApprove = async (type, action) => {
    setApproving(prev => ({ ...prev, [type]: true }))
    try {
      const t = getToken()
      let url = ''
      let method = 'PATCH'
      let body = {}
      
      if (type === 'tenant') {
        url = `${getApiBase()}/tenants/${tenantId}/verify`
        body = { prgiStatus: action === 'approve' ? 'VERIFIED' : 'PENDING', remark: '' }
      } else if (type === 'entity') {
        url = `${getApiBase()}/tenants/${tenantId}/entity`
        method = 'PUT'
        body = { ...entity, isApproved: action === 'approve' }
      } else if (type.startsWith('domain-')) {
        const domainId = type.replace('domain-', '')
        url = `${getApiBase()}/domains/${domainId}/verify`
        method = 'POST'
        body = { method: 'MANUAL', force: true }
      }
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(body)
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || data.message || `Failed: ${res.status}`)
      }
      
      // Refresh data
      if (type === 'tenant') refreshTenant?.()
      else if (type === 'entity') refreshEntity?.()
      else refreshDomains?.()
      
    } catch (e) {
      alert(e.message || 'Approval failed')
    } finally {
      setApproving(prev => ({ ...prev, [type]: false }))
    }
  }

  const handleActivateEpaper = async () => {
    if (!tenantId) return
    if (!verifiedCustomDomain?.domain) return
    const epaperHost = getEpaperDomain(verifiedCustomDomain.domain)
    if (!epaperHost) return

    setEpaperActivating(true)
    try {
      const t = getToken()
      // 1) Add epaper.<domain> using the SAME tenant domains API
      const addRes = await fetch(`${getApiBase()}/tenants/${tenantId}/domains`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`,
        },
        body: JSON.stringify({ domain: epaperHost, isPrimary: false }),
      })

      if (!addRes.ok) {
        const data = await addRes.json().catch(() => ({}))
        throw new Error(data.error || data.message || `Failed: ${addRes.status}`)
      }

      const created = await addRes.json().catch(() => null)
      const createdId = created?.id || created?.data?.id

      // 2) Mark as EPAPER (best-effort if backend returns id)
      if (createdId) {
        const kindRes = await fetch(`${getApiBase()}/domains/${createdId}/kind`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${t?.token || ''}`,
          },
          body: JSON.stringify({ kind: 'EPAPER' }),
        })
        if (!kindRes.ok) {
          // Don't fail activation if kind patch fails; user can still set it manually.
          console.warn('Failed to set EPAPER kind', kindRes.status)
        }
      }

      // 3) Refresh list
      await refreshDomains?.()
    } catch (e) {
      alert(e?.message || 'Failed to activate epaper domain')
    } finally {
      setEpaperActivating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Approval Section */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <ShieldIcon />
            Approval Status
          </h3>
          <p className="text-sm text-slate-500">Manage tenant, entity, and domain approvals</p>
        </div>
        <div className="p-4 space-y-3">
          {/* Tenant Approval */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                tenantApproved ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
              }`}>
                {tenantApproved ? <CheckIcon /> : '!'}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">Tenant</div>
                <div className="text-xs text-slate-500">{tenant?.name || 'Tenant registration'}</div>
              </div>
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
                <button
                  onClick={() => handleApprove('tenant', 'approve')}
                  disabled={approving.tenant}
                  className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {approving.tenant ? 'Approving...' : 'Approve'}
                </button>
              )}
            </div>
          </div>

          {/* Domain Approvals */}
          {domains.map(domain => {
            const isVerified = domain.status === 'ACTIVE' || domain.status === 'VERIFIED'
            return (
              <div key={domain.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isVerified ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {isVerified ? <CheckIcon /> : '!'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Domain</div>
                    <div className="text-xs text-slate-500">{domain.domain}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    isVerified 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {isVerified ? 'Verified' : 'Pending'}
                  </span>
                  {!isVerified && (
                    <button
                      onClick={() => handleApprove(`domain-${domain.id}`, 'approve')}
                      disabled={approving[`domain-${domain.id}`]}
                      className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {approving[`domain-${domain.id}`] ? 'Verifying...' : 'Verify'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          
          {domains.length === 0 && (
            <div className="text-center py-3 text-sm text-slate-500">
              No domains added yet
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <GlobeIcon />
            Domain Management
          </h2>
          <p className="text-sm text-slate-500">
            {hasSubdomain && hasCustomDomain 
              ? 'Maximum domains reached (1 subdomain + 1 custom)' 
              : `Add ${!hasSubdomain ? 'a subdomain' : ''}${!hasSubdomain && !hasCustomDomain ? ' or ' : ''}${!hasCustomDomain ? 'a custom domain' : ''}`
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {canActivateEpaper && (
            <button
              onClick={handleActivateEpaper}
              disabled={epaperActivating}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title={`Create ${epaperDomainName} for EPAPER`}
            >
              {epaperActivating ? 'Activating...' : 'Activate Epaper'}
            </button>
          )}

          {!hasAnyVerifiedDomain && (
            <button
              onClick={() => setShowAdd(true)}
              disabled={!canAddMore}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon />
              Add Domain
            </button>
          )}
        </div>
      </div>
      
      {/* Domain Slots Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl border-2 ${hasSubdomain ? 'border-green-200 bg-green-50' : 'border-dashed border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hasSubdomain ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
              🌐
            </div>
            <div>
              <div className="font-medium text-slate-900">Subdomain Slot</div>
              {hasSubdomain ? (
                <div className="text-sm text-green-600">
                  {domains.find(d => isKaburluSubdomain(d.domain))?.domain}
                </div>
              ) : (
                <div className="text-sm text-slate-500">*.kaburlumedia.com</div>
              )}
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-xl border-2 ${hasCustomDomain ? 'border-green-200 bg-green-50' : 'border-dashed border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hasCustomDomain ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
              🔗
            </div>
            <div>
              <div className="font-medium text-slate-900">Custom Domain Slot</div>
              {hasCustomDomain ? (
                <div className="text-sm text-green-600">
                  {domains.find(d => !isKaburluSubdomain(d.domain))?.domain}
                </div>
              ) : (
                <div className="text-sm text-slate-500">Your own domain</div>
              )}

              {verifiedCustomDomain?.domain && (
                <div className="text-xs text-slate-500 mt-1">
                  Epaper: <span className="font-medium text-slate-700">{getEpaperDomain(verifiedCustomDomain.domain)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Domains List */}
      {domains.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <GlobeIcon />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">No Domains Configured</h3>
          <p className="text-sm text-slate-500 mb-4">Add your first domain to start serving content</p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium"
          >
            <PlusIcon />
            Add First Domain
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {domains.map(domain => (
            <DomainCard 
              key={domain.id} 
              domain={domain} 
              tenantId={tenantId}
              allCategories={allCategories}
              onRefresh={refreshDomains} 
            />
          ))}
        </div>
      )}
      
      <AddDomainModal 
        open={showAdd} 
        onClose={() => setShowAdd(false)} 
        onAdded={refreshDomains}
        tenantId={tenantId}
        existingDomains={domains}
      />
    </div>
  )
}
