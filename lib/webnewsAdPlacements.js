/**
 * Webnews v2 ad positions — mirror kaburlu-Webnews/lib/tenants.ts AdPosition + AdSlot SIZES.
 * Admin Ads tab uses these ids for private ads + AdSense slot mapping.
 */

/** @typedef {'header'|'sidebar'|'in-article'|'in-feed'|'sticky-mobile'|'festival'|'sidebar-sticky'|'below-article'|'popup'} WebnewsAdPosition */

/** @type {Array<{ id: WebnewsAdPosition, name: string, nameTe: string, desc: string, desktop: string, mobile: string, page: string, waterfall: string, preview: { top?: string, left?: string, width?: string, height?: string, label?: string } }>} */
export const WEBNEWS_AD_PLACEMENTS = [
  {
    id: 'header',
    name: 'Header Leaderboard',
    nameTe: 'హెడర్ బ్యానర్',
    desc: 'Navigation కింద — homepage + category',
    desktop: '728×90',
    mobile: '320×100',
    page: 'Home / Category',
    waterfall: 'Private → AdSense',
    preview: { top: '8%', left: '4%', width: '92%', height: '10%', label: '728×90' },
  },
  {
    id: 'sidebar',
    name: 'Sidebar Top',
    nameTe: 'సైడ్‌బార్ టాప్',
    desc: 'Right column పైభాగం (classic layout)',
    desktop: '300×250',
    mobile: '300×250',
    page: 'Home / Article',
    waterfall: 'Private → AdSense',
    preview: { top: '22%', left: '72%', width: '24%', height: '18%', label: '300×250' },
  },
  {
    id: 'sidebar-sticky',
    name: 'Sidebar Sticky (Half-page)',
    nameTe: 'స్టిక్కీ సైడ్‌బార్',
    desc: 'Scroll తో sticky — desktop RPM ఎక్కువ',
    desktop: '300×600',
    mobile: '—',
    page: 'Home / Article',
    waterfall: 'Private → AdSense',
    preview: { top: '42%', left: '72%', width: '24%', height: '32%', label: '300×600' },
  },
  {
    id: 'in-feed',
    name: 'In-Feed (News list)',
    nameTe: 'లిస్ట్ మధ్య',
    desc: 'Feed లో ప్రతి N వార్తల తర్వాత',
    desktop: '728×120',
    mobile: 'Full width',
    page: 'Home / Category',
    waterfall: 'Private → AdSense',
    preview: { top: '48%', left: '4%', width: '64%', height: '12%', label: 'In-feed' },
  },
  {
    id: 'in-article',
    name: 'In-Article',
    nameTe: 'ఆర్టికల్ మధ్య',
    desc: 'Paragraphs మధ్య (max density safe)',
    desktop: 'Responsive',
    mobile: 'Responsive',
    page: 'Article',
    waterfall: 'Private → AdSense',
    preview: { top: '58%', left: '4%', width: '64%', height: '10%', label: 'In-article' },
  },
  {
    id: 'below-article',
    name: 'Below Article',
    nameTe: 'ఆర్టికల్ చివర',
    desc: 'Related news ముందు',
    desktop: '300×250',
    mobile: '300×250',
    page: 'Article',
    waterfall: 'Private → AdSense',
    preview: { top: '72%', left: '4%', width: '64%', height: '14%', label: 'Below' },
  },
  {
    id: 'sticky-mobile',
    name: 'Mobile Sticky Bottom',
    nameTe: 'మొబైల్ బాటమ్',
    desc: 'Bottom nav పై 320×50',
    desktop: '—',
    mobile: '320×50',
    page: 'All (mobile)',
    waterfall: 'Private → AdSense',
    preview: { top: '88%', left: '4%', width: '92%', height: '8%', label: '320×50' },
  },
  {
    id: 'festival',
    name: 'Festival Sponsor',
    nameTe: 'పండుగ స్పాన్సర్',
    desc: 'Festival greeting hero slot',
    desktop: '728×90',
    mobile: '320×90',
    page: 'Festival mode',
    waterfall: 'Config / private',
    preview: { top: '18%', left: '4%', width: '64%', height: '8%', label: 'Festival' },
  },
  {
    id: 'popup',
    name: 'Site Popup (modal)',
    nameTe: 'పాపప్ మోడల్',
    desc: 'Site open తర్వాత modal — auto-close లేదా ✕ · responsive · schedule తో',
    desktop: '600×800',
    mobile: '360×480',
    page: 'Home / All pages',
    waterfall: 'Private only',
    preview: { top: '32%', left: '28%', width: '44%', height: '28%', label: 'Popup' },
  },
]

