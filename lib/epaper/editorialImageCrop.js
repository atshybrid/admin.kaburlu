/**
 * Editorial crop engine — QuarkXPress-style treatment for newspaper photos.
 */

import { detectImageShape, matchImageSubject } from './editorialImageSubject'
import { LAYOUT_FAMILIES } from './block08VisualAnalysis'
import { resolveEditorialColumnImageFrame } from './editorialColumnImageFrame'

const HEIGHT_RULES = {
  'portrait-tight': { min: 0.45, max: 0.6 },
  'torso-political': { min: 0.45, max: 0.58 },
  'group-center': { min: 0.25, max: 0.4 },
  'compact-safe': { min: 0.28, max: 0.38 },
  'square-balanced': { min: 0.3, max: 0.45 },
  panoramic: { min: 0.38, max: 0.48 },
  primary: { min: 0.4, max: 0.55 },
}

const WIDTH_RULES = {
  'portrait-tight': { min: 0.7, max: 0.85 },
  'torso-political': { min: 0.75, max: 0.85 },
  'group-center': { min: 0.9, max: 1 },
  'compact-safe': { min: 0.72, max: 0.82 },
  'square-balanced': { min: 0.85, max: 1 },
  panoramic: { min: 1, max: 1 },
  primary: { min: 0.78, max: 0.9 },
}

const FRAME_ASPECT = {
  'portrait-tight': 3 / 4,
  'torso-political': 4 / 5,
  'group-center': 5 / 4,
  'compact-safe': 5 / 4,
  'square-balanced': 1,
  panoramic: 16 / 9,
  primary: 4 / 3,
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v))
}

/** Landscape / group collage — must not use a narrow vertical strip crop. */
function isWideColumnPhoto(nw, nh) {
  const w = Math.max(1, nw)
  const h = Math.max(1, nh)
  return w / h >= 1.12
}

/** Many faces spread across frame (blood-donation collage, event grid). */
function isMultiFaceSpread(faces = []) {
  if (!faces?.length) return false
  if (faces.length >= 3) return true
  let minX = 1
  let minY = 1
  let maxX = 0
  let maxY = 0
  for (const f of faces) {
    minX = Math.min(minX, f.x ?? 0)
    minY = Math.min(minY, f.y ?? 0)
    maxX = Math.max(maxX, (f.x ?? 0) + (f.width ?? 0))
    maxY = Math.max(maxY, (f.y ?? 0) + (f.height ?? 0))
  }
  const area = Math.max(0, maxX - minX) * Math.max(0, maxY - minY)
  return area >= 0.42
}

function resolveCropMode({ imageShape, imageSubject, layoutFamily, role, faceCount = 0 }) {
  if ((imageSubject === 'crime' || imageSubject === 'event') && faceCount >= 2) {
    return 'group-center'
  }
  if (imageSubject === 'sensitive' || imageSubject === 'crime') return 'compact-safe'
  if (layoutFamily === LAYOUT_FAMILIES.WIDE || imageShape === 'landscape' || role === 'banner') {
    return 'panoramic'
  }
  if (imageShape === 'square' && imageSubject === 'symbolic') {
    return 'square-balanced'
  }
  if (imageSubject === 'event' || imageSubject === 'crowd') return 'group-center'
  if (imageSubject === 'politician' || imageSubject === 'emotional') return 'torso-political'
  if (imageShape === 'portrait') return 'portrait-tight'
  if (role === 'side') return 'compact-safe'
  return 'primary'
}

function resolveHeightRule(cropMode) {
  return HEIGHT_RULES[cropMode] || HEIGHT_RULES.primary
}

function resolveWidthRule(cropMode) {
  return WIDTH_RULES[cropMode] || WIDTH_RULES.primary
}

/** Tight crop around detected faces — trims empty top/bottom (group / event photos). */
export function computeFaceGroupCropBox(faces, frameAspect) {
  if (!faces?.length) return null

  let minX = 1
  let minY = 1
  let maxX = 0
  let maxY = 0
  for (const f of faces) {
    minX = Math.min(minX, f.x ?? 0)
    minY = Math.min(minY, f.y ?? 0)
    maxX = Math.max(maxX, (f.x ?? 0) + (f.width ?? 0))
    maxY = Math.max(maxY, (f.y ?? 0) + (f.height ?? 0))
  }

  const padX = 0.14
  const padTop = 0.1
  const padBottom = 0.14

  let cropW = Math.min(1, maxX - minX + padX * 2)
  let cropH = Math.min(1, maxY - minY + padTop + padBottom)
  let cropX = Math.max(0, minX - padX)
  let cropY = Math.max(0, minY - padTop)

  if (cropW / cropH > frameAspect) {
    cropH = cropW / frameAspect
    cropY = Math.max(0, Math.min(cropY, 1 - cropH))
  } else {
    cropW = cropH * frameAspect
    cropX = Math.max(0, Math.min(cropX, 1 - cropW))
  }

  if (cropX + cropW > 1) cropX = 1 - cropW
  if (cropY + cropH > 1) cropY = 1 - cropH

  cropW = Math.max(0.42, Math.min(1, cropW))
  cropH = Math.max(0.48, Math.min(1, cropH))

  if (faces.length >= 3) {
    cropW = Math.min(1, Math.max(cropW, 0.94))
    cropH = Math.min(1, Math.max(cropH, 0.88))
    cropX = Math.max(0, (1 - cropW) / 2)
    cropY = Math.max(0, (1 - cropH) / 2)
  }

  return { x: cropX, y: cropY, width: cropW, height: cropH }
}

