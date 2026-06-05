/** Shared decorative side-panel CSS helpers */
export function sideRibbonCss(p, isBroad, variant) {
  const gradients = {
    astro: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #4c1d95 100%)',
    gold: 'linear-gradient(135deg, #d97706 0%, #f59e0b 45%, #b45309 100%)',
    machi: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #0f766e 100%)',
    x: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #000 100%)',
    weather: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #0369a1 100%)',
    fuel: 'linear-gradient(135deg, #15803d 0%, #22c55e 50%, #166534 100%)',
  }
  const g = gradients[variant] || gradients.astro
  return `
.${p}__panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: ${isBroad ? '6px' : '4px'};
  margin: 3px;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25), 0 2px 8px rgba(0,0,0,0.12);
}
.${p}__ribbon {
  flex-shrink: 0;
  background: ${g};
  color: #fff;
  text-align: center;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 900;
  font-size: ${isBroad ? '0.15in' : '0.12in'};
  padding: ${isBroad ? '5px 6px' : '4px 5px'};
  letter-spacing: 0.02em;
  text-shadow: 0 1px 2px rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}
.${p}__ribbon-ico {
  font-size: ${isBroad ? '0.18in' : '0.15in'};
  line-height: 1;
}
.${p}__panel-body {
  flex: 1;
  min-height: 0;
  padding: ${isBroad ? '5px 5px' : '4px 4px'};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
`
}
