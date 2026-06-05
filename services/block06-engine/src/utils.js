/** @param {string} text */
export function countWords(text) {
  const t = String(text || '').trim()
  if (!t) return 0
  return t.split(/\s+/).filter(Boolean).length
}

/** @param {string} str */
export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * @param {string|string[]|null|undefined} image
 * @returns {string|null}
 */
export function normalizeImageUrl(image) {
  if (!image) return null
  if (typeof image === 'string' && image.trim()) return image.trim()
  if (Array.isArray(image) && image.length) {
    const first = image[0]
    if (typeof first === 'string') return first.trim()
    if (first && typeof first === 'object') {
      return String(first.src || first.url || first.imageUrl || '').trim() || null
    }
  }
  return null
}

/**
 * @param {string[]|null|undefined} highlights
 * @returns {string[]}
 */
export function normalizeHighlights(highlights) {
  if (!Array.isArray(highlights)) return []
  return highlights
    .map((h) => (typeof h === 'string' ? h : h?.text || h?.content || ''))
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 2)
}

/**
 * Rough title line count for height estimate (Telugu-friendly char width).
 * @param {string} title
 */
export function estimateTitleLines(title, maxLines = 3) {
  const t = String(title || '').trim()
  if (!t) return 1
  if (/[:：]/.test(t)) return Math.min(maxLines, 2)
  const chars = t.length
  if (chars <= 28) return 1
  if (chars <= 56) return 2
  return maxLines
}
