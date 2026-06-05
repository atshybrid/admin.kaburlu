/**
 * Broadsheet inner page — 13in trim, 0.5in L/R margin, 12in article area.
 * Row patterns: 4+8 · 8+4 · 6+6 · 12 full.
 * When a row uses 4in, that rail stacks all 4in briefs to the footer.
 */

import { coerceToActiveBlockCode } from './epaperActiveBlocks'
import { suggestArticleBlock, suggestBlockForSlot } from './suggestArticleBlock'
import {
  BLOCK_META_IN,
  articleStackGapPx,
  columnGutterPx,
  computeCanvasBlockScale,
  distributeRowHeightsToFill,
  estimateBlockNativeHeight,
  estimateVisibleWords,
} from './collectNewsLayout'

export const BROADSHEET_TRIM_WIDTH_IN = 13
export const BROADSHEET_MARGIN_IN = 0.5
export const BROADSHEET_ARTICLE_WIDTH_IN = 12

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

/** Row templates — prefer 4(left)+8(right) over full 12. */
const PAGE_ROW_TEMPLATES = [
  { slots: [4, 8], railSide: 'left' },
  { slots: [8, 4], railSide: 'right' },
  { slots: [6, 6], railSide: null },
  { slots: [12], railSide: null },
]

const MAIN_ONLY_TEMPLATES = [
  { slots: [8], railSide: null },
  { slots: [6], railSide: null },
  { slots: [12], railSide: null },
]

function blockInches(blockCode) {
  return BLOCK_META_IN[blockCode] || 4
}

function prepArticle(article) {
  const blockCode = coerceToActiveBlockCode(suggestArticleBlock(article), 'BLOCK-04A')
  return { article, blockCode, inches: blockInches(blockCode) }
}

function isBriefArticle(item) {
  return item.inches <= 4.01
}

function tryTemplate(queue, template) {
  const scratch = queue.map((item, origIdx) => ({ ...item, origIdx, used: false }))
  const picked = []

  for (const slotIn of template.slots) {
    let found = -1
    for (let i = 0; i < scratch.length; i++) {
      if (scratch[i].used) continue
      if (scratch[i].inches <= slotIn + 0.01) {
        found = i
        break
      }
    }
    if (found === -1) return null
    scratch[found].used = true
    const item = scratch[found]
    const blockCode = suggestBlockForSlot(item.article, slotIn)
    picked.push({
      article: item.article,
      blockCode,
      slotIn,
      inches: blockInches(blockCode),
      origIdx: item.origIdx,
    })
  }

  picked
    .map((p) => p.origIdx)
    .sort((a, b) => b - a)
    .forEach((idx) => queue.splice(idx, 1))

  return picked.map(({ article, blockCode, slotIn, inches }) => ({
    article,
    blockCode,
    slotIn,
    inches,
  }))
}

/**
 * Pack one page: LEFT 4in rail (all briefs to footer) + RIGHT 8in main rows.
 * Falls back to 6+6 or 12 when no briefs on page.
 */
