import { BLOCK_06A } from './constants.js'

/**
 * Pure CSS for BLOCK-06A (embed in page or return from API).
 * @param {string} [scopeId] — optional wrapper id for scoping
 */
export function generateBlock06Css(scopeId = 'block06a-root') {
  const w = BLOCK_06A.widthMm
  const maxH = BLOCK_06A.maxHeightMm
  const gap = BLOCK_06A.columnGapPx

  return `/* BLOCK-06A — ${BLOCK_06A.code} — generated */
@import url('https://fonts.googleapis.com/css2?family=Ramabhadra&family=Mandali&display=swap');

#${scopeId},
.${scopeId} {
  box-sizing: border-box;
}

.block06a {
  width: ${w}mm;
  max-width: 100%;
  max-height: ${maxH}mm;
  overflow: hidden;
  margin: 0 auto;
  padding: ${BLOCK_06A.padTopMm}mm ${BLOCK_06A.gutterMm}mm ${BLOCK_06A.padBottomMm}mm;
  background: #fffef9;
  box-sizing: border-box;
  font-family: 'Mandali', sans-serif;
  color: #1a1a1a;
  -webkit-font-smoothing: antialiased;
}

.block06a__title-zone {
  width: 100%;
  margin: 0 0 14px;
  padding: 0 4px 6px;
  text-align: center;
  position: relative;
  z-index: 2;
}

.block06a__title {
  margin: 0;
  padding: 0 4px;
  font-family: 'Mandali', 'Noto Serif Telugu', sans-serif;
  font-weight: 600;
  line-height: 1.1;
  text-align: center;
  color: #1a1a1a;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.block06a__subtitle {
  margin: 5px 0 0;
  padding: 0 4px;
  font-family: 'Mandali', 'Noto Serif Telugu', sans-serif;
  font-weight: 500;
  line-height: 1.22;
  text-align: center;
  color: #444;
}

.block06a__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: ${gap}px;
  width: 100%;
  align-items: stretch;
  position: relative;
  z-index: 1;
}

.block06a__column {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  align-self: stretch;
}

.block06a__highlights {
  flex-shrink: 0;
  background: #f7f4ec;
  border: 1px solid #e5dfd0;
  border-radius: 2px;
  padding: 8px 10px 6px;
  margin: 0 0 8px;
}

.block06a__highlights ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.block06a__highlights li {
  display: flex;
  gap: 6px;
  margin: 0 0 6px;
  font-size: ${BLOCK_06A.headlineFontPx}px;
  line-height: ${BLOCK_06A.headlineLinePx}px;
  font-weight: 700;
}

.block06a__highlights li:last-child {
  margin-bottom: 0;
}

.block06a__bullet {
  flex-shrink: 0;
}

.block06a__point {
  flex: 1;
  min-width: 0;
  padding-bottom: 3px;
  border-bottom: 1px dashed #b8b0a0;
}

.block06a__figure {
  flex-shrink: 0;
  margin: 0 0 6px;
  width: 100%;
  height: ${BLOCK_06A.imageMaxHeightPx}px;
  line-height: 0;
  overflow: hidden;
  border: 0.5px solid #ddd;
}

.block06a__figure img {
  display: block;
  width: 100%;
  height: ${BLOCK_06A.imageMaxHeightPx}px;
  max-height: ${BLOCK_06A.imageMaxHeightPx}px;
  object-fit: cover;
  object-position: 50% 30%;
}

.block06a__caption {
  font-size: 9px;
  line-height: 12px;
  color: #555;
  padding: 2px 4px;
  text-align: center;
  font-style: italic;
  background: #f9f9f9;
  border-top: 0.5px solid #ddd;
}

.block06a__body {
  flex: 1 1 auto;
  font-size: ${BLOCK_06A.bodyFontPx}px;
  line-height: ${BLOCK_06A.bodyLinePx}px;
  text-align: justify;
  text-justify: inter-word;
  hyphens: none;
  -webkit-hyphens: none;
  word-break: normal;
  overflow-wrap: normal;
  line-break: strict;
  -webkit-line-break: after-white-space;
}

.block06a__body p {
  margin: 0 0 7px;
  padding: 0;
  line-height: ${BLOCK_06A.bodyLinePx}px;
  text-align: justify;
  text-justify: inter-word;
  break-inside: avoid-column;
  page-break-inside: avoid;
  -webkit-column-break-inside: avoid;
}

.block06a__body p:last-child {
  margin-bottom: 0;
}

/* Quark-style: threadBalance adds this when a small bottom gap remains */
.block06a__body.force-vertical-justify p {
  margin-bottom: 7px;
}

.block06a__body--col1 p {
  text-align-last: left;
  -webkit-text-align-last: left;
}

.block06a__body--col2 p {
  text-align-last: left;
}

.block06a__meta {
  font-family: ui-monospace, monospace;
  font-size: 9px;
  color: #64748b;
  margin-top: 6px;
  padding-top: 4px;
  border-top: 1px dashed #cbd5e1;
}

@media print {
  .block06a {
    width: ${w}mm;
    max-height: ${maxH}mm;
    overflow: hidden;
    page-break-inside: avoid;
  }
}
`
}
