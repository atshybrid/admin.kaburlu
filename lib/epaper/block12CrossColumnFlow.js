/**
 * BLOCK-12A — 4-column threaded body (08A engine + even bottoms).
 */

import { mergeBodyItemsToFlowText, takeTextForColumnHeight } from './block08CrossColumnFlow'
import { tokenizeWords } from './block08LineComposer'
import { measureFlowItemHeightDom } from './block08Measure'
import { BLOCK_08A_LINE_HEIGHT_PX } from './block08TextMetrics'

export const BLOCK_12_COLUMN_COUNT = 4
/** Col2 = primary image stack (08A center column). */
export const BLOCK_12_PRIMARY_IMAGE_COL = 1
const TERMINAL_COL_INDEX = 3

const LINE_HEIGHT_PX = BLOCK_08A_LINE_HEIGHT_PX
const BOTTOM_TOLERANCE_PX = 10
const CENTER_IMAGE_OBS_MIN_PX = 96
const CENTER_MIN_WORDS = 18
const RENDERED_BOTTOM_SANE_MAX_PX = 1400

function centerColumnHasImage(obstacles) {
  return (obstacles[BLOCK_12_PRIMARY_IMAGE_COL] || 0) >= CENTER_IMAGE_OBS_MIN_PX
}

function centerWordCount(cols) {
  return tokenizeWords(cols[BLOCK_12_PRIMARY_IMAGE_COL] || '').length
}

function canShiftTextOutOfCenter(cols) {
  return centerWordCount(cols) > CENTER_MIN_WORDS
}

function columnMeasureOpts(colIndex, opts = {}) {
  return {
    ...opts,
    columnIndex: colIndex,
    showDateline: colIndex === 0 && !!opts.showDateline,
    textAlignLast: colIndex >= TERMINAL_COL_INDEX ? 'left' : 'justify',
  }
}

function measureText(text, colWidthPx, opts) {
  const t = String(text || '')
  if (!t.trim()) return 0
  return measureFlowItemHeightDom({ content: t }, colWidthPx, opts)
}

function columnBottomPx(text, colIndex, obstaclePx, colWidths, opts) {
  return (
    (obstaclePx[colIndex] || 0) +
    measureText(text, colWidths[colIndex], columnMeasureOpts(colIndex, opts))
  )
}

function shiftLastWord(fromText, toText) {
  const parts = String(fromText || '').trim().split(/\s+/)
  if (!parts.length) return { from: fromText, to: toText }
  const word = parts.pop()
  const from = parts.join(' ')
  const to = toText ? `${word} ${String(toText).trimStart()}` : word
  return { from, to }
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

function centerColumnTextTargetPx(obstacles, col0TextHeightPx) {
  const col0Bottom = (obstacles[0] || 0) + col0TextHeightPx
  const obs1 = obstacles[BLOCK_12_PRIMARY_IMAGE_COL] || 0
  return Math.max(LINE_HEIGHT_PX * 3, col0Bottom - obs1)
}

/** Col2 (image): text below photo should reach col1 text depth. */
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
      if (cols[TERMINAL_COL_INDEX]?.trim()) {
        const r = shiftLastWord(cols[1], cols[TERMINAL_COL_INDEX])
        if (r.from !== cols[1]) {
          cols[1] = r.from
          cols[TERMINAL_COL_INDEX] = r.to
          moved = true
        }
      }
      if (!moved && cols[1]?.trim()) {
        const r = shiftFirstWord(cols[1], cols[0])
        if (r.from !== cols[1]) {
          cols[1] = r.from
          cols[0] = r.to
          moved = true
        }
      }
    }
    if (!moved) break
  }

  return cols
}

