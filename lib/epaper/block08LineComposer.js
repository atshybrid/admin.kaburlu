/**
 * BLOCK-08A — Quark/InDesign-style H&J Narrow line composer.
 * Paragraph-level DP + tight word spacing (80–103%) + Telugu hyphenation.
 */

import { normalizeFlowText } from './block08BodyTypography'
import {
  clampWordSpacingPx,
  HJ_NARROW,
  narrowSpacingDemerit,
} from './block08HJNarrow'
import {
  BLOCK_08A_LINE_HEIGHT_PX,
  measureInkWidthPx,
  measureSpaceWidthPx,
  measureWordWidthPx,
} from './block08TextMetrics'

const HYPHEN_PENALTY = HJ_NARROW.hyphenPenalty
const ORPHAN_PENALTY = 120
const WIDOW_PENALTY = 120
const RAGGED_LAST_LINE_PENALTY = 6
const LINE_BREAK_PENALTY = 12
const SINGLE_WORD_LINE_PENALTY = 280
const SHORT_LINE_PENALTY = 40

export function tokenizeWords(text) {
  return normalizeFlowText(text)
    .split(/\s+/)
    .filter(Boolean)
}

/** Telugu / Indic syllable hyphen opportunities (Quark-style word breaking). */
export function teluguHyphenBreakPoints(word) {
  const w = String(word || '')
  const points = new Set()
  for (let i = 2; i < w.length - 2; i++) {
    const ch = w[i]
    const prev = w[i - 1]
    if (/[ాీూృేైొోౌ్ౖ]/.test(ch) || (prev === '్' && /[\u0C05-\u0C39]/.test(ch))) {
      points.add(i)
    }
  }
  return [...points].sort((a, b) => a - b)
}

