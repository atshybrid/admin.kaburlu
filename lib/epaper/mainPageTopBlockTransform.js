/**
 * Maps canvas transform gestures → template layer / layout updates.
 */

import { BLOCK_TOP8X7_DIMENSIONS } from './mainPageTopBlockRules'

const clamp = (min, max, v) => Math.min(max, Math.max(min, v))

export const STUDIO_TOOLS = {
  select: { id: 'select', label: 'Select', shortcut: 'V', cursor: 'default' },
  text: { id: 'text', label: 'Text', shortcut: 'T', cursor: 'text' },
  image: { id: 'image', label: 'Image', shortcut: 'I', cursor: 'crosshair' },
  zone: { id: 'zone', label: 'Zones', shortcut: 'Z', cursor: 'cell' },
}

export const TEXT_LAYERS = new Set([
  'dateline',
  'titleKicker',
  'titleMain',
  'subtitleBar',
  'points',
  'lead',
  'callout',
  'bodyLeft',
  'bodyRight',
  'continued',
])

export const IMAGE_LAYERS = new Set(['heroImage'])
export const ZONE_LAYERS = new Set(['heroZone', 'heroTextCol', 'bodyZone'])

export function layerMatchesTool(layerId, tool) {
  if (!layerId) return false
  if (tool === 'text') return TEXT_LAYERS.has(layerId)
  if (tool === 'image') return IMAGE_LAYERS.has(layerId)
  if (tool === 'zone') return ZONE_LAYERS.has(layerId)
  return true
}

export function measureLayerBounds(artboardEl, layerId, nativeW) {
  if (!artboardEl || !layerId) return null
  const el = artboardEl.querySelector(`[data-layer="${layerId}"]`)
  if (!el) return null
  const zoom = artboardEl.getBoundingClientRect().width / nativeW || 1
  const artRect = artboardEl.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  return {
    left: (elRect.left - artRect.left) / zoom,
    top: (elRect.top - artRect.top) / zoom,
    width: elRect.width / zoom,
    height: elRect.height / zoom,
  }
}

/** Move layer by delta (native px). */
export function moveLayerPatch(layerId, dx, dy, template) {
  const nativeH = BLOCK_TOP8X7_DIMENSIONS.nativeHeightPx
  const nativeW = BLOCK_TOP8X7_DIMENSIONS.nativeWidthPx
  const layout = template.layout || {}
  const layer = template.layers?.[layerId] || {}

  if (layerId === 'heroImage') {
    return {
      layout: {
        heroImageRightPx: clamp(-120, 80, (layout.heroImageRightPx ?? 0) - dx),
        heroImageTopPx: clamp(-40, 80, (layout.heroImageTopPx ?? 0) + dy),
      },
    }
  }

  if (layerId === 'quoteMark') {
    return {
      layout: {
        quoteMarkOffsetX: (layout.quoteMarkOffsetX ?? 0) + dx,
        quoteMarkOffsetY: (layout.quoteMarkOffsetY ?? 0) + dy,
      },
    }
  }

  if (layerId === 'heroZone' || layerId === 'bodyZone') {
    const heroShare = layout.heroShare ?? 0.54
    const deltaShare = dy / nativeH
    const next =
      layerId === 'heroZone'
        ? clamp(0.38, 0.68, heroShare + deltaShare)
        : clamp(0.38, 0.68, heroShare - deltaShare)
    return { layout: { heroShare: Math.round(next * 1000) / 1000 } }
  }

  if (layerId === 'heroTextCol') {
    const layers = {}
    for (const id of ['titleKicker', 'titleMain', 'points', 'lead']) {
      const n = nudgeOffset(id, dx, dy, template)
      if (n) layers[id] = n
    }
    return Object.keys(layers).length ? { layers } : {}
  }

  if (!template.layers?.[layerId]) return {}

  return {
    layers: {
      [layerId]: {
        offsetX: Math.round((layer.offsetX ?? 0) + dx),
        offsetY: Math.round((layer.offsetY ?? 0) + dy),
      },
    },
  }
}

function nudgeOffset(layerId, dx, dy, template) {
  const L = template.layers?.[layerId]
  if (!L) return null
  return {
    offsetX: Math.round((L.offsetX ?? 0) + dx),
    offsetY: Math.round((L.offsetY ?? 0) + dy),
  }
}

