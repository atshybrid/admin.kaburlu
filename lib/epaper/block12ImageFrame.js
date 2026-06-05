import { BLOCK_12A_IMAGE } from './wideBlockRules'
import { resolveEditorialColumnImageFrame } from './editorialColumnImageFrame'

export function block12ImageMaxHeightPx(role = 'primary') {
  if (role === 'stack' || role === 'compact' || role === 'secondary') {
    return BLOCK_12A_IMAGE.stackMaxHeightPx
  }
  return BLOCK_12A_IMAGE.primaryMaxHeightPx
}

export function computeBlock12ImageFrameHeight({
  naturalWidth = 1,
  naturalHeight = 1,
  columnWidthPx = 0,
  role = 'primary',
} = {}) {
  const { displayHeightPx } = resolveEditorialColumnImageFrame({
    naturalWidth,
    naturalHeight,
    columnWidthPx,
    maxHeightPx: block12ImageMaxHeightPx(role),
    minHeightPx: BLOCK_12A_IMAGE.minHeightPx,
  })
  return displayHeightPx
}
