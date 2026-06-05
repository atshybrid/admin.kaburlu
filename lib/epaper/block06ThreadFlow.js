/**
 * BLOCK-06A — column text assignment (2-col threaded flow).
 */

import { flowBodyAcross06Columns } from './block06CrossColumnFlow'

export function assignBlock06ColumnText(
  bodyItems,
  columns,
  obstacleHeightsByCol,
  _measureColumnText,
  colWidths = [],
  flowOpts = {}
) {
  const colCount = columns.length
  const widths =
    colWidths.length >= colCount
      ? colWidths
      : Array.from({ length: colCount }, (_, i) => colWidths[i] || colWidths[0] || 200)

  const flow = flowBodyAcross06Columns(bodyItems, obstacleHeightsByCol, widths, flowOpts)
  const columnTexts = flow.texts || []
  const depthPx = flow.depthPx || 0

  return columns.map((col, i) => ({
    ...col,
    textFragments: columnTexts[i] ? [columnTexts[i]] : [],
    columnText: columnTexts[i] || '',
    columnDepthPx: depthPx,
  }))
}
