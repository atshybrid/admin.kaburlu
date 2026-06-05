/**
 * BLOCK-08A — zone composition + image placement (editorial families).
 */

import { LAYOUT_FAMILIES } from './block08VisualAnalysis'
import {
  chooseEditorialImagePlacement,
  computeHeadlineImpact,
} from './block08EditorialIntel'

/** @typedef {'primary'|'secondary'|'banner'|'side'} ImageSlotRole */

/**
 * @param {string} layoutFamily
 * @param {object[]} images
 * @returns {{ role: ImageSlotRole, column: number, span: number, size: string }[]}
 */
export function chooseImagePlacement(layoutFamily, images = []) {
  const list = images.filter((img) => img?.src || img?.url)
  if (!list.length) return []

  const primary = list[0]
  const secondary = list[1]

  switch (layoutFamily) {
    case LAYOUT_FAMILIES.WIDE:
      return [
        { image: primary, role: 'banner', column: 3, span: 1, size: 'banner' },
        ...(secondary
          ? [{ image: secondary, role: 'secondary', column: 2, span: 1, size: 'compact' }]
          : []),
      ]

    case LAYOUT_FAMILIES.PORTRAIT:
      return [
        { image: primary, role: 'primary', column: 3, span: 1, size: 'portrait-dominant' },
        ...(secondary
          ? [{ image: secondary, role: 'secondary', column: 2, span: 1, size: 'compact' }]
          : []),
      ]

    case LAYOUT_FAMILIES.SQUARE:
      return [
        { image: primary, role: 'primary', column: 3, span: 1, size: 'square-balanced' },
        ...(secondary
          ? [{ image: secondary, role: 'secondary', column: 2, span: 1, size: 'compact' }]
          : []),
      ]

    case LAYOUT_FAMILIES.SIDEIMAGE:
      return [
        { image: primary, role: 'side', column: 3, span: 1, size: 'side-compact' },
        ...(secondary
          ? [{ image: secondary, role: 'secondary', column: 3, span: 1, size: 'side-compact' }]
          : []),
      ]

    case LAYOUT_FAMILIES.TEXTHEAVY:
    default:
      return [
        { image: primary, role: 'primary', column: 3, span: 1, size: 'primary' },
        ...(secondary
          ? [{ image: secondary, role: 'secondary', column: 2, span: 1, size: 'compact' }]
          : []),
      ]
  }
}

/**
 * Typography hints from visual balance heuristics.
 */
export function composeTypographyHints(visuals = {}) {
  const { layoutFamily, headlineWeight, bodyDensity, visualWeight, imageSubject } = visuals
  const titleLen = Number(visuals.titleCharLen) || 0
  const hints = {
    forceMultiLine: titleLen > 24,
    titleMaxPx: 58,
    titleMinPx: 35,
    imageMaxWidthPct: 100,
  }

  if (titleLen > 24) hints.forceMultiLine = true

  if (headlineWeight === 'light' || visuals.titleCharLen > 40) {
    hints.forceMultiLine = true
    hints.titleMaxPx = 52
  }

  if (layoutFamily === LAYOUT_FAMILIES.WIDE) {
    hints.titleMaxPx = Math.min(hints.titleMaxPx, 54)
  }

  if (layoutFamily === LAYOUT_FAMILIES.SIDEIMAGE || imageSubject === 'sensitive') {
    hints.titleMaxPx = 56
    hints.imageMaxWidthPct = 88
  }

  if (bodyDensity === 'heavy' && visualWeight === 'text-heavy') {
    hints.imageMaxWidthPct = 72
    hints.titleMaxPx = 50
  }

  if (headlineWeight === 'heavy' && layoutFamily === LAYOUT_FAMILIES.TEXTHEAVY) {
    hints.titleMaxPx = 58
  }

  return hints
}

/**
 * @param {object} visuals — from analyzeBlock08Visuals
 * @param {object[]} images
 * @param {boolean} hasHighlights
 */
export function buildBlock08Composition(visuals, images = [], hasHighlights = false, article = {}) {
  const layoutFamily = visuals.layoutFamily || LAYOUT_FAMILIES.TEXTHEAVY
  const placements = chooseEditorialImagePlacement(visuals, images)
  const headlineImpact = computeHeadlineImpact(visuals, article)
  const typography = {
    ...composeTypographyHints({
      ...visuals,
      titleCharLen: visuals.titleCharLen || 0,
    }),
    ...headlineImpact,
    forceMultiLine: headlineImpact.forceMultiLine || visuals.titleCharLen > 24,
  }

  return {
    layoutFamily,
    placements,
    typography,
    headlineImpact,
    showHighlightsInLead: hasHighlights,
    bodyColumnCount: 3,
    leadGridClass: layoutFamilyToLeadClass(layoutFamily),
  }
}

function layoutFamilyToLeadClass(layoutFamily) {
  switch (layoutFamily) {
    case LAYOUT_FAMILIES.PORTRAIT:
      return 'leadPortrait'
    case LAYOUT_FAMILIES.SQUARE:
      return 'leadSquare'
    case LAYOUT_FAMILIES.WIDE:
      return 'leadWide'
    case LAYOUT_FAMILIES.SIDEIMAGE:
      return 'leadSide'
    default:
      return 'leadTextHeavy'
  }
}