export function packBroadsheetPageArticles(articleList, {
  maxMainRows = 2,
  maxRailStories = 14,
} = {}) {
  const items = (articleList || []).map(prepArticle)
  if (!items.length) return { cells: [], consumed: 0 }

  const cells = []
  const usedIdx = new Set()
  let railSide = null
  let mainRowIndex = 0
  let layoutRowIndex = 0

  const markUsed = (idx) => usedIdx.add(idx)
  const isUsed = (idx) => usedIdx.has(idx)

  const pushCell = (item, idx, zone, slotIn, blockCode) => {
    if (zone === 'rail4' && !railSide) railSide = 'left'
    cells.push({
      article: item.article,
      blockCode,
      slotIn,
      inches: blockInches(blockCode),
      zone,
      railSide: zone === 'rail4' ? railSide : null,
      layoutMainRow: zone === 'main' ? mainRowIndex : null,
      layoutRowIndex: layoutRowIndex++,
      layoutZone: zone,
      layoutSlotInches: slotIn,
      layoutRailSide: zone === 'rail4' ? railSide : null,
    })
    markUsed(idx)
  }

  const hasBrief = (from = 0) =>
    items.some((it, i) => i >= from && !isUsed(i) && isBriefArticle(it))
  const hasWide = (from = 0) =>
    items.some((it, i) => i >= from && !isUsed(i) && !isBriefArticle(it))

  /** 4+8 page: every brief → left rail; wide stories → right 8in column. */
  if (hasBrief() && hasWide()) {
    railSide = 'left'

    for (let i = 0; i < items.length; i++) {
      if (isUsed(i)) continue
      if (!isBriefArticle(items[i])) continue
      if (cells.filter((c) => c.zone === 'rail4').length >= maxRailStories) break
      const blockCode = suggestBlockForSlot(items[i].article, 4)
      pushCell(items[i], i, 'rail4', 4, blockCode)
    }

    for (let i = 0; i < items.length; i++) {
      if (isUsed(i)) continue
      if (isBriefArticle(items[i])) continue
      if (mainRowIndex >= maxMainRows) break
      const slotIn = Math.min(8, Math.max(6, items[i].inches))
      const blockCode = suggestBlockForSlot(items[i].article, slotIn)
      pushCell(items[i], i, 'main', slotIn, blockCode)
      mainRowIndex += 1
    }
  } else {
    /** No briefs — use row templates (6+6, 12, 8). */
    let queue = items.map((it, idx) => ({ ...it, origIdx: idx })).filter((it) => !isUsed(it.origIdx))

    while (queue.length && mainRowIndex < maxMainRows) {
      let row = null
      let templateUsed = null
      for (const tmpl of PAGE_ROW_TEMPLATES) {
        if (tmpl.railSide) continue
        const trial = queue.map((q) => ({ ...q }))
        row = tryTemplateOnPrepared(trial, tmpl)
        if (row) {
          queue = trial
          templateUsed = tmpl
          break
        }
      }

      if (!row && queue.length) {
        const item = queue.shift()
        const slotIn = Math.min(12, Math.max(6, item.inches))
        const blockCode = suggestBlockForSlot(item.article, slotIn)
        row = [{ ...item, blockCode, slotIn, inches: blockInches(blockCode) }]
      }

      if (!row?.length) break

      for (const cell of row) {
        const idx = cell.origIdx ?? items.findIndex((it) => it.article === cell.article)
        if (idx === -1 || isUsed(idx)) continue
        const zone = cell.slotIn <= 4.01 && templateUsed?.railSide ? 'rail4' : 'main'
        if (zone === 'rail4' && templateUsed?.railSide) railSide = templateUsed.railSide
        pushCell(items[idx], idx, zone, cell.slotIn, cell.blockCode)
        if (zone === 'main') mainRowIndex += 1
      }
    }
  }

  let consumed = 0
  for (let i = 0; i < items.length; i++) {
    if (isUsed(i)) consumed = i + 1
    else break
  }

  return { cells, consumed }
}

/** tryTemplate for prepared queue items (with origIdx). */
function tryTemplateOnPrepared(queue, template) {
  const scratch = queue.map((item) => ({ ...item, used: false }))
  const picked = []

  for (const slotIn of template.slots) {
    let found = -1
    for (let i = 0; i < scratch.length; i++) {
      if (scratch[i].used) continue
      if (scratch[i].inches <= slotIn + 0.01) {
        found = i
        break
      }
    }
    if (found === -1) return null
    scratch[found].used = true
    const item = scratch[found]
    const blockCode = suggestBlockForSlot(item.article, slotIn)
    picked.push({
      ...item,
      blockCode,
      slotIn,
      inches: blockInches(blockCode),
    })
  }

  picked
    .map((p) => queue.findIndex((q) => q.article === p.article))
    .filter((i) => i >= 0)
    .sort((a, b) => b - a)
    .forEach((idx) => queue.splice(idx, 1))

  return picked
}