export function computeEditorialCropBox(
  naturalWidth,
  naturalHeight,
  frameAspect,
  focal,
  cropMode
) {
  const nw = Math.max(1, naturalWidth)
  const nh = Math.max(1, naturalHeight)
  const imgAspect = nw / nh
  const targetAspect = frameAspect

  if (
    imgAspect >= 1.12 &&
    (cropMode === 'group-center' || cropMode === 'panoramic' || cropMode === 'primary')
  ) {
    const cropH = Math.min(1, imgAspect / targetAspect)
    const cropY = cropH >= 1 ? 0 : clamp01(0.5 - cropH / 2)
    return { x: 0, y: cropY, width: 1, height: Math.max(cropH, 0.55) }
  }

  let cropW
  let cropH
  if (imgAspect >= targetAspect) {
    cropH = 1
    cropW = (targetAspect * nh) / nw
  } else {
    cropW = 1
    cropH = nw / (targetAspect * nh)
  }

  if (cropMode === 'portrait-tight') {
    cropH = Math.min(cropH, 0.68)
    cropW = Math.min(cropW, (targetAspect * nh) / nw)
  } else if (cropMode === 'torso-political') {
    cropH = Math.min(cropH, 0.75)
  } else if (cropMode === 'compact-safe') {
    cropH = Math.min(cropH, 0.62)
  } else if (cropMode === 'panoramic') {
    cropH = Math.min(cropH, 0.88)
    cropW = 1
  } else if (cropMode === 'group-center') {
    if (imgAspect < 1.12) {
      cropH = Math.min(cropH, 0.78)
      cropW = Math.min(cropW, 0.9)
    }
  } else if (cropMode === 'square-balanced') {
    cropH = Math.min(cropH, 0.85)
    cropW = Math.min(cropW, 0.92)
  }

  cropW = Math.max(0.32, Math.min(1, cropW))
  cropH = Math.max(0.32, Math.min(1, cropH))

  const fx = clamp01(focal?.x ?? 0.5)
  const fy = clamp01(focal?.y ?? 0.35)
  const verticalAnchor =
    cropMode === 'panoramic' ? 0.45 : cropMode === 'group-center' ? 0.42 : 0.32

  let x = fx - cropW / 2
  let y = fy - cropH * verticalAnchor

  x = clamp01(x)
  y = clamp01(y)
  if (x + cropW > 1) x = 1 - cropW
  if (y + cropH > 1) y = 1 - cropH

  return { x, y, width: cropW, height: cropH }
}

export function cropBoxToObjectPosition(cropBox) {
  const cx = clamp01(cropBox.x + cropBox.width / 2)
  const cy = clamp01(cropBox.y + cropBox.height / 2)
  return `${Math.round(cx * 100)}% ${Math.round(cy * 100)}%`
}

