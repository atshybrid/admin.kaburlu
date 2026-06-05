import { BLOCK_06A } from './constants.js'
import { countWords, normalizeHighlights, normalizeImageUrl } from './utils.js'
import { calculateEstimatedHeight } from './calculateEstimatedHeight.js'

/**
 * @typedef {object} Block06ArticleInput
 * @property {string} title
 * @property {string} [subtitle]
 * @property {string[]} [highlights]
 * @property {string|string[]} [image]
 * @property {string} content
 */

/**
 * @param {Block06ArticleInput} article
 * @param {{ estimatedHeightMm?: number }} [opts]
 */
export function validateBlock06(article, opts = {}) {
  const layoutPreview = !!opts.layoutPreview
  const errors = []
  const title = String(article?.title || '').trim()
  const subtitle = String(article?.subtitle || '').trim()
  const content = String(article?.content || '').trim()
  const highlights = normalizeHighlights(article?.highlights)
  const imageUrl = normalizeImageUrl(article?.image)

  if (!title) errors.push('title is required')
  if (!content) errors.push('content is required')

  if (highlights.length > BLOCK_06A.maxHighlights) {
    errors.push(`highlights max ${BLOCK_06A.maxHighlights}`)
  }

  const rawImages = article?.image
  if (Array.isArray(rawImages) && rawImages.length > BLOCK_06A.maxImages) {
    errors.push(`image max ${BLOCK_06A.maxImages}`)
  }

  const wordCount = countWords(content)
  if (!layoutPreview) {
    if (wordCount < BLOCK_06A.minWords) {
      errors.push(`minimum ${BLOCK_06A.minWords} words (got ${wordCount})`)
    }
    if (wordCount > BLOCK_06A.maxWords) {
      errors.push(`maximum ${BLOCK_06A.maxWords} words (got ${wordCount})`)
    }
  }

  const heightInput = {
    title,
    subtitle,
    highlights,
    hasImage: !!imageUrl,
    wordCount,
    content,
  }
  const estimatedHeightMm =
    opts.estimatedHeightMm ?? calculateEstimatedHeight(heightInput).totalMm

  if (!layoutPreview && estimatedHeightMm > BLOCK_06A.maxHeightMm) {
    errors.push(
      `estimated height ${estimatedHeightMm.toFixed(1)}mm exceeds max ${BLOCK_06A.maxHeightMm}mm`
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
      imageUrl,
      content,
    },
  }
}
