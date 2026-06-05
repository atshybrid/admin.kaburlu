/**
 * BLOCK-06A photo frame — same rules as 08A, 6in column caps.
 */
import { BLOCK_06A_IMAGE } from './wideBlockRules'
import { resolveEditorialColumnImageFrame } from './editorialColumnImageFrame'

export function block06ImageMaxHeightPx(role = 'primary') {
  return role === 'secondary' || role === 'compact'
    ? BLOCK_06A_IMAGE.secondaryMaxHeightPx
    : BLOCK_06A_IMAGE.primaryMaxHeightPx
}

export function computeBlock06ImageFrameHeight({
  naturalWidth = 1,
  naturalHeight = 1,
  columnWidthPx = 0,
  role = 'primary',
} = {}) {
  const { displayHeightPx } = resolveEditorialColumnImageFrame({
    naturalWidth,
    naturalHeight,
    columnWidthPx,
    maxHeightPx: block06ImageMaxHeightPx(role),
    minHeightPx: BLOCK_06A_IMAGE.minHeightPx,
  })
  return displayHeightPx
}