export function buildEditorialImageCrop(params) {
  const fixedFramePx = Math.round(params.fixedImageHeightPx || 0)
  const nw = params.naturalWidth || 1
  const nh = params.naturalHeight || 1
  const imageShape = params.imageShape || detectImageShape(nw, nh)
  const imageSubject =
    params.imageSubject || matchImageSubject(params.image || {}, params.article || {})
  const layoutFamily = params.layoutFamily || LAYOUT_FAMILIES.TEXTHEAVY
  const role = params.role || 'primary'
  const columnHeightPx = params.columnHeightPx || 520
  const columnWidthPx = params.columnWidthPx || 0
  const focal = params.focal || { x: 0.5, y: 0.35, confidence: 0.2, faces: [] }

  const cropMode = resolveCropMode({
    imageShape,
    imageSubject,
    layoutFamily,
    role,
    faceCount: focal.faces?.length || 0,
  })
  const isNearlySquare = nw / nh > 0.88 && nw / nh < 1.12
  const frameAspect =
    fixedFramePx > 0
      ? isNearlySquare && imageShape === 'square'
        ? 1
        : 4 / 3
      : FRAME_ASPECT[cropMode] || 4 / 3
  const heightRule = resolveHeightRule(cropMode)
  const widthRule = resolveWidthRule(cropMode)

  const maxHeightPct = heightRule.max
  let widthPct = (widthRule.min + widthRule.max) / 2
  let maxHeightPx = Math.round(columnHeightPx * maxHeightPct)
  let minHeightPx = Math.round(columnHeightPx * heightRule.min)

  if (fixedFramePx > 0) {
    maxHeightPx = fixedFramePx
    minHeightPx = fixedFramePx
    widthPct = params.widthPct ?? 1
  }

  const faceCount = focal.faces?.length || 0
  const widePhoto = isWideColumnPhoto(nw, nh)
  const spreadFaces = isMultiFaceSpread(focal.faces)
  const useLooseFaceFrame =
    fixedFramePx > 0 && (faceCount >= 1 || widePhoto || spreadFaces)
  const skipTightFaceCrop =
    spreadFaces || widePhoto || cropMode === 'group-center' || cropMode === 'panoramic'

  let cropBox =
    faceCount >= 1 && !useLooseFaceFrame && !skipTightFaceCrop
      ? computeFaceGroupCropBox(focal.faces, frameAspect)
      : null
  if (!cropBox) {
    cropBox = computeEditorialCropBox(nw, nh, frameAspect, focal, cropMode)
  }
  let objectPosition = cropBoxToObjectPosition(cropBox)
  if ((useLooseFaceFrame || widePhoto || spreadFaces) && fixedFramePx <= 0) {
    const fy = clamp01(focal.y ?? 0.42)
    objectPosition = `${Math.round(clamp01(focal.x ?? 0.5) * 100)}% ${Math.round(fy * 100)}%`
  }

  let objectFit = 'cover'
  let fitInsideFrame = false
  let autoFrameHeightPx = 0

  let frameClamped = false
  let frameNaturalFit = false

  if (fixedFramePx > 0) {
    const columnFrame = resolveEditorialColumnImageFrame({
      naturalWidth: nw,
      naturalHeight: nh,
      columnWidthPx,
      maxHeightPx: fixedFramePx,
      minHeightPx: 72,
    })
    frameClamped = false
    frameNaturalFit = true
    autoFrameHeightPx = columnFrame.displayHeightPx
    objectFit = 'block'
    objectPosition = '50% 50%'
    cropBox = { x: 0, y: 0, width: 1, height: 1 }
    widthPct = params.widthPct ?? 1
  }

  if (fixedFramePx <= 0) {
    if (columnWidthPx > 40) {
      const frameW = columnWidthPx * widthPct
      const idealH = frameW / frameAspect
      if (idealH < minHeightPx) {
        minHeightPx = Math.round(Math.min(maxHeightPx, idealH * 1.02))
      }
      if (frameW < columnWidthPx * 0.72) {
        widthPct = Math.min(0.92, widthPct + 0.08)
      }
    }

    widthPct = Math.min(0.92, Math.max(widthRule.min, widthPct))

    if (focal.faces?.length && nh / nw < 0.72) {
      minHeightPx = Math.max(minHeightPx, Math.round(columnHeightPx * 0.34))
    }
  } else if (fixedFramePx <= 0) {
    widthPct = Math.min(params.maxWidthPct ?? 0.92, params.widthPct ?? widthPct)
  } else {
    widthPct = params.widthPct ?? 1
  }

  return {
    cropMode,
    imageShape,
    imageSubject,
    cropBox,
    objectPosition,
    objectFit,
    fitInsideFrame,
    aspectRatio: frameAspect,
    frameAspectCss: `${frameAspect}`,
    fixedHeightPx: frameNaturalFit ? 0 : autoFrameHeightPx || (fixedFramePx > 0 ? fixedFramePx : 0),
    maxFrameHeightPx: fixedFramePx > 0 ? fixedFramePx : 0,
    frameClamped,
    frameNaturalFit,
    idealFrameHeightPx: autoFrameHeightPx,
    maxHeightPx,
    minHeightPx,
    maxHeightPct,
    widthPct,
    maxWidthPct: params.maxWidthPct ?? 0.92,
    fillColumnWidth: widthPct >= 0.88,
    snapTop: true,
    frameClass: `editorial-${cropMode}`,
    focal,
    captionGapPx: 3,
  }
}

/** Alias for pipeline docs */
export function computeEditorialCrop(params) {
  return buildEditorialImageCrop(params)
}
