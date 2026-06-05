/**
 * Which articles fit each block (word / char bands for workbench testing).
 * BLOCK-04A = 4in rail; BLOCK-03A = ~4in max height cap.
 */

import { BLOCK_03A_IDEAL_WORDS_MIN, BLOCK_03A_IDEAL_WORDS_MAX } from '../rules/articleRules'
import { BLOCK_04A_ARTICLE_FIT } from './block04LockedRules'
import {
  BLOCK_06A_ARTICLE_FIT,
  BLOCK_08A_ARTICLE_FIT,
  exceedsBlock04A,
  decide06Or08Block,
  suggestWideBlockAfter04A,
} from './wideBlockRules'
import { collectArticleImages } from './articleToBlockProps'

export { exceedsBlock04A, decide06Or08Block, suggestWideBlockAfter04A } from './wideBlockRules'

/** @typedef {{ wordsMin: number, wordsMax: number, charsMax: number, heightIn?: number, label: string }} BlockFitRule */

/** @type {Record<string, BlockFitRule>} */
export const BLOCK_FIT_RULES = {
  'BLOCK-02A': {
    label: '2in brief',
    wordsMin: 0,
    wordsMax: 44,
    charsMax: 550,
    heightIn: 2,
  },
  'BLOCK-03A': {
    label: '3in · ~4in height cap',
    wordsMin: BLOCK_03A_IDEAL_WORDS_MIN,
    wordsMax: BLOCK_03A_IDEAL_WORDS_MAX,
    charsMax: 2400,
    heightIn: 4,
  },
  'BLOCK-04A': { ...BLOCK_04A_ARTICLE_FIT },
  'BLOCK-06A': { ...BLOCK_06A_ARTICLE_FIT },
  'BLOCK-08A': { ...BLOCK_08A_ARTICLE_FIT },
  'BLOCK-09A': {
    label: '9in · 3 col',
    wordsMin: 200,
    wordsMax: 500,
    charsMax: 12000,
    heightIn: 9,
  },
  'BLOCK-12A': {
    label: '12in lead',
    wordsMin: 140,
    wordsMax: 9999,
    charsMax: 20000,
    heightIn: 12,
  },
}

export function getBlockFitRule(blockCode) {
  return BLOCK_FIT_RULES[blockCode] || BLOCK_FIT_RULES['BLOCK-04A']
}

function stripHtml(str) {
  return String(str || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseWordCountFromArticle(article) {
  const n = Number(article?.wordCount ?? article?.word_count ?? article?.words)
  if (Number.isFinite(n) && n > 0) return Math.round(n)
  const text = stripHtml(
    article?.content || article?.body || article?.printBody || article?.excerpt || ''
  )
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

export function parseCharCountFromArticle(article, wordCount = 0) {
  const n = Number(article?.charCount ?? article?.characterCount ?? article?.char_count)
  if (Number.isFinite(n) && n > 0) return Math.round(n)
  const title = String(article?.title || article?.headline || '').trim()
  const body = stripHtml(
    article?.content || article?.body || article?.printBody || article?.excerpt || ''
  )
  const combined = `${title} ${body}`.trim()
  if (combined) return combined.length
  if (wordCount > 0) return Math.round(wordCount * 5.8)
  return 0
}

export function parseImageCountFromArticle(article) {
  if (!article) return 0
  return collectArticleImages(article, 6).length
}

/** Quick suggest from list metadata (no full body). */
export function suggestBlockFromCounts(wordCount, imageCount = 1, charCount = 0) {
  const w = Number(wordCount) || 0
  const c = Number(charCount) || 0
  const img = Number(imageCount) || 0

  if (img >= 4) return 'BLOCK-12A'
  if (img >= 2) {
    if (w < 90) return 'BLOCK-06A'
    if (w < 200) return 'BLOCK-08A'
    return 'BLOCK-12A'
  }
  if (img === 1) {
    if (!exceedsBlock04A(w, c) && w <= BLOCK_04A_ARTICLE_FIT.wordsMax) return 'BLOCK-04A'
    const wide = suggestWideBlockAfter04A(w, c, img)
    if (wide) return wide
    if (w < 230) return 'BLOCK-08A'
    return 'BLOCK-12A'
  }
  if (w < 75) return 'BLOCK-04A'
  if (!exceedsBlock04A(w, c) && w <= BLOCK_04A_ARTICLE_FIT.wordsMax) return 'BLOCK-04A'
  const wide = suggestWideBlockAfter04A(w, c, img)
  if (wide) return wide
  if (w < 260) return 'BLOCK-08A'
  return 'BLOCK-12A'
}

/**
 * @param {{ wordCount?: number, charCount?: number, titleChars?: number }} item
 * @param {string} blockCode
 */
export function articleFitsBlock(item, blockCode) {
  const rule = getBlockFitRule(blockCode)
  const words = Number(item.wordCount) || 0
  const chars = Number(item.charCount) || 0
  if (words > 0 && (words < rule.wordsMin || words > rule.wordsMax)) return false
  if (chars > 0 && rule.charsMax && chars > rule.charsMax) return false
  return true
}

/**
 * @param {Array<Record<string, unknown>>} items
 * @param {string} blockCode
 * @param {{ onlyFits?: boolean }} [opts]
 */
export function partitionArticlesForBlock(items, blockCode, opts = {}) {
  const fitting = []
  const other = []
  for (const item of items) {
    if (articleFitsBlock(item, blockCode)) fitting.push(item)
    else other.push(item)
  }
  if (opts.onlyFits) return { fitting, other: [] }
  return { fitting, other }
}

export function formatArticleOptionLabel(item) {
  const w = item.wordCount ? `${item.wordCount}w` : '?w'
  const c = item.charCount ? `${item.charCount}c` : ''
  const fit = item.fitsActive ? '✓' : '·'
  const title = String(item.title || item.id || '').slice(0, 36)
  const suffix = (item.title || '').length > 36 ? '…' : ''
  const pts =
    (item.highlightCount || 0) > 0 || item.hasPoints
      ? `points:true (${item.highlightCount || item.pointCount || '?'})`
      : 'points:false'
  const imgs =
    (item.imageCount || 0) >= 2 || item.isMultiImage
      ? `multi-images (${item.imageCount || '?'})`
      : (item.imageCount || 0) === 1
        ? '1-image'
        : 'no-image'
  return `${fit} ${w}${c ? ` · ${c}` : ''} · ${pts} · ${imgs} — ${title}${suffix}`
}
