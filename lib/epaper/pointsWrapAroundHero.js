/**
 * Quark-style runaround: points wrap at PNG subject (alpha), not the image box.
 */

function parseObjectPosition(pos = 'bottom right') {
  const parts = String(pos).trim().split(/\s+/)
  let x = 'right'
  let y = 'bottom'
  if (parts.length === 1) {
    if (['top', 'center', 'bottom'].includes(parts[0])) y = parts[0]
    else x = parts[0]
  } else {
    ;[x, y] = parts
  }
  const xPct = x === 'left' ? 0 : x === 'center' ? 0.5 : 1
  const yPct = y === 'top' ? 0 : y === 'center' ? 0.5 : 1
  return { xPct, yPct }
}

/** Hero frame box (where PNG is laid out) in hero-zone coordinates. */
export function computeHeroImageBoxRect(zoneW, metrics, layout = {}) {
  const w = metrics.heroImageWpx || 0
  const h = metrics.heroImageHpx || 0
  const rightPx = layout.heroImageRightPx ?? 0
  const topPx = layout.heroImageTopPx ?? 0
  const left = Math.round(zoneW - w + 4 - rightPx)
  return {
    left,
    top: topPx,
    width: w,
    height: h,
    right: left + w,
    bottom: topPx + h,
  }
}

/** Painted bitmap rect inside the frame (object-fit contain / cover / fill). */
export function computeContainedPaintRect(
  box,
  naturalW,
  naturalH,
  objectFit = 'contain',
  objectPosition = 'bottom right'
) {
  if (!box?.width || !box?.height) return box
  if (!naturalW || !naturalH || objectFit === 'fill') {
    return { ...box }
  }

  const boxAspect = box.width / box.height
  const imgAspect = naturalW / naturalH
  let pw
  let ph

  if (objectFit === 'cover') {
    if (imgAspect > boxAspect) {
      ph = box.height
      pw = ph * imgAspect
    } else {
      pw = box.width
      ph = pw / imgAspect
    }
  } else {
    if (imgAspect > boxAspect) {
      pw = box.width
      ph = pw / imgAspect
    } else {
      ph = box.height
      pw = ph * imgAspect
    }
  }

  const { xPct, yPct } = parseObjectPosition(objectPosition)
  const left = box.left + (box.width - pw) * xPct
  const top = box.top + (box.height - ph) * yPct
  return {
    left,
    top,
    width: pw,
    height: ph,
    right: left + pw,
    bottom: top + ph,
  }
}

function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('no document'))
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = url
  })
}

/**
 * Per scanline: leftmost opaque pixel in hero-zone X (or paint.right if row is transparent).
 */
export async function buildSubjectWrapProfile(
  imageUrl,
  paintRect,
  {
    alphaThreshold = 32,
    flipH = false,
    flipV = false,
    sampleW = 0,
    sampleH = 0,
  } = {}
) {
  if (!imageUrl || !paintRect?.width || !paintRect?.height) return null

  const w = Math.max(8, Math.round(sampleW || paintRect.width))
  const h = Math.max(8, Math.round(sampleH || paintRect.height))

  let img
  try {
    img = await loadImageElement(imageUrl)
  } catch {
    return null
  }

  if (typeof document === 'undefined') return null

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h).data

  const isSubject = (r, g, b, a) => {
    if (a < alphaThreshold) return false
    if (r >= 250 && g >= 250 && b >= 250) return false
    if (r >= 240 && g >= 240 && b >= 240 && a < 250) return false
    return true
  }

  const rowCount = h
  const subjectLeftByRow = new Float32Array(rowCount)
  const scaleX = paintRect.width / w

  for (let row = 0; row < rowCount; row++) {
    const srcRow = flipV ? rowCount - 1 - row : row
    let leftOpaque = w

    for (let col = 0; col < w; col++) {
      const srcCol = flipH ? w - 1 - col : col
      const i = (srcRow * w + srcCol) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]
      if (isSubject(r, g, b, a)) {
        leftOpaque = Math.min(leftOpaque, col)
      }
    }

    if (leftOpaque >= w) {
      subjectLeftByRow[row] = paintRect.right
    } else {
      subjectLeftByRow[row] = paintRect.left + leftOpaque * scaleX
    }
  }

  const rowH = paintRect.height / rowCount

  return {
    paintRect,
    subjectLeftAt(y) {
      if (y < paintRect.top - rowH || y > paintRect.bottom + rowH) {
        return null
      }
      const idx = Math.min(
        rowCount - 1,
        Math.max(0, Math.floor((y - paintRect.top) / rowH))
      )
      return subjectLeftByRow[idx]
    },
  }
}

