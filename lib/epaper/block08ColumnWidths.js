/**
 * BLOCK-08A — equal column widths for measure + partition (all 3 cols same rail).
 */

import { wideColumnContentWidthPx } from './wideColumnBalance'

export function uniformBlock08ColumnWidths(columnsEl, columnCount, nativeWidthPx, gutterMm = 2, gapMm = 2) {
  const fallback = wideColumnContentWidthPx(nativeWidthPx, columnCount, gutterMm, gapMm)
  if (!columnsEl?.children?.length) {
    return Array.from({ length: columnCount }, () => fallback)
  }

  const measured = []
  for (let i = 0; i < columnCount; i++) {
    const el = columnsEl.children[i]
    const w = el?.clientWidth
    if (w && w > 40) measured.push(Math.floor(w))
  }

  const uniform =
    measured.length > 0 ? Math.min(...measured) : fallback

  return Array.from({ length: columnCount }, () => uniform)
}
