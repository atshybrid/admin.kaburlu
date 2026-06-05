/**
 * MAIN STYLE 4 — Machi mata quote card (left) | Masthead | X tweet card (right)
 */
import { escapeHtml } from './utils.js'
import {
  main3ColFrameCss,
  mergeMainSettings,
  wrapMain3ColHeader,
} from './mainStyle3ColShared.js'
import { sideRibbonCss } from './sidePanelDecor.js'

const P = 'ep-main4'

export function generateMainStyle4Css(preset = 'broadsheet') {
  const isBroad = preset === 'broadsheet'
  return (
    main3ColFrameCss(P, preset) +
    sideRibbonCss(P, isBroad, 'machi') +
    `
.${P}__side--left { background: linear-gradient(180deg, #f0fdfa 0%, #ccfbf1 100%); }
.${P}__side--right { background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%); }
.${P}__side-body { padding: 2px; }

.${P}__quote-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 6px;
  border: 2px solid #14b8a6;
  box-shadow: 0 3px 10px rgba(13,148,136,0.2);
  overflow: hidden;
  position: relative;
}
.${P}__quote-mark {
  position: absolute;
  top: -2px;
  left: 4px;
  font-size: ${isBroad ? '0.55in' : '0.45in'};
  line-height: 1;
  color: rgba(20,184,166,0.25);
  font-family: Georgia, serif;
  font-weight: 900;
}
.${P}__quote-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: ${isBroad ? '8px 8px 6px' : '6px 6px 4px'};
  text-align: center;
  z-index: 1;
}
.${P}__quote-text {
  font-size: ${isBroad ? '0.13in' : '0.11in'};
  line-height: ${isBroad ? '0.2in' : '0.17in'};
  font-weight: 700;
  color: #134e4a;
  font-style: italic;
}
.${P}__quote-rule {
  height: 2px;
  margin: 5px auto;
  width: 40%;
  background: linear-gradient(90deg, transparent, #14b8a6, transparent);
}
.${P}__quote-author {
  font-size: ${isBroad ? '0.11in' : '0.09in'};
  color: #dc2626;
  font-weight: 800;
}
.${P}__quote-footer {
  flex-shrink: 0;
  background: linear-gradient(90deg, #0f766e, #14b8a6);
  color: #fff;
  text-align: center;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 900;
  font-size: ${isBroad ? '0.12in' : '0.1in'};
  padding: 3px;
}

.${P}__tweet {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  box-shadow: 0 4px 14px rgba(15,23,42,0.15);
  overflow: hidden;
}
.${P}__tweet-top {
  flex-shrink: 0;
  background: linear-gradient(135deg, #0f172a, #334155);
  padding: 4px 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.${P}__avatar {
  width: ${isBroad ? '0.32in' : '0.28in'};
  height: ${isBroad ? '0.32in' : '0.28in'};
  border-radius: 50%;
  background: linear-gradient(135deg, #1d9bf0, #0f172a);
  color: #fff;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 900;
  font-size: ${isBroad ? '0.16in' : '0.13in'};
  display: grid;
  place-items: center;
  border: 2px solid #fff;
  flex-shrink: 0;
}
.${P}__tweet-meta { min-width: 0; flex: 1; }
.${P}__tweet-name {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 800;
  font-size: ${isBroad ? '0.11in' : '0.09in'};
  color: #fff;
}
.${P}__tweet-handle {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: ${isBroad ? '0.09in' : '0.075in'};
  color: #94a3b8;
}
.${P}__verified {
  color: #1d9bf0;
  font-size: ${isBroad ? '0.12in' : '0.1in'};
}
.${P}__tweet-body {
  flex: 1;
  padding: 6px;
  font-size: ${isBroad ? '0.12in' : '0.1in'};
  line-height: ${isBroad ? '0.18in' : '0.15in'};
  color: #0f172a;
  font-weight: 600;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
.${P}__tweet-foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 4px 6px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}
.${P}__like-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(90deg, #fee2e2, #fecaca);
  color: #b91c1c;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 800;
  font-size: ${isBroad ? '0.1in' : '0.085in'};
  padding: 2px 8px;
  border-radius: 12px;
}
.${P}__best-tag {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: ${isBroad ? '0.09in' : '0.075in'};
  font-weight: 900;
  color: #0f172a;
  background: #fbbf24;
  padding: 2px 6px;
  border-radius: 4px;
}
`
  )
}

export function generateMainStyle4Html(s = {}, preset = 'broadsheet') {
  const settings = mergeMainSettings(s)
  const handle = settings.twitterHandle || '@kaburlu_reader'
  const displayName = handle.replace('@', '').slice(0, 12) || 'Reader'

  const leftHtml = `<aside class="${P}__side ${P}__side--left">
    <div class="${P}__side-body">
      <div class="${P}__quote-card">
        <span class="${P}__quote-mark">“</span>
        <div class="${P}__quote-inner">
          <div class="${P}__quote-text">${escapeHtml(settings.machiMata || 'మనస్సును శాంతపరచుకోండి — అప్పుడు సరైన నిర్ణయం వస్తుంది.')}</div>
          <div class="${P}__quote-rule"></div>
          <div class="${P}__quote-author">${escapeHtml(settings.machiMataAuthor || '— పెద్దమనుషుల మాట')}</div>
        </div>
        <div class="${P}__quote-footer">✦ మాచి మాట ✦</div>
      </div>
    </div>
  </aside>`

  const rightHtml = `<aside class="${P}__side ${P}__side--right">
    <div class="${P}__side-body">
      <div class="${P}__tweet">
        <div class="${P}__tweet-top">
          <div class="${P}__avatar">𝕏</div>
          <div class="${P}__tweet-meta">
            <div class="${P}__tweet-name">${escapeHtml(displayName)} <span class="${P}__verified">✓</span></div>
            <div class="${P}__tweet-handle">${escapeHtml(handle)}</div>
          </div>
          <span class="${P}__best-tag">BEST</span>
        </div>
        <div class="${P}__tweet-body">${escapeHtml(settings.twitterComment || 'ఈ వార్త చాలా బాగుంది — మా నగరానికి ప్రత్యేక ప్రాముఖ్యం!')}</div>
        <div class="${P}__tweet-foot">
          <span class="${P}__like-pill">♥ ${escapeHtml(settings.twitterLikes || '2.4K')}</span>
        </div>
      </div>
    </div>
  </aside>`

  return wrapMain3ColHeader({
    prefix: P,
    styleKey: 'main_style4',
    preset,
    settings,
    leftHtml,
    rightHtml,
  })
}
