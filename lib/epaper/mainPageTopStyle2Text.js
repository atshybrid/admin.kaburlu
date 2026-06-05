import { BLOCK_TOP8X7_DIMENSIONS } from './mainPageTopBlockRules'

/** Style 2 title word limits (reference layout). */

export const STYLE2_TITLE_IMPORTANT_MAX_WORDS = 3
export const STYLE2_SUBTITLE_MAX_WORDS = 5

export function limitWords(text, maxWords) {
  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!words.length) return ''
  return words.slice(0, Math.max(1, maxWords)).join(' ')
}

/** Main headline — important words only (max 3). */
export function resolveStyle2TitleImportant(title = '', titleImportant = '') {
  const explicit = String(titleImportant || '').trim()
  if (explicit) return limitWords(explicit, STYLE2_TITLE_IMPORTANT_MAX_WORDS)
  return limitWords(title, STYLE2_TITLE_IMPORTANT_MAX_WORDS)
}

/** Green band — subtitle (max 5 words). */
export function resolveStyle2Subtitle(subtitle = '', titleKicker = '') {
  const raw = String(subtitle || titleKicker || '').trim()
  return limitWords(raw, STYLE2_SUBTITLE_MAX_WORDS)
}

/** Collapse runs of spaces; keep paragraph breaks (double newline). */
export function normalizeStyle2ArticleText(text = '') {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b\u200c\u200d\ufeff]/g, '')
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n')
}

/** Split into paragraphs for H&J rendering. */
export function splitStyle2ArticleParagraphs(text = '') {
  const normalized = normalizeStyle2ArticleText(text)
  if (!normalized) return []
  return normalized.split(/\n\n/)
}

/** Style 2 body — single column (merge legacy left/right fields). */
export function mergeStyle2ArticleBody(left = '', right = '') {
  const l = String(left || '').trim()
  const r = String(right || '').trim()
  const merged = l && r ? `${l}\n\n${r}` : l || r
  return normalizeStyle2ArticleText(merged)
}

/** Article column width (px) — left rail 50% beside points. */
export function estimateStyle2ArticleColWidthPx(
  nativeW = BLOCK_TOP8X7_DIMENSIONS.nativeWidthPx,
  layout = {},
  padH = 12
) {
  const inner = nativeW - padH * 2
  const photoShare = layout.contentPhotoShare ?? 0.34
  const photoW = Math.floor(inner * photoShare) + 6
  const leftRail = inner - photoW
  const articleW = Math.floor(leftRail * 0.5) - 14
  return Math.max(120, Math.min(380, articleW))
}
