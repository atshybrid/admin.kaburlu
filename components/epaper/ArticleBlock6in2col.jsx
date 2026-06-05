import React, { useMemo, useRef, useState, useLayoutEffect } from 'react'
import Block08Article from './Block08Article'
import Block06Article from './Block06Article'
import styles from './ArticleBlock6in2col.module.css'
import {
  resolveBlock04TitleColor,
  resolveBlock04SubtitleColor,
} from '../../lib/epaper/block04Color'
import {
  BLOCK_04A_CONTENT_WIDTH_PX,
  getBlock04ColumnPx,
  fallbackTitleMetrics,
} from '../../lib/epaper/block04TitleMetrics'
import {
  measureBlock04TitleLayoutWhenReady,
} from '../../lib/epaper/block04TitleMeasure'
import {
  fitTitleLinesToRail,
  ensureBlock04TitleFonts,
  maxSubtitleSizeThatFits,
  clampElementToRail,
} from '../../lib/epaper/block04TitleFit'
import { colonTitleLineHeightPx, colonTitleLine2TuckPx } from '../../lib/epaper/block04TitleSmart'
import {
  BLOCK_08A_DIMENSIONS,
  BLOCK_06A_DIMENSIONS,
} from '../../lib/epaper/wideBlockRules'

function renderBodyParagraphs(items, keyPrefix, { dateline = '', showDateline = false } = {}) {
  const nodes = []
  let datelineUsed = false
  items.forEach((item, idx) => {
    if (item?.type === 'heading') {
      nodes.push(
        <h3 key={`${keyPrefix}-h-${idx}`}>{String(item.content || '')}</h3>
      )
      return
    }
    const text = String(item?.content || item || '').trim()
    if (!text) return
    const showLine = showDateline && !datelineUsed && !!dateline
    if (showLine) datelineUsed = true
    nodes.push(
      <p key={`${keyPrefix}-p-${idx}`}>
        {showLine ? <span className={styles.dateline}>{dateline} </span> : null}
        {text}
      </p>
    )
  })
  return nodes
}

function normalizeImages(images, max = 4) {
  const list = []
  const seen = new Set()
  for (const raw of images || []) {
    if (!raw || list.length >= max) break
    const src = raw.src || raw.url || raw.imageUrl || ''
    if (!src || seen.has(src)) continue
    seen.add(src)
    list.push({ src, alt: raw.alt || '', caption: raw.caption || '' })
  }
  return list
}

/** BLOCK-06A / BLOCK-08A — threaded wide blocks (08A=3 col, 06A=2 col, same engine). */
export default function ArticleBlock6in2col(props) {
  if (props.blockCode === 'BLOCK-08A') {
    return <Block08Article {...props} showColumnDebug={props.showColumnDebug} />
  }
  if (props.blockCode === 'BLOCK-06A') {
    return <Block06Article {...props} showColumnDebug={props.showColumnDebug} />
  }
  return <ArticleBlock06 {...props} />
}

