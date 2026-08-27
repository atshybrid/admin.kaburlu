/**
 * Modern Domains Tab - Domain management for tenant
 */
import { useState, useEffect, useCallback } from 'react'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'
import Spinner from '../../ui/Spinner'
import Badge from '../../ui/Badge'
import ImageUpload from '../../ui/ImageUpload'
import { domainsApi } from '../../../lib/api/services/domainsApi'
import { domainSettingsApi } from '../../../lib/api/services/domainSettingsApi'
import epaperSettingsApi from '../../../lib/api/services/epaperSettingsApi'

const VERIFICATION_METHODS = [
  { value: 'DNS_TXT', label: 'DNS TXT Record' },
  { value: 'DNS_CNAME', label: 'DNS CNAME Record' },
  { value: 'HTTP_FILE', label: 'HTTP File Upload' },
]

export default function ModernDomainsTab({ tenantId }) {
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState(null)

  const loadDomains = useCallback(async () => {
    setLoading(true)
    try {
      console.log('Loading domains for tenant:', tenantId)
      const tenantDomains = await domainsApi.list(tenantId)
      console.log('Domains response:', tenantDomains)
      setDomains(tenantDomains || [])
    } catch (err) {
      console.error('Failed to load domains:', err)
      setDomains([])
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    loadDomains()
  }, [loadDomains])

  const handleAddEpaper = async () => {
    const newsDomain = domains.find(d => d.kind === 'NEWS')
    if (!newsDomain || !newsDomain.domain) {
      alert('Primary domain not found')
      return
    }

    const epaperDomain = `epaper.${newsDomain.domain}`
    
    try {
      await domainsApi.create(tenantId, {
        domain: epaperDomain,
        isPrimary: false
      })
      await loadDomains()
    } catch (err) {
      alert('Failed to add ePaper domain: ' + err.message)
    }
  }

  const handleVerify = (domain) => {
    setSelectedDomain(domain)
    setShowVerifyModal(true)
  }

  const handleOpenSettings = (domain) => {
    setSelectedDomain(domain)
    setShowSettingsModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  const newsDomain = domains.find(d => d.kind === 'NEWS')
  const epaperDomain = domains.find(d => d.kind === 'EPAPER')
  const hasNewsDomain = !!newsDomain
  const newsIsVerified = newsDomain?.status === 'ACTIVE'
  const canAddEpaper = newsIsVerified && !epaperDomain

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Domains</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your publication domains</p>
        </div>
        <div className="flex gap-2">
          {!hasNewsDomain && (
            <Button onClick={() => setShowAddModal(true)}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Domain
            </Button>
          )}
          {canAddEpaper && (
            <Button onClick={handleAddEpaper} variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Add ePaper
            </Button>
          )}
        </div>
      </div>

      {/* Info Banner */}
      {!hasNewsDomain && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">Add your primary domain first</p>
              <p className="text-sm text-blue-700 mt-1">Your primary NEWS domain must be verified before you can add an ePaper subdomain.</p>
            </div>
          </div>
        </div>
      )}

      {newsIsVerified && !epaperDomain && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Primary domain verified!</p>
              <p className="text-sm text-green-700 mt-1">You can now add an ePaper subdomain (epaper.{newsDomain.domain})</p>
            </div>
          </div>
        </div>
      )}

      {/* Domains List */}
      {domains.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-gray-900">No domains configured</h3>
          <p className="mt-2 text-sm text-gray-500">Get started by adding your primary domain</p>
          <Button className="mt-4" onClick={() => setShowAddModal(true)}>
            Add Domain
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {domains.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              onVerify={() => handleVerify(domain)}
              onSettings={() => handleOpenSettings(domain)}
              onRefresh={loadDomains}
            />
          ))}
        </div>
      )}

      {/* Add Domain Modal */}
      <AddDomainModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadDomains}
        tenantId={tenantId}
      />

      {/* Verify Domain Modal */}
      {selectedDomain && (
        <VerifyDomainModal
          isOpen={showVerifyModal}
          onClose={() => {
            setShowVerifyModal(false)
            setSelectedDomain(null)
          }}
          onSuccess={loadDomains}
          domain={selectedDomain}
        />
      )}

      {/* Domain Settings Modal */}
      {selectedDomain && (
        <DomainSettingsModal
          isOpen={showSettingsModal}
          onClose={() => {
            setShowSettingsModal(false)
            setSelectedDomain(null)
          }}
          tenantId={tenantId}
          domain={selectedDomain}
        />
      )}
    </div>
  )
}