function handleAxis(handle) {
  const h = String(handle || 'se')
  return {
    width: h.includes('e') || h.includes('w') || /nw|ne|sw|se/.test(h),
    height: h.includes('n') || h.includes('s') || /nw|ne|sw|se/.test(h),
  }
}

/** Resize from new bounds vs start bounds (native px). */
export function resizeLayerPatch(layerId, bounds, startBounds, template, handle = 'se') {
  const nativeW = BLOCK_TOP8X7_DIMENSIONS.nativeWidthPx
  const nativeH = BLOCK_TOP8X7_DIMENSIONS.nativeHeightPx
  const layout = template.layout || {}
  const layer = template.layers?.[layerId] || {}
  const sw = Math.max(8, startBounds.width)
  const sh = Math.max(8, startBounds.height)
  const scale = Math.sqrt((bounds.width / sw) * (bounds.height / sh))
  const axis = handleAxis(handle)

  if (layerId === 'heroImage') {
    const padV = layout.padV ?? 8
    const heroShare = layout.heroShare ?? 0.54
    const heroZoneH = (nativeH - padV * 2) * heroShare
    const layoutPatch = {}
    if (axis.width) {
      layoutPatch.heroImageWidthPct = Math.round(
        clamp(22, 72, (bounds.width / nativeW) * 100)
      )
    }
    if (axis.height) {
      layoutPatch.heroImageHeightPct = Math.round(
        clamp(35, 130, (bounds.height / Math.max(heroZoneH, 1)) * 100)
      )
    }
    if (!Object.keys(layoutPatch).length) return null
    return { layout: layoutPatch }
  }

  if (layerId === 'heroZone') {
    const share = clamp(0.38, 0.68, bounds.height / (nativeH - 16))
    return { layout: { heroShare: Math.round(share * 1000) / 1000 } }
  }

  if (layerId === 'heroTextCol' || layerId === 'titleKicker' || layerId === 'titleMain') {
    const w = Math.round(clamp(280, nativeW - 24, bounds.width))
    return { layout: { titleMaxWidthPx: w, titleMaxWidthPct: null } }
  }

  if (layerId === 'bodyZone') {
    const innerH = nativeH - 16
    const heroShare = clamp(0.38, 0.68, 1 - bounds.height / innerH - 0.02)
    return { layout: { heroShare: Math.round(heroShare * 1000) / 1000 } }
  }

  if (layerId === 'quoteMark') {
    const size = clamp(14, 44, Math.max(bounds.width, bounds.height))
    return {
      layers: {
        quoteMark: {
          style: { ...layer.style, fontSizePx: Math.round(size) },
        },
      },
    }
  }

  if (TEXT_LAYERS.has(layerId)) {
    const startFs = layer.style?.fontSizePx ?? 12
    const nextFs = clamp(8, 96, Math.round(startFs * clamp(0.55, 2.2, scale)))
    const patch = {
      layers: {
        [layerId]: {
          width: Math.round(bounds.width),
          style: { ...layer.style, fontSizePx: nextFs },
        },
      },
    }
    if (layerId === 'titleKicker' || layerId === 'titleMain') {
      patch.layout = {
        titleMaxWidthPx: Math.round(clamp(280, nativeW - 24, bounds.width)),
        titleMaxWidthPct: null,
      }
    }
    return patch
  }

  return null
}

export function mergeTemplatePatch(template, patch) {
  if (!patch) return template
  return {
    ...template,
    layout: patch.layout ? { ...template.layout, ...patch.layout } : template.layout,
    layers: patch.layers
      ? {
          ...template.layers,
          ...Object.fromEntries(
            Object.entries(patch.layers).map(([id, p]) => {
              if (!p) return [id, template.layers[id]]
              return [
                id,
                {
                  ...template.layers[id],
                  ...p,
                  style: p.style
                    ? { ...template.layers[id]?.style, ...p.style }
                    : template.layers[id]?.style,
                },
              ]
            })
          ),
        }
      : template.layers,
  }
}

export function studioOffsetStyle(layer) {
  const ox = layer?.offsetX ?? 0
  const oy = layer?.offsetY ?? 0
  if (!ox && !oy) return undefined
  return { transform: `translate(${ox}px, ${oy}px)` }
}

/** z-index + offset — always position so z-index applies vs hero PNG */
export function studioLayerChrome(layer, { position = 'relative' } = {}) {
  const out = { ...studioOffsetStyle(layer), position }
  const z = layer?.zIndex
  if (z != null) out.zIndex = z
  return out
}
