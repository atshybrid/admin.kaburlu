import { BLOCK_12A, columnTopImageHeightPx, columnWidthMm, mmToPx } from './constants.js'

const PX_TO_MM = 25.4 / 96
const BODY_LINE_PX = BLOCK_12A.bodyFontPx * 1.42

function imageObstaclePx() {
  return columnTopImageHeightPx() + BLOCK_12A.imageGapBelowPx + 6
}

export function measureObstacleHeightsPx({ highlights = [], columnTopImages = [] } = {}) {
  const highlightCount = highlights.length
  const highlightsPx = highlightCount
    ? 8 + highlightCount * (BLOCK_12A.headlineLinePx + 6) + 8
    : 0
  const urls = Array.isArray(columnTopImages) ? columnTopImages.filter(Boolean) : []
  const hasTopImg = urls.length > 0
  const topPx = hasTopImg ? imageObstaclePx() : 0
  const imageCol2Px = urls[0] ? topPx : 0
  const imageCol3Px = urls[1] ? topPx : 0
  const imageCol4Px = urls[2] ? topPx : 0
  return {
    highlightsPx,
    imageCol2Px,
    imageCol3Px,
    imageCol4Px,
    highlightsMm: highlightsPx * PX_TO_MM,
    imageCol2Mm: imageCol2Px * PX_TO_MM,
    imageCol3Mm: imageCol3Px * PX_TO_MM,
    imageCol4Mm: imageCol4Px * PX_TO_MM,
  }
}

function charsPerLinePx(colWidthPx) {
  return Math.max(10, Math.floor(colWidthPx / 8.5))
}

export function wordsPerLineForColumn(colWidthMmVal = columnWidthMm()) {
  const colWidthPx = mmToPx(colWidthMmVal)
  return Math.max(3, Math.floor(charsPerLinePx(colWidthPx) / 6.8))
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

function scoreSplit4(w1, w2, w3, words, obsPx, colWidthPx) {
  const total = words.length
  const w4 = total - w1 - w2 - w3
  if (w1 < 1 || w2 < 1 || w3 < 1 || w4 < 1) return null

  const s1 = words.slice(0, w1)
  const s2 = words.slice(w1, w1 + w2)
  const s3 = words.slice(w1 + w2, w1 + w2 + w3)
  const s4 = words.slice(w1 + w2 + w3)
  const b1 = columnBottomPxForSlice(s1, obsPx.highlightsPx, colWidthPx)
  const b2 = columnBottomPxForSlice(s2, obsPx.imageCol2Px, colWidthPx)
  const b3 = columnBottomPxForSlice(s3, obsPx.imageCol3Px, colWidthPx)
  const b4 = columnBottomPxForSlice(s4, obsPx.imageCol4Px, colWidthPx)
  const bottoms = [b1, b2, b3, b4]
  const spreadPx = Math.max(...bottoms) - Math.min(...bottoms)

  const l1 = textLinesForWordSlice(s1, colWidthPx)
  const l2 = textLinesForWordSlice(s2, colWidthPx)
  const l3 = textLinesForWordSlice(s3, colWidthPx)
  const l4 = textLinesForWordSlice(s4, colWidthPx)

  let linePenalty = Math.abs(l1 - l2) * 3 + Math.abs(l2 - l3) * 3 + Math.abs(l3 - l4) * 3
  if (l2 < 2) linePenalty += 30
  if (l4 < 2) linePenalty += 25
  if (b1 < Math.min(b2, b3, b4) - BODY_LINE_PX) linePenalty += 200

  const score = spreadPx * 65 + linePenalty

  return {
    wordsCol1: w1,
    wordsCol2: w2,
    wordsCol3: w3,
    wordsCol4: w4,
    spread: spreadPx * PX_TO_MM,
    spreadPx,
    bottomMm: Math.max(...bottoms) * PX_TO_MM,
    score,
  }
}

export function textHeightMmForWords(wordCount, colWidthMmVal) {
  if (wordCount <= 0) return 0
  return Math.ceil(wordCount / wordsPerLineForColumn(colWidthMmVal)) * lineHeightMm()
}

export function splitWordsForThreadedFourColumns(
  words,
  meta = {},
  colWidthMmVal = columnWidthMm()
) {
  const total = words.length
  const columnTopImages = meta.columnTopImages || []
  const hasTopImg = columnTopImages.filter(Boolean).length > 0
  const obsPx = measureObstacleHeightsPx({
    highlights: meta.highlights || [],
    columnTopImages,
  })
  const colWidthPx = mmToPx(colWidthMmVal)

  if (!total) {
    return {
      wordsCol1: 0,
      wordsCol2: 0,
      wordsCol3: 0,
      wordsCol4: 0,
      spread: 0,
      spreadPx: 0,
      bottomMm: 0,
    }
  }
  if (total < 4) {
    return {
      wordsCol1: total >= 1 ? 1 : 0,
      wordsCol2: total >= 2 ? 1 : 0,
      wordsCol3: total >= 3 ? 1 : 0,
      wordsCol4: Math.max(0, total - 3),
      spread: 0,
      spreadPx: 0,
      bottomMm: 0,
    }
  }

  const weights = [
    obsPx.highlightsPx + (hasTopImg ? obsPx.imageCol2Px * 0.55 : 0) + 100,
    obsPx.imageCol2Px + 36,
    obsPx.imageCol3Px + 36,
    obsPx.imageCol4Px + 36,
  ]
  const wSum = weights.reduce((a, b) => a + b, 0)
  let c1 = Math.max(1, Math.round((total * weights[0]) / wSum))
  let c2 = Math.max(1, Math.round((total * weights[1]) / wSum))
  let c3 = Math.max(1, Math.round((total * weights[2]) / wSum))
  if (hasTopImg) c1 = Math.max(c1, Math.floor(total * 0.36))
  if (c1 + c2 + c3 >= total - 1) {
    c3 = Math.max(1, total - c1 - c2 - 1)
  }

  let best = scoreSplit4(c1, c2, c3, words, obsPx, colWidthPx)
  const win = Math.min(28, Math.floor(total * 0.06))

  for (let w1 = Math.max(1, c1 - win); w1 <= Math.min(total - 3, c1 + win); w1++) {
    for (let w2 = Math.max(1, c2 - win); w2 <= Math.min(total - w1 - 2, c2 + win); w2++) {
      for (let w3 = Math.max(1, c3 - win); w3 <= Math.min(total - w1 - w2 - 1, c3 + win); w3++) {
        const cand = scoreSplit4(w1, w2, w3, words, obsPx, colWidthPx)
        if (cand && (!best || cand.score < best.score)) best = cand
      }
    }
  }

  return (
    best || {
      wordsCol1: c1,
      wordsCol2: c2,
      wordsCol3: c3,
      wordsCol4: total - c1 - c2 - c3,
      spread: 0,
      spreadPx: 0,
      bottomMm: 0,
    }
  )
}
