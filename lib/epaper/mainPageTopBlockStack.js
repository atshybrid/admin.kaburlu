/**
 * Layer stack (z-index) — InDesign-style arrange forward / backward.
 */

import { MAIN_PAGE_TOP_LAYER_IDS } from './mainPageTopBlockRules'

export const ARRANGE_ACTIONS = {
  forward: 'forward',
  backward: 'backward',
  front: 'front',
  back: 'back',
}

/** Layers that can be reordered in the hero stack (title behind PNG). */
export const ARRANGEABLE_LAYER_IDS = [
  'dateline',
  'titleKicker',
  'titleMain',
  'subtitleBar',
  'points',
  'lead',
  'heroImage',
  'callout',
  'quoteMark',
]

const DEFAULT_Z_INDEX = {
  titleKicker: 2,
  titleMain: 3,
  points: 5,
  lead: 5,
  heroImage: 12,
  quoteMark: 6,
  bodyLeft: 4,
  bodyRight: 4,
  continued: 4,
}

export function getLayerZIndex(template, layerId) {
  const z = template?.layers?.[layerId]?.zIndex
  if (z != null) return z
  return DEFAULT_Z_INDEX[layerId] ?? 5
}

export function getStackOrder(template) {
  const present = ARRANGEABLE_LAYER_IDS.filter((id) => template?.layers?.[id])
  return [...present].sort((a, b) => getLayerZIndex(template, a) - getLayerZIndex(template, b))
}

function orderToZPatch(order) {
  const layers = {}
  order.forEach((id, i) => {
    layers[id] = { zIndex: (i + 1) * 10 }
  })
  return { layers }
}

function swapAt(arr, i, j) {
  const next = [...arr]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

/** @returns {{ layers: object } | null} */
export function arrangeLayerPatch(template, layerId, action) {
  if (!ARRANGEABLE_LAYER_IDS.includes(layerId)) return null

  let order = getStackOrder(template)
  const idx = order.indexOf(layerId)
  if (idx < 0) return null

  switch (action) {
    case ARRANGE_ACTIONS.forward:
      if (idx >= order.length - 1) return null
      order = swapAt(order, idx, idx + 1)
      break
    case ARRANGE_ACTIONS.backward:
      if (idx <= 0) return null
      order = swapAt(order, idx, idx - 1)
      break
    case ARRANGE_ACTIONS.front:
      order = [...order.filter((id) => id !== layerId), layerId]
      break
    case ARRANGE_ACTIONS.back:
      order = [layerId, ...order.filter((id) => id !== layerId)]
      break
    default:
      return null
  }

  return orderToZPatch(order)
}

/**
 * Newspaper reference: stroke title behind cutout, points in front of image.
 */
export const LAYER_PRESETS = {
  titleBehindPng: {
    titleKicker: { zIndex: 6 },
    titleMain: { zIndex: 8 },
    heroImage: { zIndex: 16 },
    points: { zIndex: 22 },
    lead: { zIndex: 22 },
  },
  titleInFront: {
    titleKicker: { zIndex: 26 },
    titleMain: { zIndex: 28 },
    heroImage: { zIndex: 12 },
    points: { zIndex: 24 },
    lead: { zIndex: 24 },
  },
}

export function applyLayerPresetPatch(presetKey) {
  const preset = LAYER_PRESETS[presetKey]
  if (!preset) return null
  return {
    layers: Object.fromEntries(
      Object.entries(preset).map(([id, patch]) => [id, patch])
    ),
  }
}

export function detectLayerPreset(template) {
  const mainZ = getLayerZIndex(template, 'titleMain')
  const imgZ = getLayerZIndex(template, 'heroImage')
  return mainZ > imgZ ? 'titleInFront' : 'titleBehindPng'
}

export function allLayerIdsForPanel() {
  return [
    'heroZone',
    'heroTextCol',
    ...MAIN_PAGE_TOP_LAYER_IDS,
    'bodyZone',
  ]
}
