/**
 * Tenant Detail Layout - Step-wise wizard for tenant configuration
 * All tenant setup happens here in organized tabs
 */
import { useState, useEffect, createContext, useContext } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getToken } from '../../utils/auth'

// Tenant context for sharing data between tabs
const TenantContext = createContext({})
export const useTenant = () => useContext(TenantContext)

// Use local proxy to avoid CORS
function getApiBase() {
  if (typeof window !== 'undefined') {
    return '/api/proxy'
  }
  return (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.kaburlumedia.com').replace(/\/$/, '') + '/api/v1'
}

// Tab configuration - Step-wise setup flow
const TENANT_TABS = [
  { id: 'overview', label: 'Overview', icon: 'home', description: 'Status & quick info' },
  { id: 'entity', label: 'Entity', icon: 'building', description: 'Business registration' },
  { id: 'domains', label: 'Domains', icon: 'globe', description: 'Domain management' },
  { id: 'domain-settings', label: 'Domain Settings', icon: 'settings', description: 'Theme, branding, navigation per domain' },
  { id: 'categories', label: 'Categories', icon: 'folder', description: 'Content categories' },
  { id: 'homepage', label: 'Homepage', icon: 'layout', description: 'Homepage config' },
  { id: 'ads', label: 'Ads', icon: 'megaphone', description: 'Advertisement slots' },
  { id: 'editions', label: 'ePaper Editions', icon: 'layers', description: 'Editions & sub-editions' },
  { id: 'payments', label: 'Payments', icon: 'credit-card', description: 'Razorpay config' },
  { id: 'settings', label: 'Settings', icon: 'settings', description: 'Feature flags' },
  { id: 'id-cards', label: 'ID Cards', icon: 'id-card', description: 'Reporter cards' },
  { id: 'pages', label: 'Legal Pages', icon: 'file-text', description: 'Static pages' },
  { id: 'reporters', label: 'Reporters', icon: 'users', description: 'Journalists' },
]

// Icons
function Icon({ name, className = 'w-5 h-5' }) {
  const icons = {
    'home': <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    'building': <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
    'globe': <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />,
    'folder': <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />,
    'palette': <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />,
    'layout': <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />,
    'megaphone': <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />,
    'search': <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
    'credit-card': <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
    'settings': <><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>,
    'id-card': <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />,
    'file-text': <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    'layers': <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />,
    'users': <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
    'arrow-left': <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />,
    'check': <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />,
    'x': <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
    'alert': <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
    'external': <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />,
  }
  
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {icons[name] || icons['home']}
    </svg>
  )
}

