/**
 * Newspaper Layout Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Deterministic, grid-based placement engine for ePaper / print layout.
 *
 * Grid model
 * ──────────
 *   Page = TOTAL_COLS columns × N row-units
 *   TOTAL_COLS : 12  (each col = 1 unit)
 *   ROW_UNIT   : configurable (default 1 — each article occupies measured rows)
 *
 * Block widths (in columns)
 *   FULL  = 12  (full-width / lead / 8-in zone at 12-col page)
 *   HALF  =  6  (half-page / secondary)
 *   THIRD =  4
 *   QUARTER = 3
 *   CUSTOM = any multiple of 1
 *
 * Placement algorithm
 * ───────────────────
 *   1. Sort articles by priority (descending).
 *   2. Maintain a 2-D occupancy grid: occupied[row][col] = articleId | null
 *   3. For each article find the first (row, col) where its bounding box fits
 *      entirely without collision and without overflow.
 *   4. Mark all cells in the bounding box as occupied.
 *   5. Return layout[] = [{id, x, y, width, height, colStart, rowStart}]
 *
 * Height calculation
 * ──────────────────
 *   textLines   = ceil(charCount / charsPerLine(colWidth))
 *   textHeight  = textLines * LINE_HEIGHT  (px)
 *   imageHeight = provided by article or estimated from colWidth * IMAGE_RATIO
 *   rawHeight   = textHeight + imageHeight + PADDING
 *   height      = snap(rawHeight, ROW_PX)          ← snapped to row grid
 *
 * Coordinate system
 * ─────────────────
 *   x, y are in PIXELS (top-left origin)
 *   colStart, rowStart are in grid units (0-based)
 *   width, height are in pixels
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default page config — 12-column newspaper, physical ~304.8 mm × 431.8 mm */
export const DEFAULT_PAGE = {
  totalCols    : 12,
  colPx        : 96,      // px per column (including half-gutter on each side)
  gutterPx     : 8,       // px — space between columns (already inside colPx)
  marginPx     : 16,      // outer page margin px (left + right)
  rowPx        : 24,      // baseline row grid in px
  lineHeight   : 18,      // px per text line
  charPerColPx : 6,       // average chars per px of column width (for Telugu ~5.5)
  imageRatio   : 0.55,    // image height ≈ colWidth × ratio (when no explicit height given)
  paddingPx    : 24,      // internal block padding (title, byline, etc.)
  maxRows      : 80,      // safety ceiling
}

// Article span constants (in columns)
export const SPAN = {
  FULL    : 12,
  HALF    : 6,
  THIRD   : 4,
  QUARTER : 3,
}