/** Mirror kaburlu-Webnews lib/ad-config.ts PopupSettings (admin save → domain ads.settings.popup) */
export const DEFAULT_WEBNEWS_POPUP_SETTINGS = {
  enabled: true,
  pages: ['home', 'category', 'article'],
  trigger: 'delay',
  delaySec: 4,
  scrollPct: 40,
  desktopStyle: 'modal',
  mobileStyle: 'bottom-sheet',
  frequencyHours: 12,
  maxPerDay: 3,
  skipSearchLanding: true,
  minPageViews: 0,
  autoCloseSec: 15,
}

export function normalizePopupSettings(raw = {}) {
  const base = { ...DEFAULT_WEBNEWS_POPUP_SETTINGS }
  if (!raw || typeof raw !== 'object') return base
  const pages = Array.isArray(raw.pages) ? raw.pages.filter(Boolean) : base.pages
  return {
    ...base,
    ...raw,
    pages: pages.length ? pages : base.pages,
    delaySec: Math.min(120, Math.max(0, Number(raw.delaySec ?? base.delaySec) || base.delaySec)),
    autoCloseSec: Math.min(120, Math.max(0, Number(raw.autoCloseSec ?? base.autoCloseSec) || 0)),
    frequencyHours: Math.min(168, Math.max(1, Number(raw.frequencyHours ?? base.frequencyHours) || 12)),
    maxPerDay: Math.min(10, Math.max(1, Number(raw.maxPerDay ?? base.maxPerDay) || 2)),
    scrollPct: Math.min(95, Math.max(10, Number(raw.scrollPct ?? base.scrollPct) || 40)),
    minPageViews: Math.min(5, Math.max(0, Number(raw.minPageViews ?? base.minPageViews) || 0)),
    enabled: raw.enabled !== false,
    skipSearchLanding: raw.skipSearchLanding !== false,
  }
}

export const DEFAULT_WEBNEWS_PLACEMENT_SETTINGS = {
  header: true,
  sidebar: true,
  sidebarSticky: true,
  inFeedEvery: 6,
  inArticleEvery: 2,
  inArticleMax: 3,
  belowArticle: true,
  stickyMobile: true,
  festivalSponsor: true,
  dailySponsors: true,
}

export const PLACEMENT_FLAG_KEY = {
  header: 'header',
  sidebar: 'sidebar',
  'sidebar-sticky': 'sidebarSticky',
  'below-article': 'belowArticle',
  'sticky-mobile': 'stickyMobile',
  'in-feed': 'inFeedEvery',
  'in-article': 'inArticleEvery',
  festival: 'festivalSponsor',
  popup: null,
}

export function getPlacementById(id) {
  return WEBNEWS_AD_PLACEMENTS.find((p) => p.id === id)
}

/** Schedule label for admin list */
export function formatAdSchedule(startsAt, endsAt) {
  const now = Date.now()
  const s = startsAt ? Date.parse(startsAt) : NaN
  const e = endsAt ? Date.parse(endsAt) : NaN
  if (Number.isFinite(s) && now < s) return { label: 'Scheduled', tone: 'amber' }
  if (Number.isFinite(e) && now > e) return { label: 'Expired', tone: 'slate' }
  if (Number.isFinite(s) || Number.isFinite(e)) return { label: 'Live', tone: 'green' }
  return { label: 'Always on', tone: 'green' }
}

export function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromDatetimeLocal(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

/** Parse "728×90" or "300x250" → { w, h } */
export function parsePlacementSize(desktopLabel) {
  if (!desktopLabel || desktopLabel === '—' || desktopLabel === 'Responsive') return null
  const m = String(desktopLabel).match(/(\d+)\s*[x×]\s*(\d+)/i)
  if (!m) return null
  return { w: Number(m[1]), h: Number(m[2]) }
}