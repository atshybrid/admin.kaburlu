import { BLOCK_12A } from './constants.js'
import { estimateTitleLines } from './utils.js'
import { measureObstacleHeightsPx, textHeightMmForWords } from './columnTextBand.js'
import { columnWidthMm } from './constants.js'

const PX_TO_MM = 25.4 / 96

function pxToMm(px) {
  return px * PX_TO_MM
}

function bottomGalleryMm(bottomCount) {
  if (!bottomCount) return 0
  const maxPerCol = Math.ceil(bottomCount / 4)
  const slotPx = BLOCK_12A.bottomThumbHeightPx + BLOCK_12A.bottomThumbGapPx
  return pxToMm(maxPerCol * slotPx) + BLOCK_12A.bottomGalleryPadMm
}

export function calculateEstimatedHeight(input) {
  const colW = columnWidthMm()
  const { columnTop, bottom } = input.imageSplit || {
    columnTop: (input.imageUrls || []).slice(0, 3),
    bottom: (input.imageUrls || []).slice(3),
  }

  const titleLines = estimateTitleLines(input.title, BLOCK_12A.titleMaxLines)
  const titlePx = titleLines === 1 ? 52 : titleLines === 2 ? 46 : 40
  const titleMm = pxToMm(titlePx * titleLines * 1.08) + pxToMm(12)

  const subtitleMm = input.subtitle
    ? pxToMm(Math.round(titlePx * BLOCK_12A.subtitleSizeRatio) * 1.3) + pxToMm(8)
    : 0

  const obstacles = measureObstacleHeightsPx({
    highlights: input.highlights || [],
    columnTopImages: columnTop,
  })

  const wordCount =
    input.wordCount ??
    (input.content ? String(input.content).trim().split(/\s+/).filter(Boolean).length : 0)

  const padMm = BLOCK_12A.padTopMm + BLOCK_12A.padBottomMm + BLOCK_12A.gutterMm * 0.5

  const w1 = Math.floor(wordCount * 0.28)
  const w2 = Math.floor(wordCount * 0.24)
  const w3 = Math.floor(wordCount * 0.24)
  const w4 = Math.max(0, wordCount - w1 - w2 - w3)

  const col1BodyMm = textHeightMmForWords(w1, colW)
  const col2BodyMm = textHeightMmForWords(w2, colW)
  const col3BodyMm = textHeightMmForWords(w3, colW)
  const col4BodyMm = textHeightMmForWords(w4, colW)

  const bodyStackMm = Math.max(
    obstacles.highlightsMm + col1BodyMm,
    obstacles.imageCol2Mm + col2BodyMm,
    obstacles.imageCol3Mm + col3BodyMm,
    obstacles.imageCol4Mm + col4BodyMm
  )

  const galleryMm = bottomGalleryMm(bottom.length)
  const totalMm = padMm + titleMm + subtitleMm + bodyStackMm + galleryMm

  return {
    totalMm,
    breakdown: { padMm, titleMm, subtitleMm, bodyStackMm, galleryMm, w1, w2, w3, w4 },
  }
}
