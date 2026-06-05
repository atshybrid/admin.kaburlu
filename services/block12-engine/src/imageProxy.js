/** Safe for HTML attribute src (do not escape & in query strings). */
export function escapeAttrUrl(str) {
  return String(str ?? '').replace(/"/g, '&quot;')
}

/** Same-origin proxy so external images load in preview/demo. */
export function proxiedImageSrc(url, base = '/layout/block12/img') {
  const u = String(url || '').trim()
  if (!u) return ''
  if (u.startsWith('/') || u.startsWith('data:')) return u
  return `${base}?u=${encodeURIComponent(u)}`
}
