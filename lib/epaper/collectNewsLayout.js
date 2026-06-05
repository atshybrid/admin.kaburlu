/**
 * collect-news → inner pages (P2+) layout for broadsheet 8-col / tabloid 5-col.
 * Row packing: 8in lead · 6in story · 4+4+6in companions (14in row on broadsheet).
 */

import { coerceToActiveBlockCode } from './epaperActiveBlocks'
import { suggestArticleBlock, suggestBlockForSlot } from './suggestArticleBlock'
import { peekArticleContentSignals } from './articleToBlockProps'

export const MAX_EPAPER_PAGES = 8

export const BLOCK_META_IN = {
  'BLOCK-TOP8x7': 8,
  'BLOCK-02A': 2,
  'BLOCK-03A': 3,
  'BLOCK-04A': 4,
  'BLOCK-06A': 6,
  'BLOCK-08A': 7.5,
  'BLOCK-09A': 9,
  'BLOCK-12A': 12,
}

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

/** Target inner-page row count (2 rows × 3 cols = 6 stories/page). */
export const TARGET_ROWS_PER_INNER_PAGE = 2

/** Max stacked stories per column lane before spill. */
export const MAX_STORIES_PER_LANE = 3

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

const WIDE_BLOCK_SET = new Set(['BLOCK-06A', 'BLOCK-08A', 'BLOCK-09A', 'BLOCK-12A', 'BLOCK-TOP8x7'])

export function getLaneWidthsIn(rowWidthIn = 14) {
  if (rowWidthIn >= 14) return [4, 4, 6]
  if (rowWidthIn >= 12) return [4, 4, 4]
  return [4, 4, 4]
}

export function articleStackGapPx(layoutScale = 24) {
  return Math.max(6, Math.round(8 * layoutScale / 24))
}

function laneWidthsPxForPage(totalRowWidthPx, rowWidthIn, layoutScale) {
  const laneWidthsIn = getLaneWidthsIn(rowWidthIn)
  const colGutter = columnGutterPx(layoutScale)
  const gutterTotal = colGutter * Math.max(0, laneWidthsIn.length - 1)
  const contentW = Math.max(1, totalRowWidthPx - gutterTotal)
  const sumIn = laneWidthsIn.reduce((a, b) => a + b, 0) || 1
  return laneWidthsIn.map((inches) => Math.max(48, Math.floor(contentW * (inches / sumIn))))
}

function estimateScaledBlockHeightForPage(blockCode, article, laneWidthPx) {
  const nativeW = BLOCK_NATIVE_WIDTH_PX[blockCode] || 384
  const nativeH = estimateBlockNativeHeight(blockCode, article)
  const sc = laneWidthPx / nativeW
  const safety = WIDE_BLOCK_SET.has(blockCode) ? 1.12 : 1.06
  return Math.max(72, Math.round(nativeH * sc * safety))
}

function canPageAcceptInchRow(row, colUsedHeights, colStoryCounts, articleAreaH, laneWidthsPx, stackGapPx, laneWidthsIn) {
  for (let ci = 0; ci < row.length; ci++) {
    const cell = row[ci]
    const gap = (colUsedHeights[ci] || 0) > 0 ? stackGapPx : 0
    const used = colUsedHeights[ci] || 0
    // Allow row if column can show at least a clipped story strip (editor red ruler)
    if (used + gap >= articleAreaH - 8) return false
    const h = estimateScaledBlockHeightForPage(cell.blockCode, cell.article, laneWidthsPx[ci] || 200)
    if (used + gap + Math.min(h, 72) > articleAreaH + 2) return false
  }
  return true
}

function applyRowToColumnUsage(row, colUsedHeights, colStoryCounts, laneWidthsPx, stackGapPx) {
  for (let ci = 0; ci < row.length; ci++) {
    const cell = row[ci]
    const h = estimateScaledBlockHeightForPage(cell.blockCode, cell.article, laneWidthsPx[ci] || 200)
    const gap = (colUsedHeights[ci] || 0) > 0 ? stackGapPx : 0
    colUsedHeights[ci] = (colUsedHeights[ci] || 0) + gap + h
    colStoryCounts[ci] = (colStoryCounts[ci] || 0) + 1
  }
}

/** Gutter between columns in a row (px at layoutScale 24). */
export function columnGutterPx(layoutScale = 24) {
  return Math.max(2, Math.round(3 * layoutScale / 24))
}

