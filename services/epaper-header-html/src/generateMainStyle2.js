/**
 * MAIN HEADER STYLE 2 — Telugu Prabha 3-Col + Meta Strip
 * Left running commentary | Center logo + meta | Right article box
 */
import {
  escapeHtml,
  splitPoints,
  splitPublishedAreas,
  resolveRunningComments,
  resolveCenterLogoUrl,
} from './utils.js'
import { slotInlineStyle } from './typography.js'
import { DEFAULT_SETTINGS } from './constants.js'

export function generateMainStyle2Css(preset = 'broadsheet') {
  const isBroad = preset === 'broadsheet'
  return `
/* ── Main Style 2: Prabha 3-Col + Meta Strip ── */
.ep-main2 {
  width: 100%;
  height: 100%;
  background: #f7f4ef;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ep-main2__frame {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 18% 64% 18%;
  border: 1px solid #d1d5db;
  background: #fff;
}

.ep-main2__left {
  min-width: 0;
  border-right: 1px solid #d1d5db;
  background: #f5f0ea;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.ep-main2__labels {
  display: flex;
  flex-shrink: 0;
  height: ${isBroad ? '0.45in' : '0.38in'};
}

.ep-main2__label-run {
  background: #000;
  color: #fff;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 900;
  font-size: ${isBroad ? '0.22in' : '0.19in'};
  padding: 0 8px;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.ep-main2__label-com {
  background: #dc2626;
  color: #fde047;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 900;
  font-size: ${isBroad ? '0.22in' : '0.19in'};
  padding: 0 8px;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.ep-main2__left-body {
  flex: 1;
  min-height: 0;
  padding: 4px 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.ep-main2__left-lines {
  font-size: ${isBroad ? '0.14in' : '0.12in'};
  line-height: ${isBroad ? '0.22in' : '0.19in'};
  color: #374151;
  font-weight: 500;
  overflow: hidden;
}

.ep-main2__left-lines p {
  margin: 0 0 2px;
}

.ep-main2__left-ad {
  display: flex;
  justify-content: center;
  flex-shrink: 0;
  padding: 4px 0;
}

.ep-main2__left-ad img {
  max-width: 100%;
  max-height: ${isBroad ? '0.7in' : '0.55in'};
  object-fit: contain;
}

.ep-main2__left-ad-fallback {
  width: ${isBroad ? '0.7in' : '0.55in'};
  height: ${isBroad ? '0.7in' : '0.55in'};
  border-radius: 50%;
  background: linear-gradient(135deg, #fb923c, #ef4444);
}

.ep-main2__author {
  font-size: ${isBroad ? '0.13in' : '0.11in'};
  color: #dc2626;
  font-weight: 700;
  text-align: center;
  flex-shrink: 0;
}

.ep-main2__center {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 0;
  min-width: 0;
}

.ep-main2__logo-zone {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 4px;
}

.ep-main2__logo-zone img,
.ep-main2__logo-img {
  max-width: 96%;
  max-height: ${isBroad ? '2.15in' : '1.75in'};
  width: auto;
  height: auto;
  object-fit: contain;
  margin: 0 auto;
}

.ep-main2__title {
  margin: 0;
  font-size: ${isBroad ? '1.55in' : '1.3in'};
  font-weight: 900;
  color: #0056a8;
  line-height: 1;
  text-align: center;
}

.ep-main2__tagline-row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 16px;
  font-size: ${isBroad ? '0.22in' : '0.18in'};
  color: #6b7280;
  margin-top: -4px;
}

.ep-main2__tagline-row span:last-child {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: ${isBroad ? '0.18in' : '0.15in'};
}

.ep-main2__meta {
  flex-shrink: 0;
  border-top: 4px solid #c58a2b;
  background: #f3e6d2;
}

.ep-main2__meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: ${isBroad ? '0.14in' : '0.12in'};
  font-weight: 600;
  color: #1f2937;
}

.ep-main2__meta-grid > div {
  padding: 4px 8px;
  border-right: 1px solid #9ca3af;
  overflow: hidden;
}

.ep-main2__meta-grid > div:last-child {
  border-right: 0;
  text-align: right;
}

.ep-main2__meta-published {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
}

.ep-main2__meta-center {
  text-align: center;
  white-space: nowrap;
}

.ep-main2__right {
  min-width: 0;
  border-left: 1px solid #d1d5db;
  padding: 4px;
  background: #fff;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.ep-main2__newsbox {
  flex: 1;
  min-height: 0;
  border: 1px solid #9ca3af;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ep-main2__news-thumb {
  flex-shrink: 0;
  height: ${isBroad ? '1in' : '0.82in'};
  border-bottom: 1px solid #d1d5db;
  background: #f3f4f6;
  overflow: hidden;
}

.ep-main2__news-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
}

.ep-main2__news-body {
  flex: 1;
  min-height: 0;
  padding: 4px 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  text-align: center;
}

.ep-main2__news-title {
  margin: 0 0 4px;
  width: 100%;
  font-size: ${isBroad ? '0.22in' : '0.18in'};
  font-weight: 900;
  line-height: 1.2;
  color: #000;
  text-align: center;
  font-family: 'Mandali', 'Noto Sans Telugu', Georgia, serif;
}

.ep-main2__news-body ul {
  margin: 0;
  padding: 0;
  list-style: none;
  width: 100%;
  font-family: 'Mandali', 'Noto Sans Telugu', Georgia, serif;
  font-size: ${isBroad ? '0.13in' : '0.11in'};
  line-height: ${isBroad ? '0.19in' : '0.16in'};
  color: #374151;
  text-align: center;
}

.ep-main2__news-body li {
  margin: 0 0 2px;
}

.ep-main2__news-body li::before {
  content: '• ';
  color: #dc2626;
  font-weight: 700;
}

.ep-main2__page-badge {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding: 4px;
}

.ep-main2__page-num {
  width: ${isBroad ? '0.32in' : '0.28in'};
  height: ${isBroad ? '0.32in' : '0.28in'};
  background: #d1d5db;
  border: 1px solid #9ca3af;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 900;
  font-size: ${isBroad ? '0.18in' : '0.15in'};
  display: grid;
  place-items: center;
}
`
}

