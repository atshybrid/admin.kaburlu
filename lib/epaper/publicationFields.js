const HEX_COLOR_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

export const DEFAULT_MAIN_SUB_HEADER_COLOR = '#003366'
export const DEFAULT_INNER_SUB_HEADER_COLOR = '#003366'

/** @param {unknown} v */
export function parsePublisherAreasFromApi(v, publishedAreaText) {
  if (Array.isArray(v)) {
    const list = v.map((x) => String(x || '').trim()).filter(Boolean)
    if (list.length) return list
  }
  const t = String(publishedAreaText || '').trim()
  if (!t) return []
  if (t.startsWith('[')) {
    try {
      const arr = JSON.parse(t)
      if (Array.isArray(arr)) return parsePublisherAreasFromApi(arr)
    } catch {
      /* fall through */
    }
  }
  return t
    .split(/[,•|;\n]+/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export function joinPublisherAreas(areas) {
  const list = (areas || []).map((x) => String(x || '').trim()).filter(Boolean)
  return list.length ? list.join(' • ') : ''
}

/** Normalize hex for API; empty → null */
export function hexColorForPayload(v) {
  const s = String(v || '').trim()
  if (!s) return null
  const withHash = s.startsWith('#') ? s : `#${s}`
  if (!HEX_COLOR_RE.test(withHash)) {
    throw new Error('Sub-header color must be #RGB or #RRGGBB (e.g. #003366).')
  }
  return withHash.toUpperCase()
}

export function validateOptionalHexColors(form) {
  for (const [key, label] of [
    ['mainSubHeaderColor', 'Page 1 sub-header color'],
    ['innerSubHeaderColor', 'Page 2+ sub-header color'],
  ]) {
    const raw = String(form[key] || '').trim()
    if (!raw) continue
    const withHash = raw.startsWith('#') ? raw : `#${raw}`
    if (!HEX_COLOR_RE.test(withHash)) {
      return `${label} must be #RGB or #RRGGBB.`
    }
  }
  return ''
}
