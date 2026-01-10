/**
 * TenantSettingsTab - Feature Flags & Settings Management
 * APIs:
 * - GET/PATCH /api/v1/tenants/:tenantId/feature-flags
 * - GET/PUT/PATCH settings at entity/tenant/domain levels
 */
import { useState, useEffect, useCallback } from 'react'
import { featureFlagsApi, settingsApi } from '../../../lib/api/tenantApi'

// Icons
const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const FlagIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

// Toggle Switch Component
function Toggle({ enabled, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${enabled ? 'bg-brand' : 'bg-slate-200'}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

// Feature Flag Card
function FeatureFlagCard({ flag, value, description, onChange, saving }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900">{flag.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</span>
          {saving && <span className="text-xs text-slate-400">Saving...</span>}
        </div>
        <p className="text-sm text-slate-500 mt-0.5">{description || `Enable or disable ${flag.toLowerCase()}`}</p>
      </div>
      <Toggle enabled={value} onChange={(v) => onChange(flag, v)} disabled={saving} />
    </div>
  )
}

// Common Feature Flags with descriptions (camelCase to match API)
const FEATURE_FLAG_DESCRIPTIONS = {
  enableEpaper: 'Enable E-Paper functionality for this tenant',
  enableAds: 'Show advertisements on tenant websites',
  enableComments: 'Allow users to comment on articles',
  enableSocialShare: 'Enable social media sharing buttons',
  enablePushNotifications: 'Enable push notifications for subscribers',
  enableNewsletter: 'Enable newsletter subscription feature',
  enableSearch: 'Enable site-wide search functionality',
  enableRelatedArticles: 'Show related articles on article pages',
  enableTrending: 'Show trending articles section',
  enableBreakingNews: 'Enable breaking news banner',
  enableVideo: 'Enable video content support',
  enableGallery: 'Enable photo gallery support',
  enablePolls: 'Enable polls functionality',
  enableLiveTv: 'Enable live TV streaming',
  enableDarkMode: 'Allow dark mode toggle for users',
  enableMultiLang: 'Enable multiple language support',
  enableReporterBylines: 'Show reporter names on articles',
  enableLocationFilter: 'Enable location-based filtering',
  aiArticleRewriteEnabled: 'Enable AI-powered article rewriting',
}

export default function TenantSettingsTab({ tenantContext }) {
  const { tenant, domains = [] } = tenantContext || {}
  const tenantId = tenant?.id
  
  const [activeSection, setActiveSection] = useState('flags')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [flags, setFlags] = useState({})
  const [savingFlag, setSavingFlag] = useState(null)
  
  // Settings layering state
  const [tenantSettings, setTenantSettings] = useState({})
  const [selectedDomain, setSelectedDomain] = useState(null)
  const [domainSettings, setDomainSettings] = useState({})
  const [savingSettings, setSavingSettings] = useState(false)
  
  // Load feature flags
  const loadFlags = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setError('')
    
    try {
      const data = await featureFlagsApi.get(tenantId)
      // Handle both array and object responses
      if (Array.isArray(data)) {
        const flagsObj = {}
        data.forEach(item => {
          flagsObj[item.flag || item.key || item.name] = item.enabled ?? item.value ?? false
        })
        setFlags(flagsObj)
      } else if (data?.data) {
        setFlags(data.data)
      } else {
        setFlags(data || {})
      }
    } catch (e) {
      if (!e.message.includes('404')) {
        setError('Failed to load feature flags')
      }
      setFlags({})
    } finally {
      setLoading(false)
    }
  }, [tenantId])
  
  // Load tenant settings
  const loadTenantSettings = useCallback(async () => {
    if (!tenantId) return
    try {
      const data = await settingsApi.tenant.get(tenantId)
      setTenantSettings(data || {})
    } catch (e) {
      console.error('Failed to load tenant settings', e)
    }
  }, [tenantId])
  
  // Load domain settings
  const loadDomainSettings = useCallback(async (domainId) => {
    if (!tenantId || !domainId) return
    try {
      const data = await settingsApi.domain.get(tenantId, domainId)
      setDomainSettings(data || {})
    } catch (e) {
      console.error('Failed to load domain settings', e)
      setDomainSettings({})
    }
  }, [tenantId])
  
  useEffect(() => {
    loadFlags()
    loadTenantSettings()
  }, [loadFlags, loadTenantSettings])
  
  useEffect(() => {
    if (selectedDomain) {
      loadDomainSettings(selectedDomain)
    }
  }, [selectedDomain, loadDomainSettings])

  // Update a single flag
  const handleFlagChange = async (flag, value) => {
    setSavingFlag(flag)
    setError('')
    setSuccess('')
    
    try {
      await featureFlagsApi.patch(tenantId, { [flag]: value })
      setFlags(prev => ({ ...prev, [flag]: value }))
      setSuccess('Setting updated!')
      setTimeout(() => setSuccess(''), 2000)
    } catch (e) {
      setError(e.message || 'Failed to update')
      // Revert the toggle
      setFlags(prev => ({ ...prev, [flag]: !value }))
    } finally {
      setSavingFlag(null)
    }
  }
  
  // Save tenant settings
  const handleSaveTenantSettings = async () => {
    setSavingSettings(true)
    setError('')
    try {
      await settingsApi.tenant.patch(tenantId, tenantSettings)
      setSuccess('Tenant settings saved!')
      setTimeout(() => setSuccess(''), 2000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSavingSettings(false)
    }
  }
  
  // Save domain settings
  const handleSaveDomainSettings = async () => {
    if (!selectedDomain) return
    setSavingSettings(true)
    setError('')
    try {
      await settingsApi.domain.patch(tenantId, selectedDomain, domainSettings)
      setSuccess('Domain settings saved!')
      setTimeout(() => setSuccess(''), 2000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSavingSettings(false)
    }
  }

  // Group flags by category (using camelCase to match API)
  const groupedFlags = {
    'Content Features': ['enableVideo', 'enableGallery', 'enablePolls', 'enableEpaper', 'enableLiveTv'],
    'User Engagement': ['enableComments', 'enableSocialShare', 'enablePushNotifications', 'enableNewsletter'],
    'Display Options': ['enableAds', 'enableTrending', 'enableBreakingNews', 'enableRelatedArticles', 'enableDarkMode'],
    'Advanced': ['enableSearch', 'enableMultiLang', 'enableReporterBylines', 'enableLocationFilter', 'aiArticleRewriteEnabled'],
  }

  // Get all unique flags (from API + known flags)
  const allFlags = new Set([...Object.keys(flags), ...Object.values(groupedFlags).flat()])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center text-brand">
            <SettingsIcon />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Settings & Feature Flags</h2>
            <p className="text-sm text-slate-500">Configure tenant behavior and features</p>
          </div>
        </div>
      </div>
      
      {/* Section Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'flags', label: 'Feature Flags', icon: <FlagIcon /> },
          { id: 'tenant', label: 'Tenant Settings', icon: <SettingsIcon /> },
          { id: 'domain', label: 'Domain Settings', icon: <SettingsIcon /> },
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
              activeSection === section.id
                ? 'border-brand text-brand'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {section.icon}
            {section.label}
          </button>
        ))}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-600 flex items-center gap-2">
          <CheckIcon />
          {success}
        </div>
      )}

      {/* Feature Flags Section */}
      {activeSection === 'flags' && (
        <>
          {Object.entries(groupedFlags).map(([category, categoryFlags]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <FlagIcon />
                {category}
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {categoryFlags.map(flag => (
                  <FeatureFlagCard
                    key={flag}
                    flag={flag}
                    value={flags[flag] ?? false}
                    description={FEATURE_FLAG_DESCRIPTIONS[flag]}
                    onChange={handleFlagChange}
                    saving={savingFlag === flag}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Custom/Unknown Flags from API */}
          {Object.keys(flags).filter(flag => !Object.values(groupedFlags).flat().includes(flag)).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <FlagIcon />
                Other Settings
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.keys(flags)
                  .filter(flag => !Object.values(groupedFlags).flat().includes(flag))
                  .map(flag => (
                    <FeatureFlagCard
                      key={flag}
                      flag={flag}
                      value={flags[flag] ?? false}
                      description={null}
                      onChange={handleFlagChange}
                      saving={savingFlag === flag}
                    />
                  ))}
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Tenant Settings Section */}
      {activeSection === 'tenant' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-medium text-slate-900 mb-4">Tenant-Level Settings</h3>
            <p className="text-sm text-slate-500 mb-4">
              These settings override entity defaults and apply to all domains under this tenant.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { key: 'articlesPerPage', label: 'Articles Per Page', type: 'number' },
                { key: 'defaultLanguage', label: 'Default Language', type: 'text' },
                { key: 'timezone', label: 'Timezone', type: 'text' },
                { key: 'dateFormat', label: 'Date Format', type: 'text' },
              ].map((setting) => (
                <div key={setting.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{setting.label}</label>
                  <input
                    type={setting.type}
                    value={tenantSettings[setting.key] || ''}
                    onChange={e => setTenantSettings({ ...tenantSettings, [setting.key]: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t flex justify-end">
              <button
                onClick={handleSaveTenantSettings}
                disabled={savingSettings}
                className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50 flex items-center gap-2"
              >
                {savingSettings ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    Saving...
                  </>
                ) : 'Save Tenant Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Domain Settings Section */}
      {activeSection === 'domain' && (
        <div className="space-y-4">
          {/* Domain Selector */}
          <div className="bg-white rounded-xl border p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Domain</label>
            <select
              value={selectedDomain || ''}
              onChange={e => setSelectedDomain(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
            >
              <option value="">Choose a domain...</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.domain || d.hostname} {d.verified ? '✓' : '(unverified)'}
                </option>
              ))}
            </select>
          </div>
          
          {selectedDomain && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-medium text-slate-900 mb-4">Domain-Specific Settings</h3>
              <p className="text-sm text-slate-500 mb-4">
                These settings apply only to this specific domain and override tenant settings.
              </p>
              
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { key: 'siteTitle', label: 'Site Title', type: 'text' },
                  { key: 'metaDescription', label: 'Meta Description', type: 'text' },
                  { key: 'primaryColor', label: 'Primary Color', type: 'color' },
                  { key: 'articlesPerPage', label: 'Articles Per Page', type: 'number' },
                ].map((setting) => (
                  <div key={setting.key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{setting.label}</label>
                    <input
                      type={setting.type}
                      value={domainSettings[setting.key] || ''}
                      onChange={e => setDomainSettings({ ...domainSettings, [setting.key]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                    />
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t flex justify-end">
                <button
                  onClick={handleSaveDomainSettings}
                  disabled={savingSettings}
                  className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-50 flex items-center gap-2"
                >
                  {savingSettings ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                      Saving...
                    </>
                  ) : 'Save Domain Settings'}
                </button>
              </div>
            </div>
          )}
          
          {!selectedDomain && domains.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
              No domains configured for this tenant. Add domains first in the Domains tab.
            </div>
          )}
        </div>
      )}

      {/* Settings Layering Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-medium text-blue-900 mb-2">About Settings Layering</h4>
        <p className="text-sm text-blue-800">
          Settings are applied in layers: <strong>Entity → Tenant → Domain</strong>. 
          Entity settings are the base, tenant settings override them, and domain-specific 
          settings have the highest priority.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 bg-white rounded text-blue-700">Entity: Base defaults</span>
          <span className="px-2 py-1 bg-white rounded text-blue-700">Tenant: Per-tenant overrides</span>
          <span className="px-2 py-1 bg-white rounded text-blue-700">Domain: Per-domain specifics</span>
        </div>
      </div>
    </div>
  )
}
