import React, { useMemo, useRef, useState, useLayoutEffect, useCallback, useEffect } from 'react'
import styles from './Block08Article.module.css'
import { analyzeBlock08Visuals } from '../../lib/epaper/block08VisualAnalysis'
import { buildBlock08Composition } from '../../lib/epaper/block08Composition'
import { buildColumnModels } from '../../lib/epaper/block08ColumnModel'
import { mergeEditorialParagraphs } from '../../lib/epaper/block08ParagraphMerge'
import { assignBlock08ColumnText } from '../../lib/epaper/block08ThreadFlow'
import Block08ColumnBody from './Block08ColumnBody'
import { clearBlock08DomMeasureCache } from '../../lib/epaper/block08Measure'
import { ensureBlock08BodyFonts, resetTextMetricsCache } from '../../lib/epaper/block08TextMetrics'
import {
  alignColumnTextsToRenderedBottoms,
  measureRenderedColumnTextBottoms,
  rebalanceColumnBottoms,
} from '../../lib/epaper/block08CrossColumnFlow'
import { tokenizeWords } from '../../lib/epaper/block08LineComposer'
import { isBroken08ColumnLayout } from '../../lib/epaper/block08LayoutGuard'
import { estimateHeadlinePanelPx } from '../../lib/epaper/wideColumnBalance'
import { wideColumnContentWidthPx } from '../../lib/epaper/wideColumnBalance'
import { uniformBlock08ColumnWidths } from '../../lib/epaper/block08ColumnWidths'
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
  measureBlock04TitleLayout,
  measureBlock04TitleLayoutWhenReady,
} from '../../lib/epaper/block04TitleMeasure'
import {
  fitTitleLinesToRail,
  growTitleLinesToFillRail,
  railLimitPx,
  titleTextOverflowsRail,
  lineInkWidthPx,
  effectiveWideTitlePx,
  ensureBlock04TitleFonts,
  maxSubtitleSizeThatFits,
  clampElementToRail,
} from '../../lib/epaper/block04TitleFit'
import { colonTitleLineHeightPx, colonTitleLine2TuckPx } from '../../lib/epaper/block04TitleSmart'
import {
  BLOCK_08A_TITLE,
  BLOCK_08A_DIMENSIONS,
  BLOCK_08A_IMAGE,
  block08ImageObstaclePx,
} from '../../lib/epaper/wideBlockRules'
import {
  block08ImageMaxHeightPx,
  computeBlock08ImageFrameHeight,
} from '../../lib/epaper/block08ImageFrame'
import EditorialCropImage from './EditorialCropImage'
import BlockColumnLayoutSkeleton from './BlockColumnLayoutSkeleton'
import sk from './blockLayoutSkeleton.module.css'

const COLUMN_COUNT = 3
const CENTER_COL_INDEX = 1
const PARTITION_COOLDOWN_MS = 420
const OBSTACLE_SIG_MIN_DELTA_PX = 14

function normalizeImages(images, max = 4) {
  const list = []
  const seen = new Set()
  for (const raw of images || []) {
    if (!raw || list.length >= max) break
    const src = raw.src || raw.url || raw.imageUrl || ''
    if (!src || seen.has(src)) continue
    seen.add(src)
    list.push({
      src,
      alt: raw.alt || '',
      caption: raw.caption || '',
      width: raw.width || raw.naturalWidth || 0,
      height: raw.height || raw.naturalHeight || 0,
      tags: raw.tags || raw.subject || '',
    })
  }
  return list
}


/** LOCKED — see lib/epaper/BLOCK_08A_LOCKED.md; do not edit for 06A work. */

/**
 * BLOCK-08A — 3-column CSS grid.
 * Col1: headlines (top) → text | Col2: image (top) → text | Col3: image2? (top) → text
 * Continuous text col1→col2 (below image)→col3; even bottoms; H&J; hyphen at column breaks.
 */
