import { columnWidthMm } from './constants.js'
import { calculateEstimatedHeight } from './calculateEstimatedHeight.js'
import {
  measureObstacleHeightsPx,
  splitWordsForThreadedColumns,
} from './columnTextBand.js'

/**
 * Threaded 2-col (Quark-style): col1 points→text, col2 image→text, even column bottoms.
 */
export function splitArticleIntoTwoColumns(content, meta = {}) {
  const text = String(content || '').trim()
  const words = text.split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const obstacles = measureObstacleHeightsPx({
    highlights: meta.highlights || [],
    hasImage: meta.hasImage,
  })

  if (!wordCount) {
    return {
      column1Text: '',
      column2Text: '',
      column1Html: null,
      column2Html: null,
      wordsCol1: 0,
      wordsCol2: 0,
      wordCount: 0,
      highlightsMm: obstacles.highlightsMm,
      imageMm: obstacles.imageMm,
      bottomSpreadMm: 0,
    }
  }

  const split = splitWordsForThreadedColumns(words, {
    highlights: meta.highlights || [],
    hasImage: meta.hasImage,
  }, columnWidthMm())

  return {
    column1Text: words.slice(0, split.wordsCol1).join(' '),
    column2Text: words.slice(split.wordsCol1).join(' '),
    column1Html: null,
    column2Html: null,
    wordsCol1: split.wordsCol1,
    wordsCol2: split.wordsCol2,
    wordCount,
    ...obstacles,
    bottomSpreadMm: split.spread,
    col1BodyMm: split.col1HeightMm,
    col2BodyMm: split.col2HeightMm,
    linesCol1: split.linesCol1,
    linesCol2: split.linesCol2,
    bottomMm: split.bottomMm,
  }
}

/** @param {string} text */
export function contentToBodyParagraph(text) {
  const t = String(text || '').trim()
  if (!t) return ''
  const paras = t.split(/\n\s*\n/).filter(Boolean)
  if (paras.length <= 1) return t
  return paras.map((p) => p.trim()).join('\n\n')
}
