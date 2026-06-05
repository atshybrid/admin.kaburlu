/**
 * Shared font metrics for BLOCK-08A H&J (measure + render must match).
 */

export const BLOCK_08A_METRICS = {
  fontSizePx: 11,
  lineHeightRatio: 1.48,
  fontFamily: "'Mandali', sans-serif",
  lang: 'te',
}

export const BLOCK_08A_LINE_HEIGHT_PX = Math.ceil(
  BLOCK_08A_METRICS.fontSizePx * BLOCK_08A_METRICS.lineHeightRatio
)

let activeMetrics = { ...BLOCK_08A_METRICS }

let measureRoot = null
let measureRootKey = ''
let spaceWidthCache = null
const wordWidthCache = new Map()

export function getActiveTextMetrics() {
  return activeMetrics
}

export function lineHeightPxForMetrics(metrics = activeMetrics) {
  return Math.ceil(metrics.fontSizePx * metrics.lineHeightRatio)
}

/** Run measure/compose with temporary font metrics (e.g. Style 2 @ 18px). */
export function withTextMetrics(overrides, fn) {
  const prev = activeMetrics
  activeMetrics = { ...BLOCK_08A_METRICS, ...overrides }
  resetTextMetricsCache()
  try {
    return fn()
  } finally {
    activeMetrics = prev
    resetTextMetricsCache()
  }
}

function ensureMeasureRoot() {
  if (typeof document === 'undefined') return null
  const m = activeMetrics
  const key = `${m.fontSizePx}|${m.fontFamily}|${m.lineHeightRatio}`
  if (measureRoot?.isConnected && measureRootKey === key) return measureRoot

  if (measureRoot?.parentNode) measureRoot.parentNode.removeChild(measureRoot)
  measureRoot = document.createElement('div')
  measureRootKey = key
  measureRoot.setAttribute('aria-hidden', 'true')
  measureRoot.style.cssText = [
    'position:fixed',
    'left:-99999px',
    'top:0',
    'visibility:hidden',
    'pointer-events:none',
    'white-space:nowrap',
    `font-size:${m.fontSizePx}px`,
    `line-height:${m.lineHeightRatio}`,
    `font-family:${m.fontFamily}`,
    'font-weight:400',
    'letter-spacing:normal',
    'word-spacing:normal',
  ].join(';')
  document.body.appendChild(measureRoot)
  spaceWidthCache = null
  wordWidthCache.clear()
  return measureRoot
}

export function resetTextMetricsCache() {
  wordWidthCache.clear()
  spaceWidthCache = null
}

let bodyFontsReady = false

/** Mandali must load before measure + compose (else col1 steals full article). */
export async function ensureBlock08BodyFonts() {
  if (typeof document === 'undefined') return
  if (bodyFontsReady) return

  const { ensureBlock04TitleFonts } = await import('./block04TitleFit')
  await ensureBlock04TitleFonts()
  try {
    await document.fonts.load("11px 'Mandali'")
    await document.fonts.ready
  } catch {
    /* ignore */
  }
  resetTextMetricsCache()
  bodyFontsReady = true
}

/** Width of a normal space in body font. */
export function measureSpaceWidthPx() {
  if (typeof document === 'undefined') return 4
  if (spaceWidthCache != null) return spaceWidthCache

  const root = ensureMeasureRoot()
  if (!root) return 4

  root.textContent = ' '
  spaceWidthCache = Math.ceil(root.getBoundingClientRect().width) || 4
  return spaceWidthCache
}

/** Ink width of a word (no trailing space). */
export function measureWordWidthPx(word) {
  const w = String(word || '')
  if (!w) return 0
  if (typeof document === 'undefined') return w.length * 5.5

  const key = w
  if (wordWidthCache.has(key)) return wordWidthCache.get(key)

  const root = ensureMeasureRoot()
  if (!root) return w.length * 5.5

  root.textContent = w
  const width = Math.ceil(root.getBoundingClientRect().width)
  wordWidthCache.set(key, width)
  return width
}

/** Ink width of a phrase (nowrap). */
export function measureInkWidthPx(text) {
  const t = String(text || '').trim()
  if (!t) return 0
  if (typeof document === 'undefined') return t.length * 5.5

  const root = ensureMeasureRoot()
  if (!root) return t.length * 5.5

  root.textContent = t
  return Math.ceil(root.getBoundingClientRect().width)
}
