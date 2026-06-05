/**
 * Detect / fix broken BLOCK-08A column splits (empty col1, hoarding in col3).
 */

import { tokenizeWords } from './block08LineComposer'

export function columnWordCounts(columnTexts) {
  return (columnTexts || []).map((t) =>
    tokenizeWords(String(t || '')).length
  )
}

/**
 * @param {string[]} columnTexts
 * @param {{ totalWords?: number, hasHighlights?: boolean, hasCenterImage?: boolean }} ctx
 */
export function isBroken08ColumnLayout(columnTexts, ctx = {}) {
  const counts = columnWordCounts(columnTexts)
  const sum = counts.reduce((a, b) => a + b, 0)
  const total = ctx.totalWords ?? sum
  if (total < 32 || sum < 24) return false

  const hasHighlights = !!ctx.hasHighlights
  const hasCenterImage = !!ctx.hasCenterImage

  if (!hasHighlights) {
    const minCol0 = Math.max(10, Math.floor(total * 0.08))
    if (counts[0] < minCol0 && counts[1] + counts[2] > minCol0 + 12) return true
  }

  if (hasCenterImage && counts[1] < 8 && sum > 48) return true

  const minCenter = Math.max(20, Math.floor(total * 0.16))
  if (hasCenterImage && counts[1] < minCenter && counts[2] > Math.floor(total * 0.42)) {
    return true
  }

  const maxShare = Math.max(...counts) / Math.max(sum, 1)
  if (maxShare > 0.82 && counts[0] < 6) return true

  if (counts[2] > Math.floor(total * 0.48) && counts[0] < Math.floor(total * 0.14)) return true

  return false
}

/**
 * Word-slice fallback when partition leaves col1 empty or hoards one column.
 * Rebalances by measured column height when obstacles/widths are available.
 */
export function repairBroken08ColumnLayout(columnTexts, fullText, ctx = {}) {
  const cols = (columnTexts || []).map((t) => String(t || ''))
  if (!fullText?.trim() || !isBroken08ColumnLayout(cols, ctx)) return cols

  const words = tokenizeWords(fullText)
  const n = words.length
  if (n < 20) return cols

  const hasHighlights = !!ctx.hasHighlights
  const hasCenterImage = !!ctx.hasCenterImage
  const c0 = Math.max(10, Math.floor(n * (hasHighlights ? 0.28 : hasCenterImage ? 0.3 : 0.32)))
  const c1 = Math.max(12, Math.floor(n * (hasCenterImage ? 0.3 : 0.34)))
  let next = [
    words.slice(0, c0).join(' '),
    words.slice(c0, c0 + c1).join(' '),
    words.slice(c0 + c1).join(' '),
  ]

  const { obstacles, widths, flowOpts } = ctx
  if (obstacles?.length >= 3 && widths?.length >= 3 && typeof ctx.rebalance === 'function') {
    next = ctx.rebalance(next, obstacles, widths, flowOpts || {})
  }

  return next
}
