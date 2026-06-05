/**
 * BLOCK-06A — 2-column threaded body flow (LOCKED — see BLOCK_06A_LOCKED.md).
 */

import { mergeBodyItemsToFlowText, takeTextForColumnHeight } from './block08CrossColumnFlow'
import { tokenizeWords } from './block08LineComposer'
import { measureFlowItemHeightDom } from './block08Measure'

export const BLOCK_06_COLUMN_COUNT = 2
export const BLOCK_06_IMAGE_COL_INDEX = 1

const LINE_HEIGHT_PX = 16.5
const BOTTOM_TOLERANCE_PX = 4
const IMAGE_COL_MIN_WORDS = 12

function columnMeasureOpts(colIndex, opts = {}) {
  return {
    ...opts,
    columnIndex: colIndex,
    showDateline: colIndex === 0 && !!opts.showDateline,
    textAlignLast: colIndex >= 1 ? 'left' : 'justify',
  }
}

function measureText(text, colWidthPx, opts) {
  const t = String(text || '')
  if (!t.trim()) return 0
  return measureFlowItemHeightDom({ content: t }, colWidthPx, opts)
}

/** Column bottom = obstacle + text (Quark threaded — no shared-top pad). */
function columnBottomPx(text, colIndex, obstaclePx, colWidths, opts) {
  const colOpts = columnMeasureOpts(colIndex, opts)
  return (obstaclePx[colIndex] || 0) + measureText(text, colWidths[colIndex], colOpts)
}

