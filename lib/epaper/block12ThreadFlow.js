import {
  flowBodyAcross12Columns,
  mergeBodyItemsToFlowText,
  repairBlock12ColumnTexts,
} from './block12CrossColumnFlow'
import { isBroken12ColumnLayout, repairBroken12ColumnLayout } from './block12LayoutGuard'
import { tokenizeWords } from './block08LineComposer'

export function assignBlock12ColumnText(
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

  const imageCount = columns.reduce((n, c) => n + (c.images?.length || 0), 0)
  const flow = flowBodyAcross12Columns(bodyItems, obstacleHeightsByCol, widths, {
    ...flowOpts,
    imageCount,
  })
  let columnTexts = (flow.texts || []).map((t) => String(t || ''))
  const fullText = mergeBodyItemsToFlowText(bodyItems)
  const flowCtx = {
    totalWords: tokenizeWords(fullText).length,
    imageCount,
    obstacles: obstacleHeightsByCol,
    widths,
    flowOpts,
  }
  columnTexts = repairBroken12ColumnLayout(columnTexts, fullText, flowCtx)
  if (isBroken12ColumnLayout(columnTexts, flowCtx)) {
    columnTexts = repairBlock12ColumnTexts(
      columnTexts,
      fullText,
      obstacleHeightsByCol,
      widths,
      { ...flowOpts, imageCount }
    )
  }

  return columns.map((col, i) => ({
    ...col,
    textFragments: columnTexts[i] ? [columnTexts[i]] : [],
    columnText: columnTexts[i] || '',
    columnDepthPx: flow.depthPx || 0,
  }))
}
