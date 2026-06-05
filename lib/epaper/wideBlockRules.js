/**
 * BLOCK-06A / BLOCK-08A — wide story rules + pick 06 vs 08 when copy exceeds BLOCK-04A.
 */

import { BLOCK_04A_ARTICLE_FIT } from './block04LockedRules'
import {
  BLOCK_06A_ARTICLE_FIT as BLOCK_06A_ARTICLE_FIT_LOCKED,
  BLOCK_06A_DIMENSIONS as BLOCK_06A_DIM_LOCKED,
  BLOCK_06A_IMAGE as BLOCK_06A_IMAGE_LOCKED,
  BLOCK_06A_RULES_VERSION,
} from './block06LockedRules'

export { BLOCK_06A_RULES_VERSION }
/** Frozen — see lib/epaper/BLOCK_08A_LOCKED.md */
export const BLOCK_08A_RULES_VERSION = '2026-05-22.2-locked'

export const BLOCK_06A_DIMENSIONS = {
  code: BLOCK_06A_DIM_LOCKED.code,
  widthMm: BLOCK_06A_DIM_LOCKED.widthMm,
  gutterMm: BLOCK_06A_DIM_LOCKED.gutterMm,
  columnGapMm: 2,
  columns: BLOCK_06A_DIM_LOCKED.columns,
  nativeWidthPx: BLOCK_06A_DIM_LOCKED.nativeWidthPx,
}

const MM_TO_PX = 96 / 25.4

/** 7.5-inch rail (title + 3-column body). */
export const BLOCK_08A_WIDTH_MM = 190.5
export const BLOCK_08A_WIDTH_IN = 7.5

export const BLOCK_08A_DIMENSIONS = {
  code: 'BLOCK-08A',
  widthMm: BLOCK_08A_WIDTH_MM,
  gutterMm: 2,
  /** Space between columns (newspaper column gutter). */
  columnGapMm: 2,
  columns: 3,
  nativeWidthPx: Math.floor(BLOCK_08A_WIDTH_MM * MM_TO_PX),
}

/** Title on 7.5in rail: fewer words → larger type; never below 35px. */
export const BLOCK_08A_TITLE = {
  widthMm: BLOCK_08A_WIDTH_MM,
  minPx: 35,
  maxPx: 58,
  maxLines: 3,
  /** Short title → largest size on one line; long → 2–3 lines, all inside 7.5in */
  fillWidthWhenShort: true,
}

/** Title on 6in rail — same policy as BLOCK-08A, scaled to 6in width. */
export const BLOCK_06A_TITLE = {
  widthMm: BLOCK_06A_DIMENSIONS.widthMm,
  minPx: 35,
  maxPx: 58,
  maxLines: 3,
  fillWidthWhenShort: true,
}

/** Photo frames for BLOCK-06A (2-col) — locked caps in block06LockedRules.js */
export const BLOCK_06A_IMAGE = {
  primaryMaxHeightPx: BLOCK_06A_IMAGE_LOCKED.primaryMaxHeightPx,
  primaryAspect: 4 / 3,
  secondaryMaxHeightPx: 128,
  minHeightPx: 72,
  primaryHeightPx: BLOCK_06A_IMAGE_LOCKED.primaryMaxHeightPx,
  secondaryHeightPx: 128,
  widthPct: 1,
  maxWidthPct: 1,
  captionLinePx: BLOCK_06A_IMAGE_LOCKED.captionLinePx,
  gapBelowPx: BLOCK_06A_IMAGE_LOCKED.gapBelowPx,
}

export function block06ImageObstaclePx(role = 'primary', hasCaption = false, frameHeightPx = 0) {
  const fallback =
    role === 'secondary' || role === 'compact'
      ? BLOCK_06A_IMAGE.secondaryMaxHeightPx
      : BLOCK_06A_IMAGE.primaryMaxHeightPx
  const frame = frameHeightPx > 0 ? Math.round(frameHeightPx) : fallback
  return frame + BLOCK_06A_IMAGE.gapBelowPx + (hasCaption ? BLOCK_06A_IMAGE.captionLinePx : 0)
}

export const BLOCK_06A_ARTICLE_FIT = { ...BLOCK_06A_ARTICLE_FIT_LOCKED }

export const BLOCK_08A_ARTICLE_FIT = {
  label: '7.5in · 3 col',
  wordsMin: 155,
  wordsMax: 380,
  charsMax: 9000,
  heightIn: 8,
}

/** 12-inch lead rail (title + 4-column body, up to 6 photos). */
export const BLOCK_12A_WIDTH_MM = 304.8

export const BLOCK_12A_DIMENSIONS = {
  code: 'BLOCK-12A',
  widthMm: BLOCK_12A_WIDTH_MM,
  gutterMm: 2,
  columnGapMm: 2,
  columns: 4,
  nativeWidthPx: Math.floor(BLOCK_12A_WIDTH_MM * MM_TO_PX),
  maxImages: 6,
}

/** Title rail — inner width after left/right gutters (matches CSS padding). */
export const BLOCK_12A_CONTENT_RAIL_PX = Math.floor(
  (BLOCK_12A_WIDTH_MM - BLOCK_12A_DIMENSIONS.gutterMm * 2) * MM_TO_PX
)

export const BLOCK_12A_TITLE = {
  widthMm: BLOCK_12A_WIDTH_MM,
  minPx: 35,
  maxPx: 58,
  maxLines: 3,
  fillWidthWhenShort: true,
}

