import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
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
import ArticleBlockMainPageTop from '../../../components/epaper/ArticleBlockMainPageTop'
import { getMainStyle, getSubStyle, getMainStyleByKey, getSubStyleByKey } from '../../../components/epaper/HeaderStyles'
import { buildHeaderRenderSettings } from '../../../lib/epaper/buildHeaderRenderSettings'
import smartDesignApi from '../../../lib/api/services/smartDesignApi'
import {
  paperTypeToPreset,
  smartDesignPaperPreset,
  smartDesignEditionLabel,
  smartDesignToConfigEnvelope,
} from '../../../lib/epaper/smartDesignToWorkspace'
import {
  getMainHeaderStyleMeta,
  getSubHeaderStyleMeta,
  listMissingHeaderSettings,
  setHeaderStyleCatalogCache,
} from '../../../lib/epaper/headerStyleCatalog'
import { loadHeaderStyleCatalogClient } from '../../../lib/epaper/loadHeaderStyleCatalog'
import {
  apiPaperSpecToPageMeta,
  findPaperSpec,
  loadPaperPageSpecsClient,
} from '../../../lib/epaper/paperPageSpecs'
import {
  ACTIVE_BLOCK_CODES,
  coerceToActiveBlockCode,
} from '../../../lib/epaper/epaperActiveBlocks'
import {
  articleToBlockProps,
  articleToMainPageTopProps,
  getArticleContentSignals,
  peekArticleContentSignals,
  formatBlockSelectLabel,
} from '../../../lib/epaper/articleToBlockProps'
import { readAny } from '../../../lib/epaper/readAny'
import {
  getEpaperHeaderDimensions,
  resolvePageHeaderHeightCm,
  getHeaderNaturalPx,
  automationSpecToPageMeta,
} from '../../../lib/epaper/epaperHeaderDimensions'
import {
  resolveExportPageSpec,
  pdfExportPixelSize,
  pdfExportCanvasScale,
  PDF_EXPORT_DPI,
  IN_TO_CM,
} from '../../../lib/epaper/epaperPageSpec'
import InnerPageArticleGrid from '../../../components/epaper/InnerPageArticleGrid'
import {
  arrangePagesFromCollectNews,
  buildInchRowsFromArticles,
  placementsFromInchRows,
  normalizeCollectNewsArticles,
  rowWidthInForPreset,
  TARGET_ROWS_PER_INNER_PAGE,
  estimateBlockNativeHeight,
  computeCanvasBlockScale,
} from '../../../lib/epaper/collectNewsLayout'
import { buildLayoutPlan, computeCollectCapacity } from '../../../lib/epaper/epaperLayoutPlanner'
import { suggestArticleBlock, resolveArticleBlockCode as resolveBlockByContent } from '../../../lib/epaper/suggestArticleBlock'

/** Testing: call collect-news immediately (skip news-close-time gate on backend). */
const USE_COLLECT_NEWS_ON_LOAD = true
/** Legacy article APIs when collect-news disabled. */
const HEADERS_PREVIEW_ONLY = !USE_COLLECT_NEWS_ON_LOAD

const PAGE_PRESETS = {
  TABLOID: automationSpecToPageMeta('TABLOID'),
  BROADSHEET: automationSpecToPageMeta('BROADSHEET'),
  DIGITAL_PAPER: automationSpecToPageMeta('DIGITAL_PAPER'),
  BERLINER: automationSpecToPageMeta('BERLINER'),
}

const BLOCK_CODES = ACTIVE_BLOCK_CODES
const ALL_BLOCK_CODES = [
  'BLOCK-TOP8x7',
  'BLOCK-02A',
  'BLOCK-03A',
  'BLOCK-04A',
  'BLOCK-06A',
  'BLOCK-08A',
  'BLOCK-09A',
  'BLOCK-12A',
]
const BLOCK_CODE_SET = new Set(ALL_BLOCK_CODES)

// Maps block code → React component + native pixel width for scaled preview
const BLOCK_COMPONENT_MAP = {
  'BLOCK-TOP8x7': ArticleBlockMainPageTop,
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
  'BLOCK-TOP8x7': 672,
  'BLOCK-02A': 160,
  'BLOCK-03A': 220,
  'BLOCK-04A': 300,
  'BLOCK-06A': 340,
  'BLOCK-08A': 400,
  'BLOCK-09A': 400,
  'BLOCK-12A': 440,
}

// Native rendered width in px (at 96 DPI; 1mm = 3.7795px)
const BLOCK_NATIVE_WIDTH_PX = {
  'BLOCK-TOP8x7': 768,
  'BLOCK-02A': 192,
  'BLOCK-03A': 288,
  'BLOCK-04A': 384,
  'BLOCK-06A': 576,
  'BLOCK-08A': 720,
  'BLOCK-09A': 864,
  'BLOCK-12A': 1153,
}

