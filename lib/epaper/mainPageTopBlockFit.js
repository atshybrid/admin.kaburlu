/**
 * BLOCK-TOP8x7 — reference proportions: ~54% hero, ~46% body fills 7in rail.
 */

import { BLOCK_TOP8X7_DIMENSIONS, isTop8x7Style2 } from './mainPageTopBlockRules'
import { top8x7HeroInnerWidthPx } from './mainPageTopBodyColumns'

const HERO_SHARE = 0.54
const PAD_V = 8
const GAP = 4

function estimateLines(text, charsPerLine) {
  const t = String(text || '').trim()
  if (!t) return 0
  return Math.max(1, Math.ceil(t.length / Math.max(10, charsPerLine)))
}

function balanceTwoColumns(items) {
  if (!items.length) return { left: '', right: '' }
  if (items.length === 1) {
    const words = items[0].split(/\s+/)
    const mid = Math.ceil(words.length / 2)
    return {
      left: words.slice(0, mid).join(' '),
      right: words.slice(mid).join(' '),
    }
  }

  const totalChars = items.reduce((n, t) => n + t.length, 0)
  const target = totalChars / 2
  let acc = 0
  let splitAt = 1
  for (let i = 0; i < items.length; i++) {
    acc += items[i].length
    if (acc >= target) {
      splitAt = Math.min(items.length, Math.max(1, i + 1))
      break
    }
  }
  return {
    left: items.slice(0, splitAt).join('\n\n'),
    right: items.slice(splitAt).join('\n\n'),
  }
}

export function computeMainPageTopFit({
  nativeH = BLOCK_TOP8X7_DIMENSIONS.nativeHeightPx,
  nativeW = BLOCK_TOP8X7_DIMENSIONS.nativeWidthPx,
  titleKicker = '',
  titleMain = '',
  pointsCount = 0,
  leadLen = 0,
  bodyLeft = '',
  bodyRight = '',
  hasQuote = false,
  hasHeroImage = false,
} = {}) {
  const innerH = nativeH - PAD_V * 2
  const heroZoneHpx = Math.floor(innerH * HERO_SHARE)
  const bodyZoneHpx = innerH - heroZoneHpx - GAP

  const titleChars = String(titleKicker).length + String(titleMain).length
  let kickerPx = 24
  let mainPx = 56
  if (titleChars > 40) mainPx = 48
  if (titleChars > 60) mainPx = 42
  if (titleChars > 85) mainPx = 36

  const kickerLines = estimateLines(titleKicker, 20)
  const mainLines = estimateLines(titleMain, 11)
  const titleH =
    kickerLines * kickerPx * 1.12 + mainLines * mainPx * 1.06 + 6

  let pointsPx = 13
  let pointsH = 0
  if (pointsCount > 0) {
    pointsH = 6 + pointsCount * (pointsPx * 1.38 + 5)
    if (pointsCount > 6) pointsPx = 12
  } else if (leadLen > 0) {
    pointsH = Math.min(heroZoneHpx * 0.35, estimateLines('x'.repeat(leadLen), 40) * 13 * 1.45)
  }

  const heroImageWpx = Math.floor(nativeW * 0.48)
  const heroImageHpx = hasHeroImage
    ? Math.max(heroZoneHpx - 8, Math.min(heroZoneHpx, Math.max(titleH, titleH + pointsH) + 40))
    : 0

  const colCharsPerLine = Math.floor((nativeW - 56) / 2 / 5.2)
  const leftLines = estimateLines(bodyLeft, colCharsPerLine)
  const rightLines = estimateLines(bodyRight, colCharsPerLine)
  const totalLines = leftLines + rightLines

  let bodyPx = 18
  const lineRatio = 1.48
  if (totalLines > 0 && bodyZoneHpx > 80) {
    const ideal = (bodyZoneHpx - 28) / (totalLines * lineRatio)
    bodyPx = Math.min(18, Math.max(10, Math.round(ideal * 10) / 10))
  }
  if (String(bodyLeft).length + String(bodyRight).length > 2200) {
    bodyPx = Math.min(bodyPx, 14)
  }

  let quotePx = Math.min(18.5, bodyPx + 0.5)

  return {
    padV: PAD_V,
    gap: GAP,
    heroZoneHpx,
    bodyZoneHpx,
    heroShare: HERO_SHARE,
    titleKickerPx: kickerPx,
    titleMainPx: mainPx,
    pointsPx,
    leadPx: 12.5,
    bodyPx,
    quotePx,
    continuedPx: Math.max(8.5, bodyPx - 1.5),
    heroImageHpx,
    heroImageWpx,
    titleMaxWidthPx: top8x7HeroInnerWidthPx(nativeW, 12),
  }
}

