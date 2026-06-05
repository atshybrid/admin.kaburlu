/** BLOCK-08A body — H&J Narrow (CSS justify + hyphens; matches Block08ColumnBody). */

export const BLOCK_08A_BODY_HJ = {
  fontSize: '11px',
  lineHeight: '1.48',
  fontFamily: "'Mandali', sans-serif",
  textAlign: 'justify',
  textAlignLast: 'justify',
  textJustify: 'inter-word',
  wordSpacing: 'normal',
  letterSpacing: 'normal',
  hyphens: 'auto',
  hyphenateLimitChars: '6 4 3',
  wordBreak: 'normal',
  overflowWrap: 'break-word',
  lineBreak: 'auto',
  widows: 2,
  orphans: 2,
}

export function normalizeFlowText(text) {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Fallback / screen-reader layer when composer not used */
export function block08BodyParagraphCssText(overrides = {}) {
  const h = { ...BLOCK_08A_BODY_HJ, ...overrides }
  return [
    'margin:0',
    `text-align:${h.textAlign}`,
    `text-align-last:${h.textAlignLast}`,
    `text-justify:${h.textJustify}`,
    `word-spacing:${h.wordSpacing}`,
    `letter-spacing:${h.letterSpacing}`,
    `hyphens:${h.hyphens}`,
    `-webkit-hyphens:${h.hyphens}`,
    `-ms-hyphens:${h.hyphens}`,
    `hyphenate-limit-chars:${h.hyphenateLimitChars}`,
    `word-break:${h.wordBreak}`,
    `overflow-wrap:${h.overflowWrap}`,
    `line-break:${h.lineBreak}`,
  ].join(';')
}
