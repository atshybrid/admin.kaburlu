/**
 * Accurate title line width checks (DOM when available, canvas fallback).
 */

import { BLOCK_04A_TITLE_FIT, BLOCK_04A_TYPOGRAPHY } from './block04LockedRules'

function titleLineHeightForSize(fontSizePx) {
  const fs = Math.max(fontSizePx, 26)
  if (fs >= 34) return 1
  return Math.min(1.06, 1.02 + 4 / fs)
}

const GLYPH_EDGE_PX = 10

const FONT_FAMILY = BLOCK_04A_TYPOGRAPHY.titleFontFamily
const RAIL_INSET_PX = BLOCK_04A_TITLE_FIT.railInsetPx
const GLYPH_PAD_PX = BLOCK_04A_TITLE_FIT.glyphPadPx
const CLAMP_BUFFER_PX = BLOCK_04A_TITLE_FIT.clampBufferPx
const MAX_COLON_HIGHLIGHT_RATIO = BLOCK_04A_TITLE_FIT.maxColonHighlightRatio

let domMeasureEl = null

function canMeasure() {
  return typeof document !== 'undefined'
}

const TITLE_WRAP_PAD_PX = 6

/** Usable width inside gutters — titles must not cross this (conservative vs DOM). */
export function effectiveColumnPx(columnPx, opts = {}) {
  if (opts.wide) return effectiveWideTitlePx(columnPx)
  const sidePad = (BLOCK_04A_TYPOGRAPHY.titleSidePadPx || 3) * 2 + TITLE_WRAP_PAD_PX
  return Math.max(120, Math.floor(columnPx || 0) - RAIL_INSET_PX - GLYPH_PAD_PX - sidePad)
}

/** 6in/8in full rail — conservative inset (DOM Ramabhadra often wider than canvas). */
export function effectiveWideTitlePx(columnPx) {
  return Math.max(180, Math.floor(columnPx || 0) - 28)
}

function applyTitleTextMetrics(textEl, sizePx) {
  if (!textEl) return
  textEl.style.fontSize = `${sizePx}px`
  textEl.style.lineHeight = String(titleLineHeightForSize(sizePx))
}

function getDomMeasureEl() {
  if (!canMeasure()) return null
  if (!domMeasureEl) {
    domMeasureEl = document.createElement('span')
    domMeasureEl.setAttribute('aria-hidden', 'true')
    domMeasureEl.style.cssText =
      'position:fixed;left:-99999px;top:0;visibility:hidden;white-space:nowrap;font-weight:400;letter-spacing:normal;pointer-events:none;'
    document.body.appendChild(domMeasureEl)
  }
  return domMeasureEl
}

function canvasLineWidth(line, fontSizePx, fontFamily = FONT_FAMILY) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return 0
  ctx.font = `400 ${fontSizePx}px ${fontFamily}`
  return ctx.measureText(String(line || '')).width
}

export function measureLineWidthPx(line, fontSizePx, fontFamily = FONT_FAMILY) {
  const el = getDomMeasureEl()
  if (el) {
    el.style.fontFamily = fontFamily
    el.style.fontSize = `${fontSizePx}px`
    el.style.letterSpacing = 'normal'
    el.textContent = String(line || '')
    return el.getBoundingClientRect().width
  }
  if (!canMeasure()) return 0
  return canvasLineWidth(line, fontSizePx, fontFamily)
}

export function titleLineFitsColumn(line, fontSizePx, columnPx, fontFamily = FONT_FAMILY, opts = {}) {
  const limit = effectiveColumnPx(columnPx, opts)
  return measureLineWidthPx(line, fontSizePx, fontFamily) <= limit
}

export function allTitleLinesFit(titleLines, lineSizes, columnPx, fontFamily = FONT_FAMILY, opts = {}) {
  return titleLines.every((line, i) =>
    titleLineFitsColumn(line, lineSizes[i] || lineSizes[0], columnPx, fontFamily, opts)
  )
}