export const BLOCK_12A_IMAGE = {
  primaryMaxHeightPx: 192,
  primaryAspect: 4 / 3,
  secondaryMaxHeightPx: 128,
  stackMaxHeightPx: 112,
  minHeightPx: 72,
  primaryHeightPx: 192,
  secondaryHeightPx: 128,
  widthPct: 1,
  maxWidthPct: 1,
  captionLinePx: 16,
  gapBelowPx: 4,
}

export function block12ImageObstaclePx(role = 'primary', hasCaption = false, frameHeightPx = 0) {
  const fallback =
    role === 'stack' || role === 'compact' || role === 'secondary'
      ? BLOCK_12A_IMAGE.stackMaxHeightPx
      : BLOCK_12A_IMAGE.primaryMaxHeightPx
  const frame = frameHeightPx > 0 ? Math.round(frameHeightPx) : fallback
  return frame + BLOCK_12A_IMAGE.gapBelowPx + (hasCaption ? BLOCK_12A_IMAGE.captionLinePx : 0)
}

export const BLOCK_12A_ARTICLE_FIT = {
  label: '12in · 4 col',
  wordsMin: 280,
  wordsMax: 9999,
  charsMax: 20000,
  heightIn: 12,
}

/**
 * Fixed image frames in BLOCK-08A — predictable obstacle for 3-col text flow.
 * (Quark/InDesign: photo box height locked; crop inside box.)
 */
export const BLOCK_08A_IMAGE = {
  /** Max frame height (actual height = aspect-fit, never above this) */
  primaryMaxHeightPx: 192,
  primaryAspect: 4 / 3,
  secondaryMaxHeightPx: 128,
  minHeightPx: 72,
  /** @deprecated use primaryMaxHeightPx — kept for callers */
  primaryHeightPx: 192,
  secondaryHeightPx: 128,
  widthPct: 1,
  maxWidthPct: 1,
  captionLinePx: 16,
  gapBelowPx: 4,
}

/** Total vertical space reserved above text (frame + caption + gap). */
export function block08ImageObstaclePx(role = 'primary', hasCaption = false, frameHeightPx = 0) {
  const fallback =
    role === 'secondary' || role === 'compact'
      ? BLOCK_08A_IMAGE.secondaryMaxHeightPx
      : BLOCK_08A_IMAGE.primaryMaxHeightPx
  const frame = frameHeightPx > 0 ? Math.round(frameHeightPx) : fallback
  return frame + BLOCK_08A_IMAGE.gapBelowPx + (hasCaption ? BLOCK_08A_IMAGE.captionLinePx : 0)
}

/** True when article exceeds BLOCK-04A word or character band. */
export function exceedsBlock04A(wordCount, charCount = 0) {
  const w = Number(wordCount) || 0
  const c = Number(charCount) || 0
  if (w > BLOCK_04A_ARTICLE_FIT.wordsMax) return true
  if (c > 0 && c > BLOCK_04A_ARTICLE_FIT.charsMax) return true
  return false
}

/**
 * Pick BLOCK-06A vs BLOCK-08A after copy no longer fits BLOCK-04A.
 * @returns {'BLOCK-06A'|'BLOCK-08A'}
 */
export function decide06Or08Block(wordCount, charCount = 0, imageCount = 0) {
  const w = Number(wordCount) || 0
  const c = Number(charCount) || 0
  const img = Number(imageCount) || 0

  let score08 = 0
  if (w >= BLOCK_08A_ARTICLE_FIT.wordsMin) score08 += 3
  else if (w >= 180) score08 += 2
  if (c >= 4200) score08 += 3
  else if (c >= 3600) score08 += 2
  if (img >= 1) score08 += 2
  if (img >= 2) score08 += 2
  if (w >= BLOCK_06A_ARTICLE_FIT.wordsMax) score08 += 2
  if (c > BLOCK_06A_ARTICLE_FIT.charsMax * 0.85) score08 += 2

  return score08 >= 4 ? 'BLOCK-08A' : 'BLOCK-06A'
}

/** Suggest wide block when over 04A; otherwise null (caller keeps 04A). */
export function suggestWideBlockAfter04A(wordCount, charCount = 0, imageCount = 0) {
  if (!exceedsBlock04A(wordCount, charCount)) return null
  return decide06Or08Block(wordCount, charCount, imageCount)
}

export function buildBlock08StyleRulesDoc() {
  return [
    {
      rule: 1,
      text: '**7.5in title:** never outside rail · **35–58px** · few words → **one line, big font** · long → **2 or 3 lines** inside 7.5in.',
    },
    {
      rule: 2,
      text: '**Col1:** highlight points top (only if article has points) → body. **Col2:** image top → body continues. **Col3:** 2nd image top + body if 2 photos; else body from top (no image). Thread col1→col2→col3; **all 3 bottoms same depth** (obstacle + text).',
    },
    {
      rule: 3,
      text: `Auto: copy over BLOCK-04A (${BLOCK_04A_ARTICLE_FIT.wordsMax}w / ${BLOCK_04A_ARTICLE_FIT.charsMax}c) → BLOCK-06A or BLOCK-08A by length, chars, images.`,
    },
    {
      rule: 4,
      text: `Fit band: ${BLOCK_08A_ARTICLE_FIT.wordsMin}–${BLOCK_08A_ARTICLE_FIT.wordsMax} words, ≤${BLOCK_08A_ARTICLE_FIT.charsMax} chars.`,
    },
  ]
}
