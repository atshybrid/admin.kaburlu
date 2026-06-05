/**
 * Advanced ePaper PDF export — native 300 DPI render + html2canvas @ scale 1.
 */
import { PDFDocument } from 'pdf-lib'
import { getToken } from '../../utils/auth'
import { PDF_EXPORT_DPI } from './epaperPageSpec'

let html2canvasLib = null

async function getHtml2Canvas() {
  if (typeof window === 'undefined') throw new Error('PDF export runs in browser only')
  if (!html2canvasLib) {
    html2canvasLib = (await import(/* webpackMode: "eager" */ 'html2canvas')).default
  }
  return html2canvasLib
}

const PT_PER_IN = 72

function scaleStyleLength(val, factor) {
  if (!val || typeof val !== 'string') return null
  const trimmed = val.trim()
  if (!trimmed || !/(px|in)/.test(trimmed)) return null
  return trimmed.replace(/([\d.]+)(px|in)/g, (_, num, unit) => {
    const scaled = parseFloat(num) * factor
    const rounded = unit === 'in'
      ? Math.round(scaled * 1000) / 1000
      : Math.round(scaled * 100) / 100
    return `${rounded}${unit}`
  })
}

function scalePxStyle(el, prop, factor) {
  const val = el.style[prop]
  if (!val) return
  const scaled = scaleStyleLength(val, factor)
  if (scaled) el.style[prop] = scaled
}

function walkAndScaleInlineStyles(root, factor) {
  const walk = (el) => {
    if (!(el instanceof HTMLElement)) return
    for (let i = 0; i < el.style.length; i += 1) {
      scalePxStyle(el, el.style[i], factor)
    }
    Array.from(el.children).forEach(walk)
  }
  walk(root)
}

/** Expand header inner to slot px — html2canvas cannot capture transform/zoom reliably. */
function bakeHeaderInner(inner) {
  const scale = parseFloat(inner.getAttribute('data-scale') || '1')
  const nw = parseFloat(inner.getAttribute('data-natural-w') || '0')
  const nh = parseFloat(inner.getAttribute('data-natural-h') || '0')
  if (!scale || scale === 1 || !nw || !nh) return []

  const saved = [{ el: inner, cssText: inner.style.cssText }]
  inner.querySelectorAll('*').forEach((child) => {
    saved.push({ el: child, cssText: child.style.cssText })
  })

  inner.style.transform = 'none'
  inner.style.zoom = '1'
  inner.style.transformOrigin = 'top left'
  inner.style.width = `${Math.round(nw * scale)}px`
  inner.style.height = `${Math.round(nh * scale)}px`
  walkAndScaleInlineStyles(inner, scale)

  // Percent-based Tailwind widths (e.g. w-[18%]) stay relative to baked parent width.
  return saved
}

/** Bake scaled nodes (headers + article blocks) on live DOM before capture. */
export function bakeHeaderTransforms(root) {
  if (!root?.querySelectorAll) return () => {}
  const restores = []
  root.querySelectorAll('[data-epaper-header-inner], [data-epaper-block-inner]').forEach((inner) => {
    restores.push(...bakeHeaderInner(inner))
  })
  return () => {
    restores.forEach(({ el, cssText }) => {
      if (el?.style) el.style.cssText = cssText
    })
  }
}

/** @deprecated use bakeHeaderTransforms */
export function bakeScaledTransforms(root) {
  return bakeHeaderTransforms(root)
}

/** Bake CSS transform headers inside html2canvas clone (backup). */
export function flattenHeaderSlotsInClone(root) {
  if (!root?.querySelectorAll) return
  root.querySelectorAll('[data-epaper-header-inner], [data-epaper-block-inner]').forEach((inner) => {
    bakeHeaderInner(inner)
  })
}

