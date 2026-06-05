/**
 * BLOCK-TOP8x7 — Main page top hero block (8in × 7in fixed).
 * Reference: front-page lead with title-behind-PNG, points/lead, 2-col body + quote rail.
 */

import { balanceBodyColumnsEven } from './mainPageTopBodyColumns'

const MM_TO_PX = 96 / 25.4

export const BLOCK_TOP8X7_CODE = 'BLOCK-TOP8x7'

export const BLOCK_TOP8X7_DIMENSIONS = {
  code: BLOCK_TOP8X7_CODE,
  widthIn: 8,
  heightIn: 7,
  widthMm: 203.2,
  heightMm: 177.8,
  nativeWidthPx: Math.floor(203.2 * MM_TO_PX),
  nativeHeightPx: Math.floor(177.8 * MM_TO_PX),
  columns: 2,
}

export const TOP8X7_STYLE_VARIANTS = {
  style1: 'style1',
  style2: 'style2',
}

export const MAIN_PAGE_TOP_LAYER_IDS = [
  'dateline',
  'titleKicker',
  'titleMain',
  'subtitleBar',
  'heroImage',
  'points',
  'lead',
  'callout',
  'bodyLeft',
  'bodyRight',
  'quoteMark',
  'continued',
]

export const DEFAULT_MAIN_PAGE_TOP_TEMPLATE = {
  id: 'default-top8x7',
  name: 'Main Page Top — Default',
  version: 1,
  dimensions: BLOCK_TOP8X7_DIMENSIONS,
  hero: {
    titleBehindImage: true,
    imageSide: 'right',
  },
  layout: {
    heroShare: 0.54,
    titleMaxWidthPx: null,
    titleMaxWidthPct: null,
    heroImageWidthPct: 48,
    heroImageHeightPct: 100,
    heroImageObjectFit: 'contain',
    bodyColumnGap: 20,
    columnRuleColor: '#c4a574',
    quoteBadgeColor: '#e85d04',
    padH: 12,
    padV: 8,
    bodyGap: 4,
    heroImageRightPx: 0,
    heroImageTopPx: 0,
    heroTextGapPx: 12,
    heroImageAlphaThreshold: 32,
    heroImageFlipH: false,
    heroImageFlipV: false,
    heroImageOpacity: 100,
    heroImageBrightness: 100,
    heroImageContrast: 100,
    heroImageSaturate: 100,
    heroImageRotationDeg: 0,
    heroImageObjectPosition: 'bottom right',
    quoteMarkOffsetX: 0,
    quoteMarkOffsetY: 0,
    styleVariant: TOP8X7_STYLE_VARIANTS.style1,
  },
  layers: {
    titleKicker: {
      x: 24,
      y: 18,
      width: 420,
      zIndex: 6,
      style: {
        fontFamily: "'Ramabhadra', 'Noto Serif Telugu', serif",
        fontSizePx: 22,
        fontWeight: 400,
        color: '#111111',
        lineHeight: 1.15,
        textAlign: 'left',
      },
    },
    titleMain: {
      x: 20,
      y: 44,
      width: null,
      zIndex: 8,
      style: {
        fontFamily: "'Ramabhadra', 'Noto Serif Telugu', serif",
        fontSizePx: 52,
        fontWeight: 400,
        color: '#c41e1e',
        strokeWidthPx: 3,
        strokeColor: '#ffffff',
        shadow: '2px 3px 0 rgba(0,0,0,0.35)',
        lineHeight: 1.05,
        textAlign: 'left',
      },
    },
    heroImage: {
      x: 380,
      y: 8,
      width: 360,
      height: 320,
      zIndex: 16,
    },
    points: {
      x: 24,
      y: 200,
      width: 340,
      zIndex: 22,
      style: {
        fontFamily: "'Mandali', sans-serif",
        fontSizePx: 13,
        fontWeight: 700,
        color: '#111',
        lineHeight: 1.45,
      },
    },
    lead: {
      x: 24,
      y: 200,
      width: 360,
      zIndex: 5,
      style: {
        fontFamily: "'Mandali', sans-serif",
        fontSizePx: 13,
        fontWeight: 600,
        color: '#222',
        lineHeight: 1.5,
      },
    },
    bodyLeft: {
      x: 16,
      y: 360,
      width: 348,
      zIndex: 4,
      style: {
        fontFamily: "'Mandali', sans-serif",
        fontSizePx: 18,
        lineHeight: 1.48,
        color: '#111',
        textAlign: 'justify',
      },
    },
    bodyRight: {
      x: 400,
      y: 360,
      width: 348,
      zIndex: 4,
      style: {
        fontFamily: "'Mandali', sans-serif",
        fontSizePx: 18,
        lineHeight: 1.48,
        color: '#111',
        textAlign: 'justify',
        fontStyle: 'normal',
      },
    },
    quoteMark: {
      x: 368,
      y: 520,
      width: 36,
      zIndex: 6,
      style: {
        fontSizePx: 28,
        color: '#ffffff',
        backgroundColor: '#c41e1e',
      },
    },
    continued: {
      x: 16,
      y: 640,
      width: 200,
      zIndex: 4,
      style: {
        fontFamily: "'Mandali', sans-serif",
        fontSizePx: 9,
        color: '#1a5fb4',
        fontWeight: 700,
      },
    },
  },
}

