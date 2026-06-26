import { BLOCK_08A } from './constants.js'
import { countWords, normalizeHighlights, normalizeImageUrls } from './utils.js'
import { calculateEstimatedHeight } from './calculateEstimatedHeight.js'

export function validateBlock08(article, opts = {}) {
  const layoutPreview = !!opts.layoutPreview
  const errors = []
  const title = String(article?.title || '').trim()
  const subtitle = String(article?.subtitle || '').trim()
  const content = String(article?.content || '').trim()
  const highlights = normalizeHighlights(article?.highlights)
  const imageUrls = normalizeImageUrls(article?.image ?? article?.images)

  if (!title) errors.push('title is required')
  if (!content) errors.push('content is required')

  if (highlights.length > BLOCK_08A.maxHighlights) {
    errors.push(`highlights max ${BLOCK_08A.maxHighlights}`)
  }

  if (imageUrls.length > BLOCK_08A.maxImages) {
    errors.push(`images max ${BLOCK_08A.maxImages} (col2 + col3 tops)`)
  }

  const wordCount = countWords(content)
  if (!layoutPreview) {
    if (wordCount < BLOCK_08A.minWords) {
      errors.push(`minimum ${BLOCK_08A.minWords} words (got ${wordCount})`)
    }
    if (wordCount > BLOCK_08A.maxWords) {
      errors.push(`maximum ${BLOCK_08A.maxWords} words (got ${wordCount})`)
    }
  }

  const heightInput = {
    title,
    subtitle,
    highlights,
    imageUrls,
    wordCount,
    content,
  }
  const estimatedHeightMm =
    opts.estimatedHeightMm ?? calculateEstimatedHeight(heightInput).totalMm

  if (!layoutPreview && estimatedHeightMm > BLOCK_08A.maxHeightMm) {
    errors.push(
      `estimated height ${estimatedHeightMm.toFixed(1)}mm exceeds max ${BLOCK_08A.maxHeightMm}mm`
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
      content,
    },
  }
}