/** Content-aware block height from title, image, points, word count. */
export function estimateBlockNativeHeight(blockCode, article) {
  const floor = BLOCK_NATIVE_HEIGHT_PX[blockCode] || 320
  if (!article) return floor

  const words = Number(article?.wordCount || 0)
  const signals = peekArticleContentSignals(article)
  const titleLen = String(article?.title || article?.heading || '').length
  const titleLines = Math.min(4, Math.max(1, Math.ceil(titleLen / 26)))

  let h = 20 + titleLines * 34

  if (signals.imageCount >= 1) {
    const imgH =
      blockCode === 'BLOCK-12A' || blockCode === 'BLOCK-08A' ? 192
        : blockCode === 'BLOCK-06A' ? 168
          : 128
    h += imgH + 10
  }

  if (signals.hasPoints) {
    h += 20 + Math.min(80, signals.pointCount * 16)
  }

  const cols =
    blockCode === 'BLOCK-12A' ? 4
      : blockCode === 'BLOCK-08A' || blockCode === 'BLOCK-09A' ? 3
        : blockCode === 'BLOCK-06A' ? 2
          : 2
  const charsPerLine = blockCode === 'BLOCK-04A' ? 30 : 36
  const bodyLines = Math.max(2, Math.ceil((words * 5.6) / (charsPerLine * cols)))
  h += bodyLines * 15.5 + 18

  // Slight headroom for wide blocks (DOM rebalance)
  if (blockCode === 'BLOCK-08A' || blockCode === 'BLOCK-09A') h = Math.round(h * 1.12)
  else if (blockCode === 'BLOCK-06A' || blockCode === 'BLOCK-12A') h = Math.round(h * 1.08)

  return Math.round(Math.min(floor * 3, Math.max(floor * 0.85, h)))
}

/** Scale block to fill column width; grow short stories toward row height without cropping. */
export function computeCanvasBlockScale({ cellW, cellH, nativeW, contentH }) {
  const cw = Math.max(1, Number(cellW) || 1)
  const ch = Math.max(1, Number(cellH) || 1)
  const nw = Math.max(1, Number(nativeW) || 1)
  const nh = Math.max(1, Number(contentH) || 1)
  const scW = cw / nw
  const hAtWidth = nh * scW
  if (hAtWidth <= ch - 2) {
    const scH = ch / nh
    if (nw * scH <= cw + 1) return scH
    return scW
  }
  return Math.min(scW, ch / nh)
}

export function estimateVisibleWords(article, cellH, contentH) {
  const words = Number(article?.wordCount || 0)
  if (!words || !contentH || contentH <= cellH) return words
  const frac = Math.min(0.98, cellH / contentH)
  return Math.max(1, Math.floor(words * frac))
}

/** Row-major layout: each row fills page width; row heights expand to fill article area. */
export function buildInnerPageRowLayout({
  placements = [],
  articleAreaH,
  totalWidthPx,
  rowWidthIn = 14,
  articles = [],
  layoutScale = 24,
}) {
  const rows = buildRowsFromPlacements(placements, rowWidthIn)
  const colGutter = columnGutterPx(layoutScale)

  const rawRows = rows.map((row) => ({
    placements: row,
    heightPx: estimateRowHeightPx(row, totalWidthPx, layoutScale, articles, rowWidthIn),
  }))

  const filledRows = distributeRowHeightsToFill(rawRows, articleAreaH)

  return filledRows.map((row) => {
    const gutterTotal = colGutter * Math.max(0, row.placements.length - 1)
    const contentW = Math.max(1, totalWidthPx - gutterTotal)

    const cells = row.placements.map((p) => {
      const inches = BLOCK_META_IN[p.blockCode] || 4
      const cellW = Math.max(48, Math.floor(contentW * (inches / Math.max(rowWidthIn, 1))))
      const article = articles.find((a) => a.id === p.articleId)
      const nativeW = BLOCK_NATIVE_WIDTH_PX[p.blockCode] || inches * 96
      const nativeH = estimateBlockNativeHeight(p.blockCode, article)
      const sc = cellW / nativeW
      const contentH = Math.round(nativeH * sc)
      const words = Number(article?.wordCount || 0)
      const layoutTruncated = contentH > row.heightPx + 4

      return {
        placement: p,
        article,
        cellW,
        heightPx: row.heightPx,
        layoutTruncated,
        contentH,
        visibleWords: layoutTruncated
          ? estimateVisibleWords(article, row.heightPx, contentH)
          : words,
        totalWords: words,
      }
    })

    return { heightPx: row.heightPx, cells, colGutter }
  })
}

