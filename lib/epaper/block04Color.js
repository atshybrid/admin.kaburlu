/** Shared colour helpers for BLOCK-04A (title / subtitle). */

export function hashHue(str) {
  let h = 0
  const s = String(str || '')
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h) % 360
}

export function hslFromSeed(seed, sat = 58, light = 32) {
  return `hsl(${hashHue(seed)}, ${sat}%, ${light}%)`
}

/** Strong ink-friendly hues for colon-rule highlight (newspaper print). */
const NEWSPAPER_COLON_HIGHLIGHTS = [
  '#B80000',
  '#003D7A',
  '#8B0000',
  '#1B5E20',
  '#5B21B6',
  '#9A3412',
]

export function colonHighlightColor(title, category = 'general') {
  const i = hashHue(`${title}|${category}|colon-highlight`) % NEWSPAPER_COLON_HIGHLIGHTS.length
  return NEWSPAPER_COLON_HIGHLIGHTS[i]
}

/** Hex from API, else random HSL when enabled, else default ink. */
export function resolveBlock04TitleColor(titleColor, titleColorEnabled, title, category) {
  const raw = String(titleColor || '').trim()
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(raw)) return raw
  const enabled =
    titleColorEnabled === true
    || titleColorEnabled === 'true'
    || titleColorEnabled === 1
    || raw === 'true'
    || String(titleColorEnabled).toLowerCase() === 'yes'
  if (enabled) return hslFromSeed(`${title}|${category}|title`, 52, 28)
  return '#1a1a1a'
}

/** Subtitle always uses a stable random hue (different seed from title). */
export function resolveBlock04SubtitleColor(subtitle, title) {
  return hslFromSeed(`${subtitle}|${title}|sub`, 55, 38)
}
