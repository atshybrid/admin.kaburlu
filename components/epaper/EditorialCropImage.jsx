import React, { useState, useCallback, useRef, useLayoutEffect } from 'react'
import { detectFocalRegion } from '../../lib/epaper/editorialImageFocal'
import { buildEditorialImageCrop } from '../../lib/epaper/editorialImageCrop'
import styles from './Block08Article.module.css'

function isSameOriginSrc(src) {
  if (!src || typeof window === 'undefined') return false
  try {
    const url = new URL(src, window.location.href)
    return url.origin === window.location.origin
  } catch {
    return false
  }
}

/**
 * BLOCK-06A / BLOCK-08A column photo — width 100%, height auto, max-height cap (no cover crop).
 */
export default function EditorialCropImage({
  image,
  layoutFamily,
  role = 'primary',
  columnHeightPx = 520,
  columnWidthPx = 0,
  maxImageHeightPx = 0,
  fixedImageHeightPx = 0,
  widthPct: widthPctProp = 0,
  article = {},
  apiFocus = '',
  onLoadMetrics,
  onCropReady,
  onFrameHeight,
}) {
  const [crop, setCrop] = useState(null)
  const shellRef = useRef(null)
  const sameOrigin = isSameOriginSrc(image?.src)
  const allowCanvasRef = useRef(sameOrigin)
  const retriedWithoutCorsRef = useRef(false)

  const maxH = Math.round(maxImageHeightPx || fixedImageHeightPx || 0)
  /** Wide blocks pass max height — always natural fit, never object-fit cover. */
  const columnMaxFrame = maxH > 0

  const reportFrameHeight = useCallback(() => {
    const shell = shellRef.current
    if (!shell) return
    const h = Math.ceil(shell.getBoundingClientRect().height)
    if (h > 0) onFrameHeight?.(h)
  }, [onFrameHeight])

  const runCropPipeline = useCallback(
    async (img) => {
      const nw = img.naturalWidth
      const nh = img.naturalHeight
      if (!nw || !nh) return

      onLoadMetrics?.(nw, nh)

      const measuredW = Math.round(shellRef.current?.clientWidth || columnWidthPx || 0)
      const layoutW = measuredW > 40 ? measuredW : columnWidthPx

      const focal = await detectFocalRegion(img, {
        allowCanvas: allowCanvasRef.current,
      })
      const editorial = buildEditorialImageCrop({
        naturalWidth: nw,
        naturalHeight: nh,
        image,
        article,
        layoutFamily,
        role,
        focal,
        columnHeightPx,
        columnWidthPx: layoutW,
        fixedImageHeightPx: maxH,
        widthPct: widthPctProp || undefined,
        maxWidthPct: widthPctProp >= 1 ? 1 : 0.92,
      })

      if (apiFocus && columnMaxFrame && editorial.frameNaturalFit) {
        editorial.objectPosition = apiFocus
      }

      setCrop(editorial)
      onCropReady?.(editorial)

      if (editorial.frameNaturalFit) {
        requestAnimationFrame(() => {
          requestAnimationFrame(reportFrameHeight)
        })
      } else if (editorial.fixedHeightPx > 0) {
        onFrameHeight?.(editorial.fixedHeightPx)
      }
    },
    [
      image,
      layoutFamily,
      role,
      columnHeightPx,
      columnWidthPx,
      maxH,
      widthPctProp,
      article,
      apiFocus,
      onLoadMetrics,
      onCropReady,
      onFrameHeight,
      reportFrameHeight,
    ]
  )

  const handleLoad = useCallback(
    async (e) => {
      await runCropPipeline(e.currentTarget)
    },
    [runCropPipeline]
  )

  const handleError = useCallback(
    (e) => {
      const img = e.currentTarget
      if (!retriedWithoutCorsRef.current && img.crossOrigin) {
        retriedWithoutCorsRef.current = true
        allowCanvasRef.current = false
        img.removeAttribute('crossorigin')
        img.src = image.src
      }
    },
    [image.src]
  )

  useLayoutEffect(() => {
    if (!columnMaxFrame && !crop?.frameNaturalFit) return undefined
    reportFrameHeight()
    const shell = shellRef.current
    if (!shell) return undefined
    const ro = new ResizeObserver(reportFrameHeight)
    ro.observe(shell)
    return () => ro.disconnect()
  }, [columnMaxFrame, crop?.frameNaturalFit, crop?.idealFrameHeightPx, reportFrameHeight])

  const useCors =
    !sameOrigin && allowCanvasRef.current && !retriedWithoutCorsRef.current

  const fullWidth = widthPctProp >= 1 || crop?.widthPct >= 1
  const widthPct = fullWidth ? 1 : widthPctProp || crop?.widthPct || 0.86
  const maxWidthPct = fullWidth ? 1 : crop?.maxWidthPct ?? 0.92
  const naturalFit = columnMaxFrame || crop?.frameNaturalFit === true
  const clamped = !columnMaxFrame && crop?.frameClamped === true
  const shellH = naturalFit ? 0 : crop?.fixedHeightPx || 0

  const frameStyle = {
    width: fullWidth ? '100%' : `${Math.round(widthPct * 100)}%`,
    maxWidth: fullWidth ? '100%' : `${Math.round(maxWidthPct * 100)}%`,
    margin: 0,
  }

  const shellStyle = naturalFit
    ? {
        width: '100%',
        maxHeight: maxH ? `${maxH}px` : undefined,
        overflow: 'hidden',
        lineHeight: 0,
      }
    : shellH
      ? {
          height: `${shellH}px`,
          maxHeight: maxH ? `${maxH}px` : undefined,
          overflow: 'hidden',
          width: '100%',
          lineHeight: 0,
        }
      : {
          width: '100%',
          lineHeight: 0,
        }

  const imgStyle = naturalFit
    ? {
        display: 'block',
        width: '100%',
        height: 'auto',
        maxHeight: maxH ? `${maxH}px` : undefined,
        verticalAlign: 'bottom',
      }
    : {
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: crop?.objectFit || 'cover',
        objectPosition: crop?.objectPosition || apiFocus || '50% top',
        verticalAlign: 'bottom',
      }

  return (
    <figure
      className={`${styles.imageBox} ${styles.editorialFrame} ${styles.imageSnapTop} ${
        naturalFit ? styles.editorialFrameNatural : clamped ? styles.editorialFrameClamped : ''
      } ${crop ? styles[crop.frameClass] : ''}`}
      data-crop-mode={crop?.cropMode || 'pending'}
      data-frame-fit={naturalFit ? 'natural' : clamped ? 'clamped' : 'pending'}
      style={frameStyle}
    >
      <div ref={shellRef} className={styles.imageFrameShell} style={shellStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt={image.alt || ''}
          style={imgStyle}
          crossOrigin={useCors ? 'anonymous' : undefined}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
      {image.caption ? (
        <figcaption className={styles.caption}>{image.caption}</figcaption>
      ) : null}
    </figure>
  )
}