/** Article row width in inches (inside L/R margins). */
export function rowWidthInForPreset(preset) {
  const p = String(preset || '').toUpperCase()
  if (p === 'TABLOID') return 11
  if (p === 'DIGITAL_PAPER' || p === 'DIGITAL') return 12
  return 12
}

export function normalizeCollectNewsArticle(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = raw.id || raw._id
  if (!id) return null
  const mediaUrls = Array.isArray(raw.mediaUrls) ? raw.mediaUrls : []
  const featured = raw.featuredImageUrl || mediaUrls[0] || null
  return {
    ...raw,
    id: String(id),
    title: raw.title || raw.heading || '',
    heading: raw.heading || raw.title || '',
    featuredImageUrl: featured,
    media: mediaUrls.length
      ? mediaUrls.map((url) => ({ url, imageUrl: url, src: url }))
      : (featured ? [{ url: featured, imageUrl: featured }] : []),
    districtName: raw.districtName || raw.placeName || '',
    wordCount: Number(raw.wordCount || 0),
    charCount: Number(raw.charCount || 0),
  }
}

export function normalizeCollectNewsArticles(payload) {
  const list = Array.isArray(payload?.articles) ? payload.articles : []
  const seen = new Set()
  const out = []
  for (const raw of list) {
    const norm = normalizeCollectNewsArticle(raw)
    if (!norm || seen.has(norm.id)) continue
    seen.add(norm.id)
    out.push(norm)
  }
  return out
}

/** Preferred row inch patterns (broadsheet 14in / tabloid 12in). */
const ROW_TEMPLATES = {
  14: [
    [4, 4, 6],
    [6, 4, 4],
    [8, 6],
    [6, 6],
    [4, 6, 4],
    [12, 2],
    [4, 4, 4, 2],
    [8],
    [6],
    [4],
  ],
  12: [
    [4, 8],
    [8, 4],
    [6, 6],
    [12],
    [8],
    [6],
    [4, 4, 4],
    [4],
  ],
  /** Tabloid print width ~11in */
  11: [
    [4, 7],
    [8, 3],
    [6, 5],
    [4, 4, 3],
    [11],
    [6],
    [4],
  ],
}

/** 12in rows — full stories only (no brief rail / BLOCK-04A). */
const FULL_ARTICLE_ROW_TEMPLATES = {
  12: [
    [12],
    [6, 6],
    [8, 4],
  ],
}

/** Pick block for inner page — minimum BLOCK-06A, never brief BLOCK-04A. */
export function assignFullArticleBlock(article) {
  const words = Number(article?.wordCount || 0)
  const imgCount = Array.isArray(article?.media)
    ? article.media.filter((m) => !!(m?.url || m?.imageUrl || m?.src)).length
    : article?.featuredImageUrl
      ? 1
      : 0
  const isLead = !!(
    article?.isBreaking ||
    article?.breaking ||
    article?.isFeatured ||
    article?.featured ||
    ['HIGH', 'URGENT', 'TOP'].includes(String(article?.priority || article?.importance || '').toUpperCase())
  )

  if (isLead && imgCount >= 1 && words >= 180) return 'BLOCK-12A'
  if (words >= 360 || (isLead && words >= 200)) return 'BLOCK-12A'
  if (words >= 180 || imgCount >= 1) return 'BLOCK-08A'
  return 'BLOCK-06A'
}

function blockCodeForSlotInches(slotIn, article) {
  return suggestBlockForSlot(article, slotIn)
}

function tryFillRowTemplate(items, template, rowWidthIn) {
  const sumIn = template.reduce((a, b) => a + b, 0)
  if (sumIn > rowWidthIn + 0.01) return null

  const picked = []
  const usedIdx = new Set()

  for (const slotIn of template) {
    let bestIdx = -1
    let bestScore = -1
    for (let k = 0; k < items.length; k++) {
      if (items[k].used || usedIdx.has(k)) continue
      const artIn = items[k].inches
      if (artIn <= slotIn + 0.01) {
        const score = artIn === slotIn ? 200 + artIn : 100 + artIn
        if (score > bestScore) {
          bestScore = score
          bestIdx = k
        }
      }
    }
    if (bestIdx === -1) {
      for (let k = 0; k < items.length; k++) {
        if (!items[k].used && !usedIdx.has(k)) {
          bestIdx = k
          break
        }
      }
    }
    if (bestIdx === -1) return null

    usedIdx.add(bestIdx)
    const blockCode = blockCodeForSlotInches(slotIn, items[bestIdx].article)
    picked.push({
      idx: bestIdx,
      article: items[bestIdx].article,
      blockCode,
      inches: BLOCK_META_IN[blockCode] || slotIn,
    })
  }

  for (const p of picked) {
    items[p.idx].used = true
  }
  return picked.map(({ article, blockCode, inches }) => ({ article, blockCode, inches }))
}

