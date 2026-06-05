/**
 * BLOCK-06A — zone composition (same engine as 08A, 2 columns).
 */

import { LAYOUT_FAMILIES } from './block08VisualAnalysis'
import { composeTypographyHints } from './block08Composition'
import {
  chooseBlock06EditorialPlacement,
  computeHeadlineImpact,
} from './block06EditorialIntel'

export function buildBlock06Composition(visuals, images = [], hasHighlights = false, article = {}) {
  const layoutFamily = visuals.layoutFamily || LAYOUT_FAMILIES.TEXTHEAVY
  const placements = chooseBlock06EditorialPlacement(visuals, images)
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
    bodyColumnCount: 2,
    leadGridClass: '',
  }
}
