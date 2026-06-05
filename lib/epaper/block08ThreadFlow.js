/**
 * BLOCK-08A — column text assignment (partition + optional DOM refine).
 */

import {
  flowBodyAcrossColumns,
  mergeBodyItemsToFlowText,
  measureColumnSpread,
  polishBlock08ColumnTexts,
  rebalanceColumnBottoms,
} from './block08CrossColumnFlow'
import {
  needsBlock08DeterministicRepair,
  threadBlock08ByStableShares,
} from './block08DeterministicFlow'
import { isBroken08ColumnLayout, repairBroken08ColumnLayout } from './block08LayoutGuard'
import { tokenizeWords } from './block08LineComposer'
import {
  partitionBodyForEvenBottoms,
  refineAssignmentsFromDomHeights,
} from './block08ColumnPartition'

/**
 * Continuous threaded flow: col1 → col2 (below image) → col3, even bottoms, hyphen at breaks.
 */
export function assignBlock08ColumnText(
  bodyItems,
  columns,
  obstacleHeightsByCol,
  measureColumnText,
  colWidths = [],
  flowOpts = {}
) {
  const colCount = columns.length
  const widths =
    colWidths.length >= colCount
      ? colWidths
      : Array.from({ length: colCount }, (_, i) => colWidths[i] || colWidths[0] || 200)

  const flow = flowBodyAcrossColumns(bodyItems, obstacleHeightsByCol, widths, flowOpts)
  let columnTexts = (flow.texts || []).map((t) => String(t || ''))
  const depthPx = flow.depthPx || 0
  const fullText = mergeBodyItemsToFlowText(bodyItems)
  const flowCtx = {
    totalWords: tokenizeWords(fullText).length,
    hasHighlights: !!flowOpts?.hasHighlights,
    hasCenterImage: (obstacleHeightsByCol[1] || 0) >= 96,
    obstacles: obstacleHeightsByCol,
    widths,
    flowOpts,
    rebalance: rebalanceColumnBottoms,
  }

  const spread = measureColumnSpread(columnTexts, obstacleHeightsByCol, widths, flowOpts)
  if (
    needsBlock08DeterministicRepair(columnTexts, flowCtx) ||
    spread > 18 ||
    isBroken08ColumnLayout(columnTexts, flowCtx)
  ) {
    columnTexts = threadBlock08ByStableShares(
      fullText,
      obstacleHeightsByCol,
      widths,
      flowOpts
    )
  }

  columnTexts = rebalanceColumnBottoms(columnTexts, obstacleHeightsByCol, widths, flowOpts)
  columnTexts = repairBroken08ColumnLayout(columnTexts, fullText, flowCtx)
  columnTexts = rebalanceColumnBottoms(columnTexts, obstacleHeightsByCol, widths, flowOpts)
  columnTexts = polishBlock08ColumnTexts(
    columnTexts,
    obstacleHeightsByCol,
    widths,
    flowOpts,
    fullText
  )

  return columns.map((col, i) => ({
    ...col,
    textFragments: columnTexts[i] ? [columnTexts[i]] : [],
    columnText: columnTexts[i] || '',
    columnDepthPx: depthPx,
  }))
}

/** @deprecated Use assignBlock08ColumnText */
export function flowThreadedTextAcrossColumns(
  bodyItems,
  columns,
  measureColumnText,
  obstacleHeightsByCol = [0, 0, 0]
) {
  return assignBlock08ColumnText(
    bodyItems,
    columns,
    obstacleHeightsByCol,
    measureColumnText
  )
}

export function balanceThreadedColumnBottoms(columns) {
  return columns
}

export function computeColumnHeightTarget(
  columns,
  bodyItems,
  measureColumnText,
  obstacleHeightsByCol
) {
  const assignments = partitionBodyForEvenBottoms(
    bodyItems,
    obstacleHeightsByCol,
    measureColumnText,
    columns?.length || 3
  )

  const bottoms = assignments.map((indices, col) => {
    const obs = obstacleHeightsByCol[col] || 0
    if (!indices.length) return obs
    return obs + measureColumnText(indices, col)
  })

  return Math.ceil(Math.max(...bottoms, 320) + 16)
}

export { refineAssignmentsFromDomHeights, partitionBodyForEvenBottoms }
