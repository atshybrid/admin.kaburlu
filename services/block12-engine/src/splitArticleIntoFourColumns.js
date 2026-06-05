import { columnWidthMm } from './constants.js'
import { splitWordsForThreadedFourColumns } from './columnTextBand.js'
import { splitTopAndBottomImages } from './utils.js'

/**
 * Threaded 4-col: col1 highlights→text, col2–4 image1–3→text.
 */
export function splitArticleIntoFourColumns(content, meta = {}) {
  const text = String(content || '').trim()
  const words = text.split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const { columnTop, bottom } = splitTopAndBottomImages(meta.imageUrls || [])

  if (!wordCount) {
    return {
      column1Text: '',
      column2Text: '',
      column3Text: '',
      column4Text: '',
      wordsCol1: 0,
      wordsCol2: 0,
      wordsCol3: 0,
      wordsCol4: 0,
      wordCount: 0,
      bottomSpreadMm: 0,
      columnTopImages: columnTop,
      bottomImages: bottom,
    }
  }

  const split = splitWordsForThreadedFourColumns(
    words,
    { highlights: meta.highlights || [], columnTopImages: columnTop },
    columnWidthMm()
  )

  const i1 = split.wordsCol1
  const i2 = i1 + split.wordsCol2
  const i3 = i2 + split.wordsCol3

  return {
    column1Text: words.slice(0, i1).join(' '),
    column2Text: words.slice(i1, i2).join(' '),
    column3Text: words.slice(i2, i3).join(' '),
    column4Text: words.slice(i3).join(' '),
    wordsCol1: split.wordsCol1,
    wordsCol2: split.wordsCol2,
    wordsCol3: split.wordsCol3,
    wordsCol4: split.wordsCol4,
    wordCount,
    bottomSpreadMm: split.spread,
    columnTopImages: columnTop,
    bottomImages: bottom,
  }
}
