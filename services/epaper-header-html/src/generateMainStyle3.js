/**
 * MAIN STYLE 3 — Astrology chips (left) | Masthead | Gold/Silver cards (right)
 */
import { escapeHtml } from './utils.js'
import {
  main3ColFrameCss,
  mergeMainSettings,
  wrapMain3ColHeader,
} from './mainStyle3ColShared.js'
import { sideRibbonCss } from './sidePanelDecor.js'

const P = 'ep-main3'

function astroChip(label, value, type) {
  const icons = { good: '✦', warn: '☾', bad: '⚠', info: '◆' }
  return `<li class="${P}__chip ${P}__chip--${type}">
    <span class="${P}__chip-ico">${icons[type] || '•'}</span>
    <span class="${P}__chip-lbl">${escapeHtml(label)}</span>
    <span class="${P}__chip-val">${escapeHtml(value)}</span>
  </li>`
}

function rateCard(metal, label, price, change, variant) {
  const up = !String(change).startsWith('-')
  const icon = variant === 'gold' ? '🥇' : '🥈'
  return `<div class="${P}__rate-card ${P}__rate-card--${variant}">
    <div class="${P}__rate-card__shine"></div>
    <div class="${P}__rate-card__head">
      <span class="${P}__rate-card__icon">${icon}</span>
      <span class="${P}__rate-card__metal">${escapeHtml(metal)}</span>
    </div>
    <div class="${P}__rate-card__price">${escapeHtml(price)}</div>
    <div class="${P}__rate-card__sub">${escapeHtml(label)}</div>
    <span class="${P}__rate-badge ${up ? `${P}__rate-badge--up` : `${P}__rate-badge--down`}">${escapeHtml(change)}</span>
  </div>`
}

export function generateMainStyle3Css(preset = 'broadsheet') {
  const isBroad = preset === 'broadsheet'
  return (
    main3ColFrameCss(P, preset) +
    sideRibbonCss(P, isBroad, 'astro') +
    `
.${P}__side--left { background: linear-gradient(180deg, #faf5ff 0%, #ede9fe 100%); }
.${P}__side--right { background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%); }
.${P}__side-body { padding: 2px; }

.${P}__panel--astro .${P}__panel-body {
  background: radial-gradient(ellipse at top, rgba(124,58,237,0.08) 0%, transparent 70%);
}
.${P}__day-pill {
  text-align: center;
  font-weight: 800;
  font-size: ${isBroad ? '0.13in' : '0.11in'};
  color: #5b21b6;
  background: linear-gradient(90deg, #ede9fe, #fff, #ede9fe);
  border: 1px solid #c4b5fd;
  border-radius: 20px;
  padding: 2px 6px;
}
.${P}__chips {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}
.${P}__chip {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  gap: 0 4px;
  padding: 3px 5px;
  border-radius: 5px;
  border-left: 3px solid transparent;
  background: rgba(255,255,255,0.85);
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.${P}__chip-ico { grid-row: 1 / 3; font-size: ${isBroad ? '0.16in' : '0.13in'}; align-self: center; }
.${P}__chip-lbl {
  font-size: ${isBroad ? '0.1in' : '0.085in'};
  font-weight: 700;
  color: #64748b;
  font-family: 'Inter', system-ui, sans-serif;
}
.${P}__chip-val {
  font-size: ${isBroad ? '0.11in' : '0.095in'};
  font-weight: 800;
  color: #1e293b;
}
.${P}__chip--good { border-left-color: #22c55e; }
.${P}__chip--good .${P}__chip-ico { color: #16a34a; }
.${P}__chip--warn { border-left-color: #a855f7; }
.${P}__chip--warn .${P}__chip-ico { color: #7c3aed; }
.${P}__chip--bad { border-left-color: #ef4444; }
.${P}__chip--bad .${P}__chip-ico { color: #dc2626; }
.${P}__chip--info { border-left-color: #f59e0b; }
.${P}__chip--info .${P}__chip-ico { color: #d97706; }

.${P}__rates-stack {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  justify-content: center;
}
.${P}__rate-card {
  position: relative;
  border-radius: 6px;
  padding: 5px 6px 6px;
  overflow: hidden;
  text-align: center;
}
.${P}__rate-card--gold {
  background: linear-gradient(145deg, #fef9c3 0%, #fde047 35%, #ca8a04 100%);
  border: 1px solid #eab308;
}
.${P}__rate-card--silver {
  background: linear-gradient(145deg, #f8fafc 0%, #cbd5e1 40%, #94a3b8 100%);
  border: 1px solid #94a3b8;
}
.${P}__rate-card__shine {
  position: absolute;
  top: -20%;
  left: -10%;
  width: 50%;
  height: 60%;
  background: linear-gradient(120deg, rgba(255,255,255,0.55), transparent);
  transform: rotate(-12deg);
  pointer-events: none;
}
.${P}__rate-card__head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.${P}__rate-card__icon { font-size: ${isBroad ? '0.2in' : '0.16in'}; }
.${P}__rate-card__metal {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 900;
  font-size: ${isBroad ? '0.11in' : '0.09in'};
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.${P}__rate-card--gold .${P}__rate-card__metal { color: #713f12; }
.${P}__rate-card--silver .${P}__rate-card__metal { color: #334155; }
.${P}__rate-card__price {
  font-size: ${isBroad ? '0.19in' : '0.15in'};
  font-weight: 900;
  color: #1c1917;
  line-height: 1.1;
}
.${P}__rate-card__sub {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: ${isBroad ? '0.09in' : '0.075in'};
  color: #57534e;
  font-weight: 600;
}
.${P}__rate-badge {
  display: inline-block;
  margin-top: 2px;
  padding: 1px 6px;
  border-radius: 10px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: ${isBroad ? '0.09in' : '0.075in'};
  font-weight: 800;
}
.${P}__rate-badge--up { background: #dcfce7; color: #15803d; }
.${P}__rate-badge--down { background: #fee2e2; color: #b91c1c; }
`
  )
}