function imageColumnHasObstacle(obstacles) {
  return (obstacles[BLOCK_06_IMAGE_COL_INDEX] || 0) > 72
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

function rebalanceTwoColumnBottoms(texts, obstaclePx, colWidths, opts = {}) {
  const cols = texts.map((t) => String(t || ''))
  const obstacles =
    obstaclePx?.length === BLOCK_06_COLUMN_COUNT ? obstaclePx : [0, 0]
  const widths =
    colWidths?.length === BLOCK_06_COLUMN_COUNT
      ? colWidths
      : [colWidths?.[0] || 200, colWidths?.[0] || 200]
  const protectImageCol = imageColumnHasObstacle(obstacles)

  const bottoms = () => cols.map((t, i) => columnBottomPx(t, i, obstacles, widths, opts))

  for (let pass = 0; pass < 120; pass++) {
    const b = bottoms()
    const spread = Math.max(...b) - Math.min(...b)
    if (spread <= BOTTOM_TOLERANCE_PX) break

    const maxIdx = b.indexOf(Math.max(...b))
    const minIdx = b.indexOf(Math.min(...b))
    if (maxIdx === minIdx) break

    let moved = false
    if (maxIdx === 1 && minIdx === 0 && cols[1]?.trim()) {
      const totalWords = tokenizeWords(cols.join(' ')).length
      const minKeep = protectImageCol
        ? Math.max(IMAGE_COL_MIN_WORDS, Math.floor(totalWords * 0.15))
        : 0
      if (tokenizeWords(cols[1]).length > minKeep) {
        const { from, to } = shiftFirstWord(cols[1], cols[0])
        if (from !== cols[1]) {
          cols[1] = from
          cols[0] = to
          moved = true
        }
      }
    } else if (maxIdx === 0 && minIdx === 1 && cols[0]?.trim()) {
      const { from, to } = shiftLastWord(cols[0], cols[1])
      if (from !== cols[0]) {
        cols[0] = from
        cols[1] = to
        moved = true
      }
    } else if (cols[maxIdx]?.trim()) {
      const drainImageCol =
        protectImageCol &&
        maxIdx === BLOCK_06_IMAGE_COL_INDEX &&
        tokenizeWords(cols[1] || '').length <= 12
      if (!drainImageCol) {
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

    if (!moved) break
  }

  return cols
}

function flowTwoColumnsToSharedBottom(fullText, obstacles, widths, opts) {
  const domOpts = { ...opts, fastMeasure: false }
  const obs = obstacles.map((o) => Math.max(0, o || 0))
  const totalWords = tokenizeWords(fullText).length
  if (!totalWords) return null

  const oneColH = measureText(fullText, widths[0], columnMeasureOpts(0, domOpts))
  let lo = Math.max(...obs, 0) + LINE_HEIGHT_PX * 8
  let hi = Math.ceil(obs[0] + oneColH)
  let bestCols = null
  let bestSpread = Infinity

  for (let pass = 0; pass < 32 && lo <= hi; pass++) {
    const D = Math.floor((lo + hi) / 2)
    const budgets = obs.map((o) => Math.max(LINE_HEIGHT_PX * 2, D - o))

    let rest = fullText
    const c0 = takeTextForColumnHeight(rest, widths[0], budgets[0], columnMeasureOpts(0, domOpts))
    rest = c0.remainder || ''
    const c1chunk = takeTextForColumnHeight(rest, widths[1], budgets[1], columnMeasureOpts(1, domOpts))
    const c1 = c1chunk.text || ''
    rest = c1chunk.remainder || ''

    const used = tokenizeWords([c0.text, c1].filter(Boolean).join(' ')).length
    if (used < totalWords - 2 || String(rest || '').trim()) {
      lo = D + 1
      continue
    }

    const bottoms = [
      obs[0] + measureText(c0.text, widths[0], columnMeasureOpts(0, domOpts)),
      obs[1] + measureText(c1, widths[1], columnMeasureOpts(1, domOpts)),
    ]
    const spread = Math.max(...bottoms) - Math.min(...bottoms)
    const cols = [c0.text || '', c1]

    const w1 = tokenizeWords(c1).length
    const minRight = imageColumnHasObstacle(obs)
      ? Math.max(IMAGE_COL_MIN_WORDS, Math.floor(totalWords * 0.15))
      : 0
    const rightPenalty = minRight > 0 && w1 < minRight ? (minRight - w1) * 600 : 0
    const score = spread + rightPenalty

    if (score < bestSpread) {
      bestSpread = score
      bestCols = cols
    }

    const h1 = measureText(c1, widths[1], columnMeasureOpts(1, domOpts))
    if (h1 < budgets[1] - 10) {
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
  return rebalanceTwoColumnBottoms(bestCols, obstacles, widths, domOpts)
}

export function flowBodyAcross06Columns(bodyItems, obstaclePx, colWidths, opts = {}) {
  const fullText = mergeBodyItemsToFlowText(bodyItems)
  const empty = {
    texts: Array.from({ length: BLOCK_06_COLUMN_COUNT }, () => ''),
    depthPx: 0,
  }
  if (!fullText) return empty

  if (typeof document === 'undefined') {
    const half = Math.ceil(fullText.length / 2)
    return {
      texts: [fullText.slice(0, half), fullText.slice(half)],
      depthPx: 420,
    }
  }

  const baseW = colWidths?.[0] || 200
  const widths =
    colWidths?.length === BLOCK_06_COLUMN_COUNT ? colWidths : [baseW, baseW]
  const obstacles =
    obstaclePx?.length === BLOCK_06_COLUMN_COUNT ? obstaclePx : [0, 0]
  const domOpts = { ...opts, fastMeasure: false }

  const balanced = flowTwoColumnsToSharedBottom(fullText, obstacles, widths, domOpts)
  if (balanced) {
    const depths = balanced.map((t, i) =>
      columnBottomPx(t, i, obstacles, widths, domOpts)
    )
    return { texts: balanced, depthPx: Math.max(...depths, 0) }
  }

  const third = Math.ceil(fullText.length / 2)
  return {
    texts: [fullText.slice(0, third), fullText.slice(third)],
    depthPx: 420,
  }
}

const RENDERED_BOTTOM_SANE_MAX_PX = 1400

export function measureRenderedColumnTextBottoms06(columnsEl) {
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
    if (bottom > RENDERED_BOTTOM_SANE_MAX_PX) return null
    bottoms.push(bottom)
  }
  return bottoms.length === BLOCK_06_COLUMN_COUNT ? bottoms : null
}

export function alignColumnTextsToRenderedBottoms06(columnTexts, columnsEl) {
  let cols = columnTexts.map((t) => String(t || ''))
  if (!columnsEl?.children?.length) return cols

  const imageCol = columnsEl.children?.[BLOCK_06_IMAGE_COL_INDEX]
  const hasImage = !!imageCol?.querySelector?.('[class*="imageObstacle"]')
  const totalWords = () => tokenizeWords(cols.join(' ')).length
  const minImageColWords = hasImage
    ? Math.max(IMAGE_COL_MIN_WORDS, Math.floor(totalWords() * 0.15))
    : 0

  for (let pass = 0; pass < 40; pass++) {
    const rendered = measureRenderedColumnTextBottoms06(columnsEl)
    if (!rendered) break
    const spread = Math.max(...rendered) - Math.min(...rendered)
    if (spread <= BOTTOM_TOLERANCE_PX) break

    const before = cols.join('\x1e')
    const col1Words = tokenizeWords(cols[1] || '').length

    if (rendered[0] < rendered[1] - BOTTOM_TOLERANCE_PX && cols[1]?.trim() && col1Words > minImageColWords) {
      const r = shiftFirstWord(cols[1], cols[0])
      if (r.from !== cols[1]) {
        cols[1] = r.from
        cols[0] = r.to
      }
    } else if (rendered[1] < rendered[0] - BOTTOM_TOLERANCE_PX && cols[0]?.trim()) {
      const r = shiftLastWord(cols[0], cols[1])
      if (r.from !== cols[0]) {
        cols[0] = r.from
        cols[1] = r.to
      }
    }

    if (cols.join('\x1e') === before) break
  }

  return cols
}