/** Studio / saved template overrides auto-fit metrics for live WYSIWYG. */
export function resolveMainPageTopMetrics({
  fit,
  template,
  studioMode = false,
  nativeH = BLOCK_TOP8X7_DIMENSIONS.nativeHeightPx,
  nativeW = BLOCK_TOP8X7_DIMENSIONS.nativeWidthPx,
}) {
  const layout = template?.layout || {}
  const layers = template?.layers || {}

  const padV = layout.padV ?? fit.padV
  const gap = layout.bodyGap ?? fit.gap
  const innerH = nativeH - padV * 2

  const heroShare = layout.heroShare != null ? layout.heroShare : fit.heroShare
  const heroZoneHpx =
    layout.heroShare != null ? Math.floor(innerH * heroShare) : fit.heroZoneHpx
  const bodyZoneHpx = innerH - heroZoneHpx - gap

  const px = (layerId, fitKey) => {
    const tpl = layers[layerId]?.style?.fontSizePx
    if (tpl != null) return tpl
    return fit[fitKey]
  }

  const padH = layout.padH ?? fit.padH ?? 12
  const heroInnerW = top8x7HeroInnerWidthPx(nativeW, padH)
  const titleFromPct =
    layout.titleMaxWidthPct != null
      ? Math.floor((nativeW * layout.titleMaxWidthPct) / 100)
      : null
  const rawTitleW =
    layout.titleMaxWidthPx ?? titleFromPct ?? fit.titleMaxWidthPx ?? heroInnerW
  const titleMaxWidthPx = Math.min(
    heroInnerW,
    rawTitleW <= 320 ? heroInnerW : rawTitleW
  )

  const heroImageWpx =
    layout.heroImageWidthPct != null
      ? Math.floor((nativeW * layout.heroImageWidthPct) / 100)
      : fit.heroImageWpx

  const heroImageHpx = Math.floor(
    (heroZoneHpx * (layout.heroImageHeightPct ?? 100)) / 100
  )

  let bodyPx = px('bodyLeft', 'bodyPx')
  const quotePx = px('bodyRight', 'quotePx')
  if (isTop8x7Style2(template)) {
    bodyPx = Math.max(11, Math.min(14, bodyPx ?? 12.5))
  }

  return {
    ...fit,
    padV,
    gap,
    heroShare,
    heroZoneHpx,
    bodyZoneHpx,
    titleKickerPx: px('titleKicker', 'titleKickerPx'),
    titleMainPx: px('titleMain', 'titleMainPx'),
    pointsPx: px('points', 'pointsPx'),
    leadPx: px('lead', 'leadPx'),
    bodyPx,
    quotePx,
    continuedPx: px('continued', 'continuedPx'),
    titleMaxWidthPx,
    heroImageWpx,
    heroImageHpx,
    heroImageObjectFit: layout.heroImageObjectFit || 'contain',
    columnGapPx: layout.bodyColumnGap ?? 20,
    columnRuleColor: layout.columnRuleColor ?? '#c4a574',
    quoteBadgeColor: layout.quoteBadgeColor ?? '#e85d04',
    padH: layout.padH ?? 12,
  }
}

export { balanceTwoColumns }
