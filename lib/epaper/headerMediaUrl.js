/** Trim API media URL — pass through backend values as-is (incl. cdn.example.com). */
export function normalizeHeaderMediaUrl(url) {
  const u = String(url || '').trim()
  return u || ''
}

/** First non-empty URL from candidates (API order preserved). */
export function pickHeaderMediaUrl(...candidates) {
  for (const c of candidates) {
    const u = normalizeHeaderMediaUrl(c)
    if (u) return u
  }
  return ''
}

/** @deprecated use pickHeaderMediaUrl */
export function pickUsableHeaderUrl(...candidates) {
  return pickHeaderMediaUrl(...candidates)
}

export function isUsableHeaderMediaUrl(url) {
  return !!normalizeHeaderMediaUrl(url)
}
