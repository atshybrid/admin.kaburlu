/**
 * ePaper inner-page (P2+) capacity + inch-row layout plan.
 * Used after collect-news: fair reporter pick (API) → word-count blocks → 12in rows → pages.
 */
import {
  arrangePagesFromCollectNews,
  buildInchRowsFromArticles,
  BLOCK_META_IN,
  MAX_EPAPER_PAGES,
  normalizeCollectNewsArticles,
  rowWidthInForPreset,
  TARGET_ROWS_PER_INNER_PAGE,
} from './collectNewsLayout'
import { suggestArticleBlock } from './suggestArticleBlock'

const DEFAULT_PER_PAGE = 12

/**
 * How many articles the edition can hold (P2+).
 * Example: 8 pages, P1 masthead only → 7 × 12 = 84 articles max (API cap).
 */
export function computeCollectCapacity({
  totalPages = 8,
  perPage = DEFAULT_PER_PAGE,
  excludeMainPage = true,
} = {}) {
  const pages = Math.min(MAX_EPAPER_PAGES, Math.max(1, Number(totalPages) || 8))
  const innerPages = excludeMainPage ? Math.max(0, pages - 1) : pages
  const maxArticles = innerPages * Math.min(50, Math.max(1, Number(perPage) || DEFAULT_PER_PAGE))
  return {
    totalPages: pages,
    excludeMainPage,
    innerPages,
    perPage: Math.min(50, Math.max(1, Number(perPage) || DEFAULT_PER_PAGE)),
    maxArticles,
    example: `${pages} pages → page 1 masthead, pages 2–${pages} news (${innerPages}×${perPage} ≈ ${maxArticles} articles)`,
  }
}

/** Reporter fair-share hint (round-robin is done in collect-news API). */
export function estimatePerReporterQuota(totalArticles, reporterCount) {
  const n = Math.max(1, Number(reporterCount) || 1)
  const total = Math.max(0, Number(totalArticles) || 0)
  const base = Math.floor(total / n)
  const extra = total % n
  return { reporters: n, basePerReporter: base, maxPerReporter: base + (extra > 0 ? 1 : 0) }
}

/** Word-count → block (4 / 6 / 8 / 12 in) for one article. */
export function blockPlanForArticle(article) {
  const code = suggestArticleBlock(article)
  return {
    blockCode: code,
    widthIn: BLOCK_META_IN[code] || 4,
    wordCount: Number(article?.wordCount || 0),
  }
}

/**
 * Describe how one inner page is filled (inch rows).
 * e.g. page 2: row1 [4in | 8in], row2 [6in | 6in] → stacks in columns in preview.
 */
export function describePageRowPlan(rows, rowWidthIn) {
  return (rows || []).map((row, i) => {
    const slots = row.map((c) => `${BLOCK_META_IN[c.blockCode] || c.inches || 4}in`)
    const sum = row.reduce((s, c) => s + (BLOCK_META_IN[c.blockCode] || c.inches || 4), 0)
    return {
      rowIndex: i,
      pattern: slots.join(' + '),
      widthIn: sum,
      fits: sum <= rowWidthIn + 0.05,
      articles: row.length,
    }
  })
}

export function buildLayoutPlan(payload, { preset = 'BROADSHEET', pageCount = 8 } = {}) {
  const articles = normalizeCollectNewsArticles(payload)
  const capacity = payload?.capacity || computeCollectCapacity({
    totalPages: pageCount,
    perPage: payload?.capacity?.perPage,
    excludeMainPage: payload?.capacity?.excludeMainPage !== false,
  })
  const rowWidthIn = rowWidthInForPreset(preset)
  const inchRows = buildInchRowsFromArticles(articles, rowWidthIn)
  const reporters = payload?.stats?.distinctReporters || payload?.reporterDistribution?.length || 0
  const quota = estimatePerReporterQuota(capacity.maxArticles, reporters)

  const samplePages = []
  let rowIdx = 0
  const innerPageCount = capacity.innerPages || Math.max(0, pageCount - 1)
  for (let p = 2; p <= pageCount && rowIdx < inchRows.length; p++) {
    const pageRows = inchRows.slice(rowIdx, rowIdx + TARGET_ROWS_PER_INNER_PAGE)
    rowIdx += pageRows.length
    samplePages.push({
      pageNumber: p,
      rows: describePageRowPlan(pageRows, rowWidthIn),
      storyCount: pageRows.reduce((n, r) => n + r.length, 0),
    })
    if (samplePages.length >= 3) break
  }

  return {
    preset,
    rowWidthIn,
    capacity,
    collected: articles.length,
    inchRowsTotal: inchRows.length,
    reporterQuota: quota,
    rowTemplatesPreferred: ['4+8', '8+4', '6+6', '12', '4+4+4'],
    samplePages,
    headerStyles: {
      main: payload?.design?.headerStyleNumber,
      sub: payload?.design?.subHeaderStyleNumber,
    },
  }
}

/** Arrange P2+ onto canvas pages (wraps collect-news packer). */
export function arrangeAllInnerPages(collectPayload, options = {}) {
  return arrangePagesFromCollectNews(collectPayload, options)
}
