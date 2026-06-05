import { DEFAULT_SETTINGS, HEADER_SPECS } from './constants.js'
import { slotSize } from './typography.js'
import { generateHeaderBaseCss } from './generateHeaderBaseCss.js'
import { generateMainStyle1Html, generateMainStyle1Css } from './generateMainStyle1.js'
import { generateMainStyle2Html, generateMainStyle2Css } from './generateMainStyle2.js'
import { generateMainStyle3Html, generateMainStyle3Css } from './generateMainStyle3.js'
import { generateMainStyle4Html, generateMainStyle4Css } from './generateMainStyle4.js'
import { generateMainStyle5Html, generateMainStyle5Css } from './generateMainStyle5.js'
import { generateSubStyle1Html, generateSubStyle1Css } from './generateSubStyle1.js'
import { generateSubStyle2Html, generateSubStyle2Css } from './generateSubStyle2.js'

const STYLES = {
  main_style1: {
    layer: 'main',
    number: 1,
    css: generateMainStyle1Css,
    html: generateMainStyle1Html,
  },
  main_style2: {
    layer: 'main',
    number: 2,
    css: generateMainStyle2Css,
    html: generateMainStyle2Html,
  },
  main_style3: {
    layer: 'main',
    number: 3,
    css: generateMainStyle3Css,
    html: generateMainStyle3Html,
  },
  main_style4: {
    layer: 'main',
    number: 4,
    css: generateMainStyle4Css,
    html: generateMainStyle4Html,
  },
  main_style5: {
    layer: 'main',
    number: 5,
    css: generateMainStyle5Css,
    html: generateMainStyle5Html,
  },
  sub_header_style1: {
    layer: 'sub',
    number: 1,
    css: generateSubStyle1Css,
    html: generateSubStyle1Html,
  },
  sub_header_style2: {
    layer: 'sub',
    number: 2,
    css: generateSubStyle2Css,
    html: generateSubStyle2Html,
  },
}

function resolveStyleKey(style) {
  const raw = String(style || '').trim().toLowerCase()
  if (STYLES[raw]) return raw
  const n = Number(raw.replace(/\D/g, '')) || 1
  if (raw.includes('sub') || raw.startsWith('sub')) {
    return n === 2 ? 'sub_header_style2' : 'sub_header_style1'
  }
  if (n >= 1 && n <= 5) return `main_style${n}`
  return 'main_style1'
}

/**
 * @param {'main_style1'|'main_style2'|'sub_header_style1'|'sub_header_style2'|number|string} style
 * @param {object} settings
 * @param {'broadsheet'|'tabloid'} [preset]
 */
export function renderHeaderStyle(style, settings = {}, preset = 'broadsheet') {
  const key = resolveStyleKey(style)
  const def = STYLES[key]
  if (!def) {
    return { valid: false, error: `Unknown style: ${style}` }
  }
  const s = { ...DEFAULT_SETTINGS, ...settings }
  const css = generateHeaderBaseCss() + def.css(preset)
  const html = def.html(s, preset)
  const slot = slotSize(preset, def.layer === 'main' ? 'main' : 'sub')

  return {
    valid: true,
    styleKey: key,
    layer: def.layer,
    number: def.number,
    preset,
    widthIn: slot.widthIn,
    heightIn: slot.heightIn,
    specs: HEADER_SPECS[preset],
    html,
    css,
    previewHtml: wrapPreview(html, css, slot.widthIn, slot.heightIn),
  }
}

export function renderAllHeaderStyles(settings = {}, preset = 'broadsheet') {
  return Object.keys(STYLES).map((key) => renderHeaderStyle(key, settings, preset))
}

function wrapPreview(html, css, widthIn, heightIn) {
  return `<!DOCTYPE html>
<html lang="te">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ePaper Header Preview</title>
  <style>
    body { margin: 0; padding: 24px; background: #e2e8f0; }
    .slot { width: ${widthIn}in; max-width: 100%; height: ${heightIn}in; margin: 0 auto; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
    ${css}
  </style>
</head>
<body>
  <div class="slot">${html}</div>
</body>
</html>`
}
