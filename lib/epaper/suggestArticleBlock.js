/**
 * Word / points / title-aware block picker for inner pages.
 * <200w + no points → max BLOCK-04A (4-col rail).
 */

import { coerceToActiveBlockCode } from './epaperActiveBlocks'
import { peekArticleContentSignals } from './articleToBlockProps'
import {
  exceedsBlock04A,
  decide06Or08Block,
} from './wideBlockRules'

const BLOCK_IN = {
  'BLOCK-TOP8x7': 8,
  'BLOCK-02A': 2,
  'BLOCK-03A': 3,
  'BLOCK-04A': 4,
  'BLOCK-06A': 6,
  'BLOCK-08A': 7.5,
  'BLOCK-09A': 9,
  'BLOCK-12A': 12,
}

function articleWords(article) {
  return Number(article?.wordCount || 0)
}

function articleChars(article) {
  const c = Number(article?.charCount || article?.characterCount || 0)
  if (c > 0) return c
  const w = articleWords(article)
  return w > 0 ? Math.round(w * 5.8) : 0
}

function isLeadArticle(article) {
  const isBreaking = !!(article?.isBreaking || article?.breaking)
  const isFeatured = !!(article?.isFeatured || article?.featured)
  const isHighPrio = ['HIGH', 'URGENT', 'TOP'].includes(
    String(article?.priority || article?.importance || '').toUpperCase()
  )
  return isBreaking || isFeatured || isHighPrio
}

/** Best block for article content (ignores API-assigned oversized codes). */
export function suggestArticleBlock(article) {
  if (!article) return 'BLOCK-04A'

  const words = articleWords(article)
  const chars = articleChars(article)
  const signals = peekArticleContentSignals(article)
  const hasPoints = signals.hasPoints
  const pointCount = signals.pointCount || 0
  const imgCount = signals.imageCount || 0

  if (isLeadArticle(article)) {
    if (imgCount >= 1 || words >= 280) return 'BLOCK-12A'
    return 'BLOCK-08A'
  }

  // Small copy, no points → stay on 4-col (or 3-col brief) rail
  if (words < 200 && !hasPoints) {
    if (words < 35 && imgCount === 0) return 'BLOCK-03A'
    return 'BLOCK-04A'
  }

  // Points need multi-column body (06A / 08A)
  if (hasPoints) {
    if (words >= 220 || pointCount >= 5 || imgCount >= 2) return 'BLOCK-08A'
    return 'BLOCK-06A'
  }

  if (words < 220) {
    if (!exceedsBlock04A(words, chars)) return 'BLOCK-04A'
    return decide06Or08Block(words, chars, imgCount)
  }

  if (words < 400) {
    return imgCount >= 2 ? 'BLOCK-12A' : 'BLOCK-08A'
  }

  return imgCount >= 1 ? 'BLOCK-12A' : 'BLOCK-08A'
}

/** Pick block that fits slot width without upsizing beyond content needs. */
export function suggestBlockForSlot(article, slotInches) {
  const ideal = suggestArticleBlock(article)
  const idealIn = BLOCK_IN[ideal] || 4
  if (idealIn <= slotInches + 0.01) return ideal

  const fit = Object.entries(BLOCK_IN)
    .filter(([, w]) => w <= slotInches + 0.01)
    .sort((a, b) => b[1] - a[1])

  if (fit.length) {
    const capped = fit[0][0]
    const cappedIn = fit[0][1]
    // Never upsize a small article into a wide block just because slot is wide
    if (cappedIn > idealIn + 0.01) return ideal
    return capped
  }
  return ideal
}

/** Normalize API / saved block code against content. */
export function resolveArticleBlockCode(article, preferredCode = null) {
  const ideal = suggestArticleBlock(article)
  if (!preferredCode) return coerceToActiveBlockCode(ideal, 'BLOCK-04A')

  const preferred = coerceToActiveBlockCode(preferredCode, ideal)
  const idealIn = BLOCK_IN[ideal] || 4
  const prefIn = BLOCK_IN[preferred] || 4

  if (prefIn > idealIn + 0.01) return coerceToActiveBlockCode(ideal, 'BLOCK-04A')
  return preferred
}