async function waitForFontsReady(timeoutMs = 15000) {
  if (typeof document === 'undefined' || !document.fonts?.ready) return
  await Promise.race([
    document.fonts.ready,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Font load timeout')), timeoutMs)),
  ]).catch(() => {})
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function isExternalUrl(url) {
  try {
    if (typeof window === 'undefined') return true
    return new URL(url, window.location.origin).origin !== window.location.origin
  } catch {
    return true
  }
}

async function fetchImageBlob(url) {
  const authHeaders = {}
  const token = getToken()?.token
  if (token) authHeaders.Authorization = `Bearer ${token}`

  if (isExternalUrl(url)) {
    try {
      const proxy = await fetch(
        `/api/admin/epaper/export-image?url=${encodeURIComponent(url)}`,
        { headers: authHeaders }
      )
      if (proxy.ok) return proxy.blob()
    } catch { /* fall through */ }
  }

  try {
    const direct = await fetch(url, { credentials: 'include' })
    if (direct.ok) return direct.blob()
  } catch { /* ignore */ }

  if (isExternalUrl(url)) {
    try {
      const proxy = await fetch(
        `/api/admin/epaper/export-image?url=${encodeURIComponent(url)}`,
        { headers: authHeaders }
      )
      if (proxy.ok) return proxy.blob()
    } catch { /* ignore */ }
  }
  return null
}

export async function inlineImagesForExport(root) {
  if (!root) return () => {}
  const restores = []
  const imgs = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    imgs.map(async (img) => {
      const src = (img.currentSrc || img.getAttribute('src') || '').trim()
      if (!src || src.startsWith('data:') || src.startsWith('blob:')) return
      try {
        if (!img.complete) {
          await new Promise((res) => { img.onload = res; img.onerror = res })
        }
        const blob = await fetchImageBlob(src)
        if (!blob) return
        const dataUrl = await blobToDataUrl(blob)
        restores.push(() => { img.src = src })
        img.src = dataUrl
        img.removeAttribute('crossorigin')
        if (typeof img.decode === 'function') await img.decode()
      } catch { /* skip */ }
    })
  )
  return () => { restores.forEach((fn) => { try { fn() } catch { /* ignore */ } }) }
}

export function applyCmykSimulation(canvas) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const { width, height } = canvas
  const img = ctx.getImageData(0, 0, width, height)
  const d = img.data
  const CHUNK = 65536
  for (let start = 0; start < d.length; start += CHUNK * 4) {
    const end = Math.min(d.length, start + CHUNK * 4)
    for (let i = start; i < end; i += 4) {
      const r = d[i] / 255
      const g = d[i + 1] / 255
      const b = d[i + 2] / 255
      const k = 1 - Math.max(r, g, b)
      if (k >= 0.999) {
        d[i] = 0; d[i + 1] = 0; d[i + 2] = 0
      } else {
        const c = (1 - r - k) / (1 - k)
        const m = (1 - g - k) / (1 - k)
        const y = (1 - b - k) / (1 - k)
        d[i] = Math.round((1 - c) * (1 - k) * 255)
        d[i + 1] = Math.round((1 - m) * (1 - k) * 255)
        d[i + 2] = Math.round((1 - y) * (1 - k) * 255)
      }
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

function canvasToPngBytes(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { reject(new Error('Canvas export failed')); return }
      resolve(new Uint8Array(await blob.arrayBuffer()))
    }, 'image/png', 1.0)
  })
}

/** Wait until a React ref is attached (e.g. export portal after flushSync). */
export function waitForExportRef(ref, timeoutMs = 15000) {
  if (ref?.current) return Promise.resolve(ref.current)
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const check = () => {
      if (ref?.current) {
        resolve(ref.current)
        return
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('Export canvas failed to mount'))
        return
      }
      requestAnimationFrame(check)
    }
    check()
  })
}

/** Wait until canvas renders at native export pixel size. */
export function waitForExportCanvas(el, targetW, targetH, timeoutMs = 15000) {
  if (!el) return Promise.reject(new Error('Page canvas not found'))
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const check = () => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (Math.abs(w - targetW) <= 3 && Math.abs(h - targetH) <= 3) {
        resolve({ width: w, height: h })
        return
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Export canvas ${w}×${h}px — expected ${targetW}×${targetH}px`))
        return
      }
      requestAnimationFrame(check)
    }
    check()
  })
}

export function waitForCanvasReady(el, timeoutMs = 8000) {
  if (!el) return Promise.reject(new Error('Page canvas not found'))
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const check = () => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (w > 100 && h > 100) {
        resolve({ width: w, height: h })
        return
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Export canvas not visible (${w}×${h}px)`))
        return
      }
      requestAnimationFrame(check)
    }
    check()
  })
}

export async function preloadExportImages(root) {
  await inlineImagesForExport(root)
}

function prepareClone(clonedEl) {
  flattenHeaderSlotsInClone(clonedEl)
  const page = clonedEl.querySelector?.('[data-epaper-page-canvas]') || clonedEl
  if (page?.style) {
    page.style.boxShadow = 'none'
    page.style.border = 'none'
  }
  clonedEl.querySelectorAll?.('[data-export-hide]').forEach((node) => {
    node.style.visibility = 'hidden'
  })
}

