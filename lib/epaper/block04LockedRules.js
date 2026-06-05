/**
 * BLOCK-04A (ArticleBlock4in2col Style 1) — LOCKED specification.
 * Do not change behaviour in other files without updating this module first.
 *
 * @version 2026-05-21.4
 */

export const BLOCK_04A_RULES_VERSION = '2026-05-21.4'
export const BLOCK_04A_LOCKED = true

/** Physical column */
export const BLOCK_04A_DIMENSIONS = {
  code: 'BLOCK-04A',
  label: '4-inch · 2 column',
  widthMm: 101.6,
  gutterMm: 2,
  padTopMm: 2,
  padBottomMm: 5,
  titleMaxHeightMm: 88.9,
  heightIn: 4,
  nativeWidthPx: 384,
  columns: 2,
}

/** Typography (CSS must match these values) */
export const BLOCK_04A_TYPOGRAPHY = {
  titleFontFamily: 'Ramabhadra, "Noto Serif Telugu", Mandali, serif',
  bodyFontFamily: 'Mandali, sans-serif',
  titleWeight: 400,
  titleMinPx: 38,
  titleMaxPx: 58,
  titleMinFitPx: 26,
  titleMaxLines: 2,
  bodyFontPx: 11,
  bodyLinePx: 14,
  headlineFontPx: 12.5,
  headlineBulletPx: 13,
  subtitleSizeRatio: 0.5,
  subtitleMinPx: 14,
  titleSidePadPx: 3,
}

/** Title width / gutter fit (lib/epaper/block04TitleFit.js) */
export const BLOCK_04A_TITLE_FIT = {
  railInsetPx: 12,
  glyphPadPx: 8,
  clampBufferPx: 16,
  maxColonHighlightRatio: 1.08,
  lineGapMinPx: 0,
  lineGapMaxPx: 2,
  lineStackMaxPullRatio: 0,
}

/** Main title rules — colon golden rule */
export const BLOCK_04A_TITLE_RULES = {
  scope: 'main_title_only',
  colon: {
    hidden: true,
    breakIntoTwoLines: true,
    colorSide: 'fewer_words',
    useArticleTitleColor: false,
  },
  withSubtitle: {
    twoLinesSameFontSize: true,
    colonColorStillApplies: true,
  },
  withoutSubtitle: {
    longLineMaxFitsRail: true,
    fewerWordSideSlightlyLarger: true,
    maxHighlightRatio: BLOCK_04A_TITLE_FIT.maxColonHighlightRatio,
  },
  lineLayout: {
    gapPxMin: BLOCK_04A_TITLE_FIT.lineGapMinPx,
    gapPxMax: BLOCK_04A_TITLE_FIT.lineGapMaxPx,
    line2FrontLine1Behind: true,
    noOverflowClipOnGlyphs: true,
  },
  zIndex: { text: 20, photo: 1 },
}

export const BLOCK_04A_COLON_GOLDEN_RULE = BLOCK_04A_TITLE_RULES.colon

/** Lead photo — Quark FILL inside gutters */
export const BLOCK_04A_PHOTO = {
  objectFit: 'cover',
  maxImages: 2,
  ratios: {
    landscape: { minRatio: 1.55, aspect: '2 / 1', focus: '50% 38%' },
    standard: { minRatio: 1.12, aspect: '4 / 3', focus: '50% 32%' },
    square: { minRatio: 0.82, aspect: '1 / 1', focus: '50% 25%' },
    portrait: { aspect: '3 / 4', focus: '50% 18%' },
  },
}

/** Workbench article band (lib/epaper/blockStyleFit.js) */
export const BLOCK_04A_ARTICLE_FIT = {
  label: '4in rail · Style 1',
  wordsMin: 50,
  wordsMax: 199,
  charsMax: 3400,
  heightIn: 4,
}

/** Style 1 stack order */
export const BLOCK_04A_STACK = [
  'title',
  'subtitle_optional',
  'photo_up_to_2',
  'headline_points_optional',
  'body_hj',
]

/** Human-readable rules for Block style workbench UI */
export function buildBlock04StyleRulesDoc() {
  const g = BLOCK_04A_DIMENSIONS.gutterMm
  const r = BLOCK_04A_TITLE_FIT.maxColonHighlightRatio
  return [
    {
      rule: 1,
      text: `LOCKED v${BLOCK_04A_RULES_VERSION}. ${BLOCK_04A_DIMENSIONS.widthMm}mm rail, ${g}mm side gutters. Title: colon hidden → 2 lines; fewer words → print colour + max ${Math.round((r - 1) * 100)}% larger; both lines inside rail (no last-letter clip). Min ${BLOCK_04A_TYPOGRAPHY.titleMinPx}px, max ${BLOCK_04A_TYPOGRAPHY.titleMaxPx}px, weight ${BLOCK_04A_TYPOGRAPHY.titleWeight}.`,
    },
    {
      rule: 2,
      text: `Subtitle: centred, max ${BLOCK_04A_TYPOGRAPHY.subtitleSizeRatio * 100}% of title size, random colour, gutter fit.`,
    },
    {
      rule: 3,
      text: `Photo: up to ${BLOCK_04A_PHOTO.maxImages} images, full gutter width, ${BLOCK_04A_PHOTO.objectFit} fill; aspect 2:1 / 4:3 / 1:1 / 3:4 by image ratio. Image z-back, text z-front.`,
    },
    {
      rule: 4,
      text: `Headlines (points): ${BLOCK_04A_TYPOGRAPHY.headlineFontPx}px bold (body ${BLOCK_04A_TYPOGRAPHY.bodyFontPx}px), centred, bullet •, dashed underline full width of point.`,
    },
    {
      rule: 5,
      text: `Body: H&J inside gutters, ${BLOCK_04A_TYPOGRAPHY.bodyFontPx}px / ${BLOCK_04A_TYPOGRAPHY.bodyLinePx}px leading, merged paragraphs, bold dateline on first line.`,
    },
    {
      rule: 6,
      text: `Assignment band: ${BLOCK_04A_ARTICLE_FIT.wordsMin}–${BLOCK_04A_ARTICLE_FIT.wordsMax} words, ≤${BLOCK_04A_ARTICLE_FIT.charsMax} chars (~${BLOCK_04A_ARTICLE_FIT.heightIn}in). No inner scroll on title.`,
    },
  ]
}
