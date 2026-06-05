import { HEADER_SPECS } from './constants.js'

const MM_PER_IN = 25.4
const PX_PER_IN = 96

export function slotSize(preset, kind) {
  const spec = HEADER_SPECS[preset] || HEADER_SPECS.broadsheet
  const wIn = spec.contentWidthIn
  const hIn = kind === 'main' ? spec.mainHeightIn : spec.subHeightIn
  return {
    preset,
    pageWidthIn: spec.pageWidthIn,
    marginIn: spec.marginIn,
    widthIn: wIn,
    widthMm: wIn * MM_PER_IN,
    heightIn: hIn,
    heightPx: Math.round(hIn * PX_PER_IN),
    widthPx: Math.round(wIn * PX_PER_IN),
  }
}

/** Inline style — width 100% of page column; height fixed in inches */
export function slotInlineStyle(preset, kind) {
  const slot = slotSize(preset, kind)
  return `width:100%;height:${slot.heightIn}in;max-height:${slot.heightIn}in`
}

export function subMetrics(preset) {
  const isBroad = preset === 'broadsheet'
  return {
    bigFont: isBroad ? 20 : 13,
    smFont: isBroad ? 11 : 8,
    padX: isBroad ? 14 : 8,
    gap: isBroad ? 12 : 6,
    rulePx: isBroad ? 2 : 1,
    logoMaxHeight: isBroad ? '78%' : '72%',
    logoMaxWidth: isBroad ? '44%' : '50%',
  }
}

export function mainMetrics(preset) {
  const isBroad = preset === 'broadsheet'
  return {
    sideWidthPct: '18%',
    centerWidthPct: '64%',
    infoBarFont: isBroad ? 11 : 9,
    infoBarPad: isBroad ? '5px 14px' : '3px 10px',
  }
}
