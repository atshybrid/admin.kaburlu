import {
  EPAPER_AUTOMATION_SPEC,
  automationSpecToPageMeta,
  getHeaderSlotPx,
  headerDimLabel,
  inToCm,
  presetKey,
} from './epaperPageSpec'

export { getHeaderSlotPx as getHeaderNaturalPx, headerDimLabel }

/** @deprecated use EPAPER_AUTOMATION_SPEC via epaperPageSpec */
export const EPAPER_HEADER_IN = {
  BROADSHEET: {
    main: { widthIn: EPAPER_AUTOMATION_SPEC.BROADSHEET.widthIn, heightIn: EPAPER_AUTOMATION_SPEC.BROADSHEET.mainHeaderIn },
    sub: { widthIn: EPAPER_AUTOMATION_SPEC.BROADSHEET.widthIn, heightIn: EPAPER_AUTOMATION_SPEC.BROADSHEET.subHeaderIn },
  },
  TABLOID: {
    main: { widthIn: EPAPER_AUTOMATION_SPEC.TABLOID.widthIn, heightIn: EPAPER_AUTOMATION_SPEC.TABLOID.mainHeaderIn },
    sub: { widthIn: EPAPER_AUTOMATION_SPEC.TABLOID.widthIn, heightIn: EPAPER_AUTOMATION_SPEC.TABLOID.subHeaderIn },
  },
}

export function getEpaperHeaderDimensions(preset = 'BROADSHEET') {
  const key = presetKey(preset)
  const spec = EPAPER_AUTOMATION_SPEC[key]
  return {
    preset: key,
    mainWidthCm: inToCm(spec.widthIn),
    mainHeightCm: inToCm(spec.mainHeaderIn),
    subWidthCm: inToCm(spec.widthIn),
    subHeightCm: inToCm(spec.subHeaderIn),
    mainLabel: headerDimLabel(preset, 'main'),
    subLabel: headerDimLabel(preset, 'sub'),
  }
}

/** Resolve header slot height — API capabilities override automation defaults. */
export function resolvePageHeaderHeightCm({
  preset = 'BROADSHEET',
  pageIndex = 0,
  design = null,
} = {}) {
  const isMain = pageIndex === 0
  const cap = isMain ? design?.styleCapabilities?.mainHeader : design?.styleCapabilities?.subHeader
  const capDim = cap?.dimensions?.[presetKey(preset) === 'TABLOID' ? 'tabloid' : 'broadsheet']
  if (capDim?.heightIn) return inToCm(capDim.heightIn)

  const key = presetKey(preset)
  const spec = EPAPER_AUTOMATION_SPEC[key]
  return inToCm(isMain ? spec.mainHeaderIn : spec.subHeaderIn)
}

export function getPageHeaderHeightCm(preset, pageIndex) {
  return resolvePageHeaderHeightCm({ preset, pageIndex })
}

export { automationSpecToPageMeta }
