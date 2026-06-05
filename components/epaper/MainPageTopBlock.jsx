import React, { forwardRef, useEffect, useMemo, useState } from 'react'
import styles from './MainPageTopBlock.module.css'
import {
  BLOCK_TOP8X7_CODE,
  BLOCK_TOP8X7_DIMENSIONS,
  DEFAULT_MAIN_PAGE_TOP_TEMPLATE,
  buildTitleEffectStyle,
  isTop8x7Style2,
} from '../../lib/epaper/mainPageTopBlockRules'
import { resolveTopBlockBody } from '../../lib/epaper/mainPageTopBlockContent'
import {
  computeMainPageTopFit,
  resolveMainPageTopMetrics,
} from '../../lib/epaper/mainPageTopBlockFit'
import { studioLayerChrome } from '../../lib/epaper/mainPageTopBlockTransform'
import {
  buildHeroImageFilterStyle,
  buildHeroTransformVars,
} from '../../lib/epaper/mainPageTopHeroLayout'
import { mergeRightColumnText } from '../../lib/epaper/mainPageTopBodyColumns'
import MainPageTopBlockStyle2 from './MainPageTopBlockStyle2'
import {
  mergeStyle2ArticleBody,
  resolveStyle2Subtitle,
  resolveStyle2TitleImportant,
} from '../../lib/epaper/mainPageTopStyle2Text'
import {
  buildSubjectWrapProfile,
  computeContainedPaintRect,
  computeHeroImageBoxRect,
  estimatePointsStartY,
  wrapPointsAroundHero,
} from '../../lib/epaper/pointsWrapAroundHero'

function layerClass(base, studioMode) {
  if (!studioMode) return base
  return `${base} ${styles.layerSelectable}`
}

/**
 * BLOCK-TOP8x7 — 8×7in main page top (reference layout).
 */
