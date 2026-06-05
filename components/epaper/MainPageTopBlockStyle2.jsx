import React from 'react'
import styles from './MainPageTopBlock.module.css'
import { buildTitleEffectStyle } from '../../lib/epaper/mainPageTopBlockRules'
import { studioLayerChrome } from '../../lib/epaper/mainPageTopBlockTransform'
import Style2ArticleBody from './Style2HJArticleBody'
import { BLOCK_TOP8X7_DIMENSIONS } from '../../lib/epaper/mainPageTopBlockRules'

function layerClass(base, studioMode) {
  if (!studioMode) return base
  return `${base} ${styles.layerSelectable}`
}

/**
 * Style 2 — reference front page (8×7in):
 * Black H1 → red H2 (stroke) → green band → points | single-col article
 * Right: photo (top) + yellow lead box (below photo)
 */
export default function MainPageTopBlockStyle2({
  studioMode,
  onSelectLayer,
  layout,
  layers,
  metrics,
  blockNativeWidthPx = BLOCK_TOP8X7_DIMENSIONS.nativeWidthPx,
  topHeadlineText,
  titleImportantText,
  subtitleText,
  points,
  articleText = '',
  heroSrc,
  heroImgFilter,
  heroTransformVars,
  calloutTitle,
  calloutLines,
  jumpPage,
  images,
  pointsLayerStyle,
}) {
  const select = (layerId) => (e) => {
    if (!studioMode) return
    e.stopPropagation()
    onSelectLayer?.(layerId)
  }

  const photoPct = Math.round((layout.contentPhotoShare ?? 0.34) * 100)
  const hasArticle = Boolean(String(articleText || '').trim())

  return (
    <div
      className={styles.style2Shell}
      style={{
        '--style2-photo-w': `${photoPct}%`,
        '--style2-photo-share': `${layout.style2PhotoRowShare ?? 62}%`,
      }}
    >
      <div className={styles.style2LeftRail}>
        <div
          className={layerClass(styles.style2TitleBand, studioMode)}
          data-layer="heroTextCol"
          onClick={select('heroTextCol')}
        >
          {topHeadlineText ? (
            <h1
              className={`${layerClass(styles.style2H1Black, studioMode)} ${styles.heroTextItem}`}
              data-layer="dateline"
              onClick={select('dateline')}
              style={{
                fontFamily:
                  layers.dateline?.style?.fontFamily ||
                  layers.titleKicker?.style?.fontFamily,
                fontSize: `${layers.dateline?.style?.fontSizePx ?? 17}px`,
                fontWeight: layers.dateline?.style?.fontWeight ?? 700,
                color: layers.dateline?.style?.color ?? '#111',
                lineHeight: layers.dateline?.style?.lineHeight ?? 1.22,
                zIndex: layers.dateline?.zIndex ?? 5,
                ...studioLayerChrome(layers.dateline),
              }}
            >
              {topHeadlineText}
            </h1>
          ) : null}

          {titleImportantText ? (
            <h2
              className={`${layerClass(styles.titleMain, studioMode)} ${styles.style2H2Red}`}
              data-layer="titleMain"
              onClick={select('titleMain')}
              style={{
                ...buildTitleEffectStyle({
                  ...layers.titleMain?.style,
                  fontSizePx: metrics.titleMainPx,
                  strokeWidthPx: layers.titleMain?.style?.strokeWidthPx ?? 5,
                  strokeColor: layers.titleMain?.style?.strokeColor ?? '#ffffff',
                  shadow: layers.titleMain?.style?.shadow ?? '3px 4px 0 rgba(0, 0, 0, 0.28)',
                }),
                zIndex: layers.titleMain?.zIndex ?? 8,
                ...studioLayerChrome(layers.titleMain),
              }}
            >
              {titleImportantText}
            </h2>
          ) : null}

          {subtitleText ? (
            <div
              className={layerClass(styles.subtitleBar, studioMode)}
              data-layer="subtitleBar"
              onClick={select('subtitleBar')}
              style={{
                zIndex: layers.subtitleBar?.zIndex ?? 7,
                ...studioLayerChrome(layers.subtitleBar),
              }}
            >
              <span
                style={{
                  fontFamily:
                    layers.subtitleBar?.style?.fontFamily ||
                    layers.titleKicker?.style?.fontFamily,
                  fontSize: `${layers.subtitleBar?.style?.fontSizePx ?? 15}px`,
                  fontWeight: 700,
                  lineHeight: 1.35,
                  color: layout.subtitleBarTextColor || '#fff',
                }}
              >
                {subtitleText}
              </span>
            </div>
          ) : null}
        </div>

        <div className={styles.style2MainRow}>
          <div className={styles.style2PointsCol}>
            {points.length ? (
              <ul
                className={layerClass(styles.pointsList, studioMode)}
                data-layer="points"
                onClick={select('points')}
                style={{
                  fontFamily: pointsLayerStyle.fontFamily,
                  fontSize: `${metrics.pointsPx}px`,
                  color: pointsLayerStyle.color || '#111',
                  lineHeight: pointsLayerStyle.lineHeight || 1.38,
                  fontWeight: pointsLayerStyle.fontWeight || 700,
                  zIndex: layers.points?.zIndex ?? 20,
                  ...studioLayerChrome(layers.points),
                }}
              >
                {points.map((pt, i) => (
                  <li key={i} className={styles.pointsLine}>
                    {pt}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {hasArticle ? (
            <div
              className={layerClass(styles.style2ArticleCol, studioMode)}
              data-layer="bodyLeft"
              onClick={select('bodyLeft')}
              style={{
                width: '100%',
                maxWidth: 'none',
                ...studioLayerChrome(layers.bodyLeft, { position: 'relative' }),
              }}
            >
              <Style2ArticleBody
                articleText={articleText}
                fontSizePx={Math.max(11, Math.min(14, metrics.bodyPx ?? 12.5))}
                lineHeight={layers.bodyLeft?.style?.lineHeight || 1.48}
                fontFamily={layers.bodyLeft?.style?.fontFamily || "'Mandali', sans-serif"}
                style={{ color: layers.bodyLeft?.style?.color }}
              />
            </div>
          ) : (
            <div className={styles.style2ArticleCol} aria-hidden />
          )}
        </div>
      </div>

      <div className={styles.style2PhotoRail}>
        {heroSrc ? (
          <div
            className={layerClass(styles.style2PhotoWrap, studioMode)}
            data-layer="heroImage"
            onClick={select('heroImage')}
            style={{
              ...heroTransformVars,
              zIndex: layers.heroImage?.zIndex ?? 12,
              ...studioLayerChrome(layers.heroImage, { position: 'relative' }),
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroSrc} alt={images?.[0]?.alt || ''} style={heroImgFilter} />
          </div>
        ) : null}

        {calloutTitle || calloutLines.length ? (
          <aside
            className={layerClass(styles.calloutBox, studioMode)}
            data-layer="callout"
            onClick={select('callout')}
            style={{
              zIndex: layers.callout?.zIndex ?? 24,
              ...studioLayerChrome(layers.callout, { position: 'relative' }),
            }}
          >
            {calloutTitle ? (
              <strong
                className={styles.calloutTitle}
                style={{
                  fontFamily: layers.callout?.style?.fontFamily,
                  fontSize: `${layers.callout?.style?.fontSizePx ?? 19}px`,
                  color: layout.calloutTextColor || '#111',
                }}
              >
                {calloutTitle}
              </strong>
            ) : null}
            {calloutLines.length ? (
              <ul className={styles.calloutList}>
                {calloutLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            ) : null}
            {jumpPage ? (
              <span
                className={layerClass(styles.calloutJumpBadge, studioMode)}
                data-layer="continued"
                onClick={select('continued')}
                title={`Continued on page ${jumpPage}`}
              >
                {jumpPage}
              </span>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  )
}
