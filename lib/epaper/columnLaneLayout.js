/**
 * Inner page layout — 4+4+6 columns, stories stacked per lane.
 * Pack heights use modest estimates; DOM measures real overflow for red ruler.
 */

import {
  articleStackGapPx,
  buildRowsFromPlacements,
  columnGutterPx,
  estimateBlockNativeHeight,
  getLaneWidthsIn,
} from './collectNewsLayout'

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

/** Modest pack estimate (DOM may be taller — overflow detected in UI). */
function packHeightPx(blockCode, article, laneWidthPx) {
  const nativeW = BLOCK_NATIVE_WIDTH_PX[blockCode] || 384
  const nativeH = estimateBlockNativeHeight(blockCode, article)
  const sc = laneWidthPx / nativeW
  return Math.max(64, Math.round(nativeH * sc * 1.06))
}

export function scaledContentHeight(blockCode, article, laneWidthPx) {
  const nativeW = BLOCK_NATIVE_WIDTH_PX[blockCode] || 384
  const nativeH = estimateBlockNativeHeight(blockCode, article)
  return { nativeW, nativeH, scale: laneWidthPx / nativeW }
}

export { articleStackGapPx, columnGutterPx, getLaneWidthsIn }

export function placementsToColumnLanes(placements, rowWidthIn = 14) {
  const rows = buildRowsFromPlacements(placements, rowWidthIn)
  const laneWidthsIn = getLaneWidthsIn(rowWidthIn)
  const lanes = laneWidthsIn.map(() => [])

  for (const row of rows) {
    row.forEach((placement, ci) => {
      if (ci < lanes.length) lanes[ci].push(placement)
    })
  }

  return { lanes, laneWidthsIn }
}

export function estimateVisibleWords(article, cellH, contentH) {
  const words = Number(article?.wordCount || 0)
  if (!words || !contentH || contentH <= cellH) return words
  const frac = Math.min(0.98, cellH / contentH)
  return Math.max(1, Math.floor(words * frac))
}

export function distributeLaneStackHeights(placements, laneWidthPx, laneHeightPx, articles = [], stackGapPx = 8) {
  const items = (placements || []).map((placement) => {
    const article = articles.find((a) => a.id === placement.articleId)
    const packH = packHeightPx(placement.blockCode, article, laneWidthPx)
    const { nativeH, scale } = scaledContentHeight(placement.blockCode, article, laneWidthPx)
    const contentH = Math.round(nativeH * scale)
    return { placement, article, packH, contentH }
  })

  if (!items.length) return { visible: [] }

  const visible = []
  let used = 0

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const gap = visible.length > 0 ? stackGapPx : 0
    const remaining = laneHeightPx - used - gap
    const words = Number(item.article?.wordCount || 0)

    if (remaining < 40) break

    if (item.packH <= remaining) {
      visible.push({
        placement: item.placement,
        article: item.article,
        heightPx: item.packH,
        layoutTruncated: false,
        contentH: item.contentH,
        visibleWords: words,
        totalWords: words,
      })
      used += gap + item.packH
      continue
    }

    const cellH = Math.max(48, remaining)
    visible.push({
      placement: item.placement,
      article: item.article,
      heightPx: cellH,
      layoutTruncated: true,
      contentH: item.contentH,
      visibleWords: estimateVisibleWords(item.article, cellH, item.contentH),
      totalWords: words,
    })
    used = laneHeightPx
    break
  }

  return { visible }
}

export function buildColumnLaneLayout({
  placements = [],
  articleAreaH,
  totalWidthPx,
  rowWidthIn = 14,
  articles = [],
  layoutScale = 24,
}) {
  const { lanes, laneWidthsIn } = placementsToColumnLanes(placements, rowWidthIn)
  const colGutter = columnGutterPx(layoutScale)
  const stackGap = articleStackGapPx(layoutScale)
  const gutterTotal = colGutter * Math.max(0, lanes.length - 1)
  const contentW = Math.max(1, totalWidthPx - gutterTotal)
  const sumIn = laneWidthsIn.reduce((a, b) => a + b, 0) || 1

  return {
    lanes: lanes.map((lanePlacements, li) => {
      const widthPx = Math.max(48, Math.floor(contentW * (laneWidthsIn[li] / sumIn)))
      const { visible: laneItems } = distributeLaneStackHeights(
        lanePlacements,
        widthPx,
        articleAreaH,
        articles,
        stackGap
      )
      return {
        laneIndex: li,
        widthPx,
        laneInches: laneWidthsIn[li],
        items: Array.isArray(laneItems) ? laneItems : [],
        stackGapPx: stackGap,
      }
    }),
  }
}