export function shrinkLineSizesToFit(titleLines, lineSizes, columnPx, minPx = 26, fontFamily = FONT_FAMILY, opts = {}) {
  const sizes = [...lineSizes]
  if (!titleLines.length) return sizes

  let guard = 120
  while (guard-- > 0 && !allTitleLinesFit(titleLines, sizes, columnPx, fontFamily, opts)) {
    let decreased = false
    for (let i = 0; i < titleLines.length; i++) {
      const sz = sizes[i] ?? sizes[0]
      if (!titleLineFitsColumn(titleLines[i], sz, columnPx, fontFamily, opts) && sz > minPx) {
        sizes[i] = sz - 1
        decreased = true
      }
    }
    if (!decreased) {
      const maxIdx = sizes.reduce((best, s, i) => (s > (sizes[best] ?? 0) ? i : best), 0)
      if ((sizes[maxIdx] ?? minPx) > minPx) sizes[maxIdx] -= 1
      else break
    }
  }

  return sizes
}

export function maxFontSizeThatFits(line, columnPx, minPx, maxPx, fontFamily = FONT_FAMILY, opts = {}) {
  for (let s = maxPx; s >= minPx; s--) {
    if (titleLineFitsColumn(line, s, columnPx, fontFamily, opts)) return s
  }
  return minPx
}

export function titleTextOverflowsRail(lineEl, textEl) {
  const limit = railLimitPx(lineEl)
  if (!limit || !textEl) return false
  return lineInkWidthPx(textEl) > limit
}

export async function ensureBlock04TitleFonts() {
  if (typeof document === 'undefined' || !document.fonts?.load) return
  try {
    await Promise.all([
      document.fonts.load('400 26px Ramabhadra'),
      document.fonts.load('400 58px Ramabhadra'),
      document.fonts.load('400 18px Mandali'),
    ])
    await document.fonts.ready
  } catch {
    /* ignore */
  }
}

/**
 * Clamp a rendered line so scrollWidth never exceeds parent rail (real DOM).
 * @returns {number} final font size px
 */
export function lineInkWidthPx(textEl) {
  if (!textEl) return 0
  return Math.ceil(
    Math.max(textEl.scrollWidth, textEl.getBoundingClientRect().width)
  )
}

export function railLimitPx(lineEl) {
  if (!lineEl) return 0
  const railPx = lineEl.clientWidth
  if (railPx < 40) return 0
  return Math.max(72, railPx - CLAMP_BUFFER_PX - GLYPH_EDGE_PX - 4)
}

export function clampElementToRail(lineEl, textEl, minPx = 26) {
  if (!lineEl || !textEl) return minPx
  const limit = railLimitPx(lineEl)
  if (!limit) return parseFloat(textEl.style.fontSize) || minPx

  let size = Math.round(parseFloat(textEl.style.fontSize) || 38)

  while (size > minPx) {
    applyTitleTextMetrics(textEl, size)
    if (lineInkWidthPx(textEl) <= limit) break
    size -= 1
  }

  applyTitleTextMetrics(textEl, size)
  return size
}

/**
 * Fit all title lines to their line rails (real DOM). Shrinks overflowing lines;
 * optional lockEqualSizes keeps both lines on the same px (subtitle rule).
 */
export function fitTitleLinesToRail(lineEls, textEls, initialSizes, minPx = 26, opts = {}) {
  const lockEqual = !!opts.lockEqualSizes
  const count = Math.min(lineEls?.length || 0, textEls?.length || 0, initialSizes?.length || 0)
  if (!count) return [...(initialSizes || [])]

  const sizes = initialSizes.slice(0, count).map((s) => Math.round(s || 38))
  const limits = lineEls.slice(0, count).map((el) => railLimitPx(el))

  const applyAll = () => {
    for (let i = 0; i < count; i++) {
      if (textEls[i]) applyTitleTextMetrics(textEls[i], sizes[i])
    }
  }

  applyAll()

  const anyOverflow = () =>
    textEls.slice(0, count).some(
      (el, i) => el && limits[i] > 0 && lineInkWidthPx(el) > limits[i]
    )

  let guard = 200
  while (guard-- > 0 && anyOverflow()) {
    if (lockEqual) {
      const next = Math.max(minPx, Math.min(...sizes) - 1)
      if (next === Math.min(...sizes)) break
      for (let i = 0; i < count; i++) sizes[i] = next
      applyAll()
      continue
    }

    let shrunk = false
    for (let i = 0; i < count; i++) {
      if (!textEls[i] || limits[i] <= 0) continue
      if (lineInkWidthPx(textEls[i]) <= limits[i]) continue
      if (sizes[i] > minPx) {
        sizes[i] -= 1
        applyTitleTextMetrics(textEls[i], sizes[i])
        shrunk = true
      }
    }
    if (!shrunk) {
      const idx = sizes.reduce((best, s, i) =>
        lineInkWidthPx(textEls[i]) > limits[i] && s > (sizes[best] ?? 0) ? i : best
      , 0)
      if (sizes[idx] > minPx) {
        sizes[idx] -= 1
        applyTitleTextMetrics(textEls[idx], sizes[idx])
      } else break
    }
  }

  return sizes
}

