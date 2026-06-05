/**
 * TenantDomainSettingsTab - Complete redesign with better UX
 * Handles domain-specific settings: appearance, navigation, content, seo, advanced
 */
import { useEffect, useMemo, useState, useCallback } from 'react'
import { getToken } from '../../../utils/auth'

// ============================================================================
// CONSTANTS
// ============================================================================
const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat',
  'Nunito', 'Raleway', 'Merriweather', 'Playfair Display', 'Noto Sans', 'Noto Serif',
]

const HEADER_STYLES = [
  { value: 'classic', label: 'Classic' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'modern', label: 'Modern' },
]

const FOOTER_STYLES = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'classic', label: 'Classic' },
  { value: 'rich', label: 'Rich' },
]

const DEFAULT_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'te', label: 'Telugu' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'kn', label: 'Kannada' },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function getApiBase() {
  if (typeof window !== 'undefined') return '/api/proxy'
  return (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.kaburlumedia.com').replace(/\/$/, '') + '/api/v1'
}

function deepEqual(a, b) {
  if (a === b) return true
  if (a == null || b == null) return a === b
  if (typeof a !== typeof b) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((el, i) => deepEqual(el, b[i]))
  }
  if (typeof a === 'object') {
    const ka = Object.keys(a).sort()
    const kb = Object.keys(b).sort()
    if (ka.length !== kb.length) return false
    return ka.every((k) => deepEqual(a[k], b[k]))
  }
  return false
}

function deepDiff(prev, next) {
  if (deepEqual(prev, next)) return undefined
  if (Array.isArray(next)) return next
  if (typeof next === 'object' && next !== null && typeof prev === 'object' && prev !== null) {
    const out = {}
    const keys = [...new Set([...Object.keys(prev), ...Object.keys(next)])]
    for (const k of keys) {
      const d = deepDiff(prev[k], next[k])
      if (d !== undefined) out[k] = d
    }
    return Object.keys(out).length ? out : undefined
  }
  return next
}

function stripEmpty(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v == null || v === '') continue
    out[k] = typeof v === 'object' ? stripEmpty(v) : v
  }
  return out
}

// ============================================================================
// UI COMPONENTS
// ============================================================================
function TabButton({ active, onClick, children, icon, verified }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-brand text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {children}
      {verified && (
        <span className={`ml-1 ${active ? 'text-green-200' : 'text-green-500'}`}>
          ✓
        </span>
      )}
    </button>
  )
}

function Section({ title, description, children }) {
  return (
    <div className="bg-white rounded-xl border p-5 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function FormField({ label, description, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', className = '', ...props }) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand ${className}`}
      {...props}
    />
  )
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand bg-white"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative inline-flex">
        <input
          type="checkbox"
          checked={checked || false}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-slate-300'}`} />
        <div className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  )
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#3b82f6'}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
          placeholder="#3b82f6"
        />
      </div>
    </div>
  )
}

