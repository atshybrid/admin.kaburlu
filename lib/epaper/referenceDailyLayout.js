/**
 * Reference inner-page layout extracted from market Telugu daily PDFs
 * (e.g. Telugu Prabha broadsheet inner pages).
 *
 * Use as deterministic rules today; label PDFs with these fields for ML later.
 */

/** Column inch split on 12in article area (13in trim − 0.5in margins). */
export const REFERENCE_LANE_INCHES_12 = [4, 8]

/** Story separation in column (mm → px at 96dpi). ~2mm rule + whitespace. */
export const REFERENCE_STORY_GAP_MM = 2.1

export function referenceStoryGapPx(layoutScale = 24) {
  const pxPerMm = 96 / 25.4
  return Math.max(6, Math.round(REFERENCE_STORY_GAP_MM * pxPerMm * (layoutScale / 24)))
}

/** Target stories per column per page (varies; 3–5 typical on inner). */
export const REFERENCE_STORIES_PER_COLUMN = { min: 2, max: 5, typical: 3 }

/** Block pick bands aligned with editorial desk. */
export const REFERENCE_BLOCK_BANDS = {
  briefNoPoints: { maxWords: 199, block: 'BLOCK-04A' },
  withPoints: { minPoints: 1, blocks: ['BLOCK-06A', 'BLOCK-08A'] },
  standard: { wordsMin: 200, wordsMax: 399, blocks: ['BLOCK-06A', 'BLOCK-08A'] },
  lead: { wordsMin: 400, blocks: ['BLOCK-08A', 'BLOCK-12A'] },
}

/** Column text bottom tolerance (px at native block scale). */
export const REFERENCE_COLUMN_BOTTOM_TOLERANCE_PX = 12

/**
 * ML dataset schema (when user feeds market PDFs):
 * - pageImagePath, pageNumber, editionDate
 * - boxes: [{ x, y, w, h, blockCode, wordCount, hasPoints, columnIndex }]
 * - laneInches: [4,4,6]
 * - storyGapMm: number
 */
export const ML_LAYOUT_DATASET_SCHEMA = {
  version: '1.0',
  fields: [
    'pageImagePath',
    'pageNumber',
    'editionDate',
    'laneInches',
    'storyGapMm',
    'articles',
  ],
  articleFields: [
    'x', 'y', 'w', 'h', 'blockCode', 'wordCount', 'hasPoints', 'columnIndex', 'titleChars',
  ],
}
