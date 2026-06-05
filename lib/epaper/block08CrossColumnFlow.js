/**
 * BLOCK-08A — continuous text col1 → col2 (below image) → col3, even bottoms.
 * Threaded 3-col flow + print H&J line composer (measure + render share metrics).
 */

import { normalizeFlowText } from './block08BodyTypography'
import { takeWordsForComposedHeight, tokenizeWords } from './block08LineComposer'
import {
  measureDomParagraphHeight,
  measureFlowItemHeightDom,
  measureInkWidthDom,
  takeWordsForDomHeight,
} from './block08Measure'
import { BLOCK_08A_LINE_HEIGHT_PX } from './block08TextMetrics'

const COLUMN_COUNT = 3
const BOTTOM_TOLERANCE_PX = 3
const LINE_HEIGHT_PX = BLOCK_08A_LINE_HEIGHT_PX
const CENTER_COL_INDEX = 1
/** Col2 has fixed image — obstacle height marks “image column”. */
const CENTER_IMAGE_OBS_MIN_PX = 96
const CENTER_MIN_WORDS = 18

function centerColumnHasImage(obstacles) {
  return (obstacles[CENTER_COL_INDEX] || 0) >= CENTER_IMAGE_OBS_MIN_PX
}

function centerWordCount(cols) {
  return String(cols[CENTER_COL_INDEX] || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function canShiftTextOutOfCenter(cols) {
  return centerWordCount(cols) > CENTER_MIN_WORDS
}

const RENDERED_BOTTOM_SANE_MAX_PX = 1400

/** Measure rendered <p> bottom per column (screen truth — catches measure vs CSS drift). */
export function measureRenderedColumnTextBottoms(columnsEl) {
  if (!columnsEl?.children?.length) return null
  const bottoms = []
  for (let i = 0; i < columnsEl.children.length; i++) {
    const col = columnsEl.children[i]
    const p = col?.querySelector?.('[data-text-flow] p')
    if (!p) {
      bottoms.push(0)
      continue
    }
    const flow = col.querySelector('[data-text-flow]')
    const flowTop = flow?.offsetTop ?? 0
    const colCap = Math.min(
      RENDERED_BOTTOM_SANE_MAX_PX,
      Math.max(col.clientHeight || 0, col.offsetHeight || 0, 320) + 24
    )
    let bottom = flowTop + p.offsetHeight
    if (bottom > colCap || bottom > RENDERED_BOTTOM_SANE_MAX_PX) {
      bottom = Math.min(flowTop + p.scrollHeight, colCap)
    }
    if (bottom > RENDERED_BOTTOM_SANE_MAX_PX) {
      return null
    }
    bottoms.push(bottom)
  }
  return bottoms.length === COLUMN_COUNT ? bottoms : null
}

/** Col2 text runs past col1/col3 — move words out of center (screen truth). */
export function nudgeCenterColumnWhenTooDeep(columnTexts, columnsEl) {
  const rendered = measureRenderedColumnTextBottoms(columnsEl)
  if (!rendered) return columnTexts

  const centerEl = columnsEl.children?.[CENTER_COL_INDEX]
  if (!centerEl?.querySelector?.('[class*="imageObstacle"]')) return columnTexts

  const target = Math.max(rendered[0], rendered[2])
  if (rendered[1] <= target + 8) return columnTexts

  const gapPx = Math.max(0, rendered[1] - target)
  const wordMoves = Math.min(80, Math.max(6, Math.ceil(gapPx / (LINE_HEIGHT_PX * 0.85))))

  let cols = columnTexts.map((t) => String(t || ''))
  for (let k = 0; k < wordMoves; k++) {
    let moved = false
    if (cols[CENTER_COL_INDEX]?.trim()) {
      const r = shiftLastWord(cols[CENTER_COL_INDEX], cols[2])
      if (r.from !== cols[CENTER_COL_INDEX]) {
        cols[CENTER_COL_INDEX] = r.from
        cols[2] = r.to
        moved = true
      }
    }
    if (!moved && cols[CENTER_COL_INDEX]?.trim()) {
      const r = shiftFirstWord(cols[CENTER_COL_INDEX], cols[0])
      if (r.from !== cols[CENTER_COL_INDEX]) {
        cols[CENTER_COL_INDEX] = r.from
        cols[0] = r.to
        moved = true
      }
    }
    if (!moved) break
  }
  return cols
}

/**
 * If col3 text ends higher on screen, move words from col1/col2 (max 2 layout passes).
 */
export function nudgeCol3ToRenderedBottom(columnTexts, columnsEl) {
  const rendered = measureRenderedColumnTextBottoms(columnsEl)
  if (!rendered) return columnTexts

  const target = Math.max(rendered[0], rendered[1])
  if (rendered[2] >= target - 8) return columnTexts

  const centerEl = columnsEl.children?.[CENTER_COL_INDEX]
  const centerHasImage = !!centerEl?.querySelector?.('[class*="imageObstacle"]')

  const gapPx = Math.max(0, target - rendered[2])
  const wordMoves = Math.min(64, Math.max(4, Math.ceil(gapPx / (LINE_HEIGHT_PX * 0.9))))

  let cols = columnTexts.map((t) => String(t || ''))
  for (let k = 0; k < wordMoves; k++) {
    let moved = false
    if (!centerHasImage && cols[1]?.trim()) {
      const r = shiftLastWord(cols[1], cols[2])
      if (r.from !== cols[1]) {
        cols[1] = r.from
        cols[2] = r.to
        moved = true
      }
    }
    if (!moved && cols[0]?.trim()) {
      const r = shiftLastWord(cols[0], cols[2])
      if (r.from !== cols[0]) {
        cols[0] = r.from
        cols[2] = r.to
        moved = true
      }
    }
    if (!moved) break
  }
  return cols
}

/** When col3 runs past col1/col2 on screen, move words into shorter columns. */
export function nudgeCol3WhenTooDeep(columnTexts, columnsEl) {
  const rendered = measureRenderedColumnTextBottoms(columnsEl)
  if (!rendered) return columnTexts

  const target = Math.max(rendered[0], rendered[1])
  if (rendered[2] <= target + 8) return columnTexts

  const centerEl = columnsEl.children?.[CENTER_COL_INDEX]
  const centerHasImage = !!centerEl?.querySelector?.('[class*="imageObstacle"]')

  const gapPx = Math.max(0, rendered[2] - target)
  const wordMoves = Math.min(96, Math.max(8, Math.ceil(gapPx / (LINE_HEIGHT_PX * 0.88))))

  let cols = columnTexts.map((t) => String(t || ''))
  for (let k = 0; k < wordMoves; k++) {
    let moved = false
    if (centerHasImage && cols[2]?.trim() && cols[1]?.trim()) {
      const r = shiftFirstWord(cols[2], cols[1])
      if (r.from !== cols[2]) {
        cols[2] = r.from
        cols[1] = r.to
        moved = true
      }
    }
    if (!moved && cols[2]?.trim() && cols[0]?.trim()) {
      const r = shiftFirstWord(cols[2], cols[0])
      if (r.from !== cols[2]) {
        cols[2] = r.from
        cols[0] = r.to
        moved = true
      }
    }
    if (!moved) break
  }
  return cols
}

/** Screen check: col2 text below image should reach col1 text depth. */
export function nudgeCenterColumnToRenderedDepth(columnTexts, columnsEl) {
  const rendered = measureRenderedColumnTextBottoms(columnsEl)
  if (!rendered) return columnTexts

  const centerEl = columnsEl.children?.[CENTER_COL_INDEX]
  if (!centerEl?.querySelector?.('[class*="imageObstacle"]')) return columnTexts

  const target = rendered[0]
  if (rendered[1] >= target - 8) return columnTexts

  const gapPx = Math.max(0, target - rendered[1])
  const wordMoves = Math.min(72, Math.max(6, Math.ceil(gapPx / (LINE_HEIGHT_PX * 0.85))))

  let cols = columnTexts.map((t) => String(t || ''))
  for (let k = 0; k < wordMoves; k++) {
    let moved = false
    if (cols[2]?.trim()) {
      const r = shiftFirstWord(cols[2], cols[1])
      if (r.from !== cols[2]) {
        cols[2] = r.from
        cols[1] = r.to
        moved = true
      }
    }
    if (!moved && cols[0]?.trim()) {
      const r = shiftLastWord(cols[0], cols[1])
      if (r.from !== cols[0]) {
        cols[0] = r.from
        cols[1] = r.to
        moved = true
      }
    }
    if (!moved) break
  }
  return cols
}

export function mergeBodyItemsToFlowText(items = []) {
  const parts = []
  for (const item of items) {
    if (!item) continue
    if (item.type === 'heading') {
      const h = String(item.content || '').trim()
      if (h) parts.push(h)
      continue
    }
    const text = String(item.content ?? item ?? '').trim()
    if (text) parts.push(text)
  }
  return normalizeFlowText(parts.join(' '))
}

function measureTextFast(text, colWidthPx) {
  const t = String(text || '').trim()
  if (!t) return 0
  const chars = Math.max(14, Math.floor(colWidthPx / 5.5))
  const lines = Math.max(1, Math.ceil(t.length / chars))
  return lines * LINE_HEIGHT_PX
}

function measureText(text, colWidthPx, opts) {
  const t = String(text || '')
  if (!t.trim()) return 0
  if (opts?.fastMeasure) return measureTextFast(t, colWidthPx)
  return measureFlowItemHeightDom({ content: t }, colWidthPx, opts)
}

function columnMeasureOpts(colIndex, opts = {}) {
  return {
    ...opts,
    columnIndex: colIndex,
    showDateline: colIndex === 0 && !!opts.showDateline,
    textAlignLast: colIndex >= 2 ? 'left' : 'justify',
  }
}

function columnBottomPx(text, colIndex, obstaclePx, colWidths, opts) {
  const colOpts = columnMeasureOpts(colIndex, opts)
  return (obstaclePx[colIndex] || 0) + measureText(text, colWidths[colIndex], colOpts)
}

/** Col3 is the terminal column — do not move words out when it is already the shortest. */
function mayShiftWordsOutOfCol3(cols, obstacles, widths, opts) {
  const b = cols.map((t, i) => columnBottomPx(t, i, obstacles, widths, opts))
  const target = Math.max(...b)
  if (b[2] <= target - BOTTOM_TOLERANCE_PX) return false
  if (b[2] <= b[0] + BOTTOM_TOLERANCE_PX && b[2] <= b[1] + BOTTOM_TOLERANCE_PX) return false
  return true
}

function splitWordPrefixToFit(word, colWidthPx, maxHeightPx, opts) {
  const w = String(word || '')
  if (!w) return { prefix: '', suffix: '' }
  if (w.length <= 2) return { prefix: w.slice(0, 1), suffix: w.slice(1) }

  let lo = 1
  let hi = w.length - 1
  let best = 1

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const trial = `${w.slice(0, mid)}-`
    if (measureText(trial, colWidthPx, opts) <= maxHeightPx) {
      best = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  return { prefix: w.slice(0, best), suffix: w.slice(best) }
}

function snapToWordBoundary(prefix, fullText) {
  if (!prefix) return ''
  if (prefix.length >= fullText.length) return prefix
  if (/\s/.test(fullText[prefix.length])) return prefix
  const lastSpace = prefix.lastIndexOf(' ')
  return lastSpace > 0 ? prefix.slice(0, lastSpace) : prefix
}

/** Pack more words while height stays within budget (avoid col1 ending early). */
function fillColumnToBudget(chunk, remainder, colWidthPx, maxHeightPx, opts) {
  let c = String(chunk || '').trimEnd()
  let r = String(remainder || '')

  while (r.trim()) {
    const m = r.match(/^\s*(\S+)/)
    if (!m) break
    const word = m[1]
    const trial = c ? `${c} ${word}` : word
    const h = measureText(trial, colWidthPx, opts)
    if (h > maxHeightPx) break
    c = trial
    r = r.slice(m[0].length).trimStart()
    if (maxHeightPx - h <= LINE_HEIGHT_PX * 0.55) break
  }

  return { text: c, remainder: r }
}

const LAST_LINE_FILL_RATIO = 0.88

function isLastLineUnderfilled(text, colWidthPx, opts) {
  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length < 2) return false

  const lastWord = words[words.length - 1]
  const lastInk = measureInkWidthDom(lastWord, colWidthPx)
  if (lastInk < colWidthPx * 0.5) return true

  const tail = words.slice(-Math.min(3, words.length)).join(' ')
  const ink = measureInkWidthDom(tail, colWidthPx)
  return ink < colWidthPx * LAST_LINE_FILL_RATIO
}

/** Pull words from remainder until column last line is full (then flow to next col). */
function pullWordsToFillLastLine(chunk, remainder, colWidthPx, maxHeightPx, opts) {
  let c = String(chunk || '').trimEnd()
  let r = String(remainder || '')

  for (let guard = 0; guard < 12 && r.trim(); guard++) {
    if (!isLastLineUnderfilled(c, colWidthPx, opts)) break

    const m = r.match(/^\s*(\S+)/)
    if (!m) break
    const trial = c ? `${c} ${m[1]}` : m[1]
    if (measureText(trial, colWidthPx, opts) > maxHeightPx) break
    c = trial
    r = r.slice(m[0].length).trimStart()
  }

  return { text: c, remainder: r }
}

export function takeTextForColumnHeight(text, colWidthPx, maxHeightPx, opts = {}) {
  const src = String(text || '')
  if (!src.trim() || maxHeightPx < LINE_HEIGHT_PX) {
    return { text: '', remainder: src, height: 0 }
  }

  const takeWords = opts.fastMeasure ? takeWordsForComposedHeight : takeWordsForDomHeight
  let { text: chunk, remainder, heightPx: height } = takeWords(src, colWidthPx, maxHeightPx, opts)

  if (!chunk.trim()) {
    const firstWord = (src.match(/\S+/) || [''])[0]
    const split = splitWordPrefixToFit(firstWord, colWidthPx, maxHeightPx, opts)
    if (split.prefix) {
      chunk = `${split.prefix}-`
      remainder = `${split.suffix}${src.slice(firstWord.length)}`.trimStart()
      return { text: chunk, remainder, height: measureText(chunk, colWidthPx, opts) }
    }
    return { text: '', remainder: src, height: 0 }
  }

  if (!opts.fastMeasure && remainder.trim()) {
    const filled = pullWordsToFillLastLine(chunk, remainder, colWidthPx, maxHeightPx, opts)
    chunk = filled.text
    remainder = filled.remainder
  }

  return { text: chunk, remainder, height: measureText(chunk, colWidthPx, opts) }
}

function shiftFirstWord(fromText, toText) {
  const m = String(fromText || '').match(/^\s*\S+/)
  if (!m) return { from: fromText, to: toText }
  const word = m[0].trim()
  const from = String(fromText || '')
    .slice(m[0].length)
    .replace(/^\s+/, '')
  const to = toText ? `${String(toText).trimEnd()} ${word}` : word
  return { from, to }
}

function shiftLastWord(fromText, toText) {
  const parts = String(fromText || '').trim().split(/\s+/)
  if (!parts.length) return { from: fromText, to: toText }
  const word = parts.pop()
  const from = parts.join(' ')
  const to = toText ? `${word} ${String(toText).trimStart()}` : word
  return { from, to }
}

/** Thread: fill center column below image when flow/rebalance left it empty. */
function ensureCenterColumnHasText(cols, budgets, colWidths, obstacles, opts) {
  if (!centerColumnHasImage(obstacles)) return cols
  if (centerWordCount(cols) >= 8) return cols
  if (!String(cols[2] || '').trim()) return cols

  const budget = budgets[CENTER_COL_INDEX]
  if (budget < LINE_HEIGHT_PX * 2) return cols

  const colOpts = { ...opts, showDateline: false }
  const chunk = takeTextForColumnHeight(cols[2], colWidths[CENTER_COL_INDEX], budget, colOpts)
  if (!chunk.text?.trim()) return cols

  const next = [...cols]
  next[CENTER_COL_INDEX] = chunk.text
  next[2] = chunk.remainder
  return next
}

/** Move words between columns until bottoms align (natural height, no stretch). */
export function rebalanceColumnBottoms(texts, obstaclePx, colWidths, opts = {}) {
  const cols = texts.map((t) => String(t || ''))
  const obstacles = obstaclePx?.length === COLUMN_COUNT ? obstaclePx : [0, 0, 0]
  const widths =
    colWidths?.length === COLUMN_COUNT ? colWidths : [colWidths?.[0] || 200, colWidths?.[0] || 200, colWidths?.[0] || 200]

  const bottoms = () => cols.map((t, i) => columnBottomPx(t, i, obstacles, widths, opts))
  const protectCenter = centerColumnHasImage(obstacles)

  for (let pass = 0; pass < 200; pass++) {
    const b = bottoms()
    const spread = Math.max(...b) - Math.min(...b)
    if (spread <= BOTTOM_TOLERANCE_PX) break

    const maxIdx = b.indexOf(Math.max(...b))
    const minIdx = b.indexOf(Math.min(...b))
    if (maxIdx === minIdx) break

    let moved = false

    if (maxIdx === 1 && minIdx === 0 && cols[1]?.trim() && !protectCenter) {
      const { from, to } = shiftFirstWord(cols[1], cols[0])
      if (from !== cols[1]) {
        cols[1] = from
        cols[0] = to
        moved = true
      }
    } else if (maxIdx === 1 && minIdx === 2 && cols[1]?.trim()) {
      const { from, to } = shiftLastWord(cols[1], cols[2])
      if (from !== cols[1]) {
        cols[1] = from
        cols[2] = to
        moved = true
      }
    } else if (maxIdx === 0 && minIdx === 2 && cols[0]?.trim() && !protectCenter) {
      const { from, to } = shiftLastWord(cols[0], cols[2])
      if (from !== cols[0]) {
        cols[0] = from
        cols[2] = to
        moved = true
      }
    } else if (cols[maxIdx]?.trim() && cols[minIdx] !== undefined) {
      const drainCenter =
        protectCenter &&
        maxIdx === CENTER_COL_INDEX &&
        minIdx === 0 &&
        centerWordCount(cols) <= CENTER_MIN_WORDS
      if (!drainCenter) {
        const { from, to } =
          maxIdx < minIdx
            ? shiftLastWord(cols[maxIdx], cols[minIdx])
            : shiftFirstWord(cols[maxIdx], cols[minIdx])
        if (from !== cols[maxIdx]) {
          cols[maxIdx] = from
          cols[minIdx] = to
          moved = true
        }
      }
    }

    if (!moved) {
      if (spread > BOTTOM_TOLERANCE_PX && cols[maxIdx]?.trim()) {
        const words = cols[maxIdx].trim().split(/\s+/)
        if (words.length > 1) {
          const w = words.shift()
          cols[maxIdx] = words.join(' ')
          cols[minIdx] = cols[minIdx] ? `${cols[minIdx]} ${w}` : w
          continue
        }
      }
      break
    }
  }

  if (
    protectCenter &&
    centerWordCount(cols) < 8 &&
    cols[2]?.trim() &&
    mayShiftWordsOutOfCol3(cols, obstacles, widths, opts)
  ) {
    const r = shiftFirstWord(cols[2], cols[CENTER_COL_INDEX])
    if (r.from !== cols[2]) {
      cols[CENTER_COL_INDEX] = r.to
      cols[2] = r.from
    }
  }

  return polishColumnBreakLastLines(
    alignAllColumnsToTargetBottom(cols, obstacles, widths, opts),
    obstacles,
    widths,
    opts
  )
}

const BOTTOM_EVEN_TOLERANCE_PX = 12

function columnTotalBottomPx(cols, obstacles, widths, opts) {
  return cols.map((t, i) => {
    const colOpts = { ...opts, showDateline: i === 0 && !!opts.showDateline }
    return (obstacles[i] || 0) + measureText(t, widths[i], colOpts)
  })
}

/** Even bottoms: move words col3→col2→col1 along thread (never drain center to col0). */
function balanceEvenColumnBottoms(cols, obstacles, widths, opts) {
  const protectCenter = centerColumnHasImage(obstacles)

  for (let pass = 0; pass < 180; pass++) {
    const b = columnTotalBottomPx(cols, obstacles, widths, opts)
    const spread = Math.max(...b) - Math.min(...b)
    if (spread <= BOTTOM_EVEN_TOLERANCE_PX) break

    const shortIdx = b.indexOf(Math.min(...b))
    const tallIdx = b.indexOf(Math.max(...b))
    if (shortIdx === tallIdx) break

    let moved = false

    if (shortIdx === CENTER_COL_INDEX && cols[2]?.trim()) {
      const r = shiftFirstWord(cols[2], cols[CENTER_COL_INDEX])
      if (r.from !== cols[2]) {
        cols[CENTER_COL_INDEX] = r.to
        cols[2] = r.from
        moved = true
      }
    }

    if (!moved && shortIdx === 0 && tallIdx === CENTER_COL_INDEX && cols[1]?.trim() && !protectCenter) {
      const r = shiftFirstWord(cols[1], cols[0])
      if (r.from !== cols[1]) {
        cols[0] = r.to
        cols[1] = r.from
        moved = true
      }
    }

    if (!moved && shortIdx === 0 && tallIdx === 2 && cols[2]?.trim() && !protectCenter) {
      const r = shiftFirstWord(cols[2], cols[0])
      if (r.from !== cols[2]) {
        cols[0] = r.to
        cols[2] = r.from
        moved = true
      }
    }

    if (!moved && shortIdx === CENTER_COL_INDEX && tallIdx === 2 && cols[2]?.trim()) {
      const r = shiftFirstWord(cols[2], cols[CENTER_COL_INDEX])
      if (r.from !== cols[2]) {
        cols[CENTER_COL_INDEX] = r.to
        cols[2] = r.from
        moved = true
      }
    }

    if (!moved && shortIdx === 2 && tallIdx === CENTER_COL_INDEX && cols[2]?.trim()) {
      const r = shiftLastWord(cols[CENTER_COL_INDEX], cols[2])
      if (r.from !== cols[CENTER_COL_INDEX]) {
        cols[CENTER_COL_INDEX] = r.from
        cols[2] = r.to
        moved = true
      }
    }

    if (!moved && tallIdx === 2 && shortIdx < 2 && cols[2]?.trim()) {
      const r = shiftFirstWord(cols[2], cols[shortIdx === 0 ? 0 : CENTER_COL_INDEX])
      if (r.from !== cols[2]) {
        if (shortIdx === 0) cols[0] = r.to
        else cols[CENTER_COL_INDEX] = r.to
        cols[2] = r.from
        moved = true
      }
    }

    if (!moved) break
  }

  return cols
}

/** Thread full article across 3 columns at depth D (respects highlight + image obstacles). */
function threadColumnsAtDepth(_texts, fullText, depthPx, obstacles, widths, opts) {
  const budgets = obstacles.map((o) => Math.max(LINE_HEIGHT_PX * 2, depthPx - (o || 0)))
  let rest = fullText
  const out = []

  for (let c = 0; c < COLUMN_COUNT; c++) {
    const colOpts = columnMeasureOpts(c, opts)
    if (!rest.trim()) {
      out.push('')
      continue
    }
    const chunk = takeTextForColumnHeight(rest, widths[c], budgets[c], colOpts)
    out.push(chunk.text || '')
    rest = chunk.remainder || ''
  }

  if (rest.trim()) {
    out[2] = out[2] ? `${out[2]} ${rest}`.trim() : rest.trim()
  }

  return out
}

/** When cols are empty or col1 lost all text (bad measure / obstacle drift). */
function redistributeIfColumnsEmpty(texts, fullText, obstacles) {
  const words = tokenizeWords(fullText)
  if (words.length < 20) return texts

  const w0 = tokenizeWords(texts[0] || '').length
  const w1 = tokenizeWords(texts[CENTER_COL_INDEX] || '').length
  const w2 = tokenizeWords(texts[2] || '').length
  const needSplit =
    (w0 < 10 && w1 + w2 > 20) ||
    (centerColumnHasImage(obstacles) && words.length > 48 && (w1 < 10 || w2 < 10))

  if (!needSplit) return texts

  const hasHighlights = (obstacles[0] || 0) >= 60
  const n = words.length
  const c0 = Math.max(8, Math.floor(n * (hasHighlights ? 0.28 : 0.32)))
  const c1 = Math.max(10, Math.floor(n * 0.34))
  return [
    words.slice(0, c0).join(' '),
    words.slice(c0, c0 + c1).join(' '),
    words.slice(c0 + c1).join(' '),
  ]
}

/** Pull words for fuller last line — never steal from col3 (causes bottom gap on last column). */
function polishColumnBreakLastLines(cols, obstacles, widths, opts) {
  const protectCenter = centerColumnHasImage(obstacles)

  for (let colIdx = 0; colIdx < COLUMN_COUNT - 1; colIdx++) {
    const colOpts = columnMeasureOpts(colIdx, opts)

    for (let guard = 0; guard < 10; guard++) {
      if (!cols[colIdx]?.trim() || !isLastLineUnderfilled(cols[colIdx], widths[colIdx], colOpts)) break
      const nextIdx = colIdx + 1
      if (!cols[nextIdx]?.trim()) break
      // Never pull from col3 into col2 — leaves a large white gap at col3 bottom.
      if (nextIdx >= COLUMN_COUNT - 1) break
      if (nextIdx === CENTER_COL_INDEX && protectCenter && !canShiftTextOutOfCenter(cols)) break

      const pulled = shiftFirstWord(cols[nextIdx], cols[colIdx])
      if (pulled.from === cols[nextIdx]) break

      cols[colIdx] = pulled.to
      cols[nextIdx] = pulled.from
    }
  }
  return cols
}

/**
 * Raise col3 total bottom to match tallest column — pull from col1 only (never col2 image column).
 */
function equalizeThirdColumnBottom(cols, obstacles, widths, opts) {
  const protectCenter = centerColumnHasImage(obstacles)
  const totalWords = tokenizeWords(cols.join(' ')).length
  const hasHighlights = (obstacles[0] || 0) >= 60
  const col0Floor = Math.max(10, Math.floor(totalWords * (hasHighlights ? 0.2 : 0.22)))

  for (let k = 0; k < 200; k++) {
    const b = cols.map((t, i) => columnBottomPx(t, i, obstacles, widths, opts))
    const target = Math.max(...b)
    if (b[2] >= target - BOTTOM_TOLERANCE_PX) break

    let moved = false
    if (
      cols[0]?.trim() &&
      b[0] > b[2] + BOTTOM_TOLERANCE_PX &&
      tokenizeWords(cols[0]).length > col0Floor
    ) {
      const r = shiftLastWord(cols[0], cols[2])
      if (r.from !== cols[0]) {
        cols[0] = r.from
        cols[2] = r.to
        moved = true
      }
    }
    if (!moved && !protectCenter && cols[1]?.trim() && b[1] > b[2] + BOTTOM_TOLERANCE_PX * 2) {
      const r = shiftLastWord(cols[1], cols[2])
      if (r.from !== cols[1]) {
        cols[1] = r.from
        cols[2] = r.to
        moved = true
      }
    }
    if (!moved) break
  }

  return cols
}

/** Col2 text height so obstacle[1] + h1 = obstacle[0] + h0 (even column bottoms). */
function centerColumnTextTargetPx(obstacles, col1TextHeightPx) {
  const col0Bottom = (obstacles[0] || 0) + col1TextHeightPx
  const obs1 = obstacles[CENTER_COL_INDEX] || 0
  return Math.max(LINE_HEIGHT_PX * 3, col0Bottom - obs1)
}

/**
 * Col2 (image column): fill text below photo until column bottom matches col1.
 */
function trimCenterColumnWhenOverTarget(cols, obstacles, widths, opts) {
  if (!centerColumnHasImage(obstacles)) return cols

  const totalWords = tokenizeWords(cols.join(' ')).length
  if (centerWordCount(cols) < Math.max(CENTER_MIN_WORDS + 8, Math.floor(totalWords * 0.16))) {
    return cols
  }

  for (let k = 0; k < 240; k++) {
    const b = cols.map((t, i) => columnBottomPx(t, i, obstacles, widths, opts))
    const target = Math.max(...b)
    if (b[CENTER_COL_INDEX] <= target + BOTTOM_TOLERANCE_PX) break
    if (!canShiftTextOutOfCenter(cols)) break

    let moved = false
    if (b[2] < b[CENTER_COL_INDEX] - BOTTOM_TOLERANCE_PX && cols[CENTER_COL_INDEX]?.trim()) {
      const r = shiftLastWord(cols[CENTER_COL_INDEX], cols[2])
      if (r.from !== cols[CENTER_COL_INDEX]) {
        cols[CENTER_COL_INDEX] = r.from
        cols[2] = r.to
        moved = true
      }
    }
    if (!moved && b[0] < b[CENTER_COL_INDEX] - BOTTOM_TOLERANCE_PX && cols[CENTER_COL_INDEX]?.trim()) {
      const r = shiftFirstWord(cols[CENTER_COL_INDEX], cols[0])
      if (r.from !== cols[CENTER_COL_INDEX]) {
        cols[CENTER_COL_INDEX] = r.from
        cols[0] = r.to
        moved = true
      }
    }
    if (!moved) break
  }

  return cols
}

function ensureCenterColumnBottomAligned(cols, obstacles, widths, opts) {
  if (!centerColumnHasImage(obstacles)) return cols

  for (let k = 0; k < 280; k++) {
    const h0 = measureText(cols[0], widths[0], columnMeasureOpts(0, opts))
    const h1 = measureText(cols[1], widths[1], columnMeasureOpts(1, opts))
    const targetH1 = centerColumnTextTargetPx(obstacles, h0)
    if (!h0) break
    if (h1 >= targetH1 - 3 && h1 <= targetH1 + 3) break

    let moved = false
    if (h1 < targetH1 - 3) {
      if (cols[2]?.trim()) {
        const r = shiftFirstWord(cols[2], cols[1])
        if (r.from !== cols[2]) {
          cols[2] = r.from
          cols[1] = r.to
          moved = true
        }
      }
      if (!moved && cols[0]?.trim()) {
        const r = shiftLastWord(cols[0], cols[1])
        if (r.from !== cols[0]) {
          cols[0] = r.from
          cols[1] = r.to
          moved = true
        }
      }
    } else if (h1 > targetH1 + 3 && canShiftTextOutOfCenter(cols)) {
      if (cols[CENTER_COL_INDEX]?.trim()) {
        const r = shiftLastWord(cols[CENTER_COL_INDEX], cols[2])
        if (r.from !== cols[CENTER_COL_INDEX]) {
          cols[CENTER_COL_INDEX] = r.from
          cols[2] = r.to
          moved = true
        }
      }
      if (!moved && cols[CENTER_COL_INDEX]?.trim()) {
        const r = shiftFirstWord(cols[CENTER_COL_INDEX], cols[0])
        if (r.from !== cols[CENTER_COL_INDEX]) {
          cols[CENTER_COL_INDEX] = r.from
          cols[0] = r.to
          moved = true
        }
      }
    }
    if (!moved) break
  }

  return cols
}

/** Col3 — pull words until bottom matches; never drain col2 image column. */
function fillThirdColumnToTarget(cols, obstacles, widths, opts) {
  const protectCenter = centerColumnHasImage(obstacles)

  for (let k = 0; k < 160; k++) {
    const b = cols.map((t, i) => columnBottomPx(t, i, obstacles, widths, opts))
    const target = Math.max(...b)
    if (b[2] >= target - BOTTOM_TOLERANCE_PX) break

    let moved = false

    if (cols[1]?.trim() && (!protectCenter || canShiftTextOutOfCenter(cols))) {
      const h1 = measureText(cols[1], widths[1], columnMeasureOpts(1, opts))
      const h0 = measureText(cols[0], widths[0], columnMeasureOpts(0, opts))
      if (!protectCenter || h1 > h0 * 0.55) {
        const r = shiftLastWord(cols[1], cols[2])
        if (r.from !== cols[1]) {
          cols[1] = r.from
          cols[2] = r.to
          moved = true
        }
      }
    }

    if (!moved && cols[0]?.trim()) {
      const r = shiftLastWord(cols[0], cols[2])
      if (r.from !== cols[0]) {
        cols[0] = r.from
        cols[2] = r.to
        moved = true
      }
    }

    if (!moved) break
  }

  return cols
}

/** One pass: shortest column gains words; never drain col2 when it is already shortest (image col). */
function balanceSharedColumnBottoms(cols, obstacles, widths, opts) {
  const protectCenter = centerColumnHasImage(obstacles)

  for (let k = 0; k < 320; k++) {
    const b = cols.map((t, i) => columnBottomPx(t, i, obstacles, widths, opts))
    const spread = Math.max(...b) - Math.min(...b)
    if (spread <= BOTTOM_TOLERANCE_PX) break

    const minIdx = b.indexOf(Math.min(...b))
    let moved = false

    if (minIdx === CENTER_COL_INDEX && protectCenter) {
      if (cols[2]?.trim()) {
        const r = shiftFirstWord(cols[2], cols[CENTER_COL_INDEX])
        if (r.from !== cols[2]) {
          cols[2] = r.from
          cols[CENTER_COL_INDEX] = r.to
          moved = true
        }
      }
      if (!moved && cols[0]?.trim()) {
        const r = shiftLastWord(cols[0], cols[CENTER_COL_INDEX])
        if (r.from !== cols[0]) {
          cols[0] = r.from
          cols[CENTER_COL_INDEX] = r.to
          moved = true
        }
      }
    } else if (minIdx === 2) {
      if (cols[0]?.trim()) {
        const r = shiftLastWord(cols[0], cols[2])
        if (r.from !== cols[0]) {
          cols[0] = r.from
          cols[2] = r.to
          moved = true
        }
      }
      if (!moved && !protectCenter && cols[1]?.trim()) {
        const h1 = measureText(cols[1], widths[1], columnMeasureOpts(1, opts))
        const h0 = measureText(cols[0], widths[0], columnMeasureOpts(0, opts))
        const targetH1 = centerColumnTextTargetPx(obstacles, h0)
        if (h1 > targetH1 + LINE_HEIGHT_PX * 2) {
          const r = shiftLastWord(cols[1], cols[2])
          if (r.from !== cols[1]) {
            cols[1] = r.from
            cols[2] = r.to
            moved = true
          }
        }
      }
    } else if (minIdx === 0 && cols[1]?.trim() && !protectCenter) {
      const r = shiftFirstWord(cols[1], cols[0])
      if (r.from !== cols[1]) {
        cols[0] = r.to
        cols[1] = r.from
        moved = true
      }
    }

    if (!moved) {
      const maxIdx = b.indexOf(Math.max(...b))
      if (maxIdx !== minIdx && cols[maxIdx]?.trim()) {
        if (maxIdx === 2 && !mayShiftWordsOutOfCol3(cols, obstacles, widths, opts)) {
          break
        }
        if (
          maxIdx === CENTER_COL_INDEX &&
          protectCenter &&
          minIdx !== CENTER_COL_INDEX &&
          !canShiftTextOutOfCenter(cols)
        ) {
          break
        }
        const r =
          maxIdx < minIdx
            ? shiftLastWord(cols[maxIdx], cols[minIdx])
            : shiftFirstWord(cols[maxIdx], cols[minIdx])
        if (r.from !== cols[maxIdx]) {
          cols[maxIdx] = r.from
          cols[minIdx] = r.to
          moved = true
        }
      }
    }

    if (!moved) break
  }

  return cols
}

/** Col2 with image must keep a fair share; trim col1 if it hoards >42% of words. */
function enforceThreadedColumnShares(cols, fullText, obstacles, widths, opts) {
  if (!fullText?.trim()) return cols

  const total = tokenizeWords(fullText).length
  if (total < 36) return cols

  const hasCenterImg = centerColumnHasImage(obstacles)
  const minShare = hasCenterImg ? 0.22 : 0.18
  const minCol = Math.max(28, Math.floor(total * minShare))
  const maxCol0 = Math.ceil(total * 0.4)

  let next = cols.map((t) => String(t || ''))

  if (hasCenterImg) {
    for (let g = 0; g < 600 && centerWordCount(next) < minCol; g++) {
      let moved = false
      if (tokenizeWords(next[0] || '').length > minCol + 24) {
        const r = shiftLastWord(next[0], next[1])
        if (r.from !== next[0]) {
          next[0] = r.from
          next[1] = r.to
          moved = true
        }
      }
      if (!moved && tokenizeWords(next[2] || '').length > minCol + 24) {
        const r = shiftFirstWord(next[2], next[1])
        if (r.from !== next[2]) {
          next[2] = r.from
          next[1] = r.to
          moved = true
        }
      }
      if (!moved) break
    }
  }

  for (let g = 0; g < 400 && tokenizeWords(next[2] || '').length < minCol; g++) {
    let moved = false
    if (tokenizeWords(next[0] || '').length > minCol + 20) {
      const r = shiftLastWord(next[0], next[2])
      if (r.from !== next[0]) {
        next[0] = r.from
        next[2] = r.to
        moved = true
      }
    }
    if (!moved) break
  }

  const hasHighlights = (obstacles[0] || 0) > 48
  if (!hasHighlights) {
    const minCol0 = Math.max(12, Math.floor(total * 0.1))
    for (let g = 0; g < 240 && tokenizeWords(next[0] || '').length < minCol0; g++) {
      let moved = false
      if (tokenizeWords(next[1] || '').length > minCol0 + 16) {
        const r = shiftFirstWord(next[1], next[0])
        if (r.from !== next[1]) {
          next[0] = r.to
          next[1] = r.from
          moved = true
        }
      }
      if (!moved && tokenizeWords(next[2] || '').length > minCol0 + 16) {
        const r = shiftFirstWord(next[2], next[0])
        if (r.from !== next[2]) {
          next[0] = r.to
          next[2] = r.from
          moved = true
        }
      }
      if (!moved) break
    }
  }

  for (let g = 0; g < 300 && tokenizeWords(next[0] || '').length > maxCol0; g++) {
    let moved = false
    if (hasCenterImg && centerWordCount(next) < minCol + 8) {
      const r = shiftLastWord(next[0], next[1])
      if (r.from !== next[0]) {
        next[0] = r.from
        next[1] = r.to
        moved = true
      }
    }
    if (!moved && tokenizeWords(next[2] || '').length < minCol + 8) {
      const r = shiftLastWord(next[0], next[2])
      if (r.from !== next[0]) {
        next[0] = r.from
        next[2] = r.to
        moved = true
      }
    }
    if (!moved) break
  }

  return balanceSharedColumnBottoms(next, obstacles, widths, opts)
}

function finalizeColumnLayout(texts, obstacles, widths, opts, fullText = '') {
  let cols = texts.map((t) => String(t || ''))
  cols = polishColumnBreakLastLines(cols, obstacles, widths, opts)
  cols = ensureCenterColumnBottomAligned(cols, obstacles, widths, opts)
  cols = trimCenterColumnWhenOverTarget(cols, obstacles, widths, opts)
  cols = equalizeThirdColumnBottom(cols, obstacles, widths, opts)
  if (fullText) {
    cols = enforceThreadedColumnShares(cols, fullText, obstacles, widths, opts)
  } else {
    cols = alignAllColumnsToTargetBottom(cols, obstacles, widths, opts)
    cols = balanceSharedColumnBottoms(cols, obstacles, widths, opts)
  }
  return cols
}

/** Screen-only pass after paint — fixes cold-load measure vs CSS drift (HMR looked fine, reload did not). */
export function alignColumnTextsToRenderedBottoms(columnTexts, columnsEl) {
  let cols = columnTexts.map((t) => String(t || ''))
  if (!columnsEl?.children?.length) return cols

  for (let pass = 0; pass < 28; pass++) {
    const rendered = measureRenderedColumnTextBottoms(columnsEl)
    if (!rendered) break
    const spread = Math.max(...rendered) - Math.min(...rendered)
    if (spread <= 8) break

    const before = cols.join('\x1e')
    const targetHigh = Math.max(rendered[0], rendered[1], rendered[2])

    if (rendered[1] < targetHigh - 8) {
      cols = nudgeCenterColumnToRenderedDepth(cols, columnsEl)
    } else if (rendered[1] > targetHigh + 8) {
      cols = nudgeCenterColumnWhenTooDeep(cols, columnsEl)
    }
    if (rendered[1] < targetHigh - 12 && rendered[0] >= targetHigh - 8) {
      cols = nudgeCenterColumnToRenderedDepth(cols, columnsEl)
    }
    if (rendered[2] < targetHigh - 8) {
      const w0 = tokenizeWords(cols[0] || '').length
      if (w0 > 14) {
        cols = nudgeCol3ToRenderedBottom(cols, columnsEl)
      }
    } else if (rendered[2] > targetHigh + 8) {
      cols = nudgeCol3WhenTooDeep(cols, columnsEl)
    }
    if (rendered[0] < targetHigh - 8 && cols[1]?.trim()) {
      const r = shiftFirstWord(cols[1], cols[0])
      if (r.from !== cols[1]) {
        cols[0] = r.to
        cols[1] = r.from
      }
    }
    if (cols.join('\x1e') === before) break
  }

  return cols
}

/** Pull text into short columns (especially col1) until all bottoms match tallest. */
function alignAllColumnsToTargetBottom(cols, obstacles, widths, opts) {
  for (let k = 0; k < 36; k++) {
    const b = cols.map((t, i) => columnBottomPx(t, i, obstacles, widths, opts))
    const target = Math.max(...b)
    const spread = Math.max(...b) - Math.min(...b)
    if (spread <= BOTTOM_TOLERANCE_PX) break

    let moved = false

    const protectCenter = centerColumnHasImage(obstacles)

    if (
      !moved &&
      protectCenter &&
      centerWordCount(cols) < 8 &&
      cols[2]?.trim() &&
      mayShiftWordsOutOfCol3(cols, obstacles, widths, opts)
    ) {
      const r = shiftFirstWord(cols[2], cols[CENTER_COL_INDEX])
      if (r.from !== cols[2]) {
        cols[CENTER_COL_INDEX] = r.to
        cols[2] = r.from
        moved = true
      }
    }

    if (!moved && b[0] < target - BOTTOM_TOLERANCE_PX && cols[1]?.trim()) {
      const r = shiftFirstWord(cols[1], cols[0])
      if (r.from !== cols[1]) {
        cols[0] = r.to
        cols[1] = r.from
        moved = true
      }
    }

    if (
      !moved &&
      b[0] < target - BOTTOM_TOLERANCE_PX &&
      cols[2]?.trim() &&
      mayShiftWordsOutOfCol3(cols, obstacles, widths, opts)
    ) {
      if (protectCenter && b[1] < target - BOTTOM_TOLERANCE_PX) {
        const r = shiftFirstWord(cols[2], cols[1])
        if (r.from !== cols[2]) {
          cols[1] = r.to
          cols[2] = r.from
          moved = true
        }
      }
      if (!moved) {
        const r = shiftFirstWord(cols[2], cols[0])
        if (r.from !== cols[2]) {
          cols[0] = r.to
          cols[2] = r.from
          moved = true
        }
      }
    }

    if (
      !moved &&
      protectCenter &&
      b[1] < target - BOTTOM_TOLERANCE_PX &&
      cols[2]?.trim() &&
      mayShiftWordsOutOfCol3(cols, obstacles, widths, opts)
    ) {
      const r = shiftFirstWord(cols[2], cols[CENTER_COL_INDEX])
      if (r.from !== cols[2]) {
        cols[CENTER_COL_INDEX] = r.to
        cols[2] = r.from
        moved = true
      }
    }

    if (!moved && b[2] < target - BOTTOM_TOLERANCE_PX && cols[1]?.trim()) {
      const h1 = measureText(cols[1], widths[1], columnMeasureOpts(1, opts))
      const h0 = measureText(cols[0], widths[0], columnMeasureOpts(0, opts))
      const mayPullFromCenter =
        !protectCenter || (canShiftTextOutOfCenter(cols) && h1 > h0 * 0.55)
      if (mayPullFromCenter) {
        const r = shiftLastWord(cols[1], cols[2])
        if (r.from !== cols[1]) {
          cols[1] = r.from
          cols[2] = r.to
          moved = true
        }
      }
    }

    if (!moved && b[2] < target - BOTTOM_TOLERANCE_PX && cols[0]?.trim()) {
      const r = shiftLastWord(cols[0], cols[2])
      if (r.from !== cols[0]) {
        cols[0] = r.from
        cols[2] = r.to
        moved = true
      }
    }

    if (
      !moved &&
      protectCenter &&
      b[CENTER_COL_INDEX] > target + BOTTOM_TOLERANCE_PX &&
      cols[CENTER_COL_INDEX]?.trim() &&
      canShiftTextOutOfCenter(cols)
    ) {
      const r = shiftLastWord(cols[CENTER_COL_INDEX], cols[2])
      if (r.from !== cols[CENTER_COL_INDEX]) {
        cols[CENTER_COL_INDEX] = r.from
        cols[2] = r.to
        moved = true
      }
      if (!moved) {
        const r2 = shiftFirstWord(cols[CENTER_COL_INDEX], cols[0])
        if (r2.from !== cols[CENTER_COL_INDEX]) {
          cols[CENTER_COL_INDEX] = r2.from
          cols[0] = r2.to
          moved = true
        }
      }
    }

    if (
      !moved &&
      (!protectCenter || canShiftTextOutOfCenter(cols)) &&
      b[1] > b[0] + BOTTOM_TOLERANCE_PX &&
      cols[1]?.trim()
    ) {
      const r = shiftFirstWord(cols[1], cols[0])
      if (r.from !== cols[1]) {
        cols[0] = r.to
        cols[1] = r.from
        moved = true
      }
    }

    if (!moved) {
      const maxIdx = b.indexOf(Math.max(...b))
      const minIdx = b.indexOf(Math.min(...b))
      if (maxIdx !== minIdx && cols[maxIdx]?.trim() && !(maxIdx === 2 && !mayShiftWordsOutOfCol3(cols, obstacles, widths, opts))) {
        const r =
          maxIdx < minIdx
            ? shiftLastWord(cols[maxIdx], cols[minIdx])
            : shiftFirstWord(cols[maxIdx], cols[minIdx])
        if (r.from !== cols[maxIdx]) {
          cols[maxIdx] = r.from
          cols[minIdx] = r.to
          moved = true
        }
      }
    }

    if (!moved) break
  }

  return cols
}

function tryFlowAtDepth(fullText, depthPx, obstaclePx, colWidths, opts) {
  const budgets = obstaclePx.map((o) => Math.max(LINE_HEIGHT_PX * 2, depthPx - (o || 0)))
  const fastOpts = { ...opts, fastMeasure: true }
  let balanced = threadColumnsAtDepth(['', '', ''], fullText, depthPx, obstaclePx, colWidths, fastOpts)

  const restAfter = tokenizeWords(fullText).length - tokenizeWords(balanced.join(' ')).length
  if (restAfter > 3) {
    return { overflow: true, texts: balanced, budgets, spread: Infinity, score: Infinity, depthPx }
  }

  balanced = redistributeIfColumnsEmpty(balanced, fullText, obstaclePx)
  balanced = ensureCenterColumnHasText(balanced, budgets, colWidths, obstaclePx, fastOpts)
  const heights = balanced.map((t, i) => {
    const colOpts = { ...fastOpts, showDateline: i === 0 && !!opts.showDateline }
    return measureText(t, colWidths[i], colOpts)
  })
  const spread =
    Math.max(...obstaclePx.map((o, i) => (o || 0) + heights[i])) -
    Math.min(...obstaclePx.map((o, i) => (o || 0) + heights[i]))

  const underfill = budgets.map((b, i) => Math.max(0, b - heights[i]))
  const colBottoms = obstaclePx.map((o, i) => (o || 0) + heights[i])
  const col0Short = Math.max(0, Math.max(colBottoms[1], colBottoms[2]) - colBottoms[0])
  const col3Short = Math.max(0, Math.max(colBottoms[0], colBottoms[1]) - colBottoms[2])
  const totalWords = tokenizeWords(fullText).length
  const w1 = tokenizeWords(balanced[1] || '').length
  const w2 = tokenizeWords(balanced[2] || '').length
  let emptyPenalty = 0
  if (totalWords > 36 && centerColumnHasImage(obstaclePx) && w1 < 10) emptyPenalty += 80000
  if (totalWords > 36 && w2 < 8) emptyPenalty += 35000

  const score =
    spread * 220 +
    underfill[0] * 4 +
    Math.max(...underfill) * 2 +
    col0Short * 12 +
    col3Short * 18 +
    emptyPenalty

  return { overflow: false, texts: balanced, budgets, spread, score, depthPx }
}

/** Accurate DOM thread + polish at chosen depth D (once per article). */
function flowBodyAtDepthDom(fullText, depthPx, obstaclePx, colWidths, opts) {
  const budgets = obstaclePx.map((o) => Math.max(LINE_HEIGHT_PX * 2, depthPx - (o || 0)))
  const domOpts = { ...opts, fastMeasure: false }
  let balanced = threadColumnsAtDepth(['', '', ''], fullText, depthPx, obstaclePx, colWidths, domOpts)

  const restAfter = tokenizeWords(fullText).length - tokenizeWords(balanced.join(' ')).length
  if (restAfter > 3) return null

  balanced = redistributeIfColumnsEmpty(balanced, fullText, obstaclePx)
  balanced = ensureCenterColumnHasText(balanced, budgets, colWidths, obstaclePx, domOpts)
  return finalizeColumnLayout(balanced, obstaclePx, colWidths, domOpts, fullText)
}

function measureColumnDepthPx(texts, obstacles, widths, opts) {
  const bottoms = texts.map((t, i) => columnBottomPx(t, i, obstacles, widths, opts))
  return Math.ceil(Math.max(0, ...bottoms))
}

export function measureColumnSpread(texts, obstacles, widths, opts) {
  const domOpts = { ...opts, fastMeasure: false }
  const bottoms = texts.map((t, i) => columnBottomPx(t, i, obstacles, widths, domOpts))
  if (!bottoms.length) return Infinity
  return Math.max(...bottoms) - Math.min(...bottoms)
}

/** Post-thread polish: even bottoms in measure space (exported for assignBlock08ColumnText). */
export function polishBlock08ColumnTexts(texts, obstacles, widths, opts, fullText = '') {
  return finalizeColumnLayout(texts, obstacles, widths, opts, fullText)
}

/** Pick depth with lowest measured spread (DOM-accurate, once per article). */
function findBestDepthByDomSpread(fullText, obstacles, widths, opts, centerD) {
  const domOpts = { ...opts, fastMeasure: false }
  const base = Math.max(...obstacles, 0) + LINE_HEIGHT_PX * 2
  const lo = Math.max(base, centerD - 56)
  const hi = centerD + 56
  let bestTexts = null
  let bestSpread = Infinity

  for (let D = lo; D <= hi; D += 4) {
    const texts = flowBodyAtDepthDom(fullText, D, obstacles, widths, domOpts)
    if (!texts) continue
    const spread = measureColumnSpread(texts, obstacles, widths, domOpts)
    if (spread < bestSpread) {
      bestSpread = spread
      bestTexts = texts
    }
  }

  return bestTexts
}

/**
 * BLOCK-08A spec: shared bottom depth D.
 * budget[i] = D − obstacle[i] → col1 text, then col2 (below image), col3 gets remainder.
 * Col3 with no image: obstacle[2]=0, text starts at top.
 */
function flowColumnsToSharedBottom(fullText, obstacles, widths, opts) {
  const domOpts = { ...opts, fastMeasure: false }
  const obs = obstacles.map((o) => Math.max(0, o || 0))
  const totalWords = tokenizeWords(fullText).length
  if (!totalWords) return null

  const oneColH = measureText(fullText, widths[0], columnMeasureOpts(0, domOpts))
  let lo = Math.max(...obs, 0) + LINE_HEIGHT_PX * 8
  let hi = Math.ceil(obs[0] + oneColH)
  let bestCols = null
  let bestSpread = Infinity

  for (let pass = 0; pass < 36 && lo <= hi; pass++) {
    const D = Math.floor((lo + hi) / 2)
    const budgets = obs.map((o) => Math.max(LINE_HEIGHT_PX * 2, D - o))

    let rest = fullText
    const c0 = takeTextForColumnHeight(rest, widths[0], budgets[0], columnMeasureOpts(0, domOpts))
    rest = c0.remainder || ''
    const c1 = takeTextForColumnHeight(rest, widths[1], budgets[1], columnMeasureOpts(1, domOpts))
    rest = c1.remainder || ''
    const c2 = String(rest || '').trim()

    const used = tokenizeWords([c0.text, c1.text, c2].filter(Boolean).join(' ')).length
    if (used < totalWords - 2) {
      lo = D + 1
      continue
    }

    const bottoms = [
      obs[0] + measureText(c0.text, widths[0], columnMeasureOpts(0, domOpts)),
      obs[1] + measureText(c1.text, widths[1], columnMeasureOpts(1, domOpts)),
      obs[2] + measureText(c2, widths[2], columnMeasureOpts(2, domOpts)),
    ]
    const spread = Math.max(...bottoms) - Math.min(...bottoms)
    const cols = [c0.text || '', c1.text || '', c2]

    const w1 = tokenizeWords(c1.text || '').length
    const minCenter = centerColumnHasImage(obs)
      ? Math.max(24, Math.floor(totalWords * 0.18))
      : 0
    const centerPenalty = minCenter > 0 && w1 < minCenter ? (minCenter - w1) * 800 : 0
    const score = spread + centerPenalty

    if (score < bestSpread) {
      bestSpread = score
      bestCols = cols
    }

    const h2 = measureText(c2, widths[2], columnMeasureOpts(2, domOpts))
    if (h2 < budgets[2] - 10) {
      lo = D + 1
      continue
    }
    if (spread <= BOTTOM_TOLERANCE_PX * 2) {
      bestCols = cols
      break
    }
    hi = D - 1
  }

  if (!bestCols?.some((t) => t.trim())) return null
  return finalizeColumnLayout(bestCols, obstacles, widths, domOpts, fullText)
}

/** @deprecated Use flowColumnsToSharedBottom */
function flowByMatchedTextHeights(fullText, obstacles, widths, opts) {
  const domOpts = { ...opts, fastMeasure: false }
  const totalWords = tokenizeWords(fullText).length
  if (!totalWords) return null

  const singleColH = measureText(fullText, widths[0], columnMeasureOpts(0, domOpts))
  let lo = Math.max(LINE_HEIGHT_PX * 8, Math.floor(singleColH * 0.2))
  let hi = Math.ceil(singleColH)
  let bestCols = null
  let bestSpread = Infinity

  for (let pass = 0; pass < 32 && lo <= hi; pass++) {
    const h0Target = Math.floor((lo + hi) / 2)
    const h1Target = centerColumnTextTargetPx(obstacles, h0Target)

    let rest = fullText
    const c0 = takeTextForColumnHeight(rest, widths[0], h0Target, columnMeasureOpts(0, domOpts))
    rest = c0.remainder || ''
    const c1 = takeTextForColumnHeight(rest, widths[1], h1Target, columnMeasureOpts(1, domOpts))
    rest = c1.remainder || ''
    const c2 = String(rest || '').trim()

    const used = tokenizeWords([c0.text, c1.text, c2].filter(Boolean).join(' ')).length
    if (used < totalWords - 2) {
      lo = h0Target + 1
      continue
    }

    const h0 = measureText(c0.text, widths[0], columnMeasureOpts(0, domOpts))
    const h1 = measureText(c1.text, widths[1], columnMeasureOpts(1, domOpts))
    const h2 = measureText(c2, widths[2], columnMeasureOpts(2, domOpts))
    const obs1 = obstacles[CENTER_COL_INDEX] || 0
    const spread = Math.max(h0, obs1 + h1, h2) - Math.min(h0, obs1 + h1, h2)
    const cols = [c0.text || '', c1.text || '', c2]

    if (spread < bestSpread) {
      bestSpread = spread
      bestCols = cols
    }

    if (h2 < h0Target - 8) {
      hi = h0Target - 1
      continue
    }
    if (h2 > h0Target + 24) {
      lo = h0Target + 1
      continue
    }
    if (spread <= BOTTOM_TOLERANCE_PX * 2) {
      bestCols = cols
      break
    }
    lo = h0Target + 1
  }

  if (!bestCols?.some((t) => t.trim())) return null
  return finalizeColumnLayout(bestCols, obstacles, widths, domOpts, fullText)
}

export function flowBodyAcrossColumns(bodyItems, obstaclePx, colWidths, opts = {}) {
  const fullText = mergeBodyItemsToFlowText(bodyItems)
  const empty = {
    texts: Array.from({ length: COLUMN_COUNT }, () => ''),
    depthPx: 0,
  }
  if (!fullText) return empty

  if (typeof document === 'undefined') {
    const third = Math.ceil(fullText.length / 3)
    const texts = [
      fullText.slice(0, third),
      fullText.slice(third, third * 2),
      fullText.slice(third * 2),
    ]
    return { texts, depthPx: 480 }
  }

  const baseW = colWidths?.[0] || 200
  const widths = colWidths?.length === COLUMN_COUNT ? colWidths : [baseW, baseW, baseW]
  const obstacles = obstaclePx?.length === COLUMN_COUNT ? obstaclePx : [0, 0, 0]
  const domOpts = { ...opts, fastMeasure: false }

  const heightBalanced =
    flowColumnsToSharedBottom(fullText, obstacles, widths, domOpts) ||
    flowByMatchedTextHeights(fullText, obstacles, widths, domOpts)
  if (heightBalanced) {
    return {
      texts: heightBalanced,
      depthPx: measureColumnDepthPx(heightBalanced, obstacles, widths, domOpts),
    }
  }

  const totalInCol0 = measureText(fullText, widths[0], opts)
  let lo = Math.max(...obstacles) + LINE_HEIGHT_PX * 2
  let hi = Math.max(...obstacles) + totalInCol0 + 20
  let best = null

  for (let pass = 0; pass < 22 && lo <= hi; pass++) {
    const D = Math.floor((lo + hi) / 2)
    const result = tryFlowAtDepth(fullText, D, obstacles, widths, opts)
    if (result.overflow) {
      lo = D + 1
      continue
    }
    if (!best || result.score < best.score) best = result
    const maxUnder = Math.max(...result.budgets.map((b, i) => b - measureText(result.texts[i], widths[i], opts)))
    if (maxUnder > 10) hi = D - 1
    else hi = D - 1
  }

  if (!best) {
    for (let D = lo; D <= hi + 24; D += 6) {
      const result = tryFlowAtDepth(fullText, D, obstacles, widths, opts)
      if (!result.overflow && (!best || result.score < best.score)) best = result
    }
  }

  if (best?.texts?.some((t) => t.trim())) {
    const D = best.depthPx || Math.max(...obstacles) + LINE_HEIGHT_PX * 8
    const domOpts = { ...opts, fastMeasure: false }
    const fastSpread = measureColumnSpread(best.texts, obstacles, widths, {
      ...opts,
      fastMeasure: true,
    })
    let texts
    if (fastSpread > 10) {
      texts =
        findBestDepthByDomSpread(fullText, obstacles, widths, opts, D) ||
        flowBodyAtDepthDom(fullText, D, obstacles, widths, domOpts) ||
        finalizeColumnLayout(best.texts, obstacles, widths, domOpts, fullText)
    } else {
      texts =
        flowBodyAtDepthDom(fullText, D, obstacles, widths, domOpts) ||
        finalizeColumnLayout(best.texts, obstacles, widths, domOpts, fullText)
    }
    return {
      texts,
      depthPx: measureColumnDepthPx(texts, obstacles, widths, domOpts),
    }
  }

  const words = tokenizeWords(fullText)
  const n = words.length
  const c0 = Math.max(8, Math.floor(n * 0.3))
  const c1 = Math.max(10, Math.floor(n * 0.34))
  const texts = [
    words.slice(0, c0).join(' '),
    words.slice(c0, c0 + c1).join(' '),
    words.slice(c0 + c1).join(' '),
  ]
  return {
    texts,
    depthPx: measureColumnDepthPx(texts, obstacles, widths, opts),
  }
}
