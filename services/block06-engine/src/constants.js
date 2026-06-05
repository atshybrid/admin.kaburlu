/**
 * BLOCK-06A locked dimensions & typography (production spec).
 * Frozen — see ../../lib/epaper/BLOCK_06A_LOCKED.md and block06LockedRules.js
 */

const MM_PER_IN = 25.4
const PX_PER_MM = 96 / MM_PER_IN

/** Bump only with explicit approval; must match block06LockedRules.js */
export const BLOCK_06A_LOCKED = true
export const BLOCK_06A_ENGINE_VERSION = 'threaded-v3.4'

export const BLOCK_06A = {
  code: 'BLOCK-06A',
  widthMm: 152.4,
  widthIn: 6,
  maxHeightMm: 254,
  maxHeightIn: 10,
  gutterMm: 2,
  padTopMm: 2,
  padBottomMm: 5,
  columnGapPx: 16,
  minWords: 150,
  maxWords: 300,
  maxHighlights: 2,
  maxImages: 1,
  titleMaxLines: 3,
  titleMinPx: 35,
  titleMaxPx: 58,
  subtitleSizeRatio: 0.5,
  bodyFontPx: 11,
  bodyLinePx: 14,
  headlineFontPx: 12.5,
  headlineLinePx: 14,
  imageMaxHeightPx: 192,
  imageGapBelowPx: 4,
  highlightPadMm: 8,
}

export function mmToPx(mm) {
  return mm * PX_PER_MM
}

export function contentWidthMm() {
  return BLOCK_06A.widthMm - BLOCK_06A.gutterMm * 2
}

export function columnWidthMm() {
  const inner = contentWidthMm()
  const gapMm = (BLOCK_06A.columnGapPx / 96) * MM_PER_IN
  return (inner - gapMm) / 2
}

export const IN_MEMORY_TEMPLATE = {
  block_code: BLOCK_06A.code,
  width_mm: BLOCK_06A.widthMm,
  max_height_mm: BLOCK_06A.maxHeightMm,
  min_words: BLOCK_06A.minWords,
  max_words: BLOCK_06A.maxWords,
  column_count: 2,
  column_gap_px: BLOCK_06A.columnGapPx,
  body_font_px: BLOCK_06A.bodyFontPx,
  body_line_px: BLOCK_06A.bodyLinePx,
}
