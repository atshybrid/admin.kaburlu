import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { handleUnauthorized } from '../../../utils/auth'

const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Poppins',
  'Montserrat',
  'Nunito',
  'Raleway',
  'Merriweather',
  'Playfair Display',
  'Noto Sans',
  'Noto Serif',
]

const TABS = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'content', label: 'Content' },
  { id: 'seo', label: 'SEO' },
  { id: 'advanced', label: 'Advanced' },
]

function pick(obj, keys) {
  const out = {}
  for (const k of keys) {
    if (k in obj) out[k] = obj[k]
  }
  return out
}

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v)
}

function deepEqual(a, b) {
  if (a === b) return true
  if (a == null || b == null) return a === b
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((el, i) => deepEqual(el, b[i]))
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const ka = Object.keys(a).sort()
    const kb = Object.keys(b).sort()
    if (ka.length !== kb.length) return false
    if (!deepEqual(ka, kb)) return false
    return ka.every((k) => deepEqual(a[k], b[k]))
  }
  return false
}

function deepDiff(previous, next) {
  if (deepEqual(previous, next)) return undefined

  if (Array.isArray(previous) || Array.isArray(next)) {
    if (deepEqual(previous, next)) return undefined
    return next
  }

  if (isPlainObject(previous) && isPlainObject(next)) {
    const out = {}
    const keys = Array.from(new Set([...Object.keys(previous), ...Object.keys(next)]))
    for (const k of keys) {
      const d = deepDiff(previous[k], next[k])
      if (d !== undefined) out[k] = d
    }
    return Object.keys(out).length ? out : undefined
  }

  return next
}

function stripNullish(obj) {
  if (Array.isArray(obj)) return obj
  if (!isPlainObject(obj)) return obj
  const out = {}
  for (const k in obj) {
    const v = obj[k]
    if (v == null || v === '') continue
    out[k] = isPlainObject(v) ? stripNullish(v) : v
  }
  return out
}