function greedyFillRow(items, startIdx, rowWidthIn) {
  if (startIdx >= items.length || items[startIdx].used) return null
  items[startIdx].used = true
  const row = [{
    article: items[startIdx].article,
    blockCode: items[startIdx].blockCode,
    inches: items[startIdx].inches,
  }]
  let remaining = rowWidthIn - items[startIdx].inches

  let guard = 0
  while (remaining > 0.01 && guard < items.length * 2) {
    guard += 1
    let bestIdx = -1
    let bestIn = -1
    for (let j = 0; j < items.length; j++) {
      if (items[j].used) continue
      const in_ = items[j].inches
      if (in_ <= remaining + 0.01 && in_ > bestIn) {
        bestIn = in_
        bestIdx = j
      }
    }
    if (bestIdx === -1) break
    row.push({
      article: items[bestIdx].article,
      blockCode: items[bestIdx].blockCode,
      inches: items[bestIdx].inches,
    })
    remaining -= items[bestIdx].inches
    items[bestIdx].used = true
  }
  return row
}

/** Template-first inch-row pack. fullArticlesOnly → 6+6 / 12 / 8+4, min BLOCK-06A. */
export function buildInchRowsFromArticles(articleList, rowWidthIn = 14, { fullArticlesOnly = false } = {}) {
  const items = (articleList || []).map((article) => {
    const blockCode = coerceToActiveBlockCode(
      fullArticlesOnly ? assignFullArticleBlock(article) : suggestArticleBlock(article),
      fullArticlesOnly ? 'BLOCK-06A' : 'BLOCK-04A'
    )
    const inches = BLOCK_META_IN[blockCode] || 4
    return { article, blockCode, inches, used: false }
  })

  const templates = fullArticlesOnly
    ? (FULL_ARTICLE_ROW_TEMPLATES[rowWidthIn] || FULL_ARTICLE_ROW_TEMPLATES[12])
    : (ROW_TEMPLATES[rowWidthIn] || ROW_TEMPLATES[14])
  const rows = []

  while (items.some((i) => !i.used)) {
    let row = null
    for (const template of templates) {
      row = tryFillRowTemplate(items, template, rowWidthIn)
      if (row) break
    }
    if (!row) {
      const startIdx = items.findIndex((i) => !i.used)
      if (startIdx === -1) break
      row = greedyFillRow(items, startIdx, rowWidthIn)
    }
    if (row?.length) rows.push(row)
    else break
  }
  return rows
}

export function buildPages(count) {
  return Array.from({ length: Math.max(1, Number(count) || 1) }, (_, idx) => ({
    id: idx + 1,
    placements: [],
  }))
}

/** Turn inch-row items into flat placements (preserves row order). */
export function placementsFromInchRows(rows, buildPlacementFn) {
  const flat = []
  let rowIndex = 0
  for (const row of rows || []) {
    const rowIn = row.reduce((s, c) => s + (c.inches || BLOCK_META_IN[c.blockCode] || 4), 0)
    for (const cell of row) {
      const p = buildPlacementFn(cell.article)
      flat.push({
        ...p,
        blockCode: cell.blockCode || p.blockCode,
        layoutRowInches: rowIn,
        layoutRowIndex: rowIndex,
      })
    }
    rowIndex += 1
  }
  return flat
}

/** Rebuild rows from flat placements (preserves inch-row order from packer). */
export function buildRowsFromPlacements(placements, rowWidthIn = 14) {
  const list = placements || []
  if (!list.length) return []

  if (list.some((p) => p.layoutRowIndex != null && p.layoutRowIndex !== '')) {
    const byRow = new Map()
    for (const p of list) {
      const ri = Number(p.layoutRowIndex) || 0
      if (!byRow.has(ri)) byRow.set(ri, [])
      byRow.get(ri).push(p)
    }
    return Array.from(byRow.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, row]) => row)
  }

  const rows = []
  let row = []
  let sum = 0
  let cap = rowWidthIn

  for (const p of list) {
    const in_ = BLOCK_META_IN[p.blockCode] || 4
    if (!row.length) {
      cap = Number(p.layoutRowInches) > 0 ? Number(p.layoutRowInches) : rowWidthIn
    }
    row.push(p)
    sum += in_
    if (sum >= cap - 0.01) {
      rows.push(row)
      row = []
      sum = 0
    }
  }
  if (row.length) rows.push(row)
  return rows
}

