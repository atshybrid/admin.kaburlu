import React, { useMemo, useRef, useState, useLayoutEffect, useEffect, useCallback } from 'react'
import styles from './ArticleBlock4in2col.module.css'
import Block04LeadPhoto from './Block04LeadPhoto'
import Block04LayoutSkeleton from './Block04LayoutSkeleton'
import sk from './blockLayoutSkeleton.module.css'
import {
  resolveBlock04TitleColor,
  resolveBlock04SubtitleColor,
} from '../../lib/epaper/block04Color'
import {
  BLOCK_04A_CONTENT_WIDTH_PX,
  getBlock04ColumnPx,
  fallbackTitleMetrics,
} from '../../lib/epaper/block04TitleMetrics'
import { BLOCK_04A_PHOTO } from '../../lib/epaper/block04LockedRules'
import { measureBlock04TitleLayoutWhenReady } from '../../lib/epaper/block04TitleMeasure'
import {
  clampElementToRail,
  ensureBlock04TitleFonts,
  fitTitleLinesToRail,
  maxSubtitleSizeThatFits,
} from '../../lib/epaper/block04TitleFit'
import {
  colonTitleLineHeightPx,
  colonTitleLine2TuckPx,
} from '../../lib/epaper/block04TitleSmart'

/**
 * BLOCK-04A — 4-inch rail, Style 1 (centered stack + H&J body)
 */
