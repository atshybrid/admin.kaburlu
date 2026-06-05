import { columnWidthMm } from './constants.js'
import {
  measureObstacleHeightsPx,
  splitWordsForThreadedColumns,
} from './columnTextBand.js'

/**
 * Threaded 3-col: col1 points→text, col2 image1→text, col3 image2→text.
 */
export function splitArticleIntoThreeColumns(content, meta = {}) {
  const text = String(content || '').trim()
  const words = text.split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const imageUrls = meta.imageUrls || []
  const obstacles = measureObstacleHeightsPx({
    highlights: meta.highlights || [],
    imageUrls,
  })

  if (!wordCount) {
    return {
      column1Text: '',
      column2Text: '',
      column3Text: '',
      wordsCol1: 0,
      wordsCol2: 0,
      wordsCol3: 0,
      wordCount: 0,
      bottomSpreadMm: 0,
    }
  }

  const split = splitWordsForThreadedColumns(
    words,
    {
      highlights: meta.highlights || [],
      imageUrls,
    },
    columnWidthMm()
  )

  const i1 = split.wordsCol1
  const i2 = i1 + split.wordsCol2

  return {
    column1Text: words.slice(0, i1).join(' '),
    column2Text: words.slice(i1, i2).join(' '),
    column3Text: words.slice(i2).join(' '),
    wordsCol1: split.wordsCol1,
    wordsCol2: split.wordsCol2,
    wordsCol3: split.wordsCol3,
    wordCount,
    bottomSpreadMm: split.spread,
    col1BodyMm: split.col1HeightMm,
    col2BodyMm: split.col2HeightMm,
    col3BodyMm: split.col3HeightMm,
    linesCol1: split.linesCol1,
    linesCol2: split.linesCol2,
    linesCol3: split.linesCol3,
    bottomMm: split.bottomMm,
  }
}
