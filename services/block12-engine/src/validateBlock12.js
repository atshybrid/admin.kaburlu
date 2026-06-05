import { BLOCK_12A } from './constants.js'
import {
  countWords,
  normalizeHighlights,
  normalizeImageUrls,
  splitTopAndBottomImages,
} from './utils.js'
import { calculateEstimatedHeight } from './calculateEstimatedHeight.js'

export function validateBlock12(article, opts = {}) {
  const errors = []
  const title = String(article?.title || '').trim()
  const subtitle = String(article?.subtitle || '').trim()
  const content = String(article?.content || '').trim()
  const highlights = normalizeHighlights(article?.highlights)
  const imageUrls = normalizeImageUrls(article?.image ?? article?.images)
  const imageSplit = splitTopAndBottomImages(imageUrls)

  if (!title) errors.push('title is required')
  if (!content) errors.push('content is required')

  if (highlights.length > BLOCK_12A.maxHighlights) {
    errors.push(`highlights max ${BLOCK_12A.maxHighlights}`)
  }

  if (imageUrls.length > BLOCK_12A.maxImages) {
    errors.push(`images max ${BLOCK_12A.maxImages} (3 column tops + up to ${BLOCK_12A.maxBottomImages} bottom)`)
  }

  if (imageSplit.bottom.length > BLOCK_12A.maxBottomImages) {
    errors.push(`bottom gallery max ${BLOCK_12A.maxBottomImages} images`)
  }

  const wordCount = countWords(content)
  if (wordCount < BLOCK_12A.minWords) {
    errors.push(`minimum ${BLOCK_12A.minWords} words (got ${wordCount})`)
  }
  if (wordCount > BLOCK_12A.maxWords) {
    errors.push(`maximum ${BLOCK_12A.maxWords} words (got ${wordCount})`)
  }

  const heightInput = {
    title,
    subtitle,
    highlights,
    imageUrls,
    imageSplit,
    wordCount,
    content,
  }
  const estimatedHeightMm =
    opts.estimatedHeightMm ?? calculateEstimatedHeight(heightInput).totalMm

  if (estimatedHeightMm > BLOCK_12A.maxHeightMm) {
    errors.push(
      `estimated height ${estimatedHeightMm.toFixed(1)}mm exceeds max ${BLOCK_12A.maxHeightMm}mm (21in)`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    wordCount,
    estimatedHeightMm: Math.round(estimatedHeightMm * 10) / 10,
    normalized: {
      title,
      subtitle,
      highlights,
      imageUrls,
      imageSplit,
      content,
    },
  }
}
