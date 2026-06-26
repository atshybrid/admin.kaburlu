/**
 * BLOCK-08A — 8in rail · 3 columns (06A-style threaded flow).
 * Col1: highlights → text · Col2: image1 → text · Col3: image2 → text
 */

const MM_PER_IN = 25.4
const PX_PER_MM = 96 / MM_PER_IN

export const BLOCK_08A_LOCKED = true
export const BLOCK_08A_ENGINE_VERSION = 'threaded-v1.9'

export const BLOCK_08A = {
  code: 'BLOCK-08A',
  widthMm: 203.2,
  widthIn: 8,
  maxHeightMm: 254,
  maxHeightIn: 10,
  gutterMm: 2,
  padTopMm: 2,
  padBottomMm: 5,
  columnGapPx: 16,
  columnCount: 3,
  minWords: 180,
  maxWords: 380,
  maxHighlights: 2,
  maxImages: 2,
  titleMaxLines: 3,
  titleMinPx: 35,
  titleMaxPx: 58,
  subtitleSizeRatio: 0.5,
  bodyFontPx: 11,
  bodyLinePx: 14,
  headlineFontPx: 12.5,
  headlineLinePx: 14,
  imagePrimaryMaxHeightPx: 192,
  imageSecondaryMaxHeightPx: 128,
  imageGapBelowPx: 4,
}

export function mmToPx(mm) {
  return mm * PX_PER_MM
}

export function contentWidthMm() {
  return BLOCK_08A.widthMm - BLOCK_08A.gutterMm * 2
}

export function columnWidthMm() {
  const inner = contentWidthMm()
  const gapMm = (BLOCK_08A.columnGapPx / 96) * MM_PER_IN
  return (inner - gapMm * 2) / 3
}

export const IN_MEMORY_TEMPLATE = {
  block_code: BLOCK_08A.code,
  width_mm: BLOCK_08A.widthMm,
  max_height_mm: BLOCK_08A.maxHeightMm,
  min_words: BLOCK_08A.minWords,
  max_words: BLOCK_08A.maxWords,
  column_count: BLOCK_08A.columnCount,
  column_gap_px: BLOCK_08A.columnGapPx,
  body_font_px: BLOCK_08A.bodyFontPx,
  body_line_px: BLOCK_08A.bodyLinePx,
}
