/**
 * DOM paragraph height at column width (BLOCK-08A threaded flow).
 */

import { BLOCK_08A_BODY_HJ, block08BodyParagraphCssText } from './block08BodyTypography'
import { measureComposedTextHeight } from './block08LineComposer'
import { measureInkWidthPx } from './block08TextMetrics'

const DOM_HEIGHT_CACHE_MAX = 1200
const domHeightCache = new Map()
let domParagraphRoot = null
let domParagraphEl = null

export function clearBlock08DomMeasureCache() {
  domHeightCache.clear()
}

function domHeightCacheKey(text, colWidthPx, opts) {
  const t = String(text || '')
  const tail = t.length > 80 ? t.slice(-80) : t
  return `${Math.round(colWidthPx)}|${opts.showDateline ? 1 : 0}|${opts.textAlignLast || 'justify'}|${t.length}|${tail}`
}

function ensureDomParagraphMeasurer(colWidthPx, opts = {}) {
  if (typeof document === 'undefined') return null
  if (!domParagraphRoot) {
    domParagraphRoot = document.createElement('div')
    domParagraphRoot.setAttribute('aria-hidden', 'true')
    domParagraphRoot.style.cssText =
      'position:fixed;left:-99999px;top:0;visibility:hidden;pointer-events:none;box-sizing:border-box;'
    domParagraphEl = document.createElement('p')
    domParagraphEl.setAttribute('lang', 'te')
    domParagraphRoot.appendChild(domParagraphEl)
    document.body.appendChild(domParagraphRoot)
  }
  domParagraphRoot.style.width = `${Math.max(40, colWidthPx)}px`
  const alignLast = opts?.textAlignLast === 'left' ? 'left' : BLOCK_08A_BODY_HJ.textAlignLast
  domParagraphEl.style.cssText = `${block08BodyParagraphCssText({ textAlignLast: alignLast })};font-size:${BLOCK_08A_BODY_HJ.fontSize};line-height:${BLOCK_08A_BODY_HJ.lineHeight};font-family:${BLOCK_08A_BODY_HJ.fontFamily};width:100%;margin:0;padding:0;text-align-last:${alignLast};-webkit-text-align-last:${alignLast};`
  return domParagraphEl
}

function flowItemToNode(item, container, opts = {}) {
  const { dateline = '', showDateline = false } = opts
  if (item?.type === 'heading') {
    const h3 = document.createElement('h3')
    h3.style.cssText = 'font-size:12px;font-weight:700;line-height:15px;margin:8px 0 4px;'
    h3.textContent = String(item.content || '')
    container.appendChild(h3)
    return
  }
  const text = String(item?.content || item || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return
  const p = document.createElement('p')
  p.setAttribute('lang', 'te')
  p.style.cssText = block08BodyParagraphCssText()
  if (showDateline && dateline) {
    const span = document.createElement('span')
    span.style.fontWeight = '700'
    span.textContent = `${dateline} `
    p.appendChild(span)
  }
  p.appendChild(document.createTextNode(text))
  container.appendChild(p)
}

/**
 * Height of one column's text block as rendered (all fragments → single <p>).
 */
export function measureColumnFragmentsHeightDom(indices, bodyItems, colWidthPx, opts = {}) {
  if (!indices?.length || !bodyItems?.length) return 0

  const parts = []
  let hasHeading = false

  for (const idx of indices) {
    const item = bodyItems[idx]
    if (!item) continue
    if (item.type === 'heading') {
      hasHeading = true
      parts.push(`\n${String(item.content || '')}\n`)
      continue
    }
    const text = String(item?.content ?? item ?? '').trim()
    if (text) parts.push(text)
  }

  if (!parts.length) return 0

  if (hasHeading) {
    let h = 0
    const root = typeof document !== 'undefined' ? document.createElement('div') : null
    if (root) {
      root.style.cssText = 'position:fixed;left:-99999px;visibility:hidden;'
      document.body.appendChild(root)
    }
    for (const idx of indices) {
      const item = bodyItems[idx]
      if (!item) continue
      h += measureFlowItemHeightDom(item, colWidthPx, opts)
    }
    if (root) document.body.removeChild(root)
    return h
  }

  return measureFlowItemHeightDom({ content: parts.join(' ') }, colWidthPx, opts)
}

/** Single-line ink width (for last-line fill check). */
export function measureInkWidthDom(text, colWidthPx) {
  if (!text?.trim()) return 0
  return measureInkWidthPx(text)
}

export function measureFlowItemHeightDom(item, colWidthPx, opts = {}) {
  if (!item) return 0
  const text = String(item?.content || item || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return 0

  if (item?.type === 'heading') {
    if (typeof document === 'undefined') return 23
    const root = document.createElement('div')
    root.setAttribute('aria-hidden', 'true')
    root.style.cssText = 'position:fixed;left:-99999px;visibility:hidden;'
    flowItemToNode(item, root, opts)
    document.body.appendChild(root)
    const height = Math.ceil(root.getBoundingClientRect().height)
    document.body.removeChild(root)
    return height
  }

  if (typeof document === 'undefined') {
    const chars = Math.max(14, Math.floor(colWidthPx / 5.5))
    const lines = Math.max(1, Math.ceil(text.length / chars))
    return Math.ceil(lines * 16.5)
  }

  const maxHeightPx = opts.maxHeightPx
  if (maxHeightPx > 0) {
    return measureComposedTextHeight(text, colWidthPx, { maxHeightPx })
  }
  return measureDomParagraphHeight(text, colWidthPx, opts)
}

/** Justified paragraph height at column width (reused DOM node + cache). */
export function measureDomParagraphHeight(text, colWidthPx, opts = {}) {
  const t = String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t.trim()) return 0
  if (typeof document === 'undefined') {
    const chars = Math.max(14, Math.floor(colWidthPx / 5.5))
    return Math.ceil(Math.max(1, Math.ceil(t.length / chars)) * 16.5)
  }

  const key = domHeightCacheKey(t, colWidthPx, opts)
  if (domHeightCache.has(key)) return domHeightCache.get(key)

  const p = ensureDomParagraphMeasurer(colWidthPx, opts)
  if (!p) return 0

  const { dateline = '', showDateline = false } = opts
  p.replaceChildren()
  if (showDateline && dateline) {
    const span = document.createElement('span')
    span.style.fontWeight = '700'
    span.textContent = `${dateline} `
    p.appendChild(span)
  }
  p.appendChild(document.createTextNode(t))

  const height = Math.ceil(p.getBoundingClientRect().height)
  if (domHeightCache.size >= DOM_HEIGHT_CACHE_MAX) domHeightCache.clear()
  domHeightCache.set(key, height)
  return height
}

/** Word-count binary search — height matches on-screen justified paragraph. */
export function takeWordsForDomHeight(text, colWidthPx, maxHeightPx, opts = {}) {
  const words = String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!words.length || maxHeightPx < 16) {
    return { text: '', remainder: String(text || ''), heightPx: 0 }
  }

  let lo = 0
  let hi = words.length
  let best = 0
  let bestHeight = 0

  while (lo <= hi) {
    const mid = Math.ceil((lo + hi) / 2)
    const trial = words.slice(0, mid).join(' ')
    const h = measureDomParagraphHeight(trial, colWidthPx, opts)
    if (h <= maxHeightPx) {
      best = mid
      bestHeight = h
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  return {
    text: words.slice(0, best).join(' '),
    remainder: words.slice(best).join(' '),
    heightPx: bestHeight,
  }
}
