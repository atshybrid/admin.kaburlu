/**
 * Detect / repair broken BLOCK-12A column splits (empty col1, hoarding in col4).
 */

import { tokenizeWords } from './block08LineComposer'
import { repairBlock12ColumnTexts } from './block12CrossColumnFlow'

export function columnWordCounts12(columnTexts) {
  return (columnTexts || []).map((t) => tokenizeWords(String(t || '')).length)
}

export function isBroken12ColumnLayout(columnTexts, ctx = {}) {
  const counts = columnWordCounts12(columnTexts)
  const sum = counts.reduce((a, b) => a + b, 0)
  const total = ctx.totalWords ?? sum
  if (total < 28 || sum < 20) return false

  const minCol0 = Math.max(8, Math.floor(total * 0.07))
  if (counts[0] < minCol0 && counts[3] > Math.floor(total * 0.42)) return true
  if (counts[3] > Math.floor(total * 0.52) && counts[0] + counts[2] < Math.floor(total * 0.2)) {
    return true
  }
  if (ctx.imageCount >= 2 && counts[2] < 6 && counts[3] > Math.floor(total * 0.35)) return true

  return false
}

export function repairBroken12ColumnLayout(columnTexts, fullText, ctx = {}) {
  const cols = (columnTexts || []).map((t) => String(t || ''))
  if (!fullText?.trim()) return cols
  if (!isBroken12ColumnLayout(cols, ctx)) return cols

  const { obstacles, widths, flowOpts, imageCount } = ctx
  if (obstacles?.length >= 4 && widths?.length >= 4) {
    return repairBlock12ColumnTexts(cols, fullText, obstacles, widths, {
      ...flowOpts,
      imageCount,
    })
  }

  const words = tokenizeWords(fullText)
  const n = words.length
  const c0 = Math.max(8, Math.floor(n * 0.22))
  const c1 = Math.max(10, Math.floor(n * 0.24))
  const c2 = Math.max(imageCount >= 2 ? 10 : 8, Math.floor(n * 0.22))
  return [
    words.slice(0, c0).join(' '),
    words.slice(c0, c0 + c1).join(' '),
    words.slice(c0 + c1, c0 + c1 + c2).join(' '),
    words.slice(c0 + c1 + c2).join(' '),
  ]
}