const MainPageTopBlock = forwardRef(function MainPageTopBlock(
  {
    blockCode = BLOCK_TOP8X7_CODE,
    title = '',
    subtitle = '',
    titleKicker: titleKickerProp = '',
    titleImportant: titleImportantProp = '',
    dateline = '',
    calloutTitle = '',
    calloutText = '',
    highlights = [],
    images = [],
    paragraphs = [],
    bodyArticleText,
    bodyLeftText,
    bodyRightText,
    bodyQuoteText,
    quoteText = '',
    quoteAttribution = '',
    continuedPage = '2',
    designTemplate = null,
    studioMode = false,
    onSelectLayer,
    activeTool = 'select',
  },
  ref
) {
  const template = designTemplate || DEFAULT_MAIN_PAGE_TOP_TEMPLATE
  const layers = template.layers || DEFAULT_MAIN_PAGE_TOP_TEMPLATE.layers
  const layout = template.layout || DEFAULT_MAIN_PAGE_TOP_TEMPLATE.layout
  const isStyle2 = isTop8x7Style2(template)

  const titleKicker = titleKickerProp || (isStyle2 ? '' : subtitle) || ''
  const titleMain = title || ''
  const datelineText = String(dateline || '').trim()
  const topHeadlineText = datelineText
  const titleImportantText = isStyle2
    ? resolveStyle2TitleImportant(title, titleImportantProp)
    : titleMain
  const subtitleText = isStyle2
    ? resolveStyle2Subtitle(subtitle, titleKicker)
    : titleKicker
  const calloutLines = String(calloutText || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  const points = useMemo(
    () =>
      highlights
        .map((h) => (typeof h === 'string' ? h : h?.text || h?.content || '').trim())
        .filter(Boolean),
    [highlights]
  )

  const heroSrc = images?.[0]?.src || images?.[0]?.url || ''
  const showPoints = points.length > 0

  const leadText = useMemo(() => {
    if (showPoints) return ''
    const first = paragraphs
      .map((p) => String(p?.content ?? p ?? '').trim())
      .find(Boolean)
    return first || ''
  }, [showPoints, paragraphs])

  const body = useMemo(
    () =>
      resolveTopBlockBody({
        bodyArticleText,
        bodyLeftText,
        bodyRightText,
        bodyQuoteText,
        paragraphs,
        quoteText,
        skipFirstParagraph: !showPoints && !!leadText,
      }),
    [
      bodyArticleText,
      bodyLeftText,
      bodyRightText,
      bodyQuoteText,
      paragraphs,
      quoteText,
      showPoints,
      leadText,
    ]
  )

  const rightColumnText = useMemo(
    () => mergeRightColumnText(body.right, body.quote),
    [body.right, body.quote]
  )

  const style2ArticleText = useMemo(() => {
    const fromEditor = String(bodyLeftText ?? bodyArticleText ?? '').trim()
    if (fromEditor) return mergeStyle2ArticleBody(fromEditor, '')
    return mergeStyle2ArticleBody(body.left, rightColumnText)
  }, [bodyLeftText, bodyArticleText, body.left, rightColumnText])

  const fitBase = useMemo(
    () =>
      computeMainPageTopFit({
        titleKicker: isStyle2 ? subtitleText : titleKicker,
        titleMain: isStyle2 ? titleImportantText : titleMain,
        pointsCount: points.length,
        leadLen: leadText.length,
        bodyLeft: isStyle2 ? style2ArticleText : body.left,
        bodyRight: isStyle2 ? '' : rightColumnText,
        hasQuote: false,
        hasHeroImage: !!heroSrc,
      }),
    [
      isStyle2,
      titleKicker,
      subtitleText,
      titleMain,
      titleImportantText,
      points.length,
      leadText,
      style2ArticleText,
      body.left,
      rightColumnText,
      heroSrc,
    ]
  )

  const metrics = useMemo(
    () =>
      resolveMainPageTopMetrics({
        fit: fitBase,
        template,
        studioMode,
      }),
    [fitBase, template, studioMode]
  )

  const jumpPage = String(continuedPage || '').trim()

  const heroImgFilter = useMemo(() => buildHeroImageFilterStyle(layout), [layout])
  const heroTransformVars = useMemo(() => buildHeroTransformVars(layout), [layout])

  const heroZoneInnerW =
    BLOCK_TOP8X7_DIMENSIONS.nativeWidthPx - (metrics.padH ?? 12) * 2

  const [subjectProfile, setSubjectProfile] = useState(null)

  useEffect(() => {
    if (isStyle2 || !heroSrc || !showPoints) {
      setSubjectProfile(null)
      return undefined
    }

    let cancelled = false
    const box = computeHeroImageBoxRect(heroZoneInnerW, metrics, layout)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = async () => {
      if (cancelled) return
      const naturalW = img.naturalWidth || 0
      const naturalH = img.naturalHeight || 0
      const paintRect = computeContainedPaintRect(
        box,
        naturalW,
        naturalH,
        layout.heroImageObjectFit || 'contain',
        layout.heroImageObjectPosition || 'bottom right'
      )
      const profile = await buildSubjectWrapProfile(heroSrc, paintRect, {
        alphaThreshold: layout.heroImageAlphaThreshold ?? 32,
        flipH: !!layout.heroImageFlipH,
        flipV: !!layout.heroImageFlipV,
        sampleW: Math.min(320, Math.ceil(paintRect.width)),
        sampleH: Math.min(400, Math.ceil(paintRect.height)),
      })
      if (!cancelled) {
        setSubjectProfile(
          profile
            ? { ...profile, naturalW, naturalH }
            : { naturalW, naturalH, subjectLeftAt: null }
        )
      }
    }
    img.onerror = () => {
      if (!cancelled) setSubjectProfile(null)
    }
    img.src = heroSrc

    return () => {
      cancelled = true
      img.onload = null
      img.onerror = null
    }
  }, [
    heroSrc,
    showPoints,
    heroZoneInnerW,
    metrics.heroImageWpx,
    metrics.heroImageHpx,
    layout.heroImageObjectFit,
    layout.heroImageObjectPosition,
    layout.heroImageRightPx,
    layout.heroImageTopPx,
    layout.heroImageFlipH,
    layout.heroImageFlipV,
    layout.heroImageAlphaThreshold,
    layout.heroTextGapPx,
  ])

  const pointsStartY = useMemo(
    () =>
      estimatePointsStartY(titleKicker, titleMain, metrics, {
        dateline: datelineText,
        style2: isStyle2,
      }),
    [titleKicker, titleMain, metrics, datelineText, isStyle2]
  )

  const wrappedPoints = useMemo(() => {
    if (isStyle2 || !showPoints || !heroSrc) return points
    return wrapPointsAroundHero(
      points,
      heroZoneInnerW,
      metrics,
      layout,
      subjectProfile,
      pointsStartY
    )
  }, [
    showPoints,
    heroSrc,
    points,
    heroZoneInnerW,
    metrics,
    layout,
    subjectProfile,
    pointsStartY,
  ])

  const select = (layerId) => (e) => {
    if (!studioMode) return
    e.stopPropagation()
    onSelectLayer?.(layerId)
  }

  const blockStyle = {
    '--pad-v': `${metrics.padV}px`,
    '--pad-h': `${metrics.padH}px`,
    '--gap': `${metrics.gap}px`,
    '--hero-h': `${metrics.heroZoneHpx}px`,
    '--title-max-w': `${metrics.titleMaxWidthPx}px`,
    '--hero-img-w': `${metrics.heroImageWpx}px`,
    '--hero-img-h': `${metrics.heroImageHpx}px`,
    '--hero-img-fit': metrics.heroImageObjectFit || 'contain',
    '--col-gap': `${metrics.columnGapPx}px`,
    '--col-rule': metrics.columnRuleColor,
    '--quote-badge': metrics.quoteBadgeColor,
    '--hero-img-right': `${layout.heroImageRightPx ?? 0}px`,
    '--hero-img-top': `${layout.heroImageTopPx ?? 0}px`,
    '--quote-mark-x': `${layout.quoteMarkOffsetX ?? 0}px`,
    '--quote-mark-y': `${layout.quoteMarkOffsetY ?? 0}px`,
    '--hero-img-z': layers.heroImage?.zIndex ?? 16,
    '--subtitle-bar-bg': layout.subtitleBarColor || '#1a9e3f',
    '--subtitle-bar-fg': layout.subtitleBarTextColor || '#fff',
    '--callout-bg': layout.calloutBoxColor || '#f7ea00',
    '--callout-fg': layout.calloutTextColor || '#111',
    '--callout-w': `${layout.calloutWidthPct ?? 36}%`,
    '--callout-h': `${layout.calloutHeightPct ?? 40}%`,
    '--callout-right': `${layout.calloutRightPx ?? 4}px`,
    '--callout-bottom': `${layout.calloutBottomPx ?? 8}px`,
    ...heroTransformVars,
  }

  const titleBandWidth = (layerId) => {
    const innerW = metrics.titleMaxWidthPx
    const layerW = layers[layerId]?.width
    return Math.min(innerW, layerW || innerW)
  }

  const titleRailStyle = (layerId) => ({
    width: '100%',
    maxWidth: `${titleBandWidth(layerId)}px`,
    boxSizing: 'border-box',
    padding: '4px 8px 0 4px',
    position: 'relative',
    zIndex: layers[layerId]?.zIndex ?? (layerId === 'titleMain' ? 8 : 6),
  })

  const pointsLayerStyle = layers.points?.style || {}
  const leadLayerStyle = layers.lead?.style || {}

  if (blockCode && blockCode !== BLOCK_TOP8X7_CODE) return null

  if (isStyle2) {
    return (
      <article
        ref={ref}
        className={`${styles.block} ${styles.style2} ${studioMode ? styles.studioMode : ''}`}
        data-style-variant="style2"
        style={blockStyle}
        data-block-code={BLOCK_TOP8X7_CODE}
        data-native-w={BLOCK_TOP8X7_DIMENSIONS.nativeWidthPx}
        data-native-h={BLOCK_TOP8X7_DIMENSIONS.nativeHeightPx}
        data-studio-mode={studioMode ? '1' : undefined}
        lang="te"
        onClick={studioMode ? () => onSelectLayer?.('') : undefined}
      >
        <MainPageTopBlockStyle2
          studioMode={studioMode}
          onSelectLayer={onSelectLayer}
          layout={layout}
          layers={layers}
          metrics={metrics}
          topHeadlineText={topHeadlineText}
          titleImportantText={titleImportantText}
          subtitleText={subtitleText}
          points={points}
          articleText={style2ArticleText}
          heroSrc={heroSrc}
          heroImgFilter={heroImgFilter}
          heroTransformVars={heroTransformVars}
          calloutTitle={calloutTitle}
          calloutLines={calloutLines}
          jumpPage={jumpPage}
          images={images}
          pointsLayerStyle={pointsLayerStyle}
          blockNativeWidthPx={BLOCK_TOP8X7_DIMENSIONS.nativeWidthPx}
        />
      </article>
    )
  }

  return (
    <article
      ref={ref}
      className={`${styles.block} ${isStyle2 ? styles.style2 : ''} ${studioMode ? styles.studioMode : ''}`}
      data-style-variant={isStyle2 ? 'style2' : 'style1'}
      style={blockStyle}
      data-block-code={BLOCK_TOP8X7_CODE}
      data-native-w={BLOCK_TOP8X7_DIMENSIONS.nativeWidthPx}
      data-native-h={BLOCK_TOP8X7_DIMENSIONS.nativeHeightPx}
      data-studio-mode={studioMode ? '1' : undefined}
      lang="te"
      onClick={studioMode ? () => onSelectLayer?.('') : undefined}
    >
      <section
        className={layerClass(styles.heroZone, studioMode)}
        data-layer="heroZone"
        onClick={select('heroZone')}
      >
        <div className={styles.heroBackdrop} aria-hidden />

        <>
          {titleKicker ? (
              <h2
                className={`${layerClass(styles.titleKicker, studioMode)} ${styles.heroTextItem}`}
                data-layer="titleKicker"
                onClick={select('titleKicker')}
                style={{
                  ...titleRailStyle('titleKicker'),
                  ...buildTitleEffectStyle({
                    ...layers.titleKicker?.style,
                    fontSizePx: metrics.titleKickerPx,
                  }),
                  ...studioLayerChrome(layers.titleKicker),
                }}
              >
                {titleKicker}
              </h2>
            ) : null}

            {titleMain ? (
              <h1
                className={`${layerClass(styles.titleMain, studioMode)} ${styles.heroTextItem}`}
                data-layer="titleMain"
                onClick={select('titleMain')}
                style={{
                  ...titleRailStyle('titleMain'),
                  ...buildTitleEffectStyle({
                    ...layers.titleMain?.style,
                    fontSizePx: metrics.titleMainPx,
                  }),
                  ...studioLayerChrome(layers.titleMain),
                }}
              >
                {titleMain}
              </h1>
            ) : null}

            {showPoints ? (
              <ul
                className={`${layerClass(styles.pointsList, studioMode)} ${styles.heroTextItem}`}
                data-layer="points"
                onClick={select('points')}
                style={{
                  fontFamily: pointsLayerStyle.fontFamily,
                  fontSize: `${metrics.pointsPx}px`,
                  color: pointsLayerStyle.color,
                  lineHeight: pointsLayerStyle.lineHeight || 1.38,
                  fontWeight: pointsLayerStyle.fontWeight,
                  zIndex: layers.points?.zIndex ?? 22,
                  ...studioLayerChrome(layers.points),
                }}
              >
                {wrappedPoints.map((pt, i) => (
                  <li key={i} className={styles.pointsLine}>
                    {pt}
                  </li>
                ))}
              </ul>
            ) : leadText ? (
              <p
                className={`${layerClass(styles.lead, studioMode)} ${styles.heroTextItem}`}
                data-layer="lead"
                onClick={select('lead')}
                style={{
                  ...titleRailStyle('titleKicker'),
                  fontFamily: leadLayerStyle.fontFamily,
                  fontSize: `${metrics.leadPx}px`,
                  lineHeight: leadLayerStyle.lineHeight || 1.45,
                  color: leadLayerStyle.color,
                  fontWeight: leadLayerStyle.fontWeight,
                  ...studioLayerChrome(layers.lead),
                }}
              >
                {leadText}
              </p>
            ) : null}

            {heroSrc ? (
              <div
                className={layerClass(styles.heroImage, studioMode)}
                data-layer="heroImage"
                onClick={select('heroImage')}
                style={{
                  ...studioLayerChrome(layers.heroImage, { position: 'absolute' }),
                  ...heroTransformVars,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroSrc}
                  alt={images[0]?.alt || ''}
                  style={heroImgFilter}
                />
              </div>
            ) : null}
        </>
      </section>

      <section
        className={layerClass(styles.bodyZone, studioMode)}
        data-layer="bodyZone"
        onClick={select('bodyZone')}
      >
        <div className={styles.bodyGrid}>
          <div className={styles.bodyGridSlot}>
            <div
              className={layerClass(styles.bodyCol, studioMode)}
              data-layer="bodyLeft"
              onClick={select('bodyLeft')}
              style={{
                fontFamily: layers.bodyLeft?.style?.fontFamily,
                fontSize: `${metrics.bodyPx}px`,
                lineHeight: layers.bodyLeft?.style?.lineHeight || 1.48,
                color: layers.bodyLeft?.style?.color,
                textAlign: layers.bodyLeft?.style?.textAlign || 'justify',
                ...studioLayerChrome(layers.bodyLeft, { position: 'relative' }),
              }}
            >
              {body.left}
            </div>
          </div>

          <div
            className={`${styles.bodyGridSlot} ${styles.bodyGridSlotRight} ${
              jumpPage ? styles.bodyGridSlotWithJump : ''
            }`}
          >
            <div
              className={layerClass(styles.bodyCol, studioMode)}
              data-layer="bodyRight"
              onClick={select('bodyRight')}
              style={{
                fontFamily: layers.bodyRight?.style?.fontFamily,
                fontSize: `${metrics.bodyPx}px`,
                lineHeight: layers.bodyRight?.style?.lineHeight || 1.48,
                color: layers.bodyRight?.style?.color,
                textAlign: layers.bodyRight?.style?.textAlign || 'justify',
                ...studioLayerChrome(layers.bodyRight, { position: 'relative' }),
              }}
            >
              {rightColumnText}
              {quoteAttribution && body.quote ? (
                <span className={styles.attribution}>{quoteAttribution}</span>
              ) : null}
            </div>
            {jumpPage && !isStyle2 ? (
              <span
                className={layerClass(styles.jumpPageBadge, studioMode)}
                data-layer="continued"
                onClick={select('continued')}
                title={`Continued on page ${jumpPage}`}
                style={{
                  fontFamily: layers.continued?.style?.fontFamily,
                  fontSize: `${metrics.continuedPx ?? 13}px`,
                  background:
                    layers.continued?.style?.backgroundColor ||
                    layers.quoteMark?.style?.backgroundColor ||
                    '#1a5fb4',
                  color: layers.continued?.style?.color || '#fff',
                  fontWeight: layers.continued?.style?.fontWeight || 800,
                  ...studioLayerChrome(layers.continued, { position: 'absolute' }),
                }}
              >
                {jumpPage}
              </span>
            ) : null}
          </div>
        </div>
      </section>
    </article>
  )
})

export default MainPageTopBlock
