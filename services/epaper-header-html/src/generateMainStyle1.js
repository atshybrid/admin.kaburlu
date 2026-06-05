/**
 * MAIN HEADER STYLE 1 — Classic 3-Col + Info Bar
 * | Ad Left | Logo (center) | Ad Right |
 * | Date · Price · Volume | Areas covered |
 */
import { escapeHtml } from './utils.js'
import { mainMetrics, slotInlineStyle } from './typography.js'

export function generateMainStyle1Css(preset = 'broadsheet') {
  const m = mainMetrics(preset)
  return `
/* ── Main Style 1: Classic 3-Col + Info Bar ── */
.ep-main1 {
  width: 100%;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.ep-main1__row {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.ep-main1__side {
  width: ${m.sideWidthPct};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${preset === 'tabloid' ? '0' : '2px'};
  overflow: hidden;
}

.ep-main1__side--left {
  border-right: 0.5px solid #e2e8f0;
}

.ep-main1__side--right {
  border-left: 0.5px solid #e2e8f0;
}

.ep-main1__side img {
  width: 100%;
  height: 100%;
  max-height: 90%;
  object-fit: ${preset === 'broadsheet' ? 'cover' : 'contain'};
  object-position: center center;
}

.ep-main1__center {
  width: ${m.centerWidthPct};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  overflow: hidden;
  background: #fff;
}

.ep-main1__center img {
  width: 100%;
  height: 100%;
  max-height: 92%;
  object-fit: contain;
  object-position: center center;
}

.ep-main1__info {
  flex-shrink: 0;
  color: #fff;
  padding: ${m.infoBarPad};
  font-size: ${m.infoBarFont}px;
  font-family: 'Inter', system-ui, sans-serif;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.ep-main1__info-meta {
  font-weight: 700;
  white-space: nowrap;
}

.ep-main1__info-areas {
  text-align: right;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
`
}

export function generateMainStyle1Html(s = {}, preset = 'broadsheet') {
  const ac = s.accentColor || '#dc2626'
  const leftAd = s.adLeftUrl || ''
  const rightAd = s.adRightUrl || s.adUrl || ''
  const centerLogo = s.headerLogoUrl || s.logoUrl || s.paperNameImageUrl || ''
  const slotStyle = slotInlineStyle(preset, 'main')

  const sidePlaceholder = (label) =>
    `<div class="ep-placeholder">${escapeHtml(label)}</div>`

  const datePriceVol = [
    s.date,
    s.price ? `వెల ${s.price}` : '',
    s.volume ? `సంపుటి ${s.volume}` : '',
    s.issue ? `సంచిక ${s.issue}` : '',
  ]
    .filter(Boolean)
    .map((x) => escapeHtml(x))
    .join(' · ')

  return `<header class="ep-header-slot ep-main1 main-header" data-style="main_style1" data-preset="${preset}" style="${slotStyle}" lang="te">
  <div class="ep-main1__row header-row">
    <div class="ep-main1__side ep-main1__side--left left-ad">
      ${leftAd ? `<img src="${escapeHtml(leftAd)}" alt="" />` : sidePlaceholder('Left Ad')}
    </div>
    <div class="ep-main1__center logo-section">
      ${centerLogo ? `<img src="${escapeHtml(centerLogo)}" alt="" />` : sidePlaceholder('Logo')}
    </div>
    <div class="ep-main1__side ep-main1__side--right right-ad">
      ${rightAd ? `<img src="${escapeHtml(rightAd)}" alt="" />` : sidePlaceholder('Right Ad')}
    </div>
  </div>
  <div class="ep-main1__info info-bar" style="background:${escapeHtml(ac)}">
    <span class="ep-main1__info-meta">${datePriceVol}</span>
    <span class="ep-main1__info-areas">${escapeHtml(s.publishedAreas || '')}</span>
  </div>
</header>`
}
