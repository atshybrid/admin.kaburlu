/**
 * BLOCK-12A — 12in rail · max 21in height · 4 columns (08A-style threaded flow).
 * Col1: highlights → text
 * Col2–4: image1–3 top → text each
 * Bottom: remaining images (4–16) in 4-column gallery across cols 1–4
 */

const MM_PER_IN = 25.4
const PX_PER_MM = 96 / MM_PER_IN

export const BLOCK_12A_LOCKED = true
export const BLOCK_12A_ENGINE_VERSION = 'threaded-v1.4'

export const BLOCK_12A = {
  code: 'BLOCK-12A',
  widthMm: 12 * MM_PER_IN,
  widthIn: 12,
  maxHeightMm: 21 * MM_PER_IN,
  maxHeightIn: 21,
  gutterMm: 3,
  padTopMm: 3,
  padBottomMm: 6,
  columnGapPx: 14,
  columnCount: 4,
  minWords: 300,
  maxWords: 750,
  maxHighlights: 4,
  maxImages: 16,
  maxColumnTopImages: 3,
  maxBottomImages: 13,
  titleMaxLines: 3,
  titleMinPx: 32,
  titleMaxPx: 64,
  subtitleSizeRatio: 0.48,
  bodyFontPx: 10.5,
  bodyLinePx: 13.5,
  headlineFontPx: 11.5,
  headlineLinePx: 13,
  /** width:height = 4:3 — height derived from column width (smart-object box) */
  imageTopAspectW: 4,
  imageTopAspectH: 3,
  imageGapBelowPx: 4,
  bottomThumbHeightPx: 118,
  bottomThumbGapPx: 6,
  bottomGalleryPadMm: 4,
}

export function mmToPx(mm) {
  return mm * PX_PER_MM
}

export function contentWidthMm() {
  return BLOCK_12A.widthMm - BLOCK_12A.gutterMm * 2
}

export function columnWidthMm() {
  const inner = contentWidthMm()
  const gapMm = (BLOCK_12A.columnGapPx / 96) * MM_PER_IN
  return (inner - gapMm * 3) / 4
}

/** Top image box height from column width (cols 2–4 same size). */
export function columnTopImageHeightPx() {
  const colPx = mmToPx(columnWidthMm())
  return Math.round((colPx * BLOCK_12A.imageTopAspectH) / BLOCK_12A.imageTopAspectW)
}

export const IN_MEMORY_TEMPLATE = {
  block_code: BLOCK_12A.code,
  width_mm: BLOCK_12A.widthMm,
  max_height_mm: BLOCK_12A.maxHeightMm,
  min_words: BLOCK_12A.minWords,
  max_words: BLOCK_12A.maxWords,
  column_count: BLOCK_12A.columnCount,
  column_gap_px: BLOCK_12A.columnGapPx,
  body_font_px: BLOCK_12A.bodyFontPx,
  body_line_px: BLOCK_12A.bodyLinePx,
}
