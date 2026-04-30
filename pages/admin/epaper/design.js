import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { getToken, logout } from '../../../utils/auth'
import { useRouter } from 'next/router'
import ArticleBlock2in1col from '../../../components/epaper/ArticleBlock2in1col'
import ArticleBlock3in1col from '../../../components/epaper/ArticleBlock3in1col'
import ArticleBlock4in2col from '../../../components/epaper/ArticleBlock4in2col'
import ArticleBlock6in2col from '../../../components/epaper/ArticleBlock6in2col'
import ArticleBlock9in3col from '../../../components/epaper/ArticleBlock9in3col'
import ArticleBlock12in4col from '../../../components/epaper/ArticleBlock12in4col'

const PAGE_PRESETS = {
  TABLOID: {
    label: 'Tabloid',
    widthCm: 30,
    heightCm: 42,
    bleedMm: 3,
    marginsCm: { top: 1.2, bottom: 1.5, left: 1.2, right: 1.2 },
    columns: 5,
    gutterCm: 0.5,
    headerHeightCm: 4.5,
    topInfoStripCm: 1,
    mastheadFontPt: '130–160',
    footerHeightCm: 1.5,
  },
  BROADSHEET: {
    label: 'Broadsheet',
    widthCm: 35,
    heightCm: 57,
    bleedMm: 3,
    marginsCm: { top: 1.5, bottom: 2, left: 1.5, right: 1.5 },
    columns: 6,
    gutterCm: 0.5,
    headerHeightCm: 5.5,
    topInfoStripCm: 1.2,
    mastheadFontPt: '150–200',
    footerHeightCm: 1.5,
  },
}

const BLOCK_CODES = ['BLOCK-02A', 'BLOCK-03A', 'BLOCK-04A', 'BLOCK-06A', 'BLOCK-08A', 'BLOCK-09A', 'BLOCK-12A']
const BLOCK_CODE_SET = new Set(BLOCK_CODES)

// Maps block code → React component + native pixel width for scaled preview
const BLOCK_COMPONENT_MAP = {
  'BLOCK-02A': ArticleBlock2in1col,
  'BLOCK-03A': ArticleBlock3in1col,
  'BLOCK-04A': ArticleBlock4in2col,
  'BLOCK-06A': ArticleBlock6in2col,
  'BLOCK-08A': ArticleBlock6in2col,
  'BLOCK-09A': ArticleBlock9in3col,
  'BLOCK-12A': ArticleBlock12in4col,
}
// Native approximate rendered height in px — used to size the transform:scale container
const BLOCK_NATIVE_HEIGHT_PX = {
  'BLOCK-02A': 160,
  'BLOCK-03A': 220,
  'BLOCK-04A': 300,
  'BLOCK-06A': 340,
  'BLOCK-08A': 380,
  'BLOCK-09A': 400,
  'BLOCK-12A': 440,
}

// Native rendered width in px (at 96 DPI; 1mm = 3.7795px)
const BLOCK_NATIVE_WIDTH_PX = {
  'BLOCK-02A': 192,
  'BLOCK-03A': 288,
  'BLOCK-04A': 384,
  'BLOCK-06A': 576,
  'BLOCK-08A': 576,
  'BLOCK-09A': 864,
  'BLOCK-12A': 1153,
}

// Convert article API data to block component props
function articleToBlockProps(article) {
  const images = []
  const seenImageUrls = new Set()
  const pushImage = (src, alt, caption) => {
    if (!src || seenImageUrls.has(src) || images.length >= 4) return
    seenImageUrls.add(src)
    images.push({ src, alt: alt || '', caption: caption || '' })
  }
  if (article?.featuredImageUrl) pushImage(article.featuredImageUrl, article.title || '', '')
  if (Array.isArray(article?.media)) {
    article.media.forEach((m) => {
      const url = m?.url || m?.imageUrl || m?.src || ''
      pushImage(url, m?.alt || m?.title || article?.title || '', m?.caption || m?.description || '')
    })
  }

  const paragraphs = []
  const rawContent = article?.content || article?.body || ''
  const stripHtml = (str) => String(str || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
  if (typeof rawContent === 'string' && rawContent.trim()) {
    // HTML rich-text: extract each <p>...</p> block as a paragraph
    const pTags = rawContent.match(/<p[^>]*>[\s\S]*?<\/p>/gi)
    if (pTags && pTags.length > 0) {
      pTags.forEach((tag) => { const t = stripHtml(tag); if (t) paragraphs.push({ content: t }) })
    } else {
      // Plain text fallback: split on double newlines
      rawContent.split(/\n{2,}|\r\n{2,}/).filter(Boolean).forEach((p) => { const t = stripHtml(p); if (t) paragraphs.push({ content: t }) })
    }
  } else if (Array.isArray(article?.paragraphs)) {
    article.paragraphs.forEach((p) => paragraphs.push(typeof p === 'string' ? { content: p } : p))
  } else if (Array.isArray(article?.content)) {
    article.content.forEach((p) => paragraphs.push(typeof p === 'string' ? { content: p } : p))
  }
  if (!paragraphs.length) {
    const excerpt = article?.excerpt || article?.description || article?.lead || article?.summary || ''
    if (excerpt) paragraphs.push({ content: excerpt })
    else paragraphs.push({ content: article?.title || '' })
  }

  const highlights = Array.isArray(article?.highlights) ? article.highlights : []
  const category = String(
    article?.category?.name || article?.categoryName || article?.category || 'general'
  ).toLowerCase()
  const dateline = String(
    article?.districtName || article?.district?.name || article?.location?.districtName || ''
  )
  // subtitle intentionally omitted — do not show lead/subtitle in block
  return { title: article?.title || '', subtitle: '', category, dateline, highlights, images, paragraphs }
}

// Physical newspaper block metadata — size in inches, columns, UI colour
const BLOCK_META = {
  'BLOCK-02A': { label: '2in · 1col', inches: 2, cols: 1, widthPct: 16, color: '#64748b', bg: '#f1f5f9', desc: 'Brief/short item' },
  'BLOCK-03A': { label: '3in · 1col', inches: 3, cols: 1, widthPct: 24, color: '#0369a1', bg: '#e0f2fe', desc: 'Short news' },
  'BLOCK-04A': { label: '4in · 2col', inches: 4, cols: 2, widthPct: 33, color: '#0284c7', bg: '#bae6fd', desc: 'Medium news' },
  'BLOCK-06A': { label: '6in · 2col', inches: 6, cols: 2, widthPct: 50, color: '#7c3aed', bg: '#ede9fe', desc: 'Standard story' },
  'BLOCK-08A': { label: '8in · 2col', inches: 8, cols: 2, widthPct: 66, color: '#9333ea', bg: '#f3e8ff', desc: 'Long story' },
  'BLOCK-09A': { label: '9in · 3col', inches: 9, cols: 3, widthPct: 75, color: '#c2410c', bg: '#ffedd5', desc: 'Feature story' },
  'BLOCK-12A': { label: '12in · 4col', inches: 12, cols: 4, widthPct: 100, color: '#b91c1c', bg: '#fee2e2', desc: 'Lead / Banner' },
}
const TENANT_STORAGE_KEY = 'epaper_design_selected_tenant_id'
const INNER_FOOTER_SWATCH_GROUPS = [
  ['#0ea5e9', '#38bdf8', '#ec4899', '#fde047', '#1f1f1f'],
  ['#0ea5e9', '#ec4899', '#f9a8d4', '#fde047', '#1f1f1f'],
  ['#0ea5e9', '#f507a4', '#facc15', '#fde047', '#1f1f1f'],
  ['#0ea5e9', '#f507a4', '#facc15', '#1f1f1f', '#a1a1aa'],
]

function todayYmd() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function parseIssueDate(value) {
  if (!value) return new Date()
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return new Date()
  return parsed
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date - start
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

function formatIssueDateText(date) {
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatIssueDayText(date) {
  return date.toLocaleDateString('en-IN', { weekday: 'long' })
}

function deriveIssueNumber(config, issueDate) {
  const fixedIssueNumber = String(config?.issueNumber || '').trim()
  if (fixedIssueNumber) return fixedIssueNumber

  const mode = String(config?.issueCounterMode || 'DAY_OF_YEAR').toUpperCase()
  const issueStartNumber = Number(config?.issueStartNumber || 1) || 1

  if (mode === 'DAY_OF_YEAR') {
    return String(issueStartNumber + getDayOfYear(issueDate) - 1)
  }

  return String(issueStartNumber)
}

function deriveVolumeNumber(config, issueDate) {
  const startVolumeNumber = Number(config?.startVolumeNumber || 1) || 1
  const volumeStartYear = Number(config?.volumeStartYear || issueDate.getFullYear()) || issueDate.getFullYear()
  const yearDiff = Math.max(0, issueDate.getFullYear() - volumeStartYear)
  return String(startVolumeNumber + yearDiff)
}

function getByPath(obj, path) {
  if (!obj || !path) return undefined
  return String(path)
    .split('.')
    .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj)
}

function readAny(obj, paths, fallback = '') {
  for (const path of paths) {
    const value = getByPath(obj, path)
    if (value !== undefined && value !== null && value !== '') return value
  }
  return fallback
}

function getTenantDisplayName(tenant) {
  return String(tenant?.name || tenant?.tenantName || tenant?.slug || 'Unnamed Tenant')
}

function getTenantBrandLogo(tenant) {
  return String(
    tenant?.brandLogoUrl
    || tenant?.brandLogo
    || tenant?.logoUrl
    || tenant?.logo
    || tenant?.branding?.logoUrl
    || ''
  )
}

function isTeluguTenant(tenant) {
  if (!tenant) return false

  const values = [
    tenant?.defaultLanguage,
    tenant?.languageCode,
    tenant?.primaryLanguage,
    tenant?.locale,
    tenant?.language,
    tenant?.language?.code,
    tenant?.language?.name,
  ]

  if (Array.isArray(tenant?.languages)) {
    tenant.languages.forEach((item) => {
      if (typeof item === 'string') {
        values.push(item)
      } else if (item && typeof item === 'object') {
        values.push(item.code, item.name, item.languageCode)
      }
    })
  }

  const normalized = values
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase())

  const byCode = normalized.some((value) => value === 'te' || value.startsWith('te-'))
  const byName = normalized.some((value) => value === 'telugu' || value.includes('telugu'))
  const byScript = /[\u0C00-\u0C7F]/.test(getTenantDisplayName(tenant))

  return byCode || byName || byScript
}

function hasExplicitNonTeluguLanguage(tenant) {
  if (!tenant) return false

  const values = [
    tenant?.defaultLanguage,
    tenant?.languageCode,
    tenant?.primaryLanguage,
    tenant?.locale,
    tenant?.language,
    tenant?.language?.code,
    tenant?.language?.name,
  ]

  if (Array.isArray(tenant?.languages)) {
    tenant.languages.forEach((item) => {
      if (typeof item === 'string') {
        values.push(item)
      } else if (item && typeof item === 'object') {
        values.push(item.code, item.name, item.languageCode)
      }
    })
  }

  const normalized = values
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase())

  return normalized.some((value) => (
    value === 'en'
    || value.startsWith('en-')
    || value.includes('english')
    || value === 'hi'
    || value.startsWith('hi-')
    || value.includes('hindi')
    || value === 'ta'
    || value.startsWith('ta-')
    || value.includes('tamil')
  ))
}

/**
 * Rule-based block suggester.
 * Priority order:
 *   1. Breaking / featured / high-priority → always prominent
 *   2. Image count drives column count (images require column real-estate)
 *   3. Word count + headline width fine-tune the block size
 */
function suggestBlock(article) {
  const words    = Number(article?.wordCount || 0)
  const imgCount = Array.isArray(article?.media)
    ? article.media.length
    : (article?.featuredImageUrl ? 1 : 0)

  // ── Priority signals ───────────────────────────────────────────────────
  const isBreaking = !!(article?.isBreaking || article?.breaking)
  const isFeatured = !!(article?.isFeatured || article?.featured)
  const isHighPrio = ['HIGH', 'URGENT', 'TOP'].includes(
    String(article?.priority || article?.importance || '').toUpperCase()
  )
  const prominent  = isBreaking || isFeatured || isHighPrio

  // ── Headline width hint ────────────────────────────────────────────────
  // Long headline needs a wider block to render well
  const wideTitle = String(article?.title || '').trim().length > 55

  // ── Rule tree ─────────────────────────────────────────────────────────
  if (prominent) {
    if (imgCount >= 2)              return 'BLOCK-12A'
    if (imgCount === 1)
      return words > 80             ? 'BLOCK-09A' : 'BLOCK-08A'
    return   words > 100            ? 'BLOCK-09A' : 'BLOCK-08A'
  }

  if (imgCount >= 3)                return 'BLOCK-12A'

  if (imgCount === 2)
    return (words > 130 || wideTitle) ? 'BLOCK-09A' : 'BLOCK-06A'

  if (imgCount === 1) {
    if (words <  50)                return 'BLOCK-03A'
    if (words <  90)                return 'BLOCK-04A'
    if (words < 160)                return 'BLOCK-06A'
    if (words < 260)                return 'BLOCK-08A'
    return                                 'BLOCK-09A'
  }

  // No image — text-only
  if (words <  40)                  return 'BLOCK-02A'
  if (words <  70)                  return 'BLOCK-03A'
  if (words < 110)                  return 'BLOCK-04A'
  if (words < 180)  return wideTitle ? 'BLOCK-08A' : 'BLOCK-06A'
  if (words < 290)                  return 'BLOCK-08A'
  return                                   'BLOCK-09A'
}

