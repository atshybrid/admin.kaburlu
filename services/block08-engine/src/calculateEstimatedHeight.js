import { BLOCK_08A } from './constants.js'
import { estimateTitleLines } from './utils.js'
import {
  measureObstacleHeightsPx,
  textHeightMmForWords,
} from './columnTextBand.js'
import { columnWidthMm } from './constants.js'

const PX_TO_MM = 25.4 / 96

function pxToMm(px) {
  return px * PX_TO_MM
}

export function calculateEstimatedHeight(input) {
  const colW = columnWidthMm()

  const titleLines = estimateTitleLines(input.title, BLOCK_08A.titleMaxLines)
  const titlePx = titleLines === 1 ? 48 : titleLines === 2 ? 42 : 38
  const titleMm = pxToMm(titlePx * titleLines * 1.08) + pxToMm(10)

  const subtitleMm = input.subtitle
    ? pxToMm(Math.round(titlePx * BLOCK_08A.subtitleSizeRatio) * 1.3) + pxToMm(8)
    : 0

  const obstacles = measureObstacleHeightsPx({
    highlights: input.highlights || [],
    imageUrls: input.imageUrls || [],
  })

  const wordCount =
    input.wordCount ??
    (input.content ? String(input.content).trim().split(/\s+/).filter(Boolean).length : 0)

  const padMm = BLOCK_08A.padTopMm + BLOCK_08A.padBottomMm + BLOCK_08A.gutterMm * 0.5

  const w1 = Math.floor(wordCount * 0.38)
  const w2 = Math.floor(wordCount * 0.32)
  const w3 = Math.max(0, wordCount - w1 - w2)

  const col1BodyMm = textHeightMmForWords(w1, colW)
  const col2BodyMm = textHeightMmForWords(w2, colW)
  const col3BodyMm = textHeightMmForWords(w3, colW)

  const bodyStackMm = Math.max(
    obstacles.highlightsMm + col1BodyMm,
    obstacles.imageCol2Mm + col2BodyMm,
    obstacles.imageCol3Mm + col3BodyMm
  )

  const totalMm = padMm + titleMm + subtitleMm + bodyStackMm

  return {
    totalMm,
    breakdown: { padMm, titleMm, subtitleMm, bodyStackMm, w1, w2, w3 },
  }
}
