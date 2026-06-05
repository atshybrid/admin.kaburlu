/**
 * MAIN STYLE 5 — Weather cards (left) | Masthead | Fuel gauge cards (right)
 */
import { escapeHtml, splitPoints } from './utils.js'
import {
  main3ColFrameCss,
  mergeMainSettings,
  wrapMain3ColHeader,
} from './mainStyle3ColShared.js'
import { sideRibbonCss } from './sidePanelDecor.js'

const P = 'ep-main5'

const WEATHER_ICONS = {
  ఎండ: '☀️',
  వేడి: '🔥',
  మేఘాలు: '⛅',
  వర్షం: '🌧️',
  default: '🌤️',
}

function weatherIcon(text) {
  const t = String(text || '')
  for (const [key, icon] of Object.entries(WEATHER_ICONS)) {
    if (key !== 'default' && t.includes(key)) return icon
  }
  return WEATHER_ICONS.default
}

function weatherCard(city, detail) {
  const icon = weatherIcon(detail)
  return `<div class="${P}__wx-card">
    <span class="${P}__wx-ico">${icon}</span>
    <div class="${P}__wx-info">
      <span class="${P}__wx-city">${escapeHtml(city)}</span>
      <span class="${P}__wx-detail">${escapeHtml(detail)}</span>
    </div>
  </div>`
}

function fuelCard(name, price, color, pct) {
  return `<div class="${P}__fuel-card">
    <div class="${P}__fuel-head">
      <span class="${P}__fuel-dot" style="background:${color}"></span>
      <span class="${P}__fuel-name">${escapeHtml(name)}</span>
    </div>
    <div class="${P}__fuel-price">${escapeHtml(price)}</div>
    <div class="${P}__fuel-bar"><span style="width:${pct}%;background:${color}"></span></div>
  </div>`
}

export function generateMainStyle5Css(preset = 'broadsheet') {
  const isBroad = preset === 'broadsheet'
  return (
    main3ColFrameCss(P, preset) +
    sideRibbonCss(P, isBroad, 'weather') +
    `
.${P}__side--left { background: linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%); }
.${P}__side--right { background: linear-gradient(180deg, #ecfdf5 0%, #bbf7d0 100%); }
.${P}__side-body { padding: 2px; }

.${P}__wx-panel, .${P}__fuel-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.${P}__wx-stack {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 4px;
  background: rgba(255,255,255,0.7);
}
.${P}__wx-card {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 5px;
  background: #fff;
  border-radius: 5px;
  border: 1px solid #bae6fd;
  box-shadow: 0 1px 4px rgba(2,132,199,0.12);
}
.${P}__wx-ico { font-size: ${isBroad ? '0.2in' : '0.16in'}; line-height: 1; flex-shrink: 0; }
.${P}__wx-info { min-width: 0; display: flex; flex-direction: column; }
.${P}__wx-city {
  font-weight: 800;
  font-size: ${isBroad ? '0.11in' : '0.095in'};
  color: #0369a1;
  line-height: 1.1;
}
.${P}__wx-detail {
  font-size: ${isBroad ? '0.1in' : '0.085in'};
  color: #475569;
  font-weight: 600;
}

.${P}__fuel-stack {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  background: rgba(255,255,255,0.75);
  justify-content: center;
}
.${P}__fuel-card {
  background: #fff;
  border-radius: 6px;
  padding: 4px 6px;
  border: 1px solid #86efac;
  box-shadow: 0 2px 6px rgba(22,101,52,0.12);
}
.${P}__fuel-head {
  display: flex;
  align-items: center;
  gap: 5px;
}
.${P}__fuel-dot {
  width: ${isBroad ? '8px' : '6px'};
  height: ${isBroad ? '8px' : '6px'};
  border-radius: 50%;
  flex-shrink: 0;
}
.${P}__fuel-name {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 800;
  font-size: ${isBroad ? '0.1in' : '0.085in'};
  color: #64748b;
  text-transform: uppercase;
}
.${P}__fuel-price {
  font-size: ${isBroad ? '0.17in' : '0.14in'};
  font-weight: 900;
  color: #14532d;
  line-height: 1.1;
  margin: 2px 0;
}
.${P}__fuel-bar {
  height: 4px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}
.${P}__fuel-bar span {
  display: block;
  height: 100%;
  border-radius: 4px;
}
`
  )
}

export function generateMainStyle5Html(s = {}, preset = 'broadsheet') {
  const settings = mergeMainSettings(s)
  const weatherLines = splitPoints(
    settings.weatherLines ||
      settings.weatherText ||
      'హైదరాబాద్: 34°C · ఎండ\nవరంగల్: 36°C · వేడి\nకరీంనగర్: 33°C · మేఘాలు',
    4,
  )

  const wxCards = weatherLines
    .map((line) => {
      const [city, rest] = line.split(/[:：]/)
      if (rest) return weatherCard(city.trim(), rest.trim())
      return weatherCard('', line)
    })
    .join('')

  const leftHtml = `<aside class="${P}__side ${P}__side--left">
    <div class="${P}__side-body">
      <div class="${P}__wx-panel">
        <div class="${P}__ribbon"><span class="${P}__ribbon-ico">🌤</span> నేటి వాతావరణం</div>
        <div class="${P}__wx-stack">${wxCards}</div>
      </div>
    </div>
  </aside>`

  const rightHtml = `<aside class="${P}__side ${P}__side--right">
    <div class="${P}__side-body">
      <div class="${P}__fuel-panel">
        <div class="${P}__ribbon" style="background:linear-gradient(135deg,#15803d,#22c55e,#166534)">
          <span class="${P}__ribbon-ico">⛽</span> ఇంధన ధరలు
        </div>
        <div class="${P}__fuel-stack">
          ${fuelCard('Petrol / L', settings.petrolRate || '₹109.86', '#ef4444', 92)}
          ${fuelCard('Diesel / L', settings.dieselRate || '₹97.42', '#f59e0b', 78)}
          ${fuelCard('CNG / kg', settings.cngRate || '₹75.00', '#22c55e', 55)}
        </div>
      </div>
    </div>
  </aside>`

  return wrapMain3ColHeader({
    prefix: P,
    styleKey: 'main_style5',
    preset,
    settings,
    leftHtml,
    rightHtml,
  })
}
