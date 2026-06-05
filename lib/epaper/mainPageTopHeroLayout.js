/** Hero PNG visual filters + flip via CSS variables (transform on frame, not img). */

export function buildHeroImageFilterStyle(layout = {}) {
  const opacity = (layout.heroImageOpacity ?? 100) / 100
  const brightness = layout.heroImageBrightness ?? 100
  const contrast = layout.heroImageContrast ?? 100
  const saturate = layout.heroImageSaturate ?? 100

  const filterParts = []
  if (brightness !== 100) filterParts.push(`brightness(${brightness}%)`)
  if (contrast !== 100) filterParts.push(`contrast(${contrast}%)`)
  if (saturate !== 100) filterParts.push(`saturate(${saturate}%)`)

  return {
    objectPosition: layout.heroImageObjectPosition || 'bottom right',
    opacity: opacity < 1 ? opacity : undefined,
    filter: filterParts.length ? filterParts.join(' ') : undefined,
  }
}

export function buildHeroTransformVars(layout = {}) {
  return {
    '--hero-flip-x': layout.heroImageFlipH ? -1 : 1,
    '--hero-flip-y': layout.heroImageFlipV ? -1 : 1,
    '--hero-rot': `${Number(layout.heroImageRotationDeg) || 0}deg`,
  }
}

/** @deprecated use buildHeroImageFilterStyle */
export function buildHeroImageVisualStyle(layout = {}) {
  return buildHeroImageFilterStyle(layout)
}
