/**
 * BLOCK-04A title constants + SSR fallback.
 * Dimensions/typography: lib/epaper/block04LockedRules.js (LOCKED)
 */

import {
  BLOCK_04A_DIMENSIONS,
  BLOCK_04A_TYPOGRAPHY,
  BLOCK_04A_PHOTO,
} from './block04LockedRules'
import {
  BLOCK_06A_DIMENSIONS,
  BLOCK_08A_DIMENSIONS,
  BLOCK_12A_CONTENT_RAIL_PX,
} from './wideBlockRules'
import {
  tokenizeTeluguTitle,
  isTitleWidow,
  lineFontSizes,
  pickImpactWords,
  buildLineSegments,
  buildColonHighlightSegments,
  isBlock04DefaultInkTitle,
  getOrderedSplitIndices,
  analyzeColonTitle,
  applyMainTitleRules,
  colonTitleGapPx,
  colonTitleLineStackPx,
} from './block04TitleSmart'
import {
  titleLineFitsColumn,
  computeColonBalancedLineSizes,
  shrinkLineSizesToFit,
} from './block04TitleFit'
import { colonTitleLineHeightPx } from './block04TitleSmart'

const MIN_TITLE_FIT_PX = BLOCK_04A_TYPOGRAPHY.titleMinFitPx

const MM_TO_PX = 96 / 25.4

export const BLOCK_04A_WIDTH_MM = BLOCK_04A_DIMENSIONS.widthMm
export const BLOCK_04A_GUTTER_MM = BLOCK_04A_DIMENSIONS.gutterMm
export const BLOCK_04A_PAD_H_MM = BLOCK_04A_GUTTER_MM

export const BLOCK_04A_CONTENT_WIDTH_PX = Math.floor(
  (BLOCK_04A_WIDTH_MM - BLOCK_04A_PAD_H_MM * 2) * MM_TO_PX
)

function fallbackRailPxForBlock(code) {
  if (code === 'BLOCK-08A') return BLOCK_08A_DIMENSIONS.nativeWidthPx
  if (code === 'BLOCK-06A') return BLOCK_06A_DIMENSIONS.nativeWidthPx
  if (code === 'BLOCK-12A') return BLOCK_12A_CONTENT_RAIL_PX
  return BLOCK_04A_CONTENT_WIDTH_PX
}

/** Inner rail width after gutters. Wide blocks use full 6in/7.5in — not capped to 4in. */
export function getBlock04ColumnPx(element) {
  const code = element?.dataset?.blockCode || ''
  const fallback = fallbackRailPxForBlock(code)
  if (typeof window === 'undefined' || !element) return fallback
  const cs = window.getComputedStyle(element)
  const pad =
    (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0)
  const inner = Math.floor(element.clientWidth - pad)
  if (inner > 120) {
    if (code === 'BLOCK-08A' || code === 'BLOCK-06A' || code === 'BLOCK-12A') return inner
    return Math.min(BLOCK_04A_CONTENT_WIDTH_PX, inner)
  }
  return fallback
}

export const BLOCK_04A_TITLE_MAX_HEIGHT_MM = BLOCK_04A_DIMENSIONS.titleMaxHeightMm
const MAX_TITLE_HEIGHT_PX = Math.floor(BLOCK_04A_TITLE_MAX_HEIGHT_MM * MM_TO_PX)

export const BLOCK_04A_MAX_TITLE_LINES = BLOCK_04A_TYPOGRAPHY.titleMaxLines
export const BLOCK_04A_MIN_TITLE_PX = BLOCK_04A_TYPOGRAPHY.titleMinPx
export const BLOCK_04A_MAX_TITLE_PX = BLOCK_04A_TYPOGRAPHY.titleMaxPx

export function titleLineHeight(_fontSizePx, lineCount) {
  if (lineCount <= 1) return 1.06
  return 1
}

function charsPerLine(fontSizePx, columnPx) {
  return Math.max(8, Math.floor((columnPx / fontSizePx) * 1.65))
}

function fitsHeight(lineSizes, lineHeight, lineGapPx = 0, lineStackPx = 0) {
  const lines = lineSizes.reduce((s, px) => s + px * lineHeight, 0)
  const between =
    lineSizes.length > 1 ? Math.max(0, lineGapPx - lineStackPx) : 0
  return lines + between <= MAX_TITLE_HEIGHT_PX
}

