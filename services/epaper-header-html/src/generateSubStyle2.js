/**
 * SUB HEADER STYLE 2 — Full color bar (section | paper · date | page)
 */
import { escapeHtml } from './utils.js'
import { slotInlineStyle, subMetrics } from './typography.js'

export function generateSubStyle2Css(preset = 'broadsheet') {
  const m = subMetrics(preset)
  return `
.ep-sub2 {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: 'Inter', system-ui, sans-serif;
  box-sizing: border-box;
}
.ep-sub2__section {
  font-weight: 800;
  color: #fff;
  font-family: 'Mandali', 'Noto Sans Telugu', Georgia, serif;
  white-space: nowrap;
}
.ep-sub2__meta {
  color: rgba(255,255,255,0.9);
  white-space: nowrap;
}
.ep-sub2__page {
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}

.ep-sub2.section-header {
  padding: 0 ${m.padX}px;
}
`
}

export function generateSubStyle2Html(s = {}, preset = 'broadsheet') {
  const slotStyle = slotInlineStyle(preset, 'sub')
  const m = subMetrics(preset)
  const ac = escapeHtml(s.accentColor || '#dc2626')
  const big = m.bigFont
  const sm = m.smFont

  return `<div class="ep-header-slot ep-sub2 section-header" data-style="sub_header_style2" data-preset="${preset}" data-page="2+" style="${slotStyle};background:${ac}" lang="te">
  <div class="ep-sub2__section" style="font-size:${big}px">${escapeHtml(s.sectionName || 'రాజకీయాలు')}</div>
  <div class="ep-sub2__meta" style="font-size:${sm}px">${escapeHtml(s.date || '')}</div>
  <div class="ep-sub2__page" style="font-size:${big}px">Page ${escapeHtml(s.pageNumber || '2')}</div>
</div>`
}
