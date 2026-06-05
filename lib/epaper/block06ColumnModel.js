/**
 * BLOCK-06A — per-column obstacles (2-col threaded flow).
 */

import { estimateHeadlinePanelPx } from './wideColumnBalance'
import { chooseBlock06GridPlacement } from './block06EditorialIntel'

export function planBlock06LayoutZones(headlineCount = 0, imageCount = 0) {
  const hasHighlights = headlineCount > 0
  const hasSecondImage = imageCount >= 2
  return {
    col1: { highlights: hasHighlights, image: hasSecondImage, textFromTop: !hasHighlights },
    col2: { highlights: false, image: imageCount >= 1, imageRole: 'primary', textFromTop: false },
    flowOrder: 'col1 → col2 (below image)',
    bottomRule: 'obstacle + text bottom aligned on both columns',
  }
}

export function buildBlock06ColumnModels({
  visuals = {},
  images = [],
  headlineCount = 0,
  columnCount = 2,
}) {
  const columns = Array.from({ length: columnCount }, (_, index) => ({
    index,
    blockedZones: [],
    freeZones: [],
    textFragments: [],
    images: [],
    highlights: index === 0 && headlineCount > 0,
    wideBannerPeer: false,
  }))

  if (headlineCount > 0) {
    columns[0].blockedZones.push({
      type: 'highlights',
      top: 0,
      height: estimateHeadlinePanelPx(headlineCount),
    })
  }

  const slots = chooseBlock06GridPlacement(images)
  slots.forEach((slot) => {
    const col = columns[slot.columnIndex]
    if (!col) return
    col.images.push({ ...slot, image: slot.image })
  })

  return columns
}

export { applyMeasuredObstacles } from './block08ColumnModel'