function allLinesFit(titleLines, limit) {
  return titleLines.every((line) => line.length <= limit)
}

function findTwoLineNoWidow(units, limit) {
  for (let split = units.length - 1; split >= 1; split--) {
    if (units.length - split === 1 && split > 1) continue
    const titleLines = [units.slice(0, split).join(' '), units.slice(split).join(' ')]
    if (!allLinesFit(titleLines, limit) || isTitleWidow(titleLines)) continue
    return titleLines
  }
  return null
}

function enrichFallback(titleLines, lineSizes, opts) {
  const { title, category, baseColor, accentImpact } = opts
  const colon = analyzeColonTitle(title)

  if (colon && colon.displayTitleLines.length >= 2 && titleLines.length >= 2) {
    const lines = colon.displayTitleLines
    const sizes =
      lineSizes.length === 2
        ? lineSizes
        : computeColonBalancedLineSizes({
            line1: lines[0],
            line2: lines[1],
            columnPx: opts.columnPx || BLOCK_04A_CONTENT_WIDTH_PX,
            minPx: MIN_TITLE_FIT_PX,
            maxPx: lineSizes[0] || BLOCK_04A_MIN_TITLE_PX,
            highlightSide: colon.highlightSide,
          })

    return lines.map((text, i) => {
      const highlight =
        (colon.highlightSide === 'before' && i === 0) ||
        (colon.highlightSide === 'after' && i === 1)
      const fs = sizes[i] || sizes[0]
      return {
        text,
        fontSizePx: fs,
        lineHeight: colonTitleLineHeightPx(fs),
        highlight,
        segments: buildColonHighlightSegments(text, {
          highlight,
          title,
          category,
        }),
      }
    })
  }

  const units = tokenizeTeluguTitle(title)
  const impactWords = accentImpact ? pickImpactWords(units) : new Set()
  return titleLines.map((text, i) => {
    const fs = lineSizes[i] || lineSizes[0]
    return {
      text,
      fontSizePx: fs,
      lineHeight: colonTitleLineHeightPx(fs),
      segments: buildLineSegments(text, impactWords, {
        accent: accentImpact,
        baseColor,
        title,
        category,
      }),
    }
  })
}

function tryColonFallback(text, columnPx, size) {
  const colon = analyzeColonTitle(text)
  if (!colon || colon.titleLines.length < 2) return null
  const [l1, l2] = colon.titleLines
  const lineSizes = computeColonBalancedLineSizes({
    line1: l1,
    line2: l2,
    columnPx,
    minPx: MIN_TITLE_FIT_PX,
    maxPx: size,
    highlightSide: colon.highlightSide,
  })
  if (!titleLineFitsColumn(l1, lineSizes[0], columnPx)) return null
  if (!titleLineFitsColumn(l2, lineSizes[1], columnPx)) return null
  if (isTitleWidow([l1, l2])) return null
  const lh = titleLineHeight(size, 2)
  const lineGapPx = colonTitleGapPx(lineSizes[0], lineSizes[1])
  const lineStackPx = colonTitleLineStackPx(lineSizes[0], lineSizes[1])
  if (!fitsHeight(lineSizes, lh, lineGapPx, lineStackPx)) return null
  return {
    fontSizePx: size,
    lineHeight: lh,
    lineGapPx,
    lineStackPx,
    lines: 2,
    titleLines: [l1, l2],
    lineSizes,
    colonAccent: true,
    highlightSide: colon.highlightSide,
  }
}