// Physical newspaper block metadata — size in inches, columns, UI colour
const BLOCK_META = {
  'BLOCK-TOP8x7': { label: '8×7in · top', inches: 8, cols: 2, widthPct: 66, color: '#dc2626', bg: '#fee2e2', desc: 'Main page hero · title+PNG+2col' },
  'BLOCK-02A': { label: '2in · 1col', inches: 2, cols: 1, widthPct: 16, color: '#64748b', bg: '#f1f5f9', desc: 'Brief/short item' },
  'BLOCK-03A': { label: '3in · 1col Style1', inches: 3, cols: 1, widthPct: 24, color: '#0369a1', bg: '#e0f2fe', desc: 'Brief: dashed highlights, float photo, ~4in max height' },
  'BLOCK-04A': { label: '4in · 2col Style1', inches: 4, cols: 2, widthPct: 33, color: '#0284c7', bg: '#bae6fd', desc: 'Center title/sub, 2:1 photo, H&J body' },
  'BLOCK-06A': { label: '6in · 2col', inches: 6, cols: 2, widthPct: 50, color: '#7c3aed', bg: '#ede9fe', desc: 'Standard story' },
  'BLOCK-08A': { label: '7.5in · 3col', inches: 7.5, cols: 3, widthPct: 62, color: '#9333ea', bg: '#f3e8ff', desc: 'Long story · 3 col' },
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
/**
 * suggestBlock — assigns a block code based on article word count + image count.
 *
 * TIER LOGIC (matches user spec):
 *   SMALL  (< 80 words)  → 1-column blocks  (BLOCK-02A, BLOCK-03A)
 *   MEDIUM (80-220 words) → 2-column blocks (BLOCK-04A, BLOCK-06A)
 *   LARGE  (220-400 words)→ 3-column blocks (BLOCK-08A, BLOCK-09A)
 *   XLARGE (400+ words)  → 4-column lead    (BLOCK-12A)
 *
 * Images push the block UP one tier (needs more space for text+image).
 * Breaking/Featured always get the largest fitting block.
 */
function suggestBlock(article) {
  return suggestArticleBlock(article)
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

/** Estimate article column height at load time (desktop scale 24). */
function estimateArticleAreaPx(pageMeta, {
  layoutScale = 24,
  headerHeightCm = 4.2,
  extraSafeZoneCm = 0,
} = {}) {
  const canvasHeight = Math.round(pageMeta.heightCm * layoutScale)
  const safeTop = Math.round((pageMeta.marginsCm.top + extraSafeZoneCm) * layoutScale)
  const safeBottom = Math.round((pageMeta.marginsCm.bottom + extraSafeZoneCm) * layoutScale)
  const hdrPx = Math.round(headerHeightCm * layoutScale) + Math.round(8 * layoutScale / 24)
  const ftrPx = Math.round(pageMeta.footerHeightCm * layoutScale) + Math.round(14 * layoutScale / 24)
  return Math.max(120, canvasHeight - safeTop - safeBottom - hdrPx - ftrPx - 34)
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
    'designConfig.paperType',
    'designConfig.pageSize',
    'designConfig.pageType',
    'smartDesign.paperType',
    'smartDesign.pageSize',
    'paperType',
    'pageSize',
    'pageType',
    'size',
    'settings.paperType',
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
  const basePreset = PAGE_PRESETS[presetFromApi || currentPreset] || PAGE_PRESETS.BROADSHEET

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
        widthIn: round2(widthCm / IN_TO_CM),
        heightIn: round2(heightCm / IN_TO_CM),
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
  if (!BLOCK_CODE_SET.has(normalized)) return null
  return coerceToActiveBlockCode(normalized)
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
    if (normalized) return resolveBlockByContent(article, normalized)
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
    'designConfig.totalPages',
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
    lastPageFooterText: String(readAny(config, ['designConfig.lastPageFooterText', 'designConfig.footerText', 'lastPageFooterText', 'footerText', 'settings.lastPageFooterText', 'footer.lastPageFooterText'], '')),
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
    headerStyleNumber: Number(readAny(config, ['designConfig.headerStyleNumber', 'headerStyleNumber', 'config.headerStyleNumber'], 1)) || 1,
    subHeaderStyleNumber: Number(readAny(config, ['designConfig.subHeaderStyleNumber', 'subHeaderStyleNumber', 'config.subHeaderStyleNumber'], 1)) || 1,
    headerStyleKey: String(readAny(config, ['designConfig.headerStyleKey', 'headerStyleKey'], '')),
    subHeaderStyleKey: String(readAny(config, ['designConfig.subHeaderStyleKey', 'subHeaderStyleKey'], '')),
    subHeaderLogoUrl: String(readAny(config, ['designConfig.subHeaderLogoUrl', 'subHeaderLogoUrl'], '')),
    paperNameImageUrl: String(readAny(config, ['designConfig.paperNameImageUrl', 'paperNameImageUrl'], '')),
    mainHeaderImageUrl: String(readAny(config, ['designConfig.mainHeaderImageUrl', 'mainHeaderImageUrl'], '')),
    tagline: String(readAny(config, ['designConfig.tagline', 'tagline'], '')),
    websiteUrl: String(readAny(config, ['designConfig.websiteUrl', 'websiteUrl'], '')),
    runningCommentText: String(readAny(config, ['designConfig.runningCommentText', 'runningCommentText'], '')),
    runningCommentAuthor: String(readAny(config, ['designConfig.runningCommentAuthor', 'runningCommentAuthor'], '')),
    rightArticleTitle: String(readAny(config, ['designConfig.rightArticleTitle', 'rightArticleTitle'], '')),
    rightArticlePoints: String(readAny(config, ['designConfig.rightArticlePoints', 'rightArticlePoints'], '')),
    accentColor: String(readAny(config, ['designConfig.accentColor', 'accentColor'], '#dc2626')),
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

function buildEmptyPagesFromDesign(pageCount) {
  return buildPages(Math.max(1, Number(pageCount) || 1))
}

/** Scale header — exportMode uses CSS zoom (html2canvas-safe) instead of transform. */
function ScaledHeaderPreview({ kind, preset, slotWidthPx, slotHeightPx, Comp, compProps, exportMode = false }) {
  if (!Comp || slotWidthPx <= 0 || slotHeightPx <= 0) return null
  const { width: naturalW, height: naturalH } = getHeaderNaturalPx(preset, kind)
  const scale = Math.min(slotWidthPx / naturalW, slotHeightPx / naturalH)
  const innerStyle = exportMode
    ? {
        width: naturalW,
        height: naturalH,
        transformOrigin: 'top left',
        transform: 'none',
        zoom: scale,
      }
    : {
        width: naturalW,
        height: naturalH,
        transformOrigin: 'top left',
        transform: `scale(${scale})`,
      }
  return (
    <div
      data-epaper-header-slot
      style={{ width: slotWidthPx, height: slotHeightPx, overflow: 'hidden', background: '#fff' }}
    >
      <div
        data-epaper-header-inner
        data-scale={scale}
        data-natural-w={naturalW}
        data-natural-h={naturalH}
        style={innerStyle}
      >
        <Comp {...compProps} />
      </div>
    </div>
  )
}

/** Resolve header component + props for active page (shared by preview + export portal). */
function resolvePageHeaderNode({
  preset,
  pageIndex,
  headerRenderSettings,
  headerConfig,
  activeSmartDesign,
  headerStyleNum,
  subHeaderStyleNum,
  slotWidthPx,
  headerHeightPx,
  exportMode = false,
}) {
  const _pt = preset === 'BROADSHEET' ? 'broadsheet' : 'tabloid'
  const isMainPage = pageIndex === 0
  const _hs = isMainPage
    ? {
        ...headerRenderSettings,
        pageNumber: String(pageIndex + 1),
        price: headerRenderSettings.price || (headerConfig.paperSellCost ? `₹${headerConfig.paperSellCost}` : '₹5.00'),
      }
    : {
        ...headerRenderSettings,
        pageNumber: String(pageIndex + 1),
        price: headerRenderSettings.price || (headerConfig.paperSellCost ? `₹${headerConfig.paperSellCost}` : '₹5.00'),
        subHeaderLogoUrl: String(
          activeSmartDesign?.subHeaderLogoUrl ?? headerConfig.subHeaderLogoUrl ?? ''
        ).trim(),
        subHeaderImageUrl: String(
          activeSmartDesign?.subHeaderImageUrl ?? headerConfig.subHeaderImageUrl ?? ''
        ).trim(),
      }
  const headerKind = isMainPage ? 'main' : 'sub'
  let HeaderComp
  if (isMainPage) {
    const mainKey = activeSmartDesign?.headerStyleKey || headerConfig.headerStyleKey
    HeaderComp = mainKey ? getMainStyleByKey(mainKey) : getMainStyle(headerStyleNum)
  } else {
    const subKey = activeSmartDesign?.subHeaderStyleKey || headerConfig.subHeaderStyleKey
    HeaderComp = subKey ? getSubStyleByKey(subKey) : getSubStyle(subHeaderStyleNum)
  }
  return (
    <ScaledHeaderPreview
      kind={headerKind}
      preset={preset}
      slotWidthPx={slotWidthPx}
      slotHeightPx={headerHeightPx}
      Comp={HeaderComp}
      compProps={{ s: _hs, pt: _pt }}
      exportMode={exportMode}
    />
  )
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

/**
 * CanvasBlockPreview — renders the ACTUAL ArticleBlock component scaled to fit
 * the canvas cell. Same technique as the right-panel preview.
 * This guarantees the canvas looks identical to the final newspaper output.
 */
function CanvasBlockPreview({ placement, article, cellW, cellH, fillWidth = false }) {
  const blockCode  = placement.blockCode
  const Comp       = BLOCK_COMPONENT_MAP[blockCode]
  const nativeW    = BLOCK_NATIVE_WIDTH_PX[blockCode] || 384
  const estNativeH = article
    ? estimateBlockNativeHeight(blockCode, article)
    : (BLOCK_NATIVE_HEIGHT_PX[blockCode] || 400)
  const blockRef   = useRef(null)
  const [contentH, setContentH] = useState(estNativeH)
  const [sc, setSc] = useState(() =>
    fillWidth
      ? cellW / nativeW
      : computeCanvasBlockScale({ cellW, cellH, nativeW, contentH: estNativeH })
  )

  useLayoutEffect(() => {
    setContentH(estNativeH)
  }, [estNativeH])

  useLayoutEffect(() => {
    const block = blockRef.current
    const measuredH = block?.offsetHeight || block?.scrollHeight || estNativeH
    const measuredW = block?.offsetWidth || block?.scrollWidth || nativeW
    const nh = Math.max(estNativeH, measuredH)
    setContentH(nh)

    const nextSc = fillWidth
      ? cellW / nativeW
      : computeCanvasBlockScale({ cellW, cellH, nativeW: measuredW, contentH: nh })
    setSc(nextSc)

    if (!block || fillWidth) return

    let cancelled = false
    const remeasure = () => {
      if (cancelled || !blockRef.current) return
      const el = blockRef.current
      const mh = el.offsetHeight || el.scrollHeight || estNativeH
      const mw = el.offsetWidth || el.scrollWidth || nativeW
      setContentH((prev) => Math.max(prev, mh))
      setSc(
        fillWidth
          ? cellW / nativeW
          : computeCanvasBlockScale({ cellW, cellH, nativeW: mw, contentH: mh })
      )
    }

    remeasure()
    const t1 = requestAnimationFrame(remeasure)
    const t2 = setTimeout(remeasure, 180)
    const t3 = setTimeout(remeasure, 520)
    return () => {
      cancelled = true
      cancelAnimationFrame(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [cellW, cellH, nativeW, estNativeH, fillWidth, placement?.id, article?.id, blockCode])

  const blockProps = article
    ? blockCode === 'BLOCK-TOP8x7'
      ? articleToMainPageTopProps(article)
      : articleToBlockProps(article)
    : {
    title: placement.title || '', subtitle: '', category: 'general',
    dateline: placement.district || '', highlights: [], images: [], paragraphs: [],
  }

  if (!Comp) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#888' }}>
        {placement.title || blockCode}
      </div>
    )
  }

  return (
    <div style={{ width: cellW, height: cellH, overflow: 'hidden', position: 'relative', backgroundColor: '#fff', isolation: 'isolate' }}>
      <div
        data-epaper-block-inner
        data-scale={sc}
        data-natural-w={nativeW}
        data-natural-h={contentH}
        style={{
          transform: `scale(${sc})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
          width: nativeW,
          minHeight: contentH,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        <div ref={blockRef} style={{ width: '100%', minHeight: '100%' }}>
          <Comp {...blockProps} blockCode={blockCode} />
        </div>
      </div>
    </div>
  )
}

// ── Newspaper layout constants ───────────────────────────────────────────────
const MAX_EPAPER_PAGES = 8    // Hard cap: never exceed 8 pages
const MAX_ROWS_PER_PAGE = TARGET_ROWS_PER_INNER_PAGE   // ~4 rows fill inner page body

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

/**
 * Same greedy look-ahead packing as buildInchRows, but takes already-resolved
 * placement objects (which already have a .blockCode) instead of raw articles.
 * Preserves array order (add order / saved `position`) so the canvas matches manual design.
 */
function buildRowsFromPlacements(placements) {
  const items = placements.map(p => ({
    placement: p,
    inches: BLOCK_META[p.blockCode]?.inches || 4,
    used: false,
  }))

  const rows = []
  for (let i = 0; i < items.length; i++) {
    if (items[i].used) continue
    items[i].used = true

    const row     = [items[i].placement]
    let remaining = 12 - items[i].inches

    for (let j = i + 1; j < items.length && remaining > 0; j++) {
      if (!items[j].used && items[j].inches <= remaining) {
        row.push(items[j].placement)
        remaining -= items[j].inches
        items[j].used = true
      }
    }

    rows.push({ placements: row, totalInches: 12 - remaining })
  }
  return rows
}

// ── 4 + 8 column “daily” lane layout (12 relative units inside margins) ─────
//
// EDITORIAL LAYOUT REFERENCE (user-supplied Telugu daily clippings):
//   • Use ONLY story structure: headline hierarchy, image placement, multi-column
//     justified text, gutters, light rules between stacked stories.
//   • Do NOT copy page chrome: masthead logo, edition nameplate, footer URL,
//     date line, or “Page : N” metadata — those belong in header/footer components.
//   • Blocks (ArticleBlock*) render the article body; Design Studio composes them
//     into the 4/12 + 8/12 rails with a vertical spine + horizontal rules between items.
//

function getReporterKey(article) {
  if (!article) return 'unknown'
  const id =
    article.reporterId
    || article.authorId
    || article.userId
    || article.journalistId
    || article.createdBy?.id
    || article.author?.id
    || article.user?.id
  if (id) return `id:${String(id)}`
  const name = String(
    article.authorName
    || article.author?.name
    || article.reporterName
    || article.journalist?.name
    || article.user?.name
    || article.createdBy?.name
    || ''
  ).trim().toLowerCase()
  if (name) return `name:${name}`
  const aid = getArticleId(article)
  return aid ? `art:${aid}` : 'unknown'
}

/** Round-robin up to N picks per reporter, then append remaining unique articles. */
function collectReporterFairArticles(articles, maxPerReporter = 2) {
  const seen = new Set()
  const unique = []
  for (const a of articles || []) {
    const id = getArticleId(a) || a.id
    if (!id || seen.has(id)) continue
    seen.add(id)
    unique.push(a)
  }
  const byRep = new Map()
  for (const a of unique) {
    const k = getReporterKey(a)
    if (!byRep.has(k)) byRep.set(k, [])
    byRep.get(k).push(a)
  }
  const reps = [...byRep.values()]
  const out = []
  for (let round = 0; round < maxPerReporter; round++) {
    for (const arr of reps) {
      if (round < arr.length) out.push(arr[round])
    }
  }
  const used = new Set(out.map(a => getArticleId(a)))
  for (const a of unique) {
    if (!used.has(getArticleId(a))) out.push(a)
  }
  return out
}

function assignFourEightBlock(article) {
  const words = Number(article?.wordCount || 0)
  const imgCount = Array.isArray(article?.media)
    ? article.media.filter(m => !!(m?.url || m?.imageUrl || m?.src)).length
    : (article?.featuredImageUrl ? 1 : 0)
  const isLead = !!(article?.isBreaking || article?.breaking || article?.isFeatured || article?.featured
    || ['HIGH', 'URGENT', 'TOP'].includes(String(article?.priority || article?.importance || '').toUpperCase()))
  if (isLead && imgCount >= 1 && words >= 180) return { lane: 'right', blockCode: 'BLOCK-12A' }
  if (words >= 360 || (isLead && words >= 200)) return { lane: 'right', blockCode: 'BLOCK-12A' }
  if (words >= 180 || imgCount >= 1) return { lane: 'right', blockCode: 'BLOCK-08A' }
  return { lane: 'right', blockCode: 'BLOCK-06A' }
}

function partitionPlacementsFourEight(placements) {
  const left = []
  const right = []
  for (const p of placements || []) {
    if (p.layoutLane === 'left') {
      left.push(p)
      continue
    }
    if (p.layoutLane === 'right') {
      right.push(p)
      continue
    }
    const inches = BLOCK_META[p.blockCode]?.inches || 4
    if (inches <= 4) left.push(p)
    else right.push(p)
  }
  return { left, right }
}

function distributeLaneHeights(placements, totalH, minRow = 40) {
  if (!placements.length) return []
  const weights = placements.map(p => BLOCK_META[p.blockCode]?.inches || 4)
  const sumW = weights.reduce((a, b) => a + b, 0) || 1
  const out = weights.map(w => Math.max(minRow, Math.floor((w / sumW) * totalH)))
  let diff = totalH - out.reduce((a, b) => a + b, 0)
  let guard = 0
  while (diff !== 0 && guard < totalH + 200) {
    if (diff > 0) {
      let bi = 0
      for (let i = 1; i < out.length; i++) {
        if (out[i] < out[bi]) bi = i
      }
      out[bi] += 1
      diff -= 1
    } else {
      let bi = 0
      for (let i = 1; i < out.length; i++) {
        if (out[i] > out[bi]) bi = i
      }
      if (out[bi] <= minRow) break
      out[bi] -= 1
      diff += 1
    }
    guard += 1
  }
  return out
}

/** Slot-based pagination with 4+8 lane hints (layoutLane) + reporter-fair ordering. */
function paginateFourEightFromSecondPage(articles, initialPageCount, maxSlotsPerPage) {
  const ordered = collectReporterFairArticles(articles, 2)
  const initialCount = Math.min(MAX_EPAPER_PAGES, Math.max(2, Number(initialPageCount) || 2))
  const result = buildPages(initialCount)
  if (!ordered.length) return result.slice(0, MAX_EPAPER_PAGES)

  let pageIdx = 1
  let slotUsed = 0

  for (const article of ordered) {
    const { lane, blockCode } = assignFourEightBlock(article)
    const placement = { ...buildPlacement(article), blockCode, layoutLane: lane }
    const need = estimateSlots(placement.blockCode)
    if (pageIdx >= MAX_EPAPER_PAGES) break
    if (slotUsed + need > maxSlotsPerPage && (result[pageIdx]?.placements?.length || 0) > 0) {
      pageIdx += 1
      slotUsed = 0
    }
    if (pageIdx >= result.length) {
      if (result.length < MAX_EPAPER_PAGES) {
        result.push({ id: result.length + 1, placements: [] })
      } else {
        break
      }
    }
    result[pageIdx].placements.push(placement)
    slotUsed += need
  }

  return result.slice(0, MAX_EPAPER_PAGES)
}

function paginateFromSecondPage(articles, initialPageCount, _maxSlotsPerPage) {
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

  // ── Per-page layout promotion ─────────────────────────────────────────────
  // Every inner page gets a newspaper-style visual hierarchy:
  //   rank-1  article → BLOCK-12A  (full-width page lead)
  //   rank-2  article → BLOCK-09A  (secondary 9in/3col story)
  //   rank 3–4         → BLOCK-06A  (half-page standard stories)
  //   rank 5+          → word-count based (unchanged)
  //   bottom ~20%      → BLOCK-03A  (brief fillers that pair with 9in rows → 9+3=12)
  // This guarantees variety in block sizes so proportional row heights work.
  result.forEach((page, pageIdx) => {
    if (pageIdx === 0) return          // front page manages its own layout
    const ps = page.placements
    if (ps.length < 3) return          // too few articles to rebalance

    // rank by word count descending (proxy for importance)
    const ranked = [...ps].sort((a, b) => (b.wordCount || 0) - (a.wordCount || 0))
    const promote = new Map()

    promote.set(ranked[0].id, 'BLOCK-12A')
    if (ranked[1]) promote.set(ranked[1].id, 'BLOCK-08A')
    if (ranked[2]) promote.set(ranked[2].id, 'BLOCK-06A')
    if (ranked[3]) promote.set(ranked[3].id, 'BLOCK-06A')

    const nBrief = Math.max(1, Math.floor(ps.length * 0.2))
    ranked.slice(-nBrief).forEach(p => {
      if (!promote.has(p.id)) promote.set(p.id, 'BLOCK-04A')
    })

    const promoted = ps.map(p => {
      const newCode = promote.get(p.id)
      if (!newCode) return p
      return { ...p, blockCode: newCode }
    })
    // Sort by block-inches desc so the lead (BLOCK-12A) is always first,
    // allowing the canvas look-ahead packer to fill rows to 12in perfectly.
    promoted.sort(
      (a, b) => (BLOCK_META[b.blockCode]?.inches || 4) - (BLOCK_META[a.blockCode]?.inches || 4)
    )
    page.placements = promoted
  })

  return result.slice(0, MAX_EPAPER_PAGES)
}

export default function EPaperDesignPage() {
  const router = useRouter()
  const deepLinkTenantId = router.isReady ? String(router.query.tenantId || '').trim() : ''
  const deepLinkEditionId = router.isReady ? String(router.query.editionId || '').trim() : ''
  const deepLinkStartPage = router.isReady
    ? Math.max(0, Number(router.query.startPage || router.query.page || 0))
    : 0

  const [mobilePanel, setMobilePanel] = useState('canvas')
  const [rightTab, setRightTab] = useState('articles')
  const [showSetup, setShowSetup] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(1280)
  const [articleSearch, setArticleSearch] = useState('')
  const [showPayloadPreview, setShowPayloadPreview] = useState(false)

  const [tenantList, setTenantList] = useState([])
  const [tenantsLoading, setTenantsLoading] = useState(false)
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [showTenantPicker, setShowTenantPicker] = useState(!deepLinkTenantId)

  // Edition selector
  const [editionList, setEditionList] = useState([])
  const [selectedEditionId, setSelectedEditionId] = useState('')
  const [editionsLoading, setEditionsLoading] = useState(false)
  const [designScope, setDesignScope] = useState(null)
  const [workspaceReady, setWorkspaceReady] = useState(false)

  const [fromDate, setFromDate] = useState(todayYmd())
  const [status, setStatus] = useState('PUBLISHED')
  const [preset, setPreset] = useState('BROADSHEET')
  const [customPageMeta, setCustomPageMeta] = useState(null)
  const [pageSpecSource, setPageSpecSource] = useState('FALLBACK_LOCAL')
  const [extraSafeZoneCm, setExtraSafeZoneCm] = useState(0)

  const [headerConfig, setHeaderConfig] = useState(extractHeaderConfig(null))
  const [rawDesignConfig, setRawDesignConfig] = useState(null)
  const [activeSmartDesign, setActiveSmartDesign] = useState(null)
  const [headerStyleNum, setHeaderStyleNum]       = useState(1)  // main_style1-10
  const [subHeaderStyleNum, setSubHeaderStyleNum] = useState(1)  // sub_header_style1-10

  const [apiPaperSpecs, setApiPaperSpecs] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      loadHeaderStyleCatalogClient().catch(() => null),
      loadPaperPageSpecsClient().catch(() => null),
    ]).then(([catalog, specs]) => {
      if (cancelled) return
      if (catalog) setHeaderStyleCatalogCache(catalog)
      if (specs) setApiPaperSpecs(specs)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const item = findPaperSpec(apiPaperSpecs?.items, preset)
    if (!item) return
    setCustomPageMeta(apiPaperSpecToPageMeta(item))
    setPageSpecSource((prev) =>
      prev === 'API_SMART_DESIGN' || prev === 'API_PRESET' || prev === 'API_PRESET_MATCH'
        ? prev
        : 'API_PAPER_PAGE_SPECS'
    )
  }, [preset, apiPaperSpecs])
  const [templateMap, setTemplateMap] = useState(() =>
    Object.fromEntries(ACTIVE_BLOCK_CODES.map((code) => [code, '']))
  )

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
  const [collectNewsPayload, setCollectNewsPayload] = useState(null)
  const pageCanvasRef = useRef(null)
  const exportCanvasRef = useRef(null)
  const [exportingPdf, setExportingPdf] = useState(false)

  const pageMeta = customPageMeta || PAGE_PRESETS[preset]
  const headerDims = useMemo(() => getEpaperHeaderDimensions(preset), [preset])
  const gridMeta = getGridMetrics(pageMeta)
  const maxSlotsPerPage = getPageCapacity(pageMeta.columns >= 6 ? 'BROADSHEET' : 'TABLOID')
  const isMobile = viewportWidth < 768
  const mobileTargetWidth = Math.max(280, viewportWidth - 40)
  const mobileScale = Math.max(10, Math.min(18, mobileTargetWidth / pageMeta.widthCm))
  const screenScale = isMobile ? mobileScale : viewportWidth < 1024 ? 11 : 24
  const layoutScale = screenScale
  const exportDpiScale = useMemo(
    () => pdfExportCanvasScale(pageMeta, PDF_EXPORT_DPI) || screenScale,
    [pageMeta, screenScale]
  )
  const exportPx = useMemo(() => pdfExportPixelSize(pageMeta, PDF_EXPORT_DPI), [pageMeta])
  const canvasWidth = Math.round(pageMeta.widthCm * layoutScale)
  const canvasHeight = Math.round(pageMeta.heightCm * layoutScale)
  const safeLeftPx = Math.round((pageMeta.marginsCm.left + Number(extraSafeZoneCm || 0)) * layoutScale)
  const safeRightPx = Math.round((pageMeta.marginsCm.right + Number(extraSafeZoneCm || 0)) * layoutScale)
  const safeTopPx = Math.round((pageMeta.marginsCm.top + Number(extraSafeZoneCm || 0)) * layoutScale)
  const safeBottomPx = Math.round((pageMeta.marginsCm.bottom + Number(extraSafeZoneCm || 0)) * layoutScale)

  const activePage = useMemo(
    () => pages.find(item => item.id === activePageId) || pages[0],
    [pages, activePageId]
  )

  const activePageIndex = useMemo(
    () => pages.findIndex(item => item.id === activePageId),
    [pages, activePageId]
  )

  const activeHeaderHeightCm = useMemo(
    () =>
      resolvePageHeaderHeightCm({
        preset,
        pageIndex: Math.max(0, activePageIndex),
        design: activeSmartDesign,
        headerStyleKey: headerConfig.headerStyleKey || activeSmartDesign?.headerStyleKey,
        subHeaderStyleKey: headerConfig.subHeaderStyleKey || activeSmartDesign?.subHeaderStyleKey,
      }),
    [preset, activePageIndex, activeSmartDesign, headerConfig.headerStyleKey, headerConfig.subHeaderStyleKey]
  )
  const activeHeaderHeightPx = Math.round(activeHeaderHeightCm * layoutScale)
  const headerSlotWidthPx = Math.max(1, canvasWidth - safeLeftPx - safeRightPx)
  const lastPageFooterText = headerConfig.lastPageFooterText || activeSmartDesign?.lastPageFooterText || ''
  const isLastPage = activePageIndex === pages.length - 1
  const contentInnerHeightPx = Math.max(0, canvasHeight - safeTopPx - safeBottomPx)
  const headerBlockPx = activeHeaderHeightPx + Math.round(8 * layoutScale / 24)
  const footerBlockPx = isLastPage && lastPageFooterText
    ? Math.max(Math.round(28 * layoutScale / 24), Math.round(32 * layoutScale / 24))
    : Math.round(pageMeta.footerHeightCm * layoutScale) + Math.round(20 * layoutScale / 24)
  const articleSpacerPx = Math.max(0, contentInnerHeightPx - headerBlockPx - footerBlockPx)
  const footerSwatchPx = Math.max(8, Math.round(10 * layoutScale / 24))
  const footerLabelPx = Math.max(8, Math.round(10 * layoutScale / 24))

  const exCanvasWidth = exportPx.width
  const exCanvasHeight = exportPx.height
  const exSafeLeftPx = Math.round(pageMeta.marginsCm.left * exportDpiScale)
  const exSafeRightPx = Math.round(pageMeta.marginsCm.right * exportDpiScale)
  const exSafeTopPx = Math.round(pageMeta.marginsCm.top * exportDpiScale)
  const exSafeBottomPx = Math.round(pageMeta.marginsCm.bottom * exportDpiScale)
  const exHeaderHeightPx = Math.round(activeHeaderHeightCm * exportDpiScale)
  const exHeaderSlotWidthPx = Math.max(1, exCanvasWidth - exSafeLeftPx - exSafeRightPx)
  const exContentInnerHeightPx = Math.max(0, exCanvasHeight - exSafeTopPx - exSafeBottomPx)
  const exHeaderBlockPx = exHeaderHeightPx + Math.round(8 * exportDpiScale / 24)
  const exFooterBlockPx = isLastPage && lastPageFooterText
    ? Math.max(Math.round(28 * exportDpiScale / 24), Math.round(32 * exportDpiScale / 24))
    : Math.round(pageMeta.footerHeightCm * exportDpiScale) + Math.round(20 * exportDpiScale / 24)
  const exArticleSpacerPx = Math.max(0, exContentInnerHeightPx - exHeaderBlockPx - exFooterBlockPx)
  const exFooterSwatchPx = Math.max(8, Math.round(10 * exportDpiScale / 24))
  const exFooterLabelPx = Math.max(8, Math.round(10 * exportDpiScale / 24))

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
    if (activeSmartDesign?.today?.dayNameTelugu && useTeluguLabels) {
      return activeSmartDesign.today.dayNameTelugu
    }
    return useTeluguLabels
      ? issueDateObj.toLocaleDateString('te-IN', { weekday: 'long' })
      : formatIssueDayText(issueDateObj)
  }, [activeSmartDesign, issueDateObj, useTeluguLabels])
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
    if (activeSmartDesign?.today?.currentIssue != null) {
      return String(activeSmartDesign.today.currentIssue)
    }
    if (useTeluguLabels) {
      return String(headerConfig.issueStartNumber || resolvedIssueNumber)
    }
    return String(resolvedIssueNumber)
  }, [activeSmartDesign, useTeluguLabels, headerConfig.issueStartNumber, resolvedIssueNumber])
  const volumeMetaValue = useMemo(() => {
    if (activeSmartDesign?.today?.currentVolume != null) {
      return String(activeSmartDesign.today.currentVolume)
    }
    if (useTeluguLabels) {
      return String(headerConfig.startVolumeNumber || resolvedVolumeNumber)
    }
    return String(resolvedVolumeNumber)
  }, [activeSmartDesign, useTeluguLabels, headerConfig.startVolumeNumber, resolvedVolumeNumber])

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

  const mainStyleMeta = useMemo(() => getMainHeaderStyleMeta(headerStyleNum), [headerStyleNum])
  const subStyleMeta = useMemo(() => getSubHeaderStyleMeta(subHeaderStyleNum), [subHeaderStyleNum])

  const headerRenderSettings = useMemo(() => {
    const today = activeSmartDesign?.today
    const smartDateText = today?.issueDate
      ? (useTeluguLabels
          ? parseIssueDate(today.issueDate).toLocaleDateString('te-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : formatIssueDateText(parseIssueDate(today.issueDate)))
      : issueDateText
  return buildHeaderRenderSettings({
      config: rawDesignConfig,
      headerConfig,
      tenant: selectedTenant,
      pageNumber: String(activePageIndex + 1),
      issueDateText: smartDateText,
      volumeLabel: `సంపుటి ${volumeMetaValue}`,
      issueLabel: `సంచిక ${issueMetaValue}`,
      publishedAreasText: publishedFromText,
      accentColor: headerConfig.accentColor || '#dc2626',
    })
  }, [
    activeSmartDesign,
    rawDesignConfig,
    headerConfig,
    selectedTenant,
    activePageIndex,
    issueDateText,
    useTeluguLabels,
    volumeMetaValue,
    issueMetaValue,
    publishedFromText,
  ])

  const missingHeaderFields = useMemo(
    () =>
      listMissingHeaderSettings(
        {
          designConfig: {
            ...headerConfig,
            headerData: headerRenderSettings.paperName,
            headerLogoUrl: headerRenderSettings.headerLogoUrl,
            subHeaderLogoUrl: headerRenderSettings.subHeaderLogoUrl,
            publishedAreaText: headerRenderSettings.publishedAreas,
            issueDateText: headerRenderSettings.date,
            pageNumber: headerRenderSettings.pageNumber,
          },
        },
        { mainStyleNumber: headerStyleNum, subStyleNumber: subHeaderStyleNum }
      ),
    [headerConfig, headerRenderSettings, headerStyleNum, subHeaderStyleNum]
  )

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

  const editorPlacementArticle = useMemo(() => {
    if (selectedPlacement) {
      const aid = selectedPlacement.articleId || selectedPlacement.id
      return articles.find((a) => getArticleId(a) === aid) || null
    }
    return selectedArticle
  }, [selectedPlacement, selectedArticle, articles])

  const editorContentSignals = useMemo(
    () => (editorPlacementArticle ? getArticleContentSignals(editorPlacementArticle) : null),
    [editorPlacementArticle]
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
    if (!router.isReady) return
    const tid = String(router.query.tenantId || '').trim()
    const eid = String(router.query.editionId || '').trim()
    const issue = String(router.query.issueDate || '').trim()
    if (tid) {
      setSelectedTenantId(tid)
      setShowTenantPicker(false)
      if (typeof window !== 'undefined') window.localStorage.setItem(TENANT_STORAGE_KEY, tid)
    }
    if (eid) setSelectedEditionId(eid)
    if (issue && /^\d{4}-\d{2}-\d{2}$/.test(issue)) setFromDate(issue)
  }, [router.isReady, router.query.tenantId, router.query.editionId, router.query.issueDate])

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
          const urlTenantId = router.isReady ? String(router.query.tenantId || '').trim() : ''
          const savedTenantId = typeof window !== 'undefined'
            ? window.localStorage.getItem(TENANT_STORAGE_KEY)
            : ''
          const defaultTenantId =
            urlTenantId && items.some((item) => item.id === urlTenantId)
              ? urlTenantId
              : savedTenantId && items.some((item) => item.id === savedTenantId)
                ? savedTenantId
                : (items?.[0]?.id || '')

          if (defaultTenantId) {
            setSelectedTenantId((prev) => prev || defaultTenantId)
          }
          const urlEditionId = router.isReady ? String(router.query.editionId || '').trim() : ''
          if (urlEditionId) {
            setSelectedEditionId((prev) => prev || urlEditionId)
          }
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
        const resp = await smartDesignApi.getEditions(selectedTenantId)
        const items = resp?.editions || []
        if (!cancelled) {
          const list = Array.isArray(items) ? items : []
          setEditionList(list.map((ed) => ({
            id: ed.id,
            name: ed.name || ed.slug || ed.id,
            hasDesign: !!(ed.hasEditionDesign || ed.editionDesign),
          })))
          setSelectedEditionId((prev) =>
            prev && list.some((e) => e.id === prev) ? prev : list[0]?.id || ''
          )
          setWorkspaceReady(false)
          setDesignScope(null)
          setActiveSmartDesign(null)
        }
      } catch {
        /* fallback to legacy publication-editions */
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
            setEditionList(list.map((ed) => ({
              id: ed.id,
              name: ed.name || ed.slug || ed.id,
              hasDesign: false,
            })))
            setSelectedEditionId((prev) =>
              prev && list.some((e) => e.id === prev) ? prev : list[0]?.id || ''
            )
            setWorkspaceReady(false)
          }
        } catch { /* ignore */ }
      } finally {
        if (!cancelled) setEditionsLoading(false)
      }
    }
    loadEditions()
    return () => { cancelled = true }
  }, [selectedTenantId, router])

  const loadDesignByEdition = useCallback(async (opts = {}) => {
    const tenantId = opts.tenantId || selectedTenantId
    const editionId = opts.editionId || selectedEditionId
    if (!tenantId) {
      setError('Step 1: Select a tenant')
      return
    }
    if (!editionId) {
      setError('Step 2: Select an edition')
      return
    }

    setLoading(true)
    setError('')
    setInfo('')
    setPayloadPreview('')
    setLayoutSaved(false)
    setLayoutId(null)
    setWorkspaceReady(false)

    try {
      const token = getToken()?.token
      if (!token) {
        logout()
        router.push('/')
        return
      }

      const tenantRow = tenantList.find((t) => t.id === tenantId) || selectedTenant
      let loadedSmartDesign = null
      let smartDesignScopeLabel = ''

      const byEd = await smartDesignApi.getByEdition(tenantId, {
        publicationEditionId: editionId,
      })
      setDesignScope(byEd)

      if (byEd?.exists && byEd?.design) {
        loadedSmartDesign = byEd.design
      } else {
        setActiveSmartDesign(null)
        setDesignScope(byEd)
        setPages(buildPages(1))
        setArticles([])
        setError(
          byEd?.nextAction === 'CREATE'
            ? 'No layout saved for this edition yet. Set it up in Tenant → ePaper settings first.'
            : 'Layout not found for this edition.'
        )
        return
      }

      const envelope = smartDesignToConfigEnvelope(loadedSmartDesign, {
        tenantName: getTenantDisplayName(tenantRow),
      })
      setActiveSmartDesign(loadedSmartDesign)
      smartDesignScopeLabel = smartDesignEditionLabel(loadedSmartDesign)
      const presetFromPaper = smartDesignPaperPreset(loadedSmartDesign)
      if (presetFromPaper) setPreset(presetFromPaper)
      setHeaderStyleNum(Number(loadedSmartDesign.headerStyleNumber) || 1)
      setSubHeaderStyleNum(Number(loadedSmartDesign.subHeaderStyleNumber) || 1)
      setRawDesignConfig(envelope)
      setHeaderConfig(extractHeaderConfig(envelope))
      const issueYmd =
        loadedSmartDesign.today?.issueDate ||
        (loadedSmartDesign.issueStartDate ? String(loadedSmartDesign.issueStartDate).slice(0, 10) : '')
      if (issueYmd) setFromDate(issueYmd)

      let uniqueArticles = []
      let sourceLabel = ''
      let restoredPages = null
      let loadedCollectNews = null

      if (USE_COLLECT_NEWS_ON_LOAD) {
        const issueForNews = issueYmd || fromDate
        const skipNewsWindow =
          router.query?.skipNewsWindow === '1' ||
          router.query?.testing === '1' ||
          process.env.NEXT_PUBLIC_EPAPER_SKIP_NEWS_WINDOW === 'true'
        try {
          loadedCollectNews = await smartDesignApi.collectNews(tenantId, {
            publicationEditionId: editionId,
            issueDate: issueForNews,
            perPage: 50,
            excludeMainPage: true,
            allowCrossTenant: true,
            ...(skipNewsWindow ? { skipNewsWindow: 'true' } : {}),
          })
          uniqueArticles = normalizeCollectNewsArticles(loadedCollectNews)
          sourceLabel = 'collect-news'
          setCollectNewsPayload(loadedCollectNews)
        } catch (collectErr) {
          setCollectNewsPayload(null)
          throw new Error(collectErr?.message || 'Failed to load collect-news')
        }
      } else if (!HEADERS_PREVIEW_ONLY) {
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
      sourceLabel = 'smart sections'

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

      uniqueArticles = Array.from(
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
      }

      setArticles(uniqueArticles)
      setSelectedArticleId(uniqueArticles?.[0]?.id || null)

      let cfg = null
      try {
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

      if (cfgRes.ok) {
        cfg = cfgJson
      } else if (!loadedSmartDesign) {
        throw new Error(cfgJson?.error || cfgJson?.message || 'Failed to load design config')
      }
      } catch (cfgErr) {
        if (!loadedSmartDesign) throw cfgErr
      }

      const smartPaperPreset = loadedSmartDesign ? smartDesignPaperPreset(loadedSmartDesign) : null
      const effectivePreset = smartPaperPreset || preset
      if (effectivePreset !== preset) setPreset(effectivePreset)

      // Smart-design paper type wins — legacy /design-config often still says TABLOID.
      const cfgForPageSpec = smartPaperPreset
        ? {
            ...(cfg || {}),
            designConfig: {
              ...((cfg && cfg.designConfig) || {}),
              paperType: loadedSmartDesign.paperType || loadedSmartDesign.pageSize,
              pageSize: smartPaperPreset,
              pageType: smartPaperPreset,
            },
            smartDesign: loadedSmartDesign,
          }
        : (cfg || {})

      const resolvedSpec = resolvePageSpecFromConfig(cfgForPageSpec, effectivePreset)
      const finalPreset = smartPaperPreset || resolvedSpec.preset
      if (finalPreset !== preset) setPreset(finalPreset)
      setCustomPageMeta(smartPaperPreset ? null : resolvedSpec.customPageMeta)
      setPageSpecSource(
        smartPaperPreset
          ? 'API_SMART_DESIGN'
          : resolvedSpec.source
      )

      const nextHeader = loadedSmartDesign
        ? extractHeaderConfig(smartDesignToConfigEnvelope(loadedSmartDesign, { tenantName: getTenantDisplayName(tenantRow) }))
        : extractHeaderConfig(cfg)

      if (loadedSmartDesign) {
        const envelope = smartDesignToConfigEnvelope(loadedSmartDesign, { tenantName: getTenantDisplayName(tenantRow) })
        setRawDesignConfig({
          ...(cfg || {}),
          ...envelope,
          designConfig: {
            ...((cfg && cfg.designConfig) || {}),
            ...envelope.designConfig,
          },
        })
        setHeaderConfig(nextHeader)
      } else {
        setRawDesignConfig(cfg)
        setHeaderConfig(nextHeader)
        if (nextHeader.headerStyleNumber) setHeaderStyleNum(Number(nextHeader.headerStyleNumber))
        if (nextHeader.subHeaderStyleNumber) setSubHeaderStyleNum(Number(nextHeader.subHeaderStyleNumber))
      }

      // ── Try to restore a previously saved layout (articles mode only) ──
      if (!HEADERS_PREVIEW_ONLY) {
      try {
        const layoutParams = new URLSearchParams({ tenantId, issueDate: fromDate })
        if (selectedEditionId) layoutParams.set('editionId', selectedEditionId)
        const layoutRes = await fetch(`/api/admin/epaper/layout?${layoutParams.toString()}`, {
          headers: { accept: 'application/json', Authorization: `Bearer ${token}` },
        })
        if (layoutRes.ok) {
          const layoutJson = await layoutRes.json().catch(() => null)
          if (layoutJson?.found && Array.isArray(layoutJson?.pages) && layoutJson.pages.length) {
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
      } catch { /* ignore */ }
      }

      const editionLabel = smartDesignScopeLabel || loadedSmartDesign?.publicationEdition?.name || 'Edition'
      const pageCount =
        loadedSmartDesign?.totalPages ||
        nextHeader.numberOfPages ||
        loadedCollectNews?.capacity?.totalPages ||
        8

      const pageMetaForLoad = resolvedSpec.customPageMeta || PAGE_PRESETS[finalPreset] || PAGE_PRESETS.BROADSHEET
      const loadGrid = getGridMetrics(pageMetaForLoad)
      const loadScale = 24
      const loadHeaderCm = resolvePageHeaderHeightCm({
        preset: finalPreset,
        pageIndex: 1,
        design: loadedSmartDesign,
        headerStyleKey: nextHeader.headerStyleKey || loadedSmartDesign?.headerStyleKey,
        subHeaderStyleKey: nextHeader.subHeaderStyleKey || loadedSmartDesign?.subHeaderStyleKey,
      })
      const loadArticleAreaH = estimateArticleAreaPx(pageMetaForLoad, {
        layoutScale: loadScale,
        headerHeightCm: loadHeaderCm,
      })

      let nextPages
      if (HEADERS_PREVIEW_ONLY) {
        nextPages = buildEmptyPagesFromDesign(pageCount)
      } else if (USE_COLLECT_NEWS_ON_LOAD && loadedCollectNews) {
        const arranged = arrangePagesFromCollectNews(loadedCollectNews, {
          pageCount,
          preset: finalPreset,
          buildPlacementFn: buildPlacement,
          maxRowsPerPage: MAX_ROWS_PER_PAGE,
          articleAreaH: loadArticleAreaH,
          layoutScale: loadScale,
          totalRowWidthPx: Math.round(loadGrid.usableWidthCm * loadScale),
        })
        nextPages = arranged.pages
      } else {
        nextPages = restoredPages || paginateFourEightFromSecondPage(uniqueArticles, pageCount, maxSlotsPerPage)
      }
      setPages(nextPages)
      const startPage =
        deepLinkStartPage >= 2
          ? Math.min(deepLinkStartPage, pageCount)
          : 1
      setActivePageId(startPage)
      setSelectedPlacementId(null)
      setShowSetup(false)
      setWorkspaceReady(true)
      if (deepLinkStartPage >= 2 && !HEADERS_PREVIEW_ONLY) {
        setMobilePanel('canvas')
      }

      if (HEADERS_PREVIEW_ONLY) {
        setInfo('')
      } else if (!uniqueArticles.length) {
        setInfo(`No articles for ${fromDate}. Try another date or status.`)
      } else if (restoredPages) {
        setInfo(`${editionLabel} · ${uniqueArticles.length} articles · saved layout restored.`)
      } else if (sourceLabel === 'collect-news') {
        const collected = loadedCollectNews?.stats?.totalCollected ?? uniqueArticles.length
        const cap = computeCollectCapacity({
          totalPages: pageCount,
          perPage: loadedCollectNews?.capacity?.perPage ?? 12,
        })
        const plan = buildLayoutPlan(loadedCollectNews, { preset: finalPreset, pageCount })
        const rep = loadedCollectNews?.stats?.distinctReporters ?? 0
        const winNote = loadedCollectNews?.skipNewsWindow ? ' · testing window (full day)' : ''
        setInfo(
          `${editionLabel} · ${collected}/${cap.maxArticles} articles · ${rep} reporters · P2–${pageCount} ${plan.rowWidthIn}in rows (${plan.inchRowsTotal} rows)${winNote}. Click Fill All Pages to re-pack.`
        )
      } else {
        setInfo(`${editionLabel} · ${uniqueArticles.length} articles loaded.`)
      }
    } catch (e) {
      setError(e?.message || 'Failed to load design')
      setArticles([])
      setPages(buildPages(1))
      setActivePageId(1)
      setWorkspaceReady(false)
    } finally {
      setLoading(false)
    }
  }, [selectedTenantId, selectedEditionId, status, fromDate, preset, router, maxSlotsPerPage, tenantList, selectedTenant, headerStyleNum, subHeaderStyleNum, deepLinkStartPage])

  const loadWorkspace = loadDesignByEdition

  useEffect(() => {
    if (!selectedTenantId || !selectedEditionId || showTenantPicker) return
    loadDesignByEdition()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEditionId, selectedTenantId])

  const confirmTenantSelection = () => {
    if (!selectedTenantId) {
      setError('Select a tenant first')
      return
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TENANT_STORAGE_KEY, selectedTenantId)
    }
    setWorkspaceReady(false)
    setDesignScope(null)
    setActiveSmartDesign(null)
    setPages(buildPages(1))
    setShowTenantPicker(false)
    setInfo('Tenant selected. Now pick an edition.')
    setError('')
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

    const rowWidthIn = rowWidthInForPreset(preset)
    const initialCnt = Math.min(MAX_EPAPER_PAGES, Math.max(2, headerConfig.numberOfPages))
    const arrangedPages = buildPages(initialCnt)

    if (preset === 'BROADSHEET' && rowWidthIn === 12) {
      const inchRows = buildInchRowsFromArticles(uniqueOrdered, rowWidthIn, {
        fullArticlesOnly: true,
      })
      let pageIndex = 1
      let rowIdx = 0
      while (rowIdx < inchRows.length && pageIndex < initialCnt) {
        const pageRows = inchRows.slice(rowIdx, rowIdx + MAX_ROWS_PER_PAGE)
        arrangedPages[pageIndex].placements = placementsFromInchRows(pageRows, buildPlacement)
        rowIdx += pageRows.length
        pageIndex += 1
      }
    } else {
      let pageIndex = 1
      let queue = uniqueOrdered
      while (queue.length && pageIndex < MAX_EPAPER_PAGES) {
        if (pageIndex >= arrangedPages.length) {
          if (arrangedPages.length < MAX_EPAPER_PAGES) {
            arrangedPages.push({ id: arrangedPages.length + 1, placements: [] })
          } else break
        }
        const inchRows = buildInchRowsFromArticles(queue, rowWidthIn)
        if (!inchRows.length) break
        const pageRows = inchRows.slice(0, MAX_ROWS_PER_PAGE)
        arrangedPages[pageIndex].placements = placementsFromInchRows(pageRows, buildPlacement)
        const used = pageRows.reduce((n, r) => n + r.length, 0)
        queue = queue.slice(used)
        pageIndex += 1
      }
    }

    const finalPages = arrangedPages.slice(0, MAX_EPAPER_PAGES)
    setPages(finalPages)
    setActivePageId(finalPages[1]?.id || finalPages[0]?.id || 1)
    setSelectedPlacementId(null)
    setInfo(`District-wise arranged ${uniqueOrdered.length} articles into ${finalPages.length} pages (max ${MAX_EPAPER_PAGES})`)
  }

  const autoPaginateAll = () => {
    const rowWidthIn = rowWidthInForPreset(preset)
    const totalWidthPx = Math.round(gridMeta.usableWidthCm * layoutScale)
    const hdrPx = activeHeaderHeightPx + Math.round(8 * layoutScale / 24)
    const ftrPx = Math.round(pageMeta.footerHeightCm * layoutScale) + Math.round(14 * layoutScale / 24)
    const articleAreaH = Math.max(
      120,
      canvasHeight - safeTopPx - safeBottomPx - hdrPx - ftrPx - 34
    )

    const pageCount = headerConfig.numberOfPages || pages.length
    const { pages: arranged } = arrangePagesFromCollectNews(
      collectNewsPayload || { articles },
      {
        pageCount,
        preset,
        buildPlacementFn: buildPlacement,
        maxRowsPerPage: MAX_ROWS_PER_PAGE,
        articleAreaH,
        layoutScale,
        totalRowWidthPx: totalWidthPx,
      }
    )
    const plan = buildLayoutPlan(collectNewsPayload || { articles }, { preset, pageCount })
    const sample = plan.samplePages?.[0]?.rows?.map((r) => r.pattern).join(' | ') || plan.rowTemplatesPreferred.join(', ')

    setPages(arranged)
    setActivePageId(arranged[1]?.id || arranged[0]?.id || 1)
    setSelectedPlacementId(null)
    setInfo(
      `Filled P2–${arranged.length}: ${articles.length} stories · ${plan.rowWidthIn}in rows · patterns: ${sample}`
    )
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

  const exportAllPagesPdf = async (colorMode) => {
    if (typeof window === 'undefined') return
    if (!pageCanvasRef.current || !workspaceReady || exportingPdf) return
    flushSync(() => setExportingPdf(true))
    setError('')
    setInfo('')
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    const origPageId = activePageId
    const pageSpec = resolveExportPageSpec(preset, pageMeta, PDF_EXPORT_DPI)
    try {
      const {
        captureNodeToPng,
        createExportPdfDoc,
        appendPngPageToPdf,
        finalizeExportPdf,
        downloadPdfBytes,
        exportFilename,
        waitForExportRef,
        waitForExportCanvas,
        preloadExportImages,
        yieldToMainThread,
      } = await import('../../../lib/epaper/exportEpaperPdf')
      const exportEl = await waitForExportRef(exportCanvasRef)
      await waitForExportCanvas(
        exportEl,
        pageSpec.pixelSize.width,
        pageSpec.pixelSize.height
      )
      const editionLabel =
        activeSmartDesign?.publicationEdition?.name ||
        smartDesignEditionLabel(activeSmartDesign) ||
        'epaper'
      const pdfDoc = await createExportPdfDoc(
        { ...pageSpec, label: editionLabel },
        colorMode,
        editionLabel
      )
      for (let i = 0; i < pages.length; i += 1) {
        const pageItem = pages[i]
        setInfo(`Exporting page ${i + 1}/${pages.length} · ${pageSpec.widthIn}×${pageSpec.heightIn} in · ${PDF_EXPORT_DPI} DPI ${colorMode}…`)
        flushSync(() => setActivePageId(pageItem.id))
        await yieldToMainThread(80)
        await waitForExportCanvas(
          exportEl,
          pageSpec.pixelSize.width,
          pageSpec.pixelSize.height
        )
        await preloadExportImages(exportEl)
        const png = await captureNodeToPng(exportEl, colorMode, pageSpec)
        await appendPngPageToPdf(pdfDoc, png, pageSpec)
        await yieldToMainThread(150)
      }
      setInfo('Building PDF file…')
      const bytes = await finalizeExportPdf(pdfDoc)
      downloadPdfBytes(bytes, exportFilename(editionLabel, colorMode, PDF_EXPORT_DPI))
      setInfo(`Exported ${pages.length} pages · ${pageSpec.widthIn}×${pageSpec.heightIn} in · ${PDF_EXPORT_DPI} DPI · ${colorMode}`)
    } catch (e) {
      setError(e?.message || 'PDF export failed')
    } finally {
      flushSync(() => setActivePageId(origPageId))
      setExportingPdf(false)
    }
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
      setInfo(`Layout saved · ${pages.length} pages · ${payload.pages.reduce((s, p) => s + p.placements.length, 0)} articles`)
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

          {/* ── Setup flow: Tenant → Edition → Load ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 sm:px-5 py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">Epaper Design Studio</h1>
                  <p className="text-[11px] text-slate-400 mt-0.5">Select tenant, pick edition, load layout</p>
                  </div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                  {[
                    { n: 1, label: 'Tenant', done: !!selectedTenantId },
                    { n: 2, label: 'Edition', done: !!selectedEditionId },
                    { n: 3, label: 'Load', done: workspaceReady },
                  ].map(({ n, label, done }, i) => (
                    <React.Fragment key={n}>
                      {i > 0 ? <span className="text-slate-600 mx-0.5">→</span> : null}
                      <span className={`px-2.5 py-1 rounded-full border ${
                        done ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200' : 'bg-white/5 border-white/10 text-slate-400'
                      }`}>
                        {n}. {label}{done ? ' ✓' : ''}
                      </span>
                    </React.Fragment>
                  ))}
                  </div>
                </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                {/* Step 1 — Tenant */}
                <div className="lg:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    1. Tenant
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedTenantId}
                      onChange={(e) => {
                        setSelectedTenantId(e.target.value)
                        setSelectedEditionId('')
                        setWorkspaceReady(false)
                        setDesignScope(null)
                        setActiveSmartDesign(null)
                        setPages(buildPages(1))
                      }}
                      disabled={tenantsLoading}
                      className="flex-1 min-w-0 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{tenantsLoading ? 'Loading tenants…' : 'Select tenant…'}</option>
                      {tenantList.map((item) => (
                        <option key={item.id} value={item.id}>{getTenantDisplayName(item)}</option>
                      ))}
                    </select>
                <button
                      type="button"
                  onClick={() => setShowTenantPicker(true)}
                      className="shrink-0 px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      title="Browse tenants"
                >
                      Browse
                </button>
                  </div>
              </div>

                {/* Step 2 — Edition */}
                <div className="lg:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    2. Edition
                  </label>
                  <select
                    value={selectedEditionId}
                    onChange={(e) => {
                      setSelectedEditionId(e.target.value)
                      setLayoutSaved(false)
                      setWorkspaceReady(false)
                    }}
                    disabled={!selectedTenantId || editionsLoading}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {!selectedTenantId ? (
                      <option value="">Select tenant first</option>
                    ) : editionsLoading ? (
                      <option value="">Loading editions…</option>
                    ) : !editionList.length ? (
                      <option value="">No editions — create in tenant admin</option>
                    ) : (
                      editionList.map((ed) => (
                        <option key={ed.id} value={ed.id}>
                          {ed.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Step 3 — Load */}
                <div className="lg:col-span-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => loadDesignByEdition()}
                    disabled={loading || !selectedTenantId || !selectedEditionId}
                    className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {loading ? 'Loading…' : 'Load Design'}
                  </button>
                  <button
                    type="button"
                    onClick={saveLayout}
                    disabled={saving || !workspaceReady || !pages.length}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 ${
                      layoutSaved ? 'bg-emerald-600 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {saving ? 'Saving…' : layoutSaved ? 'Saved ✓' : 'Save Layout'}
                  </button>
                </div>
              </div>

              {/* Publish date + status — secondary row */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
                <div>
                  <div className="text-[10px] text-slate-500 mb-1">Publish date</div>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => { setFromDate(e.target.value); setLayoutSaved(false) }}
                    className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-white"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 mb-1">Articles status</div>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-white"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowSetup((p) => !p)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    {showSetup ? 'Hide advanced' : 'Advanced'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const q = selectedTenantId ? `?tenantId=${encodeURIComponent(selectedTenantId)}` : ''
                      window.open(`/admin/epaper/header-style1-preview${q}`, '_blank')
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Preview
                  </button>
                </div>
                </div>
              </div>

            {/* Design summary from API */}
            {activeSmartDesign && workspaceReady ? (
              <div className="px-4 sm:px-5 pb-4">
                <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-3 sm:p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                      <div className="text-sm font-bold text-emerald-900">
                        {activeSmartDesign.publicationEdition?.name || editionList.find((e) => e.id === selectedEditionId)?.name || 'Edition'}
                  </div>
                      <div className="text-xs text-emerald-700 mt-0.5">
                        {getTenantDisplayName(selectedTenant)} · {activeSmartDesign.paperType || pageMeta.label}
                </div>
              </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { k: 'Pages', v: activeSmartDesign.totalPages ?? pages.length },
                        { k: 'Price', v: activeSmartDesign.paperSellCost != null ? `₹${activeSmartDesign.paperSellCost}` : '—' },
                        { k: 'Volume', v: activeSmartDesign.today?.currentVolume ?? '—' },
                        { k: 'Issue', v: activeSmartDesign.today?.currentIssue ?? '—' },
                      ].map(({ k, v }) => (
                        <div key={k} className="px-2.5 py-1 rounded-lg bg-white/70 border border-emerald-100 text-center min-w-[56px]">
                          <div className="text-[9px] text-emerald-600 uppercase">{k}</div>
                          <div className="text-xs font-bold text-slate-900">{v}</div>
                  </div>
                ))}
              </div>
              </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg bg-white/60 px-3 py-2 border border-emerald-100">
                      <span className="font-bold text-slate-700">Page 1 header:</span>{' '}
                      {mainStyleMeta.name}
                      {activeSmartDesign.styleCapabilities?.mainHeader?.nameTe
                        ? ` · ${activeSmartDesign.styleCapabilities.mainHeader.nameTe}` : ''}
                      <span className="block text-[10px] text-slate-500 mt-0.5">{headerDims.mainLabel}</span>
            </div>
                    <div className="rounded-lg bg-white/60 px-3 py-2 border border-emerald-100">
                      <span className="font-bold text-slate-700">Inner pages header:</span>{' '}
                      {subStyleMeta.name}
                      {activeSmartDesign.styleCapabilities?.subHeader?.nameTe
                        ? ` · ${activeSmartDesign.styleCapabilities.subHeader.nameTe}` : ''}
                      <span className="block text-[10px] text-slate-500 mt-0.5">{headerDims.subLabel}</span>
          </div>
                  </div>
                  <div className="mt-2 text-[10px] text-emerald-800/80">
                    Canvas {pageMeta.widthIn} × {pageMeta.heightIn} in · margin {pageMeta.marginIn} in · {pageMeta.columns}-col · footer {pageMeta.footerOffsetIn} in from bottom
                  </div>
                  {activeSmartDesign.publishedAreaText ? (
                    <div className="mt-2 text-[11px] text-slate-600">
                      <span className="font-semibold">{activeSmartDesign.publishedAreaText}</span>
                      {activeSmartDesign.lastPageFooterText ? (
                        <span className="ml-3 text-slate-500">· {activeSmartDesign.lastPageFooterText}</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : selectedTenantId && selectedEditionId && !loading && !workspaceReady ? (
              <div className="px-4 sm:px-5 pb-4">
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
                  Edition selected — click <strong>Load Design</strong> or wait for auto-load.
                </div>
              </div>
                  ) : null}
                </div>

          {showTenantPicker ? (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <div className="text-base font-bold text-slate-900">Choose tenant</div>
                  <div className="text-xs text-slate-500 mt-1">Step 1 — then pick edition and load design.</div>
                </div>
                <div className="p-4 max-h-[50vh] overflow-auto divide-y divide-slate-100">
                  {tenantList.map((item) => {
                      const active = selectedTenantId === item.id
                      const brandLogo = getTenantBrandLogo(item)
                      return (
                        <button
                          key={item.id}
                        type="button"
                          onClick={() => setSelectedTenantId(item.id)}
                        className={`w-full text-left px-3 py-3 flex items-center gap-3 transition ${active ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                        >
                            {brandLogo ? (
                          <Image src={brandLogo} alt="" width={36} height={36} className="h-9 w-9 rounded-lg object-cover border" unoptimized />
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                            {getTenantDisplayName(item).charAt(0)}
                          </div>
                        )}
                        <span className="text-sm font-semibold text-slate-900">{getTenantDisplayName(item)}</span>
                        {active ? <span className="ml-auto text-xs font-bold text-blue-600">Selected</span> : null}
                        </button>
                      )
                    })}
                    {!tenantList.length ? (
                    <div className="py-8 text-center text-sm text-slate-500">{tenantsLoading ? 'Loading…' : 'No tenants'}</div>
                    ) : null}
                  </div>
                <div className="px-4 py-3 border-t border-slate-100 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowTenantPicker(false)} className="px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-slate-50">Cancel</button>
                    <button
                    type="button"
                    onClick={confirmTenantSelection}
                    disabled={!selectedTenantId}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                  >
                    Continue
                    </button>
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
                    <option value="TABLOID">Tabloid (11 × 17 in)</option>
                    <option value="BROADSHEET">Broadsheet (15 × 22.75 in)</option>
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
                  <div className="text-slate-600 mt-1">{pageMeta.label} · {pageMeta.widthIn}×{pageMeta.heightIn} in</div>
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
                  <div className="text-slate-600 mt-1">{pageMeta.columns} cols · gutter {pageMeta.gutterIn} in · full banner {pageMeta.columns} col</div>
                </div>
                <div className="border rounded-lg p-2 bg-slate-50">
                  <div className="font-semibold text-slate-700">Session</div>
                  <div className="text-slate-600 mt-1">Articles {articles.length} · Pages {pages.length} · Active {activePlacements.length}</div>
                </div>
              </div>
          </div>
          ) : null}

          {error ? <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div> : null}
          {info && !error && !workspaceReady ? <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">{info}</div> : null}

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
            <div className={`${isMobile ? 'bg-transparent border-0 shadow-none p-0' : 'bg-white rounded-xl border border-slate-200 shadow-sm p-4'} overflow-auto ${mobilePanel !== 'canvas' ? 'hidden xl:block' : ''}`}>
              {!workspaceReady && !loading ? (
                <div className="flex flex-col items-center justify-center min-h-[480px] sm:min-h-[620px] text-center px-6 py-12">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mb-4">📰</div>
                  <h2 className="text-lg font-bold text-slate-800">Start with tenant & edition</h2>
                  <p className="text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">
                    Select a tenant, choose an edition, then click <strong>Load Design</strong>.
                  </p>
                  <ol className="mt-6 text-left text-sm text-slate-600 space-y-2 max-w-xs">
                    <li className={`flex items-center gap-2 ${selectedTenantId ? 'text-emerald-700 font-semibold' : ''}`}>
                      <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">1</span>
                      Select tenant
                    </li>
                    <li className={`flex items-center gap-2 ${selectedEditionId ? 'text-emerald-700 font-semibold' : ''}`}>
                      <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">2</span>
                      Pick edition
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                      Load design
                    </li>
                  </ol>
                  {selectedTenantId && selectedEditionId ? (
                    <button
                      type="button"
                      onClick={() => loadDesignByEdition()}
                      className="mt-6 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
                    >
                      Load Design now
                    </button>
                  ) : null}
                </div>
              ) : (
              <>
              {!isMobile ? (
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">Newspaper Canvas</div>
                  <div className="text-[11px] text-slate-500">
                    {pageMeta.label} · {pageMeta.widthIn} × {pageMeta.heightIn} in ({pageMeta.widthCm} × {pageMeta.heightCm} cm)
                    · {pageMeta.columns} cols · gutter {pageMeta.gutterIn} in
                  </div>
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
                {workspaceReady ? (
                  <>
                    <div className="w-px h-4 bg-slate-300" />
                    <button
                      type="button"
                      onClick={() => exportAllPagesPdf('RGB')}
                      disabled={exportingPdf}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-semibold hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {exportingPdf ? 'Exporting…' : `Export PDF RGB (${pages.length})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => exportAllPagesPdf('CMYK')}
                      disabled={exportingPdf}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-[11px] font-semibold hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {exportingPdf ? 'Exporting…' : `Export PDF CMYK (${pages.length})`}
                    </button>
                  </>
                ) : null}
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
                      <button
                      key={pageItem.id}
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
                  )
                })}
              </div>
              ) : null}

              <div
                className={`${isMobile ? 'bg-slate-200 rounded-none p-0' : 'bg-[#1e1e22] rounded-xl p-3 sm:p-4 xl:p-6'} min-h-[460px] sm:min-h-[620px] xl:min-h-[790px] flex items-start justify-center overflow-auto`}
                style={isMobile ? { minHeight: 'calc(100vh - 160px)' } : undefined}
              >
                <div
                  ref={pageCanvasRef}
                  data-epaper-page-canvas
                  className={`bg-white relative ${isMobile ? 'shadow-md border border-slate-300' : 'shadow-[0_8px_40px_rgba(0,0,0,0.55)] border border-slate-400/60'}`}
                  style={{
                    width: `${canvasWidth}px`,
                    height: `${canvasHeight}px`,
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                  }}
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
                  <div
                    data-epaper-page-column
                    style={{
                      paddingTop: `${safeTopPx}px`,
                      paddingRight: `${safeRightPx}px`,
                      paddingBottom: `${safeBottomPx}px`,
                      paddingLeft: `${safeLeftPx}px`,
                      height: `${canvasHeight}px`,
                      boxSizing: 'border-box',
                    }}
                    className="flex flex-col h-full"
                  >
                    <div
                      className="border-b shrink-0"
                      style={{
                        height: `${activeHeaderHeightPx}px`,
                        marginBottom: `${Math.round(8 * layoutScale / 24)}px`,
                      }}
                    >
                      {resolvePageHeaderNode({
                        preset,
                        pageIndex: activePageIndex,
                        headerRenderSettings,
                        headerConfig,
                        activeSmartDesign,
                        headerStyleNum,
                        subHeaderStyleNum,
                        slotWidthPx: headerSlotWidthPx,
                        headerHeightPx: activeHeaderHeightPx,
                        exportMode: false,
                      })}
                    </div>

                    {/* Main masthead (style 1+) already includes info/meta strip — no duplicate bar below */}

                    <div className="flex-1 flex flex-col min-h-0 mx-1">
                      {HEADERS_PREVIEW_ONLY ? (
                        <div className="flex flex-col items-center justify-center flex-1 py-12 gap-2 text-center bg-slate-50/80 rounded border border-dashed border-slate-200">
                          <div className="text-[11px] font-semibold text-slate-600">Article area</div>
                          <div className="text-[10px] text-slate-400 max-w-xs">
                            Headers loaded. Switch pages above to preview each page header.
                          </div>
                        </div>
                      ) : activePageIndex === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 py-12 gap-2 text-center bg-slate-50/80 rounded border border-dashed border-slate-200">
                          <div className="text-[11px] font-semibold text-slate-600">Main page (P1)</div>
                          <div className="text-[10px] text-slate-400 max-w-xs">
                            Hero / top block goes here. Inner news starts from page 2 (collect-news).
                          </div>
                        </div>
                      ) : activePlacements.length ? (() => {
                        const totalWidthPx = Math.round(gridMeta.usableWidthCm * layoutScale)
                        const hdrPx = activeHeaderHeightPx + Math.round(8 * layoutScale / 24)
                        const ftrPx = Math.round(pageMeta.footerHeightCm * layoutScale) + Math.round(14 * layoutScale / 24)
                        const articleAreaH = Math.max(
                          120,
                          canvasHeight - safeTopPx - safeBottomPx - hdrPx - ftrPx - 8
                        )
                        const rowWidthIn = rowWidthInForPreset(preset)

                        if (USE_COLLECT_NEWS_ON_LOAD) {
                          return (
                            <InnerPageArticleGrid
                              placements={activePlacements}
                              articles={articles}
                              articleAreaH={articleAreaH}
                              totalWidthPx={totalWidthPx}
                              layoutScale={layoutScale}
                              rowWidthIn={rowWidthIn}
                              preset={preset}
                              selectedPlacementId={selectedPlacementId}
                              onSelectPlacement={setSelectedPlacementId}
                              onRemovePlacement={removePlacement}
                              CanvasBlockPreview={CanvasBlockPreview}
                              BLOCK_META={BLOCK_META}
                            />
                          )
                        }

                        const { left, right } = partitionPlacementsFourEight(activePlacements)
                        const dividerPx = 1
                        const wLeft = Math.max(72, Math.floor((totalWidthPx - dividerPx) * (4 / 12)))
                        const wRight = Math.max(100, totalWidthPx - dividerPx - wLeft)
                        const hLeftArr = distributeLaneHeights(left, articleAreaH)
                        const hRightArr = distributeLaneHeights(right, articleAreaH)
                        const laneRule = '1px solid rgba(203, 213, 225, 0.95)'

                        const renderLane = (laneList, wPx, hArr, ariaLabel) => (
                          <div
                            role="region"
                            aria-label={ariaLabel}
                            style={{
                              width: wPx,
                              height: articleAreaH,
                              flexShrink: 0,
                              display: 'flex',
                              flexDirection: 'column',
                              overflow: 'hidden',
                              backgroundColor: '#f8fafc',
                            }}
                          >
                            {!laneList.length ? (
                              <div style={{ flex: 1, margin: 3, border: '1px dashed #cbd5e1', borderRadius: 4, background: '#fff' }} />
                            ) : laneList.map((placement, i) => {
                              const cellH = hArr[i] ?? 48
                              const article = articles.find(a => a.id === placement.articleId)
                                    const isActive = selectedPlacementId === placement.id
                                    return (
                                      <div
                                        key={placement.id}
                                        style={{
                                    height: cellH,
                                    flexShrink: 0,
                                    boxSizing: 'border-box',
                                    borderBottom: laneRule,
                                          position: 'relative',
                                          cursor: 'pointer',
                                    outline: isActive ? '2px solid #3b82f6' : 'none',
                                          overflow: 'hidden',
                                          backgroundColor: '#fff',
                                        }}
                                        onClick={() => setSelectedPlacementId(placement.id)}
                                      >
                                        <CanvasBlockPreview
                                          placement={placement}
                                          article={article}
                                    cellW={wPx}
                                    cellH={cellH}
                                        />
                                        <button
                                    type="button"
                                          style={{ position: 'absolute', top: 3, right: 3, zIndex: 10, background: 'rgba(239,68,68,0.85)', color: '#fff', border: 'none', borderRadius: 3, fontSize: 9, padding: '2px 5px', cursor: 'pointer', lineHeight: 1.4, fontWeight: 700, pointerEvents: 'auto' }}
                                          onClick={(e) => { e.stopPropagation(); removePlacement(placement.id) }}
                                        >✕</button>
                                      </div>
                                    )
                                  })}
                                </div>
                              )

                        return (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'stretch',
                              width: '100%',
                              height: articleAreaH,
                              overflow: 'hidden',
                            }}
                          >
                            {renderLane(left, wLeft, hLeftArr, 'Brief rail four columns')}
                            <div
                              style={{
                                width: dividerPx,
                                flexShrink: 0,
                                background: 'rgba(148, 163, 184, 0.65)',
                                margin: '2px 0',
                                borderRadius: 1,
                              }}
                              aria-hidden
                            />
                            {renderLane(right, wRight, hRightArr, 'Main stories eight columns')}
                          </div>
                        )
                      })() : (
                        <div className="flex flex-col items-center justify-center flex-1 py-16 gap-3 text-center">
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

                    <div data-epaper-page-footer className="shrink-0 mt-auto">
                      {isLastPage ? (
                        lastPageFooterText ? (
                          <div className="pt-2">
                            <div
                              className="text-center text-slate-700 font-medium pointer-events-none leading-snug"
                              style={{ fontSize: `${footerLabelPx}px` }}
                            >
                              {lastPageFooterText}
                            </div>
                            <div className="border-t border-slate-500 mt-1.5" aria-hidden />
                          </div>
                        ) : null
                      ) : (
                        <div className="border-t pt-1.5 mt-2" style={{ minHeight: `${Math.round(pageMeta.footerHeightCm * layoutScale)}px` }}>
                        <div className="h-full w-full border border-slate-300 rounded px-2 py-1">
                            <div className="text-[9px] text-slate-500 mb-0.5">Inner page footer</div>
                          <div className="h-full w-full flex items-center justify-between gap-2">
                            {INNER_FOOTER_SWATCH_GROUPS.map((group, idx) => (
                              <div key={`footer-style-${idx}`} className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-0.5">
                                  {group.map((color, swatchIdx) => (
                                    <span
                                      key={`swatch-${idx}-${swatchIdx}`}
                                      className="rounded-[1px] border border-black/20"
                                      style={{ backgroundColor: color, width: footerSwatchPx, height: footerSwatchPx }}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              </>
              )}
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
                      <div className="col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Block</label>
                        {editorContentSignals ? (
                          <div className="mb-2 rounded-lg border border-slate-200 bg-white p-2 text-[10px] space-y-1.5">
                            <div className="font-semibold text-slate-700">Article → BLOCK-06A / 08A</div>
                            <div className="flex flex-wrap gap-1">
                              <span
                                className={`px-1.5 py-0.5 rounded font-semibold ${
                                  editorContentSignals.hasPoints
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                points: {editorContentSignals.hasPoints ? 'true' : 'false'}
                                {editorContentSignals.pointCount > 0
                                  ? ` (${editorContentSignals.pointCount})`
                                  : ''}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded font-semibold ${
                                  editorContentSignals.isMultiImage
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                images: {editorContentSignals.imageCount}
                                {editorContentSignals.isMultiImage ? ' · multi-images' : ''}
                              </span>
                              {editorContentSignals.autoWideBlock ? (
                                <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 font-semibold">
                                  auto: {editorContentSignals.autoWideBlock}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-slate-500 leading-snug">
                              Points panel col1 top — article లో points/highlights ఉన్నప్పుడే load (06A/08A ఇద్దరిలోనూ).
                              Multi-images: 08A = 3 col (2 photos), 06A = 2 col (2 photos).
                            </p>
                          </div>
                        ) : (
                          <p className="mb-2 text-[10px] text-slate-500">Article link లేకపోతే points/images flags చూపించము.</p>
                        )}
                        <select
                          value={selectedPlacement.blockCode}
                          onChange={(e) =>
                            updatePlacement(selectedPlacement.id, {
                              blockCode: e.target.value,
                              templateBlockId: templateMap[e.target.value] || null,
                            })
                          }
                          className="w-full border rounded px-2 py-1.5 text-xs bg-white"
                        >
                          {BLOCK_CODES.map((code) => (
                            <option key={code} value={code}>
                              {formatBlockSelectLabel(code, editorContentSignals)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">4+8 lane</label>
                        <select
                          value={selectedPlacement.layoutLane === 'left' ? 'left' : selectedPlacement.layoutLane === 'right' ? 'right' : ''}
                          onChange={(e) => {
                            const v = e.target.value
                            updatePlacement(selectedPlacement.id, { layoutLane: v ? v : null })
                          }}
                          className="w-full border rounded px-2 py-1.5 text-xs bg-white"
                        >
                          <option value="">Auto (from block width)</option>
                          <option value="left">Left rail (4 col)</option>
                          <option value="right">Right rail (8 col)</option>
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
                  {/* Step 1 — active allocate blocks (always first) */}
                  <div className="mb-3 rounded-xl border border-slate-300 bg-slate-50 p-2.5">
                    <div className="text-[11px] font-bold text-slate-900 mb-1">Step 1 · Allocate block types</div>
                    <p className="text-[10px] text-slate-600 mb-2 leading-snug">
                      Prathi article ki block size fix avvali (4in / 6in / 8in…). Kinda list = active blocks. Tarvata collect-news → auto assign → page layout.
                    </p>
                    <div className="space-y-1">
                      {BLOCK_CODES.map((code) => {
                        const meta = BLOCK_META[code] || {}
                        return (
                          <div
                            key={code}
                            className="flex items-center gap-2 rounded-lg border border-white bg-white px-2 py-1.5 text-[10px]"
                          >
                            <span
                              className="font-bold shrink-0 px-1.5 py-0.5 rounded"
                              style={{ color: meta.color || '#334155', backgroundColor: meta.bg || '#f1f5f9' }}
                            >
                              {code}
                            </span>
                            <span className="text-slate-700 font-medium">{meta.label || code}</span>
                            <span className="ml-auto text-slate-500">{meta.inches || '?'}in</span>
                          </div>
                        )
                      })}
                    </div>
                    <a
                      href="/admin/epaper/block-templates"
                      className="mt-2 inline-block text-[10px] font-semibold text-blue-700 hover:underline"
                    >
                      Block preview studio →
                    </a>
                  </div>

                  {/* Auto-fill buttons */}
                  <div className="mb-3 rounded-xl border border-violet-200 bg-violet-50 p-2.5">
                    <div className="text-[11px] font-bold text-violet-900 mb-1">Step 2 · Collect + auto layout</div>
                    <div className="text-[11px] text-violet-700 mb-2">
                      {articles.length} articles → word count → 4/6/8/12in blocks → {rowWidthInForPreset(preset)}in rows (4+8, 6+6…) → P2–P{headerConfig.numberOfPages || 8}
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
                    const previewSignals = getArticleContentSignals(selectedArticle)
                    return (
                      <div className="mb-3 rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: selMeta.color }}>
                        <div className="flex items-center px-2.5 py-1.5 gap-2" style={{ backgroundColor: selMeta.color }}>
                          <span className="text-[10px] font-bold text-white">{selBlock} · {selMeta.label}</span>
                          <span className="ml-auto text-[10px] text-white/75">{selMeta.desc} · {selMeta.inches}in</span>
                        </div>
                        {(selBlock === 'BLOCK-06A' || selBlock === 'BLOCK-08A') && previewSignals ? (
                          <div className="flex flex-wrap gap-1 px-2 py-1 text-[9px] font-semibold border-b border-white/30" style={{ backgroundColor: selMeta.bg }}>
                            <span className={previewSignals.hasPoints ? 'text-emerald-700' : 'text-slate-400'}>
                              points:{previewSignals.hasPoints ? 'true' : 'false'}
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className={previewSignals.isMultiImage ? 'text-sky-700' : 'text-slate-500'}>
                              {previewSignals.isMultiImage
                                ? `multi-images (${previewSignals.imageCount})`
                                : `${previewSignals.imageCount} img`}
                            </span>
                          </div>
                        ) : null}
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
                              <PreviewComponent {...blockProps} blockCode={selBlock} />
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

                  {/* Page-grouped article list (Page 2 onwards) — active page filter when collect-news */}
                  {(() => {
                    const innerPages = pages.slice(1)
                    const visiblePages = USE_COLLECT_NEWS_ON_LOAD && activePageId >= 2
                      ? innerPages.filter((p) => p.id === activePageId)
                      : innerPages
                    return visiblePages.map((pageItem, pageIdx) => {
                    const q = articleSearch.trim().toLowerCase()
                    const pageArticles = pageItem.placements
                      .map(pl => articles.find(a => a.id === pl.articleId))
                      .filter(Boolean)
                      .filter(a => !q || String(a.title || '').toLowerCase().includes(q) || extractDistrict(a).toLowerCase().includes(q))
                    if (!pageArticles.length) return null
                    const slotTotal = pageItem.placements.reduce((s, pl) => s + estimateSlots(pl.blockCode), 0)
                    const pageLabel = pages.findIndex((p) => p.id === pageItem.id) + 1
                    return (
                      <div key={pageItem.id} className="mb-4">
                        <div className="sticky top-0 z-10 bg-white flex items-center gap-2 py-1.5 mb-2 border-b border-blue-200">
                          <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Page {pageLabel}</span>
                          <span className="text-[11px] text-slate-500">{pageArticles.length} articles · {slotTotal}/{maxSlotsPerPage} slots</span>
                          {USE_COLLECT_NEWS_ON_LOAD && activePageId >= 2 ? (
                            <span className="text-[10px] text-blue-600 font-semibold">canvas page</span>
                          ) : null}
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
                            const peek = peekArticleContentSignals(article)
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
                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                                  <span>{meta.label}</span>
                                  <span>·</span>
                                  <span>{article.wordCount || 0}w</span>
                                  <span>·</span>
                                  <span>{peek.imageCount}img</span>
                                  {peek.hasPoints ? (
                                    <span className="text-emerald-700 font-semibold">points:true</span>
                                  ) : null}
                                  {peek.isMultiImage ? (
                                    <span className="text-sky-700 font-semibold">multi-images</span>
                                  ) : null}
                                  <span>·</span>
                                  <span>{extractDistrict(article)}</span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })
                  })()}

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
                            const peek = peekArticleContentSignals(article)
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
                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                                  <span>{meta.label}</span>
                                  <span>·</span>
                                  <span>{article.wordCount || 0}w</span>
                                  <span>·</span>
                                  <span>{peek.imageCount}img</span>
                                  {peek.hasPoints ? (
                                    <span className="text-emerald-700 font-semibold">points:true</span>
                                  ) : null}
                                  {peek.isMultiImage ? (
                                    <span className="text-sky-700 font-semibold">multi-images</span>
                                  ) : null}
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

                  {!articles.length ? (
                    <div className="text-center py-8 text-xs text-slate-500 leading-relaxed px-2">
                      {HEADERS_PREVIEW_ONLY
                        ? workspaceReady
                          ? 'Header preview mode — articles coming next.'
                          : 'Select tenant & edition, then Load Design.'
                        : 'Select tenant & edition, then Load Design.'}
                    </div>
                  ) : null}
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

      {exportingPdf && typeof document !== 'undefined' && createPortal(
        <div
          ref={exportCanvasRef}
          data-epaper-page-canvas
          data-pdf-export="1"
          data-native-export="1"
          aria-hidden
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 99,
            width: `${exCanvasWidth}px`,
            height: `${exCanvasHeight}px`,
            background: '#fff',
            overflow: 'hidden',
            opacity: 1,
            visibility: 'visible',
            pointerEvents: 'none',
          }}
        >
          <div
            data-epaper-page-column
            style={{
              paddingTop: `${exSafeTopPx}px`,
              paddingRight: `${exSafeRightPx}px`,
              paddingBottom: `${exSafeBottomPx}px`,
              paddingLeft: `${exSafeLeftPx}px`,
              height: `${exCanvasHeight}px`,
              boxSizing: 'border-box',
            }}
            className="flex flex-col h-full"
          >
            <div
              className="border-b shrink-0"
              style={{
                height: `${exHeaderHeightPx}px`,
                marginBottom: `${Math.round(8 * exportDpiScale / 24)}px`,
              }}
            >
              {resolvePageHeaderNode({
                preset,
                pageIndex: Math.max(0, activePageIndex),
                headerRenderSettings,
                headerConfig,
                activeSmartDesign,
                headerStyleNum,
                subHeaderStyleNum,
                slotWidthPx: exHeaderSlotWidthPx,
                headerHeightPx: exHeaderHeightPx,
                exportMode: false,
              })}
            </div>
            <div data-epaper-page-spacer aria-hidden style={{ height: `${exArticleSpacerPx}px`, flexShrink: 0 }} />
            <div data-epaper-page-footer className="shrink-0 mt-auto">
              {isLastPage ? (
                lastPageFooterText ? (
                  <div className="pt-2">
                    <div
                      className="text-center text-slate-700 font-medium leading-snug"
                      style={{ fontSize: `${exFooterLabelPx}px` }}
                    >
                      {lastPageFooterText}
                    </div>
                    <div className="border-t border-slate-500 mt-1.5" aria-hidden />
                  </div>
                ) : null
              ) : (
                <div className="border-t pt-1.5 mt-2" style={{ minHeight: `${Math.round(pageMeta.footerHeightCm * exportDpiScale)}px` }}>
                  <div className="h-full w-full flex items-center justify-between gap-2">
                    {INNER_FOOTER_SWATCH_GROUPS.map((group, idx) => (
                      <div key={`export-footer-${idx}`} className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-0.5">
                          {group.map((color, swatchIdx) => (
                            <span
                              key={`export-swatch-${idx}-${swatchIdx}`}
                              className="rounded-[1px] border border-black/20"
                              style={{ backgroundColor: color, width: exFooterSwatchPx, height: exFooterSwatchPx }}
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
        </div>,
        document.body
      )}

      {exportingPdf ? (
        <div className="fixed inset-0 z-[100] bg-slate-900/85 flex flex-col items-center justify-center gap-3 pointer-events-none">
          <div className="h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden />
          <div className="text-white text-sm font-medium">{info || 'Exporting PDF…'}</div>
        </div>
      ) : null}
    </DashboardLayout>
  )
}
