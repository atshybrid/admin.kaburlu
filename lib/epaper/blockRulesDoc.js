/**
 * Human-readable layout rules for the Block style workbench (mirrors code in
 * lib/rules/articleRules.ts and design.js suggestBlock / assignFourEightBlock).
 */

import { buildBlock04StyleRulesDoc } from './block04LockedRules'
import { buildBlock08StyleRulesDoc } from './wideBlockRules'

export const BLOCK_03A_BAND = { min: 35, max: 119 }

export const DECIDE_ARTICLE_BLOCK_RULES = [
  { condition: 'priority is lead or breaking', block: 'BLOCK-12A' },
  { condition: 'word count > 350', block: 'BLOCK-09A' },
  { condition: '≥ 220 words (or 2+ images)', block: 'BLOCK-08A / BLOCK-09A' },
  { condition: '> 199 words OR > 3400 chars (over BLOCK-04A)', block: 'BLOCK-06A or BLOCK-08A (best fit)' },
  { condition: '120–199 words, ≤ 3400 chars', block: 'BLOCK-04A' },
  { condition: `35–119 words (BLOCK-03A “ideal” band, ~4″ height cap)`, block: 'BLOCK-03A' },
  { condition: 'otherwise (very short)', block: 'BLOCK-02A' },
]

export const DESIGN_SUGGEST_TIERS = [
  { tier: 'Lead / breaking', result: 'Wide: BLOCK-12A with image, else BLOCK-08A / BLOCK-09A by length' },
  { tier: 'Small (< 80 words)', result: 'No image: < 35 → BLOCK-02A, else BLOCK-03A. One image & < 50 words → BLOCK-03A; else BLOCK-04A' },
  { tier: 'Medium (120–199w, ≤3400c)', result: 'BLOCK-04A' },
  { tier: 'Over 04A (>199w or >3400c)', result: 'BLOCK-06A (6in·2col) or BLOCK-08A (8in·3col) by chars/images' },
  { tier: 'Large (220–399 words)', result: 'BLOCK-08A (3 col) / BLOCK-09A' },
  { tier: 'XL (400+ words)', result: 'BLOCK-12A or BLOCK-09A' },
]

export const FOUR_EIGHT_LEFT_RAIL = [
  { condition: '< 35 words, ≤ 1 image', block: 'BLOCK-02A' },
  { condition: '35–119 words, ≤ 1 image', block: 'BLOCK-03A' },
  { condition: 'else in < 130 words, ≤ 1 image', block: 'BLOCK-04A' },
]

export { buildBlock04StyleRulesDoc as buildBlock04AStyleRules } from './block04LockedRules'
export const BLOCK_04A_STYLE_RULES = buildBlock04StyleRulesDoc()
export const BLOCK_08A_STYLE_RULES = buildBlock08StyleRulesDoc()
