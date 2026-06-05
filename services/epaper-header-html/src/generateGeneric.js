/**
 * Fallback HTML for styles not yet ported to static templates.
 */
import { escapeHtml } from './utils.js'
import { slotSize } from './typography.js'

export function generateGenericMainCss() {
  return `
.ep-generic-main {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-top: 4px solid var(--ep-accent, #dc2626);
  font-family: 'Mandali', 'Noto Sans Telugu', Georgia, serif;
}
.ep-generic-main__body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  text-align: center;
}
.ep-generic-main__title {
  font-size: 42px;
  font-weight: 900;
  line-height: 1.05;
  color: #111;
}
.ep-generic-main__sub {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
  font-family: 'Inter', system-ui, sans-serif;
}
.ep-generic-main__bar {
  flex-shrink: 0;
  padding: 5px 12px;
  font-size: 10px;
  color: #fff;
  font-family: 'Inter', system-ui, sans-serif;
  display: flex;
  justify-content: space-between;
}
`
}

export function generateGenericMainHtml(s, preset, styleKey, styleNum) {
  const slot = slotSize(preset, 'main')
  const ac = escapeHtml(s.accentColor || '#dc2626')
  return `<div class="ep-header-slot ep-generic-main" data-style="${escapeHtml(styleKey)}" data-style-number="${styleNum}" data-preset="${preset}" style="width:${slot.widthIn}in;height:${slot.heightIn}in;--ep-accent:${ac}" lang="te">
  <div class="ep-generic-main__body">
    <div>
      <div class="ep-generic-main__title">${escapeHtml(s.paperName || '')}</div>
      <div class="ep-generic-main__sub">${escapeHtml(s.paperNameEn || '')} · Style ${styleNum} preview</div>
    </div>
  </div>
  <div class="ep-generic-main__bar" style="background:${ac}">
    <span>${escapeHtml(s.publishedAreas || '')}</span>
    <span>${escapeHtml(s.date || '')} · ${escapeHtml(s.price || '')}</span>
  </div>
</div>`
}

export function generateGenericSubCss() {
  return `
.ep-generic-sub {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: #f8fafc;
  border-bottom: 2px solid #111;
  font-family: 'Inter', system-ui, sans-serif;
  box-sizing: border-box;
}
.ep-generic-sub__left {
  font-weight: 800;
  font-family: 'Mandali', 'Noto Sans Telugu', Georgia, serif;
  color: #111;
}
.ep-generic-sub__right {
  font-size: 11px;
  color: #64748b;
}
`
}

export function generateGenericSubHtml(s, preset, styleKey, styleNum) {
  const slot = slotSize(preset, 'sub')
  return `<div class="ep-header-slot ep-generic-sub" data-style="${escapeHtml(styleKey)}" data-style-number="${styleNum}" data-preset="${preset}" data-page="2+" style="width:${slot.widthIn}in;height:${slot.heightIn}in" lang="te">
  <div class="ep-generic-sub__left" style="font-size:18px">${escapeHtml(s.sectionName || s.paperName || '')}</div>
  <div class="ep-generic-sub__right">${escapeHtml(s.date || '')} · పేజీ ${escapeHtml(s.pageNumber || '2')}</div>
</div>`
}