export function hydrateBroadsheetPlacements(placements = [], articles = []) {
  if (!placements.length) return placements
  if (placements.some((p) => p.layoutZone === 'rail4' || p.layoutZone === 'main')) {
    return placements
  }

  const hasBrief = placements.some(
    (p) => (BLOCK_META_IN[p.blockCode] || 4) <= 4.01
  )
  const hasWide = placements.some(
    (p) => (BLOCK_META_IN[p.blockCode] || 4) > 4.01
  )

  if (!hasBrief || !hasWide) return placements

  let mainRow = 0
  let seq = 0
  return placements.map((p) => {
    const in_ = BLOCK_META_IN[p.blockCode] || 4
    if (in_ <= 4.01) {
      return {
        ...p,
        layoutZone: 'rail4',
        layoutRailSide: 'left',
        layoutSlotInches: 4,
        layoutRowIndex: seq++,
        layoutMainRow: null,
      }
    }
    const row = {
      ...p,
      layoutZone: 'main',
      layoutRailSide: null,
      layoutSlotInches: Math.min(8, in_),
      layoutMainRow: mainRow,
      layoutRowIndex: seq++,
    }
    mainRow += 1
    return row
  })
}

export function placementsFromBroadsheetPack(cells, buildPlacementFn) {
  return (cells || []).map((cell) => {
    const p = buildPlacementFn(cell.article)
    return {
      ...p,
      blockCode: cell.blockCode || p.blockCode,
      layoutZone: cell.zone,
      layoutSlotInches: cell.slotIn,
      layoutRailSide: cell.railSide,
      layoutMainRow: cell.layoutMainRow,
      layoutRowIndex: cell.layoutRowIndex,
    }
  })
}

function packHeightPx(blockCode, article, laneWidthPx) {
  const nativeW = BLOCK_NATIVE_WIDTH_PX[blockCode] || 384
  const nativeH = estimateBlockNativeHeight(blockCode, article)
  const sc = laneWidthPx / nativeW
  return Math.max(64, Math.round(nativeH * sc * 1.06))
}

function distributeRailStackHeights(items, laneHeightPx, articles, stackGapPx) {
  if (!items.length) return []
  const weights = items.map((p) => {
    const article = articles.find((a) => a.id === p.articleId)
    return packHeightPx(p.blockCode, article, p._laneWidthPx || 200)
  })
  const sumW = weights.reduce((a, b) => a + b, 0) || 1
  const gapTotal = stackGapPx * Math.max(0, items.length - 1)
  const budget = Math.max(48, laneHeightPx - gapTotal)
  let heights = weights.map((w) => Math.max(48, Math.floor((w / sumW) * budget)))

  let diff = budget - heights.reduce((a, b) => a + b, 0)
  let guard = 0
  while (diff !== 0 && guard < budget + 50) {
    if (diff > 0) {
      const bi = heights.indexOf(Math.min(...heights))
      heights[bi] += 1
      diff -= 1
    } else {
      const bi = heights.indexOf(Math.max(...heights))
      if (heights[bi] <= 48) break
      heights[bi] -= 1
      diff += 1
    }
    guard += 1
  }

  return items.map((placement, i) => {
    const article = articles.find((a) => a.id === placement.articleId)
    const cellH = heights[i]
    const cellW = placement._laneWidthPx || 200
    const nativeW = BLOCK_NATIVE_WIDTH_PX[placement.blockCode] || 384
    const nativeH = estimateBlockNativeHeight(placement.blockCode, article)
    const sc = cellW / nativeW
    const contentH = Math.round(nativeH * sc)
    const words = Number(article?.wordCount || 0)
    const layoutTruncated = contentH > cellH + 4
    return {
      placement,
      article,
      cellW,
      heightPx: cellH,
      layoutTruncated,
      contentH,
      visibleWords: layoutTruncated ? estimateVisibleWords(article, cellH, contentH) : words,
      totalWords: words,
    }
  })
}

function cellMeta(p, article, cellW, cellH) {
  const nativeW = BLOCK_NATIVE_WIDTH_PX[p.blockCode] || 384
  const nativeH = estimateBlockNativeHeight(p.blockCode, article)
  const sc = cellW / nativeW
  const contentH = Math.round(nativeH * sc)
  const words = Number(article?.wordCount || 0)
  const layoutTruncated = contentH > cellH + 4
  return {
    placement: p,
    article,
    cellW,
    heightPx: cellH,
    layoutTruncated,
    contentH,
    visibleWords: layoutTruncated ? estimateVisibleWords(article, cellH, contentH) : words,
    totalWords: words,
  }
}