export function fallbackTitleMetrics(title, columnPx = BLOCK_04A_CONTENT_WIDTH_PX, colorOpts = {}) {
  const text = String(title || '').trim()
  const category = colorOpts.category || 'general'
  const baseColor = colorOpts.baseColor || '#1a1a1a'
  const hasSubtitle = !!colorOpts.hasSubtitle
  const accentImpact = isBlock04DefaultInkTitle(
    colorOpts.titleColor,
    colorOpts.titleColorEnabled
  )

  const wrap = (layout) => {
    const withColon = applyMainTitleRules(layout, text, {
      minPx: BLOCK_04A_MIN_TITLE_PX,
      columnPx,
      maxPx: BLOCK_04A_MAX_TITLE_PX,
      hasSubtitle,
    })
    let lineSizes = shrinkLineSizesToFit(
      withColon.titleLines || [text],
      withColon.lineSizes || [withColon.fontSizePx],
      columnPx,
      MIN_TITLE_FIT_PX
    )
    const lineGapPx =
      withColon.lineGapPx ??
      (withColon.titleLines?.length > 1
        ? colonTitleGapPx(lineSizes[0], lineSizes[1])
        : 0)
    const lineStackPx =
      withColon.lineStackPx ??
      (withColon.titleLines?.length > 1
        ? colonTitleLineStackPx(lineSizes[0], lineSizes[1])
        : 0)
    return {
      ...withColon,
      lineSizes,
      lineGapPx,
      lineStackPx,
      lineHeight:
        withColon.titleLines?.length > 1
          ? Math.max(...lineSizes.map((px) => colonTitleLineHeightPx(px)))
          : withColon.lineHeight,
      renderedLines: enrichFallback(withColon.titleLines, lineSizes, {
        title: text,
        category,
        baseColor,
        accentImpact,
        columnPx,
      }),
      accentImpact,
      maxHeightMm: BLOCK_04A_TITLE_MAX_HEIGHT_MM,
      maxLines: BLOCK_04A_MAX_TITLE_LINES,
    }
  }

  if (!text) {
    return wrap({
      fontSizePx: BLOCK_04A_MIN_TITLE_PX,
      lineHeight: titleLineHeight(BLOCK_04A_MIN_TITLE_PX, 1),
      lines: 1,
      titleLines: [''],
    })
  }

  const units = tokenizeTeluguTitle(text)
  const colonMeta = analyzeColonTitle(text)

  if (colonMeta?.displayTitleLines.length >= 2) {
    for (let size = BLOCK_04A_MAX_TITLE_PX; size >= MIN_TITLE_FIT_PX; size--) {
      const colonLayout = tryColonFallback(text, columnPx, size)
      if (colonLayout) return wrap(colonLayout)
    }
    const forced = tryColonFallback(text, columnPx, MIN_TITLE_FIT_PX)
    if (forced) return wrap(forced)
    return wrap({
      fontSizePx: MIN_TITLE_FIT_PX,
      lineHeight: titleLineHeight(MIN_TITLE_FIT_PX, 2),
      lines: 2,
      titleLines: colonMeta.displayTitleLines,
      lineSizes: computeColonBalancedLineSizes({
        line1: colonMeta.displayTitleLines[0],
        line2: colonMeta.displayTitleLines[1],
        columnPx,
        minPx: MIN_TITLE_FIT_PX,
        maxPx: BLOCK_04A_MAX_TITLE_PX,
        highlightSide: colonMeta.highlightSide,
      }),
      colonAccent: true,
      highlightSide: colonMeta.highlightSide,
    })
  }

  for (let size = BLOCK_04A_MAX_TITLE_PX; size >= BLOCK_04A_MIN_TITLE_PX; size--) {
    if (colonMeta) continue
    const limit = charsPerLine(size, columnPx)
    if (text.length <= limit) {
      const lh = titleLineHeight(size, 1)
      if (fitsHeight([size], lh)) {
        return wrap({
          fontSizePx: size,
          lineHeight: lh,
          lines: 1,
          titleLines: [text],
          lineSizes: [size],
        })
      }
    }
  }

  if (units.length >= 2) {
    for (let size = BLOCK_04A_MAX_TITLE_PX; size >= BLOCK_04A_MIN_TITLE_PX; size--) {
      const { primary, secondary } = lineFontSizes(size, BLOCK_04A_MIN_TITLE_PX)
      const limit1 = charsPerLine(primary, columnPx)
      const limit2 = charsPerLine(secondary, columnPx)
      for (const { split } of getOrderedSplitIndices(units, text)) {
        if (units.length - split === 1 && split > 1) continue
        const l1 = units.slice(0, split).join(' ')
        const l2 = units.slice(split).join(' ')
        if (l1.length > limit1 || l2.length > limit2) continue
        const titleLines = [l1, l2]
        if (isTitleWidow(titleLines)) continue
        const lh = titleLineHeight(primary, 2)
        const lineSizes = [primary, secondary]
        if (fitsHeight(lineSizes, lh)) {
          return wrap({
            fontSizePx: primary,
            lineHeight: lh,
            lines: 2,
            titleLines,
            lineSizes,
          })
        }
      }
    }
  }

  const { primary, secondary } = lineFontSizes(BLOCK_04A_MIN_TITLE_PX, MIN_TITLE_FIT_PX)
  let titleLines = findTwoLineNoWidow(units, charsPerLine(primary, columnPx))

  if (!titleLines || titleLines.length === 1) {
    for (const { split } of getOrderedSplitIndices(units, text)) {
      const l1 = units.slice(0, split).join(' ')
      const l2 = units.slice(split).join(' ')
      if (titleLineFitsColumn(l1, primary, columnPx) && titleLineFitsColumn(l2, secondary, columnPx)) {
        titleLines = [l1, l2]
        break
      }
    }
  }

  if (!titleLines || titleLines.length === 1) {
    for (let size = BLOCK_04A_MIN_TITLE_PX; size >= MIN_TITLE_FIT_PX; size--) {
      const { primary: p, secondary: s } = lineFontSizes(size, MIN_TITLE_FIT_PX)
      for (const { split } of getOrderedSplitIndices(units, text)) {
        const l1 = units.slice(0, split).join(' ')
        const l2 = units.slice(split).join(' ')
        if (titleLineFitsColumn(l1, p, columnPx) && titleLineFitsColumn(l2, s, columnPx)) {
          return wrap({
            fontSizePx: p,
            lineHeight: titleLineHeight(p, 2),
            lines: 2,
            titleLines: [l1, l2],
            lineSizes: [p, s],
          })
        }
      }
    }
  }

  titleLines = titleLines || [text]
  const lineSizes = titleLines.length > 1 ? [primary, secondary] : [primary]

  if (
    titleLines.length === 1 &&
    !titleLineFitsColumn(text, lineSizes[0], columnPx) &&
    units.length >= 2
  ) {
    const mid = Math.ceil(units.length / 2)
    titleLines = [units.slice(0, mid).join(' '), units.slice(mid).join(' ')]
  }

  return wrap({
    fontSizePx: lineSizes[0],
    lineHeight: titleLineHeight(lineSizes[0], titleLines.length),
    lines: titleLines.length,
    titleLines,
    lineSizes: titleLines.length > 1 ? [lineSizes[0], lineSizes[1] || secondary] : lineSizes,
  })
}

