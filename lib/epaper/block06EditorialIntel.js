/**
 * BLOCK-06A — 2-column grid placement (same editorial rules as 08A, remapped).
 *
 * Col1 (index 0): highlights → body
 * Col2 (index 1): primary image top → body continues from col1
 * 2nd image: col1 (stacked) when only one image column, else col0
 */

import { LAYOUT_FAMILIES } from './block08VisualAnalysis'

/** Fixed 06A slots: primary right, secondary left if two photos. */
export function chooseBlock06GridPlacement(images = []) {
  const list = images.filter((img) => img?.src)
  const slots = []
  if (list[0]) {
    slots.push({ columnIndex: 1, image: list[0], role: 'primary', size: 'primary' })
  }
  if (list[1]) {
    slots.push({ columnIndex: 0, image: list[1], role: 'secondary', size: 'compact-safe' })
  }
  return slots
}

/** Map 08A column indices (1=center, 2=right) → 06A (1=right, 0=left). */
function map08ColumnTo06(columnIndex) {
  if (columnIndex === 1) return 1
  if (columnIndex === 2) return 1
  return 0
}

/** @returns {{ columnIndex: number, image: object, role: string, size: string }[]} */
export function chooseBlock06EditorialPlacement(visuals = {}, images = []) {
  const list = images.filter((img) => img?.src)
  if (!list.length) return []

  const { layoutFamily, imageShape, imageSubject } = visuals
  const primary = list[0]
  const secondary = list[1]

  const mapSlot = (slot) => ({
    ...slot,
    columnIndex: map08ColumnTo06(slot.columnIndex),
    image: slot.image,
  })

  if (layoutFamily === LAYOUT_FAMILIES.WIDE || imageShape === 'landscape') {
    return [
      mapSlot({ columnIndex: 1, image: primary, role: 'banner', size: 'banner' }),
      ...(secondary
        ? [mapSlot({ columnIndex: 0, image: secondary, role: 'secondary', size: 'compact-safe' })]
        : []),
    ]
  }

  if (imageSubject === 'crime' || imageSubject === 'sensitive') {
    return [
      mapSlot({ columnIndex: 1, image: primary, role: 'side', size: 'compact-safe' }),
      ...(secondary
        ? [mapSlot({ columnIndex: 1, image: secondary, role: 'side', size: 'compact-safe' })]
        : []),
    ]
  }

  if (
    imageSubject === 'symbolic' ||
    imageSubject === 'logo' ||
    imageSubject === 'infographic' ||
    imageShape === 'square'
  ) {
    return [
      mapSlot({ columnIndex: 1, image: primary, role: 'primary', size: 'square-balanced' }),
      ...(secondary
        ? [mapSlot({ columnIndex: 0, image: secondary, role: 'secondary', size: 'group-center' })]
        : []),
    ]
  }

  if (
    imageShape === 'portrait' ||
    imageSubject === 'emotional' ||
    imageSubject === 'politician'
  ) {
    return [
      mapSlot({ columnIndex: 1, image: primary, role: 'primary', size: 'portrait-tight' }),
      ...(secondary
        ? [mapSlot({ columnIndex: 0, image: secondary, role: 'secondary', size: 'compact-safe' })]
        : []),
    ]
  }

  if (imageSubject === 'event' || imageSubject === 'crowd') {
    return [
      mapSlot({ columnIndex: 1, image: primary, role: 'primary', size: 'group-center' }),
      ...(secondary
        ? [mapSlot({ columnIndex: 0, image: secondary, role: 'secondary', size: 'group-center' })]
        : []),
    ]
  }

  return [
    mapSlot({ columnIndex: 1, image: primary, role: 'primary', size: 'primary' }),
    ...(secondary
      ? [mapSlot({ columnIndex: 0, image: secondary, role: 'secondary', size: 'compact-safe' })]
      : []),
  ]
}

export { computeHeadlineImpact } from './block08EditorialIntel'