/**
 * Short titles: grow line size until ink fills ~86% of rail (within maxPx).
 */
export function growTitleLinesToFillRail(lineEls, textEls, sizes, minPx = 26, maxPx = 58, opts = {}) {
  const fillRatio = opts.fillRatio ?? 0.86
  const count = Math.min(lineEls?.length || 0, textEls?.length || 0, sizes?.length || 0)
  if (!count) return [...(sizes || [])]

  const out = sizes.slice(0, count).map((s) => Math.round(s || minPx))
  const limits = lineEls.slice(0, count).map((el) => railLimitPx(el))

  for (let i = 0; i < count; i++) {
    const limit = limits[i]
    const textEl = textEls[i]
    if (!textEl || limit < 80) continue

    let size = out[i]
    let ink = 0
    applyTitleTextMetrics(textEl, size)
    ink = lineInkWidthPx(textEl)
    if (ink >= limit * fillRatio) continue

    while (size < maxPx) {
      const next = size + 1
      applyTitleTextMetrics(textEl, next)
      const nextInk = lineInkWidthPx(textEl)
      if (nextInk > limit) break
      size = next
      ink = nextInk
      if (ink >= limit * fillRatio) break
    }
    out[i] = size
  }

  if (opts.lockEqualSizes && count > 1) {
    const unified = Math.min(maxPx, Math.max(...out))
    for (let i = 0; i < count; i++) {
      out[i] = unified
      if (textEls[i]) applyTitleTextMetrics(textEls[i], unified)
    }
  }

  for (let i = 0; i < count; i++) {
    if (lineEls[i] && textEls[i]) {
      out[i] = clampElementToRail(lineEls[i], textEls[i], minPx)
    }
  }

  return out
}

export function maxSubtitleSizeThatFits(text, columnPx, titleSizePx, minPx = 14) {
  const cap = Math.max(minPx, Math.floor(titleSizePx * 0.5))
  return maxFontSizeThatFits(String(text || '').trim(), columnPx, minPx, cap)
}

export function computeColonBalancedLineSizes({
  line1,
  line2,
  columnPx,
  minPx = 38,
  maxPx = 58,
  highlightSide = 'after',
  maxHighlightRatio = MAX_COLON_HIGHLIGHT_RATIO,
  fitOpts = {},
}) {
  const size1Base = maxFontSizeThatFits(line1, columnPx, minPx, maxPx, FONT_FAMILY, fitOpts)
  const size2Base = maxFontSizeThatFits(line2, columnPx, minPx, maxPx, FONT_FAMILY, fitOpts)

  let size1 = size1Base
  let size2 = size2Base

  if (highlightSide === 'before') {
    const boostCap = Math.ceil(size2Base * maxHighlightRatio)
    size1 = maxFontSizeThatFits(
      line1,
      columnPx,
      minPx,
      Math.min(size1Base, boostCap, maxPx),
      FONT_FAMILY,
      fitOpts
    )
    size2 = size2Base
  } else {
    const boostCap = Math.ceil(size1Base * maxHighlightRatio)
    size2 = maxFontSizeThatFits(
      line2,
      columnPx,
      minPx,
      Math.min(size2Base, boostCap, maxPx),
      FONT_FAMILY,
      fitOpts
    )
    size1 = size1Base
  }

  return shrinkLineSizesToFit([line1, line2], [size1, size2], columnPx, minPx, FONT_FAMILY, fitOpts)
}
