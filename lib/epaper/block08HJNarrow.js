/**
 * InDesign / Quark “Justification: Narrow” — word spacing bands for BLOCK-08A.
 * @see Adobe: Word Spacing ~80% min, 100% desired, 103% max (narrow)
 */

export const HJ_NARROW = {
  wordMin: 0.72,
  wordDesired: 1,
  wordMax: 1.12,
  letterMin: 0,
  letterDesired: 0,
  letterMax: 0.02,
  hyphenPenalty: 18,
  hyphenationZonePx: 6,
}

export function clampWordSpacingPx(spaceWidthPx, gaps, columnWidthPx, inkWidthPx) {
  if (gaps <= 0) return { ok: true, spacingPx: spaceWidthPx, extraPx: 0, ratio: 1 }

  const slack = columnWidthPx - inkWidthPx
  let spacing = slack / gaps
  const min = spaceWidthPx * HJ_NARROW.wordMin
  const max = spaceWidthPx * HJ_NARROW.wordMax

  if (spacing < min) {
    if (inkWidthPx + gaps * min <= columnWidthPx + 1) {
      spacing = min
    } else {
      return { ok: false, spacingPx: spacing, extraPx: 0, ratio: spacing / spaceWidthPx }
    }
  }
  if (spacing > max) spacing = max

  return {
    ok: true,
    spacingPx: spacing,
    extraPx: Math.max(0, spacing - spaceWidthPx),
    ratio: spacing / spaceWidthPx,
  }
}

/** Spacing for render (always clamp to narrow band). */
export function narrowLineSpacingPx(spaceWidthPx, gaps, columnWidthPx, inkWidthPx) {
  if (gaps <= 0) return spaceWidthPx
  const slack = columnWidthPx - inkWidthPx
  let spacing = slack / gaps
  const min = spaceWidthPx * HJ_NARROW.wordMin
  const max = spaceWidthPx * HJ_NARROW.wordMax
  return Math.max(min, Math.min(max, spacing))
}

export function narrowSpacingDemerit(ratio) {
  const d = ratio - HJ_NARROW.wordDesired
  if (ratio < HJ_NARROW.wordMin - 0.05 || ratio > HJ_NARROW.wordMax + 0.08) {
    return 900 + Math.abs(d) * 800
  }
  return Math.abs(d) * 55
}