export function generateMainStyle2Html(s = {}, preset = 'broadsheet') {
  const settings = { ...DEFAULT_SETTINGS, ...s }
  const slotStyle = slotInlineStyle(preset, 'main')
  const centerImage = resolveCenterLogoUrl(settings)
  const rightThumb =
    settings.adRightUrl ||
    settings.adUrl ||
    settings.demoArticleThumbUrl ||
    ''
  const leftLines = resolveRunningComments(settings, 8)
  const leftAuthor =
    settings.runningCommentAuthor || settings.sectionName || '- సి.ఎన్.రంగనాథ్'
  const rightTitle =
    settings.rightArticleTitle || 'కరోనా విజృంభణపై కేంద్ర అప్రమత్తం'
  const rightPoints = splitPoints(
    settings.rightArticlePoints || settings.rightArticleBody,
    3,
  )
  const cities = splitPublishedAreas(settings.publishedAreas)
  const website = settings.websiteUrl || settings.paperNameEn || 'www.teluguprabha.net'
  const pageNum = settings.pageNumber || '1'

  const leftLinesHtml = leftLines.map((l) => `<p>${escapeHtml(l)}</p>`).join('')
  const pointsHtml = rightPoints.map((p) => `<li>${escapeHtml(p)}</li>`).join('')
  const citiesHtml = cities
    .slice(0, 4)
    .map((c) => `<span>${escapeHtml(c)}</span>`)
    .join('')

  const centerBlock = centerImage
    ? `<img class="ep-main2__logo-img" src="${escapeHtml(centerImage)}" alt="${escapeHtml(settings.paperName || '')}" />`
    : `<h1 class="ep-main2__title">${escapeHtml(settings.paperName || 'తెలుగుప్రభ')}</h1>
       <div class="ep-main2__tagline-row">
         <span>${escapeHtml(settings.tagline || 'మన భాష.. మన పత్రిక')}</span>
         <span>${escapeHtml(website)}</span>
       </div>`

  return `<header class="ep-header-slot ep-main2 header-frame" data-style="main_style2" data-preset="${preset}" style="${slotStyle}" lang="te">
  <div class="ep-main2__frame">
    <aside class="ep-main2__left">
      <div class="ep-main2__labels">
        <span class="ep-main2__label-run">రన్నింగ్</span>
        <span class="ep-main2__label-com">కామెంట్రీ</span>
      </div>
      <div class="ep-main2__left-body">
        <div class="ep-main2__left-lines">${leftLinesHtml}</div>
        <div class="ep-main2__left-ad">
          ${settings.adLeftUrl ? `<img src="${escapeHtml(settings.adLeftUrl)}" alt="" />` : '<div class="ep-main2__left-ad-fallback"></div>'}
        </div>
        <div class="ep-main2__author">${escapeHtml(leftAuthor)}</div>
      </div>
    </aside>
    <section class="ep-main2__center">
      <div class="ep-main2__logo-zone">${centerBlock}</div>
      <div class="ep-main2__meta">
        <div class="ep-main2__meta-grid">
          <div class="ep-main2__meta-published"><span>Published from:</span>${citiesHtml}</div>
          <div class="ep-main2__meta-center"><span>తెలంగాణ</span> <span>|</span> <span>${escapeHtml(settings.date || '')}</span></div>
          <div><span>వెల: ${escapeHtml(settings.price || '')}</span> <span>సంపుటి: ${escapeHtml(settings.volume || '')}</span> <span>సంచిక: ${escapeHtml(settings.issue || '')}</span></div>
        </div>
      </div>
    </section>
    <aside class="ep-main2__right">
      <div class="ep-main2__newsbox">
        <div class="ep-main2__news-thumb">
          ${rightThumb ? `<img src="${escapeHtml(rightThumb)}" alt="" />` : '<div class="ep-placeholder">Article</div>'}
        </div>
        <div class="ep-main2__news-body">
          <h2 class="ep-main2__news-title">${escapeHtml(rightTitle)}</h2>
          <ul>${pointsHtml}</ul>
        </div>
        <div class="ep-main2__page-badge"><div class="ep-main2__page-num">${escapeHtml(pageNum)}</div></div>
      </div>
    </aside>
  </div>
</header>`
}