export default function ArticleBlock4in2col({
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
  const hasColonInTitle = /[:：]/.test(String(title || ''))
  /** Colon golden rule owns accent colour — ignore article settings.* title colour for base ink */
  const resolvedTitleColor = hasColonInTitle
    ? '#1a1a1a'
    : resolveBlock04TitleColor(titleColor, titleColorEnabled, title, category)
  const resolvedSubtitleColor = subtitle
    ? resolveBlock04SubtitleColor(subtitle, title)
    : undefined

  const leadImages = useMemo(() => {
    const list = []
    const seen = new Set()
    for (const raw of images || []) {
      if (!raw || list.length >= BLOCK_04A_PHOTO.maxImages) break
      const src = raw.src || raw.url || raw.imageUrl || ''
      if (!src || seen.has(src)) continue
      seen.add(src)
      list.push({ src, alt: raw.alt || '', caption: raw.caption || '' })
    }
    return list
  }, [images])

  const apiFocus = String(imageObjectPosition || '').trim()
  const blockRef = useRef(null)
  const titleLineRefs = useRef([])
  const titleTextRefs = useRef([])
  const subtitleRef = useRef(null)
  const subtitleTextRef = useRef(null)
  const [subtitlePx, setSubtitlePx] = useState(null)
  const hasSubtitle = !!String(subtitle || '').trim()

  const colorOpts = useMemo(
    () => ({
      titleColor: hasColonInTitle ? '' : titleColor,
      titleColorEnabled: hasColonInTitle ? false : titleColorEnabled,
      category,
      baseColor: resolvedTitleColor,
      hasSubtitle,
    }),
    [titleColor, titleColorEnabled, category, resolvedTitleColor, hasSubtitle, hasColonInTitle]
  )

  const [titleMetrics, setTitleMetrics] = useState(() =>
    fallbackTitleMetrics(title, BLOCK_04A_CONTENT_WIDTH_PX, colorOpts)
  )
  /** DOM-fitted px — prevents measure re-render from resetting oversized fonts */
  const [fittedLineSizes, setFittedLineSizes] = useState(null)
  const [titleFitReady, setTitleFitReady] = useState(false)
  const [photosReadyCount, setPhotosReadyCount] = useState(0)

  useLayoutEffect(() => {
    const el = blockRef.current
    if (!el) return undefined

    let cancelled = false

    const run = async () => {
      await ensureBlock04TitleFonts()
      if (cancelled) return
      const width = getBlock04ColumnPx(el)
      const metrics = await measureBlock04TitleLayoutWhenReady(title, width, colorOpts)
      if (cancelled) return
      setTitleMetrics(metrics)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [title, colorOpts, hasSubtitle])

  /** After paint: clamp to 4in gutter — store sizes so React does not restore overflow. */
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

      if (!cancelled) {
        requestAnimationFrame(() => {
          if (!cancelled) setTitleFitReady(true)
        })
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [titleMetrics, title, subtitle, hasSubtitle])

  const bodyParagraphs = useMemo(() => {
    const items = []
    paragraphs.forEach((para) => {
      if (para?.type === 'heading') {
        items.push({ type: 'heading', content: para.content || para })
        return
      }
      const text = String(para?.content || para || '').trim()
      if (text) items.push({ type: 'text', content: text })
    })
    return items
  }, [paragraphs])

  const headlinePoints = useMemo(
    () =>
      highlights
        .map((item) => (typeof item === 'string' ? item : item?.text || item?.content || '').trim())
        .filter(Boolean),
    [highlights]
  )

  const contentKey = useMemo(
    () =>
      [
        title,
        subtitle,
        leadImages.map((i) => i.src).join('|'),
        paragraphs.length,
        headlinePoints.length,
      ].join('::'),
    [title, subtitle, leadImages, paragraphs.length, headlinePoints.length]
  )

  const railLoading = leadImages.length > 0 || bodyParagraphs.length > 0
  const photosReady = leadImages.length === 0 || photosReadyCount >= leadImages.length
  const layoutReady = titleFitReady && photosReady

  useEffect(() => {
    setTitleFitReady(false)
    setFittedLineSizes(null)
    setPhotosReadyCount(0)
  }, [contentKey])

  const onPhotoReady = useCallback(() => {
    setPhotosReadyCount((n) => n + 1)
  }, [])

  const line2TuckPx = useMemo(() => {
    const lines = titleMetrics.titleLines || []
    if (lines.length < 2) return 0
    const size0 = fittedLineSizes?.[0] ?? titleMetrics.lineSizes?.[0] ?? titleMetrics.fontSizePx
    return colonTitleLine2TuckPx(size0, lines[1])
  }, [titleMetrics, fittedLineSizes])

  const flowNodes = useMemo(() => {
    const nodes = []
    let buffer = ''
    let paraIndex = 0
    let datelinePending = !!dateline

    const flush = () => {
      if (!buffer) return
      nodes.push(
        <p key={`flow-p-${paraIndex++}`} className={styles.bodyPara}>
          {datelinePending ? <span className={styles.dateline}>{dateline} </span> : null}
          {buffer}
        </p>
      )
      datelinePending = false
      buffer = ''
    }

    bodyParagraphs.forEach((item, idx) => {
      if (item.type === 'heading') {
        flush()
        nodes.push(
          <h3 key={`flow-h-${idx}`} className={styles.subHeading}>
            {item.content}
          </h3>
        )
        return
      }
      const text = item.content
      if (!text) return
      buffer = buffer ? `${buffer} ${text}` : text
    })

    flush()
    return nodes
  }, [bodyParagraphs, dateline])

  return (
    <div
      ref={blockRef}
      className={styles.articleBlock}
      style={{
        '--title-color': resolvedTitleColor,
        '--subtitle-color': resolvedSubtitleColor || 'inherit',
        '--title-size': `${titleMetrics.fontSizePx}px`,
        '--title-line-gap': `${titleMetrics.lineGapPx ?? (titleMetrics.titleLines?.length > 1 ? 0 : 0)}px`,
        '--title-line-stack': `${titleMetrics.lineStackPx ?? 0}px`,
        '--title-line2-tuck': `${line2TuckPx}px`,
        '--subtitle-size': `${subtitlePx ?? Math.round((titleMetrics.lineSizes?.[0] || titleMetrics.fontSizePx) * 0.5)}px`,
      }}
    >
      <div className={styles.titleWrap}>
        <h1
          className={styles.title}
          data-accent-impact={titleMetrics.accentImpact ? 'true' : undefined}
        >
          {(titleMetrics.renderedLines?.length
            ? titleMetrics.renderedLines
            : (titleMetrics.titleLines || ['']).map((text) => ({
                text,
                fontSizePx: titleMetrics.fontSizePx,
                segments: [{ text, impact: false }],
              }))
          ).map((line, i) => (
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
      </div>

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

      <div
        className={`${sk.railWrap} ${!layoutReady && railLoading ? sk.railLoading : ''}`}
        aria-busy={!layoutReady && railLoading}
      >
        {!layoutReady && railLoading ? (
          <Block04LayoutSkeleton showImage={leadImages.length > 0} />
        ) : null}
        <div className={sk.railContent}>
          {leadImages.map((img, idx) => (
            <Block04LeadPhoto
              key={img.src || idx}
              src={img.src}
              alt={img.alt}
              caption={img.caption}
              apiFocus={apiFocus}
              onReady={onPhotoReady}
            />
          ))}

          {headlinePoints.length > 0 ? (
            <ul className={styles.headlineList} aria-label="Article headlines">
              {headlinePoints.map((text, idx) => (
                <li key={idx} className={styles.headlineItem}>
                  <span className={styles.headlineBullet} aria-hidden>
                    •
                  </span>
                  <span className={styles.headlineText}>{text}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className={styles.articleBody}>{flowNodes}</div>
        </div>
      </div>
    </div>
  )
}
