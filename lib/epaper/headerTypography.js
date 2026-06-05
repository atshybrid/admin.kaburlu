/**
 * Header font / spacing derived from automation canvas heights (epaperPageSpec).
 * Reference design: broadsheet main 3in, tabloid main 2in, sub 1in — scaled to current spec.
 */
import { EPAPER_AUTOMATION_SPEC, presetKey } from './epaperPageSpec'

const REF_HEIGHT_IN = {
  BROADSHEET: { main: 3, sub: 1 },
  TABLOID: { main: 2.5, sub: 0.7 },
  DIGITAL_PAPER: { main: 3, sub: 1 },
  BERLINER: { main: 3, sub: 1 },
}

function heightRatio(pt, kind) {
  const key = presetKey(pt)
  const spec = EPAPER_AUTOMATION_SPEC[key] || EPAPER_AUTOMATION_SPEC.BROADSHEET
  const ref = REF_HEIGHT_IN[key] || REF_HEIGHT_IN.BROADSHEET
  const h = kind === 'sub' ? spec.subHeaderIn : spec.mainHeaderIn
  return h / ref[kind]
}

/** Main masthead typography & layout (style 1 side ads, info bar, title sizes). */
export function mainHeaderMetrics(pt) {
  const key = presetKey(pt)
  const spec = EPAPER_AUTOMATION_SPEC[key] || EPAPER_AUTOMATION_SPEC.BROADSHEET
  const ratio = heightRatio(pt, 'main')
  return {
    heightIn: spec.mainHeaderIn,
    ratio,
    sideWidthPct: pt === 'tabloid' ? '14%' : '18%',
    sidePad: pt === 'tabloid' ? 0 : Math.max(1, Math.round(2 * ratio)),
    infoBarFont: Math.max(9, Math.round(11 * ratio)),
    infoBarPadY: Math.max(2, Math.round(4 * ratio)),
    infoBarPadX: Math.max(8, Math.round(12 * ratio)),
    metaFont: Math.max(9, Math.round(11 * ratio)),
    logoMaxHeightPct: `${Math.round(88 * ratio)}%`,
  }
}

/** Scale a main-header title font (reference sizes at old 3in / 2in mastheads). */
export function mainTitleFont(pt, broadsheetPx, tabloidPx) {
  const ratio = heightRatio(pt, 'main')
  const base = pt === 'broadsheet' ? broadsheetPx : tabloidPx
  return Math.max(20, Math.round(base * ratio))
}

/** Sub / running header typography (1 in broadsheet · 0.60 in tabloid). */
export function subHeaderMetrics(pt) {
  const key = presetKey(pt)
  const spec = EPAPER_AUTOMATION_SPEC[key] || EPAPER_AUTOMATION_SPEC.BROADSHEET
  const ratio = heightRatio(pt, 'sub')
  return {
    heightIn: spec.subHeaderIn,
    ratio,
    bigFont: Math.max(10, Math.round(22 * ratio)),
    smFont: Math.max(8, Math.round(14 * ratio)),
    padX: Math.max(8, Math.round(16 * ratio)),
    gap: Math.max(4, Math.round(12 * ratio)),
    logoMaxWidthPct: key === 'TABLOID' ? '34%' : '38%',
    logoMaxHeightPct: `${Math.round(72 * ratio)}%`,
    rulePx: 1,
  }
}

export function subFontSizes(pt) {
  const m = subHeaderMetrics(pt)
  return { big: m.bigFont, sm: m.smFont }
}
