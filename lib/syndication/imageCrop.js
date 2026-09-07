/**
 * Canvas crop + dual-image composite for syndication cover uploads
 */

export const ASPECT_PRESETS = [
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: '3:2', label: '3:2', ratio: 3 / 2 },
]

export const EXPORT_WIDTH = 1600

export function outputDimensions(aspectRatio) {
  const width = EXPORT_WIDTH
  const height = Math.round(width / aspectRatio)
  return { width, height }
}

export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ image: img, objectUrl: url })
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

export function revokeImageSource(source) {
  if (source?.objectUrl) URL.revokeObjectURL(source.objectUrl)
}

function imageSize(image) {
  return {
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
  }
}

export function computeCoverSourceRect(image, targetW, targetH, pan = { x: 0.5, y: 0.5 }, zoom = 1) {
  const { width: imgW, height: imgH } = imageSize(image)
  const targetAspect = targetW / targetH
  const imgAspect = imgW / imgH

  let drawW
  let drawH
  if (imgAspect > targetAspect) {
    drawH = targetH * zoom
    drawW = drawH * imgAspect
  } else {
    drawW = targetW * zoom
    drawH = drawW / imgAspect
  }

  const panX = pan?.x ?? 0.5
  const panY = pan?.y ?? 0.5
  const offsetX = Math.max(0, drawW - targetW) * panX
  const offsetY = Math.max(0, drawH - targetH) * panY
  const scale = imgW / drawW

  return {
    sx: offsetX * scale,
    sy: offsetY * scale,
    sw: targetW * scale,
    sh: targetH * scale,
  }
}

export function drawCoverCrop(ctx, image, targetW, targetH, pan, zoom) {
  const { sx, sy, sw, sh } = computeCoverSourceRect(image, targetW, targetH, pan, zoom)
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, targetW, targetH)
}

export function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Failed to export image'))
      else resolve(blob)
    }, type, quality)
  })
}

export async function exportSingleCrop(image, aspectRatio, pan, zoom) {
  const { width, height } = outputDimensions(aspectRatio)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  drawCoverCrop(ctx, image, width, height, pan, zoom)
  return canvasToBlob(canvas)
}

export async function exportDualComposite(
  leftImage,
  rightImage,
  aspectRatio,
  leftPan,
  leftZoom,
  rightPan,
  rightZoom,
) {
  const { width, height } = outputDimensions(aspectRatio)
  const halfW = width / 2
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, halfW, height)
  ctx.clip()
  drawCoverCrop(ctx, leftImage, halfW, height, leftPan, leftZoom)
  ctx.restore()

  ctx.save()
  ctx.translate(halfW, 0)
  ctx.beginPath()
  ctx.rect(0, 0, halfW, height)
  ctx.clip()
  drawCoverCrop(ctx, rightImage, halfW, height, rightPan, rightZoom)
  ctx.restore()

  return canvasToBlob(canvas)
}

export function defaultPanZoom() {
  return { pan: { x: 0.5, y: 0.35 }, zoom: 1 }
}
