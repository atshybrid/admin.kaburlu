/**
 * Merge CMS sentence-per-<p> chunks into real editorial paragraphs for BLOCK-08A flow.
 */

const PARA_END_RE = /[.!?।॥]\s*$/
/** ~6–7 lines at 11px in a narrow column — keep splits for long blocks */
const HARD_BREAK_CHARS = 520

/** Split on sentence end (no lookbehind — wider browser support). */
function splitIntoSentences(text) {
  const parts = text.match(/[^.!?।॥\n]+(?:[.!?।॥]+)?/gu) || []
  return parts.map((s) => s.trim()).filter(Boolean)
}

/**
 * @param {object[]} items — { content, type? }
 * @returns {object[]}
 */
export function mergeEditorialParagraphs(items = []) {
  if (!items?.length) return []

  const out = []
  for (const item of items) {
    if (!item) continue
    if (item.type === 'heading') {
      out.push(item)
      continue
    }

    const text = String(item.content ?? item ?? '').trim()
    if (!text) continue

    const last = out[out.length - 1]
    if (last && !last.type && shouldMergeWithPrevious(last.content, text)) {
      last.content = `${last.content} ${text}`
      continue
    }

    out.push({ ...item, content: text })
  }

  return out
}

function shouldMergeWithPrevious(prev, next) {
  if (!prev || !next) return false
  if (/^[\-\u2022•\d]/.test(next)) return false
  if (prev.length > HARD_BREAK_CHARS && PARA_END_RE.test(prev)) return false
  if (prev.length > 220 || next.length > 220) return false
  return true
}

/**
 * Split long / merged blocks into sentence units so 3-col partition has enough pieces.
 */
export function expandBodyItemsForFlow(items = []) {
  const out = []
  for (const item of items) {
    if (!item) continue
    if (item.type === 'heading') {
      out.push(item)
      continue
    }
    const text = String(item.content ?? item ?? '').trim()
    if (!text) continue
    const parts = splitIntoSentences(text)
    if (parts.length <= 1) {
      out.push({ ...item, content: text })
    } else {
      parts.forEach((part) => out.push({ content: part }))
    }
  }
  return out
}
