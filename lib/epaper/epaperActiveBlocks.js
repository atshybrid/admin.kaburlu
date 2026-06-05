/**
 * Which block types are shown in admin UI / auto-assign (temporary toggles).
 * Components stay in repo — re-enable by removing codes from DISABLED list.
 */

export const TEMPORARILY_DISABLED_BLOCK_CODES = ['BLOCK-02A', 'BLOCK-03A', 'BLOCK-09A']

export const ACTIVE_BLOCK_CODES = [
  'BLOCK-TOP8x7',
  'BLOCK-04A',
  'BLOCK-06A',
  'BLOCK-08A',
  'BLOCK-12A',
]

const DISABLED_SET = new Set(TEMPORARILY_DISABLED_BLOCK_CODES)

/** When a disabled code is stored on an article, map to nearest active block. */
const ACTIVE_FALLBACK = {
  'BLOCK-02A': 'BLOCK-04A',
  'BLOCK-03A': 'BLOCK-04A',
  'BLOCK-09A': 'BLOCK-08A',
}

export function isBlockCodeActive(code) {
  const c = String(code || '').trim().toUpperCase()
  return !!c && !DISABLED_SET.has(c)
}

export function coerceToActiveBlockCode(code, fallback = 'BLOCK-04A') {
  const c = String(code || '').trim().toUpperCase()
  if (!c) return fallback
  if (DISABLED_SET.has(c)) return ACTIVE_FALLBACK[c] || fallback
  return c
}

export function filterActiveBlockCodes(codes = []) {
  return codes.filter((c) => isBlockCodeActive(c))
}
