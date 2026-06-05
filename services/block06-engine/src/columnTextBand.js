import { BLOCK_06A, columnWidthMm, mmToPx } from './constants.js'

const PX_TO_MM = 25.4 / 96
const BODY_LINE_PX = BLOCK_06A.bodyFontPx * 1.42

/** Obstacles in CSS pixels (matches generateBlock06Css). */
export function measureObstacleHeightsPx({ highlights = [], hasImage = false } = {}) {
  const highlightCount = highlights.length
  const highlightsPx = highlightCount
    ? 8 + highlightCount * (BLOCK_06A.headlineLinePx + 6) + 8
    : 0
  const imagePx = hasImage
    ? BLOCK_06A.imageMaxHeightPx + BLOCK_06A.imageGapBelowPx + 6
    : 0
  return {
    highlightsPx,
    imagePx,
    highlightsMm: highlightsPx * PX_TO_MM,
    imageMm: imagePx * PX_TO_MM,
  }
}

function charsPerLinePx(colWidthPx) {
  return Math.max(12, Math.floor(colWidthPx / 8.2))
}

export function wordsPerLineForColumn(colWidthMm = columnWidthMm()) {
  const colWidthPx = mmToPx(colWidthMm)
  return Math.max(3, Math.floor(charsPerLinePx(colWidthPx) / 6.5))
}

export function lineHeightPx() {
  return BODY_LINE_PX
}

export function lineHeightMm() {
  return BODY_LINE_PX * PX_TO_MM
}

export function textLinesForWordSlice(wordSlice, colWidthPx) {
  const text = wordSlice.join(' ').trim()
  if (!text) return 0
  const cpl = charsPerLinePx(colWidthPx)
  return Math.max(1, Math.ceil(text.length / cpl))
}

export function textHeightPxForWordSlice(wordSlice, colWidthPx) {
  return textLinesForWordSlice(wordSlice, colWidthPx) * BODY_LINE_PX
}

function columnBottomPxForSlice(wordSlice, obstaclePx, colWidthPx) {
  return obstaclePx + textHeightPxForWordSlice(wordSlice, colWidthPx)
}

/** Col1 text should have this many more lines than col2 (image taller than points). */
function expectedExtraLinesCol1(obsPx) {
  const diff = Math.max(0, obsPx.imagePx - obsPx.highlightsPx)
  return Math.max(2, Math.ceil(diff / BODY_LINE_PX) + 1)
}

function scoreSplit(w1, words, obsPx, colWidthPx) {
  const total = words.length
  const w2 = total - w1
  if (w1 < 1 || w2 < 1) return null

  const s1 = words.slice(0, w1)
  const s2 = words.slice(w1)
  const b1 = columnBottomPxForSlice(s1, obsPx.highlightsPx, colWidthPx)
  const b2 = columnBottomPxForSlice(s2, obsPx.imagePx, colWidthPx)
  const spreadPx = Math.abs(b1 - b2)
  const l1 = textLinesForWordSlice(s1, colWidthPx)
  const l2 = textLinesForWordSlice(s2, colWidthPx)
  const expect = expectedExtraLinesCol1(obsPx)
  let linePenalty = Math.abs(l1 - l2 - expect)
  if (l2 > l1 + expect) {
    linePenalty += (l2 - l1 - expect) * 12
  }
  if (l1 < l2 + expect - 2) {
    linePenalty += (l2 + expect - 2 - l1) * 8
  }
  const score = spreadPx * 2 + linePenalty * 4

  return {
    wordsCol1: w1,
    wordsCol2: w2,
    col1HeightMm: textHeightPxForWordSlice(s1, colWidthPx) * PX_TO_MM,
    col2HeightMm: textHeightPxForWordSlice(s2, colWidthPx) * PX_TO_MM,
    linesCol1: l1,
    linesCol2: l2,
    spread: spreadPx * PX_TO_MM,
    spreadPx,
    bottomMm: Math.max(b1, b2) * PX_TO_MM,
  }
}

export function measureObstacleHeightsMm(opts) {
  const px = measureObstacleHeightsPx(opts)
  return { highlightsMm: px.highlightsMm, imageMm: px.imageMm }
}

export function textHeightMmForWordSlice(wordSlice, colWidthMm) {
  const colWidthPx = mmToPx(colWidthMm)
  return textHeightPxForWordSlice(wordSlice, colWidthPx) * PX_TO_MM
}

export function textHeightMmForWords(wordCount, colWidthMm) {
  if (wordCount <= 0) return 0
  const colWidthPx = mmToPx(colWidthMm)
  return Math.ceil(wordCount / wordsPerLineForColumn(colWidthMm)) * lineHeightMm()
}

/**
 * Threaded 2-col split — pixel obstacles + bottom align (Quark/InDesign).
 */
export function splitWordsForThreadedColumns(words, meta = {}, colWidthMm = columnWidthMm()) {
  const total = words.length
  const obsPx = measureObstacleHeightsPx({
    highlights: meta.highlights || [],
    hasImage: !!meta.hasImage,
  })
  const colWidthPx = mmToPx(colWidthMm)

  if (!total) {
    return {
      wordsCol1: 0,
      wordsCol2: 0,
      linesCol1: 0,
      linesCol2: 0,
      spread: 0,
      spreadPx: 0,
      bottomMm: 0,
    }
  }
  if (total === 1) {
    const h = textHeightPxForWordSlice(words, colWidthPx)
    return {
      wordsCol1: 1,
      wordsCol2: 0,
      linesCol1: 1,
      linesCol2: 0,
      spread: 0,
      spreadPx: 0,
      bottomMm: (obsPx.highlightsPx + h) * PX_TO_MM,
    }
  }

  let best = null
  for (let w1 = 1; w1 < total; w1++) {
    const cand = scoreSplit(w1, words, obsPx, colWidthPx)
    if (!cand) continue
    if (
      !best ||
      cand.score < best.score ||
      (cand.score === best.score && cand.spreadPx < best.spreadPx)
    ) {
      best = cand
    }
  }

  if (best) {
    const center = best.wordsCol1
    for (let w1 = Math.max(1, center - 15); w1 <= Math.min(total - 1, center + 15); w1++) {
      const cand = scoreSplit(w1, words, obsPx, colWidthPx)
      if (cand && cand.score < best.score) best = cand
    }
  }

  return (
    best || {
      wordsCol1: 0,
      wordsCol2: 0,
      linesCol1: 0,
      linesCol2: 0,
      spread: 0,
      spreadPx: 0,
      bottomMm: 0,
    }
  )
}