function estimateSlots(blockCode) {
  const code = String(blockCode || '')
  if (code === 'BLOCK-12A') return 6
  if (code === 'BLOCK-09A') return 5
  if (code === 'BLOCK-08A') return 4
  if (code === 'BLOCK-06A') return 3
  if (code === 'BLOCK-04A') return 2
  if (code === 'BLOCK-03A' || code === 'BLOCK-02A') return 1
  return 2
}

// How many newspaper grid columns each block spans (for CSS grid layout)
function getBlockColSpan(blockCode, totalCols) {
  const map5 = { 'BLOCK-02A': 1, 'BLOCK-03A': 1, 'BLOCK-04A': 2, 'BLOCK-06A': 2, 'BLOCK-08A': 3, 'BLOCK-09A': 3, 'BLOCK-12A': 5 }
  const map6 = { 'BLOCK-02A': 1, 'BLOCK-03A': 1, 'BLOCK-04A': 2, 'BLOCK-06A': 3, 'BLOCK-08A': 3, 'BLOCK-09A': 4, 'BLOCK-12A': 6 }
  const map = totalCols >= 6 ? map6 : map5
  return Math.min(map[blockCode] || 2, totalCols)
}

function getPageCapacity(preset) {
  return preset === 'TABLOID' ? 24 : 30
}

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100
}

function getGridMetrics(pageMeta) {
  const usableWidthCm = pageMeta.widthCm - pageMeta.marginsCm.left - pageMeta.marginsCm.right
  const totalGutterCm = (pageMeta.columns - 1) * pageMeta.gutterCm
  const colWidthCm = (usableWidthCm - totalGutterCm) / pageMeta.columns
  return {
    usableWidthCm: round2(usableWidthCm),
    colWidthCm: round2(colWidthCm),
  }
}

function parseDimensionCm(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const text = String(value).trim().toLowerCase()
  const parsed = parseFloat(text)
  if (!Number.isFinite(parsed)) return fallback
  if (text.endsWith('mm')) return parsed / 10
  if (text.endsWith('in') || text.endsWith('inch') || text.endsWith('inches')) return parsed * 2.54
  return parsed
}

function resolvePageSpecFromConfig(config, currentPreset) {
  const presetRaw = String(readAny(config, [
    'designConfig.pageSize',
    'designConfig.pageType',
    'pageSize',
    'pageType',
    'size',
    'settings.pageSize',
    'settings.pageType',
    'print.pageSize',
    'layout.pageSize',
  ], '')).toUpperCase()

  const normalizePreset = (value) => {
    if (!value) return null
    if (value.includes('TABLOID')) return 'TABLOID'
    if (value.includes('BROADSHEET')) return 'BROADSHEET'
    return null
  }

  const presetFromApi = normalizePreset(presetRaw)
  const basePreset = PAGE_PRESETS[presetFromApi || currentPreset] || PAGE_PRESETS.TABLOID

  const widthCm = parseDimensionCm(readAny(config, [
    'designConfig.pageWidthCm',
    'pageWidthCm',
    'widthCm',
    'settings.pageWidthCm',
    'print.widthCm',
    'layout.widthCm',
    'page.width',
  ], null), null)

  const heightCm = parseDimensionCm(readAny(config, [
    'designConfig.pageHeightCm',
    'pageHeightCm',
    'heightCm',
    'settings.pageHeightCm',
    'print.heightCm',
    'layout.heightCm',
    'page.height',
  ], null), null)

  const columns = Number(readAny(config, ['designConfig.columns', 'columns', 'settings.columns', 'layout.columns'], basePreset.columns)) || basePreset.columns
  const gutterCm = parseDimensionCm(readAny(config, ['designConfig.gutterCm', 'gutterCm', 'settings.gutterCm', 'layout.gutterCm'], basePreset.gutterCm), basePreset.gutterCm)

  const hasCustomDimensions = Number.isFinite(widthCm) && Number.isFinite(heightCm)
  const matchedPreset = Object.entries(PAGE_PRESETS).find(([, presetItem]) => {
    if (!hasCustomDimensions) return false
    return Math.abs(presetItem.widthCm - widthCm) < 0.1 && Math.abs(presetItem.heightCm - heightCm) < 0.1
  })

  if (matchedPreset) {
    return {
      preset: matchedPreset[0],
      customPageMeta: null,
      source: 'API_PRESET_MATCH',
    }
  }

  if (presetFromApi && !hasCustomDimensions) {
    return {
      preset: presetFromApi,
      customPageMeta: null,
      source: 'API_PRESET',
    }
  }

  if (hasCustomDimensions) {
    return {
      preset: presetFromApi || currentPreset,
      customPageMeta: {
        ...basePreset,
        label: `Custom ${round2(widthCm)} × ${round2(heightCm)} cm`,
        widthCm: round2(widthCm),
        heightCm: round2(heightCm),
        columns,
        gutterCm: round2(gutterCm),
      },
      source: 'API_CUSTOM',
    }
  }

  return {
    preset: currentPreset,
    customPageMeta: null,
    source: 'FALLBACK_LOCAL',
  }
}

function extractDistrict(article) {
  return String(
    article?.districtName
    || article?.district?.name
    || article?.location?.districtName
    || article?.location?.district?.name
    || article?.edition?.districtName
    || 'General'
  )
}

function normalizeBlockCode(code) {
  if (!code) return null
  const raw = String(code).trim().toUpperCase()
  if (BLOCK_CODE_SET.has(raw)) return raw

  const compact = raw.replace(/[_\s]+/g, '-')
  if (BLOCK_CODE_SET.has(compact)) return compact

  const match = compact.match(/^BLOCK-?(\d{2})A$/)
  if (!match) return null

  const normalized = `BLOCK-${match[1]}A`
  return BLOCK_CODE_SET.has(normalized) ? normalized : null
}

function resolveArticleBlockCode(article) {
  const candidates = [
    article?.assignedBlockTemplate?.code,
    article?.suggestedBlockTemplate?.code,
    article?.layoutSuggestion?.blockCode,
    article?.layoutSuggestion?.code,
    article?.blockCode,
    article?.templateCode,
  ]

  for (const candidate of candidates) {
    const normalized = normalizeBlockCode(candidate)
    if (normalized) return normalized
  }

  return suggestBlock(article)
}

function resolveArticleTemplateId(article) {
  return (
    article?.assignedBlockTemplateId
    || article?.suggestedBlockTemplateId
    || article?.assignedBlockTemplate?.id
    || article?.suggestedBlockTemplate?.id
    || null
  )
}

function resolveTemplateBlockForArticle(article, currentTemplateMap) {
  return resolveArticleTemplateId(article) || currentTemplateMap[resolveArticleBlockCode(article)] || null
}

function buildPlacement(article) {
  const articleId = getArticleId(article)
  return {
    id: articleId,
    articleId,
    title: article.title,
    wordCount: Number(article?.wordCount || 0),
    imageCount: Array.isArray(article?.media) ? article.media.length : 0,
    district: extractDistrict(article),
    blockCode: resolveArticleBlockCode(article),
    templateBlockId: resolveArticleTemplateId(article),
    x: 0,
    y: 0,
    fontSize: 11,
    color: '#111827',
  }
}

function extractHeaderConfig(config) {
  const currentYear = new Date().getFullYear()
  const pageCount = Number(readAny(config, [
    'designConfig.defaultPageCount',
    'designConfig.numberOfPages',
    'numberOfPages',
    'pagesCount',
    'pageCount',
    'settings.numberOfPages',
    'meta.numberOfPages',
    'header.numberOfPages',
  ], 1)) || 1

  return {
    numberOfPages: Math.max(1, pageCount),
    mainPageHeader: String(readAny(config, ['designConfig.headerData', 'mainPageHeader', 'mainHeader', 'settings.mainPageHeader', 'header.mainPageHeader'], 'Main Page Header')),
    secondPageHeader: String(readAny(config, ['designConfig.subHeaderData', 'secondPageSubHeading', 'subHeadingPage2', 'settings.secondPageSubHeading', 'header.secondPageSubHeading'], 'Second Page Header')),
    remainingPageFooterStyle: String(readAny(config, ['remainingPageFooterStyle', 'footerStyle', 'settings.remainingPageFooterStyle'], 'Standard footer style')),
    lastPageFooterText: String(readAny(config, ['designConfig.footerText', 'lastPageFooterText', 'footerText', 'settings.lastPageFooterText', 'footer.lastPageFooterText'], 'Last page footer text')),
    logoUrl: String(readAny(config, ['designConfig.headerLogoUrl', 'logoUrl', 'header.logoUrl', 'branding.logoUrl'], '')),
    subHeaderImageUrl: String(readAny(config, ['designConfig.subHeaderImageUrl', 'subHeaderImageUrl', 'header.subHeaderImageUrl'], '')),
    headerLeftImageUrl: String(readAny(config, ['designConfig.headerLeftImageUrl', 'headerLeftImageUrl', 'header.leftImageUrl'], '')),
    headerRightImageUrl: String(readAny(config, ['designConfig.headerRightImageUrl', 'headerRightImageUrl', 'header.rightImageUrl'], '')),
    publishedAreaText: String(readAny(config, ['designConfig.publishedAreaText', 'publishedAreaText', 'designConfig.subHeaderData'], '')),
    headerAdUrl: String(readAny(config, ['designConfig.headerRightImageUrl', 'headerAdUrl', 'header.adUrl', 'ads.headerAdUrl'], '')),
    valueNumber: String(readAny(config, ['valueNumber', 'header.valueNumber', 'meta.valueNumber'], '')),
    issueNumber: String(readAny(config, ['designConfig.issueNumber', 'issueNumber', 'header.issueNumber', 'meta.issueNumber'], '')),
    paperSellCost: String(readAny(config, ['designConfig.paperSellCost', 'paperSellCost', 'pagePrice', 'header.pagePrice', 'meta.pagePrice'], '')),
    prgiNumber: String(readAny(config, ['prgiNumber', 'header.prgiNumber', 'meta.prgiNumber'], '')),
    headerTemplateStyleId: String(readAny(config, ['designConfig.headerTemplateStyleId', 'headerTemplateStyleId'], '')),
    subHeaderTemplateStyleId: String(readAny(config, ['designConfig.subHeaderTemplateStyleId', 'subHeaderTemplateStyleId'], '')),
    mainHeaderTemplateId: String(readAny(config, ['designConfig.mainHeaderTemplateId', 'mainHeaderTemplateId'], '')),
    innerHeaderTemplateId: String(readAny(config, ['designConfig.innerHeaderTemplateId', 'innerHeaderTemplateId'], '')),
    footerTemplateId: String(readAny(config, ['designConfig.footerTemplateId', 'footerTemplateId'], '')),
    issueCounterMode: String(readAny(config, ['designConfig.issueCounterMode', 'issueCounterMode'], 'DAY_OF_YEAR')),
    issueStartNumber: Number(readAny(config, ['designConfig.issueStartNumber', 'issueStartNumber'], 1)) || 1,
    volumeStartYear: Number(readAny(config, ['designConfig.volumeStartYear', 'volumeStartYear'], currentYear)) || currentYear,
    startVolumeNumber: Number(readAny(config, ['designConfig.startVolumeNumber', 'startVolumeNumber'], 1)) || 1,
  }
}

function buildPages(count) {
  return Array.from({ length: Math.max(1, Number(count) || 1) }, (_, idx) => ({ id: idx + 1, placements: [] }))
}

function getArticleId(article) {
  return article?.id || article?._id || null
}

