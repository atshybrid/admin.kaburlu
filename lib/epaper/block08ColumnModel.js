/**
 * Per-column obstacle slots for BLOCK-08A threaded flow.
 *
 * Zone plan (fixed):
 * - Col1: [highlights panel if points] → body text
 * - Col2: [primary image] → body text (article continues from col1)
 * - Col3: [secondary image if 2nd photo] → body OR full column body from top if no 2nd image
 * - Bottom: obstacle[i] + textHeight[i] = same D across all three columns
 */

import { estimateHeadlinePanelPx } from './wideColumnBalance'
import { chooseBlock08GridPlacement } from './block08EditorialIntel'

/** Human-readable zone plan for UI / debug */
export function planBlock08LayoutZones(headlineCount = 0, imageCount = 0) {
  const hasHighlights = headlineCount > 0
  const hasSecondImage = imageCount >= 2
  return {
    col1: { highlights: hasHighlights, image: false, textFromTop: !hasHighlights },
    col2: { highlights: false, image: imageCount >= 1, imageRole: 'primary', textFromTop: false },
    col3: {
      highlights: false,
      image: hasSecondImage,
      imageRole: 'secondary',
      textFromTop: !hasSecondImage,
    },
    flowOrder: 'col1 → col2 (below image) → col3 (below 2nd image or from top)',
    bottomRule: 'obstacle + text bottom aligned on all 3 columns',
  }
}

/**
 * @returns {import('./block08ThreadFlow').ColumnModel[]}
 */
export function buildColumnModels({
  visuals = {},
  images = [],
  headlineCount = 0,
  columnCount = 3,
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

  const list = (images || []).filter((img) => img?.src)
  const slots = chooseBlock08GridPlacement(list)
  slots.forEach((slot) => {
    const col = columns[slot.columnIndex]
    if (!col || col.images.length > 0) return
    col.images.push({ ...slot, image: slot.image })
  })

  if (list.length >= 2 && columns[2].images.length === 0) {
    columns[2].images.push({
      columnIndex: 2,
      image: list[1],
      role: 'secondary',
      size: 'compact-safe',
    })
  }
  if (list.length >= 1 && columns[1].images.length === 0) {
    columns[1].images.push({
      columnIndex: 1,
      image: list[0],
      role: 'primary',
      size: 'primary',
    })
  }

  return columns
}

/**
 * Apply measured obstacle heights (DOM) → free zones for text threading.
 * Images reserved FIRST; text flows only in remaining vertical space.
 */
export function applyMeasuredObstacles(columns, obstacleHeightsPx, columnHeightPx) {
  return columns.map((col, colIdx) => {
    const measured = obstacleHeightsPx[colIdx] || {}
    let cursor = 0
    const blockedZones = []

    if (col.highlights && measured.highlights > 0) {
      blockedZones.push({ type: 'highlights', top: 0, height: measured.highlights })
      cursor += measured.highlights
    }

    const imageHeights = measured.images || []
    imageHeights.forEach((h, i) => {
      if (h > 0) {
        blockedZones.push({ type: 'image', top: cursor, height: h, imageIndex: i })
        cursor += h
      }
    })

    const freeZones = []
    if (cursor < columnHeightPx) {
      freeZones.push({ top: cursor, height: columnHeightPx - cursor })
    }

    return {
      ...col,
      blockedZones,
      freeZones,
      usedBlockedPx: cursor,
      imageReservedPx: imageHeights.reduce((s, h) => s + (h || 0), 0),
    }
  })
}
