import { BLOCK_08A, columnWidthMm, mmToPx } from './constants.js'

const PX_TO_MM = 25.4 / 96
const BODY_LINE_PX = BLOCK_08A.bodyLinePx

function imageObstaclePx(role) {
  const h =
    role === 'secondary'
      ? BLOCK_08A.imageSecondaryMaxHeightPx
      : BLOCK_08A.imagePrimaryMaxHeightPx
  return h + BLOCK_08A.imageGapBelowPx + 6
}

/** Col1 highlights, col2 image1, col3 image2 — CSS pixel heights. */
export function measureObstacleHeightsPx({ highlights = [], imageUrls = [] } = {}) {
  const highlightCount = highlights.length
  const highlightsPx = highlightCount
    ? 8 + highlightCount * (BLOCK_08A.headlineLinePx + 6) + 8
    : 0
  const urls = Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : []
  const imageCol2Px = urls[0] ? imageObstaclePx('primary') : 0
  const imageCol3Px = urls[1] ? imageObstaclePx('secondary') : 0
  return {
    highlightsPx,
    imageCol2Px,
    imageCol3Px,
    highlightsMm: highlightsPx * PX_TO_MM,
    imageCol2Mm: imageCol2Px * PX_TO_MM,
    imageCol3Mm: imageCol3Px * PX_TO_MM,
  }
}

const TELUGU_SCRIPT_RE = /[\u0C00-\u0C7F]/

function charsPerLinePx(colWidthPx, text = '') {
  const sample = String(text || '')
  const teluguChars = (sample.match(TELUGU_SCRIPT_RE) || []).length
  const teluguHeavy = teluguChars > 0 && teluguChars / Math.max(1, sample.length) >= 0.35
  const pxPerChar = teluguHeavy ? 11.4 : 8.2
  return Math.max(8, Math.floor(colWidthPx / pxPerChar))
}

export function wordsPerLineForColumn(colWidthMm = columnWidthMm()) {
  const colWidthPx = mmToPx(colWidthMm)
  return Math.max(3, Math.floor(charsPerLinePx(colWidthPx, 'తెలుగు') / 6.5))
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
  const cpl = charsPerLinePx(colWidthPx, text)
  return Math.max(1, Math.ceil(text.length / cpl))
}

export function textHeightPxForWordSlice(wordSlice, colWidthPx) {
  return textLinesForWordSlice(wordSlice, colWidthPx) * BODY_LINE_PX
}

function columnBottomPxForSlice(wordSlice, obstaclePx, colWidthPx) {
  return obstaclePx + textHeightPxForWordSlice(wordSlice, colWidthPx)
}

function scoreSplit3(w1, w2, words, obsPx, colWidthPx) {
  const total = words.length
  const w3 = total - w1 - w2
  if (w1 < 1 || w2 < 1 || w3 < 1) return null

  const s1 = words.slice(0, w1)
  const s2 = words.slice(w1, w1 + w2)
  const s3 = words.slice(w1 + w2)
  const b1 = columnBottomPxForSlice(s1, obsPx.highlightsPx, colWidthPx)
  const b2 = columnBottomPxForSlice(s2, obsPx.imageCol2Px, colWidthPx)
  const b3 = columnBottomPxForSlice(s3, obsPx.imageCol3Px, colWidthPx)
  const bottoms = [b1, b2, b3]
  const spreadPx = Math.max(...bottoms) - Math.min(...bottoms)

  const l1 = textLinesForWordSlice(s1, colWidthPx)
  const l2 = textLinesForWordSlice(s2, colWidthPx)
  const l3 = textLinesForWordSlice(s3, colWidthPx)

  const extraL1 =
    Math.ceil(Math.max(0, obsPx.imageCol2Px - obsPx.highlightsPx) / BODY_LINE_PX) + 1
  const extraL3 =
    Math.ceil(Math.max(0, obsPx.imageCol2Px - obsPx.imageCol3Px) / BODY_LINE_PX) + 1

  let linePenalty =
    Math.abs(l1 - l2 - extraL1) * 4 + Math.abs(l3 - l2 - extraL3) * 4
  if (l2 < 3) linePenalty += 40
  if (l3 < 2) linePenalty += 60

  const wpl = Math.max(4, Math.floor(charsPerLinePx(colWidthPx) / 6.5))
  const orphan1 = w1 % wpl
  const orphan2 = w2 % wpl
  if (orphan1 > 0 && orphan1 <= 2) linePenalty += 35
  if (orphan2 > 0 && orphan2 <= 3) linePenalty += 28

  const lineSpread = Math.max(l1, l2, l3) - Math.min(l1, l2, l3)
  if (l3 > l2 + extraL3 + 2) linePenalty += (l3 - l2 - extraL3 - 2) * 12
  if (l1 > l2 + extraL1 + 2) linePenalty += (l1 - l2 - extraL1 - 2) * 10
  if (b1 < b3 - BODY_LINE_PX * 2) linePenalty += 80
  if (b2 < b3 - BODY_LINE_PX * 2) linePenalty += 50

  const score = spreadPx * 50 + linePenalty + lineSpread * 8

  return {
    wordsCol1: w1,
    wordsCol2: w2,
    wordsCol3: w3,
    col1HeightMm: textHeightPxForWordSlice(s1, colWidthPx) * PX_TO_MM,
    col2HeightMm: textHeightPxForWordSlice(s2, colWidthPx) * PX_TO_MM,
    col3HeightMm: textHeightPxForWordSlice(s3, colWidthPx) * PX_TO_MM,
    linesCol1: l1,
    linesCol2: l2,
    linesCol3: l3,
    spread: spreadPx * PX_TO_MM,
    spreadPx,
    bottomMm: Math.max(...bottoms) * PX_TO_MM,
    score,
  }
}

