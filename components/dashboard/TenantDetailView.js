/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Loader from '../Loader'
import { getToken } from '../../utils/auth'

function getApiBase() {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com'
  // Allow env values like https://host/api/v1 (Swagger-style) by stripping the version prefix.
  return String(base).replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

function getPagesApiBase() {
  const base = process.env.NEXT_PUBLIC_PAGES_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com'
  return String(base).replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

function getPagesApiPrefix() {
  const raw = process.env.NEXT_PUBLIC_PAGES_API_PREFIX || '/api/v1'
  const trimmed = String(raw || '').trim()
  if (!trimmed) return ''
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeading.replace(/\/$/, '')
}

async function parseApiError(res) {
  try {
    const data = await res.json()
    return (
      data?.message ||
      data?.error ||
      data?.errors?.[0]?.message ||
      data?.data?.message ||
      JSON.stringify(data)
    )
  } catch {
    try {
      const text = await res.text()
      return text || `Request failed: ${res.status}`
    } catch {
      return `Request failed: ${res.status}`
    }
  }
}

function formatIsoDate(v) {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (isNaN(d.getTime())) return v
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  } catch {
    return v
  }
}

const LEGAL_PAGE_PRESETS = [
  {
    slug: 'about-us',
    title: 'About Us',
    meta: {
      seoTitle: 'About {{BRAND_NAME}}',
      seoDescription: 'Learn more about {{BRAND_NAME}}, a regional digital news platform.'
    },
    contentHtml: '<h2>About {{BRAND_NAME}}</h2><p>{{BRAND_NAME}} is a multi-language digital news platform delivering reliable and timely news updates.</p><p>We focus on local, state, and national news and aim to provide factual and verified information.</p><h3>Contact</h3><p>Email: {{SUPPORT_EMAIL}}<br/>Website: {{WEBSITE_URL}}</p>'
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    meta: {
      seoTitle: 'Privacy Policy | {{BRAND_NAME}}',
      seoDescription: 'Understand how {{BRAND_NAME}} handles user data, notifications, and location-based news.'
    },
    contentHtml: '<h2>Privacy Policy – {{BRAND_NAME}}</h2><p>{{BRAND_NAME}} respects user privacy and is committed to protecting personal data.</p><h3>Information We Collect</h3><ul><li>Device information for push notifications</li><li>Approximate location for area-wise news filtering</li><li>Camera and media access for authorized reporters only</li></ul><h3>Contact</h3><p>Email: {{SUPPORT_EMAIL}}<br/>Website: {{WEBSITE_URL}}</p>'
  },
  {
    slug: 'terms-and-conditions',
    title: 'Terms & Conditions',
    meta: {
      seoTitle: 'Terms & Conditions | {{BRAND_NAME}}',
      seoDescription: 'Terms and conditions governing the use of {{BRAND_NAME}}.'
    },
    contentHtml: '<h2>Terms and Conditions – {{BRAND_NAME}}</h2><p>By using {{BRAND_NAME}}, users agree to the following terms.</p><ul><li>Content is provided for informational purposes only</li><li>Users must not copy or redistribute content without permission</li><li>Users are responsible for how they use the information</li></ul>'
  },
  {
    slug: 'disclaimer',
    title: 'Disclaimer',
    meta: {
      seoTitle: 'Disclaimer | {{BRAND_NAME}}',
      seoDescription: 'Disclaimer explaining content responsibility and neutrality of {{BRAND_NAME}}.'
    },
    contentHtml: '<h2>Disclaimer – {{BRAND_NAME}}</h2><ul><li>{{BRAND_NAME}} is an independent digital news platform</li><li>We are not affiliated with any political party or ideology</li><li>News content is based on reporters and publicly available sources</li><li>Errors, if any, are unintentional</li></ul>'
  },
  {
    slug: 'editorial-policy',
    title: 'Editorial Policy',
    meta: {
      seoTitle: 'Editorial Policy | {{BRAND_NAME}}',
      seoDescription: 'Editorial standards and fact-checking process of {{BRAND_NAME}}.'
    },
    contentHtml: '<h2>Editorial Policy – {{BRAND_NAME}}</h2><ul><li>Facts are verified before publishing</li><li>Sources are reviewed for credibility</li><li>Corrections are issued when errors are identified</li><li>Ethical journalism standards are followed</li></ul>'
  },
  {
    slug: 'corrections-feedback',
    title: 'Corrections & Feedback',
    meta: {
      seoTitle: 'Corrections Policy | {{BRAND_NAME}}',
      seoDescription: 'How to report corrections or feedback to {{BRAND_NAME}}.'
    },
    contentHtml: '<h2>Corrections & Feedback – {{BRAND_NAME}}</h2><p>{{BRAND_NAME}} values accuracy and transparency.</p><p>If you notice any errors, please report them to:</p><p>Email: {{CORRECTIONS_EMAIL}}</p>'
  },
  {
    slug: 'our-team',
    title: 'Our Team',
    meta: {
      seoTitle: 'Our Team | {{BRAND_NAME}}',
      seoDescription: 'Meet the editorial team and reporters of {{BRAND_NAME}}.'
    },
    contentHtml: '<h2>Our Team – {{BRAND_NAME}}</h2><p><strong>Editor:</strong> {{BRAND_SHORT}} Editorial Team</p><h3>Reporters</h3><ul><li>District Reporters</li><li>State Correspondents</li><li>Special Contributors</li></ul>'
  },
  {
    slug: 'advertise-with-us',
    title: 'Advertise With Us',
    meta: {
      seoTitle: 'Advertise With {{BRAND_NAME}}',
      seoDescription: 'Advertising opportunities with {{BRAND_NAME}}.'
    },
    contentHtml: '<h2>Advertise With {{BRAND_NAME}}</h2><p>Promote your brand through {{BRAND_NAME}} and reach a wide regional audience.</p><p>Contact: {{ADS_EMAIL}}</p>'
  }
]

function categoryDisplayName(c) {
  if (!c) return ''
  return (
    c.translatedName ||
    c.translation?.name ||
    c.localizedName ||
    c.name ||
    c.category?.name ||
    c.title ||
    c.label ||
    c.slug ||
    ''
  )
}

function StatusPill({ ok, labelOk = 'Configured', labelNo = 'Not configured' }) {
  return (
    <span className={`px-2 py-0.5 rounded border text-[11px] ${ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
      {ok ? labelOk : labelNo}
    </span>
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 ${className}`.trim()}>
      {children}
    </div>
  )
}

function CardHeaderRow({ left, right }) {
  return (
    <div className="font-semibold flex items-center justify-between">
      <span>{left}</span>
      <span>{right}</span>
    </div>
  )
}

function FieldRow({ label, children }) {
  return (
    <div>
      <span className="text-gray-500">{label}:</span> {children}
    </div>
  )
}

function Alert({ tone = 'error', children, className = '' }) {
  const base = 'text-xs border rounded p-2'
  const toneClass =
    tone === 'warn'
      ? 'text-amber-800 bg-amber-50 border-amber-100'
      : tone === 'info'
        ? 'text-gray-700 bg-gray-50 border-gray-200'
        : 'text-red-600 bg-red-50 border-red-100'

  return (
    <div className={`${base} ${toneClass} ${className}`.trim()}>
      {children}
    </div>
  )
}

export default function TenantDetailView({ tenantId }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [tenant, setTenant] = useState(null)
  const [entitiesLoading, setEntitiesLoading] = useState(false)
  const [entitiesError, setEntitiesError] = useState('')
  const [entities, setEntities] = useState([])

  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState('')
  const [tenantCategories, setTenantCategories] = useState([])

  const [domainSettingsLoading, setDomainSettingsLoading] = useState(false)
  const [domainSettingsError, setDomainSettingsError] = useState('')
  const [primaryDomainSettings, setPrimaryDomainSettings] = useState(null)

  const [idCardLoading, setIdCardLoading] = useState(false)
  const [idCardError, setIdCardError] = useState('')
  const [idCardSettings, setIdCardSettings] = useState(null)

  const [razorpayLoading, setRazorpayLoading] = useState(false)
  const [razorpayError, setRazorpayError] = useState('')
  const [razorpayConfig, setRazorpayConfig] = useState(null)

  // tenant legal/static pages
  const [tenantPagesLoading, setTenantPagesLoading] = useState(false)
  const [tenantPagesError, setTenantPagesError] = useState('')
  const [tenantPages, setTenantPages] = useState([])
  const [presetSlug, setPresetSlug] = useState(LEGAL_PAGE_PRESETS[0]?.slug || 'about-us')
  const [openLegalPage, setOpenLegalPage] = useState(null) // { slug }

  // drawers / modals
  const [entityFor, setEntityFor] = useState(null)
  const [editBusinessFor, setEditBusinessFor] = useState(null)
  const [domainFor, setDomainFor] = useState(null)
  const [verifyDomainFor, setVerifyDomainFor] = useState(null)
  const [linkCategoriesFor, setLinkCategoriesFor] = useState(null)
  const [domainSettingsFor, setDomainSettingsFor] = useState(null)
  const [openIdCard, setOpenIdCard] = useState(false)
  const [openRazorpay, setOpenRazorpay] = useState(false)

  // tenant-theme (homepage config)
  const [themeStyle, setThemeStyle] = useState('style1') // style1 | style2
  const [themeLoading, setThemeLoading] = useState(false)
  const [themeError, setThemeError] = useState('')
  const [themeResult, setThemeResult] = useState(null)
  const [themeSectionsJson, setThemeSectionsJson] = useState('{\n  "sections": []\n}')
  const [themeFullJson, setThemeFullJson] = useState('')
  const [themeEditorMode, setThemeEditorMode] = useState('form') // form | json-full | json-sections
  const [themeConfig, setThemeConfig] = useState({ heroCount: 1, topStoriesCount: 5, sections: [] })
  const [themeSections, setThemeSections] = useState([])

  const base = getApiBase()

  const legalConfiguredCount = useMemo(() => {
    const existing = new Set((tenantPages || []).map(p => String(p?.slug || '').trim().toLowerCase()).filter(Boolean))
    return LEGAL_PAGE_PRESETS.reduce((acc, p) => acc + (existing.has(String(p.slug).toLowerCase()) ? 1 : 0), 0)
  }, [tenantPages])

  const detectedHomepageStyle = useMemo(() => {
    const raw = primaryDomainSettings?.theme?.theme
    if (!raw) return null
    const cleaned = String(raw).trim().toLowerCase().replace(/\s+/g, '').replace(/[_-]/g, '')
    if (cleaned === 'style1' || cleaned === 'style2') return cleaned
    if (cleaned === 'light' || cleaned === 'dark') return 'style1'
    return null
  }, [primaryDomainSettings])

  useEffect(() => {
    if (detectedHomepageStyle) setThemeStyle(detectedHomepageStyle)
  }, [detectedHomepageStyle])

  useEffect(() => {
    // If editor is empty, seed it with a sample for the selected style.
    const hasFull = (themeFullJson || '').trim().length > 0
    const hasSections = (themeSectionsJson || '').trim().length > 0
    const hasForm = Array.isArray(themeSections) && themeSections.length > 0
    if (!hasFull || !hasSections || !hasForm) {
      setAllEditorsFromConfig(sampleFullConfig(themeStyle))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeStyle])

  useEffect(() => {
    if (themeEditorMode !== 'form') return
    const cfg = normalizeConfig({ ...themeConfig, sections: Array.isArray(themeSections) ? themeSections : [] })
    setThemeFullJson(JSON.stringify(cfg, null, 2))
    setThemeSectionsJson(JSON.stringify({ sections: cfg.sections || [] }, null, 2))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeEditorMode, themeConfig, themeSections])

  function sampleFullConfig(style) {
    if (style === 'style2') {
      return {
        heroCount: 1,
        topStoriesCount: 5,
        sections: [
          { key: 'hero', title: 'Latest', position: 1, style: 'hero', limit: 1 },
          { key: 'politics', title: 'Politics', position: 10, style: 'grid', categorySlug: 'politics', limit: 6 },
          { key: 'sports', title: 'Sports', position: 20, style: 'grid', categorySlug: 'sports', limit: 6 },
        ]
      }
    }
    // style1
    return {
      heroCount: 1,
      topStoriesCount: 5,
      sections: [
        { key: 'flashTicker', label: 'Flash News', limit: 12 },
        { key: 'heroStack', label: 'Top Stories' },
        { key: 'categoryHub', label: 'Categories', categorySlugs: ['politics', 'sports', 'technology'], limit: 5 },
        { key: 'hgBlock', label: 'Highlights', categorySlugs: ['politics', 'sports'], limit: 5 },
        { key: 'lastNews', label: 'Last News', categorySlug: 'politics', limit: 8 },
        { key: 'trendingCategory', label: 'Trending News', categorySlug: 'sports', limit: 6 },
        { key: 'rightRailTrendingTitles', label: 'Trending News', limit: 8 },
      ]
    }
  }

  function sampleSectionsPayload(style) {
    const full = sampleFullConfig(style)
    return { sections: full.sections || [] }
  }

  function categorySlugOf(c) {
    return c?.slug || c?.category?.slug || c?.translation?.slug || c?.translatedSlug || c?.localizedSlug || ''
  }

  const linkedCategoryOptions = useMemo(() => {
    const opts = (tenantCategories || [])
      .map(c => {
        const slug = categorySlugOf(c)
        const label = categoryDisplayName(c) || slug
        if (!slug) return null
        return { value: slug, label }
      })
      .filter(Boolean)

    const seen = new Set()
    return opts.filter(o => {
      if (seen.has(o.value)) return false
      seen.add(o.value)
      return true
    })
  }, [tenantCategories])

  const STYLE1_KEYS = ['flashTicker', 'heroStack', 'categoryHub', 'hgBlock', 'lastNews', 'trendingCategory', 'rightRailTrendingTitles']
  const STYLE2_LAYOUTS = ['hero', 'grid', 'list']

  function toIntOrUndefined(v) {
    if (v === '' || v === null || v === undefined) return undefined
    const n = Number(v)
    if (!Number.isFinite(n)) return undefined
    return Math.max(0, Math.trunc(n))
  }

  function normalizeConfig(cfg) {
    const safe = (cfg && typeof cfg === 'object') ? cfg : {}
    const heroCount = toIntOrUndefined(safe.heroCount) ?? 1
    const topStoriesCount = toIntOrUndefined(safe.topStoriesCount) ?? 5
    const sections = Array.isArray(safe.sections) ? safe.sections : []
    return { ...safe, heroCount, topStoriesCount, sections }
  }

  function setAllEditorsFromConfig(cfg) {
    const normalized = normalizeConfig(cfg)
    setThemeConfig(normalized)
    setThemeSections(normalized.sections || [])
    setThemeFullJson(JSON.stringify(normalized, null, 2))
    setThemeSectionsJson(JSON.stringify({ sections: normalized.sections || [] }, null, 2))
  }

  function extractStyleConfigFromResponse(data) {
    if (!data) return null
    if (data?.homepageConfig && typeof data.homepageConfig === 'object') {
      const c = data.homepageConfig?.[themeStyle]
      if (c && typeof c === 'object') return c
    }
    if (typeof data === 'object') return data
    return null
  }

  function themePath(style, suffix) {
    return `${base}/api/v1/tenant-theme/${tenant.id}/homepage/${style}${suffix}`
  }

  async function loadThemeCurrent() {
    if (!tenant?.id) return
    setThemeError('')
    setThemeLoading(true)
    try {
      const t = getToken()
      const res = await fetch(themePath(themeStyle, ''), {
        headers: { accept: 'application/json', Authorization: `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) throw new Error(`Theme load failed: ${res.status} - ${await parseApiError(res)}`)
      const data = await res.json().catch(() => null)
      setThemeResult(data)
      const cfg = extractStyleConfigFromResponse(data)
      if (cfg) setAllEditorsFromConfig(cfg)
    } catch (e) {
      setThemeResult(null)
      setThemeError(e.message || 'Failed to load theme')
    } finally {
      setThemeLoading(false)
    }
  }

  async function loadThemeDefault() {
    if (!tenant?.id) return
    setThemeError('')
    setThemeLoading(true)
    try {
      const t = getToken()
      const res = await fetch(themePath(themeStyle, '/default'), {
        headers: { accept: 'application/json', Authorization: `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) throw new Error(`Theme default failed: ${res.status} - ${await parseApiError(res)}`)
      const data = await res.json().catch(() => null)
      setThemeResult(data)
      const cfg = extractStyleConfigFromResponse(data)
      if (cfg) setAllEditorsFromConfig(cfg)
    } catch (e) {
      setThemeResult(null)
      setThemeError(e.message || 'Failed to load defaults')
    } finally {
      setThemeLoading(false)
    }
  }

  async function applyThemeDefault() {
    if (!tenant?.id) return
    setThemeError('')
    setThemeLoading(true)
    try {
      const t = getToken()
      const res = await fetch(themePath(themeStyle, '/apply-default'), {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${t?.token || ''}`
        },
        body: '{}'
      })
      if (!res.ok) throw new Error(`Apply default failed: ${res.status} - ${await parseApiError(res)}`)
      const data = await res.json().catch(() => null)
      setThemeResult(data)
      // POST apply-default returns the full TenantTheme row; try to seed editor from homepageConfig
      const cfg = extractStyleConfigFromResponse(data)
      if (cfg) setAllEditorsFromConfig(cfg)
    } catch (e) {
      setThemeResult(null)
      setThemeError(e.message || 'Failed to apply defaults')
    } finally {
      setThemeLoading(false)
    }
  }

  async function saveThemeFullConfig() {
    if (!tenant?.id) return
    setThemeError('')
    setThemeLoading(true)
    try {
      let config
      if (themeEditorMode === 'json-full') {
        try {
          config = JSON.parse(themeFullJson || '{}')
        } catch {
          throw new Error('Invalid JSON in full config')
        }
      } else {
        config = normalizeConfig({ ...themeConfig, sections: themeSections })
      }
      if (!config || typeof config !== 'object') throw new Error('Full config must be a JSON object')

      const t = getToken()
      const res = await fetch(`${base}/api/v1/tenant-theme/${tenant.id}`, {
        method: 'PATCH',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify({ homepageConfig: { [themeStyle]: config } })
      })
      if (!res.ok) throw new Error(`Save full config failed: ${res.status} - ${await parseApiError(res)}`)
      const data = await res.json().catch(() => null)
      setThemeResult(data)
    } catch (e) {
      setThemeError(e.message || 'Failed to save full config')
    } finally {
      setThemeLoading(false)
    }
  }

  async function saveThemeSections() {
    if (!tenant?.id) return
    setThemeError('')
    setThemeLoading(true)
    try {
      let payload
      if (themeEditorMode === 'json-sections') {
        try {
          payload = JSON.parse(themeSectionsJson || '{}')
        } catch {
          throw new Error('Invalid JSON in sections payload')
        }
        if (!payload || typeof payload !== 'object' || !Array.isArray(payload.sections)) {
          throw new Error('Payload must be an object with a "sections" array')
        }
      } else {
        payload = { sections: Array.isArray(themeSections) ? themeSections : [] }
      }

      const t = getToken()
      const url = `${base}/api/v1/tenant-theme/${tenant.id}/homepage/${themeStyle}/sections`

      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${t?.token || ''}`
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(`Save sections failed: ${res.status} - ${await parseApiError(res)}`)
      const data = await res.json().catch(() => null)
      setThemeResult(data)
    } catch (e) {
      setThemeError(e.message || 'Failed to save sections')
    } finally {
      setThemeLoading(false)
    }
  }

  const primaryDomain = useMemo(() => {
    const d = (tenant?.domains || []).find(x => x.isPrimary)
    return d || null
  }, [tenant])

  async function fetchTenant() {
    setError('')
    setLoading(true)
    try {
      const t = getToken()
      const res = await fetch(`${base}/api/v1/tenants?full=true`, {
        headers: { accept: '*/*', Authorization: `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) throw new Error(`Tenants request failed: ${res.status}`)
      const json = await res.json().catch(() => null)
      const list = Array.isArray(json) ? json : (json?.data || json?.items || [])
      const found = (list || []).find(x => String(x.id) === String(tenantId))
      if (!found) throw new Error('Tenant not found')
      setTenant(found)
      return found
    } catch (e) {
      setTenant(null)
      setError(e.message || 'Failed to load tenant')
      return null
    } finally {
      setLoading(false)
    }
  }

  async function fetchEntities(targetTenant) {
    const current = targetTenant || tenant
    if (!current?.id) return
    setEntitiesError('')
    setEntitiesLoading(true)
    try {
      const t = getToken()
      const res = await fetch(`${base}/api/v1/tenants/${current.id}/entity`, {
        headers: { accept: '*/*', Authorization: `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) throw new Error(`Entity request failed: ${res.status}`)
      const json = await res.json().catch(() => null)
      setEntities(Array.isArray(json) ? json : (json?.data || []))
    } catch (e) {
      setEntities([])
      setEntitiesError(e.message || 'Failed to load entity')
    } finally {
      setEntitiesLoading(false)
    }
  }

  async function fetchTenantCategories(targetTenant) {
    const current = targetTenant || tenant
    if (!current?.id) return
    setCategoriesError('')
    setCategoriesLoading(true)
    try {
      const t = getToken()
      const res = await fetch(`${base}/api/v1/tenants/${current.id}/categories`, {
        headers: { accept: 'application/json', Authorization: `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) throw new Error(`Categories request failed: ${res.status}`)
      const json = await res.json().catch(() => null)
      setTenantCategories(Array.isArray(json) ? json : (json?.data || []))
    } catch (e) {
      setTenantCategories([])
      setCategoriesError(e.message || 'Failed to load categories')
    } finally {
      setCategoriesLoading(false)
    }
  }

  async function fetchPrimaryDomainSettings(targetTenant) {
    const current = targetTenant || tenant
    if (!current?.id) return
    setDomainSettingsError('')
    setDomainSettingsLoading(true)
    try {
      const primary = (current.domains || []).find(d => d.isPrimary)
      if (!primary) {
        setPrimaryDomainSettings(null)
        return
      }
      const domainId = primary.id || primary.domainId || primary.domain
      const t = getToken()
      const res = await fetch(`${base}/api/v1/tenants/${current.id}/domains/${domainId}/settings`, {
        headers: { accept: 'application/json', Authorization: `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) throw new Error(`Settings request failed: ${res.status}`)
      const data = await res.json().catch(() => ({}))
      const s = data?.settings || data?.effective || data
      setPrimaryDomainSettings(s || {})
    } catch (e) {
      setPrimaryDomainSettings(null)
      setDomainSettingsError(e.message || 'Failed to load domain settings')
    } finally {
      setDomainSettingsLoading(false)
    }
  }

  async function fetchIdCard(targetTenant) {
    const current = targetTenant || tenant
    if (!current?.id) return
    setIdCardError('')
    setIdCardLoading(true)
    try {
      const t = getToken()
      const res = await fetch(`${base}/api/v1/tenants/${current.id}/id-card-settings`, {
        headers: { accept: '*/*', Authorization: `Bearer ${t?.token || ''}` }
      })
      if (res.status === 404) {
        setIdCardSettings(null)
        return
      }
      if (!res.ok) throw new Error(`ID card settings failed: ${res.status}`)
      const json = await res.json().catch(() => null)
      setIdCardSettings(json)
    } catch (e) {
      setIdCardSettings(null)
      setIdCardError(e.message || 'Failed to load ID card settings')
    } finally {
      setIdCardLoading(false)
    }
  }

  async function fetchRazorpay(targetTenant) {
    const current = targetTenant || tenant
    if (!current?.id) return
    setRazorpayError('')
    setRazorpayLoading(true)
    try {
      const t = getToken()
      const res = await fetch(`${base}/api/v1/tenants/${current.id}/razorpay-config`, {
        headers: { accept: '*/*', Authorization: `Bearer ${t?.token || ''}` }
      })
      if (res.status === 404) {
        setRazorpayConfig(null)
        return
      }
      if (!res.ok) throw new Error(`Razorpay config failed: ${res.status}`)
      const json = await res.json().catch(() => null)
      setRazorpayConfig(json)
    } catch (e) {
      setRazorpayConfig(null)
      setRazorpayError(e.message || 'Failed to load Razorpay config')
    } finally {
      setRazorpayLoading(false)
    }
  }

  async function fetchTenantPages(targetTenant) {
    const current = targetTenant || tenant
    if (!current?.id) return
    setTenantPagesError('')
    setTenantPagesLoading(true)
    try {
      const t = getToken()
      const pagesBase = getPagesApiBase()
      const pagesPrefix = getPagesApiPrefix()
      const res = await fetch(`${pagesBase}${pagesPrefix}/tenants/${current.id}/pages`, {
        headers: { accept: 'application/json', Authorization: `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) throw new Error(`Pages request failed: ${res.status} - ${await parseApiError(res)}`)
      const json = await res.json().catch(() => null)
      setTenantPages(Array.isArray(json) ? json : (json?.data || json?.items || []))
    } catch (e) {
      setTenantPages([])
      setTenantPagesError(e.message || 'Failed to load pages')
    } finally {
      setTenantPagesLoading(false)
    }
  }

  async function reloadAll() {
    const t = await fetchTenant()
    if (!t) return
    await Promise.all([
      fetchEntities(t),
      fetchTenantCategories(t),
      fetchPrimaryDomainSettings(t),
      fetchIdCard(t),
      fetchRazorpay(t),
      fetchTenantPages(t),
    ])
  }

  useEffect(() => {
    if (!tenantId) return
    reloadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  const checklist = useMemo(() => {
    const items = []
    const hasEntity = !!(tenant?.entity || entities?.[0])
    const hasPrimaryDomain = !!primaryDomain
    const hasCategories = (tenantCategories || []).length > 0
    const hasTheme = !!(primaryDomainSettings && (primaryDomainSettings?.theme || primaryDomainSettings?.branding))
    const hasIdCard = !!idCardSettings
    const hasPayment = !!razorpayConfig
    const hasDomainSettings = !!(primaryDomainSettings && Object.keys(primaryDomainSettings || {}).length > 0)

    if (!hasEntity) items.push({ key: 'entity', label: 'Add Tenant Entity' })
    if (!hasPrimaryDomain) items.push({ key: 'domain', label: 'Add Domain (primary)' })
    if (hasPrimaryDomain && !hasCategories) items.push({ key: 'categories', label: 'Link Categories' })
    if (hasPrimaryDomain && !hasTheme) items.push({ key: 'theme', label: 'Configure Theme & Branding' })
    if (!hasIdCard) items.push({ key: 'idcard', label: 'Tenant ID Card Settings' })
    if (!hasPayment) items.push({ key: 'payment', label: 'Tenant Payment (Razorpay)' })
    if (hasPrimaryDomain && !hasDomainSettings) items.push({ key: 'domain-settings', label: 'Tenant Domain Settings' })

    return items
  }, [tenant, entities, primaryDomain, tenantCategories, primaryDomainSettings, idCardSettings, razorpayConfig])

  if (loading) {
    return (
      <Card className="p-6">
        <Loader size={72} label="Loading tenant..." />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-600 text-sm">{error}</div>
        <div className="mt-3">
          <button onClick={() => reloadAll()} className="px-3 py-2 text-sm rounded border bg-white hover:bg-gray-50">Retry</button>
        </div>
      </Card>
    )
  }

  if (!tenant) return null

  const tenantEntity = tenant.entity || entities?.[0] || null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{tenant.name}</h2>
            <span className="px-2 py-0.5 rounded border text-[11px] bg-gray-50 text-gray-700">Tenant ID: {tenant.id}</span>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            <Link href="/dashboard/tenants" legacyBehavior><a className="text-brand">Back to Tenants</a></Link>
            <span className="mx-2 text-gray-300">•</span>
            <span>PRGI: {tenant.prgiNumber || '—'} ({tenant.prgiStatus || '—'})</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => reloadAll()} className="px-3 py-2 text-sm rounded border bg-white hover:bg-gray-50">Refresh</button>
          <button onClick={() => router.push('/dashboard/tenants')} className="px-3 py-2 text-sm rounded bg-gray-900 text-white">Close</button>
        </div>
      </div>

      {checklist.length > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Setup checklist</div>
              <div className="text-sm text-gray-600">Finish these to complete tenant setup.</div>
            </div>
          </div>
          <ol className="mt-3 space-y-2 text-sm">
            {checklist.map((i, idx) => (
              <li key={i.key} className="flex items-center justify-between gap-3 border rounded px-3 py-2 bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-xs text-gray-600">{idx + 1}</span>
                  <span className="font-medium text-gray-800">{i.label}</span>
                </div>
                <div className="shrink-0">
                  {i.key === 'entity' ? (
                    <button onClick={() => setEntityFor(tenant)} className="px-3 py-1.5 text-xs rounded bg-brand text-white hover:bg-brand-dark">Add</button>
                  ) : i.key === 'domain' ? (
                    <button onClick={() => setDomainFor(tenant)} className="px-3 py-1.5 text-xs rounded bg-brand text-white hover:bg-brand-dark">Add</button>
                  ) : i.key === 'categories' ? (
                    <button onClick={() => primaryDomain && setLinkCategoriesFor({ tenant, domain: primaryDomain })} disabled={!primaryDomain} className="px-3 py-1.5 text-xs rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">Link</button>
                  ) : i.key === 'theme' ? (
                    <button onClick={() => primaryDomain && setDomainSettingsFor({ tenant, domain: primaryDomain })} disabled={!primaryDomain} className="px-3 py-1.5 text-xs rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">Configure</button>
                  ) : i.key === 'idcard' ? (
                    <button onClick={() => setOpenIdCard(true)} className="px-3 py-1.5 text-xs rounded bg-brand text-white hover:bg-brand-dark">Configure</button>
                  ) : i.key === 'payment' ? (
                    <button onClick={() => setOpenRazorpay(true)} className="px-3 py-1.5 text-xs rounded bg-brand text-white hover:bg-brand-dark">Configure</button>
                  ) : (
                    <button onClick={() => primaryDomain && setDomainSettingsFor({ tenant, domain: primaryDomain })} disabled={!primaryDomain} className="px-3 py-1.5 text-xs rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">Configure</button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Overview grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeaderRow left="Tenant Entity" right={<StatusPill ok={!!tenantEntity} />} />
          <div className="mt-3 text-sm">
            {tenantEntity ? (
              <div className="space-y-1 text-gray-700">
                <FieldRow label="Language">{tenantEntity.language?.name || '—'}</FieldRow>
                <FieldRow label="Publisher">{tenantEntity.publisherName || '—'}</FieldRow>
                <FieldRow label="Registration">{tenantEntity.registrationTitle || '—'}</FieldRow>
              </div>
            ) : (
              <div className="text-gray-600">No entity configured.</div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2">
            {!tenantEntity ? (
              <button onClick={() => setEntityFor(tenant)} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark">Add Entity</button>
            ) : (
              <button onClick={() => setEditBusinessFor({ tenant, entity: tenantEntity })} className="px-3 py-2 text-sm rounded border bg-white hover:bg-gray-50">Edit Business</button>
            )}
          </div>
        </Card>

        <Card>
          <CardHeaderRow left="Domains" right={<StatusPill ok={!!primaryDomain} labelOk="Primary linked" labelNo="No primary" />} />
          <div className="mt-3 text-sm text-gray-700">
            <FieldRow label="Primary">{primaryDomain?.domain || '—'}</FieldRow>
            <FieldRow label="Total">{(tenant.domains || []).length}</FieldRow>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button onClick={() => setDomainFor(tenant)} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark">Add Domain</button>
            {primaryDomain ? (
              <button onClick={() => setVerifyDomainFor(primaryDomain)} className="px-3 py-2 text-sm rounded border bg-white hover:bg-gray-50">Verify</button>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardHeaderRow left="Payments (Razorpay)" right={<StatusPill ok={!!razorpayConfig} />} />
          <div className="mt-3 text-sm text-gray-700">
            {razorpayLoading ? 'Loading…' : razorpayConfig ? (
              <>
                <FieldRow label="Key ID">{razorpayConfig.keyId || '—'}</FieldRow>
                <FieldRow label="Active">{String(razorpayConfig.active)}</FieldRow>
              </>
            ) : (
              <div className="text-gray-600">No Razorpay config set.</div>
            )}
            {razorpayError && <div className="mt-2 text-xs text-red-600">{razorpayError}</div>}
          </div>
          <div className="mt-4">
            <button onClick={() => setOpenRazorpay(true)} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark">Configure</button>
          </div>
        </Card>
      </div>

      {/* Sections */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Domains & Linking</div>
            <div className="text-sm text-gray-600">Manage domains, verify, link categories and domain settings.</div>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-3 py-2">Domain</th>
                <th className="text-left px-3 py-2">Primary</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Verified</th>
                <th className="text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(tenant.domains || []).length === 0 ? (
                <tr><td className="px-3 py-3 text-gray-500" colSpan={5}>No domains configured.</td></tr>
              ) : (tenant.domains || []).map((d) => (
                <tr key={d.id || d.domain} className="border-t">
                  <td className="px-3 py-2 font-medium text-gray-800">{d.domain}</td>
                  <td className="px-3 py-2">
                    {d.isPrimary ? <span className="px-2 py-0.5 rounded border text-[11px] bg-green-50 text-green-700 border-green-200">Primary</span> : <span className="px-2 py-0.5 rounded border text-[11px] bg-gray-50 text-gray-700">Secondary</span>}
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => setVerifyDomainFor(d)} className={`px-2 py-0.5 rounded border text-[11px] ${String(d.status).toUpperCase()==='ACTIVE' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'}`}>{d.status || '—'}</button>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">{d.verifiedAt ? formatIsoDate(d.verifiedAt) : '—'}</td>
                  <td className="px-3 py-2 text-right">
                    {d.isPrimary ? (
                      <>
                        <button onClick={() => setLinkCategoriesFor({ tenant, domain: d })} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">Link Categories</button>
                        <button onClick={() => setDomainSettingsFor({ tenant, domain: d })} className="ml-2 px-2 py-1 text-xs rounded border hover:bg-gray-50">Domain Settings</button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <div className="font-semibold">Linked Categories</div>
          {categoriesLoading ? <Loader size={48} label="Loading categories..." /> : null}
          {categoriesError && !categoriesLoading ? (
            <Alert className="mt-2">{categoriesError}</Alert>
          ) : null}
          {!categoriesLoading && !categoriesError ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {tenantCategories.length === 0 ? <div className="text-sm text-gray-500">No categories linked.</div> : tenantCategories.map(c => (
                <span key={c.id || c.categoryId || c?.category?.id || categoryDisplayName(c)} className="px-2 py-0.5 text-[11px] rounded border bg-gray-50 text-gray-700">
                  {categoryDisplayName(c)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeaderRow left="Theme & Branding (from Domain Settings)" right={<StatusPill ok={!!(primaryDomainSettings && Object.keys(primaryDomainSettings || {}).length > 0)} />} />
          <div className="mt-3 text-sm text-gray-700">
            {!primaryDomain ? (
              <div className="text-gray-600">Add a primary domain first.</div>
            ) : domainSettingsLoading ? (
              'Loading…'
            ) : domainSettingsError ? (
              <div className="text-xs text-red-600">{domainSettingsError}</div>
            ) : (
              <div className="space-y-2">
                <FieldRow label="Logo">{primaryDomainSettings?.branding?.logoUrl ? 'Set' : '—'}</FieldRow>
                <FieldRow label="Primary color">{primaryDomainSettings?.theme?.colors?.primary || '—'}</FieldRow>
                <FieldRow label="Default title">{primaryDomainSettings?.seo?.defaultMetaTitle || '—'}</FieldRow>
              </div>
            )}
          </div>
          <div className="mt-4">
            <button onClick={() => primaryDomain && setDomainSettingsFor({ tenant, domain: primaryDomain })} disabled={!primaryDomain} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">Edit Theme & Branding</button>
          </div>
        </Card>

        <Card>
          <CardHeaderRow left="ID Card Settings" right={<StatusPill ok={!!idCardSettings} />} />
          <div className="mt-3 text-sm text-gray-700">
            {idCardLoading ? 'Loading…' : idCardSettings ? (
              <div className="space-y-1">
                <FieldRow label="Template">{idCardSettings.templateId || '—'}</FieldRow>
                <FieldRow label="Prefix">{idCardSettings.idPrefix || '—'}</FieldRow>
                <FieldRow label="Digits">{String(idCardSettings.idDigits ?? '—')}</FieldRow>
              </div>
            ) : (
              <div className="text-gray-600">No ID card settings set.</div>
            )}
            {idCardError && <div className="mt-2 text-xs text-red-600">{idCardError}</div>}
          </div>
          <div className="mt-4">
            <button onClick={() => setOpenIdCard(true)} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark">Configure</button>
          </div>
        </Card>
      </div>

      <Card>
        <div className="font-semibold flex items-center justify-between">
          <span>Homepage Config</span>
          <span className={`px-2 py-0.5 rounded border text-[11px] ${themeResult ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700'}`}>
            {themeResult ? 'Loaded' : 'Not loaded'}
          </span>
        </div>

        {detectedHomepageStyle ? (
          <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-600">
            <div>Using style from Domain Settings: <span className="font-medium text-gray-900">{detectedHomepageStyle}</span></div>
            <button
              onClick={() => primaryDomain && setDomainSettingsFor({ tenant, domain: primaryDomain })}
              disabled={!primaryDomain}
              className="px-2.5 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-60"
            >
              Change style in Domain Settings
            </button>
          </div>
        ) : (
          <div className="mt-1 text-xs text-gray-600">Tip: Set homepage style in Domain Settings → Theme.</div>
        )}

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
          {detectedHomepageStyle ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Style</span>
              <span className="px-2 py-1 rounded border text-sm bg-gray-50 text-gray-700" title="Style is controlled by Domain Settings">
                {detectedHomepageStyle}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Style</span>
              <select
                className="border rounded px-2 py-1 text-sm bg-white"
                value={themeStyle}
                onChange={e => setThemeStyle(e.target.value)}
              >
                <option value="style1">style1</option>
                <option value="style2">style2</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button onClick={loadThemeCurrent} disabled={themeLoading} className="px-3 py-2 text-sm rounded border bg-white hover:bg-gray-50 disabled:opacity-60">Load current</button>
            <button onClick={loadThemeDefault} disabled={themeLoading} className="px-3 py-2 text-sm rounded border bg-white hover:bg-gray-50 disabled:opacity-60">Load defaults</button>
            <button onClick={applyThemeDefault} disabled={themeLoading} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">Apply defaults</button>
            {themeLoading ? <Loader size={20} /> : null}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button onClick={() => setThemeEditorMode('form')} className={`px-3 py-1.5 text-xs rounded border ${themeEditorMode === 'form' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white hover:bg-gray-50'}`}>Form</button>
          <button onClick={() => setThemeEditorMode('json-full')} className={`px-3 py-1.5 text-xs rounded border ${themeEditorMode === 'json-full' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white hover:bg-gray-50'}`}>JSON (full)</button>
          <button onClick={() => setThemeEditorMode('json-sections')} className={`px-3 py-1.5 text-xs rounded border ${themeEditorMode === 'json-sections' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white hover:bg-gray-50'}`}>JSON (sections)</button>
          <button onClick={() => {
            const sample = sampleFullConfig(themeStyle)
            setAllEditorsFromConfig(sample)
          }} className="px-3 py-1.5 text-xs rounded border bg-white hover:bg-gray-50">Insert sample</button>
        </div>

        <div className="mt-3">
          {themeEditorMode === 'form' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs font-semibold text-gray-700">Hero Count</div>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full border rounded p-2 text-sm"
                    value={themeConfig.heroCount ?? 0}
                    onChange={e => setThemeConfig(s => ({ ...s, heroCount: toIntOrUndefined(e.target.value) ?? 0 }))}
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-700">Top Stories Count</div>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full border rounded p-2 text-sm"
                    value={themeConfig.topStoriesCount ?? 0}
                    onChange={e => setThemeConfig(s => ({ ...s, topStoriesCount: toIntOrUndefined(e.target.value) ?? 0 }))}
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-700">Linked categories</div>
                  <div className="mt-1 px-2 py-2 text-sm border rounded bg-gray-50 text-gray-700">
                    {linkedCategoryOptions.length ? `${linkedCategoryOptions.length} linked` : 'None (link categories first)'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Homepage sections</div>
                  <div className="text-xs text-gray-600">Use dropdowns for categories and number inputs for counts.</div>
                </div>
                <button
                  className="px-3 py-2 text-sm rounded border bg-white hover:bg-gray-50"
                  onClick={() => {
                    const next = themeStyle === 'style2'
                      ? { key: 'section', title: '', position: (themeSections?.length || 0) * 10 + 10, style: 'grid', categorySlug: '', limit: 6 }
                      : { key: 'flashTicker', label: '', limit: 10 }
                    setThemeSections(prev => ([...(prev || []), next]))
                  }}
                >
                  Add section
                </button>
              </div>

              <div className="space-y-3">
                {(themeSections || []).length === 0 ? (
                  <div className="text-sm text-gray-500 border rounded p-3 bg-gray-50">No sections yet. Click “Add section” or “Insert sample”.</div>
                ) : (themeSections || []).map((sec, idx) => (
                  <div key={`${idx}_${sec?.key || 'section'}`} className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-800">Section {idx + 1}</div>
                      <button
                        className="px-2 py-1 text-xs rounded border hover:bg-gray-50"
                        onClick={() => setThemeSections(prev => (prev || []).filter((_, i) => i !== idx))}
                      >
                        Remove
                      </button>
                    </div>

                    {themeStyle === 'style1' ? (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <div className="text-xs font-semibold text-gray-700">Key</div>
                          <select
                            className="mt-1 w-full border rounded p-2 text-sm bg-white"
                            value={sec?.key || ''}
                            onChange={e => {
                              const v = e.target.value
                              setThemeSections(prev => prev.map((s, i) => i === idx ? ({ ...(s || {}), key: v }) : s))
                            }}
                          >
                            {STYLE1_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                            {sec?.key && !STYLE1_KEYS.includes(sec.key) ? <option value={sec.key}>{sec.key}</option> : null}
                          </select>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-700">Label</div>
                          <input
                            className="mt-1 w-full border rounded p-2 text-sm"
                            value={sec?.label || ''}
                            onChange={e => setThemeSections(prev => prev.map((s, i) => i === idx ? ({ ...(s || {}), label: e.target.value }) : s))}
                            placeholder="Flash News"
                          />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-700">Limit</div>
                          <input
                            type="number"
                            min={0}
                            className="mt-1 w-full border rounded p-2 text-sm"
                            value={toIntOrUndefined(sec?.limit) ?? ''}
                            onChange={e => setThemeSections(prev => prev.map((s, i) => i === idx ? ({ ...(s || {}), limit: toIntOrUndefined(e.target.value) }) : s))}
                            placeholder="e.g. 12"
                          />
                        </div>

                        <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs font-semibold text-gray-700">Category (single)</div>
                            <select
                              className="mt-1 w-full border rounded p-2 text-sm bg-white"
                              value={sec?.categorySlug || ''}
                              onChange={e => setThemeSections(prev => prev.map((s, i) => i === idx ? ({ ...(s || {}), categorySlug: e.target.value || undefined }) : s))}
                              disabled={!linkedCategoryOptions.length}
                            >
                              <option value="">—</option>
                              {linkedCategoryOptions.map(o => <option key={o.value} value={o.value}>{o.label} ({o.value})</option>)}
                            </select>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-700">Categories (multiple)</div>
                            <select
                              multiple
                              className="mt-1 w-full border rounded p-2 text-sm bg-white min-h-[92px]"
                              value={Array.isArray(sec?.categorySlugs) ? sec.categorySlugs : []}
                              onChange={e => {
                                const selected = Array.from(e.target.selectedOptions).map(o => o.value)
                                setThemeSections(prev => prev.map((s, i) => i === idx ? ({ ...(s || {}), categorySlugs: selected.length ? selected : undefined }) : s))
                              }}
                              disabled={!linkedCategoryOptions.length}
                            >
                              {linkedCategoryOptions.map(o => <option key={o.value} value={o.value}>{o.label} ({o.value})</option>)}
                            </select>
                            <div className="text-[11px] text-gray-500 mt-1">Hold Ctrl/⌘ to select multiple</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <div className="text-xs font-semibold text-gray-700">Key</div>
                          <input
                            className="mt-1 w-full border rounded p-2 text-sm"
                            value={sec?.key || ''}
                            onChange={e => setThemeSections(prev => prev.map((s, i) => i === idx ? ({ ...(s || {}), key: e.target.value }) : s))}
                            placeholder="hero / politics"
                          />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-700">Title</div>
                          <input
                            className="mt-1 w-full border rounded p-2 text-sm"
                            value={sec?.title || ''}
                            onChange={e => setThemeSections(prev => prev.map((s, i) => i === idx ? ({ ...(s || {}), title: e.target.value }) : s))}
                            placeholder="Politics"
                          />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-700">Position</div>
                          <input
                            type="number"
                            min={0}
                            className="mt-1 w-full border rounded p-2 text-sm"
                            value={toIntOrUndefined(sec?.position) ?? ''}
                            onChange={e => setThemeSections(prev => prev.map((s, i) => i === idx ? ({ ...(s || {}), position: toIntOrUndefined(e.target.value) }) : s))}
                            placeholder="10"
                          />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-700">Layout</div>
                          <select
                            className="mt-1 w-full border rounded p-2 text-sm bg-white"
                            value={sec?.style || ''}
                            onChange={e => setThemeSections(prev => prev.map((s, i) => i === idx ? ({ ...(s || {}), style: e.target.value }) : s))}
                          >
                            <option value="">—</option>
                            {STYLE2_LAYOUTS.map(x => <option key={x} value={x}>{x}</option>)}
                          </select>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-700">Category</div>
                          <select
                            className="mt-1 w-full border rounded p-2 text-sm bg-white"
                            value={sec?.categorySlug || ''}
                            onChange={e => setThemeSections(prev => prev.map((s, i) => i === idx ? ({ ...(s || {}), categorySlug: e.target.value || undefined }) : s))}
                            disabled={!linkedCategoryOptions.length}
                          >
                            <option value="">—</option>
                            {linkedCategoryOptions.map(o => <option key={o.value} value={o.value}>{o.label} ({o.value})</option>)}
                          </select>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-700">Limit</div>
                          <input
                            type="number"
                            min={0}
                            className="mt-1 w-full border rounded p-2 text-sm"
                            value={toIntOrUndefined(sec?.limit) ?? ''}
                            onChange={e => setThemeSections(prev => prev.map((s, i) => i === idx ? ({ ...(s || {}), limit: toIntOrUndefined(e.target.value) }) : s))}
                            placeholder="6"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-2">
                <button onClick={saveThemeSections} disabled={themeLoading} className="px-3 py-2 text-sm rounded border bg-white hover:bg-gray-50 disabled:opacity-60">Save sections</button>
                <button onClick={saveThemeFullConfig} disabled={themeLoading} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">Save full config</button>
                <div className="text-[11px] text-gray-500">Saves use the form values (JSON tab is advanced).</div>
              </div>
            </div>
          ) : themeEditorMode === 'json-full' ? (
            <>
              <div className="text-xs text-gray-600 mb-1">Full config (stored at <span className="font-mono">TenantTheme.homepageConfig.{themeStyle}</span>)</div>
              <textarea
                className="w-full border rounded p-2 text-xs font-mono bg-white"
                rows={10}
                value={themeFullJson}
                onChange={e => setThemeFullJson(e.target.value)}
                placeholder='{"heroCount":1,"topStoriesCount":5,"sections":[]}'
              />
              <div className="mt-2 flex items-center gap-2">
                <button onClick={saveThemeFullConfig} disabled={themeLoading} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">Save full config</button>
                <div className="text-[11px] text-gray-500">Calls <span className="font-mono">PATCH /tenant-theme/{'{tenantId}'}</span></div>
              </div>
            </>
          ) : (
            <>
              <div className="text-xs text-gray-600 mb-1">Sections payload (partial update by <span className="font-mono">key</span>)</div>
              <textarea
                className="w-full border rounded p-2 text-xs font-mono bg-white"
                rows={8}
                value={themeSectionsJson}
                onChange={e => setThemeSectionsJson(e.target.value)}
                placeholder='{"sections": []}'
              />
              <div className="mt-2 flex items-center gap-2">
                <button onClick={saveThemeSections} disabled={themeLoading} className="px-3 py-2 text-sm rounded border bg-white hover:bg-gray-50 disabled:opacity-60">Save sections</button>
                <div className="text-[11px] text-gray-500">Calls <span className="font-mono">PATCH /tenant-theme/.../sections</span></div>
              </div>
            </>
          )}
        </div>

        {themeError ? (
          <Alert className="mt-3">{themeError}</Alert>
        ) : null}

        {themeResult ? (
          <pre className="mt-3 text-xs bg-gray-50 border rounded p-3 overflow-auto max-h-[320px]">{JSON.stringify(themeResult, null, 2)}</pre>
        ) : (
          <div className="mt-3 text-sm text-gray-600">Manage homepage layout config stored in <span className="font-mono text-xs">TenantTheme.homepageConfig</span>.</div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold">Legal Pages</div>
            <div className="text-sm text-gray-600">Tenant static pages like Privacy Policy, Terms, About, etc. (slug locked).</div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded border text-[11px] ${legalConfiguredCount === LEGAL_PAGE_PRESETS.length ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
              Configured {legalConfiguredCount}/{LEGAL_PAGE_PRESETS.length}
            </span>
            <select className="border rounded px-2 py-1.5 text-sm bg-white" value={presetSlug} onChange={e => setPresetSlug(e.target.value)}>
              {LEGAL_PAGE_PRESETS.map(p => (
                <option key={p.slug} value={p.slug}>{p.title}</option>
              ))}
            </select>
            <button
              className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark"
              onClick={() => setOpenLegalPage({ slug: presetSlug })}
            >
              Open
            </button>
          </div>
        </div>

        {tenantPagesLoading ? (
          <div className="mt-3"><Loader size={36} label="Loading pages..." /></div>
        ) : tenantPagesError ? (
          <Alert className="mt-3">{tenantPagesError}</Alert>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2">Title</th>
                  <th className="text-left px-3 py-2">Slug</th>
                  <th className="text-left px-3 py-2">Published</th>
                  <th className="text-left px-3 py-2">Updated</th>
                  <th className="text-right px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {tenantPages.length === 0 ? (
                  <tr><td className="px-3 py-3 text-gray-500" colSpan={5}>No pages yet. Use the dropdown above to open a preset and save.</td></tr>
                ) : tenantPages.map(p => (
                  <tr key={p.id || p.slug} className="border-t">
                    <td className="px-3 py-2 font-medium text-gray-800">{p.title || p.slug}</td>
                    <td className="px-3 py-2"><span className="font-mono text-xs bg-gray-50 border rounded px-2 py-0.5">{p.slug}</span></td>
                    <td className="px-3 py-2">
                      {p.published ? (
                        <span className="px-2 py-0.5 rounded border text-[11px] bg-green-50 text-green-700 border-green-200">Yes</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded border text-[11px] bg-gray-50 text-gray-700">No</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">{formatIsoDate(p.updatedAt)}</td>
                    <td className="px-3 py-2 text-right">
                      <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={() => setOpenLegalPage({ slug: p.slug })}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {entityFor && (
        <AddEntityModal
          tenant={entityFor}
          onClose={() => setEntityFor(null)}
          onSaved={async () => {
            setEntityFor(null)
            await reloadAll()
          }}
        />
      )}

      {editBusinessFor && (
        <EditEntityBusinessModal
          tenant={editBusinessFor.tenant}
          entity={editBusinessFor.entity}
          onClose={() => setEditBusinessFor(null)}
          onSaved={async () => {
            setEditBusinessFor(null)
            await reloadAll()
          }}
        />
      )}

      {domainFor && (
        <AddDomainModal
          tenant={domainFor}
          onClose={() => setDomainFor(null)}
          onAdded={async () => {
            setDomainFor(null)
            await reloadAll()
          }}
        />
      )}

      {verifyDomainFor && (
        <VerifyDomainModal
          tenant={tenant}
          domain={verifyDomainFor}
          onClose={() => setVerifyDomainFor(null)}
          onVerified={async () => {
            setVerifyDomainFor(null)
            await reloadAll()
          }}
        />
      )}

      {linkCategoriesFor && (
        <LinkCategoriesModal
          tenant={linkCategoriesFor.tenant}
          domain={linkCategoriesFor.domain}
          onClose={() => setLinkCategoriesFor(null)}
          existingIds={(tenantCategories || []).map(c => c?.id || c?.categoryId || c?.category?.id).filter(Boolean)}
          onSaved={async () => {
            setLinkCategoriesFor(null)
            await reloadAll()
          }}
        />
      )}

      {domainSettingsFor && (
        <DomainSettingsDrawer
          tenant={domainSettingsFor.tenant}
          domain={domainSettingsFor.domain}
          onClose={async () => {
            setDomainSettingsFor(null)
            await reloadAll()
          }}
        />
      )}

      {openIdCard && (
        <TenantIdCardDrawer
          tenant={tenant}
          existing={idCardSettings}
          onClose={() => setOpenIdCard(false)}
          onSaved={async () => {
            setOpenIdCard(false)
            await reloadAll()
          }}
        />
      )}

      {openRazorpay && (
        <TenantRazorpayDrawer
          tenant={tenant}
          existing={razorpayConfig}
          onClose={() => setOpenRazorpay(false)}
          onSaved={async () => {
            setOpenRazorpay(false)
            await reloadAll()
          }}
        />
      )}

      {openLegalPage?.slug ? (
        <LegalPageDrawer
          tenant={tenant}
          slug={openLegalPage.slug}
          preset={LEGAL_PAGE_PRESETS.find(p => p.slug === openLegalPage.slug) || null}
          onClose={() => setOpenLegalPage(null)}
          onSaved={async () => {
            setOpenLegalPage(null)
            await fetchTenantPages(tenant)
          }}
        />
      ) : null}
    </div>
  )
}

function AddDomainModal({ tenant, onClose, onAdded }) {
  const [domain, setDomain] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  function isValidDomain(v) {
    if (!v) return false
    const s = v.trim().toLowerCase()
    if (s.includes('://') || s.includes('/') || /\s/.test(s)) return false
    const re = /^(?!-)([a-z0-9-]{1,63})(?<!-)(\.(?!-)([a-z0-9-]{1,63})(?<!-))+$/
    return re.test(s)
  }

  async function handleSave(e) {
    e.preventDefault()
    setMsg('')
    if (!tenant?.id) { setMsg('Missing tenant'); return }
    if (!isValidDomain(domain)) { setMsg('Enter a valid domain like example.com'); return }
    setSaving(true)
    try {
      const t = getToken()
      const base = getApiBase()
      const payload = { domain: domain.trim().toLowerCase(), isPrimary }
      const res = await fetch(`${base}/api/v1/tenants/${tenant.id}/domains`, {
        method: 'POST',
        headers: { accept: '*/*', 'Content-Type': 'application/json', Authorization: `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Add domain failed: ${res.status}${txt ? ` - ${txt}` : ''}`)
      }
      if (onAdded) await onAdded()
    } catch (e) {
      setMsg(e.message || 'Failed to add domain')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-[92vw] max-w-md rounded-xl shadow-xl border">
        <div className="px-4 py-3 border-b font-semibold">Add Domain to {tenant?.name}</div>
        <form onSubmit={handleSave} className="p-4 space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Domain</label>
            <input className="mt-1 w-full border rounded p-2" value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" />
            <div className="text-[11px] text-gray-500 mt-1">Enter only the domain name (no http/https)</div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} />
            Set as primary domain
          </label>
          {msg && <Alert>{msg}</Alert>}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving ? 'Adding...' : 'Add Domain'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LegalPageDrawer({ tenant, slug, preset, onClose, onSaved }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const brandName = String(tenant?.name || '').trim()
  const fillBrand = (value) => {
    const s = String(value ?? '')
    if (!s) return s
    if (!brandName) return s
    return s.split('{{BRAND_NAME}}').join(brandName)
  }

  const [title, setTitle] = useState(() => fillBrand(preset?.title || ''))
  const [published, setPublished] = useState(true)
  const [seoTitle, setSeoTitle] = useState(() => fillBrand(preset?.meta?.seoTitle || ''))
  const [seoDescription, setSeoDescription] = useState(() => fillBrand(preset?.meta?.seoDescription || ''))
  const [contentHtml, setContentHtml] = useState(() => fillBrand(preset?.contentHtml || ''))

  const base = getPagesApiBase()
  const pagesPrefix = getPagesApiPrefix()

  useEffect(() => {
    if (!brandName) return
    setTitle(prev => (String(prev || '').includes('{{BRAND_NAME}}') ? fillBrand(prev) : prev))
    setSeoTitle(prev => (String(prev || '').includes('{{BRAND_NAME}}') ? fillBrand(prev) : prev))
    setSeoDescription(prev => (String(prev || '').includes('{{BRAND_NAME}}') ? fillBrand(prev) : prev))
    setContentHtml(prev => (String(prev || '').includes('{{BRAND_NAME}}') ? fillBrand(prev) : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandName])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!tenant?.id || !slug) return
      setError('')
      setLoading(true)
      try {
        const t = getToken()
        const res = await fetch(`${base}/api/v1/tenants/${tenant.id}/pages/${encodeURIComponent(String(slug))}`, {
          headers: { accept: 'application/json', Authorization: `Bearer ${t?.token || ''}` }
        })
        if (res.status === 404) return
        if (!res.ok) throw new Error(`Load failed: ${res.status} - ${await parseApiError(res)}`)
        const data = await res.json().catch(() => null)
        if (cancelled || !data) return
        setTitle(data.title || preset?.title || '')
        setPublished(!!data.published)
        setSeoTitle(data.meta?.seoTitle || preset?.meta?.seoTitle || '')
        setSeoDescription(data.meta?.seoDescription || preset?.meta?.seoDescription || '')
        setContentHtml(data.contentHtml || preset?.contentHtml || '')
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load page')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id, slug])

  async function save() {
    if (!tenant?.id || !slug) return
    setError('')
    setSaving(true)
    try {
      if (!String(contentHtml || '').trim()) throw new Error('Content HTML is required')
      const t = getToken()

      const pageUrl = `${base}${pagesPrefix}/tenants/${tenant.id}/pages/${encodeURIComponent(String(slug))}`
      const collectionUrl = `${base}${pagesPrefix}/tenants/${tenant.id}/pages`
      const payload = {
        title: title || preset?.title || '',
        contentHtml,
        meta: { seoTitle, seoDescription },
        published: !!published
      }

      const headers = {
        accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${t?.token || ''}`
      }

      const doSave = (url, method, body) => fetch(url, { method, headers, body: JSON.stringify(body) })

      // Some deployments don't route PUT correctly; retry with PATCH.
      let res = await doSave(pageUrl, 'PUT', payload)
      if (res.status === 404) res = await doSave(pageUrl, 'PATCH', payload)

      // Optional fallback for APIs that upsert at the collection endpoint.
      if (res.status === 404) res = await doSave(collectionUrl, 'PUT', { slug, ...payload })
      if (res.status === 404) res = await doSave(collectionUrl, 'POST', { slug, ...payload })

      if (!res.ok) {
        const apiError = await parseApiError(res)
        const hint = res.status === 404 ? ' (Pages API not found; check NEXT_PUBLIC_PAGES_BACKEND_URL and NEXT_PUBLIC_PAGES_API_PREFIX)' : ''
        throw new Error(`Save failed: ${res.status} - ${apiError} (URL: ${pageUrl})${hint}`)
      }
      await res.json().catch(() => null)
      if (onSaved) await onSaved()
    } catch (e) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!tenant?.id || !slug) return
    const ok = window.confirm(`Delete page “${slug}”?`)
    if (!ok) return
    setError('')
    setSaving(true)
    try {
      const t = getToken()
      const res = await fetch(`${base}/api/v1/tenants/${tenant.id}/pages/${encodeURIComponent(String(slug))}`, {
        method: 'DELETE',
        headers: { accept: 'application/json', Authorization: `Bearer ${t?.token || ''}` }
      })
      if (!res.ok) throw new Error(`Delete failed: ${res.status} - ${await parseApiError(res)}`)
      await res.json().catch(() => null)
      if (onSaved) await onSaved()
    } catch (e) {
      setError(e.message || 'Failed to delete')
    } finally {
      setSaving(false)
    }
  }

  function applyPreset() {
    if (!preset) return
    setTitle(fillBrand(preset.title || ''))
    setSeoTitle(fillBrand(preset.meta?.seoTitle || ''))
    setSeoDescription(fillBrand(preset.meta?.seoDescription || ''))
    setContentHtml(fillBrand(preset.contentHtml || ''))
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-xl flex flex-col">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div>
            <div className="font-semibold">Legal Page</div>
            <div className="text-[11px] text-gray-600">{tenant?.name} · <span className="font-mono">{slug}</span> (slug locked)</div>
          </div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error ? <Alert>{error}</Alert> : null}
          {loading ? <div className="text-sm text-gray-500">Loading…</div> : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput label="Title" value={title} onChange={setTitle} />
            <div>
              <div className="text-[12px] text-gray-600 mb-1">Slug</div>
              <div className="px-2 py-2 rounded border bg-gray-50 text-sm font-mono text-gray-700">{slug}</div>
            </div>
            <Toggle label="Published" checked={published} onChange={setPublished} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput label="SEO Title" value={seoTitle} onChange={setSeoTitle} />
            <TextInput label="SEO Description" value={seoDescription} onChange={setSeoDescription} />
          </div>

          <Textarea label="Content HTML" value={contentHtml} onChange={setContentHtml} rows={14} />
          <div className="text-[11px] text-gray-500">Placeholders like <span className="font-mono">{'{{BRAND_NAME}}'}</span> are saved as-is and replaced on the public site/app.</div>
        </div>

        <div className="border-t p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {preset ? (
              <button className="px-3 py-2 text-sm rounded border bg-white hover:bg-gray-50" onClick={applyPreset} disabled={saving}>Reset to preset</button>
            ) : null}
            <button className="px-3 py-2 text-sm rounded border bg-white hover:bg-gray-50" onClick={remove} disabled={saving}>Delete</button>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 text-sm rounded border bg-white hover:bg-gray-50" onClick={onClose} disabled={saving}>Close</button>
            <button className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60" onClick={save} disabled={saving}>Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function VerifyDomainModal({ tenant, domain, onClose, onVerified }) {
  const [method, setMethod] = useState('DNS_TXT')
  const [force, setForce] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleVerify(e) {
    e.preventDefault()
    setMsg('')
    if (!domain?.id) { setMsg('Missing domain id'); return }
    setLoading(true)
    try {
      const t = getToken()
      const base = getApiBase()
      const payload = { method, force }
      const res = await fetch(`${base}/api/v1/domains/${domain.id}/verify`, {
        method: 'POST',
        headers: { accept: '*/*', 'Content-Type': 'application/json', Authorization: `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Verify failed: ${res.status}${txt ? ` - ${txt}` : ''}`)
      }
      if (onVerified) onVerified()
    } catch (e) {
      setMsg(e.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-[92vw] max-w-md rounded-xl shadow-xl border">
        <div className="px-4 py-3 border-b font-semibold">Verify Domain Status</div>
        <form onSubmit={handleVerify} className="p-4 space-y-4 text-sm">
          <div className="text-xs text-gray-600">Tenant: <span className="font-medium text-gray-800">{tenant?.name}</span></div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">Domain</label>
            <div className="mt-1 px-2 py-1 rounded border bg-gray-50 text-sm">{domain?.domain}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Method</label>
              <select className="mt-1 w-full border rounded p-2 bg-white" value={method} onChange={e => setMethod(e.target.value)}>
                <option value="DNS_TXT">DNS_TXT</option>
                <option value="DNS_CNAME">DNS_CNAME</option>
                <option value="FILE">FILE</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} /> Force re-verify
              </label>
            </div>
          </div>
          <div className="text-[11px] text-gray-500 leading-relaxed">
            Ensure required DNS TXT/CNAME record or verification file exists.
          </div>
          {msg && <Alert>{msg}</Alert>}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded border">Cancel</button>
            <button type="submit" disabled={loading} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{loading ? 'Verifying...' : 'Verify Domain'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddEntityModal({ tenant, onClose, onSaved }) {
  const [periodicity, setPeriodicity] = useState('')
  const [registrationDate, setRegistrationDate] = useState('')
  const [adminMobile, setAdminMobile] = useState('')
  const [publisherMobile, setPublisherMobile] = useState('')
  const [publisherName, setPublisherName] = useState('')
  const [editorName, setEditorName] = useState('')
  const [printingPressName, setPrintingPressName] = useState('')
  const [printingCityName, setPrintingCityName] = useState('')
  const [address, setAddress] = useState('')
  const [languageId, setLanguageId] = useState('')
  const [languages, setLanguages] = useState([])
  const [loadingLangs, setLoadingLangs] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadLangs() {
      try {
        setLoadingLangs(true)
        const t = getToken()
        const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com') + '/api/v1/languages', {
          headers: { accept: '*/*', Authorization: `Bearer ${t?.token || ''}` }
        })
        const json = await res.json().catch(() => null)
        const list = Array.isArray(json) ? json : (json?.data || [])
        if (!cancelled) setLanguages(list)
      } catch {
        if (!cancelled) setLanguages([])
      } finally {
        if (!cancelled) setLoadingLangs(false)
      }
    }
    if (tenant) loadLangs()
    return () => { cancelled = true }
  }, [tenant])

  function toDdMmYyyy(isoDate) {
    if (!isoDate) return ''
    const [y, m, d] = isoDate.split('-')
    if (!y || !m || !d) return isoDate
    return `${d}/${m}/${y}`
  }

  function onlyDigits10(v) {
    return (v || '').replace(/\D/g, '').slice(0, 10)
  }

  async function handleSave(e) {
    e.preventDefault()
    setMsg('')
    if (!tenant?.id) { setMsg('Missing tenant'); return }
    if (!periodicity) { setMsg('Please select periodicity'); return }
    if (!registrationDate) { setMsg('Please select registration date'); return }
    const admin = onlyDigits10(adminMobile)
    if (admin.length !== 10) { setMsg('Admin mobile must be 10 digits'); return }
    if (!publisherName.trim()) { setMsg('Publisher name is required'); return }
    if (!languageId) { setMsg('Please select language'); return }

    const payload = {
      periodicity: periodicity.toUpperCase(),
      registrationDate: toDdMmYyyy(registrationDate),
      adminMobile: admin,
      publisherMobile: publisherMobile ? onlyDigits10(publisherMobile) : undefined,
      publisherName: publisherName.trim(),
      editorName: editorName.trim() || undefined,
      printingPressName: printingPressName.trim() || undefined,
      printingCityName: printingCityName.trim() || undefined,
      address: address.trim() || undefined,
      languageId,
    }

    setSaving(true)
    try {
      const t = getToken()
      const base = getApiBase()
      const res = await fetch(`${base}/api/v1/tenants/${tenant.id}/entity/simple`, {
        method: 'POST',
        headers: { accept: '*/*', 'Content-Type': 'application/json', Authorization: `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Save failed: ${res.status}${txt ? ` - ${txt}` : ''}`)
      }
      if (onSaved) await onSaved()
    } catch (e) {
      setMsg(e.message || 'Failed to save entity')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-[92vw] max-w-lg rounded-xl shadow-xl border">
        <div className="px-4 py-3 border-b font-semibold">Add Entity to {tenant?.name}</div>
        <form onSubmit={handleSave} className="p-4 space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Periodicity</label>
              <select className="mt-1 w-full border rounded p-2 bg-white" value={periodicity} onChange={e => setPeriodicity(e.target.value)} required>
                <option value="">Select periodicity</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Registration Date</label>
              <input type="date" className="mt-1 w-full border rounded p-2" value={registrationDate} onChange={e => setRegistrationDate(e.target.value)} required />
              <div className="text-[11px] text-gray-500 mt-1">Format sent: DD/MM/YYYY</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Admin Mobile (10 digits)</label>
              <input inputMode="numeric" pattern="[0-9]{10}" maxLength={10} className="mt-1 w-full border rounded p-2" value={adminMobile} onChange={e => setAdminMobile(onlyDigits10(e.target.value))} placeholder="9999999999" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Publisher Mobile (optional)</label>
              <input inputMode="numeric" maxLength={10} className="mt-1 w-full border rounded p-2" value={publisherMobile} onChange={e => setPublisherMobile(onlyDigits10(e.target.value))} placeholder="9999999999" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Publisher Name</label>
              <input className="mt-1 w-full border rounded p-2" value={publisherName} onChange={e => setPublisherName(e.target.value)} placeholder="Publisher full name" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Editor Name (optional)</label>
              <input className="mt-1 w-full border rounded p-2" value={editorName} onChange={e => setEditorName(e.target.value)} placeholder="Editor full name" />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">Language {loadingLangs && <Loader size={20} />}</label>
            <select className="mt-1 w-full border rounded p-2 bg-white" value={languageId} onChange={e => setLanguageId(e.target.value)} required disabled={loadingLangs}>
              <option value="">{loadingLangs ? 'Loading languages...' : 'Select language'}</option>
              {!loadingLangs && languages.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Printing Press Name</label>
              <input className="mt-1 w-full border rounded p-2" value={printingPressName} onChange={e => setPrintingPressName(e.target.value)} placeholder="Press name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Printing City</label>
              <input className="mt-1 w-full border rounded p-2" value={printingCityName} onChange={e => setPrintingCityName(e.target.value)} placeholder="City" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Address</label>
            <textarea rows={3} className="mt-1 w-full border rounded p-2" value={address} onChange={e => setAddress(e.target.value)} placeholder="Office address" />
          </div>

          {msg && <Alert>{msg}</Alert>}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving ? 'Saving...' : 'Save Entity'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditEntityBusinessModal({ tenant, entity, onClose, onSaved }) {
  const [address, setAddress] = useState(entity?.address || '')
  const [printingPressName, setPrintingPressName] = useState(entity?.printingPressName || '')
  const [printingCityName, setPrintingCityName] = useState(entity?.printingCityName || '')
  const [printingDistrictId, setPrintingDistrictId] = useState(entity?.printingDistrictId || '')
  const [printingMandalId, setPrintingMandalId] = useState(entity?.printingMandalId || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    setMsg('')
    if (!tenant?.id) { setMsg('Missing tenant'); return }
    const payload = {
      address: address?.trim() || undefined,
      printingPressName: printingPressName?.trim() || undefined,
      printingCityName: printingCityName?.trim() || undefined,
      printingDistrictId: printingDistrictId?.trim() || undefined,
      printingMandalId: printingMandalId?.trim() || undefined,
    }
    setSaving(true)
    try {
      const t = getToken()
      const base = getApiBase()
      const res = await fetch(`${base}/api/v1/tenants/${tenant.id}/entity/business`, {
        method: 'PUT',
        headers: { accept: '*/*', 'Content-Type': 'application/json', Authorization: `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Update failed: ${res.status}${txt ? ` - ${txt}` : ''}`)
      }
      if (onSaved) await onSaved()
    } catch (e) {
      setMsg(e.message || 'Failed to update entity')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-[92vw] max-w-lg rounded-xl shadow-xl border">
        <div className="px-4 py-3 border-b font-semibold">Edit Business Details</div>
        <form onSubmit={handleSave} className="p-4 space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Address</label>
            <textarea rows={3} className="mt-1 w-full border rounded p-2" value={address} onChange={e => setAddress(e.target.value)} placeholder="Office address" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Printing Press Name</label>
              <input className="mt-1 w-full border rounded p-2" value={printingPressName} onChange={e => setPrintingPressName(e.target.value)} placeholder="Press name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Printing City</label>
              <input className="mt-1 w-full border rounded p-2" value={printingCityName} onChange={e => setPrintingCityName(e.target.value)} placeholder="City" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Printing District</label>
              <input className="mt-1 w-full border rounded p-2" value={printingDistrictId} onChange={e => setPrintingDistrictId(e.target.value)} placeholder="District (ID)" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Printing Mandal</label>
              <input className="mt-1 w-full border rounded p-2" value={printingMandalId} onChange={e => setPrintingMandalId(e.target.value)} placeholder="Mandal (ID)" />
            </div>
          </div>
          {msg && <Alert>{msg}</Alert>}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LinkCategoriesModal({ tenant, domain, onClose, onSaved, existingIds = [] }) {
  const DEFAULT_LANG = 'cmie0ihqu000eugb4w8giveum'
  const languageId = tenant?.entity?.language?.id || DEFAULT_LANG
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError('')
      setLoading(true)
      try {
        const t = getToken()
        const base = getApiBase()
        const res = await fetch(`${base}/api/v1/categories?languageId=${encodeURIComponent(languageId)}`, {
          headers: { accept: 'application/json', Authorization: `Bearer ${t?.token || ''}` }
        })
        if (!res.ok) throw new Error(`Load categories failed: ${res.status}`)
        const data = await res.json().catch(() => null)
        const list = Array.isArray(data) ? data : (data?.data || [])
        if (!cancelled) setCategories(list)
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load categories')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (domain?.id) load()
    return () => { cancelled = true }
  }, [domain?.id, languageId])

  useEffect(() => {
    setSelectedIds(Array.isArray(existingIds) ? existingIds : [])
  }, [existingIds, domain?.id])

  function toggle(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const t = getToken()
      const base = getApiBase()
      const res = await fetch(`${base}/api/v1/domains/${domain.id}/categories`, {
        method: 'PUT',
        headers: { accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${t?.token || ''}` },
        body: JSON.stringify({ categoryIds: selectedIds })
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Link categories failed: ${res.status}${txt ? ` - ${txt}` : ''}`)
      }
      if (onSaved) await onSaved()
    } catch (e) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-[92vw] max-w-lg rounded-xl shadow-xl border">
        <div className="px-4 py-3 border-b font-semibold">Link Categories to {domain?.domain}</div>
        <form onSubmit={handleSave} className="p-4 space-y-3 text-sm">
          <div className="text-xs text-gray-600">Language: <span className="font-medium text-gray-800">{tenant?.entity?.language?.name || 'Default'}</span></div>
          {loading && <Loader size={64} label="Loading categories..." />}
          {error && !loading && <Alert>{error}</Alert>}
          {!loading && !error && (
            <div className="max-h-64 overflow-auto border rounded">
              {categories.length === 0 ? (
                <div className="p-3 text-gray-500">No categories found.</div>
              ) : (
                <ul className="divide-y">
                  {categories.map(c => (
                    <li key={c.id} className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <input id={`cat_${c.id}`} type="checkbox" className="cursor-pointer" checked={selectedIds.includes(c.id)} onChange={() => toggle(c.id)} />
                        <label htmlFor={`cat_${c.id}`} className="cursor-pointer select-none">{categoryDisplayName(c)}</label>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded border">Cancel</button>
            <button type="submit" disabled={saving || loading} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving ? 'Saving...' : 'Save Links'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DomainSettingsDrawer({ tenant, domain, onClose }) {
  const [settings, setSettings] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [languages, setLanguages] = useState([])
  const [loadingLangs, setLoadingLangs] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchSettings() {
      setError('')
      try {
        const t = getToken()
        const base = getApiBase()
        const domainId = domain?.id || domain?.domainId || domain?.domain
        const res = await fetch(`${base}/api/v1/tenants/${tenant.id}/domains/${domainId}/settings`, {
          headers: { accept: 'application/json', Authorization: `Bearer ${t?.token || ''}` }
        })
        if (!res.ok) throw new Error(`Settings request failed: ${res.status}`)
        const data = await res.json().catch(() => ({}))
        const s = data?.settings || data?.effective || data
        if (!cancelled) {
          const normalized = s ? { ...s } : {}
          const currentTheme = normalized?.theme?.theme
          if (currentTheme === 'light' || currentTheme === 'dark') {
            normalized.theme = { ...(normalized.theme || {}), theme: 'style1' }
          }
          setSettings(normalized)
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load settings')
      }
    }
    if (tenant?.id && domain) fetchSettings()
    return () => { cancelled = true }
  }, [tenant, domain])

  useEffect(() => {
    let cancelled = false
    async function loadLangs() {
      try {
        setLoadingLangs(true)
        const t = getToken()
        const base = getApiBase()
        const res = await fetch(`${base}/api/v1/languages`, {
          headers: { accept: '*/*', Authorization: `Bearer ${t?.token || ''}` }
        })
        const json = await res.json().catch(() => null)
        const list = Array.isArray(json) ? json : (json?.data || [])
        if (!cancelled) setLanguages(list)
      } catch {
        if (!cancelled) setLanguages([])
      } finally {
        if (!cancelled) setLoadingLangs(false)
      }
    }
    if (tenant) loadLangs()
    return () => { cancelled = true }
  }, [tenant])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const DEFAULT_SETTINGS = {
    branding: { logoUrl: '', faviconUrl: '' },
    theme: {
      theme: 'style1',
      colors: { primary: '#3F51B5', secondary: '#CDDC39', accent: '#FF9800' },
      typography: { fontFamily: 'Inter, Arial, sans-serif', baseSize: 16 },
      layout: { header: 'classic', footer: 'minimal', showTopBar: true, showTicker: true },
    },
    navigation: { menu: [{ label: 'Home', href: '/' }, { label: 'Politics', href: '/category/politics' }] },
    content: { defaultLanguage: 'en', supportedLanguages: ['en', 'te'] },
    seo: {
      defaultMetaTitle: 'Kaburlu News',
      defaultMetaDescription: 'Latest breaking news and updates.',
      ogImageUrl: 'https://cdn.kaburlu.com/seo/default-og.png',
      canonicalBaseUrl: 'https://news.kaburlu.com',
    },
    notifications: { enabled: true, providers: { webpush: { publicKey: '' } } },
    integrations: { analytics: { provider: 'gtag', measurementId: '' } },
    flags: { enableComments: true, enableBookmarks: true },
    customCss: 'body{font-family:Inter;}',
  }

  async function save() {
    setError('')
    setSaving(true)
    try {
      const t = getToken()
      const base = getApiBase()
      const domainId = domain?.id || domain?.domainId || domain?.domain
      let res = await fetch(`${base}/api/v1/tenants/${tenant.id}/domains/${domainId}/settings`, {
        method: 'PATCH',
        headers: { accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${t?.token || ''}` },
        body: JSON.stringify(settings || {})
      })
      if (!res.ok && (res.status === 405 || res.status === 404 || res.status === 400)) {
        res = await fetch(`${base}/api/v1/tenants/${tenant.id}/domains/${domainId}/settings`, {
          method: 'PUT',
          headers: { accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${t?.token || ''}` },
          body: JSON.stringify(settings || {})
        })
      }
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Save failed: ${res.status}${txt ? ` - ${txt}` : ''}`)
      }
      if (onClose) onClose()
    } catch (e) {
      setError(e.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function uploadMedia(file) {
    const t = getToken()
    const base = getApiBase()
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${base}/api/v1/media/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${t?.token || ''}` },
      body: fd,
    })
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
    const json = await res.json().catch(() => null)
    return json?.publicUrl || json?.url || json?.location
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl flex flex-col">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div>
            <div className="font-semibold">Domain Settings</div>
            <div className="text-[11px] text-gray-600">{tenant?.name} · {domain?.domain}</div>
          </div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {error && <Alert>{error}</Alert>}
          {!settings && !error && <div className="text-sm text-gray-500">Loading settings…</div>}
          {settings && (
            <>
              {Object.keys(settings || {}).length === 0 && (
                <div className="p-3 rounded border bg-amber-50 text-amber-800 text-sm flex items-center justify-between">
                  <span>No settings found for this domain. You can start with sensible defaults.</span>
                  <button className="px-3 py-1.5 rounded bg-amber-600 text-white hover:bg-amber-700" onClick={() => setSettings(DEFAULT_SETTINGS)}>Use Defaults</button>
                </div>
              )}
              <section>
                <div className="text-sm font-semibold mb-2">SEO</div>
                <div className="grid grid-cols-2 gap-3">
                  <TextInput label="Canonical Base URL" value={settings.seo?.canonicalBaseUrl || ''} onChange={v => setSettings(s => ({ ...s, seo: { ...(s.seo || {}), canonicalBaseUrl: v } }))} />
                  <div>
                    <TextInput label="OG Image URL" value={settings.seo?.ogImageUrl || ''} onChange={v => setSettings(s => ({ ...s, seo: { ...(s.seo || {}), ogImageUrl: v } }))} />
                    <div className="mt-1 flex items-center gap-2">
                      <FileButton label="Upload" onFile={async (file) => {
                        try {
                          const url = await uploadMedia(file)
                          setSettings(s => ({ ...s, seo: { ...(s.seo || {}), ogImageUrl: url } }))
                        } catch (e) {
                          setError(e.message)
                        }
                      }} />
                      {settings.seo?.ogImageUrl && <a href={settings.seo.ogImageUrl} target="_blank" rel="noreferrer" className="text-xs text-brand">Preview</a>}
                    </div>
                    {settings.seo?.ogImageUrl && (
                      <div className="mt-2">
                        <img src={settings.seo.ogImageUrl} alt="OG preview" className="h-16 rounded border object-cover" />
                      </div>
                    )}
                  </div>
                  <TextInput label="Default Meta Title" value={settings.seo?.defaultMetaTitle || ''} onChange={v => setSettings(s => ({ ...s, seo: { ...(s.seo || {}), defaultMetaTitle: v } }))} />
                  <TextInput label="Default Meta Description" value={settings.seo?.defaultMetaDescription || ''} onChange={v => setSettings(s => ({ ...s, seo: { ...(s.seo || {}), defaultMetaDescription: v } }))} />
                </div>
              </section>

              <section>
                <div className="text-sm font-semibold mb-2">Theme</div>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Theme" value={settings.theme?.theme || 'style1'} options={[{ value: 'style1', label: 'Style 1' }, { value: 'style2', label: 'Style 2' }]} onChange={v => setSettings(s => ({ ...s, theme: { ...(s.theme || {}), theme: v } }))} />
                  <ColorInput label="Primary Color" value={settings.theme?.colors?.primary || '#3F51B5'} onChange={v => setSettings(s => ({ ...s, theme: { ...(s.theme || {}), colors: { ...(s.theme?.colors || {}), primary: v } } }))} />
                  <ColorInput label="Secondary Color" value={settings.theme?.colors?.secondary || '#CDDC39'} onChange={v => setSettings(s => ({ ...s, theme: { ...(s.theme || {}), colors: { ...(s.theme?.colors || {}), secondary: v } } }))} />
                  <ColorInput label="Accent Color" value={settings.theme?.colors?.accent || '#FF9800'} onChange={v => setSettings(s => ({ ...s, theme: { ...(s.theme || {}), colors: { ...(s.theme?.colors || {}), accent: v } } }))} />
                  <TextInput label="Header Layout" value={settings.theme?.layout?.header || ''} onChange={v => setSettings(s => ({ ...s, theme: { ...(s.theme || {}), layout: { ...(s.theme?.layout || {}), header: v } } }))} />
                  <TextInput label="Footer Layout" value={settings.theme?.layout?.footer || ''} onChange={v => setSettings(s => ({ ...s, theme: { ...(s.theme || {}), layout: { ...(s.theme?.layout || {}), footer: v } } }))} />
                  <div className="col-span-2 grid grid-cols-2 gap-3">
                    <Toggle label="Show Top Bar" checked={!!settings.theme?.layout?.showTopBar} onChange={v => setSettings(s => ({ ...s, theme: { ...(s.theme || {}), layout: { ...(s.theme?.layout || {}), showTopBar: v } } }))} />
                    <Toggle label="Show Ticker" checked={!!settings.theme?.layout?.showTicker} onChange={v => setSettings(s => ({ ...s, theme: { ...(s.theme || {}), layout: { ...(s.theme?.layout || {}), showTicker: v } } }))} />
                  </div>
                </div>
              </section>

              <section>
                <div className="text-sm font-semibold mb-2">Branding</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <TextInput label="Logo URL" value={settings.branding?.logoUrl || ''} onChange={v => setSettings(s => ({ ...s, branding: { ...(s.branding || {}), logoUrl: v } }))} />
                    <div className="mt-1 flex items-center gap-2">
                      <FileButton label="Upload" onFile={async (file) => {
                        try {
                          const url = await uploadMedia(file)
                          setSettings(s => ({ ...s, branding: { ...(s.branding || {}), logoUrl: url } }))
                        } catch (e) {
                          setError(e.message)
                        }
                      }} />
                      {settings.branding?.logoUrl && <a href={settings.branding.logoUrl} target="_blank" rel="noreferrer" className="text-xs text-brand">Preview</a>}
                    </div>
                    {settings.branding?.logoUrl && (
                      <div className="mt-2">
                        <img src={settings.branding.logoUrl} alt="Logo preview" className="h-10 rounded border object-contain bg-white p-1" />
                      </div>
                    )}
                  </div>
                  <div>
                    <TextInput label="Favicon URL" value={settings.branding?.faviconUrl || ''} onChange={v => setSettings(s => ({ ...s, branding: { ...(s.branding || {}), faviconUrl: v } }))} />
                    <div className="mt-1 flex items-center gap-2">
                      <FileButton label="Upload" onFile={async (file) => {
                        try {
                          const url = await uploadMedia(file)
                          setSettings(s => ({ ...s, branding: { ...(s.branding || {}), faviconUrl: url } }))
                        } catch (e) {
                          setError(e.message)
                        }
                      }} />
                      {settings.branding?.faviconUrl && <a href={settings.branding.faviconUrl} target="_blank" rel="noreferrer" className="text-xs text-brand">Preview</a>}
                    </div>
                    {settings.branding?.faviconUrl && (
                      <div className="mt-2">
                        <img src={settings.branding.faviconUrl} alt="Favicon preview" className="h-8 w-8 rounded border object-contain bg-white p-1" />
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section>
                <div className="text-sm font-semibold mb-2">Content</div>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label={loadingLangs ? 'Default Language (loading...)' : 'Default Language'}
                    value={settings.content?.defaultLanguage || ''}
                    options={(languages || []).map(l => ({ value: l.code, label: `${l.name || l.nativeName || l.code} (${l.code})` }))}
                    onChange={v => setSettings(s => ({ ...s, content: { ...(s.content || {}), defaultLanguage: v } }))}
                  />
                  <TextInput
                    label="Supported Languages (comma-separated)"
                    value={(settings.content?.supportedLanguages || []).join(', ')}
                    onChange={v => setSettings(s => ({ ...s, content: { ...(s.content || {}), supportedLanguages: v.split(',').map(x => x.trim()).filter(Boolean) } }))}
                  />
                </div>
              </section>

              <section>
                <div className="text-sm font-semibold mb-2">Custom CSS</div>
                <Textarea label="CSS" value={settings.customCss || ''} onChange={v => setSettings(s => ({ ...s, customCss: v }))} rows={6} />
              </section>

              <section>
                <div className="text-sm font-semibold mb-2">Flags</div>
                <div className="grid grid-cols-2 gap-3">
                  <Toggle label="Enable Comments" checked={!!settings.flags?.enableComments} onChange={v => setSettings(s => ({ ...s, flags: { ...(s.flags || {}), enableComments: v } }))} />
                  <Toggle label="Enable Bookmarks" checked={!!settings.flags?.enableBookmarks} onChange={v => setSettings(s => ({ ...s, flags: { ...(s.flags || {}), enableBookmarks: v } }))} />
                </div>
              </section>
            </>
          )}
        </div>
        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded border">Cancel</button>
          <button onClick={save} disabled={saving || !settings} className="px-3 py-2 text-sm rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  )
}

function TenantRazorpayDrawer({ tenant, existing, onClose, onSaved }) {
  const [keyId, setKeyId] = useState(existing?.keyId || '')
  const [keySecret, setKeySecret] = useState('')
  const [active, setActive] = useState(existing ? Boolean(existing.active) : true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    setKeyId(existing?.keyId || '')
    setKeySecret('')
    setActive(existing ? Boolean(existing.active) : true)
    setMsg('')
  }, [existing])

  async function handleSave(e) {
    e.preventDefault()
    setMsg('')
    if (!tenant?.id) { setMsg('Missing tenant'); return }
    if (!keyId.trim()) { setMsg('Key ID is required'); return }
    if (!existing && !keySecret.trim()) { setMsg('Key Secret is required for create'); return }

    setSaving(true)
    try {
      const t = getToken()
      const base = getApiBase()
      const payload = { keyId: keyId.trim(), active: Boolean(active) }
      if (!existing || keySecret.trim()) payload.keySecret = keySecret.trim()
      const method = existing ? 'PUT' : 'POST'
      const res = await fetch(`${base}/api/v1/tenants/${tenant.id}/razorpay-config`, {
        method,
        headers: { accept: '*/*', 'Content-Type': 'application/json', Authorization: `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const emsg = (json && (json.message || json.error)) || `${method} failed: ${res.status}`
        throw new Error(emsg)
      }
      if (onSaved) await onSaved()
    } catch (e) {
      setMsg(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">{existing ? 'Edit Razorpay Config' : 'Add Razorpay Config'}</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          <div className="text-sm text-gray-700">
            Tenant: <span className="font-medium">{tenant?.name}</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">Key ID</label>
            <input className="mt-1 w-full border rounded p-2" value={keyId} onChange={e => setKeyId(e.target.value)} placeholder="rzp_test_..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">Key Secret {existing ? '(optional)' : ''}</label>
            <input className="mt-1 w-full border rounded p-2" value={keySecret} onChange={e => setKeySecret(e.target.value)} placeholder="Enter secret" />
            {existing ? <div className="text-[11px] text-gray-500 mt-1">Leave blank to keep current secret.</div> : null}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active
          </label>
          {msg && <Alert>{msg}</Alert>}
          <div className="pt-2 flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TenantIdCardDrawer({ tenant, existing, onClose, onSaved }) {
  const blankForm = () => ({
    templateId: 'STYLE_1',
    frontLogoUrl: '',
    roundStampUrl: '',
    signUrl: '',
    primaryColor: '#004f9f',
    secondaryColor: '#ff0000',
    termsJson: [''],
    officeAddress: '',
    helpLine1: '',
    helpLine2: '',
    validityType: 'PER_USER_DAYS',
    validityDays: 0,
    fixedValidUntil: '',
    idPrefix: 'KM',
    idDigits: 6,
  })

  const [form, setForm] = useState(existing ? {
    templateId: existing.templateId || 'STYLE_1',
    frontLogoUrl: existing.frontLogoUrl || '',
    roundStampUrl: existing.roundStampUrl || '',
    signUrl: existing.signUrl || '',
    primaryColor: existing.primaryColor || '#004f9f',
    secondaryColor: existing.secondaryColor || '#ff0000',
    termsJson: Array.isArray(existing.termsJson) && existing.termsJson.length ? existing.termsJson.slice(0, 5) : [''],
    officeAddress: existing.officeAddress || '',
    helpLine1: existing.helpLine1 || '',
    helpLine2: existing.helpLine2 || '',
    validityType: existing.validityType || 'PER_USER_DAYS',
    validityDays: existing.validityDays ?? 0,
    fixedValidUntil: existing.fixedValidUntil || '',
    idPrefix: existing.idPrefix || 'KM',
    idDigits: existing.idDigits ?? 6,
  } : blankForm())

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    setForm(existing ? {
      templateId: existing.templateId || 'STYLE_1',
      frontLogoUrl: existing.frontLogoUrl || '',
      roundStampUrl: existing.roundStampUrl || '',
      signUrl: existing.signUrl || '',
      primaryColor: existing.primaryColor || '#004f9f',
      secondaryColor: existing.secondaryColor || '#ff0000',
      termsJson: Array.isArray(existing.termsJson) && existing.termsJson.length ? existing.termsJson.slice(0, 5) : [''],
      officeAddress: existing.officeAddress || '',
      helpLine1: existing.helpLine1 || '',
      helpLine2: existing.helpLine2 || '',
      validityType: existing.validityType || 'PER_USER_DAYS',
      validityDays: existing.validityDays ?? 0,
      fixedValidUntil: existing.fixedValidUntil || '',
      idPrefix: existing.idPrefix || 'KM',
      idDigits: existing.idDigits ?? 6,
    } : blankForm())
    setMsg('')
  }, [existing])

  const updateForm = (patch) => setForm(f => ({ ...f, ...patch }))

  async function uploadMedia(file) {
    const t = getToken()
    const base = getApiBase()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('key', file.name || 'image')
    formData.append('filename', file.name || 'image')
    formData.append('folder', '')
    formData.append('kind', 'image')
    const res = await fetch(`${base}/api/v1/media/upload`, { method: 'POST', headers: { Authorization: `Bearer ${t?.token || ''}` }, body: formData })
    const json = await res.json().catch(() => null)
    if (!res.ok) throw new Error((json && (json.message || json.error)) || `Upload failed: ${res.status}`)
    return json?.publicUrl || json?.data?.publicUrl || json?.data?.url || json?.url || ''
  }

  async function handleSave(e) {
    e.preventDefault()
    setMsg('')
    if (!tenant?.id) { setMsg('Missing tenant'); return }

    setSaving(true)
    try {
      const t = getToken()
      const base = getApiBase()
      const payload = {
        templateId: form.templateId,
        frontLogoUrl: form.frontLogoUrl,
        roundStampUrl: form.roundStampUrl,
        signUrl: form.signUrl,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        termsJson: (form.termsJson || []).map(x => String(x).trim()).filter(Boolean).slice(0, 5),
        officeAddress: form.officeAddress,
        helpLine1: form.helpLine1,
        helpLine2: form.helpLine2,
        validityType: form.validityType,
        validityDays: form.validityType === 'PER_USER_DAYS' ? Number(form.validityDays || 0) : 0,
        fixedValidUntil: form.validityType === 'FIXED_END_DATE' ? form.fixedValidUntil : null,
        idPrefix: form.idPrefix,
        idDigits: Number(form.idDigits || 6),
      }
      const res = await fetch(`${base}/api/v1/tenants/${tenant.id}/id-card-settings`, {
        method: 'PUT',
        headers: { accept: '*/*', 'Content-Type': 'application/json', Authorization: `Bearer ${t?.token || ''}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`Save failed: ${res.status}${body ? ` - ${body}` : ''}`)
      }
      if (onSaved) await onSaved()
    } catch (e) {
      setMsg(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function addTerm() {
    updateForm({ termsJson: [...(form.termsJson || []), ''].slice(0, 5) })
  }

  function updateTerm(index, value) {
    const next = (form.termsJson || []).slice()
    next[index] = value
    updateForm({ termsJson: next })
  }

  function removeTerm(index) {
    const next = (form.termsJson || []).slice().filter((_, i) => i !== index)
    updateForm({ termsJson: next.length ? next : [''] })
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-semibold">Tenant ID Card Settings</div>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          <div className="text-sm text-gray-700">Tenant: <span className="font-medium">{tenant?.name}</span></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField label="Template" value={form.templateId} options={[{ value: 'STYLE_1', label: 'STYLE_1' }, { value: 'STYLE_2', label: 'STYLE_2' }]} onChange={v => updateForm({ templateId: v })} />
            <TextField label="Office Address" value={form.officeAddress} onChange={v => updateForm({ officeAddress: v })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Help Line 1" value={form.helpLine1} onChange={v => updateForm({ helpLine1: v })} />
            <TextField label="Help Line 2" value={form.helpLine2} onChange={v => updateForm({ helpLine2: v })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ColorField label="Primary Color" value={form.primaryColor} onChange={v => updateForm({ primaryColor: v })} />
            <ColorField label="Secondary Color" value={form.secondaryColor} onChange={v => updateForm({ secondaryColor: v })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AssetField label="Front Logo URL" value={form.frontLogoUrl} onChange={v => updateForm({ frontLogoUrl: v })} onUpload={async (file) => {
              try { const url = await uploadMedia(file); updateForm({ frontLogoUrl: url }) } catch (e) { setMsg(e.message) }
            }} />
            <AssetField label="Round Stamp URL" value={form.roundStampUrl} onChange={v => updateForm({ roundStampUrl: v })} onUpload={async (file) => {
              try { const url = await uploadMedia(file); updateForm({ roundStampUrl: url }) } catch (e) { setMsg(e.message) }
            }} />
            <AssetField label="Signature URL" value={form.signUrl} onChange={v => updateForm({ signUrl: v })} onUpload={async (file) => {
              try { const url = await uploadMedia(file); updateForm({ signUrl: url }) } catch (e) { setMsg(e.message) }
            }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField
              label="Validity Type"
              value={form.validityType}
              options={[{ value: 'PER_USER_DAYS', label: 'PER_USER_DAYS' }, { value: 'FIXED_END_DATE', label: 'FIXED_END_DATE' }]}
              onChange={v => updateForm({ validityType: v })}
            />
            {form.validityType === 'PER_USER_DAYS' ? (
              <NumberField label="Validity Days" value={form.validityDays} onChange={v => updateForm({ validityDays: v })} />
            ) : (
              <TextField label="Fixed Valid Until" value={form.fixedValidUntil} onChange={v => updateForm({ fixedValidUntil: v })} />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="ID Prefix" value={form.idPrefix} onChange={v => updateForm({ idPrefix: v })} />
            <NumberField label="ID Digits" value={form.idDigits} onChange={v => updateForm({ idDigits: v })} />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div className="text-[12px] text-gray-600">Terms (max 5)</div>
              <button type="button" onClick={addTerm} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">Add</button>
            </div>
            <div className="mt-2 space-y-2">
              {(form.termsJson || ['']).map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input className="flex-1 w-full rounded border px-2 py-1.5 text-sm" value={t} onChange={e => updateTerm(i, e.target.value)} placeholder={`Term ${i + 1}`} />
                  <button type="button" onClick={() => removeTerm(i)} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">Remove</button>
                </div>
              ))}
            </div>
          </div>

          {msg && <Alert>{msg}</Alert>}

          <div className="pt-2 flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <div className="text-[12px] text-gray-600 mb-1">{label}</div>
      <input className="w-full rounded border px-2 py-1.5 text-sm" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  )
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="text-[12px] text-gray-600 mb-1">{label}</div>
      <input type="number" className="w-full rounded border px-2 py-1.5 text-sm" value={String(value ?? '')} onChange={e => onChange(Number(e.target.value || 0))} />
    </label>
  )
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="block">
      <div className="text-[12px] text-gray-600 mb-1">{label}</div>
      <select className="w-full rounded border px-2 py-1.5 text-sm" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="text-[12px] text-gray-600 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <input type="color" className="h-9 w-10 border rounded" value={value} onChange={e => onChange(e.target.value)} />
        <input className="flex-1 rounded border px-2 py-1.5 text-sm" value={value} onChange={e => onChange(e.target.value)} />
      </div>
    </label>
  )
}

function AssetField({ label, value, onChange, onUpload }) {
  return (
    <div>
      <TextField label={label} value={value} onChange={onChange} placeholder="https://..." />
      <div className="mt-1 flex items-center gap-2">
        <FileButton label="Upload" onFile={onUpload} />
        {value ? <a className="text-xs text-brand" href={value} target="_blank" rel="noreferrer">Preview</a> : null}
      </div>
    </div>
  )
}

function TextInput({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="text-[12px] text-gray-600 mb-1">{label}</div>
      <input className="w-full rounded border px-2 py-1.5 text-sm" value={value} onChange={e => onChange(e.target.value)} />
    </label>
  )
}

function Select({ label, value, options, onChange }) {
  return (
    <label className="block">
      <div className="text-[12px] text-gray-600 mb-1">{label}</div>
      <select className="w-full rounded border px-2 py-1.5 text-sm" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

function Textarea({ label, value, onChange, rows = 4 }) {
  return (
    <label className="block">
      <div className="text-[12px] text-gray-600 mb-1">{label}</div>
      <textarea className="w-full rounded border px-2 py-1.5 text-sm" rows={rows} value={value} onChange={e => onChange(e.target.value)} />
    </label>
  )
}

function ColorInput({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="text-[12px] text-gray-600 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <input type="color" className="h-9 w-10 border rounded" value={value} onChange={e => onChange(e.target.value)} />
        <input className="flex-1 rounded border px-2 py-1.5 text-sm" value={value} onChange={e => onChange(e.target.value)} />
        <span className="h-6 w-6 rounded-full border" style={{ backgroundColor: value }} />
      </div>
    </label>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

function FileButton({ label = 'Upload', onFile }) {
  return (
    <button
      type="button"
      className="px-2 py-1.5 text-xs rounded border hover:bg-gray-50"
      onClick={() => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = (e) => {
          const file = e.target.files && e.target.files[0]
          if (file && onFile) onFile(file)
        }
        input.click()
      }}
    >
      {label}
    </button>
  )
}
