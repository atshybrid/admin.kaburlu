/**
 * Focal-region detection for editorial crops (browser canvas + optional MediaPipe).
 */

const MP_FACE_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
const MP_FACE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'

let faceDetectorPromise = null

async function tryMediaPipeFaces(imgEl) {
  if (typeof window === 'undefined') return []
  try {
    const vision = await import('@mediapipe/tasks-vision')
    if (!faceDetectorPromise) {
      const { FaceDetector, FilesetResolver } = vision
      faceDetectorPromise = (async () => {
        const fileset = await FilesetResolver.forVisionTasks(MP_FACE_CDN)
        return FaceDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MP_FACE_MODEL },
          runningMode: 'IMAGE',
          minDetectionConfidence: 0.45,
        })
      })()
    }
    const detector = await faceDetectorPromise
    const result = detector.detect(imgEl)
    const boxes = result?.detections || []
    return boxes.map((d) => {
      const b = d.boundingBox
      const nw = imgEl.naturalWidth || 1
      const nh = imgEl.naturalHeight || 1
      return {
        x: (b.originX || 0) / nw,
        y: (b.originY || 0) / nh,
        width: (b.width || 0) / nw,
        height: (b.height || 0) / nh,
        score: d.categories?.[0]?.score ?? 0.5,
      }
    })
  } catch {
    return []
  }
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v))
}

function isSkinPixel(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max < 40 || min > 230) return false
  if (r > 95 && g > 40 && b > 20 && max - min > 15 && Math.abs(r - g) > 15 && r > g && r > b) {
    return true
  }
  return false
}

/** Aspect-based focal when canvas/CORS analysis is unavailable. */
export function heuristicFocalFromShape(naturalWidth, naturalHeight) {
  const nw = naturalWidth || 1
  const nh = naturalHeight || 1
  const aspect = nw / nh
  if (aspect < 0.8) {
    return { x: 0.5, y: 0.32, confidence: 0.35, faces: [] }
  }
  if (aspect > 1.25) {
    return { x: 0.5, y: 0.48, confidence: 0.3, faces: [] }
  }
  return { x: 0.5, y: 0.38, confidence: 0.28, faces: [] }
}

/**
 * Canvas saliency + skin-tone centroid (requires CORS-safe image).
 */
function computeCanvasFocal(imgEl) {
  const nw = imgEl.naturalWidth || 1
  const nh = imgEl.naturalHeight || 1
  const sampleW = 48
  const sampleH = Math.max(24, Math.round(sampleW * (nh / nw)))

  const canvas = document.createElement('canvas')
  canvas.width = sampleW
  canvas.height = sampleH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return heuristicFocalFromShape(nw, nh)

  try {
    ctx.drawImage(imgEl, 0, 0, sampleW, sampleH)
  } catch {
    return heuristicFocalFromShape(nw, nh)
  }

  let data
  try {
    ;({ data } = ctx.getImageData(0, 0, sampleW, sampleH))
  } catch {
    return heuristicFocalFromShape(nw, nh)
  }

  let skinX = 0
  let skinY = 0
  let skinN = 0
  let varX = 0
  let varY = 0
  let varW = 0

  for (let y = 0; y < sampleH; y++) {
    for (let x = 0; x < sampleW; x++) {
      const i = (y * sampleW + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const lum = 0.299 * r + 0.587 * g + 0.114 * b
      const nx = x / sampleW
      const ny = y / sampleH

      if (isSkinPixel(r, g, b) && ny < 0.72) {
        skinX += nx
        skinY += ny
        skinN += 1
      }

      const edge =
        x > 0 && y > 0
          ? Math.abs(lum - (0.299 * data[i - 4] + 0.587 * data[i - 3] + 0.114 * data[i - 2]))
          : 0
      const weight = edge + (1 - Math.abs(nx - 0.5)) * 0.15
      varX += nx * weight
      varY += ny * weight
      varW += weight
    }
  }

  if (skinN > sampleW * 2) {
    return {
      x: clamp01(skinX / skinN),
      y: clamp01(skinY / skinN - 0.06),
      confidence: Math.min(0.75, 0.35 + skinN / (sampleW * sampleH)),
      faces: [],
    }
  }

  if (varW > 0) {
    return {
      x: clamp01(varX / varW),
      y: clamp01(varY / varW),
      confidence: 0.35,
      faces: [],
    }
  }

  return { x: 0.5, y: 0.38, confidence: 0.2, faces: [] }
}

/**
 * @param {HTMLImageElement} imgEl
 * @param {{ allowCanvas?: boolean }} [opts] — false when image is cross-origin without CORS
 */
export async function detectFocalRegion(imgEl, opts = {}) {
  const nw = imgEl?.naturalWidth || 0
  const nh = imgEl?.naturalHeight || 0
  if (!nw || !nh) {
    return { x: 0.5, y: 0.38, confidence: 0.1, faces: [] }
  }

  if (opts.allowCanvas !== false) {
    const faces = await tryMediaPipeFaces(imgEl)
    if (faces.length) {
      const primary = faces.reduce((best, f) =>
        f.width * f.height > (best?.width || 0) * (best?.height || 0) ? f : best
      , faces[0])
      return {
        x: clamp01(primary.x + primary.width / 2),
        y: clamp01(primary.y + primary.height * 0.32),
        confidence: Math.min(0.95, primary.score || 0.85),
        faces,
      }
    }
  }

  if (typeof document !== 'undefined' && opts.allowCanvas !== false) {
    return computeCanvasFocal(imgEl)
  }

  return heuristicFocalFromShape(nw, nh)
}
