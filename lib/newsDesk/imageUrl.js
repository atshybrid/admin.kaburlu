/** Accept http(s) image URLs for News Desk intake (backend validates http(s)). */
export function isHttpImageUrl(raw) {
  const s = String(raw || '').trim()
  if (!s) return false
  try {
    const url = new URL(s)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function normalizeImageUrlList(urls, existing = []) {
  const seen = new Set((existing || []).map((u) => String(u).trim()))
  const next = []
  for (const raw of urls || []) {
    const u = String(raw || '').trim()
    if (!isHttpImageUrl(u) || seen.has(u)) continue
    seen.add(u)
    next.push(u)
  }
  return next
}