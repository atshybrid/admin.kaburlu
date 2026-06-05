/**
 * Telugu daily inner page — 4/12 brief rail (left) + 8/12 main stories (right).
 * Matches editorial reference PDFs (Telugu Prabha style): ~3–4 briefs left,
 * 1–2 main stories right per page — NOT dozens of clipped briefs.
 */

import { MAX_EPAPER_PAGES, estimateBlockNativeHeight, BLOCK_META_IN } from './collectNewsLayout'

/** Max layout slots per inner page (~3 briefs + 1 main, or 2 mains). */
export const BROADSHEET_INNER_SLOT_CAPACITY = 8

const BLOCK_NATIVE_WIDTH_PX = {
  'BLOCK-04A': 384,
  'BLOCK-06A': 576,
  'BLOCK-08A': 720,
  'BLOCK-09A': 864,
  'BLOCK-12A': 1153,
  'BLOCK-03A': 288,
  'BLOCK-02A': 192,
}

export function estimateSlots(blockCode) {
  const code = String(blockCode || '')
  if (code === 'BLOCK-12A') return 6
  if (code === 'BLOCK-09A') return 5
  if (code === 'BLOCK-08A') return 4
  if (code === 'BLOCK-06A') return 3
  if (code === 'BLOCK-04A') return 2
  if (code === 'BLOCK-03A' || code === 'BLOCK-02A') return 1
  return 2
}

/** Editorial lane + block (matches design.js assignFourEightBlock). */
export function assignFourEightBlock(article) {
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

  if (isLead) {
    if (imgCount >= 1 && words > 200) return { lane: 'right', blockCode: 'BLOCK-12A' }
    return { lane: 'right', blockCode: 'BLOCK-08A' }
  }
  if (words < 130 && imgCount <= 1) {
    return { lane: 'left', blockCode: 'BLOCK-04A' }
  }
  if (words < 260) {
    return {
      lane: 'right',
      blockCode: imgCount >= 1 ? 'BLOCK-08A' : 'BLOCK-06A',
    }
  }
  if (words < 450) {
    return { lane: 'right', blockCode: 'BLOCK-08A' }
  }
  return { lane: 'right', blockCode: imgCount >= 1 ? 'BLOCK-12A' : 'BLOCK-08A' }
}

function packHeightPx(blockCode, article, laneWidthPx) {
  const nativeW = BLOCK_NATIVE_WIDTH_PX[blockCode] || 384
  const nativeH = estimateBlockNativeHeight(blockCode, article)
  const sc = laneWidthPx / nativeW
  return Math.max(72, Math.round(nativeH * sc * 1.05))
}

export function partitionFourEight(placements = []) {
  const left = []
  const right = []
  for (const p of placements) {
    if (p.layoutLane === 'left' || p.layoutZone === 'rail4') {
      left.push(p)
      continue
    }
    if (p.layoutLane === 'right' || p.layoutZone === 'main') {
      right.push(p)
      continue
    }
    const in_ = BLOCK_META_IN[p.blockCode] || 4
    if (in_ <= 4.01) left.push(p)
    else right.push(p)
  }
  return { left, right }
}

/** Split lane height by content weight (headline+body estimate), fill column to footer. */
export function distributeFourEightLaneHeights(placements, laneWidthPx, totalH, articles = [], minRow = 72) {
  if (!placements.length) return []
  const weights = placements.map((p) => {
    const article = articles.find((a) => a.id === p.articleId)
    return packHeightPx(p.blockCode, article, laneWidthPx)
  })
  const sumW = weights.reduce((a, b) => a + b, 0) || 1
  const out = weights.map((w) => Math.max(minRow, Math.floor((w / sumW) * totalH)))

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

export function buildPages(count) {
  return Array.from({ length: Math.max(1, Number(count) || 1) }, (_, idx) => ({
    id: idx + 1,
    placements: [],
  }))
}

/**
 * Paginate articles P2+ into 4+8 lanes with slot budget per page.
 * Spills to next page when slot capacity exceeded (like real daily).
 */
export function paginateFourEightPages(
  articles,
  {
    pageCount = 8,
    buildPlacementFn,
    maxSlotsPerPage = BROADSHEET_INNER_SLOT_CAPACITY,
    startPageIndex = 1,
  } = {}
) {
  const totalPages = Math.min(MAX_EPAPER_PAGES, Math.max(2, Number(pageCount) || 8))
  const pages = buildPages(totalPages)
  if (!articles?.length || !buildPlacementFn) return pages

  let pageIdx = Math.max(1, startPageIndex)
  let slotUsed = 0

  for (const article of articles) {
    const { lane, blockCode } = assignFourEightBlock(article)
    const need = estimateSlots(blockCode)

    if (pageIdx >= totalPages) break

    if (slotUsed + need > maxSlotsPerPage && (pages[pageIdx]?.placements?.length || 0) > 0) {
      pageIdx += 1
      slotUsed = 0
    }
    if (pageIdx >= totalPages) break

    pages[pageIdx].placements.push({
      ...buildPlacementFn(article),
      blockCode,
      layoutLane: lane,
    })
    slotUsed += need
  }

  return pages
}

/** Assign one page bucket (respects API page order, slot cap per page). */
export function packFourEightPageBucket(articles, buildPlacementFn, maxSlotsPerPage = BROADSHEET_INNER_SLOT_CAPACITY) {
  const placements = []
  let slotUsed = 0

  for (const article of articles || []) {
    const { lane, blockCode } = assignFourEightBlock(article)
    const need = estimateSlots(blockCode)
    if (slotUsed + need > maxSlotsPerPage && placements.length > 0) break
    placements.push({
      ...buildPlacementFn(article),
      blockCode,
      layoutLane: lane,
    })
    slotUsed += need
  }

  return { placements, consumed: placements.length }
}
