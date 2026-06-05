/**
 * Shared 18% | 64% | 18% masthead frame (Style 2 layout family)
 */
import { escapeHtml, splitPublishedAreas, resolveCenterLogoUrl } from './utils.js'
import { slotInlineStyle } from './typography.js'
import { DEFAULT_SETTINGS } from './constants.js'

export function mergeMainSettings(s = {}) {
  return { ...DEFAULT_SETTINGS, ...s }
}

export function main3ColFrameCss(prefix, preset = 'broadsheet') {
  const isBroad = preset === 'broadsheet'
  const p = prefix
  return `
.${p} {
  width: 100%;
  height: 100%;
  background: #f7f4ef;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.${p}__frame {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 18% 64% 18%;
  border: 1px solid #d1d5db;
  background: #fff;
}
.${p}__side {
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.${p}__side--left {
  border-right: 1px solid #d1d5db;
}
.${p}__side--right {
  border-left: 1px solid #d1d5db;
}
.${p}__side-body {
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.${p}__center {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 0;
}
.${p}__logo-zone {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
  overflow: hidden;
}
.${p}__logo-zone img {
  max-width: 96%;
  max-height: ${isBroad ? '2.15in' : '1.75in'};
  object-fit: contain;
}
.${p}__title {
  margin: 0;
  font-size: ${isBroad ? '1.55in' : '1.3in'};
  font-weight: 900;
  color: #0056a8;
  line-height: 1;
  text-align: center;
}
.${p}__meta {
  flex-shrink: 0;
  border-top: 4px solid #c58a2b;
  background: #f3e6d2;
}
.${p}__meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: ${isBroad ? '0.14in' : '0.12in'};
  font-weight: 600;
  color: #1f2937;
}
.${p}__meta-grid > div {
  padding: 4px 8px;
  border-right: 1px solid #9ca3af;
  overflow: hidden;
}
.${p}__meta-grid > div:last-child {
  border-right: 0;
  text-align: right;
}
.${p}__meta-center {
  text-align: center;
  white-space: nowrap;
}
.${p}__meta-published {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
}
`
}

export function renderMain3ColCenter(settings, preset, prefix) {
  const centerImage = resolveCenterLogoUrl(settings)
  const website = settings.websiteUrl || settings.paperNameEn || ''
  const cities = splitPublishedAreas(settings.publishedAreas)
  const citiesHtml = cities
    .slice(0, 4)
    .map((c) => `<span>${escapeHtml(c)}</span>`)
    .join('')

  const centerBlock = centerImage
    ? `<img src="${escapeHtml(centerImage)}" alt="${escapeHtml(settings.paperName || '')}" />`
    : `<h1 class="${prefix}__title">${escapeHtml(settings.paperName || '')}</h1>`

  return `<section class="${prefix}__center">
    <div class="${prefix}__logo-zone">${centerBlock}</div>
    <div class="${prefix}__meta">
      <div class="${prefix}__meta-grid">
        <div class="${prefix}__meta-published"><span>Published from:</span>${citiesHtml}</div>
        <div class="${prefix}__meta-center"><span>తెలంగాణ</span> <span>|</span> <span>${escapeHtml(settings.date || '')}</span></div>
        <div><span>వెల: ${escapeHtml(settings.price || '')}</span> <span>సంపుటి: ${escapeHtml(settings.volume || '')}</span> <span>సంచిక: ${escapeHtml(settings.issue || '')}</span></div>
      </div>
    </div>
  </section>`
}

export function wrapMain3ColHeader({
  prefix,
  styleKey,
  preset,
  settings,
  leftHtml,
  rightHtml,
}) {
  const slotStyle = slotInlineStyle(preset, 'main')
  return `<header class="ep-header-slot ${prefix} header-frame" data-style="${styleKey}" data-preset="${preset}" style="${slotStyle}" lang="te">
  <div class="${prefix}__frame">
    ${leftHtml}
    ${renderMain3ColCenter(settings, preset, prefix)}
    ${rightHtml}
  </div>
</header>`
}
