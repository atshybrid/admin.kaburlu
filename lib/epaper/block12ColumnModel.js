import { estimateHeadlinePanelPx } from './wideColumnBalance'
import { chooseBlock12GridPlacement, BLOCK_12A_MAX_IMAGES } from './block12EditorialIntel'

export function planBlock12LayoutZones(headlineCount = 0, imageCount = 0) {
  const n = Math.min(imageCount, BLOCK_12A_MAX_IMAGES)
  return {
    col1: { highlights: headlineCount > 0, image: false, textFromTop: headlineCount === 0 },
    col2: {
      highlights: false,
      image: n >= 1,
      image2Below: n >= 3,
      textFromTop: false,
    },
    col3: {
      highlights: false,
      image: n === 2 || n >= 3,
      textFromTop: n < 2,
    },
    col4: {
      highlights: false,
      image: n >= 4,
      stackBelow: n >= 5,
      textFromTop: n < 4,
    },
    flowOrder: 'col1 → col2 (below imgs) → col3 → col4',
    bottomRule: 'even bottoms on all 4 columns',
  }
}

export function buildBlock12ColumnModels({
  images = [],
  headlineCount = 0,
  columnCount = 4,
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

  const list = (images || []).filter((img) => img?.src || img?.url)
  chooseBlock12GridPlacement(list).forEach((slot) => {
    const col = columns[slot.columnIndex]
    if (!col) return
    col.images.push({ ...slot, image: slot.image })
  })

  if (list.length >= 1 && columns[1].images.length === 0) {
    columns[1].images.push({
      columnIndex: 1,
      image: list[0],
      role: 'primary',
      size: 'primary',
    })
  }
  if (list.length >= 2 && columns[2].images.length === 0) {
    columns[2].images.push({
      columnIndex: 2,
      image: list[1],
      role: 'secondary',
      size: 'compact-safe',
    })
  }

  return columns
}

export { applyMeasuredObstacles } from './block08ColumnModel'