function DomainCard({ domain, onVerify, onSettings, onRefresh }) {
  const isActive = domain.status === 'ACTIVE'
  const isPending = domain.status === 'PENDING'

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium text-gray-900">{domain.domain}</h3>
            <Badge variant={isActive ? 'success' : isPending ? 'warning' : 'default'}>
              {domain.status}
            </Badge>
            <Badge variant={domain.kind === 'NEWS' ? 'primary' : 'info'}>
              {domain.kind}
            </Badge>
            {domain.isPrimary && (
              <Badge variant="default">Primary</Badge>
            )}
          </div>

          {domain.verifiedAt && (
            <p className="text-sm text-gray-500 mt-1">
              Verified on {new Date(domain.verifiedAt).toLocaleDateString()}
            </p>
          )}

          {isPending && domain.verificationToken && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">DNS Verification Required</p>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Record Type:</span>
                  <code className="ml-2 px-2 py-1 bg-white rounded text-xs">{domain.verificationMethod || 'DNS_TXT'}</code>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <code className="ml-2 px-2 py-1 bg-white rounded text-xs">_kaburlu-verify.{domain.domain}</code>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Value:</span>
                  <code className="ml-2 px-2 py-1 bg-white rounded text-xs">{domain.verificationToken}</code>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {isPending && (
            <Button size="sm" onClick={onVerify}>
              Verify Domain
            </Button>
          )}
          {isActive && (
            <Button size="sm" variant="outline" onClick={onSettings}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function AddDomainModal({ isOpen, onClose, onSuccess, tenantId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [domain, setDomain] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await domainsApi.create(tenantId, {
        domain: domain,
        isPrimary: true // Always true for primary NEWS domain
      })
      onSuccess()
      onClose()
      setDomain('')
    } catch (err) {
      setError(err.message || 'Failed to add domain')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Primary Domain">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Domain Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="example.com"
          />
          <p className="text-xs text-gray-500 mt-1">This will be your primary NEWS domain</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Adding...' : 'Add Domain'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function VerifyDomainModal({ isOpen, onClose, onSuccess, domain }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [method, setMethod] = useState('DNS_TXT')
  const [force, setForce] = useState(true)

  const handleVerify = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await domainsApi.verify(domain.id, { method, force })
      
      if (result.ok) {
        onSuccess()
        onClose()
      } else {
        setError('Verification failed. Please check your DNS records.')
      }
    } catch (err) {
      setError(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verify Domain">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Verify ownership of <strong>{domain.domain}</strong>
          </p>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Method
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {VERIFICATION_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="force"
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="force" className="ml-2 text-sm text-gray-700">
            Force verification (skip DNS propagation wait)
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button onClick={handleVerify} disabled={loading} className="flex-1">
            {loading ? 'Verifying...' : 'Verify Now'}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function DomainSettingsModal({ isOpen, onClose, tenantId, domain }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatingSeo, setGeneratingSeo] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('branding')
  const isEpaper = domain?.kind === 'EPAPER'
  
  const [settings, setSettings] = useState({
    themeStyle: 'style1',
    epaper: {
      type: 'PDF',
      multiEditionEnabled: true
    },
    branding: {
      logoUrl: '',
      faviconUrl: '',
      siteName: ''
    },
    theme: {
      colors: {
        primary: '#3F51B5',
        secondary: '#CDDC39',
        accent: '#4CAF50'
      },
      typography: {
        fontFamily: 'Roboto, sans-serif'
      }
    },
    layout: {
      header: 'centered',
      footer: 'full-width',
      showTicker: true,
      showTopBar: true
    },
    seo: {
      canonicalBaseUrl: '',
      defaultMetaTitle: '',
      defaultMetaDescription: '',
      keywords: '',
      ogImageUrl: '',
      ogTitle: '',
      ogDescription: '',
      homepageH1: '',
      tagline: '',
      robots: 'index,follow',
      robotsTxt: '',
      sitemapEnabled: true,
      organization: {
        name: '',
        logo: ''
      },
      socialLinks: []
    },
    integrations: {
      analytics: {
        googleAnalyticsMeasurementId: '',
        googleTagManagerId: ''
      },
      searchConsole: {
        googleSiteVerification: '',
        bingSiteVerification: ''
      },
      ads: {
        adsenseClientId: '',
        googleAdsConversionId: '',
        googleAdsConversionLabel: '',
        adManagerNetworkCode: ''
      },
      push: {
        webPushVapidPublicKey: '',
        fcmSenderId: ''
      },
      googlePublisher: {
        enabled: false,
        publicationId: '',
        subscribeWithGoogleProductId: '',
        swgTheme: 'light',
        swgLang: 'te',
      }
    }
  })

  const loadSettings = async () => {
    setLoading(true)
    setError('')
    try {
      let data
      if (isEpaper) {
        data = await epaperSettingsApi.get(tenantId, domain.id)
      } else {
        data = await domainSettingsApi.get(tenantId, domain.id)
      }
      
      if (data.settings) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...data.settings,
          themeStyle: data.settings.themeStyle || prevSettings.themeStyle || 'style1',
          branding: { ...prevSettings.branding, ...data.settings.branding },
          theme: { 
            ...prevSettings.theme, 
            ...data.settings.theme,
            colors: { ...prevSettings.theme.colors, ...data.settings.theme?.colors }
          },
          seo: { 
            ...prevSettings.seo, 
            ...data.settings.seo,
            organization: { ...prevSettings.seo.organization, ...data.settings.seo?.organization }
          },
          integrations: {
            ...prevSettings.integrations,
            ...data.settings.integrations,
            analytics: { ...prevSettings.integrations.analytics, ...data.settings.integrations?.analytics },
            searchConsole: { ...prevSettings.integrations.searchConsole, ...data.settings.integrations?.searchConsole },
            ads: { ...prevSettings.integrations.ads, ...data.settings.integrations?.ads },
            push: { ...prevSettings.integrations.push, ...data.settings.integrations?.push },
            googlePublisher: { ...prevSettings.integrations.googlePublisher, ...data.settings.integrations?.googlePublisher }
          }
        }))
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
      setError(err.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && domain) {
      loadSettings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, domain])

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      if (isEpaper) {
        await epaperSettingsApi.update(tenantId, domain.id, settings, true)
      } else {
        const payload = activeTab === 'integrations'
          ? { integrations: settings.integrations }
          : settings
        await domainSettingsApi.update(tenantId, domain.id, payload)
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleAutoGenerateSeo = async () => {
    if (!isEpaper) return
    
    setGeneratingSeo(true)
    setError('')

    try {
      const data = await epaperSettingsApi.autoGenerateSeo(tenantId, domain.id)
      if (data.settings?.seo) {
        setSettings(prev => ({
          ...prev,
          seo: { ...prev.seo, ...data.settings.seo }
        }))
      }
    } catch (err) {
      setError(err.message || 'Failed to generate SEO')
    } finally {
      setGeneratingSeo(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${domain?.kind} Domain Settings`} size="large">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex gap-1 overflow-x-auto">
              {['branding', 'theme', 'seo', 'social', isEpaper && 'layout', 'integrations', 'advanced'].filter(Boolean).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {tab === 'seo' ? 'SEO' : tab === 'integrations' ? 'Integrations' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="max-h-[60vh] overflow-y-auto px-1">
            {/* Branding Tab */}
            {activeTab === 'branding' && (
              <div className="space-y-6">
                {isEpaper && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">ePaper Configuration</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                        <select
                          value={settings.epaper.type}
                          onChange={(e) => setSettings({
                            ...settings,
                            epaper: { ...settings.epaper, type: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 outline-none"
                        >
                          <option value="PDF">PDF</option>
                          <option value="BLOCK">BLOCK</option>
                        </select>
                      </div>

                      <div className="flex items-center">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.epaper.multiEditionEnabled}
                            onChange={(e) => setSettings({
                              ...settings,
                              epaper: { ...settings.epaper, multiEditionEnabled: e.target.checked }
                            })}
                            className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Multi-Edition Enabled</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Site Name</label>
                  <input
                    type="text"
                    value={settings.branding.siteName}
                    onChange={(e) => setSettings({
                      ...settings,
                      branding: { ...settings.branding, siteName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 outline-none"
                    placeholder={`${domain?.kind === 'EPAPER' ? 'Kaburlu ePaper' : 'Kaburlu News'}`}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">The public-facing name of your website</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Logo</label>
                  <ImageUpload
                    value={settings.branding.logoUrl}
                    onChange={(url) => setSettings({
                      ...settings,
                      branding: { ...settings.branding, logoUrl: url }
                    })}
                    folder="logos"
                    label="Upload Logo"
                    maxSizeMB={2}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Recommended: PNG with transparent background, 300x80px</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Favicon</label>
                  <ImageUpload
                    value={settings.branding.faviconUrl}
                    onChange={(url) => setSettings({
                      ...settings,
                      branding: { ...settings.branding, faviconUrl: url }
                    })}
                    folder="favicons"
                    label="Upload Favicon"
                    maxSizeMB={1}
                    accept="image/x-icon,image/png"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Recommended: ICO or PNG, 32x32px or 64x64px</p>
                </div>
              </div>
            )}

            {/* Theme Tab */}
            {activeTab === 'theme' && (
              <div className="space-y-6">
                {/* Theme Style Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Theme Style</label>
                  <select
                    value={settings.themeStyle || 'style1'}
                    onChange={(e) => setSettings({ ...settings, themeStyle: e.target.value })}
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 outline-none"
                  >
                    <option value="style1">Style 1</option>
                    <option value="style2">Style 2</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose the overall design theme for your website</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Brand Colors</h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.theme.colors.primary}
                          onChange={(e) => setSettings({
                            ...settings,
                            theme: { ...settings.theme, colors: { ...settings.theme.colors, primary: e.target.value } }
                          })}
                          className="w-14 h-14 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={settings.theme.colors.primary}
                            onChange={(e) => setSettings({
                              ...settings,
                              theme: { ...settings.theme, colors: { ...settings.theme.colors, primary: e.target.value } }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 outline-none font-mono text-sm"
                            placeholder="#3F51B5"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Main brand color</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Secondary Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.theme.colors.secondary}
                          onChange={(e) => setSettings({
                            ...settings,
                            theme: { ...settings.theme, colors: { ...settings.theme.colors, secondary: e.target.value } }
                          })}
                          className="w-14 h-14 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={settings.theme.colors.secondary}
                            onChange={(e) => setSettings({
                              ...settings,
                              theme: { ...settings.theme, colors: { ...settings.theme.colors, secondary: e.target.value } }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 outline-none font-mono text-sm"
                            placeholder="#CDDC39"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Accent/highlight color</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Accent Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.theme.colors.accent}
                          onChange={(e) => setSettings({
                            ...settings,
                            theme: { ...settings.theme, colors: { ...settings.theme.colors, accent: e.target.value } }
                          })}
                          className="w-14 h-14 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={settings.theme.colors.accent}
                            onChange={(e) => setSettings({
                              ...settings,
                              theme: { ...settings.theme, colors: { ...settings.theme.colors, accent: e.target.value } }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 outline-none font-mono text-sm"
                            placeholder="#4CAF50"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">CTA/button color</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Typography</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                    <select
                      value={settings.theme.typography.fontFamily}
                      onChange={(e) => setSettings({
                        ...settings,
                        theme: { ...settings.theme, typography: { ...settings.theme.typography, fontFamily: e.target.value } }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="Roboto, sans-serif">Roboto</option>
                      <option value="Open Sans, sans-serif">Open Sans</option>
                      <option value="Lato, sans-serif">Lato</option>
                      <option value="Montserrat, sans-serif">Montserrat</option>
                      <option value="Poppins, sans-serif">Poppins</option>
                      <option value="Inter, sans-serif">Inter</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="Times New Roman, serif">Times New Roman</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Configure meta tags and search engine visibility</p>
                  {isEpaper && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAutoGenerateSeo}
                      disabled={generatingSeo}
                    >
                      {generatingSeo ? 'Generating...' : '✨ AI Generate'}
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Canonical Base URL</label>
                    <input
                      type="url"
                      value={settings.seo.canonicalBaseUrl}
                      onChange={(e) => setSettings({
                        ...settings,
                        seo: { ...settings.seo, canonicalBaseUrl: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder={`https://${domain?.domain}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Keywords</label>
                    <input
                      type="text"
                      value={settings.seo.keywords}
                      onChange={(e) => setSettings({
                        ...settings,
                        seo: { ...settings.seo, keywords: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="news, epaper, local"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Meta Title</label>
                  <input
                    type="text"
                    value={settings.seo.defaultMetaTitle}
                    onChange={(e) => setSettings({
                      ...settings,
                      seo: { ...settings.seo, defaultMetaTitle: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Kaburlu News - Latest Breaking News"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500 mt-1">{settings.seo.defaultMetaTitle?.length || 0}/60 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Meta Description</label>
                  <textarea
                    value={settings.seo.defaultMetaDescription}
                    onChange={(e) => setSettings({
                      ...settings,
                      seo: { ...settings.seo, defaultMetaDescription: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    placeholder="Read the latest breaking news, headlines and updates from your trusted local news source"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">{settings.seo.defaultMetaDescription?.length || 0}/160 characters</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Homepage H1</label>
                    <input
                      type="text"
                      value={settings.seo.homepageH1}
                      onChange={(e) => setSettings({
                        ...settings,
                        seo: { ...settings.seo, homepageH1: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Kaburlu News"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Tagline</label>
                    <input
                      type="text"
                      value={settings.seo.tagline}
                      onChange={(e) => setSettings({
                        ...settings,
                        seo: { ...settings.seo, tagline: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Your trusted news source"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Open Graph Image</label>
                  <ImageUpload
                    value={settings.seo.ogImageUrl}
                    onChange={(url) => setSettings({
                      ...settings,
                      seo: { ...settings.seo, ogImageUrl: url }
                    })}
                    folder="og-images"
                    label="Upload OG Image"
                    maxSizeMB={3}
                  />
                  <p className="text-xs text-gray-500 mt-2">Recommended: 1200x630px for social media sharing</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Organization Name</label>
                    <input
                      type="text"
                      value={settings.seo.organization?.name || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        seo: { ...settings.seo, organization: { ...settings.seo.organization, name: e.target.value } }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Kaburlu Media"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Organization Logo URL</label>
                    <input
                      type="text"
                      value={settings.seo.organization?.logo || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        seo: { ...settings.seo, organization: { ...settings.seo.organization, logo: e.target.value } }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="https://cdn.example.com/logo.png"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.seo.sitemapEnabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        seo: { ...settings.seo, sitemapEnabled: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 font-medium">Enable Sitemap</span>
                  </label>

                  <div className="flex-1">
                    <input
                      type="text"
                      value={settings.seo.robots}
                      onChange={(e) => setSettings({
                        ...settings,
                        seo: { ...settings.seo, robots: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="index, follow"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Social Tab */}
            {activeTab === 'social' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">Add your social media profile URLs for better engagement</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Social Media Links</label>
                  <textarea
                    value={(settings.seo.socialLinks || []).join('\n')}
                    onChange={(e) => {
                      const links = e.target.value.split(/[\n,]+/).map(l => l.trim()).filter(Boolean)
                      setSettings({
                        ...settings,
                        seo: { ...settings.seo, socialLinks: links }
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-mono text-sm"
                    placeholder="https://facebook.com/yourpage&#10;https://twitter.com/yourhandle&#10;https://instagram.com/yourprofile&#10;https://youtube.com/@yourchannel&#10;https://linkedin.com/company/yourcompany"
                    rows={8}
                  />
                  <p className="text-xs text-gray-500 mt-2">Enter one URL per line or separate with commas</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {(settings.seo.socialLinks || []).map((link, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-xs text-gray-600 truncate flex-1">{link}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Layout Tab (EPAPER only) */}
            {activeTab === 'layout' && isEpaper && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Header Style</label>
                    <select
                      value={settings.layout.header}
                      onChange={(e) => setSettings({
                        ...settings,
                        layout: { ...settings.layout, header: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="centered">Centered</option>
                      <option value="left">Left Aligned</option>
                      <option value="right">Right Aligned</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Header alignment on pages</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Footer Style</label>
                    <select
                      value={settings.layout.footer}
                      onChange={(e) => setSettings({
                        ...settings,
                        layout: { ...settings.layout, footer: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="full-width">Full Width</option>
                      <option value="compact">Compact</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Footer layout style</p>
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900">Display Options</h4>
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.layout.showTicker}
                        onChange={(e) => setSettings({
                          ...settings,
                          layout: { ...settings.layout, showTicker: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show Breaking News Ticker</span>
                    </label>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.layout.showTopBar}
                        onChange={(e) => setSettings({
                          ...settings,
                          layout: { ...settings.layout, showTopBar: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show Top Bar (Social, Date, etc.)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Tab (NEWS) */}
            {activeTab === 'integrations' && !isEpaper && (
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    Domain-specific integrations for <strong>{domain?.domain}</strong>. Each news domain (e.g. daxintimes.com, kaburlutoday.com) has its own GA4, Search Console, and Publisher Center settings.
                  </p>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Google Analytics</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GA4 Measurement ID</label>
                    <input
                      type="text"
                      value={settings.integrations.analytics.googleAnalyticsMeasurementId}
                      onChange={(e) => setSettings({
                        ...settings,
                        integrations: {
                          ...settings.integrations,
                          analytics: { ...settings.integrations.analytics, googleAnalyticsMeasurementId: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="G-JSZZ5X81GK"
                    />
                  </div>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Google Search Console</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Google Site Verification</label>
                    <input
                      type="text"
                      value={settings.integrations.searchConsole.googleSiteVerification}
                      onChange={(e) => setSettings({
                        ...settings,
                        integrations: {
                          ...settings.integrations,
                          searchConsole: { ...settings.integrations.searchConsole, googleSiteVerification: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="abc123xyz"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Meta tag verification code from Google Search Console</p>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Google Publisher Center</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Subscribe with Google (SwG) for this news domain</p>
                  <div className="space-y-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.integrations.googlePublisher?.enabled)}
                        onChange={(e) => setSettings({
                          ...settings,
                          integrations: {
                            ...settings.integrations,
                            googlePublisher: { ...settings.integrations.googlePublisher, enabled: e.target.checked }
                          }
                        })}
                        className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Google Publisher Center</span>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Publication ID</label>
                        <input
                          type="text"
                          value={settings.integrations.googlePublisher?.publicationId || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            integrations: {
                              ...settings.integrations,
                              googlePublisher: { ...settings.integrations.googlePublisher, publicationId: e.target.value }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
                          placeholder="CAow3dXHDA"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subscribe with Google Product ID</label>
                        <input
                          type="text"
                          value={settings.integrations.googlePublisher?.subscribeWithGoogleProductId || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            integrations: {
                              ...settings.integrations,
                              googlePublisher: { ...settings.integrations.googlePublisher, subscribeWithGoogleProductId: e.target.value }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
                          placeholder="CAow3dXHDA:openaccess"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Copy from Publisher Center → Subscribe with Google</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SwG Theme</label>
                        <select
                          value={settings.integrations.googlePublisher?.swgTheme || 'light'}
                          onChange={(e) => setSettings({
                            ...settings,
                            integrations: {
                              ...settings.integrations,
                              googlePublisher: { ...settings.integrations.googlePublisher, swgTheme: e.target.value }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SwG Language</label>
                        <input
                          type="text"
                          value={settings.integrations.googlePublisher?.swgLang || 'te'}
                          onChange={(e) => setSettings({
                            ...settings,
                            integrations: {
                              ...settings.integrations,
                              googlePublisher: { ...settings.integrations.googlePublisher, swgLang: e.target.value }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="te"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">BCP-47 language code (e.g. te, en)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Tab (EPAPER) */}
            {activeTab === 'integrations' && isEpaper && (
              <div className="space-y-6">
                {/* Analytics */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Analytics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Google Analytics ID</label>
                      <input
                        type="text"
                        value={settings.integrations.analytics.googleAnalyticsMeasurementId}
                        onChange={(e) => setSettings({
                          ...settings,
                          integrations: {
                            ...settings.integrations,
                            analytics: { ...settings.integrations.analytics, googleAnalyticsMeasurementId: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="G-XXXXXXXXXX"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Google Tag Manager ID</label>
                      <input
                        type="text"
                        value={settings.integrations.analytics.googleTagManagerId}
                        onChange={(e) => setSettings({
                          ...settings,
                          integrations: {
                            ...settings.integrations,
                            analytics: { ...settings.integrations.analytics, googleTagManagerId: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="GTM-XXXXXXX"
                      />
                    </div>
                  </div>
                </div>

                {/* Search Console */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Search Console Verification</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Google Verification</label>
                      <input
                        type="text"
                        value={settings.integrations.searchConsole.googleSiteVerification}
                        onChange={(e) => setSettings({
                          ...settings,
                          integrations: {
                            ...settings.integrations,
                            searchConsole: { ...settings.integrations.searchConsole, googleSiteVerification: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="verification-code"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bing Verification</label>
                      <input
                        type="text"
                        value={settings.integrations.searchConsole.bingSiteVerification}
                        onChange={(e) => setSettings({
                          ...settings,
                          integrations: {
                            ...settings.integrations,
                            searchConsole: { ...settings.integrations.searchConsole, bingSiteVerification: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="verification-code"
                      />
                    </div>
                  </div>
                </div>

                {/* Ads */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Advertising</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">AdSense Client ID</label>
                      <input
                        type="text"
                        value={settings.integrations.ads.adsenseClientId}
                        onChange={(e) => setSettings({
                          ...settings,
                          integrations: {
                            ...settings.integrations,
                            ads: { ...settings.integrations.ads, adsenseClientId: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="ca-pub-1234567890"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Google Ads Conversion ID</label>
                      <input
                        type="text"
                        value={settings.integrations.ads.googleAdsConversionId}
                        onChange={(e) => setSettings({
                          ...settings,
                          integrations: {
                            ...settings.integrations,
                            ads: { ...settings.integrations.ads, googleAdsConversionId: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="AW-123456789"
                      />
                    </div>
                  </div>
                </div>

                {/* Push Notifications */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Push Notifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">VAPID Public Key</label>
                      <input
                        type="text"
                        value={settings.integrations.push.webPushVapidPublicKey}
                        onChange={(e) => setSettings({
                          ...settings,
                          integrations: {
                            ...settings.integrations,
                            push: { ...settings.integrations.push, webPushVapidPublicKey: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-xs"
                        placeholder="BFG1x2y3z4..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">FCM Sender ID</label>
                      <input
                        type="text"
                        value={settings.integrations.push.fcmSenderId}
                        onChange={(e) => setSettings({
                          ...settings,
                          integrations: {
                            ...settings.integrations,
                            push: { ...settings.integrations.push, fcmSenderId: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="123456789012"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">⚠️ Advanced settings - modify with caution</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Robots.txt Rules</label>
                  <textarea
                    value={settings.seo.robotsTxt || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      seo: { ...settings.seo, robotsTxt: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-mono text-sm"
                    placeholder="User-agent: *&#10;Allow: /&#10;Disallow: /api&#10;Sitemap: https://example.com/sitemap.xml"
                    rows={8}
                  />
                  <p className="text-xs text-gray-500 mt-2">Custom robots.txt content. Leave empty for auto-generated defaults.</p>
                </div>

                {isEpaper && (
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ad Manager Network Code</label>
                        <input
                          type="text"
                          value={settings.integrations.ads.adManagerNetworkCode || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            integrations: {
                              ...settings.integrations,
                              ads: { ...settings.integrations.ads, adManagerNetworkCode: e.target.value }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="12345678"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Google Ads Conversion Label</label>
                        <input
                          type="text"
                          value={settings.integrations.ads.googleAdsConversionLabel || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            integrations: {
                              ...settings.integrations,
                              ads: { ...settings.integrations.ads, googleAdsConversionLabel: e.target.value }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="AbC-DEfGHiJkLmN"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner className="w-4 h-4" />
                  Saving Settings...
                </span>
              ) : (
                'Save Settings'
              )}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
