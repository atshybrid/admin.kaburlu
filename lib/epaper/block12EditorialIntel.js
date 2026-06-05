/**
 * BLOCK-12A — 4-column image slots (max 6).
 *
 * Col1: highlights + text (no image)
 * Col2: image1 top (08A primary) + image2 below
 * Col3: image3 top + text
 * Col4: image4 top + image5 + image6 stacked + text
 */

import { LAYOUT_FAMILIES } from './block08VisualAnalysis'
import { computeHeadlineImpact } from './block08EditorialIntel'

export const BLOCK_12A_MAX_IMAGES = 6

/** Fixed slot order for up to 6 photos. */
export function chooseBlock12GridPlacement(images = []) {
  const list = images.filter((img) => img?.src || img?.url).slice(0, BLOCK_12A_MAX_IMAGES)
  if (!list.length) return []

  if (list.length === 1) {
    return [
      { columnIndex: 1, image: list[0], role: 'primary', size: 'primary' },
    ]
  }

  if (list.length === 2) {
    return [
      { columnIndex: 1, image: list[0], role: 'primary', size: 'primary' },
      { columnIndex: 2, image: list[1], role: 'secondary', size: 'compact-safe' },
    ]
  }

  if (list.length === 3) {
    return [
      { columnIndex: 1, image: list[0], role: 'primary', size: 'primary' },
      { columnIndex: 1, image: list[1], role: 'secondary', size: 'compact-safe' },
      { columnIndex: 2, image: list[2], role: 'secondary', size: 'compact-safe' },
    ]
  }

  const slots = []
  const plan = [
    { columnIndex: 1, role: 'primary', size: 'primary' },
    { columnIndex: 1, role: 'secondary', size: 'compact-safe' },
    { columnIndex: 2, role: 'secondary', size: 'compact-safe' },
    { columnIndex: 3, role: 'secondary', size: 'compact-safe' },
    { columnIndex: 3, role: 'stack', size: 'compact-safe' },
    { columnIndex: 3, role: 'stack', size: 'compact-safe' },
  ]
  list.forEach((image, i) => {
    const p = plan[i]
    if (!p) return
    slots.push({ ...p, image })
  })
  return slots
}

export function chooseBlock12EditorialPlacement(visuals = {}, images = []) {
  return chooseBlock12GridPlacement(images)
}

export function buildBlock12Composition(visuals, images = [], hasHighlights = false, article = {}) {
  const layoutFamily = visuals.layoutFamily || LAYOUT_FAMILIES.TEXTHEAVY
  const placements = chooseBlock12EditorialPlacement(visuals, images)
  const headlineImpact = computeHeadlineImpact(visuals, article)
  const typography = {
    forceMultiLine: headlineImpact.forceMultiLine || visuals.titleCharLen > 24,
    titleMaxPx: headlineImpact.titleMaxPx ?? 58,
    titleMinPx: headlineImpact.titleMinPx ?? 35,
    imageMaxWidthPct: 100,
    ...headlineImpact,
  }

  return {
    layoutFamily,
    placements,
    typography,
    headlineImpact,
    showHighlightsInLead: hasHighlights,
    bodyColumnCount: 4,
    leadGridClass: '',
  }
}

export { computeHeadlineImpact }
