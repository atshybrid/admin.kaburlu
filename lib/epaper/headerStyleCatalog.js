/**
 * Header style helpers — names/keys from media backend catalog only.
 * UI hints (settingsFields, colors) stay local in headerStyleUiHints.js.
 */
import { HEADER_STYLE_UI_HINTS } from './headerStyleUiHints'

export { HEADER_STYLE_UI_HINTS }

let catalogCache = null

export function setHeaderStyleCatalogCache(catalog) {
  catalogCache = catalog || null
}

export function getHeaderStyleCatalogCache() {
  return catalogCache
}

function mergeStyle(row, type, number) {
  const n = Number(number) || 1
  const key = row?.key || (type === 'SUB' ? `sub_header_style${n}` : `main_style${n}`)
  const hints = HEADER_STYLE_UI_HINTS[key] || {}
  return {
    number: row?.number ?? n,
    type: row?.type || type,
    key,
    slug: row?.slug || key,
    name: row?.name || key,
    nameTe: row?.nameTe,
    htmlRenderer: row?.htmlRenderer,
    supportsCenterLogo: row?.supportsCenterLogo,
    supportsLeftImage: row?.supportsLeftImage,
    supportsRightImage: row?.supportsRightImage,
    supportsPaperNameImage: row?.supportsPaperNameImage,
    supportsSubHeaderCenterImage: row?.supportsSubHeaderCenterImage,
    ...hints,
  }
}

export function getMainHeaderStyleMeta(number) {
  const n = Number(number) || 1
  const row = catalogCache?.mainHeaders?.find((s) => s.number === n)
  return mergeStyle(row, 'MAIN', n)
}

export function getSubHeaderStyleMeta(number) {
  const n = Number(number) || 1
  const row = catalogCache?.subHeaders?.find((s) => s.number === n)
  return mergeStyle(row, 'SUB', n)
}

export function mainStyleKey(number) {
  return getMainHeaderStyleMeta(number).key
}

export function subStyleKey(number) {
  return getSubHeaderStyleMeta(number).key
}

/** Fields to add in designConfig / editionConfigs / newspaper-config (backend). */
export const EPAPER_HEADER_DESIGN_CONFIG_SCHEMA = [
  { field: 'headerStyleNumber', type: 'number', scope: 'tenant|edition', description: 'Main page masthead style 1–10', apiPaths: ['config.headerStyleNumber', 'designConfig.headerStyleNumber'] },
  { field: 'subHeaderStyleNumber', type: 'number', scope: 'tenant|edition', description: 'Running sub-header style 1–10', apiPaths: ['config.subHeaderStyleNumber', 'designConfig.subHeaderStyleNumber'] },
  { field: 'headerStyleKey', type: 'string', scope: 'tenant|edition', description: 'Stable key e.g. main_style2', apiPaths: ['designConfig.headerStyleKey'] },
  { field: 'subHeaderStyleKey', type: 'string', scope: 'tenant|edition', description: 'Stable key e.g. sub_header_style1', apiPaths: ['designConfig.subHeaderStyleKey'] },
  { field: 'headerData', type: 'string', scope: 'tenant', description: 'Telugu paper name (main masthead text)', apiPaths: ['designConfig.headerData', 'mainPageHeader'] },
  { field: 'subHeaderData', type: 'string', scope: 'tenant', description: 'Legacy sub-header text / section label', apiPaths: ['designConfig.subHeaderData', 'secondPageHeader'] },
  { field: 'headerLogoUrl', type: 'url', scope: 'tenant|edition', description: 'Center logo (main & sub fallback)', apiPaths: ['designConfig.headerLogoUrl'] },
  { field: 'subHeaderLogoUrl', type: 'url', scope: 'tenant|edition', description: 'Sub-header center logo (style 1)', apiPaths: ['designConfig.subHeaderLogoUrl'] },
  { field: 'paperNameImageUrl', type: 'url', scope: 'tenant|edition', description: 'Main header center image', apiPaths: ['designConfig.paperNameImageUrl'] },
  { field: 'headerLeftImageUrl', type: 'url', scope: 'tenant|edition', description: 'Main header left ad / graphic', apiPaths: ['designConfig.headerLeftImageUrl'] },
  { field: 'headerRightImageUrl', type: 'url', scope: 'tenant|edition', description: 'Main header right article thumb', apiPaths: ['designConfig.headerRightImageUrl'] },
  { field: 'mainHeaderImageUrl', type: 'url', scope: 'tenant|edition', description: 'Full-bleed main header override', apiPaths: ['designConfig.mainHeaderImageUrl'] },
  { field: 'subHeaderImageUrl', type: 'url', scope: 'tenant|edition', description: 'Full-bleed sub-header override', apiPaths: ['designConfig.subHeaderImageUrl'] },
  { field: 'publishedAreaText', type: 'string', scope: 'tenant', description: 'Published from cities (• separated)', apiPaths: ['designConfig.publishedAreaText'] },
  { field: 'paperSellCost', type: 'number|string', scope: 'tenant|edition', description: 'Cover price', apiPaths: ['designConfig.paperSellCost'] },
  { field: 'issueNumber', type: 'number', scope: 'tenant|issue', description: 'సంచిక number', apiPaths: ['designConfig.issueNumber', 'designConfig.issueStartNumber'] },
  { field: 'startVolumeNumber', type: 'number', scope: 'tenant', description: 'సంపుటి number', apiPaths: ['designConfig.startVolumeNumber'] },
  { field: 'tagline', type: 'string', scope: 'tenant', description: 'Main style 2 tagline', apiPaths: ['designConfig.tagline'] },
  { field: 'websiteUrl', type: 'string', scope: 'tenant', description: 'Main style 2 website', apiPaths: ['designConfig.websiteUrl'] },
  { field: 'runningCommentText', type: 'string', scope: 'tenant', description: 'Main style 2 left column lines (\\n)', apiPaths: ['designConfig.runningCommentText'] },
  { field: 'runningCommentAuthor', type: 'string', scope: 'tenant', description: 'Main style 2 author line', apiPaths: ['designConfig.runningCommentAuthor'] },
  { field: 'rightArticleTitle', type: 'string', scope: 'tenant|issue', description: 'Main style 2 right box headline', apiPaths: ['designConfig.rightArticleTitle'] },
  { field: 'rightArticlePoints', type: 'string', scope: 'tenant|issue', description: 'Main style 2 bullet points (\\n)', apiPaths: ['designConfig.rightArticlePoints'] },
  { field: 'accentColor', type: 'hex', scope: 'tenant', description: 'Accent for colored styles', apiPaths: ['designConfig.accentColor'] },
]