export default function Block08Article({
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
  showColumnDebug = false,
}) {
  const hasColonInTitle = /[:：]/.test(String(title || ''))
  const resolvedTitleColor = hasColonInTitle
    ? '#1a1a1a'
    : resolveBlock04TitleColor(titleColor, titleColorEnabled, title, category)

  const leadImages = useMemo(() => normalizeImages(images), [images])
  const headlinePoints = useMemo(
    () =>
      highlights
        .map((item) => (typeof item === 'string' ? item : item?.text || item?.content || '').trim())
        .filter(Boolean),
    [highlights]
  )

  const flowStart = headlinePoints.length ? 0 : 1
  const bodyItems = useMemo(() => {
    const highlightSet = new Set(
      headlinePoints.map((h) =>
        String(h || '')
          .replace(/^[\s•\-–—*]+/, '')
          .trim()
      )
    )
    const sliced = paragraphs.slice(flowStart).filter((p) => {
      const t = String(p?.content ?? p ?? '')
        .replace(/^[\s•\-–—*]+/, '')
        .trim()
      if (!t) return false
      if (headlinePoints.length && highlightSet.has(t)) return false
      return true
    })
    return mergeEditorialParagraphs(sliced)
  }, [paragraphs, flowStart, headlinePoints])
  const bodyFlowKey = useMemo(
    () =>
      [
        headlinePoints.length,
        headlinePoints.join('|').slice(0, 120),
        bodyItems
          .map((item, i) => `${item?.type || 'p'}:${String(item?.content ?? item ?? '').length}:${i}`)
          .join('|'),
      ].join('::'),
    [bodyItems, headlinePoints]
  )

  const [imageMetrics, setImageMetrics] = useState({ width: 0, height: 0 })
  const [columnTexts, setColumnTexts] = useState(() => Array.from({ length: COLUMN_COUNT }, () => ''))
  const [layoutReady, setLayoutReady] = useState(() => bodyItems.length === 0)
  const [debugHeights, setDebugHeights] = useState(null)
  const partitionTimerRef = useRef(null)
  const alignTimerRef = useRef(null)
  const partitionRunIdRef = useRef(0)
  const partitionDeferRef = useRef(0)
  const runPartitionRef = useRef(() => {})
  const obstacleMountGenRef = useRef(0)
  const alignPassRef = useRef(0)
  const brokenRepartitionRef = useRef(0)
  const layoutFrozenRef = useRef(false)
  const lastPartitionKeyRef = useRef('')
  const obstacleHeightSigRef = useRef('')
  const gridWidthSigRef = useRef('')
  const imageFrameHeightsRef = useRef({})
  const lastPartitionAtRef = useRef(0)
  const frameHeightTimerRef = useRef(null)

  const articleForAnalysis = useMemo(
    () => ({
      title,
      category,
      highlights: headlinePoints,
      images: leadImages,
      paragraphs: bodyItems,
      imageWidth: imageMetrics.width || leadImages[0]?.width,
      imageHeight: imageMetrics.height || leadImages[0]?.height,
    }),
    [title, category, headlinePoints, leadImages, bodyItems, imageMetrics]
  )

  const visuals = useMemo(
    () => analyzeBlock08Visuals(articleForAnalysis),
    [articleForAnalysis]
  )

  const composition = useMemo(
    () =>
      buildBlock08Composition(visuals, leadImages, headlinePoints.length > 0, {
        title,
        category,
      }),
    [visuals, leadImages, headlinePoints.length, title, category]
  )

  const columnModels = useMemo(
    () =>
      buildColumnModels({
        visuals,
        images: leadImages,
        headlineCount: headlinePoints.length,
        columnCount: COLUMN_COUNT,
      }),
    [visuals, leadImages, headlinePoints.length]
  )

  const blockRef = useRef(null)
  const columnsRef = useRef(null)
  const obstacleRefs = useRef(
    Array.from({ length: COLUMN_COUNT }, () => ({ highlights: null, images: [] }))
  )
  const titleLineRefs = useRef([])
  const titleTextRefs = useRef([])
  const subtitleRef = useRef(null)
  const subtitleTextRef = useRef(null)
  const [measuredTitleInkRatio, setMeasuredTitleInkRatio] = useState(0)
  const [subtitlePx, setSubtitlePx] = useState(null)
  const [titleMetrics, setTitleMetrics] = useState(() =>
    fallbackTitleMetrics(title, BLOCK_04A_CONTENT_WIDTH_PX, { wideBlockTitle: true })
  )
  const [fittedLineSizes, setFittedLineSizes] = useState(null)
  const titleReflowOnce = useRef(false)

  const typography = composition.typography
  const hasSubtitle = !!String(subtitle || '').trim()
  const showDateline = !headlinePoints.length

  const colorOpts = useMemo(
    () => ({
      titleColor: hasColonInTitle ? '' : titleColor,
      titleColorEnabled: hasColonInTitle ? false : titleColorEnabled,
      category,
      baseColor: resolvedTitleColor,
      hasSubtitle,
      wideBlockTitle: true,
      wideTitleMinPx: typography.titleMinPx ?? BLOCK_08A_TITLE.minPx,
      wideTitleMaxPx: typography.titleMaxPx ?? BLOCK_08A_TITLE.maxPx,
      preferMultiLineOnly:
        typography.forceMultiLine || measuredTitleInkRatio >= 0.85,
      wideTitleMaxLines: BLOCK_08A_TITLE.maxLines,
    }),
    [
      titleColor,
      titleColorEnabled,
      category,
      resolvedTitleColor,
      hasSubtitle,
      hasColonInTitle,
      typography,
      measuredTitleInkRatio,
    ]
  )

  const colWidthPx = useMemo(
    () => wideColumnContentWidthPx(BLOCK_08A_DIMENSIONS.nativeWidthPx, COLUMN_COUNT, 2, 2),
    []
  )

  const estimateObstaclePx = useCallback(() => {
    return columnModels.map((model, colIdx) => {
      let h = 0
      if (model.highlights) {
        h += estimateHeadlinePanelPx(headlinePoints.length)
      }
      if (model.images?.length) {
        model.images.forEach((slot, imgIdx) => {
          const key = `${colIdx}-${imgIdx}`
          const measured = imageFrameHeightsRef.current[key]
          const est =
            measured ||
            computeBlock08ImageFrameHeight({
              naturalWidth: imageMetrics.width || slot.image?.width,
              naturalHeight: imageMetrics.height || slot.image?.height,
              columnWidthPx: colWidthPx,
              role: slot.role || 'primary',
            })
          h += block08ImageObstaclePx(slot.role || 'primary', !!slot.image?.caption, est)
        })
      }
      return h
    })
  }, [columnModels, headlinePoints.length, imageMetrics, colWidthPx])

  const measureObstaclesFromDom = useCallback(() => {
    return columnModels.map((model, colIdx) => {
      const refs = obstacleRefs.current[colIdx]
      let h = 0
      if (model.highlights && refs?.highlights) {
        h += Math.ceil(refs.highlights.getBoundingClientRect().height)
      }
      ;(refs?.images || []).forEach((el) => {
        if (el) h += Math.ceil(el.getBoundingClientRect().height)
      })
      const est = estimateObstaclePx()[colIdx]
      if (h <= 0) return est
      if (est > 0) {
        return Math.min(Math.max(h, est * 0.92), est * 1.35)
      }
      return Math.min(h, 480)
    })
  }, [columnModels, estimateObstaclePx])

  const revealColumnLayout = useCallback(() => {
    setLayoutReady(true)
  }, [])

  const markLayoutSettled = useCallback(() => {
    layoutFrozenRef.current = true
    setLayoutReady(true)
  }, [])

  const schedulePostPartitionAlign = useCallback(
    (texts) => {
      clearTimeout(alignTimerRef.current)
      alignTimerRef.current = setTimeout(() => {
        if (layoutFrozenRef.current) return
        const grid = columnsRef.current
        if (!grid || grid.children?.length !== COLUMN_COUNT) {
          if (alignPassRef.current < 8) {
            alignPassRef.current += 1
            alignTimerRef.current = setTimeout(() => schedulePostPartitionAlign(texts), 180)
          } else {
            markLayoutSettled()
          }
          return
        }
        if (alignPassRef.current >= 12) {
          markLayoutSettled()
          return
        }

        const bottoms = measureRenderedColumnTextBottoms(grid)
        if (!bottoms) {
          alignPassRef.current += 1
          alignTimerRef.current = setTimeout(() => schedulePostPartitionAlign(texts), 200)
          return
        }
        const spread = Math.max(...bottoms) - Math.min(...bottoms)
        const totalW = texts.reduce(
          (n, t) => n + tokenizeWords(String(t || '')).length,
          0
        )
        const centerW = tokenizeWords(texts[1] || '').length
        const centerOk = !columnModels[1]?.images?.length || centerW >= totalW * 0.18
        const alignCtx = {
          totalWords: totalW,
          hasHighlights: headlinePoints.length > 0,
          hasCenterImage: (columnModels[1]?.images?.length || 0) > 0,
        }

        if (isBroken08ColumnLayout(texts, alignCtx) && brokenRepartitionRef.current < 1) {
          brokenRepartitionRef.current += 1
          alignPassRef.current += 1
          layoutFrozenRef.current = false
          lastPartitionKeyRef.current = ''
          queueMicrotask(() => runPartitionRef.current())
          return
        }

        if (spread <= 12 && centerOk) {
          markLayoutSettled()
          return
        }

        const obstacles = measureObstaclesFromDom()
        const colWidths = uniformBlock08ColumnWidths(
          grid,
          COLUMN_COUNT,
          BLOCK_08A_DIMENSIONS.nativeWidthPx
        )
        const flowOpts = { dateline, showDateline, hasHighlights: headlinePoints.length > 0 }

        setColumnTexts((prev) => {
          let aligned = alignColumnTextsToRenderedBottoms(prev, grid)
          aligned = rebalanceColumnBottoms(aligned, obstacles, colWidths, flowOpts)
          const same = aligned.every((t, i) => t === prev[i])
          const afterBottoms = measureRenderedColumnTextBottoms(grid)
          const afterSpread = afterBottoms
            ? Math.max(...afterBottoms) - Math.min(...afterBottoms)
            : spread

          if (same && afterSpread <= 14 && centerOk) {
            markLayoutSettled()
            return prev
          }
          if (same) {
            alignPassRef.current += 1
            if (alignPassRef.current >= 12) {
              markLayoutSettled()
            } else {
              clearTimeout(alignTimerRef.current)
              alignTimerRef.current = setTimeout(() => schedulePostPartitionAlign(prev), 180)
            }
            return prev
          }
          alignPassRef.current += 1
          clearTimeout(alignTimerRef.current)
          alignTimerRef.current = setTimeout(() => schedulePostPartitionAlign(aligned), 160)
          return aligned
        })
      }, 160)
    },
    [
      columnModels,
      headlinePoints.length,
      markLayoutSettled,
      measureObstaclesFromDom,
      dateline,
      showDateline,
    ]
  )

  const runColumnPartitionNow = useCallback(async () => {
    if (layoutFrozenRef.current) return
    if (!bodyItems.length) {
      setColumnTexts(Array.from({ length: COLUMN_COUNT }, () => ''))
      markLayoutSettled()
      return
    }

    const runId = ++partitionRunIdRef.current
    await ensureBlock08BodyFonts()
    resetTextMetricsCache()
    clearBlock08DomMeasureCache()

    const domObstacles = measureObstaclesFromDom()
    const centerEst = estimateObstaclePx()[CENTER_COL_INDEX] || 0
    const centerNeedsDom = (columnModels[1]?.images?.length || 0) > 0
    const centerDom = domObstacles[1] || 0
    if (centerNeedsDom && centerDom < centerEst * 0.72) {
      partitionDeferRef.current += 1
      if (partitionDeferRef.current <= 10) {
        setTimeout(() => {
          if (runId === partitionRunIdRef.current && !layoutFrozenRef.current) {
            runColumnPartitionNow()
          }
        }, 120)
        return
      }
    }
    partitionDeferRef.current = 0

    const estimate = estimateObstaclePx()
    const obstacleTotals = domObstacles.map((domH, i) => {
      const est = estimate[i] || 0
      if (est <= 0) return domH
      if (domH < est * 0.72) return est
      return Math.round(est * 0.5 + domH * 0.5)
    })

    const colWidths = uniformBlock08ColumnWidths(
      columnsRef.current,
      COLUMN_COUNT,
      BLOCK_08A_DIMENSIONS.nativeWidthPx
    )

    const partitionKey = `${bodyFlowKey}|${obstacleTotals.join(',')}|${colWidths.join(',')}`
    const flowCtx = {
      totalWords: tokenizeWords(
        bodyItems.map((p) => String(p?.content ?? p ?? '')).join(' ')
      ).length,
      hasHighlights: headlinePoints.length > 0,
      hasCenterImage: centerNeedsDom,
    }

    const cols = assignBlock08ColumnText(
      bodyItems,
      columnModels,
      obstacleTotals,
      null,
      colWidths,
      {
        dateline,
        showDateline,
        hasHighlights: headlinePoints.length > 0,
      }
    )

    if (runId !== partitionRunIdRef.current) return

    const next = cols.map((c) => c.columnText || '')
    const broken = isBroken08ColumnLayout(next, flowCtx)

    if (partitionKey === lastPartitionKeyRef.current && !broken) return

    if (broken && centerNeedsDom && centerDom < centerEst * 0.85) {
      partitionDeferRef.current += 1
      if (partitionDeferRef.current <= 12) {
        setTimeout(() => {
          if (runId === partitionRunIdRef.current && !layoutFrozenRef.current) {
            runColumnPartitionNow()
          }
        }, 140)
        return
      }
    }

    if (!broken) lastPartitionKeyRef.current = partitionKey
    lastPartitionAtRef.current = Date.now()
    obstacleHeightSigRef.current = obstacleTotals.join(',')

    const hasBody = next.some((t) => String(t || '').trim().length > 0)
    setColumnTexts((prev) => {
      const same = prev.length === next.length && prev.every((t, i) => t === next[i])
      return same ? prev : next
    })
    if (hasBody) revealColumnLayout()
    layoutFrozenRef.current = false
    alignPassRef.current = 0
    schedulePostPartitionAlign(next)
  }, [
    bodyItems,
    columnModels,
    colWidthPx,
    dateline,
    showDateline,
    measureObstaclesFromDom,
    estimateObstaclePx,
    headlinePoints.length,
    bodyFlowKey,
    schedulePostPartitionAlign,
    markLayoutSettled,
    revealColumnLayout,
  ])

  runPartitionRef.current = runColumnPartitionNow

  const runColumnPartition = useCallback(() => {
    clearTimeout(partitionTimerRef.current)
    partitionTimerRef.current = setTimeout(() => {
      runColumnPartitionNow()
    }, 120)
  }, [runColumnPartitionNow])

  /** Highlights / images just mounted — remeasure obstacles then re-thread columns. */
  const onObstacleMounted = useCallback(() => {
    if (layoutFrozenRef.current) return
    const now = Date.now()
    if (now - lastPartitionAtRef.current < PARTITION_COOLDOWN_MS) return

    const sig = measureObstaclesFromDom().join(',')
    const prevSig = obstacleHeightSigRef.current
    if (prevSig && sig === prevSig) return
    if (prevSig) {
      const prevHeights = prevSig.split(',').map((n) => Number(n) || 0)
      const nextHeights = sig.split(',').map((n) => Number(n) || 0)
      const delta = Math.max(
        ...nextHeights.map((h, i) => Math.abs(h - (prevHeights[i] || 0))),
        0
      )
      if (delta < OBSTACLE_SIG_MIN_DELTA_PX) return
    }
    obstacleHeightSigRef.current = sig

    const gen = ++obstacleMountGenRef.current
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (gen === obstacleMountGenRef.current && !layoutFrozenRef.current) {
          lastPartitionAtRef.current = Date.now()
          runColumnPartition()
        }
      })
    })
  }, [runColumnPartition, measureObstaclesFromDom])

  const handleImageLoad = useCallback(() => {
    onObstacleMounted()
  }, [onObstacleMounted])

  useEffect(() => {
    layoutFrozenRef.current = false
    lastPartitionKeyRef.current = ''
    obstacleHeightSigRef.current = ''
    gridWidthSigRef.current = ''
    imageFrameHeightsRef.current = {}
    partitionDeferRef.current = 0
    alignPassRef.current = 0
    partitionRunIdRef.current += 1
    clearTimeout(alignTimerRef.current)
    clearTimeout(partitionTimerRef.current)
    setColumnTexts(Array.from({ length: COLUMN_COUNT }, () => ''))
    setLayoutReady(false)
    setDebugHeights(null)
  }, [bodyFlowKey])

  useEffect(() => {
    if (!bodyItems.length) return undefined
    const t = setTimeout(runColumnPartition, 1100)
    return () => clearTimeout(t)
  }, [bodyFlowKey, bodyItems.length, runColumnPartition])

  useEffect(() => {
    if (!bodyItems.length || layoutReady) return undefined
    const t = setTimeout(() => {
      if (!layoutFrozenRef.current) revealColumnLayout()
    }, 2800)
    return () => clearTimeout(t)
  }, [bodyFlowKey, bodyItems.length, layoutReady, revealColumnLayout])

  useLayoutEffect(() => {
    const el = blockRef.current
    if (!el) return undefined
    titleReflowOnce.current = false
    let cancelled = false
    const run = async () => {
      await ensureBlock04TitleFonts()
      if (cancelled) return
      resetTextMetricsCache()
      const width = getBlock04ColumnPx(el)
      const metrics = await measureBlock04TitleLayoutWhenReady(title, width, colorOpts)
      if (!cancelled) setTitleMetrics(metrics)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [title, colorOpts, hasSubtitle])

  useLayoutEffect(() => {
    const block = blockRef.current
    if (!block) return undefined
    let cancelled = false
    const run = async () => {
      await ensureBlock04TitleFonts()
      if (cancelled) return
      const rail = getBlock04ColumnPx(block)
      const effectiveRail = effectiveWideTitlePx(rail)
      const lineCount = titleMetrics.renderedLines?.length || titleMetrics.titleLines?.length || 0
      const initial = (titleMetrics.lineSizes || [titleMetrics.fontSizePx]).slice(0, lineCount)
      let sizes = fitTitleLinesToRail(
        titleLineRefs.current,
        titleTextRefs.current,
        initial,
        typography.titleMinPx ?? BLOCK_08A_TITLE.minPx,
        { lockEqualSizes: hasSubtitle && lineCount >= 2 }
      )
      if (sizes.length && BLOCK_08A_TITLE.fillWidthWhenShort) {
        sizes = growTitleLinesToFillRail(
          titleLineRefs.current,
          titleTextRefs.current,
          sizes,
          typography.titleMinPx ?? BLOCK_08A_TITLE.minPx,
          typography.titleMaxPx ?? BLOCK_08A_TITLE.maxPx,
          {
            wide: true,
            lockEqualSizes: hasSubtitle && lineCount >= 2,
            fillRatio: 0.84,
          }
        )
      }
      if (!cancelled && sizes.length) setFittedLineSizes(sizes)

      const firstText = titleTextRefs.current[0]
      if (firstText && effectiveRail > 0) {
        const ratio = lineInkWidthPx(firstText) / effectiveRail
        if (!cancelled) setMeasuredTitleInkRatio(ratio)
      }

      if (
        !titleReflowOnce.current &&
        lineCount === 1 &&
        titleLineRefs.current[0] &&
        titleTextRefs.current[0] &&
        (typography.forceMultiLine ||
          measuredTitleInkRatio >= 0.85 ||
          titleTextOverflowsRail(titleLineRefs.current[0], titleTextRefs.current[0]))
      ) {
        titleReflowOnce.current = true
        const remeasured = measureBlock04TitleLayout(title, rail, {
          ...colorOpts,
          preferMultiLineOnly: true,
        })
        if (!cancelled) {
          setTitleMetrics(remeasured)
          setFittedLineSizes(null)
        }
        return
      }

      if (hasSubtitle && subtitle && subtitleRef.current && subtitleTextRef.current) {
        const titleBase =
          sizes[0] || titleMetrics.lineSizes?.[0] || titleMetrics.fontSizePx || 38
        let px = maxSubtitleSizeThatFits(subtitle, rail, titleBase)
        subtitleTextRef.current.style.fontSize = `${px}px`
        px = clampElementToRail(subtitleRef.current, subtitleTextRef.current, 18)
        const subLimit = railLimitPx(subtitleRef.current)
        if (subLimit > 0 && lineInkWidthPx(subtitleTextRef.current) < subLimit * 0.8) {
          const grown = growTitleLinesToFillRail(
            [subtitleRef.current],
            [subtitleTextRef.current],
            [px],
            16,
            Math.max(20, Math.floor(titleBase * 0.55)),
            { fillRatio: 0.82 }
          )
          px = grown[0] || px
        }
        if (!cancelled) setSubtitlePx(px)
      } else if (!cancelled) {
        setSubtitlePx(null)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [titleMetrics, title, subtitle, hasSubtitle, colorOpts, typography, measuredTitleInkRatio])

  useLayoutEffect(() => {
    const grid = columnsRef.current
    if (!grid) return undefined
    let t = null
    const onResize = () => {
      if (layoutFrozenRef.current) return
      clearTimeout(t)
      t = setTimeout(() => {
        const kids = columnsRef.current?.children
        if (!kids || kids.length !== COLUMN_COUNT) return
        const ws = [...kids].map((el) => Math.round(el.getBoundingClientRect().width))
        const widthSig = ws.join(',')
        if (widthSig === gridWidthSigRef.current) return
        if (Math.max(...ws) - Math.min(...ws) <= 3) return
        gridWidthSigRef.current = widthSig
        lastPartitionKeyRef.current = ''
        runColumnPartition()
      }, 280)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(grid)
    return () => {
      clearTimeout(t)
      ro.disconnect()
    }
  }, [bodyFlowKey, runColumnPartition])

  /** Re-flow once when image/highlight obstacle height stabilizes (not on every px tick). */
  useLayoutEffect(() => {
    const nodes = []
    for (let colIdx = 0; colIdx < COLUMN_COUNT; colIdx++) {
      const refs = obstacleRefs.current[colIdx]
      if (refs?.highlights) nodes.push(refs.highlights)
      ;(refs?.images || []).forEach((el) => {
        if (el) nodes.push(el)
      })
    }
    if (!nodes.length) return undefined

    let t = null
    const schedule = () => {
      if (layoutFrozenRef.current) return
      clearTimeout(t)
      t = setTimeout(() => {
        if (layoutFrozenRef.current) return
        const sig = measureObstaclesFromDom().join(',')
        if (!sig || sig === obstacleHeightSigRef.current) return
        const prevSig = obstacleHeightSigRef.current
        if (prevSig) {
          const prevHeights = prevSig.split(',').map((n) => Number(n) || 0)
          const nextHeights = sig.split(',').map((n) => Number(n) || 0)
          const delta = Math.max(
            ...nextHeights.map((h, i) => Math.abs(h - (prevHeights[i] || 0))),
            0
          )
          if (delta < OBSTACLE_SIG_MIN_DELTA_PX) return
        }
        obstacleHeightSigRef.current = sig
        alignPassRef.current = 0
        lastPartitionKeyRef.current = ''
        lastPartitionAtRef.current = Date.now()
        runColumnPartition()
      }, 280)
    }
    const ro = new ResizeObserver(schedule)
    nodes.forEach((el) => ro.observe(el))
    return () => {
      clearTimeout(t)
      ro.disconnect()
    }
  }, [bodyFlowKey, headlinePoints.length, columnModels, runColumnPartition, measureObstaclesFromDom])

  useLayoutEffect(() => {
    if (!showColumnDebug) return undefined
    const measure = () => {
      const cols = columnsRef.current?.children
      if (!cols || cols.length !== COLUMN_COUNT) return
      const widths = [...cols].map((el) => Math.round(el.getBoundingClientRect().width))
      const heights = [...cols].map((el) => Math.round(el.getBoundingClientRect().height))
      const textBottoms = measureRenderedColumnTextBottoms(columnsRef.current) || []
      const textSpread = Math.max(...textBottoms) - Math.min(...textBottoms)
      const widthSpread = Math.max(...widths) - Math.min(...widths)
      setDebugHeights({
        widths,
        heights,
        textBottoms,
        textSpread,
        widthSpread,
        counts: columnTexts.map((t) => (String(t || '').trim() ? String(t).length : 0)),
      })
    }
    measure()
    const t = setTimeout(measure, 600)
    const ro = new ResizeObserver(measure)
    if (columnsRef.current) ro.observe(columnsRef.current)
    return () => {
      clearTimeout(t)
      ro.disconnect()
    }
  }, [showColumnDebug, columnTexts, imageMetrics])

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
  const familyClass =
    styles[`family${composition.layoutFamily.replace('08A-', '')}`] || ''

  const texts = columnTexts

  return (
    <div
      ref={blockRef}
      className={`${styles.block08a} ${familyClass}`}
      data-block-code="BLOCK-08A"
      data-layout-family={composition.layoutFamily}
      data-flow-model="threaded-3col"
      lang="te"
    >
      {showColumnDebug && debugHeights ? (
        <div className={styles.debugBar} data-column-debug>
          <span>
            Col1 W{debugHeights.widths[0]} · text↓{debugHeights.textBottoms[0]} · {debugHeights.counts[0]} chars
          </span>
          <span>
            Col2 W{debugHeights.widths[1]} · text↓{debugHeights.textBottoms[1]} · {debugHeights.counts[1]} chars
          </span>
          <span>
            Col3 W{debugHeights.widths[2]} · text↓{debugHeights.textBottoms[2]} · {debugHeights.counts[2]} chars
          </span>
          <span className={debugHeights.widthSpread <= 2 ? styles.debugOk : styles.debugWarn}>
            width Δ{debugHeights.widthSpread}px
          </span>
          <span className={debugHeights.textSpread <= 10 ? styles.debugOk : styles.debugWarn}>
            text bottom Δ{debugHeights.textSpread}px
          </span>
        </div>
      ) : null}

      <div className={styles.titleZone}>
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
                      : line.lineHeight ?? 1.2,
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
                color: resolveBlock04SubtitleColor(subtitle, title),
              }}
            >
              {subtitle}
            </span>
          </h2>
        ) : null}
      </div>

      <div
        className={`${sk.columnGridWrap} ${!layoutReady && bodyItems.length ? sk.columnGridLoading : ''}`}
        aria-busy={!layoutReady && bodyItems.length > 0}
      >
        {!layoutReady && bodyItems.length > 0 ? (
          <BlockColumnLayoutSkeleton
            columns={3}
            imageColumnIndexes={
              leadImages.length >= 2 ? [1, 2] : leadImages.length === 1 ? [1] : []
            }
            columnGap={20}
          />
        ) : null}
        <div className={styles.columnGrid} ref={columnsRef} data-columns>
        {columnModels.map((model, colIdx) => {
          const colText = texts[colIdx] || ''
          const showColDateline = colIdx === 0 && showDateline
          const colEl = columnsRef.current?.children?.[colIdx]
          const liveColW =
            colEl?.clientWidth && colEl.clientWidth > 40
              ? Math.floor(colEl.clientWidth)
              : colWidthPx

          return (
            <div className={styles.column} key={`col-${colIdx}`} data-column={colIdx + 1}>
              {model.highlights ? (
                <div
                  className={styles.highlightBox}
                  ref={(el) => {
                    const prev = obstacleRefs.current[colIdx].highlights
                    obstacleRefs.current[colIdx].highlights = el
                    if (el && el !== prev) onObstacleMounted()
                  }}
                >
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

              {model.images.map((slot, imgIdx) => (
                <div
                  key={`img-${colIdx}-${imgIdx}`}
                  className={styles.imageObstacle}
                  ref={(el) => {
                    const prev = obstacleRefs.current[colIdx].images[imgIdx]
                    obstacleRefs.current[colIdx].images[imgIdx] = el
                    if (el && el !== prev) onObstacleMounted()
                  }}
                >
                  <EditorialCropImage
                    image={slot.image}
                    layoutFamily={composition.layoutFamily}
                    role={slot.role || 'primary'}
                    maxImageHeightPx={block08ImageMaxHeightPx(slot.role || 'primary')}
                    widthPct={BLOCK_08A_IMAGE.widthPct}
                    columnHeightPx={Math.round(blockRef.current?.clientHeight || 480)}
                    columnWidthPx={liveColW}
                    article={{ title, category }}
                    apiFocus={apiFocus}
                    onLoadMetrics={(w, h) => {
                      if (colIdx !== CENTER_COL_INDEX || imgIdx !== 0) return
                      setImageMetrics((prev) =>
                        prev.width === w && prev.height === h ? prev : { width: w, height: h }
                      )
                    }}
                    onFrameHeight={(h) => {
                      const key = `${colIdx}-${imgIdx}`
                      const rounded = Math.ceil(h)
                      if (rounded <= 0 || imageFrameHeightsRef.current[key] === rounded) return
                      const prev = imageFrameHeightsRef.current[key] || 0
                      if (prev > 0 && Math.abs(rounded - prev) < OBSTACLE_SIG_MIN_DELTA_PX) return
                      imageFrameHeightsRef.current[key] = rounded
                      if (layoutFrozenRef.current) return
                      clearTimeout(frameHeightTimerRef.current)
                      frameHeightTimerRef.current = setTimeout(() => {
                        onObstacleMounted()
                      }, 360)
                    }}
                    onCropReady={handleImageLoad}
                  />
                </div>
              ))}

              <div className={styles.columnText} data-text-flow>
                <Block08ColumnBody
                  text={colText}
                  columnIndex={colIdx}
                  dateline={dateline}
                  showDateline={showColDateline}
                />
              </div>
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}