function extractArticlesFromSmartSections(payload) {
  const containers = [
    payload,
    payload?.data,
    payload?.result,
    payload?.results,
  ].filter(Boolean)

  const items = []
  containers.forEach((container) => {
    if (Array.isArray(container?.sections)) {
      container.sections.forEach((section) => {
        if (Array.isArray(section?.articles)) items.push(...section.articles)
      })
    }
    if (Array.isArray(container?.blocks)) items.push(...container.blocks)
    if (Array.isArray(container?.articles)) items.push(...container.articles)
    if (Array.isArray(container?.items)) items.push(...container.items)
  })

  return items
    .map((article) => {
      const id = getArticleId(article)
      if (!id) return null
      return { ...article, id }
    })
    .filter(Boolean)
}

// ─────────────────────────────────────────────────────────────────────────────
// Completely static newspaper block preview — NO hooks, NO
// ResizeObserver, NO setState. Renders once and never re-renders.
// Used on the canvas grid so articles never flicker.
// ─────────────────────────────────────────────────────────────────────────────

// Strip HTML tags + common HTML entities from rich-text content
function stripHtmlForPreview(str) {
  if (typeof str !== 'string') return ''
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function CanvasBlockPreview({ placement, article, cellW, cellH }) {
  const blockCode = placement.blockCode
  const meta = BLOCK_META[blockCode] || BLOCK_META['BLOCK-04A']
  const cols = meta.cols
  const title = placement.title || article?.title || ''
  const district = placement.district || ''

  // ── Images — deduplicated ────────────────────────────────────────────────
  const imgs = []
  const seenUrls = new Set()
  const pushImg = (u) => { if (u && !seenUrls.has(u) && imgs.length < 4) { seenUrls.add(u); imgs.push(u) } }
  if (article?.featuredImageUrl) pushImg(article.featuredImageUrl)
  if (Array.isArray(article?.media)) article.media.forEach(m => pushImg(m?.url || m?.imageUrl || m?.src || ''))

  // ── Body text ────────────────────────────────────────────────────────────
  // article.content is often rich-text HTML — strip tags before displaying
  const bodyText = (() => {
    const raw = article?.content || article?.body || ''
    if (typeof raw === 'string' && raw.trim()) return stripHtmlForPreview(raw)
    if (Array.isArray(article?.paragraphs))
      return stripHtmlForPreview(
        article.paragraphs.map(p => (typeof p === 'string' ? p : p?.content || '')).join(' ')
      )
    return stripHtmlForPreview(article?.excerpt || article?.description || '')
  })()

  const subtitle = stripHtmlForPreview(
    article?.subtitle || article?.subTitle || article?.subHeading || ''
  )

  // ── Sizes: cellW-proportional → readable at every canvas zoom level ──────
  const pad       = Math.max(3, Math.round(cellW * 0.015))
  const titleSize = Math.max(9, Math.min(20, Math.round(cellW * 0.044)))
  const subSize   = Math.max(7, Math.min(12, Math.round(cellW * 0.028)))
  const bodySize  = Math.max(7, Math.min(11, Math.round(cellW * 0.026)))
  const lineH     = bodySize * 1.5
  // Image height: cap at 40% of block height (if known) so text still has room
  const imgH      = cellH
    ? Math.min(Math.round(cellH * 0.40), Math.round(cellW * 0.22))
    : Math.max(40, Math.round(cellW * 0.22))
  const colPadH   = Math.max(2,  Math.round(cellW * 0.008))
  const dividerW  = Math.max(1,  Math.round(cellW * 0.002))

  // ── Split body text evenly across columns ────────────────────────────────
  const words = bodyText.split(/\s+/).filter(Boolean)
  const wordsPerCol = Math.ceil(words.length / Math.max(1, cols))
  const colTexts = Array.from({ length: cols }, (_, ci) =>
    words.slice(ci * wordsPerCol, (ci + 1) * wordsPerCol).join(' ')
  )

  return (
    <div style={{
      width: '100%',
      height: '100%',
      fontFamily: 'Mandali, sans-serif',
      backgroundColor: '#fff',
      overflow: 'hidden',
      padding: pad,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── Title ── */}
      <div style={{
        fontWeight: 700,
        fontSize: titleSize,
        lineHeight: 1.28,
        textAlign: 'center',
        borderBottom: `${titleSize > 14 ? 2 : 1}px solid #111`,
        paddingBottom: Math.round(pad * 0.4),
        marginBottom: Math.round(pad * 0.4),
        wordBreak: 'break-word',
        letterSpacing: '0.01em',
        flexShrink: 0,
      }}>
        {title}
      </div>

      {/* ── Subtitle / kicker ── */}
      {subtitle ? (
        <div style={{
          fontSize: subSize,
          color: '#444',
          textAlign: 'center',
          fontStyle: 'italic',
          marginBottom: Math.round(pad * 0.4),
          wordBreak: 'break-word',
          lineHeight: 1.3,
          flexShrink: 0,
        }}>
          {subtitle}
        </div>
      ) : null}

      {/* ── Content columns — flex:1 fills remaining height ── */}
      <div style={{ display: 'flex', gap: 0, alignItems: 'stretch', flex: 1, overflow: 'hidden' }}>
        {Array.from({ length: cols }).map((_, ci) => {
          // Multi-col: image in column 1 (ci=1) → imgs[0],
          //            column 2 (ci=2) → imgs[1], etc.
          // Single-col: image in column 0 → imgs[0]
          const imgSrc = cols === 1 ? imgs[0] : (ci > 0 ? imgs[ci - 1] : null)
          const isLast = ci === cols - 1
          return (
            <React.Fragment key={ci}>
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', padding: `0 ${colPadH}px` }}>
                {imgSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgSrc}
                    alt=""
                    style={{
                      width: '100%',
                      height: imgH,
                      objectFit: 'cover',
                      display: 'block',
                      marginBottom: Math.round(colPadH * 0.6),
                    }}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : null}
                <div style={{
                  fontSize: bodySize,
                  lineHeight: `${lineH}px`,
                  color: '#111',
                  textAlign: 'justify',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                }}>
                  {ci === 0 && district ? (
                    <span style={{ fontWeight: 800, marginRight: 3 }}>{district}: </span>
                  ) : null}
                  {colTexts[ci]}
                </div>
              </div>
              {/* hairline column divider */}
              {!isLast ? (
                <div style={{ width: dividerW, background: '#bbb', alignSelf: 'stretch', flexShrink: 0 }} />
              ) : null}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

// ── Newspaper layout constants ───────────────────────────────────────────────
const MAX_EPAPER_PAGES = 8    // Hard cap: never exceed 8 pages
const MAX_ROWS_PER_PAGE = 5   // Rows per inner page (adjust for page height)

/**
 * Pack articles into 12-inch-wide rows using a look-ahead greedy strategy.
 *
 * Algorithm:
 *  • Pre-compute (blockCode, inches) for every article.
 *  • Iterate: take the first unused article as the "anchor" of a new row.
 *  • Scan forward through the remaining articles and pull in any article
 *    whose inch-width fits within the row's remaining space, until the
 *    row reaches 12 or no more articles fit.
 *
 * This guarantees rows like 9+3, 8+4, 6+6, 4+4+4, 12 etc.
 * without changing the relative order of the anchor articles.
 */
function buildInchRows(articleList) {
  // Pre-compute block + size for every article once
  const items = articleList.map(article => {
    const blockCode = resolveArticleBlockCode(article)
    const inches    = BLOCK_META[blockCode]?.inches || 4
    return { placement: buildPlacement(article), inches, used: false }
  })

  const rows = []
  for (let i = 0; i < items.length; i++) {
    if (items[i].used) continue
    items[i].used = true

    const row     = [items[i].placement]
    let remaining = 12 - items[i].inches

    // Look ahead: pull companion articles that fit the remaining space
    for (let j = i + 1; j < items.length && remaining > 0; j++) {
      if (!items[j].used && items[j].inches <= remaining) {
        row.push(items[j].placement)
        remaining -= items[j].inches
        items[j].used = true
      }
    }

    rows.push(row)
  }
  return rows
}

function paginateFromSecondPage(articles, initialPageCount) {
  // Deduplicate articles by ID so the same article never appears twice
  const seen = new Set()
  const uniqueArticles = articles.filter(a => {
    const id = getArticleId(a) || a.id
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })

  // Build 12-inch rows
  const rows = buildInchRows(uniqueArticles)

  // Build the initial pages array (minimum 2, max 8)
  const initialCount = Math.min(MAX_EPAPER_PAGES, Math.max(2, Number(initialPageCount) || 2))
  const result = buildPages(initialCount)

  // Distribute rows into inner pages (page index 1 = page 2, skipping front page)
  let pageIndex = 1
  let rowsOnPage = 0

  for (const row of rows) {
    if (pageIndex >= MAX_EPAPER_PAGES) break
    if (rowsOnPage >= MAX_ROWS_PER_PAGE) {
      pageIndex += 1
      rowsOnPage = 0
      if (pageIndex >= result.length) {
        if (result.length < MAX_EPAPER_PAGES) {
          result.push({ id: result.length + 1, placements: [] })
        } else {
          break
        }
      }
    }
    row.forEach(p => result[pageIndex].placements.push(p))
    rowsOnPage += 1
  }

  return result.slice(0, MAX_EPAPER_PAGES)
}

export default function EPaperDesignPage() {
  const router = useRouter()

  const [mobilePanel, setMobilePanel] = useState('canvas')
  const [rightTab, setRightTab] = useState('articles')
  const [showSetup, setShowSetup] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(1280)
  const [articleSearch, setArticleSearch] = useState('')
  const [showPayloadPreview, setShowPayloadPreview] = useState(false)

  const [tenantList, setTenantList] = useState([])
  const [tenantsLoading, setTenantsLoading] = useState(false)
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [showTenantPicker, setShowTenantPicker] = useState(true)

  // Edition selector
  const [editionList, setEditionList] = useState([])
  const [selectedEditionId, setSelectedEditionId] = useState('')
  const [editionsLoading, setEditionsLoading] = useState(false)

  const [fromDate, setFromDate] = useState(todayYmd())
  const [status, setStatus] = useState('PUBLISHED')
  const [preset, setPreset] = useState('TABLOID')
  const [customPageMeta, setCustomPageMeta] = useState(null)
  const [pageSpecSource, setPageSpecSource] = useState('FALLBACK_LOCAL')
  const [extraSafeZoneCm, setExtraSafeZoneCm] = useState(0)

  const [headerConfig, setHeaderConfig] = useState(extractHeaderConfig(null))
  const [templateMap, setTemplateMap] = useState({
    'BLOCK-02A': '',
    'BLOCK-03A': '',
    'BLOCK-04A': '',
    'BLOCK-06A': '',
    'BLOCK-08A': '',
    'BLOCK-09A': '',
    'BLOCK-12A': '',
  })

  const [articles, setArticles] = useState([])
  const [pages, setPages] = useState(buildPages(1))
  const [activePageId, setActivePageId] = useState(1)
  const [selectedArticleId, setSelectedArticleId] = useState(null)
  const [selectedPlacementId, setSelectedPlacementId] = useState(null)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [layoutSaved, setLayoutSaved] = useState(false)
  const [layoutId, setLayoutId] = useState(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [payloadPreview, setPayloadPreview] = useState('')

  const pageMeta = customPageMeta || PAGE_PRESETS[preset]
  const gridMeta = getGridMetrics(pageMeta)
  const maxSlotsPerPage = getPageCapacity(pageMeta.columns >= 6 ? 'BROADSHEET' : 'TABLOID')
  const isMobile = viewportWidth < 768
  const mobileTargetWidth = Math.max(280, viewportWidth - 40)
  const mobileScale = Math.max(10, Math.min(18, mobileTargetWidth / pageMeta.widthCm))
  const scale = isMobile ? mobileScale : viewportWidth < 1024 ? 11 : 24
  const canvasWidth = Math.round(pageMeta.widthCm * scale)
  const canvasHeight = Math.round(pageMeta.heightCm * scale)
  const safeLeftPx = Math.round((pageMeta.marginsCm.left + Number(extraSafeZoneCm || 0)) * scale)
  const safeRightPx = Math.round((pageMeta.marginsCm.right + Number(extraSafeZoneCm || 0)) * scale)
  const safeTopPx = Math.round((pageMeta.marginsCm.top + Number(extraSafeZoneCm || 0)) * scale)
  const safeBottomPx = Math.round((pageMeta.marginsCm.bottom + Number(extraSafeZoneCm || 0)) * scale)
  const infoStripHeightPx = Math.round(1.27 * scale)
  const subHeaderHeightPx = Math.round(2.54 * scale)

  const activePage = useMemo(
    () => pages.find(item => item.id === activePageId) || pages[0],
    [pages, activePageId]
  )

  const activePageIndex = useMemo(
    () => pages.findIndex(item => item.id === activePageId),
    [pages, activePageId]
  )

  const issueDateObj = useMemo(() => parseIssueDate(fromDate), [fromDate])
  const resolvedIssueNumber = useMemo(() => deriveIssueNumber(headerConfig, issueDateObj), [headerConfig, issueDateObj])
  const resolvedVolumeNumber = useMemo(() => deriveVolumeNumber(headerConfig, issueDateObj), [headerConfig, issueDateObj])
  const selectedTenant = useMemo(
    () => tenantList.find(item => item.id === selectedTenantId) || null,
    [tenantList, selectedTenantId]
  )
  const useTeluguLabels = useMemo(() => {
    const fromTenant = isTeluguTenant(selectedTenant)
    if (fromTenant) return true

    const textSignal = `${headerConfig.mainPageHeader || ''} ${headerConfig.secondPageHeader || ''} ${selectedTenant?.name || ''}`
    if (/[\u0C00-\u0C7F]/.test(textSignal)) return true

    // Fallback: when tenant language is not explicitly non-Telugu, use Telugu labels.
    return !hasExplicitNonTeluguLanguage(selectedTenant)
  }, [selectedTenant, headerConfig.mainPageHeader, headerConfig.secondPageHeader])
  const issueDateText = useMemo(() => {
    return useTeluguLabels
      ? issueDateObj.toLocaleDateString('te-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : formatIssueDateText(issueDateObj)
  }, [issueDateObj, useTeluguLabels])
  const issueDayText = useMemo(() => {
    return useTeluguLabels
      ? issueDateObj.toLocaleDateString('te-IN', { weekday: 'long' })
      : formatIssueDayText(issueDateObj)
  }, [issueDateObj, useTeluguLabels])
  const teluguIssueDateText = useMemo(
    () => issueDateObj.toLocaleDateString('te-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
    [issueDateObj]
  )
  const teluguIssueDayText = useMemo(
    () => issueDateObj.toLocaleDateString('te-IN', { weekday: 'long' }),
    [issueDateObj]
  )
  const metaLabels = useMemo(() => {
    if (useTeluguLabels) {
      return {
        issue: 'సంచిక',
        volume: 'సంపుటిక',
        sellCost: 'వేల',
        pages: 'పేజీలు',
      }
    }

    return {
      issue: 'Issue',
      volume: 'Volume',
      sellCost: 'Sell Cost',
      pages: 'Pages',
    }
  }, [useTeluguLabels])
  const issueMetaValue = useMemo(() => {
    if (useTeluguLabels) {
      return String(headerConfig.issueStartNumber || resolvedIssueNumber)
    }
    return String(resolvedIssueNumber)
  }, [useTeluguLabels, headerConfig.issueStartNumber, resolvedIssueNumber])
  const volumeMetaValue = useMemo(() => {
    if (useTeluguLabels) {
      return String(headerConfig.startVolumeNumber || resolvedVolumeNumber)
    }
    return String(resolvedVolumeNumber)
  }, [useTeluguLabels, headerConfig.startVolumeNumber, resolvedVolumeNumber])

  const activePlacements = useMemo(() => activePage?.placements || [], [activePage])
  const headerLeadPlacement = useMemo(() => activePlacements?.[0] || null, [activePlacements])
  const rightPanelTitle = useMemo(() => {
    if (headerLeadPlacement?.title) return headerLeadPlacement.title
    if (headerConfig.secondPageHeader) return headerConfig.secondPageHeader
    return useTeluguLabels ? 'ప్రధాన వార్త' : 'Lead Story'
  }, [headerLeadPlacement, headerConfig.secondPageHeader, useTeluguLabels])
  const rightPanelSummary = useMemo(() => {
    if (headerLeadPlacement) {
      if (useTeluguLabels) {
        return `${headerLeadPlacement.district || 'జిల్లా'} · ${headerLeadPlacement.wordCount || 0} పదాలు`
      }
      return `${headerLeadPlacement.district || 'District'} · ${headerLeadPlacement.wordCount || 0} words`
    }
    if (headerConfig.secondPageHeader) return headerConfig.secondPageHeader
    return useTeluguLabels ? 'ఇవాళ ముఖ్యాంశాలు' : 'Top updates for this page'
  }, [headerLeadPlacement, headerConfig.secondPageHeader, useTeluguLabels])
  const publishedFromText = useMemo(() => {
    return headerConfig.publishedAreaText || headerConfig.secondPageHeader || getTenantDisplayName(selectedTenant)
  }, [headerConfig.publishedAreaText, headerConfig.secondPageHeader, selectedTenant])

  const usedArticleIds = useMemo(() => {
    const ids = new Set()
    pages.forEach(pageItem => {
      pageItem.placements.forEach(placement => ids.add(placement.articleId))
    })
    return ids
  }, [pages])

  const unplacedArticles = useMemo(
    () => articles.filter(article => !usedArticleIds.has(article.id)),
    [articles, usedArticleIds]
  )

  const filteredArticles = useMemo(() => {
    const query = articleSearch.trim().toLowerCase()
    if (!query) return articles
    return articles.filter(article => {
      const title = String(article?.title || '').toLowerCase()
      const district = extractDistrict(article).toLowerCase()
      return title.includes(query) || district.includes(query)
    })
  }, [articles, articleSearch])

  const selectedArticle = useMemo(
    () => articles.find(item => item.id === selectedArticleId) || null,
    [articles, selectedArticleId]
  )

  const selectedPlacement = useMemo(
    () => activePlacements.find(item => item.id === selectedPlacementId) || null,
    [activePlacements, selectedPlacementId]
  )

  const activePageUsedSlots = useMemo(
    () => activePlacements.reduce((total, placement) => total + estimateSlots(placement.blockCode), 0),
    [activePlacements]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onResize = () => setViewportWidth(window.innerWidth || 1280)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadTenants() {
      setTenantsLoading(true)
      try {
        const token = getToken()?.token
        const res = await fetch('/api/admin/proxy/tenants?full=true', {
          headers: {
            accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

        if (res.status === 401) {
          logout()
          router.replace('/')
          return
        }

        const text = await res.text()
        let json = null
        try {
          json = text ? JSON.parse(text) : null
        } catch {
          json = null
        }
        const items = Array.isArray(json) ? json : (json?.data || json?.items || [])

        if (!cancelled) {
          setTenantList(Array.isArray(items) ? items : [])
          const savedTenantId = typeof window !== 'undefined'
            ? window.localStorage.getItem(TENANT_STORAGE_KEY)
            : ''
          const defaultTenantId = savedTenantId && items.some(item => item.id === savedTenantId)
            ? savedTenantId
            : (items?.[0]?.id || '')

          if (defaultTenantId) {
            setSelectedTenantId(prev => prev || defaultTenantId)
          }

          // Always ask tenant when opening design page.
          setShowTenantPicker(true)
        }
      } catch {
        if (!cancelled) {
          setTenantList([])
        }
      } finally {
        if (!cancelled) setTenantsLoading(false)
      }
    }

    loadTenants()

    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!selectedTenantId) return
    window.localStorage.setItem(TENANT_STORAGE_KEY, selectedTenantId)

    // Load editions whenever tenant changes
    let cancelled = false
    async function loadEditions() {
      setEditionsLoading(true)
      try {
        const token = getToken()?.token
        const params = new URLSearchParams({ tenantId: selectedTenantId, includeSubEditions: 'false' })
        const res = await fetch(`/api/admin/epaper/publication-editions?${params.toString()}`, {
          headers: { accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        })
        if (res.status === 401) { logout(); router.replace('/'); return }
        const json = await res.json().catch(() => null)
        const items = json?.items || json?.data?.items || json?.data || []
        if (!cancelled) {
          const list = Array.isArray(items) ? items : []
          setEditionList(list)
          setSelectedEditionId(prev => (prev && list.some(e => e.id === prev)) ? prev : (list[0]?.id || ''))
        }
      } catch { /* ignore */ } finally {
        if (!cancelled) setEditionsLoading(false)
      }
    }
    loadEditions()
    return () => { cancelled = true }
  }, [selectedTenantId, router])

  const loadWorkspace = useCallback(async (tenantOverride = '') => {
    const tenantId = tenantOverride || selectedTenantId
    if (!tenantId) {
      setError('Select tenant first')
      return
    }

    setLoading(true)
    setError('')
    setInfo('')
    setPayloadPreview('')
    setLayoutSaved(false)
    setLayoutId(null)

    try {
      const token = getToken()?.token
      if (!token) {
        logout()
        router.push('/')
        return
      }

      const smartParams = new URLSearchParams({
        tenantId,
        issueDate: fromDate,
        status,
        limit: '200',
        includeArticles: 'true',
      })
      if (selectedEditionId) smartParams.set('editionId', selectedEditionId)

      const smartRes = await fetch(`/api/admin/epaper/designer/sections/smart?${smartParams.toString()}`, {
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (smartRes.status === 401) {
        logout()
        router.push('/')
        return
      }

      const smartText = await smartRes.text()
      let smartJson = null
      try {
        smartJson = smartText ? JSON.parse(smartText) : null
      } catch {
        smartJson = null
      }

      if (!smartRes.ok) throw new Error(smartJson?.error || smartJson?.message || 'Failed to load smart sections')

      let blocks = extractArticlesFromSmartSections(smartJson)
      let sourceLabel = 'smart sections'

      if (!blocks.length) {
        const fallbackCollected = []
        let page = 1
        let totalPages = 1

        while (page <= totalPages) {
          const articlesParams = new URLSearchParams({
            tenantId,
            status,
            page: String(page),
            pageSize: '100',
          })
          if (fromDate) articlesParams.set('fromDate', fromDate)
          if (selectedEditionId) articlesParams.set('editionId', selectedEditionId)

          const articlesRes = await fetch(`/api/admin/epaper/designer/articles?${articlesParams.toString()}`, {
            headers: {
              accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          })

          if (articlesRes.status === 401) {
            logout()
            router.push('/')
            return
          }

          const articlesText = await articlesRes.text()
          let articlesJson = null
          try {
            articlesJson = articlesText ? JSON.parse(articlesText) : null
          } catch {
            articlesJson = null
          }

          if (!articlesRes.ok) {
            throw new Error(articlesJson?.error || articlesJson?.message || 'Failed to load fallback articles')
          }

          const fallbackPayload = (articlesJson?.data && typeof articlesJson.data === 'object')
            ? articlesJson.data
            : (articlesJson || {})

          const pageBlocks = Array.isArray(fallbackPayload?.blocks)
            ? fallbackPayload.blocks
            : (Array.isArray(fallbackPayload?.items) ? fallbackPayload.items : [])

          fallbackCollected.push(...pageBlocks)
          totalPages = Number(fallbackPayload?.totalPages || page)
          if (!Number.isFinite(totalPages) || totalPages < page) totalPages = page
          page += 1
        }

        blocks = fallbackCollected
        sourceLabel = 'fallback articles'

        // If selected date has no data, try latest available fallback (without date filter).
        if (!blocks.length && fromDate) {
          const latestCollected = []
          page = 1
          totalPages = 1

          while (page <= totalPages) {
            const latestParams = new URLSearchParams({
              tenantId,
              status,
              page: String(page),
              pageSize: '100',
            })

            const latestRes = await fetch(`/api/admin/epaper/designer/articles?${latestParams.toString()}`, {
              headers: {
                accept: 'application/json',
                Authorization: `Bearer ${token}`,
              },
            })

            if (latestRes.status === 401) {
              logout()
              router.push('/')
              return
            }

            const latestText = await latestRes.text()
            let latestJson = null
            try {
              latestJson = latestText ? JSON.parse(latestText) : null
            } catch {
              latestJson = null
            }

            if (!latestRes.ok) {
              throw new Error(latestJson?.error || latestJson?.message || 'Failed to load latest fallback articles')
            }

            const latestPayload = (latestJson?.data && typeof latestJson.data === 'object')
              ? latestJson.data
              : (latestJson || {})

            const latestBlocks = Array.isArray(latestPayload?.blocks)
              ? latestPayload.blocks
              : (Array.isArray(latestPayload?.items) ? latestPayload.items : [])

            latestCollected.push(...latestBlocks)
            totalPages = Number(latestPayload?.totalPages || page)
            if (!Number.isFinite(totalPages) || totalPages < page) totalPages = page
            page += 1
          }

          if (latestCollected.length) {
            blocks = latestCollected
            sourceLabel = 'latest fallback articles'
          }
        }
      }

      const uniqueArticles = Array.from(
        new Map(
          blocks
            .map((article) => {
              const articleId = getArticleId(article)
              if (!articleId) return null
              return [articleId, { ...article, id: articleId }]
            })
            .filter(Boolean)
        ).values()
      )
      setArticles(uniqueArticles)
      setSelectedArticleId(uniqueArticles?.[0]?.id || null)

      // After smart-article fetch, load design settings.
      const cfgRes = await fetch(`/api/admin/epaper/design-config?tenantId=${encodeURIComponent(tenantId)}`, {
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (cfgRes.status === 401) {
        logout()
        router.push('/')
        return
      }

      const cfgText = await cfgRes.text()
      let cfgJson = null
      try {
        cfgJson = cfgText ? JSON.parse(cfgText) : null
      } catch {
        cfgJson = null
      }

      if (!cfgRes.ok) {
        throw new Error(cfgJson?.error || cfgJson?.message || 'Failed to load design config')
      }

      const cfg = cfgJson

      const resolvedSpec = resolvePageSpecFromConfig(cfg, preset)
      if (resolvedSpec.preset !== preset) setPreset(resolvedSpec.preset)
      setCustomPageMeta(resolvedSpec.customPageMeta)
      setPageSpecSource(resolvedSpec.source)

      const nextHeader = extractHeaderConfig(cfg)
      setHeaderConfig(nextHeader)

      // ── Try to restore a previously saved layout for this date + edition ──
      let restoredPages = null
      try {
        const layoutParams = new URLSearchParams({ tenantId, issueDate: fromDate })
        if (selectedEditionId) layoutParams.set('editionId', selectedEditionId)
        const layoutRes = await fetch(`/api/admin/epaper/layout?${layoutParams.toString()}`, {
          headers: { accept: 'application/json', Authorization: `Bearer ${token}` },
        })
        if (layoutRes.ok) {
          const layoutJson = await layoutRes.json().catch(() => null)
          if (layoutJson?.found && Array.isArray(layoutJson?.pages) && layoutJson.pages.length) {
            // Rebuild pages from saved layout, hydrating placement metadata from articles
            const articleMap = new Map(uniqueArticles.map(a => [a.id, a]))
            const restored = layoutJson.pages.map((savedPage, idx) => ({
              id: idx + 1,
              placements: (savedPage.placements || [])
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                .map(p => {
                  const art = articleMap.get(p.articleId) || null
                  return {
                    id: p.articleId,
                    articleId: p.articleId,
                    title: art?.title || p.articleId,
                    wordCount: Number(art?.wordCount || 0),
                    imageCount: Array.isArray(art?.media) ? art.media.length : 0,
                    district: extractDistrict(art || {}),
                    blockCode: normalizeBlockCode(p.blockCode) || resolveArticleBlockCode(art || {}),
                    templateBlockId: p.templateBlockId || resolveArticleTemplateId(art || {}),
                    x: 0, y: 0, fontSize: 11, color: '#111827',
                  }
                }),
            }))
            restoredPages = restored
            setLayoutId(layoutJson.layoutId || null)
            setLayoutSaved(true)
          }
        }
      } catch { /* ignore layout load errors — fall back to auto-arrange */ }

      const nextPages = restoredPages || paginateFromSecondPage(uniqueArticles, nextHeader.numberOfPages, maxSlotsPerPage)
      setPages(nextPages)
      setActivePageId(nextPages[1]?.id || nextPages[0]?.id || 1)
      setSelectedPlacementId(null)
      setShowSetup(false)
      setShowTenantPicker(false)

      if (!uniqueArticles.length) {
        setInfo(`No articles found for ${fromDate} (${status}). Date లేదా status మార్చి reload చేయండి.`)
      } else if (restoredPages) {
        setInfo(`Loaded ${uniqueArticles.length} articles · Restored saved layout (${restoredPages.length} pages).`)
      } else {
        setInfo(`Loaded ${uniqueArticles.length} articles from ${sourceLabel}. Auto-arranged across ${nextPages.length} pages.`)
      }
    } catch (e) {
      setError(e?.message || 'Failed to load workspace')
      setArticles([])
      setPages(buildPages(1))
      setActivePageId(1)
    } finally {
      setLoading(false)
    }
  }, [selectedTenantId, selectedEditionId, status, fromDate, preset, router, maxSlotsPerPage])

  const confirmTenantAndLoad = async () => {
    if (!selectedTenantId) {
      setError('Select tenant first')
      return
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TENANT_STORAGE_KEY, selectedTenantId)
    }
    await loadWorkspace(selectedTenantId)
  }

  const updateActivePagePlacements = (updater) => {
    setPages(prev => prev.map(pageItem => {
      if (pageItem.id !== activePageId) return pageItem
      const nextPlacements = typeof updater === 'function' ? updater(pageItem.placements) : pageItem.placements
      return { ...pageItem, placements: nextPlacements }
    }))
  }

  const addSelectedToPage = () => {
    if (!selectedArticle) return
    if (usedArticleIds.has(selectedArticle.id)) return

    const placement = buildPlacement(selectedArticle)
    const required = estimateSlots(placement.blockCode)
    if (activePageUsedSlots + required > maxSlotsPerPage) {
      setError(`Page ${pages.findIndex(p => p.id === activePageId) + 1} is full`) 
      return
    }

    updateActivePagePlacements(prev => [...prev, placement])
    setSelectedPlacementId(placement.id)
    setInfo(`Added article to page ${pages.findIndex(p => p.id === activePageId) + 1}`)
  }

  const autoFillActivePage = () => {
    let free = maxSlotsPerPage - activePageUsedSlots
    const picked = []

    unplacedArticles.forEach(article => {
      const placement = buildPlacement(article)
      const slots = estimateSlots(placement.blockCode)
      if (slots <= free) {
        picked.push(placement)
        free -= slots
      }
    })

    if (!picked.length) return

    updateActivePagePlacements(prev => [...prev, ...picked])
    setInfo(`Auto-filled ${picked.length} articles on active page`)
  }

  const districtWiseArrange = () => {
    const grouped = new Map()
    const sorted = [...articles].sort((a, b) => {
      const districtA = extractDistrict(a)
      const districtB = extractDistrict(b)
      if (districtA === districtB) return String(a.title || '').localeCompare(String(b.title || ''))
      return districtA.localeCompare(districtB)
    })

    sorted.forEach(article => {
      const district = extractDistrict(article)
      if (!grouped.has(district)) grouped.set(district, [])
      grouped.get(district).push(article)
    })

    // Deduplicate
    const seenIds = new Set()
    const uniqueOrdered = Array.from(grouped.values()).flat().filter(a => {
      const id = getArticleId(a) || a.id
      if (!id || seenIds.has(id)) return false
      seenIds.add(id)
      return true
    })

    // Row-based packing, max MAX_EPAPER_PAGES
    const districtRows = buildInchRows(uniqueOrdered)
    const initialCnt = Math.min(MAX_EPAPER_PAGES, Math.max(2, headerConfig.numberOfPages))
    const arrangedPages = buildPages(initialCnt)

    let pageIndex = 1
    let rowsOnPage = 0

    districtRows.forEach(row => {
      if (pageIndex >= MAX_EPAPER_PAGES) return
      if (rowsOnPage >= MAX_ROWS_PER_PAGE) {
        pageIndex += 1
        rowsOnPage = 0
        if (pageIndex >= arrangedPages.length) {
          if (arrangedPages.length < MAX_EPAPER_PAGES) {
            arrangedPages.push({ id: arrangedPages.length + 1, placements: [] })
          } else {
            return
          }
        }
      }
      row.forEach(p => arrangedPages[pageIndex].placements.push(p))
      rowsOnPage += 1
    })

    const finalPages = arrangedPages.slice(0, MAX_EPAPER_PAGES)
    setPages(finalPages)
    setActivePageId(finalPages[1]?.id || finalPages[0]?.id || 1)
    setSelectedPlacementId(null)
    setInfo(`District-wise arranged ${uniqueOrdered.length} articles into ${finalPages.length} pages (max ${MAX_EPAPER_PAGES})`)
  }

  const autoPaginateAll = () => {
    const nextPages = paginateFromSecondPage(articles, headerConfig.numberOfPages, maxSlotsPerPage)

    setPages(nextPages)
    setActivePageId(nextPages[1]?.id || nextPages[0]?.id || 1)
    setSelectedPlacementId(null)
    setInfo(`Auto-paginated ${articles.length} articles from page 2 into ${nextPages.length} pages`)
  }

  const removePlacement = (placementId) => {
    updateActivePagePlacements(prev => prev.filter(item => item.id !== placementId))
    if (selectedPlacementId === placementId) setSelectedPlacementId(null)
  }

  const updatePlacement = (placementId, patch) => {
    updateActivePagePlacements(prev => prev.map(item => {
      if (item.id !== placementId) return item
      return { ...item, ...patch }
    }))
  }

  const nudgeSelectedPlacement = (dx, dy) => {
    if (!selectedPlacement) return
    updatePlacement(selectedPlacement.id, {
      x: Number(selectedPlacement.x || 0) + dx,
      y: Number(selectedPlacement.y || 0) + dy,
    })
  }

  const openMobileTab = (tab) => {
    if (tab === 'canvas') {
      setShowSetup(false)
      setMobilePanel('canvas')
      return
    }
    if (tab === 'setup') {
      setShowSetup(true)
      setMobilePanel('canvas')
      return
    }
    setShowSetup(false)
    setMobilePanel('articles')
    setRightTab(tab)
  }

  const addNewPage = () => {
    setPages(prev => {
      const nextId = prev.length ? Math.max(...prev.map(item => item.id)) + 1 : 1
      setActivePageId(nextId)
      return [...prev, { id: nextId, placements: [] }]
    })
  }

  const removePage = (pageId) => {
    if (pages.length === 1) return
    const nextPages = pages
      .filter(item => item.id !== pageId)
      .map((item, idx) => ({ ...item, id: idx + 1 }))
    setPages(nextPages)
    setActivePageId((prevActive) => {
      if (prevActive === pageId) return nextPages[0]?.id || 1
      if (prevActive > pageId) return prevActive - 1
      return prevActive
    })
    setInfo(`Page ${pageId} deleted`)
  }

  const syncBlockLinks = async () => {
    const token = getToken()?.token
    if (!token) {
      logout()
      router.push('/')
      return
    }

    setSaving(true)
    setError('')
    setInfo('')

    try {
      const placements = pages.flatMap(pageItem => pageItem.placements)
      let success = 0
      let skipped = 0

      for (const placement of placements) {
        const templateBlockId = placement.templateBlockId || templateMap[placement.blockCode]
        if (!templateBlockId) {
          skipped += 1
          continue
        }

        const params = new URLSearchParams({ tenantId: selectedTenantId })
        const res = await fetch(
          `/api/admin/epaper/designer/articles/${placement.articleId}/block-template?${params.toString()}`,
          {
            method: 'PATCH',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ templateBlockId }),
          }
        )

        if (res.ok) success += 1
      }

      setInfo(`Block links synced: ${success} success, ${skipped} skipped (missing template id)`)
    } catch (e) {
      setError(e?.message || 'Failed to sync block links')
    } finally {
      setSaving(false)
    }
  }

  const saveLayout = async () => {
    const token = getToken()?.token
    if (!token) { logout(); router.push('/'); return }
    if (!selectedTenantId) { setError('Tenant select చేయండి'); return }
    if (!pages.length) { setError('Layout empty — arrange articles first'); return }

    setSaving(true)
    setError('')
    setInfo('')

    try {
      const payload = {
        tenantId: selectedTenantId,
        issueDate: fromDate,
        ...(selectedEditionId ? { editionId: selectedEditionId } : {}),
        pages: pages.map((pageItem, idx) => ({
          pageNumber: idx + 1,
          placements: pageItem.placements.map((placement, pos) => ({
            articleId: placement.articleId,
            blockCode: placement.blockCode,
            position: pos,
            templateBlockId: placement.templateBlockId || templateMap[placement.blockCode] || null,
          })),
        })),
      }

      const res = await fetch('/api/admin/epaper/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.status === 401) { logout(); router.push('/'); return }
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.message || json?.error || `Save failed: ${res.status}`)

      setLayoutId(json?.layoutId || null)
      setLayoutSaved(true)
      setInfo(`Layout saved ✓  (${pages.length} pages · ${payload.pages.reduce((s, p) => s + p.placements.length, 0)} articles)${json?.layoutId ? `  ID: ${json.layoutId}` : ''}`)
    } catch (e) {
      setError(e?.message || 'Layout save failed')
    } finally {
      setSaving(false)
    }
  }

  const copyPayload = async () => {
    // Keep for debugging — copies a JSON preview to clipboard
    try {
      const payload = {
        tenantId: selectedTenantId,
        issueDate: fromDate,
        editionId: selectedEditionId || null,
        pages: pages.map((pageItem, idx) => ({
          pageNumber: idx + 1,
          placements: pageItem.placements.map((p, pos) => ({
            articleId: p.articleId, blockCode: p.blockCode, position: pos,
          })),
        })),
      }
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      setInfo('Payload copied to clipboard')
    } catch {
      setInfo('Copy failed')
    }
  }

  return (
    <DashboardLayout title="Epaper Design Studio">
      <div className="min-h-screen bg-slate-100 p-3 sm:p-4 lg:p-6 pb-20 xl:pb-6">
        <div className="max-w-[1920px] mx-auto space-y-4">
          {/* ── Top Command Bar ── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">

              {/* Tenant identity */}
              <div className="flex items-center gap-2 min-w-0">
                {selectedTenant && getTenantBrandLogo(selectedTenant) ? (
                  <Image
                    src={getTenantBrandLogo(selectedTenant)}
                    alt={getTenantDisplayName(selectedTenant)}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-lg object-cover border border-slate-200 shrink-0"
                    unoptimized
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">{getTenantDisplayName(selectedTenant).charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 leading-none">Tenant</div>
                  <div className="text-sm font-bold text-slate-900 truncate max-w-[160px]">
                    {selectedTenant ? getTenantDisplayName(selectedTenant) : 'No tenant selected'}
                  </div>
                </div>
                <button
                  onClick={() => setShowTenantPicker(true)}
                  className="ml-1 px-2 py-1 rounded-lg border border-slate-300 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 shrink-0"
                >
                  Change
                </button>
              </div>

              <div className="h-7 w-px bg-slate-200 hidden sm:block" />

              {/* Publish date */}
              <div className="flex items-center gap-2">
                <div>
                  <div className="text-[10px] text-slate-500 leading-none mb-0.5">Publish Date</div>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => { setFromDate(e.target.value); setLayoutSaved(false) }}
                    className="border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 leading-none mb-0.5">Edition</div>
                  <select
                    value={selectedEditionId}
                    onChange={(e) => { setSelectedEditionId(e.target.value); setLayoutSaved(false) }}
                    disabled={editionsLoading || !editionList.length}
                    className="border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[140px]"
                  >
                    {!editionList.length ? (
                      <option value="">{editionsLoading ? 'Loading…' : 'No editions'}</option>
                    ) : (
                      editionList.map(ed => (
                        <option key={ed.id} value={ed.id}>{ed.name || ed.id}</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 leading-none mb-0.5">Status</div>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
              </div>

              <div className="h-7 w-px bg-slate-200 hidden sm:block" />

              {/* Page size from backend */}
              <div className="flex items-center gap-2">
                <div>
                  <div className="text-[10px] text-slate-500 leading-none">Page Size</div>
                  <div className="text-sm font-bold text-slate-900">{pageMeta.label}</div>
                  <div className="text-[10px] text-slate-500 leading-none">{pageMeta.widthCm}×{pageMeta.heightCm}cm ·
                    {pageSpecSource === 'API_CUSTOM' || pageSpecSource === 'API_PRESET' || pageSpecSource === 'API_PRESET_MATCH'
                      ? <span className="text-emerald-600 font-semibold"> Backend ✓</span>
                      : <span className="text-amber-600"> Default</span>}
                  </div>
                </div>
              </div>

              <div className="h-7 w-px bg-slate-200 hidden sm:block" />

              {/* Live stats — pill style */}
              <div className="flex items-center gap-1.5">
                {[
                  { label: 'Pages', value: pages.length, cls: 'text-slate-900' },
                  { label: 'Articles', value: articles.length, cls: 'text-slate-900' },
                  { label: 'Placed', value: usedArticleIds.size, cls: 'text-emerald-700' },
                  { label: 'Left', value: unplacedArticles.length, cls: 'text-amber-700' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="flex flex-col items-center px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 min-w-[40px]">
                    <div className="text-[9px] text-slate-500 uppercase tracking-wide leading-none">{label}</div>
                    <div className={`font-bold text-sm leading-tight ${cls}`}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => {
                    const query = selectedTenantId ? `?tenantId=${encodeURIComponent(selectedTenantId)}` : ''
                    window.open(`/admin/epaper/header-style1-preview${query}`, '_blank')
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Preview
                </button>
                <button
                  onClick={() => setShowSetup(prev => !prev)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {showSetup ? 'Hide Setup' : 'Setup'}
                </button>
                <button
                  onClick={saveLayout}
                  disabled={saving || !selectedTenantId || !pages.length}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-60 ${layoutSaved ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}
                >
                  {saving ? 'Saving…' : layoutSaved ? 'Saved ✓' : 'Save Layout'}
                </button>
                <button
                  onClick={() => loadWorkspace(selectedTenantId)}
                  disabled={loading || !selectedTenantId}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? 'Loading…' : 'Reload'}
                </button>
              </div>
            </div>
          </div>

          {showTenantPicker ? (
            <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[1px] flex items-center justify-center p-3">
              <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-slate-900">Select Tenant To Start Epaper Design</div>
                    <div className="text-xs text-slate-500">Tenant ఎంచుకున్న తర్వాత design config and articles load అవుతాయి.</div>
                  </div>
                  {articles.length ? (
                    <button onClick={() => setShowTenantPicker(false)} className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-50">Close</button>
                  ) : null}
                </div>

                <div className="p-4">
                  <div className="mb-2 text-xs text-slate-600">Available Tenants</div>
                  <div className="border rounded-xl max-h-72 overflow-auto divide-y divide-slate-100">
                    {tenantList.map(item => {
                      const active = selectedTenantId === item.id
                      const brandLogo = getTenantBrandLogo(item)
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedTenantId(item.id)}
                          className={`w-full text-left px-3 py-2.5 transition ${active ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-2">
                            {brandLogo ? (
                              <Image
                                src={brandLogo}
                                alt={getTenantDisplayName(item)}
                                width={28}
                                height={28}
                                className="h-7 w-7 rounded object-cover border border-slate-200"
                                unoptimized
                              />
                            ) : null}
                            <div className="text-sm font-semibold text-slate-900">{getTenantDisplayName(item)}</div>
                          </div>
                        </button>
                      )
                    })}

                    {!tenantList.length ? (
                      <div className="px-3 py-4 text-xs text-slate-500">{tenantsLoading ? 'Loading tenants...' : 'No tenants found'}</div>
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    {articles.length ? (
                      <button onClick={() => setShowTenantPicker(false)} className="px-3 py-2 rounded-lg border text-xs font-semibold hover:bg-slate-50">Cancel</button>
                    ) : null}
                    <button
                      onClick={confirmTenantAndLoad}
                      disabled={!selectedTenantId || tenantsLoading || loading}
                      className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-60"
                    >
                      {loading ? 'Loading...' : 'Continue'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {showSetup ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="text-base font-bold text-slate-900">Epaper Workflow Studio</div>
                <div className="text-xs text-slate-500">Main focus: page design canvas</div>
              </div>
              <div className="text-[11px] text-slate-500">Tenant → Load → Arrange → Sync</div>
            </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tenant Selection</label>
                  <select value={selectedTenantId} onChange={(e) => setSelectedTenantId(e.target.value)} disabled={tenantsLoading} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="">{tenantsLoading ? 'Loading tenants...' : 'Select tenant'}</option>
                    {tenantList.map(item => (
                      <option key={item.id} value={item.id}>{getTenantDisplayName(item)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">From Date</label>
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Page Size</label>
                  <select
                    value={preset}
                    onChange={(e) => {
                      setPreset(e.target.value)
                      setCustomPageMeta(null)
                      setPageSpecSource('MANUAL_OVERRIDE')
                    }}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="TABLOID">Tabloid (30 × 42 cm)</option>
                    <option value="BROADSHEET">Broadsheet (35 × 57 cm)</option>
                  </select>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {pageSpecSource === 'API_CUSTOM'
                      ? 'Loaded from backend settings (custom size)'
                      : pageSpecSource === 'API_PRESET' || pageSpecSource === 'API_PRESET_MATCH'
                        ? 'Loaded from backend settings'
                        : pageSpecSource === 'MANUAL_OVERRIDE'
                          ? 'Manual override active'
                          : 'Using default local preset'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Extra Safe Zone (cm)</label>
                  <input type="number" step="0.1" min="0" value={extraSafeZoneCm} onChange={(e) => setExtraSafeZoneCm(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div className="border rounded-lg p-2 bg-slate-50">
                  <div className="font-semibold text-slate-700">Edition</div>
                  <div className="text-slate-600 mt-1">{pageMeta.label} · {pageMeta.widthCm}×{pageMeta.heightCm} cm</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {pageSpecSource === 'API_CUSTOM'
                      ? 'Source: backend custom settings'
                      : pageSpecSource === 'API_PRESET' || pageSpecSource === 'API_PRESET_MATCH'
                        ? 'Source: backend preset settings'
                        : pageSpecSource === 'MANUAL_OVERRIDE'
                          ? 'Source: manual override'
                          : 'Source: local default'}
                  </div>
                </div>
                <div className="border rounded-lg p-2 bg-slate-50">
                  <div className="font-semibold text-slate-700">Print Grid</div>
                  <div className="text-slate-600 mt-1">{pageMeta.columns} cols · gutter {pageMeta.gutterCm}cm · col {gridMeta.colWidthCm}cm</div>
                </div>
                <div className="border rounded-lg p-2 bg-slate-50">
                  <div className="font-semibold text-slate-700">Session</div>
                  <div className="text-slate-600 mt-1">Articles {articles.length} · Pages {pages.length} · Active {activePlacements.length}</div>
                </div>
              </div>
          </div>
          ) : null}

          {error ? <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div> : null}
          {info ? <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{info}</div> : null}

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
            <div className={`${isMobile ? 'bg-transparent border-0 shadow-none p-0' : 'bg-white rounded-xl border border-slate-200 shadow-sm p-4'} overflow-auto ${mobilePanel !== 'canvas' ? 'hidden xl:block' : ''}`}>
              {!isMobile ? (
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">Newspaper Canvas</div>
                  <div className="text-[11px] text-slate-500">{pageMeta.label} · {pageMeta.widthCm} × {pageMeta.heightCm} cm</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[9px] text-slate-500 uppercase tracking-wide leading-none">Blocks</div>
                    <div className="font-bold text-slate-900 text-sm leading-tight">{activePlacements.length}</div>
                  </div>
                  <div className="flex flex-col items-center px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[9px] text-slate-500 uppercase tracking-wide leading-none">Slots</div>
                    <div className={`font-bold text-sm leading-tight ${
                      activePageUsedSlots >= maxSlotsPerPage ? 'text-red-600' :
                      activePageUsedSlots > maxSlotsPerPage * 0.75 ? 'text-amber-600' : 'text-emerald-700'
                    }`}>{activePageUsedSlots}/{maxSlotsPerPage}</div>
                  </div>
                </div>
              </div>
              ) : null}

              {!isMobile ? (
              <div className="flex flex-wrap items-center gap-2 mb-3 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide shrink-0">Actions</span>
                <div className="w-px h-4 bg-slate-300" />
                <button onClick={addSelectedToPage} disabled={!selectedArticle} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">+ Add Selected</button>
                <button onClick={autoFillActivePage} disabled={!unplacedArticles.length} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Auto Fill Page</button>
                <button onClick={autoPaginateAll} disabled={!articles.length} className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-[11px] font-semibold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Paginate All</button>
                <button onClick={districtWiseArrange} disabled={!articles.length} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">District Wise</button>
                <button onClick={addNewPage} className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">+ Page</button>
              </div>
              ) : null}

              {!isMobile ? (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {pages.map((pageItem, index) => {
                  const isActive = pageItem.id === activePageId
                  const artCount = pageItem.placements.length
                  const slotsUsed = pageItem.placements.reduce((s, pl) => s + estimateSlots(pl.blockCode), 0)
                  const slotPct = Math.min(100, Math.round((slotsUsed / maxSlotsPerPage) * 100))
                  const isFull = slotsUsed >= maxSlotsPerPage
                  return (
                    <div key={pageItem.id} className="flex items-center gap-1">
                      <button
                        onClick={() => { setActivePageId(pageItem.id); setSelectedPlacementId(null) }}
                        className={`relative flex flex-col items-center px-3 py-1.5 rounded-lg text-[11px] font-semibold border min-w-[52px] overflow-hidden transition-colors ${
                          isActive ? 'bg-blue-600 text-white border-blue-600' :
                          isFull ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' :
                          'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="leading-tight">P{index + 1}</span>
                        <span className={`text-[9px] font-normal leading-none ${
                          isActive ? 'text-blue-100' : isFull ? 'text-emerald-600' : 'text-slate-400'
                        }`}>{artCount > 0 ? `${artCount}art` : '—'}</span>
                        {artCount > 0 && (
                          <span
                            className={`absolute bottom-0 left-0 h-[3px] ${
                              isActive ? 'bg-white/40' : isFull ? 'bg-emerald-500' : 'bg-blue-400'
                            }`}
                            style={{ width: `${slotPct}%` }}
                          />
                        )}
                      </button>
                      {pages.length > 1 ? (
                        <button onClick={(e) => { e.stopPropagation(); removePage(pageItem.id) }} className="px-1.5 py-1.5 rounded border border-red-200 text-red-400 text-[10px] hover:bg-red-50 hover:text-red-600 leading-none transition-colors">×</button>
                      ) : null}
                    </div>
                  )
                })}
              </div>
              ) : null}

              <div
                className={`${isMobile ? 'bg-slate-200 rounded-none p-0' : 'bg-[#1e1e22] rounded-xl p-3 sm:p-4 xl:p-6'} min-h-[460px] sm:min-h-[620px] xl:min-h-[790px] flex items-start justify-center overflow-auto`}
                style={isMobile ? { minHeight: 'calc(100vh - 160px)' } : undefined}
              >
                <div
                  className={`bg-white border relative ${isMobile ? 'shadow-md border-slate-300' : 'shadow-[0_8px_40px_rgba(0,0,0,0.55)] border-slate-400/60'}`}
                  style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px`, overflow: 'hidden' }}
                >
                  <div
                    className="absolute border border-dashed border-slate-300 pointer-events-none"
                    style={{
                      top: `${safeTopPx}px`,
                      right: `${safeRightPx}px`,
                      bottom: `${safeBottomPx}px`,
                      left: `${safeLeftPx}px`,
                    }}
                  />
                  <div style={{ paddingTop: `${safeTopPx}px`, paddingRight: `${safeRightPx}px`, paddingBottom: `${safeBottomPx}px`, paddingLeft: `${safeLeftPx}px` }} className="h-full flex flex-col">
                    <div className="border-b mb-2" style={{ height: `${Math.round(pageMeta.headerHeightCm * scale)}px` }}>
                      {activePageIndex === 0 ? (
                        <div className="h-full border rounded bg-white p-1">
                          <div className="h-full flex items-stretch gap-1.5">
                            <div className="w-[20%] shrink-0">
                              {headerConfig.headerLeftImageUrl ? (
                                <div className="relative h-full w-full rounded overflow-hidden border border-slate-200 bg-white">
                                  <Image src={headerConfig.headerLeftImageUrl} alt="Header Left" fill sizes="20vw" className="object-cover" unoptimized />
                                </div>
                              ) : (
                                <div className="h-full w-full rounded border border-slate-200 bg-slate-50" />
                              )}
                            </div>

                            <div className="w-[60%] min-w-0">
                              {headerConfig.logoUrl ? (
                                <div className="relative h-full w-full rounded border border-slate-200 bg-white">
                                  <Image src={headerConfig.logoUrl} alt="Header Logo" fill sizes="60vw" className="object-fill" unoptimized />
                                </div>
                              ) : (
                                <div className="h-full w-full rounded border border-slate-200 bg-white" />
                              )}
                            </div>

                            <div className="w-[20%] shrink-0">
                              <div className="h-full w-full rounded border border-slate-200 bg-slate-100 p-1.5 flex flex-col justify-between">
                                <div className="text-[10px] font-bold text-slate-900 leading-tight text-center line-clamp-2">{rightPanelTitle}</div>
                                <div className="text-[9px] text-slate-700 leading-tight text-center line-clamp-3">{rightPanelSummary}</div>
                                <div className="flex justify-end">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[10px] font-extrabold">{String(activePageIndex + 1).padStart(2, '0')}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col justify-start">
                          <div
                            className="mt-1 rounded overflow-hidden border border-[#d32592] bg-[#f3e3ef] shadow-sm"
                            style={{ height: `${subHeaderHeightPx}px` }}
                          >
                            <div className="h-full flex items-stretch text-[10px]">
                              <div className="w-[42%] bg-gradient-to-r from-[#d6008f] to-[#f106a3] text-white px-2 py-1.5 flex flex-col justify-center border-r border-[#c60480]">
                                <div className="font-extrabold leading-tight truncate">{teluguIssueDateText}</div>
                                <div className="font-semibold leading-tight truncate mt-0.5">{teluguIssueDayText}</div>
                              </div>

                              <div className="w-[44%] bg-[#f8ecf5] border-r border-[#dcc8d7] flex items-center justify-center px-2">
                                {headerConfig.subHeaderImageUrl ? (
                                  <div className="relative h-full w-full max-w-[220px] py-1.5">
                                    <Image src={headerConfig.subHeaderImageUrl} alt="Sub Header Logo" fill sizes="220px" className="object-contain" unoptimized />
                                  </div>
                                ) : (
                                  <div className="text-[#b30078] font-extrabold text-[16px] truncate">{headerConfig.secondPageHeader || 'చురకలు'}</div>
                                )}
                              </div>

                              <div className="w-[14%] bg-gradient-to-b from-[#f106a3] to-[#d6008f] p-1.5 flex items-center justify-center">
                                <div className="h-full w-full rounded bg-[#b10074] border border-white/40 flex items-center justify-center shadow-inner">
                                  <span className="text-white font-extrabold text-[22px] leading-none">{activePageIndex + 1}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1" />
                        </div>
                      )}
                    </div>

                    {activePageIndex === 0 ? (
                      <div
                        className="mb-2 w-full rounded border border-[#c7c3a0] bg-[#d8d4b3] overflow-hidden"
                        style={{ minHeight: `${infoStripHeightPx}px` }}
                      >
                        <div className="h-full w-full flex items-stretch text-[10px] font-semibold text-slate-900">
                          <span className="px-2 py-1 border-r border-[#a7a37f] whitespace-nowrap">{metaLabels.volume}: {volumeMetaValue}</span>
                          <span className="px-2 py-1 border-r border-[#a7a37f] whitespace-nowrap">{metaLabels.issue}: {issueMetaValue}</span>
                          <span className="px-2 py-1 border-r border-[#a7a37f] whitespace-nowrap">{issueDayText}</span>
                          <span className="px-2 py-1 border-r border-[#a7a37f] whitespace-nowrap">{issueDateText}</span>
                          <span className="flex-1 px-2 py-1 border-r border-[#a7a37f] truncate">Published from: <span className="font-extrabold">{publishedFromText}</span></span>
                          <span className="px-2 py-1 border-r border-[#a7a37f] whitespace-nowrap">{metaLabels.pages}: {pages.length}</span>
                          <span className="px-2 py-1 whitespace-nowrap">{metaLabels.sellCost}: {headerConfig.paperSellCost || '-'}</span>
                        </div>
                      </div>
                    ) : null}

                    <div className="text-[10px] text-slate-500 mb-2 truncate">
                      PRGI {headerConfig.prgiNumber || '-'} · Value {headerConfig.valueNumber || '-'}
                    </div>

                    {/* ── Newspaper Article Grid — flex rows, each row ≤12 column-inches ── */}
                    <div className="flex-1" style={{ overflow: 'hidden' }}>
                      {activePlacements.length ? (() => {
                        const gutterPx = Math.round(pageMeta.gutterCm * scale)
                        const totalWidthPx = Math.round(gridMeta.usableWidthCm * scale)

                        // Group placements into ≤12-inch rows for rendering
                        const canvasRows = []
                        let curRow = []
                        let curInches = 0
                        for (const p of activePlacements) {
                          const inches = BLOCK_META[p.blockCode]?.inches || 4
                          if (curInches + inches > 12 && curRow.length > 0) {
                            canvasRows.push({ placements: curRow, totalInches: curInches })
                            curRow = [p]
                            curInches = inches
                          } else {
                            curRow.push(p)
                            curInches += inches
                          }
                        }
                        if (curRow.length > 0) canvasRows.push({ placements: curRow, totalInches: curInches })

                        // ── Calculate how many px are available for article rows ──────────
                        // Everything below header + strips, above footer (includes small margins)
                        const hdrPx    = Math.round(pageMeta.headerHeightCm * scale) + 8   // border-b + mb-2
                        const ftrPx    = Math.round(pageMeta.footerHeightCm * scale) + 14  // pt-1.5 + mt-2
                        const stripsPx = activePageIndex === 0
                          ? infoStripHeightPx + 8 + 26   // info strip + mb-2 + PRGI line + mb-2
                          : subHeaderHeightPx + 8 + 26   // sub-header + flex + PRGI line + mb-2
                        const articleAreaH = Math.max(120,
                          canvasHeight - safeTopPx - safeBottomPx - hdrPx - ftrPx - stripsPx
                        )
                        const numRows = canvasRows.length || 1
                        // Each row gets an equal share — guaranteed to fit on page
                        const rowH = Math.max(60, Math.floor((articleAreaH - (numRows - 1) * gutterPx) / numRows))

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: gutterPx }}>
                            {canvasRows.map((rowData, rowIdx) => {
                              const rowTotalInches = rowData.totalInches || 12
                              const rowCount = rowData.placements.length
                              return (
                                <div key={rowIdx} style={{ display: 'flex', gap: gutterPx, alignItems: 'stretch', height: rowH }}>
                                  {rowData.placements.map((placement) => {
                                    const inches      = BLOCK_META[placement.blockCode]?.inches || 4
                                    const approxCellW = Math.round(
                                      (totalWidthPx - (rowCount - 1) * gutterPx) * (inches / rowTotalInches)
                                    )
                                    const article  = articles.find(a => a.id === placement.articleId)
                                    const isActive = selectedPlacementId === placement.id
                                    return (
                                      <div
                                        key={placement.id}
                                        style={{
                                          flex: `${inches} 1 0px`,
                                          position: 'relative',
                                          cursor: 'pointer',
                                          outline: isActive ? '2.5px solid #3b82f6' : '1px solid #d1d5db',
                                          outlineOffset: isActive ? 1 : 0,
                                          overflow: 'hidden',
                                          backgroundColor: '#fff',
                                        }}
                                        onClick={() => setSelectedPlacementId(placement.id)}
                                      >
                                        <CanvasBlockPreview
                                          placement={placement}
                                          article={article}
                                          cellW={approxCellW}
                                          cellH={rowH}
                                        />
                                        <button
                                          style={{ position: 'absolute', top: 3, right: 3, zIndex: 10, background: 'rgba(239,68,68,0.85)', color: '#fff', border: 'none', borderRadius: 3, fontSize: 9, padding: '2px 5px', cursor: 'pointer', lineHeight: 1.4, fontWeight: 700, pointerEvents: 'auto' }}
                                          onClick={(e) => { e.stopPropagation(); removePlacement(placement.id) }}
                                        >✕</button>
                                      </div>
                                    )
                                  })}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })() : (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <line x1="3" y1="9" x2="21" y2="9" />
                              <line x1="9" y1="21" x2="9" y2="9" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold text-slate-500">Page Empty</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Auto Fill చేయండి లేదా article select చేసి add చేయండి</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-1.5 mt-2" style={{ minHeight: `${Math.round(pageMeta.footerHeightCm * scale)}px` }}>
                      {activePageIndex === pages.length - 1 ? (
                        <div className="text-[10px] text-slate-600 truncate">{headerConfig.lastPageFooterText || 'Last page footer text'}</div>
                      ) : (
                        <div className="h-full w-full border border-slate-300 rounded px-2 py-1">
                          <div className="h-full w-full flex items-center justify-between gap-2">
                            {INNER_FOOTER_SWATCH_GROUPS.map((group, idx) => (
                              <div key={`footer-style-${idx}`} className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-0.5">
                                  {group.map((color, swatchIdx) => (
                                    <span
                                      key={`swatch-${idx}-${swatchIdx}`}
                                      className="h-2.5 w-2.5 rounded-[1px] border border-black/20"
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-3 xl:h-[calc(100vh-210px)] overflow-y-auto ${mobilePanel !== 'articles' ? 'hidden xl:block' : ''}`}>
              <div className="sticky top-0 bg-white z-10 pb-2 border-b border-slate-100 mb-3">
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <div className="text-sm font-bold text-slate-900">Design Panel</div>
                    <div className="text-[10px] text-slate-500">{articles.length} total · {usedArticleIds.size} placed · {unplacedArticles.length} unplaced</div>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    layoutSaved
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {layoutSaved ? '✓ Saved' : '● Unsaved'}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setRightTab('articles')} className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                    rightTab === 'articles' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>Articles</button>
                  <button onClick={() => setRightTab('editor')} className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                    rightTab === 'editor' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>Editor</button>
                  <button onClick={() => setRightTab('mapping')} className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                    rightTab === 'mapping' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>Block Map</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={syncBlockLinks} disabled={saving || !pages.length} className="px-2 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-60">{saving ? 'Syncing...' : 'Sync Block Links'}</button>
                <button onClick={copyPayload} disabled={!pages.length} className="px-2 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Copy JSON</button>
              </div>

              {rightTab === 'mapping' ? (
                <div className="rounded-lg border p-2 mb-3">
                  <div className="text-xs font-semibold text-slate-700 mb-2">Template ID Map (Block → Template)</div>
                  <div className="space-y-2">
                    {BLOCK_CODES.map(code => (
                      <div key={code} className="grid grid-cols-[88px_1fr] gap-2 items-center">
                        <label className="text-[11px] font-semibold text-slate-600">{code}</label>
                        <input
                          value={templateMap[code] || ''}
                          onChange={(e) => setTemplateMap(prev => ({ ...prev, [code]: e.target.value }))}
                          placeholder="templateBlockId"
                          className="w-full border rounded px-2 py-1.5 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {rightTab === 'editor' ? (
                selectedPlacement ? (
                  <div className="rounded-lg border p-2 mb-3 bg-slate-50">
                    <div className="text-xs font-semibold text-slate-700 mb-2">Selected Placement Editor</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Block</label>
                          <select value={selectedPlacement.blockCode} onChange={(e) => updatePlacement(selectedPlacement.id, { blockCode: e.target.value, templateBlockId: templateMap[e.target.value] || null })} className="w-full border rounded px-2 py-1.5 text-xs bg-white">
                          {BLOCK_CODES.map(code => <option key={code} value={code}>{code}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Font Size</label>
                        <input type="number" min="8" max="36" value={selectedPlacement.fontSize} onChange={(e) => updatePlacement(selectedPlacement.id, { fontSize: Number(e.target.value) })} className="w-full border rounded px-2 py-1.5 text-xs" />
                        <div className="flex gap-1 mt-1">
                          {[10, 11, 12, 14].map(size => (
                            <button key={size} onClick={() => updatePlacement(selectedPlacement.id, { fontSize: size })} className="px-2 py-1 rounded border text-[10px] hover:bg-slate-100">{size}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">X</label>
                        <input type="number" value={selectedPlacement.x} onChange={(e) => updatePlacement(selectedPlacement.id, { x: Number(e.target.value) })} className="w-full border rounded px-2 py-1.5 text-xs" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Y</label>
                        <input type="number" value={selectedPlacement.y} onChange={(e) => updatePlacement(selectedPlacement.id, { y: Number(e.target.value) })} className="w-full border rounded px-2 py-1.5 text-xs" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Font Color</label>
                        <input type="color" value={selectedPlacement.color} onChange={(e) => updatePlacement(selectedPlacement.id, { color: e.target.value })} className="w-full h-8 border rounded" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Quick Position Nudge</label>
                        <div className="grid grid-cols-4 gap-1">
                          <button onClick={() => nudgeSelectedPlacement(-1, 0)} className="px-2 py-1 rounded border text-[10px] hover:bg-slate-100">← X-1</button>
                          <button onClick={() => nudgeSelectedPlacement(1, 0)} className="px-2 py-1 rounded border text-[10px] hover:bg-slate-100">X+1 →</button>
                          <button onClick={() => nudgeSelectedPlacement(0, -1)} className="px-2 py-1 rounded border text-[10px] hover:bg-slate-100">↑ Y-1</button>
                          <button onClick={() => nudgeSelectedPlacement(0, 1)} className="px-2 py-1 rounded border text-[10px] hover:bg-slate-100">Y+1 ↓</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border p-3 text-xs text-slate-500">Select a block from canvas to edit.</div>
                )
              ) : null}

              {rightTab === 'articles' ? (
                <>
                  {/* Auto-fill buttons */}
                  <div className="mb-3 rounded-xl border border-violet-200 bg-violet-50 p-2.5">
                    <div className="text-[11px] font-bold text-violet-900 mb-1">Auto Fill All Pages</div>
                    <div className="text-[11px] text-violet-700 mb-2">
                      {articles.length} articles → block template assign చేసి page 2 నుంచి అన్ని pages లో fill చేస్తుంది
                    </div>
                    <div className="flex gap-2">
                      <button onClick={autoPaginateAll} disabled={!articles.length} className="flex-1 py-2 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 disabled:opacity-50">
                        Fill All Pages ({articles.length})
                      </button>
                      <button onClick={districtWiseArrange} disabled={!articles.length} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50">
                        District Wise
                      </button>
                    </div>
                  </div>

                  {/* Selected article full block preview */}
                  {selectedArticle ? (() => {
                    const selBlock = resolveArticleBlockCode(selectedArticle)
                    const selMeta = BLOCK_META[selBlock] || BLOCK_META['BLOCK-04A']
                    const selTemplateId = resolveTemplateBlockForArticle(selectedArticle, templateMap)
                    const PreviewComponent = BLOCK_COMPONENT_MAP[selBlock]
                    const nativeW = BLOCK_NATIVE_WIDTH_PX[selBlock] || 384
                    const containerW = 296
                    const sc = Math.min(1, containerW / nativeW)
                    const previewH = 180
                    const blockProps = articleToBlockProps(selectedArticle)
                    return (
                      <div className="mb-3 rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: selMeta.color }}>
                        <div className="flex items-center px-2.5 py-1.5 gap-2" style={{ backgroundColor: selMeta.color }}>
                          <span className="text-[10px] font-bold text-white">{selBlock} · {selMeta.label}</span>
                          <span className="ml-auto text-[10px] text-white/75">{selMeta.desc} · {selMeta.inches}in</span>
                        </div>
                        <div className="px-2 pt-1.5 pb-1" style={{ backgroundColor: selMeta.bg }}>
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-2 bg-white/50 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${selMeta.widthPct}%`, backgroundColor: selMeta.color }} />
                            </div>
                            <span className="text-[10px] font-bold" style={{ color: selMeta.color }}>{selMeta.widthPct}%</span>
                          </div>
                        </div>
                        {PreviewComponent ? (
                          <div style={{ width: containerW, height: previewH, overflow: 'hidden', position: 'relative', backgroundColor: '#fff' }}>
                            <div style={{ transform: `scale(${sc})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, width: nativeW, pointerEvents: 'none' }}>
                              <PreviewComponent {...blockProps} />
                            </div>
                          </div>
                        ) : null}
                        <div className="flex items-center justify-between px-2 py-1.5 border-t text-[10px]" style={{ backgroundColor: selMeta.bg }}>
                          <span className="text-slate-600">Template ID:</span>
                          <span className="font-semibold text-slate-800 truncate ml-2">{selTemplateId || 'Not assigned'}</span>
                        </div>
                      </div>
                    )
                  })() : null}

                  {/* Search */}
                  <input
                    value={articleSearch}
                    onChange={(e) => setArticleSearch(e.target.value)}
                    placeholder="Search title or district…"
                    className="w-full border rounded-lg px-3 py-2 text-xs mb-3"
                  />

                  {/* Page-grouped article list (Page 2 onwards) */}
                  {pages.slice(1).map((pageItem, pageIdx) => {
                    const q = articleSearch.trim().toLowerCase()
                    const pageArticles = pageItem.placements
                      .map(pl => articles.find(a => a.id === pl.articleId))
                      .filter(Boolean)
                      .filter(a => !q || String(a.title || '').toLowerCase().includes(q) || extractDistrict(a).toLowerCase().includes(q))
                    if (!pageArticles.length) return null
                    const slotTotal = pageItem.placements.reduce((s, pl) => s + estimateSlots(pl.blockCode), 0)
                    return (
                      <div key={pageItem.id} className="mb-4">
                        <div className="sticky top-0 z-10 bg-white flex items-center gap-2 py-1.5 mb-2 border-b border-blue-200">
                          <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Page {pageIdx + 2}</span>
                          <span className="text-[11px] text-slate-500">{pageArticles.length} articles · {slotTotal}/{maxSlotsPerPage} slots</span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min(100, (slotTotal / maxSlotsPerPage) * 100)}%` }} />
                          </div>
                          <button onClick={() => { setActivePageId(pageItem.id); setSelectedPlacementId(null) }} className="text-[10px] text-blue-600 font-semibold hover:underline shrink-0">View →</button>
                        </div>
                        <div className="space-y-1.5">
                          {pageArticles.map((article) => {
                            const isSelected = selectedArticleId === article.id
                            const blockCode = resolveArticleBlockCode(article)
                            const meta = BLOCK_META[blockCode] || BLOCK_META['BLOCK-04A']
                            const imgs = Array.isArray(article.media) ? article.media.length : (article.featuredImageUrl ? 1 : 0)
                            return (
                              <button
                                key={article.id}
                                onClick={() => { setSelectedArticleId(article.id); setActivePageId(pageItem.id) }}
                                className={`w-full text-left rounded-lg border p-2 transition ${isSelected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                              >
                                {/* Width bar + block badge */}
                                <div className="flex items-center gap-1.5 mb-1">
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${meta.widthPct}%`, backgroundColor: meta.color }} />
                                  </div>
                                  <span className="text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded" style={{ color: meta.color, backgroundColor: meta.bg }}>{blockCode}</span>
                                </div>
                                {/* Title */}
                                <div className="text-[11px] font-semibold text-slate-900 line-clamp-1 leading-snug">{article.title}</div>
                                {/* Stats */}
                                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                                  <span>{meta.label}</span>
                                  <span>·</span>
                                  <span>{article.wordCount || 0}w</span>
                                  <span>·</span>
                                  <span>{imgs}img</span>
                                  <span>·</span>
                                  <span>{extractDistrict(article)}</span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}

                  {/* Unplaced articles */}
                  {(() => {
                    const q = articleSearch.trim().toLowerCase()
                    const unplaced = unplacedArticles.filter(a => !q || String(a.title || '').toLowerCase().includes(q) || extractDistrict(a).toLowerCase().includes(q))
                    if (!unplaced.length) return null
                    return (
                      <div className="mb-4">
                        <div className="sticky top-0 z-10 bg-white flex items-center gap-2 py-1.5 mb-2 border-b border-amber-200">
                          <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Unplaced</span>
                          <span className="text-[11px] text-slate-500">{unplaced.length} articles</span>
                        </div>
                        <div className="space-y-1.5">
                          {unplaced.map((article) => {
                            const isSelected = selectedArticleId === article.id
                            const blockCode = resolveArticleBlockCode(article)
                            const meta = BLOCK_META[blockCode] || BLOCK_META['BLOCK-04A']
                            const imgs = Array.isArray(article.media) ? article.media.length : (article.featuredImageUrl ? 1 : 0)
                            return (
                              <button
                                key={article.id}
                                onClick={() => setSelectedArticleId(article.id)}
                                className={`w-full text-left rounded-lg border p-2 transition ${isSelected ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                              >
                                <div className="flex items-center gap-1.5 mb-1">
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${meta.widthPct}%`, backgroundColor: meta.color }} />
                                  </div>
                                  <span className="text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded" style={{ color: meta.color, backgroundColor: meta.bg }}>{blockCode}</span>
                                </div>
                                <div className="text-[11px] font-semibold text-slate-900 line-clamp-1 leading-snug">{article.title}</div>
                                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                                  <span>{meta.label}</span>
                                  <span>·</span>
                                  <span>{article.wordCount || 0}w</span>
                                  <span>·</span>
                                  <span>{imgs}img</span>
                                  <span>·</span>
                                  <span>{extractDistrict(article)}</span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}

                  {!articles.length ? <div className="text-center py-8 text-xs text-slate-500">Tenant select చేసి Reload చేయండి</div> : null}
                </>
              ) : null}


            </div>
          </div>

          <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur px-3 py-2">
            <div className="grid grid-cols-5 gap-2">
              <button onClick={() => openMobileTab('canvas')} className={`py-2 rounded-lg text-[11px] font-semibold border ${mobilePanel === 'canvas' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-700'}`}>Canvas</button>
              <button onClick={() => openMobileTab('articles')} className={`py-2 rounded-lg text-[11px] font-semibold border ${mobilePanel === 'articles' && rightTab === 'articles' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-700'}`}>Articles</button>
              <button onClick={() => openMobileTab('editor')} className={`py-2 rounded-lg text-[11px] font-semibold border ${mobilePanel === 'articles' && rightTab === 'editor' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-700'}`}>Editor</button>
              <button onClick={() => openMobileTab('mapping')} className={`py-2 rounded-lg text-[11px] font-semibold border ${mobilePanel === 'articles' && rightTab === 'mapping' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-700'}`}>Mapping</button>
              <button onClick={() => openMobileTab('setup')} className="py-2 rounded-lg text-[11px] font-semibold border border-slate-300 text-slate-700">Setup</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