function ArticleBlock06({
  blockCode = 'BLOCK-06A',
  title,
  subtitle = '',
  category = 'general',
  dateline = '',
  highlights = [],
  images = [],
  paragraphs = [],
  titleColor = '',
  titleColorEnabled = false,
  imageObjectPosition = '',
}) {
  const blockClass = styles.block06

  const hasColonInTitle = /[:：]/.test(String(title || ''))
  const resolvedTitleColor = hasColonInTitle
    ? '#1a1a1a'
    : resolveBlock04TitleColor(titleColor, titleColorEnabled, title, category)
  const resolvedSubtitleColor = subtitle
    ? resolveBlock04SubtitleColor(subtitle, title)
    : undefined

  const leadImages = useMemo(() => normalizeImages(images), [images])
  const headlinePoints = useMemo(
    () =>
      highlights
        .map((item) => (typeof item === 'string' ? item : item?.text || item?.content || '').trim())
        .filter(Boolean),
    [highlights]
  )

  const flowStart = headlinePoints.length ? 0 : 1
  const bodyItems = useMemo(() => paragraphs.slice(flowStart), [paragraphs, flowStart])

  const hasSubtitle = !!String(subtitle || '').trim()
  const colorOpts = useMemo(
    () => ({
      titleColor: hasColonInTitle ? '' : titleColor,
      titleColorEnabled: hasColonInTitle ? false : titleColorEnabled,
      category,
      baseColor: resolvedTitleColor,
      hasSubtitle,
      wideBlockTitle: false,
    }),
    [titleColor, titleColorEnabled, category, resolvedTitleColor, hasSubtitle, hasColonInTitle]
  )

  const blockRef = useRef(null)
  const titleLineRefs = useRef([])
  const titleTextRefs = useRef([])
  const subtitleRef = useRef(null)
  const subtitleTextRef = useRef(null)
  const [subtitlePx, setSubtitlePx] = useState(null)
  const [titleMetrics, setTitleMetrics] = useState(() =>
    fallbackTitleMetrics(title, BLOCK_04A_CONTENT_WIDTH_PX, colorOpts)
  )
  const [fittedLineSizes, setFittedLineSizes] = useState(null)

  useLayoutEffect(() => {
    const el = blockRef.current
    if (!el) return undefined
    let cancelled = false
    const run = async () => {
      await ensureBlock04TitleFonts()
      if (cancelled) return
      const width = getBlock04ColumnPx(el)
      const metrics = await measureBlock04TitleLayoutWhenReady(title, width, colorOpts)
      if (!cancelled) setTitleMetrics(metrics)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [title, colorOpts, hasSubtitle, blockCode])

  useLayoutEffect(() => {
    const block = blockRef.current
    if (!block) return undefined
    let cancelled = false
    const run = async () => {
      await ensureBlock04TitleFonts()
      if (cancelled) return
      const lineCount = titleMetrics.renderedLines?.length || titleMetrics.titleLines?.length || 0
      const initial = (titleMetrics.lineSizes || [titleMetrics.fontSizePx]).slice(0, lineCount)
      const sizes = fitTitleLinesToRail(
        titleLineRefs.current,
        titleTextRefs.current,
        initial,
        26,
        { lockEqualSizes: hasSubtitle && lineCount >= 2 }
      )
      if (!cancelled && sizes.length) setFittedLineSizes(sizes)

      if (hasSubtitle && subtitle && subtitleRef.current && subtitleTextRef.current) {
        const rail = getBlock04ColumnPx(block)
        const titleBase =
          sizes[0] || titleMetrics.lineSizes?.[0] || titleMetrics.fontSizePx || 38
        let px = maxSubtitleSizeThatFits(subtitle, rail, titleBase)
        subtitleTextRef.current.style.fontSize = `${px}px`
        px = clampElementToRail(subtitleRef.current, subtitleTextRef.current, 14)
        if (!cancelled) setSubtitlePx(px)
      } else if (!cancelled) {
        setSubtitlePx(null)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [titleMetrics, title, subtitle, hasSubtitle, blockCode])

  const titleLinesForRender = useMemo(() => {
    if (titleMetrics.renderedLines?.length) return titleMetrics.renderedLines
    return (titleMetrics.titleLines || ['']).map((text) => ({
      text,
      fontSizePx: titleMetrics.fontSizePx,
      segments: [{ text, impact: false }],
    }))
  }, [titleMetrics])

  const line2TuckPx = useMemo(() => {
    const lines = titleMetrics.titleLines || []
    if (lines.length < 2) return 0
    const size0 = fittedLineSizes?.[0] ?? titleMetrics.lineSizes?.[0] ?? titleMetrics.fontSizePx
    return colonTitleLine2TuckPx(size0, lines[1])
  }, [titleMetrics, fittedLineSizes])

  const apiFocus = String(imageObjectPosition || '').trim()
  const showLeadRow = headlinePoints.length > 0 || leadImages.length > 0

  return (
    <div
      ref={blockRef}
      className={`${styles.articleBlock} ${blockClass}`}
      data-block-code={blockCode}
      style={{
        '--title-color': resolvedTitleColor,
        '--subtitle-color': resolvedSubtitleColor || 'inherit',
        '--title-line-gap': `${titleMetrics.lineGapPx ?? 0}px`,
        '--title-line-stack': `${titleMetrics.lineStackPx ?? 0}px`,
        '--title-line2-tuck': `${line2TuckPx}px`,
        '--body-col-count': BLOCK_06A_DIMENSIONS.columns,
      }}
    >
      <div className={styles.titleWrap}>
        <h1 className={styles.title}>
          {titleLinesForRender.map((line, i) => (
            <span
              key={i}
              ref={(node) => {
                titleLineRefs.current[i] = node
              }}
              className={line.highlight ? styles.titleLineHighlight : styles.titleLine}
            >
              <span
                ref={(node) => {
                  titleTextRefs.current[i] = node
                }}
                className={styles.titleLineText}
                style={{
                  fontSize: `${fittedLineSizes?.[i] ?? line.fontSizePx}px`,
                  lineHeight:
                    fittedLineSizes?.[i] != null
                      ? colonTitleLineHeightPx(fittedLineSizes[i])
                      : line.lineHeight ?? 1,
                }}
              >
                {line.segments.map((seg, j) =>
                  seg.impact && seg.color ? (
                    <span key={j} className={styles.impactWord} style={{ color: seg.color }}>
                      {seg.text}
                    </span>
                  ) : (
                    <span key={j}>{seg.text}</span>
                  )
                )}
              </span>
            </span>
          ))}
        </h1>
        {subtitle ? (
          <h2 ref={subtitleRef} className={styles.subtitle}>
            <span
              ref={subtitleTextRef}
              className={styles.subtitleText}
              style={{
                fontSize: `${subtitlePx ?? Math.round((titleMetrics.lineSizes?.[0] || titleMetrics.fontSizePx) * 0.5)}px`,
              }}
            >
              {subtitle}
            </span>
          </h2>
        ) : null}
      </div>

      {showLeadRow ? (
        <div className={styles.leadRow} data-lead-row>
          {headlinePoints.length > 0 ? (
            <div className={styles.headlinePanel} aria-label="Article headlines">
              <ul className={styles.headlineList}>
                {headlinePoints.map((text, idx) => (
                  <li key={idx} className={styles.headlineItem}>
                    <span className={styles.headlineBullet} aria-hidden>
                      •
                    </span>
                    <span className={styles.headlineText}>{text}</span>
                  </li>
                ))}
              </ul>
                </div>
              ) : null}
          {leadImages.map((image, idx) => (
            <figure className={styles.imageWrap} key={`lead-img-${idx}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt={image.alt || ''}
                style={apiFocus ? { objectPosition: apiFocus } : undefined}
              />
                  {image.caption ? <figcaption>{image.caption}</figcaption> : null}
                </figure>
              ))}
            </div>
      ) : null}

      <div className={styles.bodyFlow} data-body-flow>
        {renderBodyParagraphs(bodyItems, 'flow', {
          dateline,
          showDateline: !headlinePoints.length,
        })}
      </div>
    </div>
  )
}