export function estimateRowHeightPx(
  rowPlacements,
  totalRowWidthPx,
  layoutScale = 24,
  articles = [],
  rowWidthIn = 14
) {
  let maxH = 72
  const colCount = rowPlacements.length
  const gutterTotal = columnGutterPx(layoutScale) * Math.max(0, colCount - 1)
  const contentW = Math.max(1, totalRowWidthPx - gutterTotal)
  for (const p of rowPlacements) {
    const inches = BLOCK_META_IN[p.blockCode] || 4
    const cellW = contentW * (inches / Math.max(rowWidthIn, 1))
    const article = articles.find((a) => a.id === p.articleId)
    const nativeW = BLOCK_NATIVE_WIDTH_PX[p.blockCode] || inches * 96
    const nativeH = estimateBlockNativeHeight(p.blockCode, article)
    const sc = cellW / nativeW
    const safety = WIDE_BLOCK_SET.has(p.blockCode) ? 1.12 : 1.08
    maxH = Math.max(maxH, Math.round(nativeH * sc * safety))
  }
  return Math.max(80, Math.round(maxH * (layoutScale / 24)))
}

/** Expand row heights so visible rows fill the article area (no bottom gap). */
export function distributeRowHeightsToFill(visibleRows, articleAreaH, minRowPx = 80) {
  if (!visibleRows.length) return visibleRows
  const used = visibleRows.reduce((s, r) => s + r.heightPx, 0)
  if (used >= articleAreaH) return visibleRows

  const weights = visibleRows.map((row) => {
    const rowIn = row.placements.reduce((s, p) => s + (BLOCK_META_IN[p.blockCode] || 4), 0)
    return Math.max(1, rowIn)
  })
  const sumW = weights.reduce((a, b) => a + b, 0) || 1
  const heights = weights.map((w) => Math.max(minRowPx, Math.floor((w / sumW) * articleAreaH)))

  let diff = articleAreaH - heights.reduce((a, b) => a + b, 0)
  let guard = 0
  while (diff !== 0 && guard < articleAreaH + 100) {
    if (diff > 0) {
      let bi = 0
      for (let i = 1; i < heights.length; i++) {
        if (heights[i] < heights[bi]) bi = i
      }
      heights[bi] += 1
      diff -= 1
    } else {
      let bi = 0
      for (let i = 1; i < heights.length; i++) {
        if (heights[i] > heights[bi]) bi = i
      }
      if (heights[bi] <= minRowPx) break
      heights[bi] -= 1
      diff += 1
    }
    guard += 1
  }

  return visibleRows.map((row, i) => ({ ...row, heightPx: heights[i] }))
}

/** Split rows into visible vs footer-overflow remainders. */
export function splitRowsByFooterLimit(rows, articleAreaH, totalRowWidthPx, layoutScale, articles = []) {
  const visible = []
  const remainders = []
  let usedH = 0
  const rule = '1px solid rgba(203, 213, 225, 0.95)'

  for (const row of rows) {
    const rowH = estimateRowHeightPx(row, totalRowWidthPx, layoutScale, articles)
    if (usedH + rowH > articleAreaH && visible.length > 0) {
      remainders.push(...row)
      continue
    }
    if (usedH + rowH > articleAreaH) {
      remainders.push(...row)
      continue
    }
    visible.push({ placements: row, heightPx: rowH, borderBottom: rule })
    usedH += rowH
  }

  const filled = distributeRowHeightsToFill(visible, articleAreaH)
  return {
    visibleRows: filled,
    remainderPlacements: remainders,
    usedHeightPx: filled.reduce((s, r) => s + r.heightPx, 0),
  }
}

/**
 * Arrange P2+ from collect-news payload.
 * Respects API pageBuckets per page; spills overflow to next inner page.
 * Rows fill article area height (~4 rows) before moving to next page.
 */
