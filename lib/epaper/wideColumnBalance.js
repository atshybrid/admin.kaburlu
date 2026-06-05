/**
 * BLOCK-06A / BLOCK-08A — image placement helpers.
 * Body text uses native CSS multi-column flow (no manual paragraph cuts).
 */

const MM_TO_PX = 96 / 25.4
const BODY_LINE_PX = 14
const BODY_PARA_GAP_PX = 6

export function wideColumnContentWidthPx(nativeWidthPx, columnCount, gutterMm = 2, colGapMm = 2) {
  const blockGutter = gutterMm * 2 * MM_TO_PX
  const colGaps = Math.max(0, columnCount - 1) * colGapMm * MM_TO_PX
  return Math.max(80, Math.floor((nativeWidthPx - blockGutter - colGaps) / columnCount))
}

export function estimateFlowItemHeight(item, colWidthPx) {
  if (item?.type === 'heading') return 23
  const text = String(item?.content || item || '').trim()
  if (!text) return 0
  const charsPerLine = Math.max(14, Math.floor(colWidthPx / 5.5))
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine))
  return lines * BODY_LINE_PX + BODY_PARA_GAP_PX
}

export function estimateHeadlinePanelPx(headlineCount) {
  if (!headlineCount) return 0
  return 20 + headlineCount * 28
}

/** Spread photos into column slots (ordering); rendered in lead-row, not inside body-flow. */
export function planColumnImages(leadImages, columnCount) {
  const cols = Array.from({ length: columnCount }, () => [])
  const slotCols = Math.max(0, columnCount - 1)
  for (let i = 0; i < Math.min(slotCols, leadImages.length); i++) {
    cols[i + 1].push(leadImages[i])
  }
  const overflow = leadImages.slice(slotCols)
  for (const img of overflow) {
    let target = 1
    let minCount = cols[1].length
    for (let c = 1; c < columnCount; c++) {
      if (cols[c].length < minCount) {
        minCount = cols[c].length
        target = c
      }
    }
    cols[target].push(img)
  }
  return cols
}

export function estimateImageDisplayPx(naturalW, naturalH, colWidthPx, caption = false) {
  const nw = naturalW || 1
  const nh = naturalH || 1
  const displayH = Math.ceil((colWidthPx * nh) / nw)
  return displayH + (caption ? 18 : 0)
}