export function textHeightMmForWordSlice(wordSlice, colWidthMm) {
  const colWidthPx = mmToPx(colWidthMm)
  return textHeightPxForWordSlice(wordSlice, colWidthPx) * PX_TO_MM
}

export function textHeightMmForWords(wordCount, colWidthMm) {
  if (wordCount <= 0) return 0
  return (
    Math.ceil(wordCount / wordsPerLineForColumn(colWidthMm)) * lineHeightMm()
  )
}

/**
 * Threaded 3-col split — pixel obstacles + even column bottoms (06A-style).
 */
export function splitWordsForThreadedColumns(words, meta = {}, colWidthMmVal = columnWidthMm()) {
  const total = words.length
  const obsPx = measureObstacleHeightsPx({
    highlights: meta.highlights || [],
    imageUrls: meta.imageUrls || [],
  })
  const colWidthPx = mmToPx(colWidthMmVal)

  if (!total) {
    return {
      wordsCol1: 0,
      wordsCol2: 0,
      wordsCol3: 0,
      linesCol1: 0,
      linesCol2: 0,
      linesCol3: 0,
      spread: 0,
      spreadPx: 0,
      bottomMm: 0,
    }
  }
  if (total < 3) {
    const w1 = total >= 1 ? 1 : 0
    const w2 = total >= 2 ? 1 : 0
    const w3 = Math.max(0, total - w1 - w2)
    return {
      wordsCol1: w1,
      wordsCol2: w2,
      wordsCol3: w3,
      linesCol1: w1 ? 1 : 0,
      linesCol2: w2 ? 1 : 0,
      linesCol3: w3 ? 1 : 0,
      spread: 0,
      spreadPx: 0,
      bottomMm: 0,
    }
  }

  let best = null
  for (let w1 = 1; w1 < total - 1; w1++) {
    for (let w2 = 1; w2 < total - w1; w2++) {
      const cand = scoreSplit3(w1, w2, words, obsPx, colWidthPx)
      if (!cand) continue
      if (
        !best ||
        cand.score < best.score ||
        (cand.score === best.score && cand.spreadPx < best.spreadPx)
      ) {
        best = cand
      }
    }
  }

  if (best) {
    const c1 = best.wordsCol1
    const c2 = best.wordsCol2
    for (let w1 = Math.max(1, c1 - 24); w1 <= Math.min(total - 2, c1 + 24); w1++) {
      for (let w2 = Math.max(1, c2 - 24); w2 < total - w1; w2++) {
        const cand = scoreSplit3(w1, w2, words, obsPx, colWidthPx)
        if (cand && cand.score < best.score) best = cand
      }
    }
  }

  return (
    best || {
      wordsCol1: 0,
      wordsCol2: 0,
      wordsCol3: 0,
      linesCol1: 0,
      linesCol2: 0,
      linesCol3: 0,
      spread: 0,
      spreadPx: 0,
      bottomMm: 0,
    }
  )
}