export function getBlock04TitleMetrics(title, colorOpts) {
  return fallbackTitleMetrics(title, BLOCK_04A_CONTENT_WIDTH_PX, colorOpts)
}

/**
 * Quark-style lead photo: frame = full column width; FILL (cover) into frame.
 * Width always bleeds to rail; height from aspect — crop top/bottom or sides as needed.
 */
export function getBlock04PhotoLayout(naturalWidth, naturalHeight, apiFocus = '') {
  const w = Number(naturalWidth) || 1
  const h = Number(naturalHeight) || 1
  const ratio = w / h
  const custom = String(apiFocus || '').trim()
  const fill = 'cover'

  const { landscape, standard, square, portrait } = BLOCK_04A_PHOTO.ratios
  if (ratio >= landscape.minRatio) {
    return {
      aspect: landscape.aspect,
      focus: custom || landscape.focus,
      mode: 'landscape',
      objectFit: BLOCK_04A_PHOTO.objectFit,
    }
  }
  if (ratio >= standard.minRatio) {
    return {
      aspect: standard.aspect,
      focus: custom || standard.focus,
      mode: 'standard',
      objectFit: BLOCK_04A_PHOTO.objectFit,
    }
  }
  if (ratio >= square.minRatio) {
    return {
      aspect: square.aspect,
      focus: custom || square.focus,
      mode: 'square',
      objectFit: BLOCK_04A_PHOTO.objectFit,
    }
  }
  return {
    aspect: portrait.aspect,
    focus: custom || portrait.focus,
    mode: 'portrait',
    objectFit: BLOCK_04A_PHOTO.objectFit,
  }
}
