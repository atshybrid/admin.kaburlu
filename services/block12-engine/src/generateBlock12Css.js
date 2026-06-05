import { BLOCK_12A } from './constants.js'

export function generateBlock12Css(scopeId = 'block12a-root') {
  const w = BLOCK_12A.widthMm
  const maxH = BLOCK_12A.maxHeightMm
  const gap = BLOCK_12A.columnGapPx
  const thumb = BLOCK_12A.bottomThumbHeightPx
  const aspW = BLOCK_12A.imageTopAspectW
  const aspH = BLOCK_12A.imageTopAspectH

  return `/* BLOCK-12A — ${BLOCK_12A.code} — 12in · 4 col · max 21in */
@import url('https://fonts.googleapis.com/css2?family=Mandali&display=swap');

#${scopeId}, .${scopeId} { box-sizing: border-box; }

.block12a {
  width: ${w}mm;
  max-width: 100%;
  max-height: ${maxH}mm;
  overflow: hidden;
  margin: 0 auto;
  padding: ${BLOCK_12A.padTopMm}mm ${BLOCK_12A.gutterMm}mm ${BLOCK_12A.padBottomMm}mm;
  background: #fffef9;
  box-sizing: border-box;
  font-family: 'Mandali', sans-serif;
  color: #1a1a1a;
  -webkit-font-smoothing: antialiased;
}

.block12a__title-zone {
  width: 100%;
  margin: 0 0 12px;
  padding: 0 6px 6px;
  text-align: center;
}

.block12a__title {
  margin: 0;
  font-family: 'Mandali', 'Noto Serif Telugu', sans-serif;
  font-weight: 600;
  line-height: 1.08;
  text-align: center;
  word-break: break-word;
}

.block12a__subtitle {
  margin: 6px 0 0;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  color: #444;
}

.block12a__visually-hidden {
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

.block12a__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  column-gap: ${gap}px;
  width: 100%;
  align-items: start;
}

.block12a__column {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.block12a__highlights {
  flex-shrink: 0;
  background: #f5f2ea;
  border: 1px solid #e0d8c8;
  border-radius: 2px;
  padding: 7px 9px 5px;
  margin: 0 0 7px;
}

.block12a__highlights ul { list-style: none; margin: 0; padding: 0; }

.block12a__highlights li {
  display: flex;
  gap: 5px;
  margin: 0 0 5px;
  font-size: ${BLOCK_12A.headlineFontPx}px;
  line-height: ${BLOCK_12A.headlineLinePx}px;
  font-weight: 700;
}

.block12a__point {
  flex: 1;
  border-bottom: 1px dashed #b8b0a0;
  padding-bottom: 2px;
}

/* Smart-object style: width-based box, cover fill (cols 2–4 tops) */
.block12a__figure--top {
  flex-shrink: 0;
  margin: 0 0 ${BLOCK_12A.imageGapBelowPx}px;
  width: 100%;
  border: 0.5px solid #ddd;
  overflow: hidden;
}

.block12a__figure--top .block12a__media {
  position: relative;
  width: 100%;
  aspect-ratio: ${aspW} / ${aspH};
  overflow: hidden;
  background: #ece8e0;
  line-height: 0;
}

.block12a__figure--top .block12a__media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 35%;
}

.block12a__caption {
  font-size: 8.5px;
  line-height: 11px;
  color: #555;
  padding: 2px 3px;
  text-align: center;
  font-style: italic;
  background: #f9f9f9;
  border-top: 0.5px solid #ddd;
}

.block12a__body {
  font-size: ${BLOCK_12A.bodyFontPx}px;
  line-height: 1.42;
  text-align: justify;
  text-align-last: left;
  hyphens: none;
  word-break: normal;
  line-break: strict;
}

.block12a__body p { margin: 0 0 4px; }
.block12a__body p:last-child { margin-bottom: 0; }

.block12a__bottom-gallery {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #e5dfd0;
  width: 100%;
}

.block12a__bottom-columns {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  column-gap: ${gap}px;
  width: 100%;
  align-items: start;
}

.block12a__bottom-col {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${BLOCK_12A.bottomThumbGapPx}px;
}

.block12a__bottom-slot--empty {
  height: ${thumb}px;
  min-height: ${thumb}px;
  flex-shrink: 0;
}

.block12a__bottom-figure {
  margin: 0;
  flex-shrink: 0;
  border: 0.5px solid #ddd;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.block12a__media--bottom {
  position: relative;
  width: 100%;
  height: ${thumb}px;
  min-height: ${thumb}px;
  max-height: ${thumb}px;
  overflow: hidden;
  background: #ece8e0;
  line-height: 0;
}

.block12a__media--bottom img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 40%;
}

.block12a__meta {
  font-family: ui-monospace, monospace;
  font-size: 9px;
  color: #64748b;
  margin-top: 6px;
  border-top: 1px dashed #cbd5e1;
  padding-top: 4px;
}

@media print {
  .block12a {
    width: ${w}mm;
    max-height: ${maxH}mm;
    page-break-inside: avoid;
  }
}
`
}