/** Terminal col4 — pull words only when col4 is short; never drain col1 below min share. */
function fillFourthColumnToTarget(cols, obstacles, widths, opts) {
  const protectCenter = centerColumnHasImage(obstacles)
  const totalW = tokenizeWords(cols.join(' ')).length
  const minCol0 = Math.max(6, Math.floor(totalW * 0.14))

  for (let k = 0; k < 200; k++) {
    const b = cols.map((t, i) => columnBottomPx(t, i, obstacles, widths, opts))
    const target = Math.max(...b)
    if (b[TERMINAL_COL_INDEX] >= target - BOTTOM_TOLERANCE_PX) break

    let moved = false
    if (cols[2]?.trim() && tokenizeWords(cols[2]).length > 10) {
      const r = shiftLastWord(cols[2], cols[TERMINAL_COL_INDEX])
      if (r.from !== cols[2]) {
        cols[2] = r.from
        cols[TERMINAL_COL_INDEX] = r.to
        moved = true
      }
    }
    if (!moved && cols[1]?.trim() && (!protectCenter || canShiftTextOutOfCenter(cols))) {
      const h1 = measureText(cols[1], widths[1], columnMeasureOpts(1, opts))
      const h0 = measureText(cols[0], widths[0], columnMeasureOpts(0, opts))
      const targetH1 = centerColumnTextTargetPx(obstacles, h0)
      if (
        tokenizeWords(cols[1]).length > 14 &&
        (!protectCenter || h1 > targetH1 + LINE_HEIGHT_PX * 2)
      ) {
        const r = shiftLastWord(cols[1], cols[TERMINAL_COL_INDEX])
        if (r.from !== cols[1]) {
          cols[1] = r.from
          cols[TERMINAL_COL_INDEX] = r.to
          moved = true
        }
      }
    }
    if (!moved && cols[0]?.trim() && tokenizeWords(cols[0]).length > minCol0 + 6) {
      const r = shiftLastWord(cols[0], cols[TERMINAL_COL_INDEX])
      if (r.from !== cols[0]) {
        cols[0] = r.from
        cols[TERMINAL_COL_INDEX] = r.to
        moved = true
      }
    }
    if (!moved) break
  }

  return cols
}

