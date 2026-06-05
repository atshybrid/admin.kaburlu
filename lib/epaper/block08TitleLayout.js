/**
 * BLOCK-08A title on 7.5in rail: max font when short; 2–3 lines when long; never overflow.
 */

import {
  BLOCK_04A_MAX_TITLE_PX,
  BLOCK_04A_MAX_TITLE_LINES,
  BLOCK_04A_TITLE_MAX_HEIGHT_MM,
  titleLineHeight,
} from './block04TitleMetrics'
import {
  tokenizeTeluguTitle,
  isTitleWidow,
  getOrderedSplitIndices,
  analyzeColonTitle,
  wideDisplayTitle,
  colonTitleGapPx,
  colonTitleLineStackPx,
  colonTitleLineHeightPx,
} from './block04TitleSmart'
import {
  titleLineFitsColumn,
  allTitleLinesFit,
  shrinkLineSizesToFit,
  computeColonBalancedLineSizes,
} from './block04TitleFit'

const WIDE_OPTS = { wide: true }
const MM_TO_PX = 96 / 25.4
const MAX_TITLE_HEIGHT_PX = Math.floor(BLOCK_04A_TITLE_MAX_HEIGHT_MM * MM_TO_PX)

function fitsTitleHeight(lineSizes, lineCount, gapPx = 0, stackPx = 0) {
  const lh =
    lineCount > 1
      ? Math.max(...lineSizes.map((px) => colonTitleLineHeightPx(px)))
      : titleLineHeight(lineSizes[0] || 38, 1)
  const lines = lineSizes.reduce((sum, px) => sum + px * lh, 0)
  const between = lineCount > 1 ? Math.max(0, gapPx - stackPx) : 0
  return lines + between <= MAX_TITLE_HEIGHT_PX
}

function packLayout(lines, sizes, extra = {}) {
  const lineSizes = sizes.map((s) => Math.round(s))
  const gap =
    lines.length > 1 ? colonTitleGapPx(lineSizes[0], lineSizes[1]) : 0
  const stack =
    lines.length > 1 ? colonTitleLineStackPx(lineSizes[0], lineSizes[1]) : 0
  return {
    fontSizePx: lineSizes[0],
    lineHeight:
      lines.length > 1
        ? Math.max(...lineSizes.map((px) => colonTitleLineHeightPx(px)))
        : titleLineHeight(lineSizes[0], 1),
    lines: lines.length,
    titleLines: lines,
    lineSizes,
    lineGapPx: gap,
    lineStackPx: stack,
    ...extra,
  }
}

function tryOneLine(text, columnPx, minPx, maxPx) {
  const lineText = wideDisplayTitle(text)
  if (!lineText) return null
  const colon = analyzeColonTitle(text)

  for (let size = maxPx; size >= minPx; size--) {
    if (!titleLineFitsColumn(lineText, size, columnPx, undefined, WIDE_OPTS)) continue
    if (!fitsTitleHeight([size], 1)) continue
    return packLayout([lineText], [size], {
      colonAccent: !!colon,
      highlightSide: colon?.highlightSide,
      hideColon: !!colon,
    })
  }
  return null
}

function tryColonTwoLines(text, columnPx, minPx, maxPx) {
  const colon = analyzeColonTitle(text)
  if (!colon || colon.displayTitleLines.length < 2) return null
  const [l1, l2] = colon.displayTitleLines

  for (let tryMax = maxPx; tryMax >= minPx; tryMax--) {
    let sizes = computeColonBalancedLineSizes({
      line1: l1,
      line2: l2,
      columnPx,
      minPx,
      maxPx: tryMax,
      highlightSide: colon.highlightSide,
      fitOpts: WIDE_OPTS,
    })
    sizes = shrinkLineSizesToFit([l1, l2], sizes, columnPx, minPx, undefined, WIDE_OPTS)
    if (!allTitleLinesFit([l1, l2], sizes, columnPx, undefined, WIDE_OPTS)) continue
    if (isTitleWidow([l1, l2])) continue
    const gap = colonTitleGapPx(sizes[0], sizes[1])
    const stack = colonTitleLineStackPx(sizes[0], sizes[1])
    if (!fitsTitleHeight(sizes, 2, gap, stack)) continue
    return packLayout([l1, l2], sizes, {
      colonAccent: true,
      highlightSide: colon.highlightSide,
      hideColon: true,
    })
  }
  return null
}

