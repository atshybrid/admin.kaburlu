/**
 * BLOCK-08A editorial intelligence — placement, density, headline hierarchy.
 */

import { LAYOUT_FAMILIES } from './block08VisualAnalysis'

const LINE_HEIGHT_PX = 16.5

/**
 * BLOCK-08A grid slots (fixed industry layout):
 * col1 — headline panel (separate flag)
 * col2 — primary image top
 * col3 — secondary image top (if any)
 */
export function chooseBlock08GridPlacement(images = []) {
  const list = images.filter((img) => img?.src)
  const slots = []
  if (list[0]) {
    slots.push({ columnIndex: 1, image: list[0], role: 'primary', size: 'primary' })
  }
  if (list[1]) {
    slots.push({ columnIndex: 2, image: list[1], role: 'secondary', size: 'compact-safe' })
  }
  return slots
}

/** @returns {{ columnIndex: number, image: object, role: string, size: string }[]} */
export function chooseEditorialImagePlacement(visuals = {}, images = []) {
  const list = images.filter((img) => img?.src)
  if (!list.length) return []

  const primary = list[0]
  const secondary = list[1]
  const { layoutFamily, imageShape, imageSubject } = visuals

  if (layoutFamily === LAYOUT_FAMILIES.WIDE || imageShape === 'landscape') {
    return [
      { columnIndex: 1, image: primary, role: 'banner', size: 'banner' },
      ...(secondary
        ? [{ columnIndex: 2, image: secondary, role: 'secondary', size: 'compact-safe' }]
        : []),
    ]
  }

  if (imageSubject === 'crime' || imageSubject === 'sensitive') {
    return [
      { columnIndex: 2, image: primary, role: 'side', size: 'compact-safe' },
      ...(secondary
        ? [{ columnIndex: 2, image: secondary, role: 'side', size: 'compact-safe' }]
        : []),
    ]
  }

  if (
    imageSubject === 'symbolic' ||
    imageSubject === 'logo' ||
    imageSubject === 'infographic' ||
    imageShape === 'square'
  ) {
    return [
      { columnIndex: 2, image: primary, role: 'primary', size: 'square-balanced' },
      ...(secondary
        ? [{ columnIndex: 1, image: secondary, role: 'secondary', size: 'group-center' }]
        : []),
    ]
  }

  if (
    imageShape === 'portrait' ||
    imageSubject === 'emotional' ||
    imageSubject === 'politician'
  ) {
    return [
      { columnIndex: 1, image: primary, role: 'primary', size: 'portrait-tight' },
      ...(secondary
        ? [{ columnIndex: 2, image: secondary, role: 'secondary', size: 'compact-safe' }]
        : []),
    ]
  }

  if (imageSubject === 'event' || imageSubject === 'crowd') {
    return [
      { columnIndex: 1, image: primary, role: 'primary', size: 'group-center' },
      ...(secondary
        ? [{ columnIndex: 2, image: secondary, role: 'secondary', size: 'group-center' }]
        : []),
    ]
  }

  return [
    { columnIndex: 2, image: primary, role: 'primary', size: 'primary' },
    ...(secondary
      ? [{ columnIndex: 1, image: secondary, role: 'secondary', size: 'compact-safe' }]
      : []),
  ]
}

/**
 * Headline impact by story type — not length alone.
 */