/** Pull text into short columns until measured bottoms match. */
function alignAllColumnsToTargetBottom(cols, obstacles, widths, opts) {
  const protectCenter = centerColumnHasImage(obstacles)

  for (let k = 0; k < 56; k++) {
    const b = cols.map((t, i) => columnBottomPx(t, i, obstacles, widths, opts))
    const target = Math.max(...b)
    const spread = Math.max(...b) - Math.min(...b)
    if (spread <= BOTTOM_TOLERANCE_PX) break

    let moved = false

    if (!moved && b[0] < target - BOTTOM_TOLERANCE_PX && cols[1]?.trim()) {
      const r = shiftFirstWord(cols[1], cols[0])
      if (r.from !== cols[1]) {
        cols[0] = r.to
        cols[1] = r.from
        moved = true
      }
    }
    if (!moved && b[0] < target - BOTTOM_TOLERANCE_PX && cols[2]?.trim()) {
      const r = shiftFirstWord(cols[2], cols[0])
      if (r.from !== cols[2]) {
        cols[0] = r.to
        cols[2] = r.from
        moved = true
      }
    }
    if (
      !moved &&
      protectCenter &&
      centerWordCount(cols) < 8 &&
      cols[2]?.trim()
    ) {
      const r = shiftFirstWord(cols[2], cols[BLOCK_12_PRIMARY_IMAGE_COL])
      if (r.from !== cols[2]) {
        cols[BLOCK_12_PRIMARY_IMAGE_COL] = r.to
        cols[2] = r.from
        moved = true
      }
    }
    if (!moved && b[1] < target - BOTTOM_TOLERANCE_PX && cols[2]?.trim()) {
      const r = shiftFirstWord(cols[2], cols[1])
      if (r.from !== cols[2]) {
        cols[1] = r.to
        cols[2] = r.from
        moved = true
      }
    }
    if (!moved && b[1] < target - BOTTOM_TOLERANCE_PX && cols[0]?.trim() && !protectCenter) {
      const r = shiftLastWord(cols[0], cols[1])
      if (r.from !== cols[0]) {
        cols[0] = r.from
        cols[1] = r.to
        moved = true
      }
    }
    if (!moved && b[2] < target - BOTTOM_TOLERANCE_PX && cols[1]?.trim()) {
      const r = shiftLastWord(cols[1], cols[2])
      if (r.from !== cols[1]) {
        cols[1] = r.from
        cols[2] = r.to
        moved = true
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
    if (!moved && b[TERMINAL_COL_INDEX] < target - BOTTOM_TOLERANCE_PX) {
      cols = fillFourthColumnToTarget(cols, obstacles, widths, opts)
      moved = true
    }
    if (
      !moved &&
      protectCenter &&
      b[BLOCK_12_PRIMARY_IMAGE_COL] > target + BOTTOM_TOLERANCE_PX &&
      canShiftTextOutOfCenter(cols)
    ) {
      const r = shiftLastWord(cols[BLOCK_12_PRIMARY_IMAGE_COL], cols[TERMINAL_COL_INDEX])
      if (r.from !== cols[BLOCK_12_PRIMARY_IMAGE_COL]) {
        cols[BLOCK_12_PRIMARY_IMAGE_COL] = r.from
        cols[TERMINAL_COL_INDEX] = r.to
        moved = true
      }
    }

    if (!moved) {
      const maxIdx = b.indexOf(Math.max(...b))
      const minIdx = b.indexOf(Math.min(...b))
      if (maxIdx !== minIdx && maxIdx !== TERMINAL_COL_INDEX && cols[maxIdx]?.trim()) {
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

function balanceSharedColumnBottoms(cols, obstacles, widths, opts) {
  const protectCenter = centerColumnHasImage(obstacles)

  for (let k = 0; k < 120; k++) {
    const b = cols.map((t, i) => columnBottomPx(t, i, obstacles, widths, opts))
    const spread = Math.max(...b) - Math.min(...b)
    if (spread <= BOTTOM_TOLERANCE_PX) break

    const minIdx = b.indexOf(Math.min(...b))
    const maxIdx = b.indexOf(Math.max(...b))
    let moved = false

    if (minIdx === BLOCK_12_PRIMARY_IMAGE_COL && protectCenter && cols[2]?.trim()) {
      const r = shiftFirstWord(cols[2], cols[BLOCK_12_PRIMARY_IMAGE_COL])
      if (r.from !== cols[2]) {
        cols[BLOCK_12_PRIMARY_IMAGE_COL] = r.to
        cols[2] = r.from
        moved = true
      }
    }
    if (!moved && minIdx === TERMINAL_COL_INDEX) {
      cols = fillFourthColumnToTarget(cols, obstacles, widths, opts)
      moved = true
    }
    if (!moved && maxIdx !== TERMINAL_COL_INDEX && cols[maxIdx]?.trim()) {
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
    if (!moved) break
  }

  return cols
}

/** When binary search dumps everything into col4 — force threaded word split (08A-style). */
function redistributeIf12ColumnsEmpty(texts, fullText, obstacles, opts = {}) {
  const words = tokenizeWords(fullText)
  if (words.length < 20) return texts.map((t) => String(t || ''))

  const w = texts.map((t) => tokenizeWords(t).length)
  const hasHl = (obstacles[0] || 0) >= 60
  const hasImg2 = centerColumnHasImage(obstacles)
  const hasImg3 = (obstacles[2] || 0) >= 80 || (opts.imageCount || 0) >= 2

  const hoardedInCol4 = w[TERMINAL_COL_INDEX] > words.length * 0.55
  const minCol0 = Math.max(6, Math.floor(words.length * 0.08))
  const bad =
    (words.length > 24 && w[0] < minCol0) ||
    (words.length > 36 && w[0] < 8) ||
    (words.length > 48 && hasImg2 && w[1] < 12) ||
    (words.length > 36 && w[2] < 6) ||
    (words.length > 48 && w[2] < 8) ||
    hoardedInCol4

  if (!bad) return texts.map((t) => String(t || ''))

  const n = words.length
  const c0 = Math.max(6, Math.floor(n * (hasHl ? 0.2 : 0.24)))
  const c1 = Math.max(hasImg2 ? 12 : 6, Math.floor(n * 0.24))
  const c2 = Math.max(hasImg3 ? 10 : 8, Math.floor(n * 0.22))
  return [
    words.slice(0, c0).join(' '),
    words.slice(c0, c0 + c1).join(' '),
    words.slice(c0 + c1, c0 + c1 + c2).join(' '),
    words.slice(c0 + c1 + c2).join(' '),
  ]
}

function finalizeBlock12ColumnLayout(texts, obstacles, widths, opts, fullText = '') {
  let cols = texts.map((t) => String(t || ''))
  if (fullText) {
    cols = redistributeIf12ColumnsEmpty(cols, fullText, obstacles, opts)
  }
  cols = rebalanceFourColumnBottoms(cols, obstacles, widths, opts)
  cols = ensureCenterColumnBottomAligned(cols, obstacles, widths, opts)
  cols = alignAllColumnsToTargetBottom(cols, obstacles, widths, opts)
  cols = fillFourthColumnToTarget(cols, obstacles, widths, opts)
  if (fullText) {
    cols = balanceSharedColumnBottoms(cols, obstacles, widths, opts)
  }
  return cols
}

/** Force even 4-col word split + polish (used when partition/align leaves blanks). */
export function repairBlock12ColumnTexts(texts, fullText, obstacles, widths, opts = {}) {
  let cols = (texts || []).map((t) => String(t || ''))
  cols = redistributeIf12ColumnsEmpty(cols, fullText, obstacles, opts)
  return finalizeBlock12ColumnLayout(cols, obstacles, widths, opts, fullText)
}

function rebalanceFourColumnBottoms(texts, obstaclePx, colWidths, opts = {}) {
  const cols = texts.map((t) => String(t || ''))
  const obstacles =
    obstaclePx?.length === BLOCK_12_COLUMN_COUNT ? obstaclePx : [0, 0, 0, 0]
  const widths =
    colWidths?.length === BLOCK_12_COLUMN_COUNT
      ? colWidths
      : Array.from({ length: BLOCK_12_COLUMN_COUNT }, () => colWidths?.[0] || 200)
  const protectCol2 = centerColumnHasImage(obstacles)

  const bottoms = () => cols.map((t, i) => columnBottomPx(t, i, obstacles, widths, opts))

  for (let pass = 0; pass < 160; pass++) {
    const b = bottoms()
    const spread = Math.max(...b) - Math.min(...b)
    if (spread <= BOTTOM_TOLERANCE_PX) break

    const maxIdx = b.indexOf(Math.max(...b))
    const minIdx = b.indexOf(Math.min(...b))
    if (maxIdx === minIdx) break

    let moved = false
    const drainCol2 =
      protectCol2 &&
      maxIdx === BLOCK_12_PRIMARY_IMAGE_COL &&
      centerWordCount(cols) <= 16

    if (!drainCol2 && maxIdx !== TERMINAL_COL_INDEX && cols[maxIdx]?.trim()) {
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
    if (!moved) break
  }

  return cols
}

/** Thread col1→col2→col3→col4 at depth D — every column respects text budget (not dump-all in col4). */
function threadFourColumnsAtDepth(fullText, depthPx, obstacles, widths, opts) {
  const budgets = obstacles.map((o) => Math.max(LINE_HEIGHT_PX * 2, depthPx - (o || 0)))
  let rest = fullText
  const out = []

  for (let c = 0; c < BLOCK_12_COLUMN_COUNT; c++) {
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
    out[TERMINAL_COL_INDEX] = out[TERMINAL_COL_INDEX]
      ? `${out[TERMINAL_COL_INDEX]} ${rest}`.trim()
      : rest.trim()
  }

  return out
}

function score12ColumnThread(chunks, obs, widths, domOpts, totalWords) {
  const bottoms = chunks.map((t, i) => columnBottomPx(t, i, obs, widths, domOpts))
  const spread = Math.max(...bottoms) - Math.min(...bottoms)
  const w0 = tokenizeWords(chunks[0] || '').length
  const w1 = tokenizeWords(chunks[1] || '').length
  const w2 = tokenizeWords(chunks[2] || '').length
  const w4 = tokenizeWords(chunks[TERMINAL_COL_INDEX] || '').length
  const minCol2 =
    obs[1] >= CENTER_IMAGE_OBS_MIN_PX ? Math.max(18, Math.floor(totalWords * 0.12)) : 0

  let penalty = 0
  if (totalWords > 36 && w0 < 8) penalty += 90000
  if (totalWords > 48 && minCol2 > 0 && w1 < minCol2) penalty += (minCol2 - w1) * 800
  if (totalWords > 48 && w2 < 8) penalty += 45000
  if (totalWords > 60 && w4 > totalWords * 0.58) penalty += (w4 - totalWords * 0.58) * 1200

  return spread + penalty
}

function flowFourColumnsToSharedBottom(fullText, obstacles, widths, opts) {
  const domOpts = { ...opts, fastMeasure: false }
  const obs = obstacles.map((o) => Math.max(0, o || 0))
  const totalWords = tokenizeWords(fullText).length
  if (!totalWords) return null

  const oneColH = measureText(fullText, widths[0], columnMeasureOpts(0, domOpts))
  let lo = Math.max(...obs, 0) + LINE_HEIGHT_PX * 8
  let hi = Math.ceil(Math.max(...obs, 0) + oneColH + LINE_HEIGHT_PX * 6)
  let bestCols = null
  let bestSpread = Infinity

  for (let pass = 0; pass < 36 && lo <= hi; pass++) {
    const D = Math.floor((lo + hi) / 2)
    const chunks = threadFourColumnsAtDepth(fullText, D, obs, widths, domOpts)

    const used = tokenizeWords(chunks.filter(Boolean).join(' ')).length
    if (used < totalWords - 3) {
      lo = D + 1
      continue
    }

    const budgets = obs.map((o) => Math.max(LINE_HEIGHT_PX * 2, D - o))
    const hLast = measureText(chunks[TERMINAL_COL_INDEX], widths[TERMINAL_COL_INDEX], columnMeasureOpts(TERMINAL_COL_INDEX, domOpts))
    const score = score12ColumnThread(chunks, obs, widths, domOpts, totalWords)

    if (score < bestSpread) {
      bestSpread = score
      bestCols = chunks
    }

    if (hLast < budgets[TERMINAL_COL_INDEX] - 10) {
      lo = D + 1
      continue
    }

    const spread = Math.max(
      ...chunks.map((t, i) => columnBottomPx(t, i, obs, widths, domOpts))
    ) - Math.min(...chunks.map((t, i) => columnBottomPx(t, i, obs, widths, domOpts)))

    if (spread <= BOTTOM_TOLERANCE_PX * 2 && score < 50000) {
      bestCols = chunks
      break
    }
    hi = D - 1
  }

  if (!bestCols?.some((t) => t.trim())) return null
  return finalizeBlock12ColumnLayout(bestCols, obstacles, widths, domOpts, fullText)
}

export function flowBodyAcross12Columns(bodyItems, obstaclePx, colWidths, opts = {}) {
  const fullText = mergeBodyItemsToFlowText(bodyItems)
  const empty = {
    texts: Array.from({ length: BLOCK_12_COLUMN_COUNT }, () => ''),
    depthPx: 0,
  }
  if (!fullText) return empty

  if (typeof document === 'undefined') {
    const q = Math.ceil(fullText.length / 4)
    return {
      texts: [
        fullText.slice(0, q),
        fullText.slice(q, q * 2),
        fullText.slice(q * 2, q * 3),
        fullText.slice(q * 3),
      ],
      depthPx: 520,
    }
  }

  const baseW = colWidths?.[0] || 200
  const widths =
    colWidths?.length === BLOCK_12_COLUMN_COUNT
      ? colWidths
      : Array.from({ length: BLOCK_12_COLUMN_COUNT }, () => baseW)
  const obstacles =
    obstaclePx?.length === BLOCK_12_COLUMN_COUNT ? obstaclePx : [0, 0, 0, 0]
  const domOpts = { ...opts, fastMeasure: false }

  const balanced = flowFourColumnsToSharedBottom(fullText, obstacles, widths, domOpts)
  if (balanced) {
    const depths = balanced.map((t, i) => columnBottomPx(t, i, obstacles, widths, domOpts))
    return { texts: balanced, depthPx: Math.max(...depths, 0) }
  }

  const q = Math.ceil(fullText.length / 4)
  const fallback = [
    fullText.slice(0, q),
    fullText.slice(q, q * 2),
    fullText.slice(q * 2, q * 3),
    fullText.slice(q * 3),
  ]
  return {
    texts: finalizeBlock12ColumnLayout(fallback, obstacles, widths, domOpts, fullText),
    depthPx: 520,
  }
}

/** Screen truth — text <p> bottom relative to column top (avoids flex stretch bugs). */
export function measureRenderedColumnTextBottoms12(columnsEl) {
  if (!columnsEl?.children?.length) return null
  const bottoms = []
  for (let i = 0; i < BLOCK_12_COLUMN_COUNT; i++) {
    const col = columnsEl.children[i]
    const p = col?.querySelector?.('[data-text-flow] p')
    if (!p) {
      bottoms.push(0)
      continue
    }
    const colRect = col.getBoundingClientRect()
    const pRect = p.getBoundingClientRect()
    const bottom = Math.ceil(pRect.bottom - colRect.top)
    if (bottom <= 0 || bottom > RENDERED_BOTTOM_SANE_MAX_PX) return null
    bottoms.push(bottom)
  }
  return bottoms.length === BLOCK_12_COLUMN_COUNT ? bottoms : null
}

function nudgeCenterColumnToRenderedDepth12(columnTexts, columnsEl) {
  const rendered = measureRenderedColumnTextBottoms12(columnsEl)
  if (!rendered) return columnTexts

  const centerEl = columnsEl.children?.[BLOCK_12_PRIMARY_IMAGE_COL]
  if (!centerEl?.querySelector?.('[class*="imageObstacle"]')) return columnTexts

  const target = Math.max(rendered[0], rendered[2], rendered[TERMINAL_COL_INDEX])
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

function nudgeCol4ToRenderedBottom12(columnTexts, columnsEl) {
  const rendered = measureRenderedColumnTextBottoms12(columnsEl)
  if (!rendered) return columnTexts

  const target = Math.max(rendered[0], rendered[1], rendered[2])
  if (rendered[TERMINAL_COL_INDEX] >= target - 8) return columnTexts

  const gapPx = Math.max(0, target - rendered[TERMINAL_COL_INDEX])
  const wordMoves = Math.min(64, Math.max(4, Math.ceil(gapPx / (LINE_HEIGHT_PX * 0.9))))

  let cols = columnTexts.map((t) => String(t || ''))
  for (let k = 0; k < wordMoves; k++) {
    let moved = false
    if (cols[2]?.trim()) {
      const r = shiftLastWord(cols[2], cols[TERMINAL_COL_INDEX])
      if (r.from !== cols[2]) {
        cols[2] = r.from
        cols[TERMINAL_COL_INDEX] = r.to
        moved = true
      }
    }
    if (!moved && cols[1]?.trim()) {
      const r = shiftLastWord(cols[1], cols[TERMINAL_COL_INDEX])
      if (r.from !== cols[1]) {
        cols[1] = r.from
        cols[TERMINAL_COL_INDEX] = r.to
        moved = true
      }
    }
    if (!moved && cols[0]?.trim()) {
      const r = shiftLastWord(cols[0], cols[TERMINAL_COL_INDEX])
      if (r.from !== cols[0]) {
        cols[0] = r.from
        cols[TERMINAL_COL_INDEX] = r.to
        moved = true
      }
    }
    if (!moved) break
  }
  return cols
}

export function alignColumnTextsToRenderedBottoms12(columnTexts, columnsEl) {
  let cols = columnTexts.map((t) => String(t || ''))
  if (!columnsEl?.children?.length) return cols

  for (let pass = 0; pass < 28; pass++) {
    const rendered = measureRenderedColumnTextBottoms12(columnsEl)
    if (!rendered) break
    const spread = Math.max(...rendered) - Math.min(...rendered)
    if (spread <= 8) break

    const before = cols.join('\x1e')
    const targetHigh = Math.max(...rendered)

    if (rendered[1] < targetHigh - 8) {
      cols = nudgeCenterColumnToRenderedDepth12(cols, columnsEl)
    }
    if (rendered[TERMINAL_COL_INDEX] < targetHigh - 8) {
      cols = nudgeCol4ToRenderedBottom12(cols, columnsEl)
    }

    for (let i = 1; i < BLOCK_12_COLUMN_COUNT; i++) {
      if (rendered[i] > targetHigh + 8 && cols[i]?.trim() && cols[i - 1]) {
        const r = shiftFirstWord(cols[i], cols[i - 1])
        if (r.from !== cols[i]) {
          cols[i] = r.from
          cols[i - 1] = r.to
        }
      } else if (rendered[i] < targetHigh - 8 && cols[i - 1]?.trim()) {
        const r = shiftLastWord(cols[i - 1], cols[i])
        if (r.from !== cols[i - 1]) {
          cols[i - 1] = r.from
          cols[i] = r.to
        }
      }
    }
    if (cols.join('\x1e') === before) break
  }

  return cols
}