export function arrangePagesFromCollectNews(payload, {
  pageCount = 8,
  preset = 'BROADSHEET',
  buildPlacementFn,
  maxRowsPerPage = TARGET_ROWS_PER_INNER_PAGE,
  articleAreaH = 9999,
  layoutScale = 24,
  totalRowWidthPx = 900,
} = {}) {
  const totalPages = Math.min(MAX_EPAPER_PAGES, Math.max(2, Number(pageCount) || 8))
  const pages = buildPages(totalPages)
  const rowWidthIn = rowWidthInForPreset(preset)
  const allArticles = normalizeCollectNewsArticles(payload)
  const bucketMap = new Map()

  if (Array.isArray(payload?.pageBuckets)) {
    for (const bucket of payload.pageBuckets) {
      const pn = Number(bucket.pageNumber)
      if (pn >= 2 && pn <= totalPages) {
        bucketMap.set(pn, Array.isArray(bucket.articles) ? bucket.articles : [])
      }
    }
  }

  const bucketArticleIds = new Set()
  bucketMap.forEach((list) => {
    list.forEach((a) => {
      const n = normalizeCollectNewsArticle(a)
      if (n) bucketArticleIds.add(n.id)
    })
  })

  const overflowArts = allArticles.filter((a) => !bucketArticleIds.has(a.id))

  const useFullArticleRows = preset === 'BROADSHEET' && rowWidthIn === 12

  if (useFullArticleRows) {
    const innerArticles = []
    for (let pn = 2; pn <= totalPages; pn++) {
      const arts = (bucketMap.get(pn) || []).map(normalizeCollectNewsArticle).filter(Boolean)
      if (arts.length) innerArticles.push(...arts)
    }
    if (overflowArts.length) innerArticles.push(...overflowArts)

    const pendingRows = buildInchRowsFromArticles(innerArticles, rowWidthIn, {
      fullArticlesOnly: true,
    })
    let rowQueue = [...pendingRows]

    for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
      if (!rowQueue.length) break
      const pageIdx = pageNum - 1
      const pagePlacements = []
      let rowCount = 0

      while (rowQueue.length && rowCount < maxRowsPerPage) {
        const row = rowQueue.shift()
        pagePlacements.push(...placementsFromInchRows([row], buildPlacementFn))
        rowCount += 1
      }

      pages[pageIdx].placements = pagePlacements
    }

    return { pages, articles: allArticles, rowWidthIn }
  }

  /** Article queue for tabloid inch-row packing. */
  let pendingArticles = []

  for (let pn = 2; pn <= totalPages; pn++) {
    const arts = (bucketMap.get(pn) || []).map(normalizeCollectNewsArticle).filter(Boolean)
    if (arts.length) pendingArticles.push(...arts)
  }
  if (overflowArts.length) pendingArticles.push(...overflowArts)

  for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
    if (!pendingArticles.length) break
    const pageIdx = pageNum - 1

    /** Legacy inch-row queue (tabloid). */
    let pendingRows = []
    if (pendingArticles.length) {
      pendingRows = buildInchRowsFromArticles(pendingArticles, rowWidthIn)
      pendingArticles = []
    }
    if (!pendingRows.length) break

    const pagePlacements = []
    let rowCount = 0
    const laneWidthsIn = getLaneWidthsIn(rowWidthIn)
    const laneWidthsPx = laneWidthsPxForPage(totalRowWidthPx, rowWidthIn, layoutScale)
    const stackGap = articleStackGapPx(layoutScale)
    const colUsedHeights = laneWidthsIn.map(() => 0)
    const colStoryCounts = laneWidthsIn.map(() => 0)

    while (pendingRows.length && rowCount < maxRowsPerPage) {
      const row = pendingRows[0]
      if (
        !canPageAcceptInchRow(
          row,
          colUsedHeights,
          colStoryCounts,
          articleAreaH,
          laneWidthsPx,
          stackGap,
          laneWidthsIn
        )
      ) {
        if (pagePlacements.length === 0) {
          pendingRows.shift()
          pagePlacements.push(...placementsFromInchRows([row], buildPlacementFn))
          applyRowToColumnUsage(row, colUsedHeights, colStoryCounts, laneWidthsPx, stackGap)
          rowCount += 1
        }
        break
      }

      pendingRows.shift()
      pagePlacements.push(...placementsFromInchRows([row], buildPlacementFn))
      applyRowToColumnUsage(row, colUsedHeights, colStoryCounts, laneWidthsPx, stackGap)
      rowCount += 1
    }

    pages[pageIdx].placements = pagePlacements
  }

  return { pages, articles: allArticles, rowWidthIn }
}
