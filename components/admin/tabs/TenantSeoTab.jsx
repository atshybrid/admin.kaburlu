/**
 * TenantSeoTab - Manage tenant SEO and meta settings
 */
import { useState, useEffect } from 'react'
import { getToken } from '../../../utils/auth'

// Use local proxy to avoid CORS
function getApiBase() {
  if (typeof window !== 'undefined') return '/api/proxy'
  return (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.kaburlumedia.com').replace(/\/$/, '') + '/api/v1'
}

// Icons
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const ShareIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
)

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const CogIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
)

const XCircleIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
)

// Character counter with color feedback
function CharCounter({ current, max, recommended }) {
  const percentage = (current / max) * 100
  const isGood = current >= recommended * 0.8 && current <= recommended
  const isWarn = current > recommended && current <= max
  
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all ${isGood ? 'bg-green-500' : isWarn ? 'bg-amber-500' : current > 0 ? 'bg-blue-500' : 'bg-slate-200'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${isGood ? 'text-green-600' : isWarn ? 'text-amber-600' : 'text-slate-400'}`}>
        {current}/{max}
      </span>
    </div>
  )
}

// Section Card component
function SectionCard({ icon, title, description, children, badge }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand/10 text-brand">
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">{title}</h3>
              {badge}
            </div>
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          </div>
        </div>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}

// Input Field component
function InputField({ label, hint, children }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {hint && <span className="text-xs font-normal text-slate-400">({hint})</span>}
      </label>
      {children}
    </div>
  )
}

export default function TenantSeoTab({ tenantContext }) {
  const { tenant, refreshTenant } = tenantContext
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('meta')
  
  const [form, setForm] = useState({
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterCard: 'summary_large_image',
    twitterHandle: '',
    googleAnalyticsId: '',
    facebookPixelId: '',
    robotsTxt: '',
    sitemapEnabled: true
  })

  useEffect(() => {
    if (tenant) {
      setForm(prev => ({
        ...prev,
        metaTitle: tenant.metaTitle || tenant.name || '',
        metaDescription: tenant.metaDescription || '',
        metaKeywords: tenant.metaKeywords || '',
        ogTitle: tenant.ogTitle || tenant.name || '',
        ogDescription: tenant.ogDescription || tenant.metaDescription || '',
        ogImage: tenant.ogImage || '',
        twitterCard: tenant.twitterCard || 'summary_large_image',
        twitterHandle: tenant.twitterHandle || '',
        googleAnalyticsId: tenant.googleAnalyticsId || '',
        facebookPixelId: tenant.facebookPixelId || '',
        robotsTxt: tenant.robotsTxt || '',
        sitemapEnabled: tenant.sitemapEnabled !== false
      }))
    }
  }, [tenant])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/api/v1/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      setSuccess('SEO settings saved successfully')
      refreshTenant()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Calculate SEO score
  const seoScore = (() => {
    let score = 0
    if (form.metaTitle && form.metaTitle.length >= 30) score += 20
    if (form.metaDescription && form.metaDescription.length >= 100) score += 20
    if (form.ogTitle) score += 15
    if (form.ogDescription) score += 15
    if (form.ogImage) score += 15
    if (form.googleAnalyticsId) score += 10
    if (form.sitemapEnabled) score += 5
    return score
  })()

  const tabs = [
    { id: 'meta', label: 'Meta Tags', icon: <SearchIcon /> },
    { id: 'social', label: 'Social', icon: <ShareIcon /> },
    { id: 'analytics', label: 'Analytics', icon: <ChartIcon /> },
    { id: 'advanced', label: 'Advanced', icon: <CogIcon /> },
  ]

  return (
    <div className="space-y-6">
      {/* Header with SEO Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">SEO & Meta Settings</h2>
          <p className="text-sm text-slate-500">Optimize your site for search engines and social sharing</p>
        </div>
        
        {/* SEO Score Widget */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90">
              <circle cx="24" cy="24" r="20" stroke="#e2e8f0" strokeWidth="4" fill="none" />
              <circle 
                cx="24" cy="24" r="20" 
                stroke={seoScore >= 80 ? '#22c55e' : seoScore >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="4" 
                fill="none"
                strokeDasharray={`${seoScore * 1.256} 125.6`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-700">
              {seoScore}
            </span>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">SEO Score</div>
            <div className={`text-xs ${seoScore >= 80 ? 'text-green-600' : seoScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
              {seoScore >= 80 ? 'Excellent' : seoScore >= 50 ? 'Good' : 'Needs work'}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          <XCircleIcon />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
          <CheckCircleIcon />
          {success}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>
        {/* Meta Tags Tab */}
        {activeTab === 'meta' && (
          <div className="space-y-6">
            <SectionCard
              icon={<SearchIcon />}
              title="Search Engine Optimization"
              description="These tags help search engines understand your content"
            >
              <div className="space-y-5">
                <InputField label="Page Title" hint="50-60 chars ideal">
                  <input
                    type="text"
                    value={form.metaTitle}
                    onChange={e => setForm({...form, metaTitle: e.target.value})}
                    placeholder="Your News Site - Latest Updates & Breaking News"
                    maxLength={70}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                  />
                  <CharCounter current={form.metaTitle.length} max={70} recommended={60} />
                </InputField>

                <InputField label="Meta Description" hint="150-160 chars ideal">
                  <textarea
                    value={form.metaDescription}
                    onChange={e => setForm({...form, metaDescription: e.target.value})}
                    placeholder="Write a compelling description that encourages users to click from search results..."
                    maxLength={200}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                  />
                  <CharCounter current={form.metaDescription.length} max={200} recommended={160} />
                </InputField>

                <InputField label="Keywords" hint="comma-separated">
                  <input
                    type="text"
                    value={form.metaKeywords}
                    onChange={e => setForm({...form, metaKeywords: e.target.value})}
                    placeholder="news, local updates, breaking stories, community"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                  />
                  {form.metaKeywords && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.metaKeywords.split(',').filter(k => k.trim()).slice(0, 8).map((keyword, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                          {keyword.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </InputField>
              </div>
            </SectionCard>

            {/* Live Preview */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Live Search Preview
              </h3>
              <div className="p-4 bg-slate-50 rounded-lg border">
                <div className="text-blue-700 text-lg hover:underline cursor-pointer font-medium">
                  {form.metaTitle || 'Your Page Title'}
                </div>
                <div className="text-green-700 text-sm mt-1 flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-slate-200 flex-shrink-0"></span>
                  {tenant?.domains?.[0]?.domain || 'example.com'}
                </div>
                <div className="text-slate-600 text-sm mt-1.5 line-clamp-2">
                  {form.metaDescription || 'Your page description will appear here in search results. Make it compelling!'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Social Tab */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <SectionCard
              icon={<ShareIcon />}
              title="Open Graph Settings"
              description="Control how your links appear when shared on social media"
            >
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="OG Title">
                    <input
                      type="text"
                      value={form.ogTitle}
                      onChange={e => setForm({...form, ogTitle: e.target.value})}
                      placeholder="Title for social shares"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                    />
                  </InputField>
                  <InputField label="Twitter Handle">
                    <input
                      type="text"
                      value={form.twitterHandle}
                      onChange={e => setForm({...form, twitterHandle: e.target.value})}
                      placeholder="@yourhandle"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                    />
                  </InputField>
                </div>

                <InputField label="OG Description">
                  <textarea
                    value={form.ogDescription}
                    onChange={e => setForm({...form, ogDescription: e.target.value})}
                    placeholder="Description that appears when your link is shared..."
                    rows={2}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                  />
                </InputField>

                <InputField label="OG Image URL" hint="1200x630 recommended">
                  <input
                    type="url"
                    value={form.ogImage}
                    onChange={e => setForm({...form, ogImage: e.target.value})}
                    placeholder="https://example.com/og-image.jpg"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                  />
                </InputField>

                <InputField label="Twitter Card Type">
                  <div className="flex gap-3">
                    {[
                      { value: 'summary', label: 'Summary', desc: 'Small image' },
                      { value: 'summary_large_image', label: 'Large Image', desc: 'Big preview' }
                    ].map(option => (
                      <label 
                        key={option.value}
                        className={`flex-1 p-3 border rounded-lg cursor-pointer transition-all ${
                          form.twitterCard === option.value 
                            ? 'border-brand bg-brand/5 ring-1 ring-brand' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="twitterCard"
                          value={option.value}
                          checked={form.twitterCard === option.value}
                          onChange={e => setForm({...form, twitterCard: e.target.value})}
                          className="sr-only"
                        />
                        <div className="text-sm font-medium text-slate-900">{option.label}</div>
                        <div className="text-xs text-slate-500">{option.desc}</div>
                      </label>
                    ))}
                  </div>
                </InputField>
              </div>
            </SectionCard>

            {/* Social Preview */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Social Share Preview
              </h3>
              <div className="max-w-md border rounded-xl overflow-hidden bg-white shadow-sm">
                {form.ogImage ? (
                  <div className="aspect-video bg-slate-100 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.ogImage} alt="OG preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="text-sm">No image set</div>
                    </div>
                  </div>
                )}
                <div className="p-3">
                  <div className="text-xs text-slate-500 uppercase tracking-wide">{tenant?.domains?.[0]?.domain || 'example.com'}</div>
                  <div className="font-semibold text-slate-900 mt-1">{form.ogTitle || form.metaTitle || 'Your Page Title'}</div>
                  <div className="text-sm text-slate-500 line-clamp-2 mt-0.5">{form.ogDescription || form.metaDescription || 'Description...'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <SectionCard
            icon={<ChartIcon />}
            title="Analytics & Tracking"
            description="Connect your analytics services to track visitor behavior"
          >
            <div className="space-y-5">
              <InputField label="Google Analytics ID">
                <div className="relative">
                  <input
                    type="text"
                    value={form.googleAnalyticsId}
                    onChange={e => setForm({...form, googleAnalyticsId: e.target.value})}
                    placeholder="G-XXXXXXXXXX or UA-XXXXXXXX-X"
                    className="w-full px-3 py-2.5 pl-10 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.84 9.76c.1.7.16 1.41.16 2.14 0 5.89-3.95 10.08-9.91 10.08A10 10 0 013.09 11.9a10 10 0 0110-10.08c2.7 0 5 .97 6.72 2.59l-2.72 2.72A5.67 5.67 0 0013.09 5.4a6.49 6.49 0 00-6.5 6.5c0 3.59 2.91 6.5 6.5 6.5 3.14 0 5.35-1.79 5.81-4.24h-5.81V9.76h9.75z"/>
                  </svg>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Find this in your Google Analytics admin panel</p>
              </InputField>

              <InputField label="Facebook Pixel ID">
                <div className="relative">
                  <input
                    type="text"
                    value={form.facebookPixelId}
                    onChange={e => setForm({...form, facebookPixelId: e.target.value})}
                    placeholder="XXXXXXXXXXXXXXXX"
                    className="w-full px-3 py-2.5 pl-10 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Find this in Facebook Events Manager</p>
              </InputField>

              {/* Status Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${form.googleAnalyticsId ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                  {form.googleAnalyticsId ? (
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <CheckCircleIcon />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                      <XCircleIcon />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-slate-900">Google Analytics</div>
                    <div className={`text-xs ${form.googleAnalyticsId ? 'text-green-600' : 'text-slate-500'}`}>
                      {form.googleAnalyticsId ? 'Connected' : 'Not connected'}
                    </div>
                  </div>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${form.facebookPixelId ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                  {form.facebookPixelId ? (
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <CheckCircleIcon />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                      <XCircleIcon />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-slate-900">Facebook Pixel</div>
                    <div className={`text-xs ${form.facebookPixelId ? 'text-green-600' : 'text-slate-500'}`}>
                      {form.facebookPixelId ? 'Connected' : 'Not connected'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <SectionCard
            icon={<CogIcon />}
            title="Advanced Settings"
            description="Technical SEO configurations for power users"
          >
            <div className="space-y-5">
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                  <input
                    type="checkbox"
                    checked={form.sitemapEnabled}
                    onChange={e => setForm({...form, sitemapEnabled: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                </label>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">Enable Sitemap</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Automatically generate sitemap.xml to help search engines discover your content
                  </div>
                  {form.sitemapEnabled && (
                    <div className="mt-2 text-xs text-brand font-medium">
                      ✓ Sitemap will be available at /sitemap.xml
                    </div>
                  )}
                </div>
              </div>

              <InputField label="Custom robots.txt" hint="optional">
                <textarea
                  value={form.robotsTxt}
                  onChange={e => setForm({...form, robotsTxt: e.target.value})}
                  placeholder={`User-agent: *\nAllow: /\n\nSitemap: https://yourdomain.com/sitemap.xml`}
                  rows={6}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Leave empty to use default robots.txt configuration
                </p>
              </InputField>
            </div>
          </SectionCard>
        )}

        {/* Save Button */}
        <div className="flex items-center justify-between pt-6 border-t mt-6">
          <div className="text-sm text-slate-500">
            {saving ? 'Saving changes...' : 'All changes are saved automatically'}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-brand/90 transition-colors shadow-sm"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <CheckCircleIcon />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