function tryWordTwoLines(units, text, columnPx, minPx, maxPx) {
  if (units.length < 2) return null

  for (let size = maxPx; size >= minPx; size--) {
    for (const { split } of getOrderedSplitIndices(units, text)) {
      if (units.length - split === 1 && split > 1) continue
      const l1 = units.slice(0, split).join(' ')
      const l2 = units.slice(split).join(' ')
      if (!titleLineFitsColumn(l1, size, columnPx, undefined, WIDE_OPTS)) continue
      if (!titleLineFitsColumn(l2, size, columnPx, undefined, WIDE_OPTS)) continue
      const titleLines = [l1, l2]
      if (isTitleWidow(titleLines)) continue
      let sizes = shrinkLineSizesToFit(titleLines, [size, size], columnPx, minPx, undefined, WIDE_OPTS)
      if (!allTitleLinesFit(titleLines, sizes, columnPx, undefined, WIDE_OPTS)) continue
      const gap = colonTitleGapPx(sizes[0], sizes[1])
      const stack = colonTitleLineStackPx(sizes[0], sizes[1])
      if (!fitsTitleHeight(sizes, 2, gap, stack)) continue
      return packLayout(titleLines, sizes)
    }
  }
  return null
}

function tryThreeLines(units, text, columnPx, minPx, maxPx) {
  const n = units.length
  if (n < 3) return null

  const tries = []
  for (let s1 = 1; s1 < n - 1; s1++) {
    for (let s2 = s1 + 1; s2 < n; s2++) {
      const d = Math.abs(s1 - n / 3) + Math.abs(s2 - (2 * n) / 3)
      tries.push({ s1, s2, d })
    }
  }
  tries.sort((a, b) => a.d - b.d)

  for (let size = maxPx; size >= minPx; size--) {
    for (const { s1, s2 } of tries) {
      const titleLines = [
        units.slice(0, s1).join(' '),
        units.slice(s1, s2).join(' '),
        units.slice(s2).join(' '),
      ]
      if (titleLines.some((l) => !l.trim())) continue
      let sizes = shrinkLineSizesToFit(
        titleLines,
        [size, size, size],
        columnPx,
        minPx,
        undefined,
        WIDE_OPTS
      )
      if (!allTitleLinesFit(titleLines, sizes, columnPx, undefined, WIDE_OPTS)) continue
      const gap = colonTitleGapPx(sizes[0], sizes[2])
      const stack = colonTitleLineStackPx(sizes[0], sizes[2])
      if (!fitsTitleHeight(sizes, 3, gap, stack)) continue
      return packLayout(titleLines, sizes)
    }
  }
  return null
}

/**
 * @param {string} text
 * @param {number} columnPx — 7.5in content width px
 * @param {{ minPx?: number, maxPx?: number, maxLines?: number }} [opts]
 */
export function layoutBlock08Title(text, columnPx, opts = {}) {
  const raw = String(text || '').trim()
  const minPx = opts.minPx ?? 35
  const maxPx = opts.maxPx ?? BLOCK_04A_MAX_TITLE_PX
  const maxLines = Math.min(opts.maxLines ?? 3, BLOCK_04A_MAX_TITLE_LINES)

  if (!raw) {
    return {
      fontSizePx: minPx,
      lineHeight: titleLineHeight(minPx, 1),
      lines: 1,
      titleLines: [''],
      lineSizes: [minPx],
    }
  }

  const display = wideDisplayTitle(raw)
  const units = tokenizeTeluguTitle(display)
  const wordCount = units.length
  const longTitle =
    display.length > 24 ||
    wordCount >= 5 ||
    display.length >= 28 ||
    !!opts.preferMultiLineOnly

  /** Long copy: try 2–3 lines first so “కిషన్‌రెడ్డి” etc. stay inside 7.5in */
  if (longTitle && maxLines >= 2) {
    const colonTwo = tryColonTwoLines(raw, columnPx, minPx, maxPx)
    if (colonTwo) return colonTwo
    const wordTwo = tryWordTwoLines(units, display, columnPx, minPx, maxPx)
    if (wordTwo) return wordTwo
    if (maxLines >= 3) {
      const three = tryThreeLines(units, display, columnPx, minPx, maxPx)
      if (three) return three
    }
  }

  const one = tryOneLine(raw, columnPx, minPx, maxPx)
  if (one) {
    const fitsRail = allTitleLinesFit(
      one.titleLines,
      one.lineSizes,
      columnPx,
      undefined,
      WIDE_OPTS
    )
    const cramped = one.lineSizes[0] <= minPx + 3 && (wordCount >= 5 || display.length >= 28)
    if (fitsRail && !cramped) return one
  }

  if (maxLines >= 2) {
    const colonTwo = tryColonTwoLines(raw, columnPx, minPx, maxPx)
    if (colonTwo) return colonTwo
    const wordTwo = tryWordTwoLines(units, display, columnPx, minPx, maxPx)
    if (wordTwo) return wordTwo
  }

  if (maxLines >= 3) {
    const three = tryThreeLines(units, display, columnPx, minPx, maxPx)
    if (three) return three
  }

  if (one) return one

  const floorSizes = shrinkLineSizesToFit(
    [display],
    [minPx],
    columnPx,
    minPx,
    undefined,
    WIDE_OPTS
  )
  return packLayout([display], floorSizes)
}
