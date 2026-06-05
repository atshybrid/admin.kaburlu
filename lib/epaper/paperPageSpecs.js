/**
 * Normalize GET /epaper/paper-page-specs for canvas + header slots.
 * API is source of truth when available; see docs/EPAPER_DESIGN_INTEGRATION.md
 */
import { IN_TO_CM, inToCm } from './epaperPageSpec'

let clientCache = null
let clientCacheAt = 0
const CACHE_MS = 120_000

export function normalizePaperTypeKey(paperType) {
  const s = String(paperType || '').toUpperCase().replace(/\s+/g, '_')
  if (s.includes('DIGITAL')) return 'DIGITAL_PAPER'
  if (s.includes('TAB')) return 'TABLOID'
  if (s.includes('BROAD')) return 'BROADSHEET'
  if (s.includes('BERLIN')) return 'BERLINER'
  if (s.includes('MAGAZ') || s.includes('A4')) return 'MAGAZINE'
  return s || 'BROADSHEET'
}

/** @param {object} item — one entry from paper-page-specs items[] */
export function apiPaperSpecToAutomationSpec(item) {
  if (!item) return null
  const marginIn = Number(item.marginLeftInches ?? item.marginIn ?? 0.5)
  const printW = Number(item.printWidthInches ?? item.contentWidthInches ?? 12)
  const printH = Number(item.printHeightInches ?? 17)
  return {
    paperType: item.paperType,
    label: item.label || item.paperType,
    widthIn: Number(item.pageWidthInches) || printW + marginIn * 2,
    heightIn: Number(item.pageHeightInches) || printH + 1,
    marginIn,
    footerOffsetIn: Number(item.footerHeightInches) || 0.5,
    mainHeaderIn: Number(item.mainHeaderHeightInches) || 3,
    subHeaderIn: Number(item.innerHeaderHeightInches) || 1,
    printWidthIn: printW,
    printHeightIn: printH,
    contentWidthIn: Number(item.contentWidthInches) || printW,
    columns: Number(item.gridColumns) || 12,
    gutterIn: 0.18,
    gridColumns: Number(item.gridColumns) || 12,
    footerStyle: item.footerStyle,
    showPrinterInfoOnLastPage: item.showPrinterInfoOnLastPage,
  }
}

/** Page meta for design canvas (cm fields). */
export function apiPaperSpecToPageMeta(item) {
  const spec = apiPaperSpecToAutomationSpec(item)
  if (!spec) return null
  const m = inToCm(spec.marginIn)
  const contentWIn = spec.contentWidthIn
  return {
    label: spec.label,
    paperType: spec.paperType,
    widthIn: spec.widthIn,
    heightIn: spec.heightIn,
    contentWidthIn: contentWIn,
    widthCm: inToCm(spec.widthIn),
    heightCm: inToCm(spec.heightIn),
    contentWidthCm: inToCm(contentWIn),
    bleedMm: 3,
    marginsCm: { top: m, bottom: m, left: m, right: m },
    marginIn: spec.marginIn,
    columns: spec.columns,
    gutterCm: inToCm(spec.gutterIn),
    gutterIn: spec.gutterIn,
    headerHeightCm: inToCm(spec.mainHeaderIn),
    subHeaderHeightCm: inToCm(spec.subHeaderIn),
    mainHeaderIn: spec.mainHeaderIn,
    subHeaderIn: spec.subHeaderIn,
    footerOffsetIn: spec.footerOffsetIn,
    footerOffsetCm: inToCm(spec.footerOffsetIn),
    footerHeightCm: inToCm(spec.footerOffsetIn),
    topInfoStripCm: 0,
    printWidthIn: spec.printWidthIn,
    printHeightIn: spec.printHeightIn,
  }
}

export function indexPaperSpecs(items = []) {
  const byType = {}
  for (const item of items) {
    const key = normalizePaperTypeKey(item.paperType)
    byType[key] = item
  }
  return byType
}

export function findPaperSpec(items, paperType) {
  const key = normalizePaperTypeKey(paperType)
  const list = Array.isArray(items) ? items : []
  return list.find((i) => normalizePaperTypeKey(i.paperType) === key) || null
}

export function formatPaperSpecSummary(item) {
  if (!item) return ''
  return `${item.label || item.paperType} · print ${item.printWidthInches}×${item.printHeightInches}″ · main ${item.mainHeaderHeightInches}″ · sub ${item.innerHeaderHeightInches}″`
}

/**
 * Browser: load via admin proxy (JWT).
 * @returns {Promise<{ ok: boolean, items: object[], byType: Record<string, object> }>}
 */
export async function loadPaperPageSpecsClient({ bustCache = false } = {}) {
  if (!bustCache && clientCache && Date.now() - clientCacheAt < CACHE_MS) {
    return clientCache
  }
  const { getToken } = await import('../../utils/auth')
  const token = getToken()?.token
  const headers = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch('/api/admin/epaper/paper-page-specs', { headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `paper-page-specs HTTP ${res.status}`)
  }
  const items = data.items || data.paperPageSpecs || []
  const payload = {
    ok: data.ok !== false,
    primaryTypes: data.primaryTypes || [],
    items,
    byType: indexPaperSpecs(items),
    total: data.total ?? items.length,
  }
  clientCache = payload
  clientCacheAt = Date.now()
  return payload
}
