/**
 * SUB HEADER STYLE 1 — Page (left) | Logo (center) | Date (right)
 * Page 2+ running header
 */
import { escapeHtml } from './utils.js'
import { slotInlineStyle, subMetrics } from './typography.js'

export function generateSubStyle1Css(preset = 'broadsheet') {
  const m = subMetrics(preset)
  return `
.ep-sub1 {
  width: 100%;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', system-ui, sans-serif;
}
.ep-sub1__rule {
  flex-shrink: 0;
  height: ${m.rulePx}px;
  background: #111;
}
.ep-sub1__row {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 ${m.padX}px;
  gap: ${m.gap}px;
}
.ep-sub1__page {
  justify-self: start;
  font-weight: 700;
  font-size: ${m.bigFont}px;
  color: #111;
  font-family: 'Mandali', 'Noto Sans Telugu', Georgia, serif;
  white-space: nowrap;
  line-height: 1.1;
}
.ep-sub1__center {
  justify-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: ${m.logoMaxWidth};
  height: 100%;
  min-width: 0;
}
.ep-sub1__center img {
  max-width: 100%;
  max-height: ${m.logoMaxHeight};
  width: auto;
  height: auto;
  object-fit: contain;
}
.ep-sub1__center-text {
  font-weight: 800;
  font-size: ${m.bigFont}px;
  color: #0f172a;
  font-family: 'Mandali', 'Noto Sans Telugu', Georgia, serif;
  text-align: center;
  line-height: 1.05;
}
.ep-sub1__date {
  justify-self: end;
  font-size: ${m.smFont}px;
  color: #475569;
  font-family: 'Mandali', 'Noto Sans Telugu', Georgia, serif;
  text-align: right;
  white-space: nowrap;
  line-height: 1.2;
}
`
}

export function generateSubStyle1Html(s = {}, preset = 'broadsheet') {
  const slotStyle = slotInlineStyle(preset, 'sub')
  const logoUrl = s.subHeaderLogoUrl || ''
  const pageLabel = s.pageNumber ? `పేజీ ${escapeHtml(s.pageNumber)}` : 'పేజీ 2'
  const dateText = escapeHtml(s.date || '')
  const paperFallback = escapeHtml(s.paperName || 'కాబుర్లు టుడే')

  const center = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="" />`
    : `<span class="ep-sub1__center-text">${paperFallback}</span>`

  return `<div class="ep-header-slot ep-sub1 sub-header" data-style="sub_header_style1" data-preset="${preset}" data-page="2+" style="${slotStyle}" lang="te">
  <div class="ep-sub1__rule"></div>
  <div class="ep-sub1__row">
    <div class="ep-sub1__page">${pageLabel}</div>
    <div class="ep-sub1__center">${center}</div>
    <div class="ep-sub1__date">${dateText}</div>
  </div>
  <div class="ep-sub1__rule"></div>
</div>`
}
