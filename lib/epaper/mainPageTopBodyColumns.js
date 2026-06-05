/**
 * BLOCK-TOP8x7 — even 2-column body distribution.
 */

/** Upper cap for title band — full hero inner width (~744px at 8in). */
export function top8x7HeroInnerWidthPx(nativeW = 768, padH = 12) {
  return Math.max(320, nativeW - padH * 2)
}

/** Split flowing body copy evenly across columns (word boundaries). */
export function balanceBodyColumnsEven(source) {
  const combined = Array.isArray(source)
    ? source
        .map((p) => String(p?.content ?? p ?? '').trim())
        .filter(Boolean)
        .join(' ')
    : String(source || '').trim()

  if (!combined) return { left: '', right: '' }

  const words = combined.split(/\s+/).filter(Boolean)
  if (words.length <= 1) {
    return { left: combined, right: '' }
  }

  const target = combined.length / 2
  let acc = 0
  let splitAt = Math.ceil(words.length / 2)

  for (let i = 0; i < words.length; i++) {
    acc += words[i].length + (i > 0 ? 1 : 0)
    if (acc >= target) {
      splitAt = Math.max(1, Math.min(words.length - 1, i + 1))
      break
    }
  }

  return {
    left: words.slice(0, splitAt).join(' '),
    right: words.slice(splitAt).join(' '),
  }
}

export function mergeRightColumnText(right = '', quote = '') {
  const parts = [String(right || '').trim(), String(quote || '').trim()].filter(Boolean)
  return parts.join('\n\n')
}
