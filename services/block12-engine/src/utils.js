import { BLOCK_12A } from './constants.js'

export function countWords(text) {
  const t = String(text || '').trim()
  if (!t) return 0
  return t.split(/\s+/).filter(Boolean).length
}

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

/** All images up to 16. */
export function normalizeImageUrls(image) {
  if (!image) return []
  const out = []
  if (typeof image === 'string' && image.trim()) {
    out.push(image.trim())
  } else if (Array.isArray(image)) {
    for (const entry of image) {
      const u = urlFromImageEntry(entry)
      if (u) out.push(u)
      if (out.length >= BLOCK_12A.maxImages) break
    }
  } else if (typeof image === 'object') {
    const u = urlFromImageEntry(image)
    if (u) out.push(u)
  }
  return out.slice(0, BLOCK_12A.maxImages)
}

/** Col2–4 tops (first 3), rest → bottom gallery cols 1–4. */
export function splitTopAndBottomImages(imageUrls) {
  const urls = Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : []
  return {
    columnTop: urls.slice(0, BLOCK_12A.maxColumnTopImages),
    bottom: urls.slice(BLOCK_12A.maxColumnTopImages, BLOCK_12A.maxImages),
  }
}

export function normalizeHighlights(highlights) {
  if (!Array.isArray(highlights)) return []
  return highlights
    .map((h) => (typeof h === 'string' ? h : h?.text || h?.content || ''))
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, BLOCK_12A.maxHighlights)
}

export function estimateTitleLines(title, maxLines = 3) {
  const t = String(title || '').trim()
  if (!t) return 1
  if (/[:：]/.test(t)) return Math.min(maxLines, 2)
  const chars = t.length
  if (chars <= 32) return 1
  if (chars <= 64) return 2
  return maxLines
}