// Priority constants
export const PRIORITY = {
  LEAD      : 100,
  BREAKING  : 90,
  SECONDARY : 60,
  NORMAL    : 40,
  BRIEF     : 20,
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Snap a pixel value UP to the nearest multiple of rowPx.
 */
export function snapToGrid(px, rowPx) {
  return Math.ceil(px / rowPx) * rowPx
}

/**
 * Calculate height in pixels for an article given its column span and content.
 * @param {object} article - { text, paragraphs, images, title, subtitle }
 * @param {number} colSpan - number of columns the block occupies
 * @param {object} page    - page config
 * @returns {number} height in px (snapped to row grid)
 */
export function calcHeight(article, colSpan, page = DEFAULT_PAGE) {
  const colWidth = colSpan * page.colPx - page.gutterPx

  // Characters per line based on column width
  const charsPerLine = Math.max(10, Math.round(colWidth / page.charPerColPx))

  // Count total characters
  const allText = [
    article.title        || '',
    article.subtitle     || '',
    ...(article.paragraphs || []),
    ...(article.highlights || []).map(h => `• ${h}`),
    article.dateline     || '',
  ].join(' ')

  const charCount   = allText.length
  const textLines   = Math.ceil(charCount / charsPerLine)
  const textHeight  = textLines * page.lineHeight

  // Image height
  let imgHeight = 0
  const images = article.images || []
  if (images.length > 0) {
    if (images[0].height) {
      imgHeight = images[0].height
    } else {
      imgHeight = Math.round(colWidth * page.imageRatio)
    }
  }

  const rawHeight = textHeight + imgHeight + page.paddingPx
  return snapToGrid(Math.max(rawHeight, page.rowPx * 3), page.rowPx)
}

/**
 * Convert pixel height to number of row units.
 */
export function pxToRows(px, rowPx) {
  return Math.ceil(px / rowPx)
}

// ─── Occupancy Grid ───────────────────────────────────────────────────────────

/**
 * Create an empty occupancy grid.
 * grid[row][col] = null | articleId
 */
function createGrid(maxRows, totalCols) {
  return Array.from({ length: maxRows }, () => new Array(totalCols).fill(null))
}

/**
 * Check if a rectangular region is free in the grid.
 */
function regionFree(grid, rowStart, colStart, rowSpan, colSpan) {
  for (let r = rowStart; r < rowStart + rowSpan; r++) {
    if (!grid[r]) return false
    for (let c = colStart; c < colStart + colSpan; c++) {
      if (grid[r][c] !== null) return false
    }
  }
  return true
}

/**
 * Mark a rectangular region as occupied.
 */
function markOccupied(grid, rowStart, colStart, rowSpan, colSpan, id) {
  for (let r = rowStart; r < rowStart + rowSpan; r++) {
    for (let c = colStart; c < colStart + colSpan; c++) {
      grid[r][c] = id
    }
  }
}

/**
 * Find first free (rowStart, colStart) where a block of colSpan × rowSpan fits.
 * Scans row-by-row, left-to-right within each row.
 * Returns { rowStart, colStart } or null if no space found.
 */
function findPosition(grid, colSpan, rowSpan, totalCols, maxRows, startRow = 0) {
  if (colSpan > totalCols) return null

  for (let r = startRow; r < maxRows - rowSpan; r++) {
    for (let c = 0; c <= totalCols - colSpan; c++) {
      if (regionFree(grid, r, c, rowSpan, colSpan)) {
        return { rowStart: r, colStart: c }
      }
    }
  }
  return null
}

// ─── Main Layout Engine ───────────────────────────────────────────────────────

/**
 * Run the layout engine.
 *
 * @param {Array}  articles - Array of article objects
 * @param {object} page     - Page config (defaults to DEFAULT_PAGE)
 * @returns {{ layout: Array, errors: Array, occupancyRows: number }}
 *
 * Each layout item:
 * {
 *   id        : string,
 *   colStart  : number,  // 0-based column
 *   rowStart  : number,  // 0-based row
 *   colSpan   : number,  // columns occupied
 *   rowSpan   : number,  // rows occupied
 *   x         : number,  // px from left edge (includes margin)
 *   y         : number,  // px from top edge
 *   width     : number,  // px
 *   height    : number,  // px
 * }
 */
export function runLayoutEngine(articles = [], page = DEFAULT_PAGE) {
  const cfg = { ...DEFAULT_PAGE, ...page }
  const {
    totalCols, colPx, gutterPx, marginPx,
    rowPx, maxRows,
  } = cfg

  const errors  = []
  const layout  = []
  const grid    = createGrid(maxRows, totalCols)

  // 1. Normalise and sort by priority descending
  const normalised = articles.map((a, i) => ({
    id        : a.id || `article_${i + 1}`,
    colSpan   : a.colSpan || SPAN.HALF,
    priority  : a.priority ?? PRIORITY.NORMAL,
    ...a,
  }))

  normalised.sort((a, b) => b.priority - a.priority)

  // 2. Place each article
  for (const article of normalised) {
    const colSpan = Math.min(Math.max(1, article.colSpan), totalCols)
    const heightPx = calcHeight(article, colSpan, cfg)
    const rowSpan  = pxToRows(heightPx, rowPx)

    const pos = findPosition(grid, colSpan, rowSpan, totalCols, maxRows)

    if (!pos) {
      errors.push({
        id     : article.id,
        reason : `No space found for article "${article.id}" (${colSpan}col × ${rowSpan}rows)`,
      })
      continue
    }

    const { rowStart, colStart } = pos

    // Mark occupancy
    markOccupied(grid, rowStart, colStart, rowSpan, colSpan, article.id)

    // Convert to pixel coordinates
    const x      = marginPx + colStart * colPx
    const y      = rowStart * rowPx
    const width  = colSpan * colPx - gutterPx
    const height = rowSpan * rowPx

    layout.push({
      id       : article.id,
      colStart,
      rowStart,
      colSpan,
      rowSpan,
      x,
      y,
      width,
      height,
    })
  }

  // 3. Determine how many rows were used
  let occupancyRows = 0
  for (const item of layout) {
    occupancyRows = Math.max(occupancyRows, item.rowStart + item.rowSpan)
  }

  return { layout, errors, occupancyRows }
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate a layout array.
 * Returns array of violation objects (empty = valid).
 */
export function validateLayout(layout, page = DEFAULT_PAGE) {
  const cfg = { ...DEFAULT_PAGE, ...page }
  const pageWidth  = cfg.totalCols * cfg.colPx
  const violations = []

  for (let i = 0; i < layout.length; i++) {
    const a = layout[i]

    // Overflow check
    if (a.x < 0 || a.y < 0) {
      violations.push({ type: 'NEGATIVE_POSITION', id: a.id, x: a.x, y: a.y })
    }
    if (a.x + a.width > pageWidth + cfg.marginPx * 2 + 4 /* tolerance */) {
      violations.push({ type: 'OVERFLOW_RIGHT', id: a.id, right: a.x + a.width })
    }

    // Overlap check with every other block
    for (let j = i + 1; j < layout.length; j++) {
      const b = layout[j]
      const overlapX = a.x < b.x + b.width  && a.x + a.width  > b.x
      const overlapY = a.y < b.y + b.height && a.y + a.height > b.y
      if (overlapX && overlapY) {
        violations.push({ type: 'OVERLAP', ids: [a.id, b.id] })
      }
    }

    // Grid alignment check
    if (a.x % cfg.colPx !== cfg.marginPx % cfg.colPx) {
      violations.push({ type: 'MISALIGNED_X', id: a.id, x: a.x })
    }
    if (a.y % cfg.rowPx !== 0) {
      violations.push({ type: 'MISALIGNED_Y', id: a.id, y: a.y })
    }
  }

  return violations
}
