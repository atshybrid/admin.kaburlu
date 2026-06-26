import { BLOCK_08A } from './constants.js'

export function generateBlock08Css(scopeId = 'block08a-root') {
  const w = BLOCK_08A.widthMm
  const maxH = BLOCK_08A.maxHeightMm
  const gap = BLOCK_08A.columnGapPx
  const img1 = BLOCK_08A.imagePrimaryMaxHeightPx
  const img2 = BLOCK_08A.imageSecondaryMaxHeightPx

  return `/* BLOCK-08A — ${BLOCK_08A.code} — 8in · 3 col */
@import url('https://fonts.googleapis.com/css2?family=Mandali&display=swap');

#${scopeId}, .${scopeId} { box-sizing: border-box; }

.block08a {
  width: ${w}mm;
  max-width: 100%;
  max-height: ${maxH}mm;
  overflow: hidden;
  margin: 0 auto;
  padding: ${BLOCK_08A.padTopMm}mm ${BLOCK_08A.gutterMm}mm ${BLOCK_08A.padBottomMm}mm;
  background: #fffef9;
  box-sizing: border-box;
  font-family: 'Mandali', sans-serif;
  color: #1a1a1a;
  -webkit-font-smoothing: antialiased;
}

.block08a__title-zone {
  width: 100%;
  margin: 0 0 14px;
  padding: 0 4px 6px;
  text-align: center;
  position: relative;
  z-index: 2;
}

.block08a__title {
  margin: 0;
  padding: 0 4px;
  font-family: 'Mandali', 'Noto Serif Telugu', sans-serif;
  font-weight: 600;
  line-height: 1.1;
  text-align: center;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.block08a__subtitle {
  margin: 5px 0 0;
  padding: 0 4px;
  font-weight: 500;
  line-height: 1.22;
  text-align: center;
  color: #444;
}

.block08a__visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.block08a__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: ${gap}px;
  width: 100%;
  align-items: stretch;
}

.block08a__column {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  align-self: stretch;
}

.block08a__highlights {
  flex-shrink: 0;
  background: #f7f4ec;
  border: 1px solid #e5dfd0;
  border-radius: 2px;
  padding: 8px 10px 6px;
  margin: 0 0 8px;
}

.block08a__highlights ul { list-style: none; margin: 0; padding: 0; }

.block08a__highlights li {
  display: flex;
  gap: 6px;
  margin: 0 0 6px;
  font-size: ${BLOCK_08A.headlineFontPx}px;
  line-height: ${BLOCK_08A.headlineLinePx}px;
  font-weight: 700;
}

.block08a__highlights li:last-child { margin-bottom: 0; }

.block08a__bullet { flex-shrink: 0; }

.block08a__point {
  flex: 1;
  min-width: 0;
  padding-bottom: 3px;
  border-bottom: 1px dashed #b8b0a0;
}

.block08a__figure {
  flex-shrink: 0;
  margin: 0 0 6px;
  width: 100%;
  line-height: 0;
  overflow: hidden;
  border: 0.5px solid #ddd;
}

.block08a__figure img {
  display: block;
  width: 100%;
  object-fit: cover;
  object-position: 50% 30%;
}

.block08a__column--2 .block08a__figure img { max-height: ${img1}px; }
.block08a__column--3 .block08a__figure img { max-height: ${img2}px; }

.block08a__caption {
  font-size: 9px;
  line-height: 12px;
  color: #555;
  padding: 2px 4px;
  text-align: center;
  font-style: italic;
  background: #f9f9f9;
  border-top: 0.5px solid #ddd;
}

.block08a__body {
  flex: 1 1 auto;
  font-size: ${BLOCK_08A.bodyFontPx}px;
  line-height: ${BLOCK_08A.bodyLinePx}px;
  text-align: justify;
  text-justify: inter-word;
  text-align-last: left;
  -webkit-text-align-last: left;
  word-spacing: normal;
  letter-spacing: normal;
  hyphens: none;
  -webkit-hyphens: none;
  word-break: normal;
  overflow-wrap: normal;
  line-break: strict;
}

.block08a__body p {
  margin: 0 0 7px;
  padding: 0;
  line-height: ${BLOCK_08A.bodyLinePx}px;
  text-align: inherit;
  text-align-last: inherit;
  word-spacing: normal;
  break-inside: avoid-column;
  page-break-inside: avoid;
  -webkit-column-break-inside: avoid;
}

.block08a__body p:last-child { margin-bottom: 0; }

.block08a__body.force-vertical-justify p {
  margin-bottom: 7px;
}

.block08a__meta {
  font-family: ui-monospace, monospace;
  font-size: 9px;
  color: #64748b;
  margin-top: 6px;
  padding-top: 4px;
  border-top: 1px dashed #cbd5e1;
}

@media print {
  .block08a {
    width: ${w}mm;
    max-height: ${maxH}mm;
    overflow: hidden;
    page-break-inside: avoid;
  }
}
`
}