function measureTextWidth(text, fontSizePx, fontFamily = 'Mandali, sans-serif') {
  const s = String(text)
  if (!s) return 0
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.font = `700 ${fontSizePx}px ${fontFamily}`
      return ctx.measureText(s).width
    }
  }
  return s.length * fontSizePx * 0.52
}

/**
 * Wrap one bullet; lines break before subject silhouette at that Y.
 */
export function wrapPointParagraph(
  text,
  zoneW,
  {
    fontSizePx = 13,
    lineHeight = 1.38,
    subjectProfile = null,
    excludeRect = null,
    gapPx = 12,
    indentPx = 20,
    startY = 0,
    fontFamily = 'Mandali, sans-serif',
  } = {}
) {
  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!words.length) return { text: '', endY: startY }

  const lineH = fontSizePx * lineHeight
  const lines = []
  let current = []
  let lineY = startY

  const availableWidthAt = (y0) => {
    const yMid = y0 + lineH * 0.5
    if (subjectProfile?.subjectLeftAt) {
      const edge = subjectProfile.subjectLeftAt(yMid)
      if (edge != null) {
        return Math.max(72, edge - gapPx - indentPx)
      }
    }
    if (excludeRect) {
      const y1 = y0 + lineH
      if (y1 > excludeRect.top && y0 < excludeRect.bottom) {
        return Math.max(72, excludeRect.left - gapPx - indentPx)
      }
    }
    return zoneW - indentPx - 8
  }

  while (words.length || current.length) {
    if (!words.length) {
      lines.push(current.join(' '))
      break
    }
    const nextWord = words[0]
    const trial = current.length ? `${current.join(' ')} ${nextWord}` : nextWord
    const maxW = availableWidthAt(lineY)
    const w = measureTextWidth(trial, fontSizePx, fontFamily) + indentPx

    if (w <= maxW || !current.length) {
      current.push(words.shift())
    } else {
      lines.push(current.join(' '))
      current = []
      lineY += lineH
    }
  }

  const endY = lineY + lineH
  return { text: lines.join('\n'), endY }
}

/** Vertical offset in hero zone where the points list begins (below titles). */
export function estimatePointsStartY(
  titleKicker,
  titleMain,
  metrics = {},
  { dateline = '', style2 = false } = {}
) {
  let y = 8
  if (style2 && dateline) {
    y += Math.ceil((metrics.datelinePx ?? 13) * 1.2) + 4
  }
  if (style2 && titleMain) {
    y += Math.ceil((metrics.titleMainPx ?? 64) * 1.04) + 4
  }
  if (style2 && titleKicker) {
    y += Math.ceil((metrics.subtitleBarPx ?? 15) * 1.35) + 10
  }
  if (!style2) {
    if (titleKicker) {
      y += Math.ceil((metrics.titleKickerPx ?? 22) * 1.12) + 4
    }
    if (titleMain) {
      y += Math.ceil((metrics.titleMainPx ?? 52) * 1.06) + 6
    }
  }
  return y + 10
}

export function wrapPointsAroundHero(
  points,
  zoneW,
  metrics,
  layout,
  subjectProfile = null,
  pointsStartY = 0
) {
  if (!points?.length) return []

  const box = computeHeroImageBoxRect(zoneW, metrics, layout)
  const exclude = computeContainedPaintRect(
    box,
    subjectProfile?.naturalW,
    subjectProfile?.naturalH,
    layout.heroImageObjectFit || 'contain',
    layout.heroImageObjectPosition || 'bottom right'
  )

  const fontSizePx = metrics.pointsPx ?? 13
  const gapPx = layout.heroTextGapPx ?? 12
  let cursorY = pointsStartY + 10
  const out = []

  for (const pt of points) {
    const { text, endY } = wrapPointParagraph(pt, zoneW, {
      fontSizePx,
      lineHeight: 1.38,
      subjectProfile,
      excludeRect: subjectProfile ? null : exclude,
      gapPx,
      startY: cursorY,
    })
    out.push(text)
    cursorY = endY + fontSizePx * 0.35
  }

  return out
}
