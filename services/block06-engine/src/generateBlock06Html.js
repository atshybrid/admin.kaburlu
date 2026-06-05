import { BLOCK_06A, BLOCK_06A_ENGINE_VERSION } from './constants.js'
import { escapeHtml } from './utils.js'
import { splitArticleIntoTwoColumns } from './splitArticleIntoTwoColumns.js'
import { estimateTitleLines } from './utils.js'

/**
 * Auto-fit title font size (px) for 1–3 lines inside 6in rail.
 * @param {string} title
 */
function titleFontSizePx(title) {
  const lines = estimateTitleLines(title, BLOCK_06A.titleMaxLines)
  const len = String(title || '').length
  if (lines === 1) {
    if (len <= 18) return BLOCK_06A.titleMaxPx
    if (len <= 28) return 52
    if (len <= 40) return 46
    return BLOCK_06A.titleMinPx + 8
  }
  if (lines === 2) {
    if (len <= 50) return 44
    return 38
  }
  return BLOCK_06A.titleMinPx
}

/** @param {string} text */
function bodyParagraphsHtml(text, className) {
  const t = String(text || '').trim()
  if (!t) return ''
  const parts = t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const paras = parts.length ? parts : [t]
  return paras
    .map((p) => `<p class="${className}">${escapeHtml(p)}</p>`)
    .join('\n')
}

/**
 * @param {object} article
 * @param {string} article.title
 * @param {string} [article.subtitle]
 * @param {string[]} [article.highlights]
 * @param {string|null} [article.imageUrl]
 * @param {string} [article.imageCaption]
 * @param {string} article.content
 * @param {{ includeMeta?: boolean, wordCount?: number, estimatedHeightMm?: number }} [opts]
 */
export function generateBlock06Html(article, opts = {}) {
  const title = String(article.title || '').trim()
  const subtitle = String(article.subtitle || '').trim()
  const highlights = article.highlights || []
  const imageUrl = article.imageUrl || null
  const content = String(article.content || '').trim()

  const titlePx = titleFontSizePx(title)
  const subtitlePx = Math.max(14, Math.round(titlePx * BLOCK_06A.subtitleSizeRatio))

  const split = splitArticleIntoTwoColumns(content, {
    title,
    subtitle,
    highlights,
    hasImage: !!imageUrl,
  })

  const highlightsHtml =
    highlights.length > 0
      ? `<div class="block06a__highlights" role="region" aria-label="Highlights">
  <ul>
${highlights
  .map(
    (h) => `    <li><span class="block06a__bullet" aria-hidden="true">•</span><span class="block06a__point">${escapeHtml(h)}</span></li>`
  )
  .join('\n')}
  </ul>
</div>`
      : ''

  const imageHtml = imageUrl
    ? `<figure class="block06a__figure">
  <img src="${escapeHtml(imageUrl)}" alt="" loading="lazy" />
  ${article.imageCaption ? `<figcaption class="block06a__caption">${escapeHtml(article.imageCaption)}</figcaption>` : ''}
</figure>`
    : ''

  const col1Body = bodyParagraphsHtml(split.column1Text, 'block06a__para')
  const col2Body = bodyParagraphsHtml(split.column2Text, 'block06a__para')

  const metaHtml =
    opts.includeMeta === true
      ? `<div class="block06a__meta" data-block="BLOCK-06A">${escapeHtml(
          `engine ${BLOCK_06A_ENGINE_VERSION} · words: ${opts.wordCount ?? split.wordCount} · est: ${opts.estimatedHeightMm ?? '—'}mm · col1: ${split.wordsCol1}w/${split.linesCol1 ?? '?'}L · col2: ${split.wordsCol2}w/${split.linesCol2 ?? '?'}L · bottom Δ${(split.bottomSpreadMm ?? 0).toFixed(1)}mm`
        )}</div>`
      : ''

  return `<article class="block06a" data-block-code="BLOCK-06A" data-flow="threaded-2col" data-engine-version="${escapeHtml(BLOCK_06A_ENGINE_VERSION)}" data-locked="true" lang="te">
  <header class="block06a__title-zone">
    <h1 class="block06a__title" style="font-size:${titlePx}px">${escapeHtml(title)}</h1>
    ${
      subtitle
        ? `<h2 class="block06a__subtitle" style="font-size:${subtitlePx}px">${escapeHtml(subtitle)}</h2>`
        : ''
    }
  </header>
  <div class="block06a__grid">
    <div class="block06a__column block06a__column--1" data-column="1">
      ${highlightsHtml}
      <div class="block06a__body block06a__body--col1">
        ${col1Body || '<p class="block06a__para">&nbsp;</p>'}
      </div>
    </div>
    <div class="block06a__column block06a__column--2" data-column="2">
      ${imageHtml}
      <div class="block06a__body block06a__body--col2">
        ${col2Body || ''}
      </div>
    </div>
  </div>
  ${metaHtml}
</article>`
}

/**
 * Full HTML document for browser preview.
 */
export function generateBlock06PreviewDocument(article, css, meta = {}) {
  const html = generateBlock06Html(article, meta)
  return `<!DOCTYPE html>
<html lang="te">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>BLOCK-06A — ${escapeHtml(article.title || 'Preview')}</title>
  <style>${css}</style>
</head>
<body style="margin:0;padding:24px;background:#e2e8f0;">
  <div id="block06a-root">${html}</div>
  <script src="/static/threadBalance.js"></script>
</body>
</html>`
}