/** Style 2 — reference front page: dateline, red title, green band, yellow callout, 8×7in. */
export const DEFAULT_MAIN_PAGE_TOP_TEMPLATE_STYLE2 = {
  ...DEFAULT_MAIN_PAGE_TOP_TEMPLATE,
  id: 'default-top8x7-style2',
  name: 'Main Page Top — Style 2',
  styleVariant: TOP8X7_STYLE_VARIANTS.style2,
  layout: {
    ...DEFAULT_MAIN_PAGE_TOP_TEMPLATE.layout,
    styleVariant: TOP8X7_STYLE_VARIANTS.style2,
    heroShare: 1,
    titleBandShare: 0.32,
    contentPointsShare: 0.5,
    contentArticleShare: 0.42,
    contentPhotoShare: 0.34,
    heroImageWidthPct: 100,
    heroImageHeightPct: 62,
    subtitleBarColor: '#1a9e3f',
    subtitleBarTextColor: '#ffffff',
    calloutBoxColor: '#f7ea00',
    calloutTextColor: '#111111',
    calloutWidthPct: 36,
    calloutHeightPct: 40,
    calloutRightPx: 4,
    calloutBottomPx: 8,
    style2PhotoRowShare: 62,
  },
  layers: {
    ...JSON.parse(JSON.stringify(DEFAULT_MAIN_PAGE_TOP_TEMPLATE.layers)),
    dateline: {
      zIndex: 5,
      style: {
        fontFamily: "'Mandali', sans-serif",
        fontSizePx: 17,
        fontWeight: 700,
        color: '#111111',
        lineHeight: 1.22,
      },
    },
    subtitleBar: {
      zIndex: 7,
      style: {
        fontFamily: "'Mandali', sans-serif",
        fontSizePx: 15,
        fontWeight: 700,
        color: '#ffffff',
        lineHeight: 1.35,
      },
    },
    titleMain: {
      x: 12,
      y: 28,
      width: null,
      zIndex: 8,
      style: {
        fontFamily: "'Ramabhadra', 'Noto Serif Telugu', serif",
        fontSizePx: 76,
        fontWeight: 400,
        color: '#d40000',
        strokeWidthPx: 4,
        strokeColor: '#ffffff',
        shadow: '2px 3px 0 rgba(0,0,0,0.25)',
        lineHeight: 1.02,
        textAlign: 'left',
      },
    },
    titleKicker: {
      zIndex: 7,
      style: {
        fontFamily: "'Mandali', sans-serif",
        fontSizePx: 15,
        fontWeight: 700,
        color: '#ffffff',
        lineHeight: 1.35,
      },
    },
    callout: {
      zIndex: 26,
      style: {
        fontFamily: "'Ramabhadra', serif",
        fontSizePx: 22,
        fontWeight: 700,
        color: '#111111',
        lineHeight: 1.15,
      },
    },
    heroImage: {
      x: 0,
      y: 0,
      width: 280,
      height: 200,
      zIndex: 12,
    },
    points: {
      zIndex: 20,
      style: {
        fontFamily: "'Mandali', sans-serif",
        fontSizePx: 12.5,
        fontWeight: 700,
        color: '#111',
        lineHeight: 1.38,
      },
    },
    bodyLeft: {
      zIndex: 4,
      style: {
        fontFamily: "'Mandali', sans-serif",
        fontSizePx: 12.5,
        fontWeight: 400,
        color: '#111111',
        lineHeight: 1.48,
        textAlign: 'justify',
      },
    },
    continued: {
      style: {
        fontFamily: "'Mandali', sans-serif",
        fontSizePx: 14,
        color: '#ffffff',
        fontWeight: 800,
        backgroundColor: '#1a5fb4',
      },
    },
  },
}

export const BUILTIN_MAIN_PAGE_TOP_TEMPLATES = [
  DEFAULT_MAIN_PAGE_TOP_TEMPLATE,
  DEFAULT_MAIN_PAGE_TOP_TEMPLATE_STYLE2,
]

export function isTop8x7Style2(templateOrLayout) {
  const v =
    templateOrLayout?.styleVariant ||
    templateOrLayout?.layout?.styleVariant ||
    TOP8X7_STYLE_VARIANTS.style1
  return v === TOP8X7_STYLE_VARIANTS.style2
}

export function buildTitleEffectStyle(layerStyle = {}) {
  const s = layerStyle || {}
  const out = {
    fontFamily: s.fontFamily || "'Ramabhadra', serif",
    fontSize: `${s.fontSizePx || 48}px`,
    fontWeight: s.fontWeight || 400,
    color: s.color || '#c41e1e',
    lineHeight: s.lineHeight || 1.05,
    textAlign: s.textAlign || 'left',
  }
  if (s.strokeWidthPx > 0) {
    out.WebkitTextStroke = `${s.strokeWidthPx}px ${s.strokeColor || '#fff'}`
    out.paintOrder = 'stroke fill'
  }
  if (s.shadow) out.textShadow = s.shadow
  return out
}

export function splitBodyForTopBlock(paragraphs = [], quoteParagraph = '', options = {}) {
  const skipFirst = !!options.skipFirstParagraph
  let items = paragraphs
    .map((p) => String(p?.content ?? p ?? '').trim())
    .filter(Boolean)
  if (skipFirst && items.length > 1) items = items.slice(1)
  if (!items.length) return { left: '', right: '', quote: quoteParagraph || '' }

  const quoteIdx = items.findIndex(
    (t) =>
      /^["“‘]/.test(t) ||
      /అన్నారు\s*["”']?\s*$/.test(t) ||
      (t.length < 140 && /అన్నారు|చెప్పారు/.test(t))
  )
  let quote = quoteParagraph
  let body = [...items]
  if (quoteIdx >= 0 && !quote) {
    quote = items[quoteIdx]
    body = items.filter((_, i) => i !== quoteIdx)
  }

  const balanced = balanceBodyColumnsEven(body)

  return {
    left: balanced.left,
    right: balanced.right,
    quote: quote || '',
  }
}
