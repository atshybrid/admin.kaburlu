/**
 * BLOCK-08A — stable word-share threading (same rules for every article).
 * Used when measure-space flow leaves empty columns or uneven bottoms.
 */

import { measureColumnSpread } from './block08CrossColumnFlow'
import { tokenizeWords } from './block08LineComposer'
import { isBroken08ColumnLayout } from './block08LayoutGuard'

const COLUMN_COUNT = 3
const CENTER_COL = 1

function centerColumnHasImage(obstacles) {
  return (obstacles[CENTER_COL] || 0) >= 96
}

function col3HasTopImage(obstacles) {
  return (obstacles[2] || 0) >= 80
}

/**
 * Fixed editorial word shares — col1 highlights/body, col2 image+body, col3 image or body.
 */
export function threadBlock08ByStableShares(fullText, obstacles, widths, opts = {}) {
  const words = tokenizeWords(String(fullText || ''))
  const n = words.length
  if (!n) return ['', '', '']

  const hasHighlights = !!opts.hasHighlights
  const hasCenter = centerColumnHasImage(obstacles)
  const hasCol3Img = col3HasTopImage(obstacles)

  let s0 = hasHighlights ? 0.26 : 0.28
  let s1 = hasCenter ? 0.32 : 0.34
  let s2 = hasCol3Img ? 0.24 : 1 - s0 - s1

  if (s2 < 0.22) {
    s2 = 0.22
    s1 = Math.max(0.24, 1 - s0 - s2)
  }

  const sum = s0 + s1 + s2
  s0 /= sum
  s1 /= sum
  s2 /= sum

  const c0 = Math.max(hasHighlights ? 10 : 8, Math.floor(n * s0))
  const c1 = Math.max(hasCenter ? 14 : 10, Math.floor(n * s1))
  const end1 = Math.min(n, c0 + c1)

  return [
    words.slice(0, c0).join(' '),
    words.slice(c0, end1).join(' '),
    words.slice(end1).join(' '),
  ]
}

/**
 * @param {string[]} columnTexts
 * @param {object} ctx — same fields as isBroken08ColumnLayout + obstacles/widths/flowOpts
 */
export function needsBlock08DeterministicRepair(columnTexts, ctx = {}) {
  const { obstacles, widths, flowOpts } = ctx
  if (obstacles?.length >= 3 && widths?.length >= 3) {
    const spread = measureColumnSpread(columnTexts, obstacles, widths, flowOpts || {})
    if (spread > 18) return true
  }
  return isBroken08ColumnLayout(columnTexts, ctx)
}
