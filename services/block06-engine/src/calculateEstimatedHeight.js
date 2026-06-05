import { BLOCK_06A } from './constants.js'
import { estimateTitleLines } from './utils.js'
import {
  lineHeightMm,
  measureObstacleHeightsPx,
  textHeightMmForWords,
  wordsPerLineForColumn,
} from './columnTextBand.js'
import { columnWidthMm } from './constants.js'

const PX_TO_MM = 25.4 / 96

function pxToMm(px) {
  return px * PX_TO_MM
}

export function calculateEstimatedHeight(input) {
  const colW = columnWidthMm()
  const wpl = wordsPerLineForColumn(colW)
  const lineMm = lineHeightMm()

  const titleLines = estimateTitleLines(input.title, BLOCK_06A.titleMaxLines)
  const titlePx = titleLines === 1 ? 48 : titleLines === 2 ? 42 : 38
  const titleMm = pxToMm(titlePx * titleLines * 1.08) + pxToMm(10)

  const subtitleMm = input.subtitle
    ? pxToMm(Math.round(titlePx * BLOCK_06A.subtitleSizeRatio) * 1.3) + pxToMm(8)
    : 0

  const obstacles = measureObstacleHeightsPx({
    highlights: input.highlights || [],
    hasImage: input.hasImage,
  })

  const wordCount =
    input.wordCount ??
    (input.content ? String(input.content).trim().split(/\s+/).filter(Boolean).length : 0)

  const padMm = BLOCK_06A.padTopMm + BLOCK_06A.padBottomMm + BLOCK_06A.gutterMm * 0.5

  const wordsCol1 = Math.min(wordCount, Math.max(1, Math.floor(wordCount * 0.55)))
  const wordsCol2 = Math.max(0, wordCount - wordsCol1)

  const col1BodyMm = textHeightMmForWords(wordsCol1, colW)
  const col2BodyMm = textHeightMmForWords(wordsCol2, colW)
  const bodyStackMm = Math.max(
    obstacles.highlightsMm + col1BodyMm,
    obstacles.imageMm + col2BodyMm
  )

  const totalMm = padMm + titleMm + subtitleMm + bodyStackMm

  return {
    totalMm,
    breakdown: {
      padMm,
      titleMm,
      subtitleMm,
      highlightsMm: obstacles.highlightsMm,
      imageMm: obstacles.imageMm,
      col1BodyMm,
      col2BodyMm,
      bodyStackMm,
      wordsCol1,
      wordsCol2,
      col1WordCap: Math.floor((lineMm > 0 ? 120 / lineMm : 8) * wpl),
      col2WordCap: Math.floor((lineMm > 0 ? 120 / lineMm : 8) * wpl),
    },
  }
}