export function generateMainStyle3Html(s = {}, preset = 'broadsheet') {
  const settings = mergeMainSettings(s)
  const day = settings.astrologyDay || settings.date || 'ఈ రోజు'

  const chips = [
    astroChip('శుభ సమయం', settings.astrologyGoodTime || '6:30–8:15', 'good'),
    astroChip('రాహుకాలం', settings.astrologyRahuKalam || '3:00–4:30', 'warn'),
    astroChip('యమగండం', settings.astrologyYamagandam || '12:00–1:30', 'bad'),
    astroChip('గులిక', settings.astrologyGulika || '1:30–3:00', 'info'),
  ]
  if (settings.astrologyTithi) {
    chips.push(astroChip('తిథి', settings.astrologyTithi, 'info'))
  }

  const leftHtml = `<aside class="${P}__side ${P}__side--left">
    <div class="${P}__side-body">
      <div class="${P}__panel ${P}__panel--astro">
        <div class="${P}__ribbon"><span class="${P}__ribbon-ico">☽</span> నేటి జ్యోతిషం</div>
        <div class="${P}__panel-body">
          <div class="${P}__day-pill">${escapeHtml(day)}</div>
          <ul class="${P}__chips">${chips.join('')}</ul>
        </div>
      </div>
    </div>
  </aside>`

  const rightHtml = `<aside class="${P}__side ${P}__side--right">
    <div class="${P}__side-body">
      <div class="${P}__panel ${P}__panel--rates">
        <div class="${P}__ribbon" style="background:linear-gradient(135deg,#d97706,#f59e0b,#b45309)">
          <span class="${P}__ribbon-ico">💰</span> బంగారం · వెండి
        </div>
        <div class="${P}__panel-body">
          <div class="${P}__rates-stack">
            ${rateCard('Gold', '10 gram', settings.goldRate || '₹72,450', settings.goldChange || '+₹120', 'gold')}
            ${rateCard('Silver', '1 kg', settings.silverRate || '₹85,200', settings.silverChange || '-₹80', 'silver')}
          </div>
        </div>
      </div>
    </div>
  </aside>`

  return wrapMain3ColHeader({
    prefix: P,
    styleKey: 'main_style3',
    preset,
    settings,
    leftHtml,
    rightHtml,
  })
}