/** Hyphenate to fit column; returns prefix ending with hyphen + remainder. */
export function hyphenateWord(word, maxPrefixWidthPx) {
  const w = String(word || '').replace(/-$/, '')
  if (!w || maxPrefixWidthPx < 10) return null

  const full = measureWordWidthPx(w)
  if (full <= maxPrefixWidthPx) return null

  const candidates = teluguHyphenBreakPoints(w)
  const breakAfter = /[।॥,\-;:\s]/u

  for (let i = w.length - 2; i >= 2; i--) {
    if (breakAfter.test(w[i])) {
      const prefix = w.slice(0, i + 1)
      const suffix = w.slice(i + 1)
      if (suffix.length >= 2 && measureWordWidthPx(prefix) <= maxPrefixWidthPx) {
        return { prefix: `${prefix}-`, suffix, hyphen: true }
      }
    }
  }

  for (let i = candidates.length - 1; i >= 0; i--) {
    const at = candidates[i]
    const prefix = w.slice(0, at)
    const suffix = w.slice(at)
    if (prefix.length >= 2 && suffix.length >= 2 && measureWordWidthPx(prefix) <= maxPrefixWidthPx) {
      return { prefix: `${prefix}-`, suffix, hyphen: true }
    }
  }

  let lo = 2
  let hi = w.length - 2
  let best = 0
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const prefix = w.slice(0, mid)
    if (measureWordWidthPx(prefix) <= maxPrefixWidthPx) {
      best = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  if (best < 2) return null
  return { prefix: `${w.slice(0, best)}-`, suffix: w.slice(best), hyphen: true }
}

function expandOversizedWords(words, columnWidthPx) {
  const colW = Math.max(72, columnWidthPx)
  const out = []
  for (const word of words) {
    if (measureWordWidthPx(word) > colW) {
      const hy = hyphenateWord(word, colW - 4)
      if (hy) {
        out.push(hy.prefix)
        out.push(hy.suffix)
        continue
      }
    }
    out.push(word)
  }
  return out
}

/**
 * @typedef {{ words: string[], justify: boolean, wordSpacingExtraPx: number, hyphenated: boolean }} ComposedLine
 */

export function composeParagraphLines(words, columnWidthPx, options = {}) {
  const colW = Math.max(72, columnWidthPx)
  const spaceW = measureSpaceWidthPx()
  const expanded = expandOversizedWords([...words], colW)
  const n = expanded.length
  if (!n) return []

  const widths = expanded.map((word) => measureWordWidthPx(word))
  const maxLines = options.maxLines ?? Infinity

  const cost = new Array(n + 1).fill(Infinity)
  const next = new Array(n + 1).fill(-1)
  const lineMeta = new Array(n + 1).fill(null)
  cost[n] = 0

  for (let i = n - 1; i >= 0; i--) {
    for (let j = i + 1; j <= n; j++) {
      const count = j - i
      let ink = 0
      for (let k = i; k < j; k++) ink += widths[k]

      const isParagraphEnd = j === n
      const raggedLast = isParagraphEnd && options.articleEndRag !== false
      const gaps = Math.max(0, count - 1)

      if (gaps === 0 && ink > colW + 0.5) continue

      let lineCost = 0
      let justify = false
      let wordSpacingExtraPx = 0
      const lastWord = expanded[j - 1] || ''
      const hyphenated = /-$/.test(lastWord)

      if (!isParagraphEnd) {
        lineCost += LINE_BREAK_PENALTY
        if (count === 1) lineCost += SINGLE_WORD_LINE_PENALTY
        if (count === 2 && ink < colW * 0.4) lineCost += SHORT_LINE_PENALTY
      }

      const shouldJustify = gaps > 0 && (!raggedLast || options.columnBreakEnd)

      if (shouldJustify) {
        const fit = clampWordSpacingPx(spaceW, gaps, colW, ink)
        if (!fit.ok) continue
        lineCost += narrowSpacingDemerit(fit.ratio)
        if (hyphenated) lineCost += HYPHEN_PENALTY
        justify = true
        wordSpacingExtraPx = fit.extraPx
      } else if (raggedLast) {
        justify = false
        if (gaps > 0 && ink < colW * 0.5) lineCost += RAGGED_LAST_LINE_PENALTY
        if (hyphenated) lineCost += HYPHEN_PENALTY * 0.5
      } else if (hyphenated) {
        lineCost += HYPHEN_PENALTY
      }

      if (raggedLast && count === 1 && i > 0) lineCost += ORPHAN_PENALTY
      if (raggedLast && j < n && j === i + 1 && n - j === 1) lineCost += WIDOW_PENALTY

      const total = lineCost + cost[j]
      if (total < cost[i]) {
        cost[i] = total
        next[i] = j
        lineMeta[i] = { justify, wordSpacingExtraPx, hyphenated }
      }
    }
  }

  if (!Number.isFinite(cost[0])) {
    return greedyComposeParagraphLines(expanded, colW, options)
  }

  const lines = []
  let i = 0
  while (i < n && lines.length < maxLines) {
    const j = next[i]
    if (j < 0) break
    const meta = lineMeta[i] || {}
    lines.push({
      words: expanded.slice(i, j),
      justify: meta.justify,
      wordSpacingExtraPx: meta.wordSpacingExtraPx || 0,
      hyphenated: meta.hyphenated,
    })
    i = j
  }

  if (i < n) {
    return greedyComposeParagraphLines(expanded, colW, options)
  }

  return lines
}

/** Always emits every word (greedy H&J Narrow). */
export function composeParagraphLinesFull(words, columnWidthPx, options = {}) {
  return greedyComposeParagraphLines([...words], columnWidthPx, options)
}

function greedyComposeParagraphLines(words, columnWidthPx, options = {}) {
  const colW = Math.max(72, columnWidthPx)
  const spaceW = measureSpaceWidthPx()
  const lines = []
  let i = 0
  const maxLines = options.maxLines ?? Infinity
  const list = [...words]

  while (i < list.length && lines.length < maxLines) {
    if (measureWordWidthPx(list[i]) > colW) {
      const hy = hyphenateWord(list[i], colW - 4)
      if (hy) {
        lines.push({
          words: [hy.prefix],
          justify: false,
          wordSpacingExtraPx: 0,
          hyphenated: true,
        })
        list[i] = hy.suffix
        continue
      }
    }

    let j = i + 1
    let ink = measureWordWidthPx(list[i])

    while (j < list.length) {
      const nextInk = ink + spaceW + measureWordWidthPx(list[j])
      if (nextInk > colW && j > i) break
      ink = nextInk
      j++
    }

    const isLast = j >= list.length
    const slice = list.slice(i, j)
    const gaps = slice.length - 1
    let justify = false
    let wordSpacingExtraPx = 0

    const raggedLast = isLast && options.articleEndRag !== false
    const shouldJustify = gaps > 0 && (!raggedLast || options.columnBreakEnd)

    if (shouldJustify) {
      let lineInk = 0
      for (const w of slice) lineInk += measureWordWidthPx(w)
      const fit = clampWordSpacingPx(spaceW, gaps, colW, lineInk)
      if (fit.ok) {
        justify = true
        wordSpacingExtraPx = fit.extraPx
      } else if (j > i + 1) {
        j--
        continue
      }
    }

    lines.push({
      words: list.slice(i, j),
      justify,
      wordSpacingExtraPx,
      hyphenated: /-$/.test(slice[slice.length - 1] || ''),
    })
    i = j
  }

  return lines
}

export function composeColumnBody(text, columnWidthPx, options = {}) {
  const words = tokenizeWords(text)
  if (!words.length) return { lines: [], heightPx: 0, wordCount: 0 }

  const maxLines =
    options.maxHeightPx != null
      ? Math.max(1, Math.floor(options.maxHeightPx / BLOCK_08A_LINE_HEIGHT_PX))
      : Infinity

  const lines = composeParagraphLines(words, columnWidthPx, {
    maxLines,
    columnBreakEnd: !!options.columnBreakEnd,
    articleEndRag: options.articleEndRag !== false,
  })
  return {
    lines,
    heightPx: lines.length * BLOCK_08A_LINE_HEIGHT_PX,
    wordCount: words.length,
  }
}

export function measureComposedTextHeight(text, columnWidthPx, options = {}) {
  return composeColumnBody(text, columnWidthPx, options).heightPx
}

export function takeWordsForComposedHeight(text, columnWidthPx, maxHeightPx) {
  const words = tokenizeWords(text)
  if (!words.length || maxHeightPx < BLOCK_08A_LINE_HEIGHT_PX) {
    return { text: '', remainder: text, heightPx: 0, lines: [] }
  }

  const maxLines = Math.max(1, Math.floor(maxHeightPx / BLOCK_08A_LINE_HEIGHT_PX))
  let lo = 0
  let hi = words.length
  let best = 0
  let bestLines = []

  while (lo <= hi) {
    const mid = Math.ceil((lo + hi) / 2)
    const lines = composeParagraphLines(words.slice(0, mid), columnWidthPx, { maxLines })
    const h = lines.length * BLOCK_08A_LINE_HEIGHT_PX
    if (h <= maxHeightPx && lines.length <= maxLines) {
      best = mid
      bestLines = lines
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  return {
    text: words.slice(0, best).join(' '),
    remainder: words.slice(best).join(' '),
    heightPx: bestLines.length * BLOCK_08A_LINE_HEIGHT_PX,
    lines: bestLines,
  }
}

export function lastLineInkRatio(lines, columnWidthPx) {
  if (!lines?.length) return 1
  const last = lines[lines.length - 1]
  return measureInkWidthPx(last.words.join(' ')) / Math.max(72, columnWidthPx)
}
