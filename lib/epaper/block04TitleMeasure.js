/**
 * BLOCK-04A title — Telugu-safe breaks, variable line sizes, impact segments.
 */

import {
  BLOCK_04A_MAX_TITLE_LINES,
  BLOCK_04A_TITLE_MAX_HEIGHT_MM,
  BLOCK_04A_CONTENT_WIDTH_PX,
  BLOCK_04A_MIN_TITLE_PX,
  BLOCK_04A_MAX_TITLE_PX,
  titleLineHeight,
  fallbackTitleMetrics,
} from './block04TitleMetrics'
import {
  tokenizeTeluguTitle,
  isTitleWidow,
  pickImpactWords,
  buildLineSegments,
  buildColonHighlightSegments,
  lineFontSizes,
  isBlock04DefaultInkTitle,
  getOrderedSplitIndices,
  analyzeColonTitle,
  applyMainTitleRules,
  colonLineSizes,
  colonTitleGapPx,
  colonTitleLineStackPx,
  colonTitleLineHeightPx,
  colonTitleLine2TuckPx,
  wideDisplayTitle,
} from './block04TitleSmart'
import { layoutBlock08Title } from './block08TitleLayout'

import {
  titleLineFitsColumn,
  allTitleLinesFit,
  computeColonBalancedLineSizes,
  shrinkLineSizesToFit,
  ensureBlock04TitleFonts,
} from './block04TitleFit'

const MAX_TITLE_HEIGHT_PX = Math.floor(BLOCK_04A_TITLE_MAX_HEIGHT_MM * (96 / 25.4))
const BLOCK_04A_MIN_TITLE_FIT_PX = 26

function fitsHeight(lineSizes, lineHeight, lineGapPx = 0, lineStackPx = 0) {
  const lines = lineSizes.reduce((sum, px) => sum + px * lineHeight, 0)
  const between =
    lineSizes.length > 1 ? Math.max(0, lineGapPx - lineStackPx) : 0
  return lines + between <= MAX_TITLE_HEIGHT_PX
}

function canMeasure() {
  return typeof document !== 'undefined'
}

function findColonTwoLineSplit(text, columnPx, primaryPx, minPx) {
  const colon = analyzeColonTitle(text)
  if (!colon || colon.displayTitleLines.length < 2) return null

  const [l1, l2] = colon.displayTitleLines
  const lineSizes =
    columnPx > 0
      ? computeColonBalancedLineSizes({
          line1: l1,
          line2: l2,
          columnPx,
          minPx,
          maxPx: primaryPx,
          highlightSide: colon.highlightSide,
        })
      : colonLineSizes(primaryPx, minPx, colon.highlightSide)
  const shrunk = shrinkLineSizesToFit([l1, l2], lineSizes, columnPx, minPx)
  if (!allTitleLinesFit([l1, l2], shrunk, columnPx)) return null

  const titleLines = [l1, l2]
  if (isTitleWidow(titleLines)) return null

  return {
    titleLines,
    lineSizes: shrunk,
    colonAccent: true,
    highlightSide: colon.highlightSide,
  }
}

function findTwoLineSplit(units, columnPx, primaryPx, secondaryPx, title = '') {
  for (const { split } of getOrderedSplitIndices(units, title)) {
    const wordsOnL2 = units.length - split
    if (wordsOnL2 === 1 && split > 1) continue

    const l1 = units.slice(0, split).join(' ')
    const l2 = units.slice(split).join(' ')
    if (!titleLineFitsColumn(l1, primaryPx, columnPx)) continue
    if (!titleLineFitsColumn(l2, secondaryPx, columnPx)) continue

    const titleLines = [l1, l2]
    if (isTitleWidow(titleLines)) continue

    return { titleLines, split, lineSizes: [primaryPx, secondaryPx] }
  }

  return null
}

