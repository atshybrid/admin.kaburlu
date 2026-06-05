/**
 * BLOCK-08A — visual analysis for editorial layout family selection.
 */

export const LAYOUT_FAMILIES = {
  PORTRAIT: '08A-PORTRAIT',
  SQUARE: '08A-SQUARE',
  WIDE: '08A-WIDE',
  SIDEIMAGE: '08A-SIDEIMAGE',
  TEXTHEAVY: '08A-TEXTHEAVY',
}

import { detectImageShape, matchImageSubject } from './editorialImageSubject'

export { detectImageShape }

export function estimateHeadlineWeight(title, { measuredInkRatio = 0 } = {}) {
  const text = String(title || '').trim()
  const len = text.length
  let weight = 'light'
  if (len <= 20) weight = 'heavy'
  else if (len <= 40) weight = 'medium'

  if (measuredInkRatio >= 0.92) weight = 'light'
  else if (measuredInkRatio >= 0.85 && weight === 'heavy') weight = 'medium'

  return weight
}

export function estimateBodyDensity(wordCount) {
  const w = Number(wordCount) || 0
  if (w < 120) return 'light'
  if (w <= 240) return 'medium'
  return 'heavy'
}

export function countArticleWords(paragraphs = [], title = '') {
  const parts = paragraphs.map((p) => String(p?.content ?? p ?? ''))
  if (title) parts.unshift(String(title))
  const text = parts.join(' ')
  return text.split(/\s+/).filter(Boolean).length
}

function estimateVisualWeight({ imageShape, imageSubject, hasImage, bodyDensity }) {
  if (!hasImage) return 'text'
  if (imageSubject === 'sensitive') return 'text-dominant'
  if (imageShape === 'landscape') return 'wide-dominant'
  if (imageShape === 'portrait' && imageSubject === 'emotional') return 'human-dominant'
  if (imageShape === 'square') return 'symbol-dominant'
  if (bodyDensity === 'heavy') return 'text-heavy'
  return 'balanced'
}

export function selectLayoutFamily({
  imageShape = 'unknown',
  imageSubject = 'general',
  hasImage = false,
  landscapeDominance = false,
}) {
  if (imageSubject === 'sensitive') return LAYOUT_FAMILIES.SIDEIMAGE

  if (imageShape === 'portrait' && imageSubject === 'emotional') {
    return LAYOUT_FAMILIES.PORTRAIT
  }

  if (imageShape === 'square' && (imageSubject === 'symbolic' || imageSubject === 'general')) {
    return LAYOUT_FAMILIES.SQUARE
  }

  if (imageShape === 'landscape' || landscapeDominance) {
    return LAYOUT_FAMILIES.WIDE
  }

  if (!hasImage || imageSubject === 'general') {
    return LAYOUT_FAMILIES.TEXTHEAVY
  }

  if (imageShape === 'portrait') return LAYOUT_FAMILIES.PORTRAIT
  if (imageShape === 'square') return LAYOUT_FAMILIES.SQUARE

  return LAYOUT_FAMILIES.TEXTHEAVY
}

/**
 * @param {object} article — { title, subtitle, category, highlights, images, paragraphs, imageWidth, imageHeight }
 * @param {{ measuredTitleInkRatio?: number }} [opts]
 */
export function analyzeBlock08Visuals(article = {}, opts = {}) {
  const primary = (article.images || [])[0] || {}
  const w = Number(article.imageWidth || primary.width || primary.naturalWidth || 0)
  const h = Number(article.imageHeight || primary.height || primary.naturalHeight || 0)
  const hasImage = !!(primary.src || primary.url)
  const imageShape = hasImage ? detectImageShape(w, h) : 'none'
  const imageSubject = hasImage ? matchImageSubject(primary, article) : 'none'
  const wordCount = countArticleWords(article.paragraphs, '')
  const headlineWeight = estimateHeadlineWeight(article.title, {
    measuredInkRatio: opts.measuredTitleInkRatio ?? 0,
  })
  const bodyDensity = estimateBodyDensity(wordCount)
  const landscapeDominance =
    imageShape === 'landscape' && (w / Math.max(h, 1) >= 1.35 || imageSubject === 'infrastructure')

  const layoutFamily = selectLayoutFamily({
    imageShape: imageShape === 'none' ? 'unknown' : imageShape,
    imageSubject,
    hasImage,
    landscapeDominance,
  })

  const visualWeight = estimateVisualWeight({
    imageShape,
    imageSubject,
    hasImage,
    bodyDensity,
  })

  return {
    imageShape,
    imageSubject,
    visualWeight,
    headlineWeight,
    bodyDensity,
    layoutFamily,
    wordCount,
    titleCharLen: String(article.title || '').trim().length,
    hasImage,
    hasHighlights: (article.highlights || []).length > 0,
    imageAspect: w && h ? w / h : 0,
  }
}