export default function TenantDomainSettingsTab({ tenantContext }) {
  const router = useRouter()
  const { tenantId, domains = [] } = tenantContext || {}

  const primaryDomain = useMemo(() => domains.find((d) => d.isPrimary) || domains[0] || null, [domains])

  const [activeTab, setActiveTab] = useState('appearance')
  const [domainId, setDomainId] = useState(primaryDomain?.id || '')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [rawConfig, setRawConfig] = useState(null)

  // Appearance
  const [themeStyle, setThemeStyle] = useState('style1')
  const [brandingLogoUrl, setBrandingLogoUrl] = useState('')
  const [brandingFaviconUrl, setBrandingFaviconUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [secondaryColor, setSecondaryColor] = useState('#64748b')
  const [accentColor, setAccentColor] = useState('#10b981')
  const [fontFamily, setFontFamily] = useState('Inter, Arial, sans-serif')
  const [baseSize, setBaseSize] = useState('16')
  const [layoutHeader, setLayoutHeader] = useState('classic')
  const [layoutFooter, setLayoutFooter] = useState('minimal')
  const [showTopBar, setShowTopBar] = useState(false)
  const [showTicker, setShowTicker] = useState(false)

  // Navigation
  const [menuItems, setMenuItems] = useState([])
  const [allCategories, setAllCategories] = useState([])

  // Content
  const [defaultLanguage, setDefaultLanguage] = useState('en')
  const [supportedLanguage, setSupportedLanguage] = useState('en')
  const [allLanguages, setAllLanguages] = useState([])

  // SEO
  const [defaultMetaTitle, setDefaultMetaTitle] = useState('')
  const [defaultMetaDescription, setDefaultMetaDescription] = useState('')
  const [ogImageUrl, setOgImageUrl] = useState('')
  const [canonicalBaseUrl, setCanonicalBaseUrl] = useState('')

  // Advanced
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [webpushPublicKey, setWebpushPublicKey] = useState('')
  const [analyticsProvider, setAnalyticsProvider] = useState('gtag')
  const [analyticsMeasurementId, setAnalyticsMeasurementId] = useState('')
  const [enableComments, setEnableComments] = useState(true)
  const [enableBookmarks, setEnableBookmarks] = useState(true)
  const [customCss, setCustomCss] = useState('')

  async function fetchTextOrRedirect(url, options) {
    const res = await fetch(url, options)
    if (res.status === 401) {
      handleUnauthorized()
      throw new Error('Session expired. Please re-login.')
    }
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(txt || `Error ${res.status}`)
    }
    return res.text()
  }

  async function uploadMedia(file, params = {}) {
    const fd = new FormData()
    fd.append('file', file)
    if (params.folder) fd.append('folder', params.folder)
    if (params.kind) fd.append('kind', params.kind)
    if (params.key) fd.append('key', params.key)
    if (params.filename) fd.append('filename', params.filename)

    const res = await fetch('/api/admin/media/upload', { method: 'POST', body: fd })
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(txt || `Upload failed: ${res.status}`)
    }
    const data = await res.json()
    // Backend returns publicUrl, not url
    return data.publicUrl || data.url
  }

  async function loadMetaLists() {
    try {
      const [catRes, langRes] = await Promise.all([
        fetch('/api/admin/proxy/api/v1/categories'),
        fetch('/api/admin/proxy/api/v1/languages'),
      ])
      if (catRes.ok) {
        const catData = await catRes.json()
        setAllCategories(catData || [])
      }
      if (langRes.ok) {
        const langData = await langRes.json()
        setAllLanguages(langData || [])
      }
    } catch {
      // silent fail
    }
  }

  function buildCategoryHref(cat) {
    if (!cat) return ''
    const slug = cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-') || cat.id
    return `/category/${slug}`
  }

  async function loadConfig() {
    if (!tenantId || !domainId) return
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/admin/proxy/api/v1/tenants/${tenantId}/domains/${domainId}/settings`)
      if (res.status === 401) {
        logout()
        router.push('/')
        return
      }
      
      // If 404, settings don't exist yet - use defaults
      let cfg = {}
      if (res.ok) {
        const txt = await res.text()
        cfg = txt ? JSON.parse(txt) : {}
      } else if (res.status === 404) {
        // Settings not found - use empty config with defaults
        cfg = {}
      } else {
        // Other errors
        const errorText = await res.text()
        let errorMsg = errorText
        try {
          const errorJson = JSON.parse(errorText)
          errorMsg = errorJson.error || errorJson.message || errorText
        } catch {
          // errorText is not JSON
        }
        throw new Error(errorMsg || `Error ${res.status}`)
      }
      
      setRawConfig(cfg)

      setThemeStyle(cfg?.themeStyle || 'style1')
      setBrandingLogoUrl(cfg?.branding?.logoUrl || '')
      setBrandingFaviconUrl(cfg?.branding?.faviconUrl || '')
      setPrimaryColor(cfg?.theme?.colors?.primary || '#3b82f6')
      setSecondaryColor(cfg?.theme?.colors?.secondary || '#64748b')
      setAccentColor(cfg?.theme?.colors?.accent || '#10b981')
      setFontFamily(cfg?.theme?.typography?.fontFamily || 'Inter, Arial, sans-serif')
      setBaseSize(String(cfg?.theme?.typography?.baseSize || 16))
      setLayoutHeader(cfg?.theme?.layout?.header || 'classic')
      setLayoutFooter(cfg?.theme?.layout?.footer || 'minimal')
      setShowTopBar(cfg?.theme?.layout?.showTopBar ?? false)
      setShowTicker(cfg?.theme?.layout?.showTicker ?? false)

      const menuData = cfg?.navigation?.menu || []
      setMenuItems(
        menuData.map((m) => ({
          type: m.type || 'link',
          label: m.label || '',
          href: m.href || '',
          categoryId: m.categoryId || '',
        }))
      )

      setDefaultLanguage(cfg?.content?.defaultLanguage || 'en')
      const supported = cfg?.content?.supportedLanguages || ['en']
      setSupportedLanguage(supported[0] || cfg?.content?.defaultLanguage || 'en')

      setDefaultMetaTitle(cfg?.seo?.defaultMetaTitle || '')
      setDefaultMetaDescription(cfg?.seo?.defaultMetaDescription || '')
      setOgImageUrl(cfg?.seo?.ogImageUrl || '')
      setCanonicalBaseUrl(cfg?.seo?.canonicalBaseUrl || '')

      setNotificationsEnabled(cfg?.notifications?.enabled ?? false)
      setWebpushPublicKey(cfg?.notifications?.providers?.webpush?.publicKey || '')

      setAnalyticsProvider(cfg?.integrations?.analytics?.provider || 'gtag')
      setAnalyticsMeasurementId(cfg?.integrations?.analytics?.measurementId || '')

      setEnableComments(cfg?.flags?.enableComments ?? true)
      setEnableBookmarks(cfg?.flags?.enableBookmarks ?? true)

      setCustomCss(cfg?.customCss || '')
    } catch (e) {
      setError(e?.message || String(e))
      setRawConfig(null)
    } finally {
      setBusy(false)
    }
  }

  async function patchSettings(patch) {
    if (!tenantId || !domainId) return
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      const cleaned = stripNullish(patch)
      const body = JSON.stringify(cleaned)
      const res = await fetch(`/api/admin/proxy/api/v1/tenants/${tenantId}/domains/${domainId}/settings`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body,
      })
      
      if (res.status === 401) {
        handleUnauthorized()
        return
      }
      
      if (!res.ok) {
        const errorText = await res.text()
        let errorMsg = errorText
        try {
          const errorJson = JSON.parse(errorText)
          errorMsg = errorJson.error || errorJson.message || errorText
        } catch {
          // errorText is not JSON
        }
        throw new Error(errorMsg || `Error ${res.status}`)
      }
      
      setSuccess('✅ Settings saved successfully')
      await loadConfig()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  function buildCurrentSettings() {
    const menu = (menuItems || []).map((m) => pick(m, ['label', 'href']))
    return {
      themeStyle,
      branding: {
        logoUrl: brandingLogoUrl || null,
        faviconUrl: brandingFaviconUrl || null,
      },
      theme: {
        colors: {
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor,
        },
        typography: {
          fontFamily,
          baseSize: Number(baseSize) || 16,
        },
        layout: {
          header: layoutHeader,
          footer: layoutFooter,
          showTopBar: !!showTopBar,
          showTicker: !!showTicker,
        },
      },
      navigation: {
        menu,
      },
      content: {
        defaultLanguage,
        supportedLanguages: [supportedLanguage],
      },
      seo: {
        defaultMetaTitle,
        defaultMetaDescription,
        ogImageUrl: ogImageUrl || null,
        canonicalBaseUrl: canonicalBaseUrl || null,
      },
      notifications: {
        enabled: !!notificationsEnabled,
        providers: {
          webpush: {
            publicKey: webpushPublicKey || '',
          },
        },
      },
      integrations: {
        analytics: {
          provider: analyticsProvider,
          measurementId: analyticsMeasurementId,
        },
      },
      flags: {
        enableComments: !!enableComments,
        enableBookmarks: !!enableBookmarks,
      },
      customCss,
    }
  }

  async function saveAll() {
    if (!rawConfig) {
      setError('Load current settings first, then save.')
      return
    }

    const current = buildCurrentSettings()
    const diff = deepDiff(rawConfig || {}, current) || {}
    if (!Object.keys(diff).length) {
      setSuccess('No changes to save')
      setTimeout(() => setSuccess(''), 1500)
      return
    }
    await patchSettings(diff)
  }

  function ColorField({ label, value, onChange }) {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
        <div className="flex items-center gap-2">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 rounded cursor-pointer border" />
          <input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-2 py-1.5 border rounded text-sm font-mono" />
        </div>
      </div>
    )
  }

  function MenuEditor() {
    const categories = allCategories

    const updateItem = (idx, next) => {
      setMenuItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...next } : it)))
    }

    const removeItem = (idx) => {
      setMenuItems((prev) => prev.filter((_, i) => i !== idx))
    }

    const addItem = () => {
      setMenuItems((prev) => [...prev, { type: 'link', label: '', href: '' }])
    }

    return (
      <div className="space-y-2">
        {menuItems.map((it, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 border rounded-lg p-3 bg-slate-50">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
              <select value={it.type || 'link'} onChange={(e) => updateItem(idx, { type: e.target.value })} className="w-full px-2 py-1.5 border rounded text-sm bg-white">
                <option value="link">Link</option>
                <option value="category">Category</option>
              </select>
            </div>

            {it.type === 'category' ? (
              <>
                <div className="col-span-6">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                  <select
                    value={it.categoryId || ''}
                    onChange={(e) => {
                      const selected = categories.find((c) => c.id === e.target.value) || null
                      updateItem(idx, {
                        categoryId: e.target.value,
                        label: selected?.name || it.label,
                        href: buildCategoryHref(selected),
                      })
                    }}
                    className="w-full px-2 py-1.5 border rounded text-sm bg-white"
                  >
                    <option value="">Select category…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Label</label>
                  <input value={it.label || ''} onChange={(e) => updateItem(idx, { label: e.target.value })} className="w-full px-2 py-1.5 border rounded text-sm" />
                </div>
              </>
            ) : (
              <>
                <div className="col-span-4">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Label</label>
                  <input value={it.label || ''} onChange={(e) => updateItem(idx, { label: e.target.value })} className="w-full px-2 py-1.5 border rounded text-sm" />
                </div>
                <div className="col-span-5">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Href</label>
                  <input value={it.href || ''} onChange={(e) => updateItem(idx, { href: e.target.value })} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="/category/politics" />
                </div>
              </>
            )}

            <div className="col-span-1 flex items-end">
              <button type="button" onClick={() => removeItem(idx)} className="px-2 py-1.5 rounded border text-xs hover:bg-red-50">✕</button>
            </div>
          </div>
        ))}

        <button type="button" onClick={addItem} className="px-3 py-1.5 rounded border text-sm hover:bg-slate-50">+ Add menu item</button>
      </div>
    )
  }

  function AppearanceTab() {
    const domainFolder = tenantId && domainId ? `tenants/${tenantId}/domains/${domainId}` : 'domains'
    return (
      <div className="space-y-6">
        {/* Theme style */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Theme Style</label>
          <select value={themeStyle} onChange={(e) => setThemeStyle(e.target.value)} className="max-w-xs px-3 py-2 border rounded-lg text-sm bg-white">
            <option value="style1">Style 1</option>
            <option value="style2">Style 2</option>
          </select>
        </div>

        {/* Branding */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-3">Branding</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Logo URL</label>
              <input value={brandingLogoUrl} onChange={(e) => setBrandingLogoUrl(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://cdn.../logo.png" />
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    try {
                      setBusy(true)
                      setError('')
                      const url = await uploadMedia(f, { folder: `${domainFolder}/branding` })
                      setBrandingLogoUrl(url)
                      // Clear the file input to prevent resubmission
                      e.target.value = ''
                    } catch (err) {
                      setError(err?.message || String(err))
                    } finally {
                      setBusy(false)
                    }
                  }}
                  className="block w-full text-xs"
                />
              </div>
              {brandingLogoUrl && (
                <div className="mt-2 p-2 bg-slate-50 rounded">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={brandingLogoUrl} alt="Logo preview" className="h-10 object-contain" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Favicon URL</label>
              <input value={brandingFaviconUrl} onChange={(e) => setBrandingFaviconUrl(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://cdn.../favicon.ico" />
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    try {
                      setBusy(true)
                      setError('')
                      const url = await uploadMedia(f, { folder: `${domainFolder}/branding` })
                      setBrandingFaviconUrl(url)
                      // Clear the file input to prevent resubmission
                      e.target.value = ''
                    } catch (err) {
                      setError(err?.message || String(err))
                    } finally {
                      setBusy(false)
                    }
                  }}
                  className="block w-full text-xs"
                />
              </div>
              {brandingFaviconUrl && (
                <div className="mt-2 p-2 bg-slate-50 rounded inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={brandingFaviconUrl} alt="Favicon preview" className="h-8 w-8 object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Theme colors & typography */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-3">Theme</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <ColorField label="Primary color" value={primaryColor} onChange={setPrimaryColor} />
                <ColorField label="Secondary color" value={secondaryColor} onChange={setSecondaryColor} />
                <ColorField label="Accent color" value={accentColor} onChange={setAccentColor} />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Font family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  {GOOGLE_FONTS.map((f) => (
                    <option key={f} value={`${f}, Arial, sans-serif`}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Base size (px)</label>
                <input type="number" min={10} max={24} value={baseSize} onChange={(e) => setBaseSize(e.target.value)} className="max-w-xs px-3 py-2 border rounded-lg text-sm" />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border" style={{ fontFamily }}>
                <div className="text-base font-semibold">Preview: The quick brown fox</div>
                <div className="text-sm text-slate-600">jumps over the lazy dog. 1234567890</div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-3">Layout</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Header</label>
              <select value={layoutHeader} onChange={(e) => setLayoutHeader(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="classic">Classic</option>
                <option value="minimal">Minimal</option>
                <option value="modern">Modern</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Footer</label>
              <select value={layoutFooter} onChange={(e) => setLayoutFooter(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="minimal">Minimal</option>
                <option value="classic">Classic</option>
                <option value="rich">Rich</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={!!showTopBar} onChange={(e) => setShowTopBar(e.target.checked)} className="rounded" />
              Show top bar
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={!!showTicker} onChange={(e) => setShowTicker(e.target.checked)} className="rounded" />
              Show ticker
            </label>
          </div>
        </div>
      </div>
    )
  }

  function NavigationTab() {
    return (
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-3">Menu Items</label>
        <MenuEditor />
      </div>
    )
  }

  function ContentTab() {
    const languagesOptions = allLanguages
      .map((l) => ({ code: l.code || l.slug || l.id, name: l.name || l.label || l.code || l.id }))
      .filter((l) => !!l.code)

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Default language</label>
            <select value={defaultLanguage} onChange={(e) => setDefaultLanguage(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
              {(languagesOptions.length ? languagesOptions : [{ code: 'en', name: 'English' }]).map((l) => (
                <option key={l.code} value={l.code}>{l.name} ({l.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Supported language</label>
            <select value={supportedLanguage} onChange={(e) => setSupportedLanguage(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
              {(languagesOptions.length ? languagesOptions : [{ code: 'en', name: 'English' }]).map((l) => (
                <option key={l.code} value={l.code}>{l.name} ({l.code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    )
  }

  function SeoTab() {
    const domainFolder = tenantId && domainId ? `tenants/${tenantId}/domains/${domainId}` : 'domains'
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Default meta title</label>
            <input value={defaultMetaTitle} onChange={(e) => setDefaultMetaTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Canonical base URL</label>
            <input value={canonicalBaseUrl} onChange={(e) => setCanonicalBaseUrl(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://news.kaburlu.com" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Default meta description</label>
          <textarea value={defaultMetaDescription} onChange={(e) => setDefaultMetaDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">OG image URL</label>
          <input value={ogImageUrl} onChange={(e) => setOgImageUrl(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://cdn.../og.png" />
          <div className="mt-2">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                try {
                  setBusy(true)
                  setError('')
                  const url = await uploadMedia(f, { folder: `${domainFolder}/seo` })
                  setOgImageUrl(url)
                  // Clear the file input to prevent resubmission
                  e.target.value = ''
                } catch (err) {
                  setError(err?.message || String(err))
                } finally {
                  setBusy(false)
                }
              }}
              className="block w-full text-xs"
            />
          </div>
        </div>
      </div>
    )
  }

  function AdvancedTab() {
    return (
      <div className="space-y-6 max-w-2xl">
        {/* Notifications */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-3">Notifications</label>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={!!notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} className="rounded" />
              Enabled
            </label>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Webpush public key</label>
              <input value={webpushPublicKey} onChange={(e) => setWebpushPublicKey(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-3">Analytics</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Provider</label>
              <select value={analyticsProvider} onChange={(e) => setAnalyticsProvider(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="gtag">Google Analytics (gtag)</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Measurement ID</label>
              <input value={analyticsMeasurementId} onChange={(e) => setAnalyticsMeasurementId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="G-XXXXXXX" />
            </div>
          </div>
        </div>

        {/* Flags */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-3">Features</label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={!!enableComments} onChange={(e) => setEnableComments(e.target.checked)} className="rounded" />
              Enable comments
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={!!enableBookmarks} onChange={(e) => setEnableBookmarks(e.target.checked)} className="rounded" />
              Enable bookmarks
            </label>
          </div>
        </div>

        {/* Custom CSS */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-3">Custom CSS</label>
          <textarea value={customCss} onChange={(e) => setCustomCss(e.target.value)} rows={8} className="w-full px-3 py-2 border rounded-lg text-sm font-mono" placeholder="body { font-family: Inter; }" />
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (!domainId && primaryDomain?.id) setDomainId(primaryDomain.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryDomain?.id])

  useEffect(() => {
    loadMetaLists()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, domainId])

  const selectedDomain = domains.find((d) => d.id === domainId) || null

  return (
    <div className="space-y-4">
      {/* Header with domain selector and single save button */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-5 border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex-1 max-w-md">
                <select value={domainId} onChange={(e) => setDomainId(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white font-medium">
                  {domains.length ? domains.map((d) => (
                    <option key={d.id} value={d.id}>{d.domain}{d.isPrimary ? ' ⭐' : ''}</option>
                  )) : <option value="">No domains</option>}
                </select>
              </div>
              {selectedDomain && (
                <div className="text-xs text-slate-500">
                  <span className="px-2 py-1 bg-slate-100 rounded font-medium">{selectedDomain.status || 'PENDING'}</span>
                  {selectedDomain.kind && <span className="ml-2 px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium">{selectedDomain.kind}</span>}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={loadConfig} disabled={busy || !tenantId || !domainId} className="px-4 py-2.5 rounded-lg border text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                {busy ? '⏳ Loading…' : '🔄 Refresh'}
              </button>
              <button type="button" onClick={saveAll} disabled={busy || !tenantId || !domainId || !rawConfig} className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition">
                💾 Save Changes
              </button>
            </div>
          </div>
        </div>
        {(success || error) && (
          <div className="px-5 py-3 border-b bg-slate-50">
            {success && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</div>}
            {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 whitespace-pre-wrap">{error}</div>}
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="border-b bg-slate-50">
          <nav className="flex gap-1 p-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6">
          {activeTab === 'appearance' && <AppearanceTab />}
          {activeTab === 'navigation' && <NavigationTab />}
          {activeTab === 'content' && <ContentTab />}
          {activeTab === 'seo' && <SeoTab />}
          {activeTab === 'advanced' && <AdvancedTab />}
        </div>
      </div>
    </div>
  )
}
