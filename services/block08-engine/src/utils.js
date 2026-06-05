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

function urlFromImageEntry(entry) {
  if (!entry) return null
  if (typeof entry === 'string' && entry.trim()) return entry.trim()
  if (typeof entry === 'object') {
    return String(entry.src || entry.url || entry.imageUrl || '').trim() || null
  }
  return null
}

/**
 * @param {string|string[]|null|undefined} image
 * @returns {string|null}
 */
export function normalizeImageUrl(image) {
  const urls = normalizeImageUrls(image)
  return urls[0] || null
}

/** Up to 2 images: col2 top, col3 top. */
export function normalizeImageUrls(image) {
  if (!image) return []
  const out = []
  if (typeof image === 'string' && image.trim()) {
    out.push(image.trim())
  } else if (Array.isArray(image)) {
    for (const entry of image) {
      const u = urlFromImageEntry(entry)
      if (u) out.push(u)
      if (out.length >= 2) break
    }
  } else if (typeof image === 'object') {
    const u = urlFromImageEntry(image)
    if (u) out.push(u)
  }
  return out.slice(0, 2)
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