/** Canvas layout: main rows + optional 4in rail to footer. */
export function buildBroadsheetCanvasLayout({
  placements = [],
  articles = [],
  articleAreaH,
  totalWidthPx,
  rowWidthIn = BROADSHEET_ARTICLE_WIDTH_IN,
  layoutScale = 24,
}) {
  const colGutter = columnGutterPx(layoutScale)
  const stackGap = articleStackGapPx(layoutScale)

  const railPlacements = placements
    .filter((p) => p.layoutZone === 'rail4')
    .sort((a, b) => (a.layoutRowIndex ?? 0) - (b.layoutRowIndex ?? 0))
  const mainPlacements = placements.filter((p) => p.layoutZone !== 'rail4')

  const railSide = railPlacements[0]?.layoutRailSide || null
  const hasRail = railPlacements.length > 0 && railSide

  const railWidthPx = hasRail
    ? Math.max(48, Math.floor((totalWidthPx - colGutter) * (4 / rowWidthIn)))
    : 0
  const mainWidthPx = hasRail
    ? Math.max(96, totalWidthPx - colGutter - railWidthPx)
    : totalWidthPx

  railPlacements.forEach((p) => {
    p._laneWidthPx = railWidthPx
  })

  const railItems = hasRail
    ? distributeRailStackHeights(railPlacements, articleAreaH, articles, stackGap)
    : []

  const mainByRow = new Map()
  for (const p of mainPlacements) {
    const ri = Number(p.layoutMainRow) ?? 0
    if (!mainByRow.has(ri)) mainByRow.set(ri, [])
    mainByRow.get(ri).push(p)
  }

  const mainRowIndices = Array.from(mainByRow.keys()).sort((a, b) => a - b)
  const rawMainRows = mainRowIndices.map((ri) => {
    const rowPs = mainByRow.get(ri)
    const rowIn = rowPs.reduce((s, p) => s + (Number(p.layoutSlotInches) || BLOCK_META_IN[p.blockCode] || 4), 0)
    const maxH = rowPs.reduce((mx, p) => {
      const article = articles.find((a) => a.id === p.articleId)
      const slotIn = Number(p.layoutSlotInches) || BLOCK_META_IN[p.blockCode] || 4
      const cellW = Math.floor(mainWidthPx * (slotIn / Math.max(rowIn, rowWidthIn)))
      return Math.max(mx, packHeightPx(p.blockCode, article, cellW))
    }, 80)
    return { placements: rowPs, rowIn, heightPx: maxH }
  })

  const filledMain = distributeRowHeightsToFill(
    rawMainRows.map((r) => ({ placements: r.placements, heightPx: r.heightPx })),
    articleAreaH
  )

  const mainRows = filledMain.map((row) => {
    const rowPs = row.placements
    const rowIn = rowPs.reduce((s, p) => s + (Number(p.layoutSlotInches) || BLOCK_META_IN[p.blockCode] || 4), 0)
    const gutterTotal = colGutter * Math.max(0, rowPs.length - 1)
    const contentW = Math.max(1, mainWidthPx - gutterTotal)

    const cells = rowPs.map((p) => {
      const slotIn = Number(p.layoutSlotInches) || BLOCK_META_IN[p.blockCode] || 4
      const cellW =
        hasRail && rowPs.length === 1
          ? mainWidthPx
          : Math.max(48, Math.floor(contentW * (slotIn / Math.max(rowIn, 1))))
      const article = articles.find((a) => a.id === p.articleId)
      return cellMeta(p, article, cellW, row.heightPx)
    })

    return { heightPx: row.heightPx, cells, colGutter }
  })

  return {
    railSide,
    railWidthPx,
    mainWidthPx,
    railItems,
    mainRows,
    stackGap,
    colGutter,
  }
}

export { computeCanvasBlockScale }