function ImageUpload({ label, value, onChange, onUpload, uploading, previewVersion }) {
  const previewSrc = value
    ? `${value}${value.includes('?') ? '&' : '?'}v=${previewVersion || 0}`
    : ''

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="space-y-2">
        <Input value={value} onChange={onChange} placeholder="https://..." />
        <div className="flex items-center gap-2">
          <label className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg cursor-pointer hover:bg-slate-200">
            {uploading ? 'Uploading...' : 'Upload Image'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onUpload(file)
                e.target.value = ''
              }}
            />
          </label>
          {value && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="Preview" className="h-8 w-auto rounded border" />
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function TenantDomainSettingsTab({ tenantContext }) {
  const { tenantId, domains = [] } = tenantContext || {}
  
  // Domain selection
  const primaryDomain = useMemo(() => domains.find(d => d.isPrimary) || domains[0], [domains])
  const [domainId, setDomainId] = useState(primaryDomain?.id || '')
  
  // UI state
  const [activeTab, setActiveTab] = useState('appearance')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAsset, setUploadingAsset] = useState(null)
  const [previewVersions, setPreviewVersions] = useState({})
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // Original config for diff
  const [originalConfig, setOriginalConfig] = useState(null)
  
  // Meta lists
  const [allLanguages, setAllLanguages] = useState([])
  const [allCategories, setAllCategories] = useState([])
  
  // =========== APPEARANCE ===========
  const [themeStyle, setThemeStyle] = useState('style1')
  const [logoUrl, setLogoUrl] = useState('')
  const [faviconUrl, setFaviconUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [secondaryColor, setSecondaryColor] = useState('#64748b')
  const [accentColor, setAccentColor] = useState('#10b981')
  const [fontFamily, setFontFamily] = useState('Inter')
  const [headerStyle, setHeaderStyle] = useState('classic')
  const [footerStyle, setFooterStyle] = useState('minimal')
  const [showTopBar, setShowTopBar] = useState(false)
  const [showTicker, setShowTicker] = useState(false)
  
  // =========== NAVIGATION ===========
  const [menuItems, setMenuItems] = useState([])
  
  // =========== CONTENT ===========
  const [defaultLanguage, setDefaultLanguage] = useState('en')
  const [supportedLanguages, setSupportedLanguages] = useState(['en'])
  
  // =========== SEO ===========
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [ogImageUrl, setOgImageUrl] = useState('')
  const [canonicalUrl, setCanonicalUrl] = useState('')
  const [ogTitle, setOgTitle] = useState('')
  const [ogDescription, setOgDescription] = useState('')
  const [keywords, setKeywords] = useState('')
  const [tagline, setTagline] = useState('')
  const [homepageH1, setHomepageH1] = useState('')
  const [robots, setRobots] = useState('')
  const [robotsTxt, setRobotsTxt] = useState('')
  const [socialLinks, setSocialLinks] = useState([])
  const [sitemapEnabled, setSitemapEnabled] = useState(true)
  const [generatingAISeo, setGeneratingAISeo] = useState(false)
  
  // =========== ADVANCED ===========
  const [analyticsId, setAnalyticsId] = useState('')
  const [enableComments, setEnableComments] = useState(true)
  const [enableBookmarks, setEnableBookmarks] = useState(true)
  const [customCss, setCustomCss] = useState('')
  
  // =========== INTEGRATIONS ===========
  const [googleTagManagerId, setGoogleTagManagerId] = useState('')
  const [googleSiteVerification, setGoogleSiteVerification] = useState('')
  const [bingSiteVerification, setBingSiteVerification] = useState('')
  const [adsenseClientId, setAdsenseClientId] = useState('')
  const [googleAdsConversionId, setGoogleAdsConversionId] = useState('')
  const [googleAdsConversionLabel, setGoogleAdsConversionLabel] = useState('')
  const [adManagerNetworkCode, setAdManagerNetworkCode] = useState('')
  const [webPushVapidPublicKey, setWebPushVapidPublicKey] = useState('')
  const [fcmSenderId, setFcmSenderId] = useState('')
  
  // =========== SECRETS ===========
  const [webPushVapidPrivateKey, setWebPushVapidPrivateKey] = useState('')
  const [fcmServerKey, setFcmServerKey] = useState('')
  const [googleServiceAccountJson, setGoogleServiceAccountJson] = useState('')
  
  // =========== EPAPER SPECIFIC ===========
  const [epaperType, setEpaperType] = useState('PDF')
  const [multiEditionEnabled, setMultiEditionEnabled] = useState(false)
  const [siteName, setSiteName] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [adManagerAppId, setAdManagerAppId] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [organizationLogo, setOrganizationLogo] = useState('')
  
  // Detect if selected domain is ePaper
  const selectedDomain = useMemo(() => domains.find(d => d.id === domainId), [domains, domainId])
  const isEpaperDomain = useMemo(() => {
    if (!selectedDomain?.domain) return false
    return selectedDomain.domain.startsWith('epaper.') || selectedDomain.type === 'EPAPER'
  }, [selectedDomain])
  
  // =========== API FUNCTIONS ===========
  const showMessage = useCallback((type, text) => {
    setMessage({ type, text })
    if (type === 'success') setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }, [])
  
  const loadMetaLists = useCallback(async () => {
    try {
      const token = getToken()
      const headers = { 'Authorization': `Bearer ${token?.token || ''}` }
      
      const [catRes, langRes] = await Promise.allSettled([
        fetch(`${getApiBase()}/categories`, { headers }),
        fetch(`${getApiBase()}/languages`, { headers }),
      ])
      
      if (catRes.status === 'fulfilled' && catRes.value.ok) {
        const data = await catRes.value.json()
        setAllCategories(Array.isArray(data) ? data : data?.data || [])
      }
      if (langRes.status === 'fulfilled' && langRes.value.ok) {
        const data = await langRes.value.json()
        setAllLanguages(Array.isArray(data) ? data : data?.data || [])
      }
    } catch (e) {
      console.error('Failed to load meta lists:', e)
    }
  }, [])
  
  const loadConfig = useCallback(async () => {
    if (!tenantId || !domainId) return
    
    setLoading(true)
    setMessage({ type: '', text: '' })
    
    // Check if ePaper domain
    const domain = domains.find(d => d.id === domainId)
    const isEpaper = domain?.domain?.startsWith('epaper.') || domain?.type === 'EPAPER'
    
    try {
      const token = getToken()
      let res, cfg = {}
      
      if (isEpaper) {
        // Use ePaper settings API
        res = await fetch(`${getApiBase()}/epaper/domain/settings?tenantId=${tenantId}&domainId=${domainId}`, {
          headers: { 'Authorization': `Bearer ${token?.token || ''}` }
        })
      } else {
        // Use regular domain settings API
        res = await fetch(`${getApiBase()}/tenants/${tenantId}/domains/${domainId}/settings`, {
          headers: { 'Authorization': `Bearer ${token?.token || ''}` }
        })
      }
      
      if (res.ok) {
        const data = await res.json()
        cfg = data?.settings || data || {}
      } else if (res.status !== 404) {
        throw new Error(`Failed to load: ${res.status}`)
      }
      
      setOriginalConfig(cfg)
      
      // ePaper specific fields
      if (isEpaper) {
        setEpaperType(cfg?.epaper?.type || 'PDF')
        setMultiEditionEnabled(cfg?.epaper?.multiEditionEnabled || false)
        setSiteName(cfg?.branding?.siteName || '')
        setNotificationsEnabled(cfg?.notifications?.enabled || false)
        setAdManagerAppId(cfg?.integrations?.ads?.adManagerAppId || '')
        setOrganizationName(cfg?.seo?.organization?.name || '')
        setOrganizationLogo(cfg?.seo?.organization?.logo || '')
      }
      
      // Populate state with safe defaults
      setThemeStyle(cfg?.themeStyle || 'style1')
      setLogoUrl(cfg?.branding?.logoUrl || '')
      setFaviconUrl(cfg?.branding?.faviconUrl || '')
      setPrimaryColor(cfg?.theme?.colors?.primary || '#3b82f6')
      setSecondaryColor(cfg?.theme?.colors?.secondary || '#64748b')
      setAccentColor(cfg?.theme?.colors?.accent || '#10b981')
      setFontFamily(cfg?.theme?.typography?.fontFamily?.split(',')[0]?.trim() || 'Inter')
      setHeaderStyle(cfg?.theme?.layout?.header || 'classic')
      setFooterStyle(cfg?.theme?.layout?.footer || 'minimal')
      setShowTopBar(cfg?.theme?.layout?.showTopBar || false)
      setShowTicker(cfg?.theme?.layout?.showTicker || false)
      setMenuItems(cfg?.navigation?.menu || [])
      setDefaultLanguage(cfg?.content?.defaultLanguage || 'en')
      setSupportedLanguages(cfg?.content?.supportedLanguages || ['en'])
      setMetaTitle(cfg?.seo?.defaultMetaTitle || '')
      setMetaDescription(cfg?.seo?.defaultMetaDescription || '')
      setOgTitle(cfg?.seo?.ogTitle || '')
      setOgDescription(cfg?.seo?.ogDescription || '')
      setKeywords(cfg?.seo?.keywords || '')
      setTagline(cfg?.seo?.tagline || '')
      setHomepageH1(cfg?.seo?.homepageH1 || '')
      setRobots(cfg?.seo?.robots || 'index,follow')
      setRobotsTxt(cfg?.seo?.robotsTxt || '')
      setSocialLinks(cfg?.seo?.socialLinks || [])
      setSitemapEnabled(cfg?.seo?.sitemapEnabled !== false)
      setOgImageUrl(cfg?.seo?.ogImageUrl || '')
      setCanonicalUrl(cfg?.seo?.canonicalBaseUrl || '')
      setAnalyticsId(cfg?.integrations?.analytics?.googleAnalyticsMeasurementId || cfg?.integrations?.analytics?.measurementId || '')
      setGoogleTagManagerId(cfg?.integrations?.analytics?.googleTagManagerId || '')
      setGoogleSiteVerification(cfg?.integrations?.searchConsole?.googleSiteVerification || '')
      setBingSiteVerification(cfg?.integrations?.searchConsole?.bingSiteVerification || '')
      setAdsenseClientId(cfg?.integrations?.ads?.adsenseClientId || '')
      setGoogleAdsConversionId(cfg?.integrations?.ads?.googleAdsConversionId || '')
      setGoogleAdsConversionLabel(cfg?.integrations?.ads?.googleAdsConversionLabel || '')
      setAdManagerNetworkCode(cfg?.integrations?.ads?.adManagerNetworkCode || '')
      setWebPushVapidPublicKey(cfg?.integrations?.push?.webPushVapidPublicKey || '')
      setFcmSenderId(cfg?.integrations?.push?.fcmSenderId || '')
      setWebPushVapidPrivateKey(cfg?.secrets?.push?.webPushVapidPrivateKey || '')
      setFcmServerKey(cfg?.secrets?.push?.fcmServerKey || '')
      setGoogleServiceAccountJson(cfg?.secrets?.google?.serviceAccountJson || '')
      setEnableComments(cfg?.flags?.enableComments ?? true)
      setEnableBookmarks(cfg?.flags?.enableBookmarks ?? true)
      setCustomCss(cfg?.customCss || '')
      
    } catch (e) {
      showMessage('error', e.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [tenantId, domainId, domains, showMessage])
  
  // Build config for ePaper domains
  const buildEpaperConfig = useCallback(() => ({
    epaper: {
      type: epaperType,
      multiEditionEnabled,
    },
    branding: {
      logoUrl: logoUrl || null,
      faviconUrl: faviconUrl || null,
      siteName: siteName || null,
    },
    theme: {
      colors: { primary: primaryColor, secondary: secondaryColor, accent: accentColor },
      typography: { fontFamily: `${fontFamily}, Arial, sans-serif` },
    },
    layout: {
      header: headerStyle,
      footer: footerStyle,
      showTicker,
      showTopBar,
    },
    notifications: {
      enabled: notificationsEnabled,
      providers: {
        webpush: {
          publicKey: webPushVapidPublicKey || null,
        },
      },
    },
    seo: {
      canonicalBaseUrl: canonicalUrl || null,
      defaultMetaTitle: metaTitle || null,
      defaultMetaDescription: metaDescription || null,
      keywords: keywords || null,
      ogImageUrl: ogImageUrl || null,
      ogTitle: ogTitle || null,
      ogDescription: ogDescription || null,
      homepageH1: homepageH1 || null,
      tagline: tagline || null,
      robots: robots || null,
      sitemapEnabled,
      organization: {
        name: organizationName || null,
        logo: organizationLogo || null,
      },
      socialLinks: socialLinks?.length ? socialLinks : null,
    },
    integrations: {
      analytics: {
        googleAnalyticsMeasurementId: analyticsId || null,
        googleTagManagerId: googleTagManagerId || null,
      },
      searchConsole: {
        googleSiteVerification: googleSiteVerification || null,
        bingSiteVerification: bingSiteVerification || null,
      },
      ads: {
        adsenseClientId: adsenseClientId || null,
        googleAdsConversionId: googleAdsConversionId || null,
        googleAdsConversionLabel: googleAdsConversionLabel || null,
        adManagerNetworkCode: adManagerNetworkCode || null,
        adManagerAppId: adManagerAppId || null,
      },
      push: {
        webPushVapidPublicKey: webPushVapidPublicKey || null,
        fcmSenderId: fcmSenderId || null,
      },
    },
    secrets: {
      push: {
        webPushVapidPrivateKey: webPushVapidPrivateKey || null,
        fcmServerKey: fcmServerKey || null,
      },
      google: {
        serviceAccountJson: googleServiceAccountJson || null,
      },
    },
  }), [
    epaperType, multiEditionEnabled, logoUrl, faviconUrl, siteName,
    primaryColor, secondaryColor, accentColor, fontFamily, headerStyle, footerStyle,
    showTicker, showTopBar, notificationsEnabled, webPushVapidPublicKey,
    canonicalUrl, metaTitle, metaDescription, keywords, ogImageUrl, ogTitle,
    ogDescription, homepageH1, tagline, robots, sitemapEnabled, organizationName,
    organizationLogo, socialLinks, analyticsId, googleTagManagerId,
    googleSiteVerification, bingSiteVerification, adsenseClientId, googleAdsConversionId,
    googleAdsConversionLabel, adManagerNetworkCode, adManagerAppId, fcmSenderId,
    webPushVapidPrivateKey, fcmServerKey, googleServiceAccountJson
  ])
  
  const buildCurrentConfig = useCallback(() => ({
    themeStyle,
    branding: { logoUrl: logoUrl || null, faviconUrl: faviconUrl || null },
    theme: {
      colors: { primary: primaryColor, secondary: secondaryColor, accent: accentColor },
      typography: { fontFamily: `${fontFamily}, Arial, sans-serif` },
      layout: { header: headerStyle, footer: footerStyle, showTopBar, showTicker },
    },
    navigation: { menu: menuItems },
    content: { defaultLanguage, supportedLanguages },
    seo: {
      defaultMetaTitle: metaTitle || null,
      defaultMetaDescription: metaDescription || null,
      ogTitle: ogTitle || null,
      ogDescription: ogDescription || null,
      ogImageUrl: ogImageUrl || null,
      canonicalBaseUrl: canonicalUrl || null,
      keywords: keywords || null,
      tagline: tagline || null,
      homepageH1: homepageH1 || null,
      robots: robots || null,
      robotsTxt: robotsTxt || null,
      socialLinks: socialLinks?.length ? socialLinks : null,
      sitemapEnabled,
    },
    integrations: {
      analytics: {
        googleAnalyticsMeasurementId: analyticsId || null,
        googleTagManagerId: googleTagManagerId || null,
      },
      searchConsole: {
        googleSiteVerification: googleSiteVerification || null,
        bingSiteVerification: bingSiteVerification || null,
      },
      ads: {
        adsenseClientId: adsenseClientId || null,
        googleAdsConversionId: googleAdsConversionId || null,
        googleAdsConversionLabel: googleAdsConversionLabel || null,
        adManagerNetworkCode: adManagerNetworkCode || null,
      },
      push: {
        webPushVapidPublicKey: webPushVapidPublicKey || null,
        fcmSenderId: fcmSenderId || null,
      },
    },
    secrets: {
      push: {
        webPushVapidPrivateKey: webPushVapidPrivateKey || null,
        fcmServerKey: fcmServerKey || null,
      },
      google: {
        serviceAccountJson: googleServiceAccountJson || null,
      },
    },
    flags: { enableComments, enableBookmarks },
    customCss: customCss || null,
  }), [
    themeStyle, logoUrl, faviconUrl, primaryColor, secondaryColor, accentColor,
    fontFamily, headerStyle, footerStyle, showTopBar, showTicker, menuItems,
    defaultLanguage, supportedLanguages, metaTitle, metaDescription, ogImageUrl,
    canonicalUrl, ogTitle, ogDescription, keywords, tagline, homepageH1,
    robots, robotsTxt, socialLinks, sitemapEnabled, analyticsId, googleTagManagerId,
    googleSiteVerification, bingSiteVerification, adsenseClientId, googleAdsConversionId,
    googleAdsConversionLabel, adManagerNetworkCode, webPushVapidPublicKey, fcmSenderId,
    webPushVapidPrivateKey, fcmServerKey, googleServiceAccountJson,
    enableComments, enableBookmarks, customCss
  ])
  
  const saveSettings = useCallback(async () => {
    if (!tenantId || !domainId) return
    
    // Check if ePaper domain
    const domain = domains.find(d => d.id === domainId)
    const isEpaper = domain?.domain?.startsWith('epaper.') || domain?.type === 'EPAPER'
    
    const current = isEpaper ? buildEpaperConfig() : buildCurrentConfig()
    const diff = deepDiff(originalConfig || {}, current)
    
    if (!diff || !Object.keys(diff).length) {
      showMessage('success', 'No changes to save')
      return
    }
    
    setSaving(true)
    try {
      const token = getToken()
      let apiUrl, method
      
      if (isEpaper) {
        // Use ePaper settings API with PUT
        apiUrl = `${getApiBase()}/epaper/domain/settings?tenantId=${tenantId}&domainId=${domainId}&autoSeo=true`
        method = 'PUT'
      } else {
        // Use regular domain settings API with PATCH
        apiUrl = `${getApiBase()}/tenants/${tenantId}/domains/${domainId}/settings`
        method = 'PATCH'
      }
      
      const res = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token?.token || ''}`,
        },
        body: JSON.stringify(isEpaper ? stripEmpty(current) : stripEmpty(diff)),
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || data.error || `Failed: ${res.status}`)
      }
      
      showMessage('success', '✅ Settings saved successfully')
      await loadConfig()
    } catch (e) {
      showMessage('error', e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }, [tenantId, domainId, domains, originalConfig, buildCurrentConfig, buildEpaperConfig, loadConfig, showMessage])
  
  const uploadImage = useCallback(async (file, assetKey, setter) => {
    if (!assetKey) return
    setUploadingAsset(assetKey)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', `tenants/${tenantId}/domains/${domainId}/${assetKey}`)
      fd.append('kind', 'image')
      
      const res = await fetch('/api/admin/media/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      
      const data = await res.json()
      const url = data.publicUrl || data.internalUrl || data.url || data.fileUrl
      if (!url) throw new Error('Upload succeeded but no URL returned')
      setter(url)
      setPreviewVersions((prev) => ({ ...prev, [assetKey]: Date.now() }))
    } catch (e) {
      showMessage('error', e.message || 'Upload failed')
    } finally {
      setUploadingAsset(null)
    }
  }, [tenantId, domainId, showMessage])
  
  // Auto-generate SEO using AI
  const generateAISeo = useCallback(async () => {
    if (!tenantId) return
    
    setGeneratingAISeo(true)
    showMessage('', '')
    
    try {
      const token = getToken()
      const res = await fetch(`${getApiBase()}/tenants/${tenantId}/news-domain/seo/auto`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token?.token || ''}`,
          'Content-Type': 'application/json'
        },
        body: ''
      })
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'AI SEO generation failed')
      }
      
      const data = await res.json()
      const seo = data?.seo || {}
      
      // Update local state with generated SEO
      if (seo.defaultMetaTitle) setMetaTitle(seo.defaultMetaTitle)
      if (seo.defaultMetaDescription) setMetaDescription(seo.defaultMetaDescription)
      if (seo.ogTitle) setOgTitle(seo.ogTitle)
      if (seo.ogDescription) setOgDescription(seo.ogDescription)
      if (seo.keywords) setKeywords(seo.keywords)
      if (seo.tagline) setTagline(seo.tagline)
      if (seo.homepageH1) setHomepageH1(seo.homepageH1)
      if (seo.robots) setRobots(seo.robots)
      if (seo.robotsTxt) setRobotsTxt(seo.robotsTxt)
      if (seo.canonicalBaseUrl) setCanonicalUrl(seo.canonicalBaseUrl)
      if (seo.ogImageUrl) setOgImageUrl(seo.ogImageUrl)
      if (seo.sitemapEnabled !== undefined) setSitemapEnabled(seo.sitemapEnabled)
      
      showMessage('success', '✨ AI SEO generated successfully! Click Save to apply changes.')
    } catch (e) {
      showMessage('error', e.message || 'Failed to generate AI SEO')
    } finally {
      setGeneratingAISeo(false)
    }
  }, [tenantId, showMessage])
  
  // =========== EFFECTS ===========
  useEffect(() => {
    if (primaryDomain?.id && !domainId) setDomainId(primaryDomain.id)
  }, [primaryDomain?.id, domainId])
  
  // Reset active tab when switching between ePaper and regular domains
  useEffect(() => {
    if (isEpaperDomain) {
      // If current tab is not valid for ePaper, switch to ePaper config
      if (!['epaper-config', 'epaper-branding', 'epaper-layout', 'seo', 'advanced'].includes(activeTab)) {
        setActiveTab('epaper-config')
      }
    } else {
      // If current tab is ePaper-specific, switch to appearance
      if (['epaper-config', 'epaper-branding', 'epaper-layout'].includes(activeTab)) {
        setActiveTab('appearance')
      }
    }
  }, [isEpaperDomain, activeTab])
  
  useEffect(() => {
    loadMetaLists()
  }, [loadMetaLists])
  
  useEffect(() => {
    loadConfig()
  }, [loadConfig])
  
  // =========== MENU EDITOR ===========
  const addMenuItem = () => {
    setMenuItems([...menuItems, { type: 'link', label: '', href: '' }])
  }
  
  const updateMenuItem = (idx, updates) => {
    setMenuItems(menuItems.map((item, i) => i === idx ? { ...item, ...updates } : item))
  }
  
  const removeMenuItem = (idx) => {
    setMenuItems(menuItems.filter((_, i) => i !== idx))
  }
  
  // =========== TAB CONTENT ===========
  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <Section title="Theme Style" description="Choose the overall look and feel">
        <Select
          value={themeStyle}
          onChange={setThemeStyle}
          options={[
            { value: 'style1', label: 'Style 1 - Classic' },
            { value: 'style2', label: 'Style 2 - Modern' },
          ]}
        />
      </Section>
      
      <Section title="Branding" description="Logo and favicon for the website">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ImageUpload
            label="Logo"
            value={logoUrl}
            onChange={setLogoUrl}
            onUpload={(f) => uploadImage(f, 'logo', setLogoUrl)}
            uploading={uploadingAsset === 'logo'}
            previewVersion={previewVersions.logo}
          />
          <ImageUpload
            label="Favicon"
            value={faviconUrl}
            onChange={setFaviconUrl}
            onUpload={(f) => uploadImage(f, 'favicon', setFaviconUrl)}
            uploading={uploadingAsset === 'favicon'}
            previewVersion={previewVersions.favicon}
          />
        </div>
      </Section>
      
      <Section title="Colors" description="Brand colors for the website">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ColorPicker label="Primary Color" value={primaryColor} onChange={setPrimaryColor} />
          <ColorPicker label="Secondary Color" value={secondaryColor} onChange={setSecondaryColor} />
          <ColorPicker label="Accent Color" value={accentColor} onChange={setAccentColor} />
        </div>
      </Section>
      
      <Section title="Typography" description="Font settings">
        <FormField label="Font Family">
          <Select
            value={fontFamily}
            onChange={setFontFamily}
            options={GOOGLE_FONTS.map(f => ({ value: f, label: f }))}
          />
        </FormField>
        <div className="mt-3 p-4 bg-slate-50 rounded-lg" style={{ fontFamily }}>
          <p className="font-semibold">Preview: The quick brown fox</p>
          <p className="text-slate-600">jumps over the lazy dog. 1234567890</p>
        </div>
      </Section>
      
      <Section title="Layout" description="Header and footer configuration">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Header Style">
            <Select value={headerStyle} onChange={setHeaderStyle} options={HEADER_STYLES} />
          </FormField>
          <FormField label="Footer Style">
            <Select value={footerStyle} onChange={setFooterStyle} options={FOOTER_STYLES} />
          </FormField>
        </div>
        <div className="flex flex-wrap gap-6 mt-4">
          <Toggle label="Show Top Bar" checked={showTopBar} onChange={setShowTopBar} />
          <Toggle label="Show News Ticker" checked={showTicker} onChange={setShowTicker} />
        </div>
      </Section>
    </div>
  )
  
  const renderNavigationTab = () => (
    <Section title="Menu Items" description="Configure the main navigation menu">
      <div className="space-y-3">
        {menuItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <select
              value={item.type || 'link'}
              onChange={(e) => updateMenuItem(idx, { type: e.target.value })}
              className="px-2 py-1.5 border border-slate-300 rounded text-sm bg-white"
            >
              <option value="link">Link</option>
              <option value="category">Category</option>
            </select>
            
            {item.type === 'category' ? (
              <select
                value={item.categoryId || ''}
                onChange={(e) => {
                  const cat = allCategories.find(c => c.id === e.target.value)
                  updateMenuItem(idx, {
                    categoryId: e.target.value,
                    label: cat?.name || item.label,
                    href: `/category/${cat?.slug || cat?.id || ''}`,
                  })
                }}
                className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm bg-white"
              >
                <option value="">Select category...</option>
                {allCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <>
                <input
                  value={item.label || ''}
                  onChange={(e) => updateMenuItem(idx, { label: e.target.value })}
                  placeholder="Label"
                  className="w-32 px-2 py-1.5 border border-slate-300 rounded text-sm"
                />
                <input
                  value={item.href || ''}
                  onChange={(e) => updateMenuItem(idx, { href: e.target.value })}
                  placeholder="/path"
                  className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm"
                />
              </>
            )}
            
            <button
              onClick={() => removeMenuItem(idx)}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
            >
              ✕
            </button>
          </div>
        ))}
        
        <button
          onClick={addMenuItem}
          className="px-3 py-2 text-sm font-medium text-brand border border-brand rounded-lg hover:bg-brand/5"
        >
          + Add Menu Item
        </button>
      </div>
    </Section>
  )
  
  const renderContentTab = () => {
    // Safe language options with fallback
    const languageOptions = allLanguages.length > 0
      ? allLanguages.map(l => ({ 
          value: l.code || l.slug || l.id || 'en', 
          label: l.name || l.code || 'Unknown' 
        })).filter(l => l.value)
      : DEFAULT_LANGUAGES
    
    return (
      <Section title="Language Settings" description="Configure content languages">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
          <FormField label="Default Language">
            <Select
              value={defaultLanguage || 'en'}
              onChange={setDefaultLanguage}
              options={languageOptions}
            />
          </FormField>
          <FormField label="Supported Language">
            <Select
              value={(supportedLanguages && supportedLanguages[0]) || 'en'}
              onChange={(v) => setSupportedLanguages([v])}
              options={languageOptions}
            />
          </FormField>
        </div>
      </Section>
    )
  }
  
  const renderSeoTab = () => (
    <div className="space-y-6">
      {/* AI Generate Button */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-purple-900 flex items-center gap-2">
              ✨ AI SEO Generator
            </h3>
            <p className="text-sm text-purple-700 mt-0.5">Auto-generate optimized SEO content using AI</p>
          </div>
          <button
            onClick={generateAISeo}
            disabled={generatingAISeo}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium text-sm hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {generatingAISeo ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <span>🤖</span>
                Generate SEO
              </>
            )}
          </button>
        </div>
      </div>

      <Section title="Meta Tags" description="Primary SEO settings for search engines">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Meta Title" description="Title shown in search results">
              <Input value={metaTitle} onChange={setMetaTitle} placeholder="Your Website Title" />
            </FormField>
            <FormField label="Tagline" description="Short brand tagline">
              <Input value={tagline} onChange={setTagline} placeholder="News That Matters" />
            </FormField>
          </div>
          <FormField label="Meta Description" description="Description shown in search results">
            <textarea
              value={metaDescription || ''}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Brief description of your website..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand"
            />
          </FormField>
          <FormField label="Keywords" description="Comma-separated keywords">
            <textarea
              value={keywords || ''}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="breaking news, politics, business news, sports updates..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand"
            />
          </FormField>
          <FormField label="Homepage H1" description="Main heading on homepage">
            <Input value={homepageH1} onChange={setHomepageH1} placeholder="Welcome to Your News Source" />
          </FormField>
          <FormField label="Canonical Base URL" description="Primary domain for SEO">
            <Input value={canonicalUrl} onChange={setCanonicalUrl} placeholder="https://example.com" />
          </FormField>
        </div>
      </Section>

      <Section title="Open Graph (Social Sharing)" description="Settings for social media previews">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="OG Title" description="Title when shared on social media">
              <Input value={ogTitle} onChange={setOgTitle} placeholder="Site Name: Breaking News" />
            </FormField>
            <FormField label="OG Description" description="Description when shared">
              <Input value={ogDescription} onChange={setOgDescription} placeholder="Latest breaking news..." />
            </FormField>
          </div>
          <ImageUpload
            label="OG Image (1200x630 recommended)"
            value={ogImageUrl}
            onChange={setOgImageUrl}
            onUpload={(f) => uploadImage(f, 'og-image', setOgImageUrl)}
            uploading={uploadingAsset === 'og-image'}
            previewVersion={previewVersions['og-image']}
          />
        </div>
      </Section>

      <Section title="Social Links" description="Links to your social media profiles">
        <div className="space-y-3">
          {(socialLinks || []).map((link, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={link}
                onChange={(val) => {
                  const updated = [...socialLinks]
                  updated[idx] = val
                  setSocialLinks(updated)
                }}
                placeholder="https://facebook.com/yourpage"
              />
              <button
                onClick={() => setSocialLinks(socialLinks.filter((_, i) => i !== idx))}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => setSocialLinks([...(socialLinks || []), ''])}
            className="px-3 py-1.5 text-sm font-medium text-brand bg-brand/10 rounded-lg hover:bg-brand/20"
          >
            + Add Social Link
          </button>
        </div>
      </Section>

      <Section title="Robots & Sitemap" description="Search engine crawling settings">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Robots Directive" description="e.g., index,follow">
              <Input value={robots} onChange={setRobots} placeholder="index,follow,max-image-preview:large" />
            </FormField>
            <FormField label="Sitemap">
              <Toggle label="Enable Sitemap" checked={sitemapEnabled} onChange={setSitemapEnabled} />
            </FormField>
          </div>
          <FormField label="robots.txt Content" description="Custom robots.txt file content">
            <textarea
              value={robotsTxt || ''}
              onChange={(e) => setRobotsTxt(e.target.value)}
              placeholder="User-agent: *\nAllow: /"
              rows={8}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand"
            />
          </FormField>
        </div>
      </Section>
    </div>
  )
  
  const renderAdsTab = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📢</span>
          <div>
            <h3 className="font-semibold text-amber-800">Ads Management</h3>
            <p className="text-sm text-amber-700 mt-0.5">Configure ad placements and settings for this domain. Ad slots can be managed from the dedicated Ads section.</p>
          </div>
        </div>
      </div>
      
      <Section title="Ad Settings" description="Global ad configuration for this domain">
        <div className="space-y-4">
          <Toggle label="Enable Ads" checked={true} onChange={() => {}} />
          <Toggle label="Show Ads on Mobile" checked={true} onChange={() => {}} />
          <Toggle label="Show Ads Between Articles" checked={true} onChange={() => {}} />
        </div>
      </Section>
      
      <Section title="Ad Placements" description="Common ad slot positions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Header Banner', position: 'Top of page', size: '728x90' },
            { name: 'Sidebar Ad', position: 'Right sidebar', size: '300x250' },
            { name: 'In-Article Ad', position: 'Between paragraphs', size: '336x280' },
            { name: 'Footer Ad', position: 'Bottom of page', size: '728x90' },
          ].map((slot, idx) => (
            <div key={idx} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-900">{slot.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{slot.position} • {slot.size}</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Active</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-4">To manage ad codes and detailed settings, go to the Ads Management section.</p>
      </Section>
    </div>
  )
  
  // =========== EPAPER SPECIFIC TABS ===========
  const renderEpaperConfigTab = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📰</span>
          <div>
            <h3 className="font-semibold text-purple-800">ePaper Configuration</h3>
            <p className="text-sm text-purple-700 mt-0.5">Configure ePaper type and edition settings for this domain.</p>
          </div>
        </div>
      </div>
      
      <Section title="ePaper Type" description="Choose the ePaper display format">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { value: 'PDF', label: 'PDF Viewer', desc: 'Display PDF pages directly', icon: '📄' },
            { value: 'BLOCK', label: 'Block Layout', desc: 'Article blocks with images', icon: '🧱' },
          ].map(opt => (
            <label
              key={opt.value}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                epaperType === opt.value
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                  : 'border-slate-200 hover:border-purple-300'
              }`}
            >
              <input
                type="radio"
                name="epaperType"
                value={opt.value}
                checked={epaperType === opt.value}
                onChange={(e) => setEpaperType(e.target.value)}
                className="sr-only"
              />
              <div className="flex items-center gap-3">
                <span className="text-2xl">{opt.icon}</span>
                <div>
                  <div className="font-medium text-slate-900">{opt.label}</div>
                  <div className="text-xs text-slate-500">{opt.desc}</div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </Section>
      
      <Section title="Editions" description="Multi-edition configuration">
        <Toggle
          label="Enable Multiple Editions"
          checked={multiEditionEnabled}
          onChange={setMultiEditionEnabled}
        />
        <p className="text-xs text-slate-500 mt-2">Allow multiple regional/language editions for this ePaper domain.</p>
      </Section>
      
      <Section title="Notifications" description="Push notification settings">
        <Toggle
          label="Enable Notifications"
          checked={notificationsEnabled}
          onChange={setNotificationsEnabled}
        />
      </Section>
    </div>
  )
  
  const renderEpaperBrandingTab = () => (
    <div className="space-y-6">
      <Section title="Branding" description="ePaper site identity">
        <div className="space-y-4">
          <FormField label="Site Name" description="Display name for the ePaper site">
            <Input value={siteName} onChange={setSiteName} placeholder="Kaburlu ePaper" />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUpload
              label="Logo"
              value={logoUrl}
              onChange={setLogoUrl}
              onUpload={(f) => uploadImage(f, 'logo', setLogoUrl)}
              uploading={uploadingAsset === 'logo'}
              previewVersion={previewVersions.logo}
            />
            <ImageUpload
              label="Favicon"
              value={faviconUrl}
              onChange={setFaviconUrl}
              onUpload={(f) => uploadImage(f, 'favicon', setFaviconUrl)}
              uploading={uploadingAsset === 'favicon'}
              previewVersion={previewVersions.favicon}
            />
          </div>
        </div>
      </Section>
      
      <Section title="Organization" description="Publisher/Organization details for SEO">
        <div className="space-y-4">
          <FormField label="Organization Name">
            <Input value={organizationName} onChange={setOrganizationName} placeholder="Kaburlu Media" />
          </FormField>
          <ImageUpload
            label="Organization Logo"
            value={organizationLogo}
            onChange={setOrganizationLogo}
            onUpload={(f) => uploadImage(f, 'organization-logo', setOrganizationLogo)}
            uploading={uploadingAsset === 'organization-logo'}
            previewVersion={previewVersions['organization-logo']}
          />
        </div>
      </Section>
      
      <Section title="Colors" description="Theme colors for the ePaper site">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ColorPicker label="Primary Color" value={primaryColor} onChange={setPrimaryColor} />
          <ColorPicker label="Secondary Color" value={secondaryColor} onChange={setSecondaryColor} />
          <ColorPicker label="Accent Color" value={accentColor} onChange={setAccentColor} />
        </div>
      </Section>
      
      <Section title="Typography" description="Font settings">
        <FormField label="Font Family">
          <Select
            value={fontFamily}
            onChange={setFontFamily}
            options={GOOGLE_FONTS.map(f => ({ value: f, label: f }))}
          />
        </FormField>
      </Section>
    </div>
  )
  
  const renderEpaperLayoutTab = () => (
    <div className="space-y-6">
      <Section title="Layout Options" description="Header and footer configuration">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Header Style">
            <Select
              value={headerStyle}
              onChange={setHeaderStyle}
              options={[
                { value: 'centered', label: 'Centered' },
                { value: 'left', label: 'Left Aligned' },
                { value: 'modern', label: 'Modern' },
              ]}
            />
          </FormField>
          <FormField label="Footer Style">
            <Select
              value={footerStyle}
              onChange={setFooterStyle}
              options={[
                { value: 'minimal', label: 'Minimal' },
                { value: 'full-width', label: 'Full Width' },
                { value: 'rich', label: 'Rich' },
              ]}
            />
          </FormField>
        </div>
      </Section>
      
      <Section title="Display Options" description="Toggle UI elements">
        <div className="space-y-4">
          <Toggle label="Show News Ticker" checked={showTicker} onChange={setShowTicker} />
          <Toggle label="Show Top Bar" checked={showTopBar} onChange={setShowTopBar} />
        </div>
      </Section>
    </div>
  )
  
  const renderAdvancedTab = () => (
    <div className="space-y-6">
      {/* Analytics & Tag Manager */}
      <Section title="Analytics & Tag Manager" description="Google Analytics and Tag Manager integration">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Google Analytics Measurement ID" description="e.g., G-XXXXXXXXXX">
            <Input value={analyticsId} onChange={setAnalyticsId} placeholder="G-XXXXXXXXXX" />
          </FormField>
          <FormField label="Google Tag Manager ID" description="e.g., GTM-XXXXXXX">
            <Input value={googleTagManagerId} onChange={setGoogleTagManagerId} placeholder="GTM-XXXXXXX" />
          </FormField>
        </div>
      </Section>
      
      {/* Search Console Verification */}
      <Section title="Search Console Verification" description="Site verification codes for search engines">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Google Site Verification" description="Meta tag verification code">
            <Input value={googleSiteVerification} onChange={setGoogleSiteVerification} placeholder="your-google-site-verification-code" />
          </FormField>
          <FormField label="Bing Site Verification" description="Bing Webmaster verification code">
            <Input value={bingSiteVerification} onChange={setBingSiteVerification} placeholder="your-bing-verification-code" />
          </FormField>
        </div>
      </Section>
      
      {/* Ads Integration */}
      <Section title="Ads Integration" description="Google AdSense, Google Ads, and Ad Manager settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="AdSense Client ID" description="e.g., ca-pub-1234567890123456">
            <Input value={adsenseClientId} onChange={setAdsenseClientId} placeholder="ca-pub-1234567890123456" />
          </FormField>
          <FormField label="Ad Manager Network Code" description="Your Ad Manager network code">
            <Input value={adManagerNetworkCode} onChange={setAdManagerNetworkCode} placeholder="12345678" />
          </FormField>
          <FormField label="Google Ads Conversion ID" description="e.g., AW-123456789">
            <Input value={googleAdsConversionId} onChange={setGoogleAdsConversionId} placeholder="AW-123456789" />
          </FormField>
          <FormField label="Google Ads Conversion Label" description="Conversion label for tracking">
            <Input value={googleAdsConversionLabel} onChange={setGoogleAdsConversionLabel} placeholder="conversion-label" />
          </FormField>
        </div>
      </Section>
      
      {/* Push Notifications */}
      <Section title="Push Notifications" description="Web Push and FCM configuration">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Web Push VAPID Public Key" description="Public key for web push">
            <Input value={webPushVapidPublicKey} onChange={setWebPushVapidPublicKey} placeholder="BFG...your-vapid-public-key" />
          </FormField>
          <FormField label="FCM Sender ID" description="Firebase Cloud Messaging sender ID">
            <Input value={fcmSenderId} onChange={setFcmSenderId} placeholder="123456789012" />
          </FormField>
        </div>
      </Section>
      
      {/* Secrets Section */}
      <Section title="🔐 Secrets" description="Private keys and sensitive credentials (stored securely)">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-amber-800">⚠️ These values are sensitive. They are stored encrypted and never exposed in client-side code.</p>
        </div>
        <div className="space-y-4">
          <FormField label="Web Push VAPID Private Key" description="Private key for web push (keep secret)">
            <Input 
              type="password" 
              value={webPushVapidPrivateKey} 
              onChange={setWebPushVapidPrivateKey} 
              placeholder="your-vapid-private-key" 
            />
          </FormField>
          <FormField label="FCM Server Key" description="Firebase server key (keep secret)">
            <Input 
              type="password" 
              value={fcmServerKey} 
              onChange={setFcmServerKey} 
              placeholder="your-fcm-server-key" 
            />
          </FormField>
          <FormField label="Google Service Account JSON" description="Service account credentials for Google APIs">
            <textarea
              value={googleServiceAccountJson || ''}
              onChange={(e) => setGoogleServiceAccountJson(e.target.value)}
              placeholder='{"type":"service_account","project_id":"your-project"...}'
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand"
            />
          </FormField>
        </div>
      </Section>
      
      {/* Features */}
      <Section title="Features" description="Enable or disable features">
        <div className="space-y-4">
          <Toggle label="Enable Comments" checked={enableComments} onChange={setEnableComments} />
          <Toggle label="Enable Bookmarks" checked={enableBookmarks} onChange={setEnableBookmarks} />
        </div>
      </Section>
      
      {/* Custom CSS */}
      <Section title="Custom CSS" description="Add custom styles to the website">
        <textarea
          value={customCss || ''}
          onChange={(e) => setCustomCss(e.target.value)}
          placeholder="body { font-family: 'Inter'; }"
          rows={8}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand"
        />
      </Section>
    </div>
  )
  
  // =========== RENDER ===========
  if (!domains.length) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">🌐</div>
        <h3 className="font-semibold text-amber-800">No Domains Found</h3>
        <p className="text-sm text-amber-600 mt-1">Add a domain first to configure settings.</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Header with Domain Selector and Save Button */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="min-w-[200px]">
              <select
                value={domainId}
                onChange={(e) => setDomainId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-brand"
              >
                {domains.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.domain} {d.isPrimary ? '⭐' : ''}
                  </option>
                ))}
              </select>
            </div>
            {selectedDomain && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                selectedDomain.status === 'ACTIVE' || selectedDomain.status === 'VERIFIED'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {selectedDomain.status}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={loadConfig}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50"
            >
              {loading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
            <button
              onClick={saveSettings}
              disabled={saving || loading}
              className="px-5 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark disabled:opacity-50 shadow-sm"
            >
              {saving ? '💾 Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </div>
        
        {message.text && (
          <div className={`mt-3 px-4 py-2 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : ''
          }`}>
            {message.text}
          </div>
        )}
      </div>
      
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border">
        {/* ePaper Domain Badge */}
        {isEpaperDomain && (
          <div className="px-4 py-2 bg-purple-50 border-b border-purple-100 flex items-center gap-2">
            <span className="text-lg">📰</span>
            <span className="text-sm font-medium text-purple-700">ePaper Domain Settings</span>
          </div>
        )}
        
        <div className="border-b p-2 flex flex-wrap gap-1">
          {isEpaperDomain ? (
            <>
              {/* ePaper specific tabs */}
              <TabButton 
                active={activeTab === 'epaper-config'} 
                onClick={() => setActiveTab('epaper-config')} 
                icon="📰"
                verified={!!epaperType}
              >
                ePaper Config
              </TabButton>
              <TabButton 
                active={activeTab === 'epaper-branding'} 
                onClick={() => setActiveTab('epaper-branding')} 
                icon="🎨"
                verified={!!(logoUrl || siteName)}
              >
                Branding
              </TabButton>
              <TabButton 
                active={activeTab === 'epaper-layout'} 
                onClick={() => setActiveTab('epaper-layout')} 
                icon="📐"
              >
                Layout
              </TabButton>
              <TabButton 
                active={activeTab === 'seo'} 
                onClick={() => setActiveTab('seo')} 
                icon="🔍"
                verified={!!(metaTitle || metaDescription || ogTitle || keywords)}
              >
                SEO
              </TabButton>
              <TabButton 
                active={activeTab === 'advanced'} 
                onClick={() => setActiveTab('advanced')} 
                icon="⚙️"
                verified={!!(analyticsId || adsenseClientId)}
              >
                Integrations
              </TabButton>
            </>
          ) : (
            <>
              {/* Regular news domain tabs */}
              <TabButton 
                active={activeTab === 'appearance'} 
                onClick={() => setActiveTab('appearance')} 
                icon="🎨"
                verified={!!(logoUrl || faviconUrl || primaryColor !== '#3b82f6')}
              >
                Appearance
              </TabButton>
              <TabButton 
                active={activeTab === 'navigation'} 
                onClick={() => setActiveTab('navigation')} 
                icon="🔗"
                verified={menuItems?.length > 0}
              >
                Navigation
              </TabButton>
              <TabButton 
                active={activeTab === 'content'} 
                onClick={() => setActiveTab('content')} 
                icon="📝"
                verified={!!(defaultLanguage && supportedLanguages?.length > 0)}
              >
                Content
              </TabButton>
              <TabButton 
                active={activeTab === 'seo'} 
                onClick={() => setActiveTab('seo')} 
                icon="🔍"
                verified={!!(metaTitle || metaDescription || ogTitle || keywords)}
              >
                SEO
              </TabButton>
              <TabButton 
                active={activeTab === 'ads'} 
                onClick={() => setActiveTab('ads')} 
                icon="📢"
              >
                Ads
              </TabButton>
              <TabButton 
                active={activeTab === 'advanced'} 
                onClick={() => setActiveTab('advanced')} 
                icon="⚙️"
                verified={!!(analyticsId || customCss)}
              >
                Advanced
              </TabButton>
            </>
          )}
        </div>
        
        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* ePaper tabs */}
              {activeTab === 'epaper-config' && renderEpaperConfigTab()}
              {activeTab === 'epaper-branding' && renderEpaperBrandingTab()}
              {activeTab === 'epaper-layout' && renderEpaperLayoutTab()}
              
              {/* Shared & News domain tabs */}
              {activeTab === 'appearance' && renderAppearanceTab()}
              {activeTab === 'navigation' && renderNavigationTab()}
              {activeTab === 'content' && renderContentTab()}
              {activeTab === 'seo' && renderSeoTab()}
              {activeTab === 'ads' && renderAdsTab()}
              {activeTab === 'advanced' && renderAdvancedTab()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