function enrichLines(titleLines, lineSizes, options) {
  const { title, category, baseColor, accentImpact } = options
  const colon = analyzeColonTitle(title)

  if (colon && colon.displayTitleLines.length >= 2 && titleLines.length >= 2) {
    const lines = colon.displayTitleLines
    const sizes =
      lineSizes.length === 2
        ? lineSizes
        : colonLineSizes(lineSizes[0] || BLOCK_04A_MIN_TITLE_PX, BLOCK_04A_MIN_TITLE_FIT_PX, colon.highlightSide)

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

const WIDE_TITLE_OPTS = { wide: true }

function wideTitleBounds(colorOpts = {}) {
  return {
    minPx: colorOpts.wideTitleMinPx ?? BLOCK_04A_MIN_TITLE_FIT_PX,
    maxPx: colorOpts.wideTitleMaxPx ?? BLOCK_04A_MAX_TITLE_PX,
  }
}

/** One-line title for wide rails — largest size that fits (few words → bigger type). */
function layoutWideSingleLineTitle(text, columnPx, minPx, maxPx) {
  const lineText = wideDisplayTitle(text)
  if (!lineText) return null
  const colon = analyzeColonTitle(text)
  const floorPx = minPx ?? BLOCK_04A_MIN_TITLE_FIT_PX
  const capPx = maxPx ?? BLOCK_04A_MAX_TITLE_PX

  for (let size = capPx; size >= floorPx; size--) {
    if (!titleLineFitsColumn(lineText, size, columnPx, undefined, WIDE_TITLE_OPTS)) continue
    const lh = titleLineHeight(size, 1)
    if (!fitsHeight([size], lh)) continue
    return {
      fontSizePx: size,
      lineHeight: lh,
      lines: 1,
      titleLines: [lineText],
      lineSizes: [size],
      colonAccent: !!colon,
      highlightSide: colon?.highlightSide,
      hideColon: !!colon,
    }
  }
  return null
}

function layoutAtPrimarySize(units, text, primaryPx, columnPx, preferSingleLine = false, wideMinPx, wideMaxPx) {
  if (preferSingleLine) {
    const one = layoutWideSingleLineTitle(text, columnPx, wideMinPx, wideMaxPx)
    if (one) return one
    const lineText = wideDisplayTitle(text)
    const colon = analyzeColonTitle(text)
    const floor = wideMinPx ?? BLOCK_04A_MIN_TITLE_FIT_PX
    const sz = Math.max(floor, Math.min(primaryPx, wideMaxPx ?? BLOCK_04A_MAX_TITLE_PX))
    return {
      fontSizePx: sz,
      lineHeight: titleLineHeight(sz, 1),
      lines: 1,
      titleLines: [lineText],
      lineSizes: [sz],
      colonAccent: !!colon,
      highlightSide: colon?.highlightSide,
      hideColon: !!colon,
    }
  }

  const { primary, secondary } = lineFontSizes(primaryPx, BLOCK_04A_MIN_TITLE_PX)
  const lh1 = titleLineHeight(primary, 1)
  const colonMeta = analyzeColonTitle(text)

  const colonSplit = findColonTwoLineSplit(text, columnPx, primary, BLOCK_04A_MIN_TITLE_PX)
  if (colonSplit) {
    const lh2 = titleLineHeight(primary, 2)
    const gap = colonTitleGapPx(colonSplit.lineSizes[0], colonSplit.lineSizes[1])
    const stack = colonTitleLineStackPx(colonSplit.lineSizes[0], colonSplit.lineSizes[1])
    if (fitsHeight(colonSplit.lineSizes, lh2, gap, stack)) {
      return {
        fontSizePx: primary,
        lineHeight: lh2,
        lines: 2,
        titleLines: colonSplit.titleLines,
        lineSizes: colonSplit.lineSizes,
        colonAccent: true,
        highlightSide: colonSplit.highlightSide,
      }
    }
  }

  if (!colonMeta) {
    if (titleLineFitsColumn(text, primary, columnPx) && fitsHeight([primary], lh1)) {
      return {
        fontSizePx: primary,
        lineHeight: lh1,
        lines: 1,
        titleLines: [text],
        lineSizes: [primary],
      }
    }
  }

  if (units.length < 2) return null

  const split = findTwoLineSplit(units, columnPx, primary, secondary, text)
  if (!split) return null

  const lh2 = titleLineHeight(primary, 2)
  const gap = colonTitleGapPx(split.lineSizes[0], split.lineSizes[1])
  const stack = colonTitleLineStackPx(split.lineSizes[0], split.lineSizes[1])
  if (!fitsHeight(split.lineSizes, lh2, gap, stack)) return null

  return {
    fontSizePx: primary,
    lineHeight: lh2,
    lines: 2,
    titleLines: split.titleLines,
    lineSizes: split.lineSizes,
  }
}

async function ensureTitleFonts() {
  await ensureBlock04TitleFonts()
}

/**
 * @param {string} title
 * @param {number} widthPx
 * @param {{ titleColor?: string, titleColorEnabled?: boolean, category?: string, hasSubtitle?: boolean }} [colorOpts]
 */
export function measureBlock04TitleLayout(title, widthPx, colorOpts = {}) {
  const text = String(title || '').trim()
  const wideBlockTitle = !!colorOpts.wideBlockTitle
  const { minPx: wideMinPx, maxPx: wideMaxPx } = wideTitleBounds(colorOpts)
  const columnPx = wideBlockTitle
    ? Math.max(200, Math.floor(widthPx || 0) - 12)
    : Math.max(200, Math.floor(widthPx) || BLOCK_04A_CONTENT_WIDTH_PX)
  const fitMinPx = wideBlockTitle ? wideMinPx : BLOCK_04A_MIN_TITLE_FIT_PX
  const category = colorOpts.category || 'general'
  const baseColor = colorOpts.baseColor || '#1a1a1a'
  const hasSubtitle = !!colorOpts.hasSubtitle
  const accentImpact = isBlock04DefaultInkTitle(
    colorOpts.titleColor,
    colorOpts.titleColorEnabled
  )

  const empty = {
    fontSizePx: BLOCK_04A_MIN_TITLE_PX,
    lineHeight: titleLineHeight(BLOCK_04A_MIN_TITLE_PX, 1),
    lines: 1,
    titleLines: [''],
    renderedLines: [],
    maxHeightMm: BLOCK_04A_TITLE_MAX_HEIGHT_MM,
    maxLines: BLOCK_04A_MAX_TITLE_LINES,
    accentImpact,
  }

  if (!text) return empty

  const units = tokenizeTeluguTitle(text)

  const finish = (layout) => {
    const withColon = applyMainTitleRules(layout, text, {
      minPx: wideBlockTitle ? wideMinPx : BLOCK_04A_MIN_TITLE_PX,
      fitMinPx,
      columnPx,
      maxPx: wideBlockTitle ? wideMaxPx : BLOCK_04A_MAX_TITLE_PX,
      hasSubtitle,
      preferSingleLine: false,
      skipColonResplit: wideBlockTitle,
    })
    const fitOpts = wideBlockTitle ? WIDE_TITLE_OPTS : {}
    let lineSizes = shrinkLineSizesToFit(
      withColon.titleLines || [text],
      withColon.lineSizes || [withColon.fontSizePx],
      columnPx,
      fitMinPx,
      undefined,
      fitOpts
    )
    if (wideBlockTitle) {
      lineSizes = lineSizes.map((s) => Math.max(wideMinPx, s))
    }
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
    const titleLines = withColon.titleLines || [text]
    const line2TuckPx =
      titleLines.length > 1 ? colonTitleLine2TuckPx(lineSizes[0], titleLines[1]) : 0
    const renderedLines = enrichLines(withColon.titleLines, lineSizes, {
      title: text,
      category,
      baseColor,
      accentImpact,
      colonAccent: withColon.colonAccent,
      highlightSide: withColon.highlightSide,
    })
    return {
      ...withColon,
      lineSizes,
      fontSizePx: lineSizes[0] ?? withColon.fontSizePx,
      lineGapPx,
      lineStackPx,
      line2TuckPx,
      lineHeight:
        withColon.titleLines?.length > 1
          ? Math.max(...lineSizes.map((px) => colonTitleLineHeightPx(px)))
          : withColon.lineHeight,
      renderedLines,
      accentImpact,
      maxHeightMm: BLOCK_04A_TITLE_MAX_HEIGHT_MM,
      maxLines: BLOCK_04A_MAX_TITLE_LINES,
    }
  }

  if (!canMeasure()) {
    const fb = fallbackTitleMetrics(text, columnPx, colorOpts)
    return finish(fb)
  }

  if (wideBlockTitle) {
    const layout = layoutBlock08Title(text, columnPx, {
      minPx: wideMinPx,
      maxPx: wideMaxPx,
      maxLines: colorOpts.wideTitleMaxLines ?? 3,
      preferMultiLineOnly: !!colorOpts.preferMultiLineOnly,
    })
    return finish(ensureLayoutFits(layout, text, columnPx, hasSubtitle, true, fitMinPx))
  }

  for (let size = BLOCK_04A_MAX_TITLE_PX; size >= BLOCK_04A_MIN_TITLE_FIT_PX; size--) {
    const layout = layoutAtPrimarySize(units, text, size, columnPx, false, wideMinPx, wideMaxPx)
    if (layout) return finish(ensureLayoutFits(layout, text, columnPx, hasSubtitle, false, fitMinPx))
  }

  const forced = layoutAtPrimarySize(units, text, BLOCK_04A_MIN_TITLE_FIT_PX, columnPx, false, wideMinPx, wideMaxPx)
  if (forced) return finish(ensureLayoutFits(forced, text, columnPx, hasSubtitle, false, fitMinPx))

  return finish(
    ensureLayoutFits(fallbackTitleMetrics(text, columnPx, colorOpts), text, columnPx, hasSubtitle, false, fitMinPx)
  )
}

/** Shrink lines / force colon split — never return one overflowing line. */
function ensureLayoutFits(
  layout,
  text,
  columnPx,
  hasSubtitle = false,
  wideBlockFit = false,
  fitMinPx = BLOCK_04A_MIN_TITLE_FIT_PX
) {
  if (wideBlockFit && layout.titleLines?.length) {
    const shrunk = shrinkLineSizesToFit(
      layout.titleLines || [text],
      layout.lineSizes || [layout.fontSizePx],
      columnPx,
      fitMinPx,
      undefined,
      WIDE_TITLE_OPTS
    )
    const lineSizes = shrunk.map((s) => Math.max(fitMinPx, s))
    return { ...layout, lineSizes, fontSizePx: lineSizes[0] ?? layout.fontSizePx }
  }

  const colon = analyzeColonTitle(text)

  if (colon?.displayTitleLines.length >= 2) {
    for (let maxPx = BLOCK_04A_MAX_TITLE_PX; maxPx >= BLOCK_04A_MIN_TITLE_FIT_PX; maxPx--) {
      const golden = applyMainTitleRules(layout, text, {
        minPx: BLOCK_04A_MIN_TITLE_PX,
        fitMinPx: BLOCK_04A_MIN_TITLE_FIT_PX,
        columnPx,
        maxPx,
        hasSubtitle,
      })
      const lh = titleLineHeight(Math.max(...golden.lineSizes), 2)
      const gap = golden.lineGapPx ?? colonTitleGapPx(golden.lineSizes[0], golden.lineSizes[1])
      const stack = golden.lineStackPx ?? colonTitleLineStackPx(golden.lineSizes[0], golden.lineSizes[1])
      if (allTitleLinesFit(golden.titleLines, golden.lineSizes, columnPx) && fitsHeight(golden.lineSizes, lh, gap, stack)) {
        return { ...golden, lineHeight: lh, lineGapPx: gap, lineStackPx: stack }
      }
    }
    const forced = applyMainTitleRules(layout, text, {
      minPx: BLOCK_04A_MIN_TITLE_PX,
      fitMinPx: BLOCK_04A_MIN_TITLE_FIT_PX,
      columnPx,
      maxPx: BLOCK_04A_MAX_TITLE_PX,
      hasSubtitle,
    })
    const shrunk = shrinkLineSizesToFit(
      forced.titleLines || [text],
      forced.lineSizes || [forced.fontSizePx],
      columnPx,
      BLOCK_04A_MIN_TITLE_FIT_PX
    )
    return { ...forced, lineSizes: shrunk, fontSizePx: shrunk[0] ?? forced.fontSizePx }
  }

  let titleLines = [...(layout.titleLines || [text])]
  let lineSizes = [...(layout.lineSizes || [layout.fontSizePx])]

  if (hasSubtitle && titleLines.length >= 2) {
    const equal = applyMainTitleRules(
      { ...layout, titleLines, lineSizes },
      text,
      {
        minPx: BLOCK_04A_MIN_TITLE_PX,
        fitMinPx: BLOCK_04A_MIN_TITLE_FIT_PX,
        columnPx,
        maxPx: BLOCK_04A_MAX_TITLE_PX,
        hasSubtitle: true,
      }
    )
    const shrunk = shrinkLineSizesToFit(
      equal.titleLines || titleLines,
      equal.lineSizes || lineSizes,
      columnPx,
      BLOCK_04A_MIN_TITLE_FIT_PX
    )
    return { ...equal, lineSizes: shrunk, fontSizePx: shrunk[0] ?? equal.fontSizePx }
  }

  for (let size = lineSizes[0] || BLOCK_04A_MAX_TITLE_PX; size >= BLOCK_04A_MIN_TITLE_FIT_PX; size--) {
    if (titleLines.length === 1) {
      lineSizes = [size]
    } else {
      const { primary, secondary } = lineFontSizes(size, BLOCK_04A_MIN_TITLE_FIT_PX)
      lineSizes = [primary, secondary]
    }

    const shrunk = shrinkLineSizesToFit(titleLines, lineSizes, columnPx, BLOCK_04A_MIN_TITLE_FIT_PX)
    if (
      allTitleLinesFit(titleLines, shrunk, columnPx) &&
      fitsHeight(shrunk, layout.lineHeight || 1.02)
    ) {
      return {
        ...layout,
        titleLines,
        lineSizes: shrunk,
        fontSizePx: shrunk[0],
        lines: titleLines.length,
      }
    }
  }

  const shrunk = shrinkLineSizesToFit(
    titleLines,
    lineSizes,
    columnPx,
    BLOCK_04A_MIN_TITLE_FIT_PX
  )
  return { ...layout, titleLines, lineSizes: shrunk, fontSizePx: shrunk[0] ?? layout.fontSizePx }
}

export async function measureBlock04TitleLayoutWhenReady(title, widthPx, colorOpts) {
  await ensureTitleFonts()
  return measureBlock04TitleLayout(title, widthPx, colorOpts)
}
