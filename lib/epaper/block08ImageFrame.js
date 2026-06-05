/**
 * BLOCK-08A photo frame — height from image aspect, capped at max (no letterbox bars).
 */
import { BLOCK_08A_IMAGE } from './wideBlockRules'
import { resolveEditorialColumnImageFrame } from './editorialColumnImageFrame'

export function block08ImageMaxHeightPx(role = 'primary') {
  return role === 'secondary' || role === 'compact'
    ? BLOCK_08A_IMAGE.secondaryMaxHeightPx
    : BLOCK_08A_IMAGE.primaryMaxHeightPx
}

/**
 * Display height for obstacle / partition (full width × aspect, min–max cap).
 */
export function computeBlock08ImageFrameHeight({
  naturalWidth = 1,
  naturalHeight = 1,
  columnWidthPx = 0,
  role = 'primary',
} = {}) {
  const { displayHeightPx } = resolveEditorialColumnImageFrame({
    naturalWidth,
    naturalHeight,
    columnWidthPx,
    maxHeightPx: block08ImageMaxHeightPx(role),
    minHeightPx: BLOCK_08A_IMAGE.minHeightPx,
  })
  return displayHeightPx
}