/**
 * Capture studio canvas at 300 DPI.
 * Native-size export (4500×6825) uses scale 1; screen preview upscales.
 */
export async function captureNodeToPng(el, colorMode = 'RGB', pageSpec = null) {
  if (typeof window === 'undefined') throw new Error('PDF export runs in browser only')
  if (!el) throw new Error('Page canvas not found')

  const exportDpi = pageSpec?.exportDpi || PDF_EXPORT_DPI
  const targetW = pageSpec?.pixelSize?.width ?? Math.round((pageSpec?.widthIn || 15) * exportDpi)
  const targetH = pageSpec?.pixelSize?.height ?? Math.round((pageSpec?.heightIn || 22.75) * exportDpi)

  const isNativeExport = el.getAttribute?.('data-native-export') === '1'
  if (isNativeExport) {
    await waitForExportCanvas(el, targetW, targetH)
  } else {
    await waitForCanvasReady(el)
  }

  await waitForFontsReady()
  const restoreImages = await inlineImagesForExport(el)
  const restoreHeaders = bakeHeaderTransforms(el)

  const displayW = el.offsetWidth
  const displayH = el.offsetHeight
  const isNativeSize = Math.abs(displayW - targetW) <= 4 && Math.abs(displayH - targetH) <= 4
  const captureScale = isNativeSize ? 1 : Math.max(1, targetW / displayW)

  try {
    const html2canvas = await getHtml2Canvas()
    const canvas = await html2canvas(el, {
      scale: captureScale,
      width: displayW,
      height: displayH,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 30000,
      scrollX: 0,
      scrollY: 0,
      windowWidth: displayW,
      windowHeight: displayH,
      onclone: (_doc, clonedEl) => prepareClone(clonedEl),
    })

    const out = document.createElement('canvas')
    out.width = targetW
    out.height = targetH
    const ctx = out.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, targetW, targetH)
    ctx.imageSmoothingEnabled = false
    if (canvas.width === targetW && canvas.height === targetH) {
      ctx.drawImage(canvas, 0, 0)
    } else {
      ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, targetW, targetH)
    }
    if (colorMode === 'CMYK') applyCmykSimulation(out)
    return canvasToPngBytes(out)
  } finally {
    restoreHeaders()
    restoreImages()
  }
}

function yieldToMainThread(ms = 120) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function createExportPdfDoc(pageSpec, colorMode = 'RGB', editionLabel = 'epaper') {
  const pdfDoc = await PDFDocument.create()
  const exportDpi = pageSpec.exportDpi || PDF_EXPORT_DPI
  pdfDoc.setTitle(`${editionLabel || pageSpec.label || 'ePaper'} — ${colorMode}`)
  pdfDoc.setProducer('Kaburlu ePaper Design Studio')
  pdfDoc.setCreator(`Export ${exportDpi} DPI · ${colorMode}`)
  return pdfDoc
}

export async function appendPngPageToPdf(pdfDoc, pngBytes, pageSpec) {
  const pageW = pageSpec.widthIn * PT_PER_IN
  const pageH = pageSpec.heightIn * PT_PER_IN
  const img = await pdfDoc.embedPng(pngBytes)
  const page = pdfDoc.addPage([pageW, pageH])
  page.drawImage(img, { x: 0, y: 0, width: pageW, height: pageH })
}

export async function finalizeExportPdf(pdfDoc) {
  return pdfDoc.save()
}

/** @deprecated Prefer createExportPdfDoc + appendPngPageToPdf + finalizeExportPdf (lower memory). */
export async function buildPdfFromPngPages(pngPages, pageSpec, colorMode = 'RGB') {
  const pdfDoc = await createExportPdfDoc(pageSpec, colorMode, pageSpec.label)
  for (let i = 0; i < pngPages.length; i += 1) {
    await appendPngPageToPdf(pdfDoc, pngPages[i], pageSpec)
  }
  return finalizeExportPdf(pdfDoc)
}

export { yieldToMainThread }

export function downloadPdfBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportFilename(editionLabel, colorMode, dpi = PDF_EXPORT_DPI) {
  const safe = String(editionLabel || 'epaper').replace(/[^\w\-]+/g, '_').slice(0, 40)
  const stamp = new Date().toISOString().slice(0, 10)
  return `${safe}_${colorMode}_${dpi}dpi_${stamp}.pdf`
}
