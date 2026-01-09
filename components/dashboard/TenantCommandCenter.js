/**
 * TenantCommandCenter - Modern redesigned tenant management dashboard
 * A comprehensive, easy-to-use interface for managing all tenant settings
 */
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { getToken } from '../../utils/auth'

// ============================================================================
// API HELPERS
// ============================================================================
function getApiBase() {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com'
  return String(base).replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

async function apiFetch(url, options = {}) {
  const t = getToken()
  const res = await fetch(url, {
    ...options,
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${t?.token || ''}`,
      ...options.headers
    }
  })
  return res
}

// ============================================================================
// ICONS
// ============================================================================
const Icons = {
  Building: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Globe: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  Palette: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  Grid: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  CreditCard: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  IdCard: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
    </svg>
  ),
  Document: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Search: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  Warning: () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  ExternalLink: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Home: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
}

// ============================================================================
// TAB CONFIGURATION
// ============================================================================
const TABS = [
  { id: 'overview', label: 'Overview', icon: Icons.Home, desc: 'Quick summary & setup checklist' },
  { id: 'entity', label: 'Entity', icon: Icons.Building, desc: 'Business registration & PRGI' },
  { id: 'domains', label: 'Domains', icon: Icons.Globe, desc: 'Domain linking & verification' },
  { id: 'branding', label: 'Branding', icon: Icons.Palette, desc: 'Logo, colors & theme' },
  { id: 'categories', label: 'Categories', icon: Icons.Grid, desc: 'Content categories' },
  { id: 'payments', label: 'Payments', icon: Icons.CreditCard, desc: 'Razorpay configuration' },
  { id: 'idcards', label: 'ID Cards', icon: Icons.IdCard, desc: 'Reporter ID card settings' },
  { id: 'pages', label: 'Pages', icon: Icons.Document, desc: 'Legal & static pages' },
  { id: 'reporters', label: 'Reporters', icon: Icons.Users, desc: 'Manage reporters' },
  { id: 'seo', label: 'SEO', icon: Icons.Search, desc: 'Meta tags & analytics' },
]

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================
function StatusBadge({ status, size = 'sm' }) {
  const styles = {
    configured: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    partial: 'bg-amber-50 text-amber-700 border-amber-200',
    pending: 'bg-slate-100 text-slate-600 border-slate-200',
  }
  const labels = {
    configured: 'Configured',
    partial: 'Partial',
    pending: 'Not configured',
  }
  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
  
  return (
    <span className={`${sizeClass} rounded-full border font-medium ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  )
}

// ============================================================================
// PROGRESS RING COMPONENT
// ============================================================================
function ProgressRing({ progress, size = 60, strokeWidth = 5 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference
  
  const color = progress >= 80 ? '#10b981' : progress >= 50 ? '#f59e0b' : '#ef4444'
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-slate-700">{progress}%</span>
      </div>
    </div>
  )
}

// ============================================================================
// SECTION HEADER COMPONENT
// ============================================================================
function SectionHeader({ icon: IconComponent, title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
          <IconComponent />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================
function OverviewTab({ tenant, statuses, onNavigate }) {
  const setupSteps = [
    { id: 'entity', label: 'Add Business Entity', desc: 'Register your business with PRGI', status: statuses.entity },
    { id: 'domains', label: 'Configure Domains', desc: 'Link and verify your domains', status: statuses.domains },
    { id: 'branding', label: 'Setup Branding', desc: 'Logo, colors, and theme settings', status: statuses.branding },
    { id: 'categories', label: 'Link Categories', desc: 'Connect content categories', status: statuses.categories },
    { id: 'payments', label: 'Setup Payments', desc: 'Configure Razorpay for subscriptions', status: statuses.payments },
    { id: 'idcards', label: 'ID Card Settings', desc: 'Reporter ID card templates', status: statuses.idcards },
  ]

  const completedCount = setupSteps.filter(s => s.status === 'configured').length
  const progress = Math.round((completedCount / setupSteps.length) * 100)

  const primaryDomain = tenant?.domains?.find(d => d.isPrimary)

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900">{tenant?.domains?.length || 0}</div>
              <div className="text-sm text-slate-500">Domains</div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <Icons.Globe />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900">{tenant?.categories?.length || 0}</div>
              <div className="text-sm text-slate-500">Categories</div>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <Icons.Grid />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900">{tenant?.reportersCount || '—'}</div>
              <div className="text-sm text-slate-500">Reporters</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Icons.Users />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900">{progress}%</div>
              <div className="text-sm text-slate-500">Setup Complete</div>
            </div>
            <ProgressRing progress={progress} size={48} strokeWidth={4} />
          </div>
        </div>
      </div>

      {/* Primary Domain Card */}
      {primaryDomain && (
        <div className="bg-gradient-to-r from-brand to-brand/80 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-80 mb-1">Primary Domain</div>
              <div className="text-xl font-semibold flex items-center gap-2">
                {primaryDomain.domain}
                <a href={`https://${primaryDomain.domain}`} target="_blank" rel="noreferrer" className="opacity-70 hover:opacity-100">
                  <Icons.ExternalLink />
                </a>
              </div>
              <div className="flex items-center gap-3 mt-2 text-sm opacity-80">
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${primaryDomain.status === 'ACTIVE' ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                  {primaryDomain.status || 'PENDING'}
                </span>
                {primaryDomain.verifiedAt && (
                  <span>Verified: {new Date(primaryDomain.verifiedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <button 
              onClick={() => onNavigate('domains')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Manage Domains
            </button>
          </div>
        </div>
      )}

      {/* Setup Checklist */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Setup Checklist</h3>
              <p className="text-sm text-slate-500">{completedCount} of {setupSteps.length} completed</p>
            </div>
            <ProgressRing progress={progress} size={40} strokeWidth={3} />
          </div>
        </div>
        <div className="divide-y">
          {setupSteps.map((step, idx) => (
            <div 
              key={step.id}
              className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => onNavigate(step.id)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.status === 'configured' 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {step.status === 'configured' ? <Icons.Check /> : idx + 1}
                </div>
                <div>
                  <div className="font-medium text-slate-900">{step.label}</div>
                  <div className="text-sm text-slate-500">{step.desc}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={step.status} />
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Icons.Globe, label: 'Add Domain', tab: 'domains', color: 'blue' },
          { icon: Icons.Users, label: 'Add Reporter', tab: 'reporters', color: 'amber' },
          { icon: Icons.Document, label: 'Add Page', tab: 'pages', color: 'purple' },
          { icon: Icons.Settings, label: 'Settings', tab: 'branding', color: 'slate' },
        ].map(action => (
          <button
            key={action.label}
            onClick={() => onNavigate(action.tab)}
            className={`flex items-center gap-3 p-4 bg-white rounded-xl border hover:border-${action.color}-300 hover:bg-${action.color}-50/50 transition-all group`}
          >
            <div className={`p-2 rounded-lg bg-${action.color}-50 text-${action.color}-600 group-hover:bg-${action.color}-100`}>
              <action.icon />
            </div>
            <span className="font-medium text-slate-700">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// PLACEHOLDER TABS (Will be replaced with full implementations)
// ============================================================================
function PlaceholderTab({ title, icon: IconComponent, tenant, onRefresh }) {
  return (
    <div className="bg-white rounded-xl border p-8 text-center">
      <div className="inline-flex p-4 rounded-2xl bg-slate-100 text-slate-400 mb-4">
        <IconComponent />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 mb-4">This section is being redesigned for a better experience.</p>
      <button 
        onClick={onRefresh}
        className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90"
      >
        Refresh Data
      </button>
    </div>
  )
}

// ============================================================================
// DOMAINS TAB
// ============================================================================
function DomainsTab({ tenant, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async () => {
    if (!newDomain.trim()) return
    setAdding(true)
    setError('')
    try {
      const res = await apiFetch(`${getApiBase()}/api/v1/tenants/${tenant.id}/domains`, {
        method: 'POST',
        body: JSON.stringify({ domain: newDomain.trim() })
      })
      if (!res.ok) throw new Error('Failed to add domain')
      setNewDomain('')
      setShowAdd(false)
      onRefresh()
    } catch (e) {
      setError(e.message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Icons.Globe}
        title="Domain Management"
        subtitle="Link and verify your domains for this tenant"
        action={
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90"
          >
            <Icons.Plus /> Add Domain
          </button>
        }
      />

      {showAdd && (
        <div className="bg-slate-50 rounded-xl p-4 border">
          <div className="flex gap-3">
            <input
              type="text"
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
              placeholder="news.example.com"
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
            />
            <button
              onClick={handleAdd}
              disabled={adding}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
          </div>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Domain</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Verified</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(tenant?.domains || []).map(d => (
              <tr key={d.id || d.domain} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{d.domain}</span>
                    <a href={`https://${d.domain}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-brand">
                      <Icons.ExternalLink />
                    </a>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${d.isPrimary ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                    {d.isPrimary ? 'Primary' : 'Secondary'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${d.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {d.status || 'PENDING'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {d.verifiedAt ? new Date(d.verifiedAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-sm text-brand hover:underline">Settings</button>
                </td>
              </tr>
            ))}
            {(!tenant?.domains || tenant.domains.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No domains configured yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================================
// BRANDING TAB
// ============================================================================
function BrandingTab({ tenant, onRefresh }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#3F51B5',
    secondaryColor: '#CDDC39',
    accentColor: '#FF9800',
  })

  useEffect(() => {
    if (tenant?.settings) {
      const s = tenant.settings
      setForm({
        logoUrl: s.branding?.logoUrl || '',
        faviconUrl: s.branding?.faviconUrl || '',
        primaryColor: s.theme?.colors?.primary || '#3F51B5',
        secondaryColor: s.theme?.colors?.secondary || '#CDDC39',
        accentColor: s.theme?.colors?.accent || '#FF9800',
      })
    }
  }, [tenant])

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Icons.Palette}
        title="Theme & Branding"
        subtitle="Customize the look and feel of your tenant site"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo & Favicon */}
        <div className="bg-white rounded-xl border p-5">
          <h4 className="font-medium text-slate-900 mb-4">Logo & Favicon</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
              <input
                type="url"
                value={form.logoUrl}
                onChange={e => setForm({...form, logoUrl: e.target.value})}
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              {form.logoUrl && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.logoUrl} alt="Logo" className="h-10 object-contain" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Favicon URL</label>
              <input
                type="url"
                value={form.faviconUrl}
                onChange={e => setForm({...form, faviconUrl: e.target.value})}
                placeholder="https://example.com/favicon.ico"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white rounded-xl border p-5">
          <h4 className="font-medium text-slate-900 mb-4">Theme Colors</h4>
          <div className="space-y-4">
            {[
              { key: 'primaryColor', label: 'Primary Color' },
              { key: 'secondaryColor', label: 'Secondary Color' },
              { key: 'accentColor', label: 'Accent Color' },
            ].map(c => (
              <div key={c.key} className="flex items-center gap-3">
                <input
                  type="color"
                  value={form[c.key]}
                  onChange={e => setForm({...form, [c.key]: e.target.value})}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-700">{c.label}</div>
                  <div className="text-xs text-slate-500 font-mono">{form[c.key]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl border p-5">
        <h4 className="font-medium text-slate-900 mb-4">Live Preview</h4>
        <div className="rounded-lg overflow-hidden border" style={{ backgroundColor: form.primaryColor }}>
          <div className="h-14 px-4 flex items-center justify-between text-white">
            {form.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logoUrl} alt="Logo" className="h-8 object-contain" />
            ) : (
              <span className="font-bold">{tenant?.name || 'Your Site'}</span>
            )}
            <div className="flex gap-4 text-sm">
              <span>Home</span>
              <span>News</span>
              <span>Contact</span>
            </div>
          </div>
          <div className="bg-white p-6">
            <div className="flex gap-4">
              <button style={{ backgroundColor: form.primaryColor }} className="px-4 py-2 text-white rounded text-sm">Primary</button>
              <button style={{ backgroundColor: form.secondaryColor }} className="px-4 py-2 rounded text-sm">Secondary</button>
              <button style={{ backgroundColor: form.accentColor }} className="px-4 py-2 text-white rounded text-sm">Accent</button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          disabled={saving}
          className="px-6 py-2.5 bg-brand text-white rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Branding'}
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// CATEGORIES TAB
// ============================================================================
function CategoriesTab({ tenant, onRefresh }) {
  const [allCategories, setAllCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`${getApiBase()}/api/v1/categories`)
      const json = await res.json()
      setAllCategories(Array.isArray(json) ? json : json?.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const linkedIds = new Set((tenant?.categories || []).map(c => c.id || c.categoryId))

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Icons.Grid}
        title="Content Categories"
        subtitle="Link global categories to this tenant"
      />

      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-sm text-slate-600">Linked: </span>
            <span className="font-semibold">{linkedIds.size} categories</span>
          </div>
          <button
            onClick={loadCategories}
            className="flex items-center gap-2 text-sm text-brand hover:underline"
          >
            <Icons.Refresh /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {allCategories.map(cat => (
              <label
                key={cat.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  linkedIds.has(cat.id) 
                    ? 'border-brand bg-brand/5 ring-1 ring-brand' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={linkedIds.has(cat.id)}
                  onChange={() => {}}
                  className="w-4 h-4 rounded border-slate-300 text-brand"
                />
                <span className="text-sm font-medium text-slate-700">{cat.name || cat.slug}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function TenantCommandCenter({ tenantId }) {
  const router = useRouter()
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const fetchTenant = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch(`${getApiBase()}/api/v1/tenants/${tenantId}`)
      if (!res.ok) throw new Error('Failed to load tenant')
      const data = await res.json()
      setTenant(data?.data || data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchTenant()
  }, [fetchTenant])

  // Calculate statuses for each section
  const statuses = {
    entity: tenant?.entity?.id ? 'configured' : 'pending',
    domains: tenant?.domains?.some(d => d.isPrimary) ? 'configured' : tenant?.domains?.length ? 'partial' : 'pending',
    branding: tenant?.settings?.branding?.logoUrl ? 'configured' : 'pending',
    categories: tenant?.categories?.length ? 'configured' : 'pending',
    payments: tenant?.razorpayConfig?.id ? 'configured' : 'pending',
    idcards: tenant?.idCardSettings?.id ? 'configured' : 'pending',
    pages: 'pending',
    reporters: 'pending',
    seo: tenant?.metaTitle ? 'configured' : 'pending',
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab tenant={tenant} statuses={statuses} onNavigate={setActiveTab} />
      case 'domains':
        return <DomainsTab tenant={tenant} onRefresh={fetchTenant} />
      case 'branding':
        return <BrandingTab tenant={tenant} onRefresh={fetchTenant} />
      case 'categories':
        return <CategoriesTab tenant={tenant} onRefresh={fetchTenant} />
      case 'entity':
        return <PlaceholderTab title="Business Entity" icon={Icons.Building} tenant={tenant} onRefresh={fetchTenant} />
      case 'payments':
        return <PlaceholderTab title="Payment Settings" icon={Icons.CreditCard} tenant={tenant} onRefresh={fetchTenant} />
      case 'idcards':
        return <PlaceholderTab title="ID Card Settings" icon={Icons.IdCard} tenant={tenant} onRefresh={fetchTenant} />
      case 'pages':
        return <PlaceholderTab title="Legal Pages" icon={Icons.Document} tenant={tenant} onRefresh={fetchTenant} />
      case 'reporters':
        return <PlaceholderTab title="Reporters" icon={Icons.Users} tenant={tenant} onRefresh={fetchTenant} />
      case 'seo':
        return <PlaceholderTab title="SEO Settings" icon={Icons.Search} tenant={tenant} onRefresh={fetchTenant} />
      default:
        return null
    }
  }

  if (loading && !tenant) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand/30 border-t-brand rounded-full animate-spin mx-auto mb-3"></div>
          <div className="text-slate-500">Loading tenant...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-3">
            <Icons.Warning />
          </div>
          <div className="text-red-600 font-medium mb-2">Failed to load tenant</div>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <button onClick={fetchTenant} className="px-4 py-2 bg-brand text-white rounded-lg text-sm">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/dashboard?tab=tenants')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-2"
          >
            <Icons.ArrowLeft /> Back to Tenants
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{tenant?.name}</h1>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${tenant?.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {tenant?.isVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
          <div className="text-sm text-slate-500 mt-1">
            ID: <span className="font-mono">{tenantId}</span>
            {tenant?.entity?.prgi && (
              <> • PRGI: <span className="font-mono">{tenant.entity.prgi}</span></>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTenant}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-slate-50"
          >
            <Icons.Refresh /> Refresh
          </button>
          {tenant?.domains?.[0] && (
            <a
              href={`https://${tenant.domains[0].domain}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90"
            >
              <Icons.ExternalLink /> Visit Site
            </a>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border p-1.5 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(tab => {
            const TabIcon = tab.icon
            const status = statuses[tab.id]
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-brand text-white' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <TabIcon />
                <span>{tab.label}</span>
                {status && status !== 'configured' && activeTab !== tab.id && (
                  <span className={`w-2 h-2 rounded-full ${status === 'partial' ? 'bg-amber-400' : 'bg-slate-300'}`}></span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderTab()}
      </div>
    </div>
  )
}
