/**
 * BLOCK-06A — LOCKED specification (threaded 2-column engine).
 * Do not change layout behaviour without updating this module and BLOCK_06A_LOCKED.md.
 *
 * Server engine: services/block06-engine/ @ BLOCK_06A_ENGINE_VERSION
 *
 * @version threaded-v3.4 · 2026-06-01
 */

export const BLOCK_06A_LOCKED = true

/** Layout engine — must match services/block06-engine/src/constants.js */
export const BLOCK_06A_ENGINE_VERSION = 'threaded-v3.4'

export const BLOCK_06A_RULES_VERSION = `2026-06-01.${BLOCK_06A_ENGINE_VERSION}`

export const BLOCK_06A_DIMENSIONS = {
  code: 'BLOCK-06A',
  label: '6-inch · 2 column',
  widthMm: 152.4,
  widthIn: 6,
  maxHeightMm: 254,
  maxHeightIn: 10,
  gutterMm: 2,
  padTopMm: 2,
  padBottomMm: 5,
  columnGapPx: 16,
  columns: 2,
  nativeWidthPx: 576,
}

export const BLOCK_06A_TYPOGRAPHY = {
  titleFontFamily: 'Mandali, "Noto Serif Telugu", sans-serif',
  bodyFontFamily: 'Mandali, sans-serif',
  titleWeight: 600,
  titleMinPx: 35,
  titleMaxPx: 58,
  titleMaxLines: 3,
  subtitleWeight: 500,
  subtitleSizeRatio: 0.5,
  subtitleMinPx: 14,
  bodyFontPx: 11,
  bodyLineHeight: 1.42,
  headlineFontPx: 12.5,
  headlineLinePx: 14,
}

export const BLOCK_06A_IMAGE = {
  primaryMaxHeightPx: 192,
  gapBelowPx: 4,
  captionLinePx: 16,
}

export const BLOCK_06A_THREADED_FLOW = {
  column1: ['highlights', 'body_start'],
  column2: ['image', 'body_continue'],
  split: 'pixel_obstacles_even_bottoms',
  domBalance: 'threadBalance.js',
  bodyHyphens: 'none',
  bodyLineBreak: 'strict',
  col1TextAlignLast: 'left',
  col2TextAlignLast: 'left',
  gridAlignItems: 'start',
  widowFix: true,
}

export const BLOCK_06A_ARTICLE_FIT = {
  label: '6in · 2 col · threaded',
  wordsMin: 150,
  wordsMax: 300,
  charsMax: 5200,
  maxHighlights: 2,
  maxImages: 1,
  heightIn: 10,
}

export const BLOCK_06A_STACK = [
  'title',
  'subtitle_optional',
  'grid_2col',
  'col1_highlights_then_body',
  'col2_image_then_body',
]

/** Human-readable rules for workbench / docs */
export function buildBlock06StyleRulesDoc() {
  const d = BLOCK_06A_DIMENSIONS
  const t = BLOCK_06A_TYPOGRAPHY
  const f = BLOCK_06A_ARTICLE_FIT
  return [
    {
      rule: 1,
      text: `LOCKED ${BLOCK_06A_RULES_VERSION}. ${d.widthMm}mm (${d.widthIn}in) rail, max ${d.maxHeightMm}mm, ${d.columnGapPx}px column gap. Engine: ${BLOCK_06A_ENGINE_VERSION}.`,
    },
    {
      rule: 2,
      text: `Threaded flow: col1 points → article (no gap); col2 image (${BLOCK_06A_IMAGE.primaryMaxHeightPx}px) → article continues; column bottoms aligned (±5px DOM).`,
    },
    {
      rule: 3,
      text: `Title ${t.titleMinPx}–${t.titleMaxPx}px Mandali ${t.titleWeight}, centred, max ${t.titleMaxLines} lines. Subtitle ~${t.subtitleSizeRatio * 100}% of title.`,
    },
    {
      rule: 4,
      text: `Body ${t.bodyFontPx}px / line-height ${t.bodyLineHeight}, justify; Telugu: no hyphens, strict line-break; col1 last line left (no stretched orphan).`,
    },
    {
      rule: 5,
      text: `Copy band: ${f.wordsMin}–${f.wordsMax} words, ≤${f.charsMax} chars, max ${f.maxHighlights} highlights, ${f.maxImages} image.`,
    },
  ]
}