/** @deprecated Use fetchPublicHeaderStylesCatalog — kept for callers expecting shape */
export async function listHeaderStylesForApi() {
  const { fetchPublicHeaderStylesCatalog } = await import('../server/fetchHeaderStylesCatalog')
  const catalog = await fetchPublicHeaderStylesCatalog()
  const withHints = (rows) =>
    (rows || []).map((row) => {
      const hints = HEADER_STYLE_UI_HINTS[row.key] || {}
      return { ...row, ...hints }
    })
  return {
    mainHeaderStyles: withHints(catalog.mainHeaders),
    subHeaderStyles: withHints(catalog.subHeaders),
    designConfigFields: EPAPER_HEADER_DESIGN_CONFIG_SCHEMA,
  }
}

export function listMissingHeaderSettings(config, { mainStyleNumber = 1, subStyleNumber = 1 } = {}) {
  const missing = []
  const mainMeta = getMainHeaderStyleMeta(mainStyleNumber)
  const subMeta = getSubHeaderStyleMeta(subStyleNumber)
  const flat = flattenConfig(config)

  for (const field of mainMeta.settingsFields || []) {
    if (!hasValue(flat[field])) missing.push({ layer: 'main', style: mainMeta.key, field })
  }
  for (const field of subMeta.settingsFields || []) {
    if (!hasValue(flat[field])) missing.push({ layer: 'sub', style: subMeta.key, field })
  }
  return missing
}

function flattenConfig(config) {
  if (!config || typeof config !== 'object') return {}
  const dc = config.designConfig || config
  const today = dc.today || {}
  return {
    paperName: dc.headerData || dc.paperName || config.mainPageHeader,
    paperNameEn: dc.paperNameEn || config.paperNameEn,
    paperNameImageUrl: dc.paperNameImageUrl || dc.headerLogoUrl,
    logoUrl: dc.headerLogoUrl || dc.logoUrl,
    headerLogoUrl: dc.headerLogoUrl || dc.logoUrl,
    subHeaderLogoUrl: dc.subHeaderLogoUrl || dc.headerLogoUrl || dc.logoUrl,
    adLeftUrl: dc.headerLeftImageUrl || dc.adLeftUrl,
    adRightUrl: dc.headerRightImageUrl || dc.adRightUrl,
    adUrl: dc.headerRightImageUrl || dc.adUrl,
    publishedAreas: dc.publishedAreaText || dc.publishedAreas,
    date: dc.issueDateText || today.issueDate || dc.date,
    volume: dc.volumeText || dc.startVolumeNumber || today.currentVolume,
    issue: dc.issueNumber ?? today.currentIssue,
    price: dc.paperSellCost,
    sectionName: dc.subHeaderData || dc.sectionName,
    pageNumber: dc.pageNumber,
    runningCommentText: dc.runningCommentText,
    runningCommentAuthor: dc.runningCommentAuthor,
    tagline: dc.tagline,
    websiteUrl: dc.websiteUrl,
    rightArticleTitle: dc.rightArticleTitle,
    rightArticlePoints: dc.rightArticlePoints,
    accentColor: dc.accentColor,
    mainHeaderImageUrl: dc.mainHeaderImageUrl,
    subHeaderImageUrl: dc.subHeaderImageUrl,
  }
}

function hasValue(v) {
  if (v === null || v === undefined) return false
  if (typeof v === 'string') return v.trim().length > 0
  if (typeof v === 'number') return Number.isFinite(v)
  return true
}