export function computeHeadlineImpact(visuals = {}, article = {}) {
  const title = String(article.title || '')
  const titleLen = title.length
  const { imageSubject, bodyDensity, hasImage, imageShape } = visuals

  let titleMaxPx = 58
  let titleMinPx = 35
  let forceMultiLine = titleLen > 24

  const weatherLike =
    /weather|rain|heat|wave|forecast|temperature|వాతావరణ|వర్ష|అతి వేడ|ఎండ/i.test(
      `${title} ${article.category || ''}`
    )

  if (weatherLike || imageSubject === 'infrastructure') {
    titleMaxPx = 46
    forceMultiLine = titleLen > 18
  } else if (imageSubject === 'emotional') {
    titleMaxPx = 54
  } else if (imageSubject === 'politician') {
    titleMaxPx = 56
  } else if (imageSubject === 'crime' || imageSubject === 'sensitive') {
    titleMaxPx = 52
    forceMultiLine = true
  } else if (imageSubject === 'event' || imageSubject === 'crowd') {
    titleMaxPx = 50
  }

  if (bodyDensity === 'heavy' && hasImage) titleMaxPx = Math.max(titleMinPx, titleMaxPx - 4)
  if (!hasImage && bodyDensity === 'heavy') titleMaxPx = 54
  if (imageShape === 'landscape' && hasImage) titleMaxPx = Math.max(46, titleMaxPx - 3)

  return {
    titleMaxPx,
    titleMinPx,
    forceMultiLine,
    impact: titleMaxPx >= 55 ? 'high' : titleMaxPx >= 50 ? 'medium' : 'moderate',
  }
}

export function estimateParagraphLines(item, measureHeight, colIndex) {
  const h = measureHeight(item, colIndex)
  return Math.max(1, Math.round(h / LINE_HEIGHT_PX))
}

/**
 * Per-column visual density (text + image + whitespace feel).
 */
export function computeVisualDensity(
  col,
  bodyItems,
  measureHeight,
  obstacleHeightsByCol,
  columnHeightPx,
  colWidthPx
) {
  const colIdx = col.index
  const o = obstacleHeightsByCol[colIdx] || {}
  const highlightPx = o.highlights || 0
  const imagePx = (o.images || []).reduce((s, h) => s + (h || 0), 0)
  const obs = highlightPx + imagePx + (o.wideBannerPeer || 0)

  const textPx = col.textFragments.reduce(
    (sum, i) => sum + measureHeight(bodyItems[i], colIdx),
    0
  )
  const usedPx = obs + textPx
  const colArea = Math.max(1, columnHeightPx * colWidthPx)
  const textArea = textPx * colWidthPx
  const imageArea = imagePx * colWidthPx
  const whitespace = Math.max(0, columnHeightPx - usedPx)

  const lineCount = col.textFragments.reduce(
    (sum, i) => sum + estimateParagraphLines(bodyItems[i], measureHeight, colIdx),
    0
  )

  return {
    textDensity: textArea / colArea,
    imageDominance: imageArea / colArea,
    whitespaceRatio: (whitespace * colWidthPx) / colArea,
    lineCount,
    usedPx,
    score: textArea / colArea + imageArea / colArea * 0.85 - whitespace / columnHeightPx * 0.15,
  }
}

/**
 * Balance visual weight — fill visually empty columns (e.g. col3 with only image).
 */
export function balanceVisualDensityColumns(
  columns,
  bodyItems,
  measureHeight,
  obstacleHeightsPx,
  columnHeightPx,
  colWidths,
  { maxPasses = 8 } = {}
) {
  const result = columns.map((c) => ({
    ...c,
    textFragments: [...c.textFragments],
  }))

  const density = () =>
    result.map((col) =>
      computeVisualDensity(
        col,
        bodyItems,
        measureHeight,
        obstacleHeightsPx,
        columnHeightPx,
        colWidths[col.index] || colWidths[0]
      )
    )

  for (let pass = 0; pass < maxPasses; pass++) {
    const d = density()
    const scores = d.map((x) => x.score)
    const minScore = Math.min(...scores)
    const maxScore = Math.max(...scores)
    if (maxScore - minScore < 0.06) break

    const minCol = scores.indexOf(minScore)
    const maxCol = scores.indexOf(maxScore)
    if (minCol === maxCol || !result[maxCol].textFragments.length) break

    const lastIdx = result[maxCol].textFragments[result[maxCol].textFragments.length - 1]
    const lines = estimateParagraphLines(bodyItems[lastIdx], measureHeight, minCol)

    if (lines < 2 && result[maxCol].textFragments.length === 1) break

    const minUsed = d[minCol].usedPx
    const moveH = measureHeight(bodyItems[lastIdx], minCol)
    if (minUsed + moveH > columnHeightPx + 12) break

    result[maxCol].textFragments.pop()
    result[minCol].textFragments.push(lastIdx)
  }

  return result
}
