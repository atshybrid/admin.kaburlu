/**
 * BLOCK-06A / BLOCK-08A column photo frame.
 * Fixed column width → height from aspect, capped at max — no cover crop.
 */

/**
 * @param {object} opts
 * @param {number} opts.naturalWidth
 * @param {number} opts.naturalHeight
 * @param {number} opts.columnWidthPx
 * @param {number} opts.maxHeightPx
 * @param {number} [opts.minHeightPx]
 */
export function resolveEditorialColumnImageFrame({
  naturalWidth = 1,
  naturalHeight = 1,
  columnWidthPx = 0,
  maxHeightPx = 192,
  minHeightPx = 72,
} = {}) {
  const w = Math.max(72, Math.round(columnWidthPx || 0))
  const nw = Math.max(1, naturalWidth)
  const nh = Math.max(1, naturalHeight)
  const idealHeightPx = Math.round(w * (nh / nw))
  const maxH = Math.max(minHeightPx, Math.round(maxHeightPx || 0))
  const displayHeightPx = Math.max(minHeightPx, Math.min(maxH, idealHeightPx))

  return {
    columnWidthPx: w,
    idealHeightPx,
    maxHeightPx: maxH,
    displayHeightPx,
    /** True when natural height at full width is above max (CSS max-height scales down — still no crop). */
    exceedsMax: idealHeightPx > maxH,
    naturalFit: true,
  }
}
