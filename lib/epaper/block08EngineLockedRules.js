/**
 * BLOCK-08A server engine spec (8in · 3 col) — matches services/block08-engine.
 * React Block08Article.jsx may still use 7.5in rail until aligned; this is the Node engine truth.
 */

export const BLOCK_08A_ENGINE_LOCKED = true
export const BLOCK_08A_ENGINE_VERSION = 'threaded-v1.0'

export const BLOCK_08A_ENGINE_DIMENSIONS = {
  code: 'BLOCK-08A',
  label: '8-inch · 3 column',
  widthMm: 203.2,
  widthIn: 8,
  maxHeightMm: 254,
  columnCount: 3,
  columnGapPx: 16,
  nativeWidthPx: 768,
}

export const BLOCK_08A_ENGINE_LAYOUT = {
  column1: ['highlights', 'body_start'],
  column2: ['image_primary_192px', 'body_continue'],
  column3: ['image_secondary_128px', 'body_continue'],
  styleParity: 'BLOCK-06A',
}

export const BLOCK_08A_ENGINE_ARTICLE_FIT = {
  wordsMin: 180,
  wordsMax: 380,
  maxHighlights: 2,
  maxImages: 2,
}
