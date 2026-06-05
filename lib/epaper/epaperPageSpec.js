/**
 * India newspaper automation canvas — single source of truth (inches).
 * Broadsheet 15×22.75 · Tabloid 11×17 · 8-col / 5-col grid.
 */
export const IN_TO_CM = 2.54
export const HEADER_PREVIEW_DPI = 96

/** Target raster DPI for PDF export (300 = sharp zoom on broadsheet trim). */
export const PDF_EXPORT_DPI = 300

/** Screen scale (px per cm) so canvas width ≈ page widthIn × exportDpi. */
export function pdfExportCanvasScale(pageMeta, dpi = PDF_EXPORT_DPI) {
  if (!pageMeta?.widthCm) return null
  return (pageMeta.widthIn * dpi) / pageMeta.widthCm
}

export function pdfExportPixelSize(pageMeta, dpi = PDF_EXPORT_DPI) {
  const widthIn = Number(pageMeta?.widthIn)
  const heightIn = Number(pageMeta?.heightIn)
  if (Number.isFinite(widthIn) && Number.isFinite(heightIn)) {
    return {
      width: Math.round(widthIn * dpi),
      height: Math.round(heightIn * dpi),
    }
  }
  return {
    width: Math.round(Number(pageMeta?.widthCm || 0) / IN_TO_CM * dpi),
    height: Math.round(Number(pageMeta?.heightCm || 0) / IN_TO_CM * dpi),
  }
}

/** Physical trim size + export DPI for pdf-lib (exact newspaper page). */
export function resolveExportPageSpec(preset, pageMeta, dpi = PDF_EXPORT_DPI) {
  const key = presetKey(preset || pageMeta?.label)
  const auto = EPAPER_AUTOMATION_SPEC[key]
  const widthIn = Number(pageMeta?.widthIn) || auto.widthIn
  const heightIn = Number(pageMeta?.heightIn) || auto.heightIn
  return {
    widthIn,
    heightIn,
    exportDpi: dpi,
    label: pageMeta?.label || auto.label,
    pixelSize: {
      width: Math.round(widthIn * dpi),
      height: Math.round(heightIn * dpi),
    },
  }
}

/**
 * Fallback specs when API unavailable — aligned with GET /epaper/paper-page-specs.
 * @see docs/EPAPER_DESIGN_INTEGRATION.md
 */
export const EPAPER_AUTOMATION_SPEC = {
  DIGITAL_PAPER: {
    label: 'Digital Paper',
    widthIn: 13,
    heightIn: 18,
    marginIn: 0.5,
    footerOffsetIn: 0.5,
    mainHeaderIn: 3,
    subHeaderIn: 1,
    printWidthIn: 12,
    printHeightIn: 17,
    columns: 12,
    gutterIn: 0.18,
  },
  TABLOID: {
    label: 'Tabloid',
    widthIn: 11,
    heightIn: 17,
    marginIn: 0.25,
    footerOffsetIn: 0.5,
    mainHeaderIn: 2.5,
    subHeaderIn: 0.7,
    printWidthIn: 10.5,
    printHeightIn: 16.5,
    columns: 12,
    gutterIn: 0.15,
  },
  BROADSHEET: {
    label: 'Broadsheet',
    widthIn: 15,
    heightIn: 22.75,
    marginIn: 0.5,
    footerOffsetIn: 0.5,
    mainHeaderIn: 3,
    subHeaderIn: 1,
    printWidthIn: 14,
    printHeightIn: 21.75,
    columns: 12,
    gutterIn: 0.18,
  },
  BERLINER: {
    label: 'Berliner',
    widthIn: 12.4,
    heightIn: 18.5,
    marginIn: 0.5,
    footerOffsetIn: 0.5,
    mainHeaderIn: 3,
    subHeaderIn: 1,
    printWidthIn: 11.4,
    printHeightIn: 17.5,
    columns: 12,
    gutterIn: 0.18,
  },
}

export function presetKey(paperTypeOrPreset) {
  const s = String(paperTypeOrPreset || '').toUpperCase().replace(/\s+/g, '_')
  if (s.includes('DIGITAL')) return 'DIGITAL_PAPER'
  if (s.includes('TAB')) return 'TABLOID'
  if (s.includes('BERLIN')) return 'BERLINER'
  if (s.includes('MAGAZ')) return 'MAGAZINE'
  if (s.includes('BROAD')) return 'BROADSHEET'
  return EPAPER_AUTOMATION_SPEC[s] ? s : 'BROADSHEET'
}

export function inToCm(inches) {
  return Math.round(Number(inches) * IN_TO_CM * 100) / 100
}

/** Print / article rail width (inches). Prefer API printWidthIn when set. */
export function contentWidthIn(spec) {
  if (Number.isFinite(spec.printWidthIn) && spec.printWidthIn > 0) return spec.printWidthIn
  if (Number.isFinite(spec.contentWidthIn) && spec.contentWidthIn > 0) return spec.contentWidthIn
  return spec.widthIn - 2 * spec.marginIn
}

/** Page meta for design canvas (cm fields for legacy scale math). */
export function automationSpecToPageMeta(keyOrPreset) {
  const key = presetKey(keyOrPreset)
  const spec = EPAPER_AUTOMATION_SPEC[key]
  const m = inToCm(spec.marginIn)
  const contentWIn = contentWidthIn(spec)
  return {
    label: spec.label,
    widthIn: spec.widthIn,
    heightIn: spec.heightIn,
    contentWidthIn: contentWIn,
    widthCm: inToCm(spec.widthIn),
    heightCm: inToCm(spec.heightIn),
    contentWidthCm: inToCm(contentWIn),
    bleedMm: 3,
    marginsCm: { top: m, bottom: m, left: m, right: m },
    marginIn: spec.marginIn,
    columns: spec.columns,
    gutterCm: inToCm(spec.gutterIn),
    gutterIn: spec.gutterIn,
    headerHeightCm: inToCm(spec.mainHeaderIn),
    subHeaderHeightCm: inToCm(spec.subHeaderIn),
    mainHeaderIn: spec.mainHeaderIn,
    subHeaderIn: spec.subHeaderIn,
    footerOffsetIn: spec.footerOffsetIn,
    footerOffsetCm: inToCm(spec.footerOffsetIn),
    footerHeightCm: inToCm(spec.footerOffsetIn),
    topInfoStripCm: 0,
    mastheadFontPt: key === 'BROADSHEET' ? '150–200' : '130–160',
  }
}

/** Header slot natural px @ 96dpi — content width (12 in broadsheet) × header height. */
export function getHeaderSlotPx(preset, kind = 'main') {
  const key = presetKey(preset)
  const spec = EPAPER_AUTOMATION_SPEC[key]
  const heightIn = kind === 'sub' ? spec.subHeaderIn : spec.mainHeaderIn
  const widthIn = contentWidthIn(spec)
  return {
    width: Math.round(widthIn * HEADER_PREVIEW_DPI),
    height: Math.round(heightIn * HEADER_PREVIEW_DPI),
  }
}

export function headerDimLabel(preset, kind = 'main') {
  const key = presetKey(preset)
  const spec = EPAPER_AUTOMATION_SPEC[key]
  const h = kind === 'sub' ? spec.subHeaderIn : spec.mainHeaderIn
  const w = contentWidthIn(spec)
  return `${w}×${h} in`
}
