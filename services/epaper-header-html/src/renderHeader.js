import { HEADER_SPECS, DEFAULT_SETTINGS, RECOMMENDED_HEADER_STYLES } from './constants.js'
import { generateHeaderBaseCss } from './generateHeaderBaseCss.js'
import { generateMainStyle1Css, generateMainStyle1Html } from './generateMainStyle1.js'
import { generateMainStyle2Css, generateMainStyle2Html } from './generateMainStyle2.js'
import { generateMainStyle3Css, generateMainStyle3Html } from './generateMainStyle3.js'
import { generateMainStyle4Css, generateMainStyle4Html } from './generateMainStyle4.js'
import { generateMainStyle5Css, generateMainStyle5Html } from './generateMainStyle5.js'
import { generateSubStyle1Css, generateSubStyle1Html } from './generateSubStyle1.js'
import { generateSubStyle2Css, generateSubStyle2Html } from './generateSubStyle2.js'
import {
  generateGenericMainCss,
  generateGenericMainHtml,
  generateGenericSubCss,
  generateGenericSubHtml,
} from './generateGeneric.js'
import { slotSize } from './typography.js'

export const ENGINE_VERSION = 'header-v1.4'

const MAIN_RENDERERS = {
  1: { css: generateMainStyle1Css, html: generateMainStyle1Html, key: 'main_style1' },
  2: { css: generateMainStyle2Css, html: generateMainStyle2Html, key: 'main_style2' },
  3: { css: generateMainStyle3Css, html: generateMainStyle3Html, key: 'main_style3' },
  4: { css: generateMainStyle4Css, html: generateMainStyle4Html, key: 'main_style4' },
  5: { css: generateMainStyle5Css, html: generateMainStyle5Html, key: 'main_style5' },
}

const SUB_RENDERERS = {
  1: { css: generateSubStyle1Css, html: generateSubStyle1Html, key: 'sub_header_style1' },
  2: { css: generateSubStyle2Css, html: generateSubStyle2Html, key: 'sub_header_style2' },
}

function normalizePreset(p) {
  return p === 'tabloid' ? 'tabloid' : 'broadsheet'
}

function resolveStyleNumber(input, fallback = 1) {
  const n = Number(input)
  if (Number.isFinite(n) && n >= 1 && n <= 10) return Math.floor(n)
  return fallback
}

function mergeSettings(body = {}) {
  return { ...DEFAULT_SETTINGS, ...body }
}

export function renderMainHeader(body = {}) {
  const preset = normalizePreset(body.preset || body.paperType)
  const settings = mergeSettings(body.settings || body)
  const styleNumber = resolveStyleNumber(
    body.headerStyleNumber ?? body.styleNumber,
    RECOMMENDED_HEADER_STYLES.page1Main,
  )
  const slot = slotSize(preset, 'main')

  const renderer = MAIN_RENDERERS[styleNumber]
  let html
  let cssParts = [generateHeaderBaseCss()]

  if (renderer) {
    cssParts.push(renderer.css(preset))
    html = renderer.html(settings, preset)
  } else {
    cssParts.push(generateGenericMainCss())
    html = generateGenericMainHtml(settings, preset, `main_style${styleNumber}`, styleNumber)
  }

  return {
    kind: 'main',
    pageRule: 'page === 1',
    preset,
    styleNumber,
    styleKey: renderer?.key || `main_style${styleNumber}`,
    widthIn: slot.widthIn,
    heightIn: slot.heightIn,
    html,
    css: cssParts.join('\n'),
  }
}

export function renderSubHeader(body = {}) {
  const preset = normalizePreset(body.preset || body.paperType)
  const settings = mergeSettings(body.settings || body)
  const styleNumber = resolveStyleNumber(
    body.subHeaderStyleNumber ?? body.styleNumber,
    RECOMMENDED_HEADER_STYLES.page2PlusSub,
  )
  const slot = slotSize(preset, 'sub')

  const renderer = SUB_RENDERERS[styleNumber]
  let html
  let cssParts = [generateHeaderBaseCss()]

  if (renderer) {
    cssParts.push(renderer.css(preset))
    html = renderer.html(settings, preset)
  } else {
    cssParts.push(generateGenericSubCss())
    html = generateGenericSubHtml(settings, preset, `sub_header_style${styleNumber}`, styleNumber)
  }

  return {
    kind: 'sub',
    pageRule: 'page >= 2',
    preset,
    styleNumber,
    styleKey: renderer?.key || `sub_header_style${styleNumber}`,
    widthIn: slot.widthIn,
    heightIn: slot.heightIn,
    html,
    css: cssParts.join('\n'),
  }
}

export function renderHeaderPair(body = {}) {
  const main = renderMainHeader(body)
  const sub = renderSubHeader(body)
  return { main, sub, engineVersion: ENGINE_VERSION }
}

export function generatePreviewDocument(pair, title = 'ePaper Headers') {
  const { main, sub } = pair
  const css = `${main.css}\n${sub.css}`
  return `<!DOCTYPE html>
<html lang="te">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { margin:0; padding:24px; background:#e2e8f0; font-family:system-ui,sans-serif; }
    h2 { margin:24px 0 8px; font-size:14px; color:#334155; }
    .slot-wrap { width:100%; margin-bottom:8px; }
    .ep-header-preview-wrap { width:100%; }
    ${css}
  </style>
</head>
<body>
  <h2>పేజీ 1 — Main header (${main.styleKey}) · ${main.widthIn}×${main.heightIn}in</h2>
  <div class="slot-wrap ep-header-preview-wrap">${main.html}</div>
  <h2>పేజీ 2+ — Sub header (${sub.styleKey}) · ${sub.widthIn}×${sub.heightIn}in</h2>
  <div class="slot-wrap ep-header-preview-wrap">${sub.html}</div>
  <p style="font-size:11px;color:#64748b;margin-top:20px">${ENGINE_VERSION} · broadsheet</p>
</body>
</html>`
}

export { HEADER_SPECS }