// Setup progress indicator
function SetupProgress({ tenant, entity, domains, categories, razorpay, idCard }) {
  const steps = [
    { label: 'Entity', done: !!entity },
    { label: 'Domain', done: (domains || []).length > 0 },
    { label: 'Categories', done: (categories || []).length > 0 },
    { label: 'Branding', done: !!tenant?.logo },
    { label: 'Payments', done: !!razorpay?.keyId },
  ]
  
  const completed = steps.filter(s => s.done).length
  const percentage = Math.round((completed / steps.length) * 100)
  
  return (
    <div className="bg-white rounded-xl border p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-700">Setup Progress</h3>
        <span className="text-sm font-semibold text-brand">{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-brand to-brand-dark transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex gap-2 mt-3 flex-wrap">
        {steps.map((step, i) => (
          <span 
            key={i}
            className={`text-xs px-2 py-1 rounded-full ${
              step.done 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-slate-50 text-slate-500 border border-slate-200'
            }`}
          >
            {step.done ? '✓' : '○'} {step.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// Tab navigation component
function TabNavigation({ activeTab, onTabChange, completedTabs }) {
  return (
    <div className="w-full lg:w-64 shrink-0">
      <nav className="bg-white rounded-xl border sticky top-4">
        <div className="p-3 border-b">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Setup Steps</h3>
        </div>
        <ul className="p-2 space-y-1">
          {TENANT_TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const isComplete = completedTabs?.includes(tab.id)
            
            return (
              <li key={tab.id}>
                <button
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-brand/10 text-brand'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-brand text-white' : isComplete ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isComplete && !isActive ? (
                      <Icon name="check" className="w-4 h-4" />
                    ) : (
                      <Icon name={tab.icon} className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{tab.label}</div>
                    <div className="text-xs text-slate-400 truncate">{tab.description}</div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

// Main Tenant Detail Layout
export default function TenantDetailLayout({ tenantId, activeTab = 'overview', children, renderContent }) {
  const router = useRouter()
  const [tenant, setTenant] = useState(null)
  const [entity, setEntity] = useState(null)
  const [domains, setDomains] = useState([])
  const [categories, setCategories] = useState([])
  const [razorpay, setRazorpay] = useState(null)
  const [idCard, setIdCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load tenant data
  useEffect(() => {
    if (!tenantId) return
    
    let cancelled = false
    
    async function loadTenant() {
      setLoading(true)
      setError('')
      
      try {
        const t = getToken()
        const base = getApiBase()
        const headers = {
          'accept': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        }
        
        // Fetch all tenant data in parallel (proxy adds /api/v1 prefix)
        const [tenantRes, entityRes, domainsRes, categoriesRes, razorpayRes, idCardRes] = await Promise.allSettled([
          fetch(`${base}/tenants/${tenantId}`, { headers }),
          fetch(`${base}/tenants/${tenantId}/entity`, { headers }),
          fetch(`${base}/domains`, { headers }), // Use global domains endpoint
          fetch(`${base}/tenants/${tenantId}/categories`, { headers }),
          fetch(`${base}/tenants/${tenantId}/razorpay-config`, { headers }),
          fetch(`${base}/tenants/${tenantId}/id-card-settings`, { headers }),
        ])
        
        if (cancelled) return
        
        // Parse tenant
        let tenantData = null
        if (tenantRes.status === 'fulfilled' && tenantRes.value.ok) {
          const data = await tenantRes.value.json()
          tenantData = data?.data || data
          setTenant(tenantData)
        } else {
          throw new Error('Failed to load tenant')
        }
        
        // Parse entity
        if (entityRes.status === 'fulfilled' && entityRes.value.ok) {
          const data = await entityRes.value.json()
          setEntity(data?.data || data)
        }
        
        // Parse domains - use global /domains endpoint and filter by tenantId
        if (domainsRes.status === 'fulfilled' && domainsRes.value.ok) {
          const data = await domainsRes.value.json()
          const allDomains = Array.isArray(data) ? data : (data?.data || [])
          // Filter domains for this tenant
          const tenantDomains = allDomains.filter(d => d.tenantId === tenantId)
          console.log('🌐 Domains loaded:', { total: allDomains.length, forTenant: tenantDomains.length, tenantId })
          if (tenantDomains.length > 0) {
            setDomains(tenantDomains)
          } else if (tenantData?.domains?.length > 0) {
            setDomains(tenantData.domains)
          } else {
            setDomains([])
          }
        } else if (tenantData?.domains?.length > 0) {
          // Fallback: use domains from tenant object
          setDomains(tenantData.domains)
        }
        
        // Parse categories
        if (categoriesRes.status === 'fulfilled' && categoriesRes.value.ok) {
          const data = await categoriesRes.value.json()
          setCategories(Array.isArray(data) ? data : (data?.data || []))
        }
        
        // Parse razorpay
        if (razorpayRes.status === 'fulfilled' && razorpayRes.value.ok) {
          const data = await razorpayRes.value.json()
          setRazorpay(data?.data || data)
        }
        
        // Parse ID card
        if (idCardRes.status === 'fulfilled' && idCardRes.value.ok) {
          const data = await idCardRes.value.json()
          setIdCard(data?.data || data)
        }
        
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load tenant data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    
    loadTenant()
    return () => { cancelled = true }
  }, [tenantId])

  // Compute completed tabs
  const completedTabs = []
  if (entity) completedTabs.push('entity')
  if (domains.length > 0) completedTabs.push('domains')
  if (categories.length > 0) completedTabs.push('categories')
  if (razorpay?.keyId) completedTabs.push('payments')
  if (idCard) completedTabs.push('id-cards')

  // Tab change handler
  const handleTabChange = (tabId) => {
    router.push(`/admin/tenants/${tenantId}/${tabId}`, undefined, { shallow: true })
  }

  // Refresh functions for child components
  const refreshTenant = async () => {
    const t = getToken()
    const base = getApiBase()
    const res = await fetch(`${base}/tenants/${tenantId}`, {
      headers: { 'accept': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
      cache: 'no-store'
    })
    if (res.ok) {
      const data = await res.json()
      setTenant(data?.data || data)
    }
  }

  const refreshEntity = async () => {
    const t = getToken()
    const base = getApiBase()
    const res = await fetch(`${base}/tenants/${tenantId}/entity`, {
      headers: { 'accept': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
      cache: 'no-store'
    })
    if (res.ok) {
      const data = await res.json()
      setEntity(data?.data || data)
    }
  }

  const refreshDomains = async () => {
    const t = getToken()
    const base = getApiBase()
    
    // Use global /domains endpoint and filter by tenantId
    const res = await fetch(`${base}/domains`, {
      headers: { 'accept': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
      cache: 'no-store'
    })
    
    if (res.ok) {
      const data = await res.json()
      const allDomains = Array.isArray(data) ? data : (data?.data || [])
      const tenantDomains = allDomains.filter(d => d.tenantId === tenantId)
      console.log('🌐 Domains refreshed:', { total: allDomains.length, forTenant: tenantDomains.length, tenantId })
      setDomains(tenantDomains)
      return
    }
    
    // Fallback: refetch tenant to get domains from there
    const tenantRes = await fetch(`${base}/tenants/${tenantId}`, {
      headers: { 'accept': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` },
      cache: 'no-store'
    })
    if (tenantRes.ok) {
      const tenantData = await tenantRes.json()
      const td = tenantData?.data || tenantData
      setTenant(td)
      if (td?.domains?.length > 0) {
        setDomains(td.domains)
      }
    }
  }

  const refreshCategories = async () => {
    const t = getToken()
    const base = getApiBase()
    const res = await fetch(`${base}/tenants/${tenantId}/categories`, {
      headers: { 'accept': 'application/json', 'Authorization': `Bearer ${t?.token || ''}` }
    })
    if (res.ok) {
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : (data?.data || []))
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/tenants" className="p-2 rounded-lg hover:bg-slate-100">
            <Icon name="arrow-left" className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-6">
          <div className="w-64 shrink-0">
            <div className="bg-white rounded-xl border p-4 space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-white rounded-xl border p-6">
              <div className="h-8 w-32 bg-slate-200 rounded mb-4 animate-pulse" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/tenants" className="p-2 rounded-lg hover:bg-slate-100">
            <Icon name="arrow-left" className="w-5 h-5 text-slate-600" />
          </Link>
          <span className="text-lg font-semibold text-slate-900">Back to Tenants</span>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <Icon name="alert" className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Tenant</h3>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <TenantContext.Provider value={{
      tenant, setTenant, refreshTenant,
      entity, setEntity, refreshEntity,
      domains, setDomains, refreshDomains,
      categories, setCategories, refreshCategories,
      razorpay, setRazorpay,
      idCard, setIdCard,
      tenantId,
    }}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/tenants" className="p-2 rounded-lg hover:bg-slate-100">
              <Icon name="arrow-left" className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{tenant?.name || 'Tenant'}</h1>
              <p className="text-sm text-slate-500">
                {tenant?.slug} • PRGI: {tenant?.prgiNumber || 'Not set'}
              </p>
            </div>
          </div>
          
          {/* Primary domain link */}
          {domains.find(d => d.isPrimary)?.domain && (
            <a
              href={`https://${domains.find(d => d.isPrimary).domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              <Icon name="external" className="w-4 h-4" />
              Visit Site
            </a>
          )}
        </div>

        {/* Setup Progress */}
        <SetupProgress 
          tenant={tenant}
          entity={entity}
          domains={domains}
          categories={categories}
          razorpay={razorpay}
          idCard={idCard}
        />

        {/* Main Layout */}
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Tab Navigation */}
          <TabNavigation 
            activeTab={activeTab}
            onTabChange={handleTabChange}
            completedTabs={completedTabs}
          />

          {/* Tab Content */}
          <div className="flex-1 min-w-0">
            {renderContent ? renderContent({
              tenant, setTenant, refreshTenant,
              entity, setEntity, refreshEntity,
              domains, setDomains, refreshDomains,
              categories, setCategories, refreshCategories,
              razorpay, setRazorpay,
              idCard, setIdCard,
              tenantId,
            }) : children}
          </div>
        </div>
      </div>
    </TenantContext.Provider>
  )
}

// Export tab components placeholder
export { TENANT_TABS }
