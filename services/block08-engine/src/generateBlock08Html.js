import { BLOCK_08A, BLOCK_08A_ENGINE_VERSION } from './constants.js'
import { escapeHtml, estimateTitleLines } from './utils.js'
import { splitArticleIntoThreeColumns } from './splitArticleIntoThreeColumns.js'
import { buildSeoBundle } from './seo08.js'

function titleFontSizePx(title) {
  const lines = estimateTitleLines(title, BLOCK_08A.titleMaxLines)
  const len = String(title || '').length
  if (lines === 1) {
    if (len <= 22) return BLOCK_08A.titleMaxPx
    if (len <= 36) return 50
    if (len <= 48) return 44
    return BLOCK_08A.titleMinPx + 8
  }
  if (lines === 2) {
    if (len <= 56) return 42
    return 36
  }
  return BLOCK_08A.titleMinPx
}

function bodyParagraphsHtml(text, className) {
  const t = String(text || '').trim()
  if (!t) return ''
  const parts = t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const paras = parts.length ? parts : [t]
  return paras.map((p) => `<p class="${className}">${escapeHtml(p)}</p>`).join('\n')
}

function imageAltText(title, caption, fallback) {
  const c = String(caption || '').trim()
  if (c) return c
  const t = String(title || '').trim()
  if (t && fallback) return `${t} — ${fallback}`
  return t || fallback || 'Article photograph'
}

function figureHtml(url, heightPx, caption, altText) {
  if (!url) return ''
  const alt = escapeHtml(altText)
  return `<figure class="block08a__figure" itemprop="image" itemscope itemtype="https://schema.org/ImageObject" style="height:${heightPx}px">
  <img src="${escapeHtml(url)}" alt="${alt}" itemprop="url" width="400" height="${heightPx}" loading="lazy" decoding="async" style="height:${heightPx}px;max-height:${heightPx}px" />
  ${caption ? `<figcaption class="block08a__caption" itemprop="caption">${escapeHtml(caption)}</figcaption>` : ''}
</figure>`
}

export function generateBlock08Html(article, opts = {}) {
  const title = String(article.title || '').trim()
  const subtitle = String(article.subtitle || '').trim()
  const highlights = article.highlights || []
  const imageUrls = article.imageUrls || []
  const content = String(article.content || '').trim()

  const titlePx = titleFontSizePx(title)
  const subtitlePx = Math.max(14, Math.round(titlePx * BLOCK_08A.subtitleSizeRatio))

  const split = splitArticleIntoThreeColumns(content, {
    highlights,
    imageUrls,
  })

  const highlightsHtml =
    highlights.length > 0
      ? `<aside class="block08a__highlights" aria-labelledby="block08a-highlights-title">
  <h2 id="block08a-highlights-title" class="block08a__visually-hidden">ముఖ్య అంశాలు</h2>
  <ul>
${highlights
  .map(
    (h) =>
      `    <li><span class="block08a__bullet" aria-hidden="true">•</span><span class="block08a__point">${escapeHtml(h)}</span></li>`
  )
  .join('\n')}
  </ul>
</aside>`
      : ''

  const img1 = imageUrls[0] || null
  const img2 = imageUrls[1] || null
  const cap1 = article.imageCaption || article.caption1 || ''
  const cap2 = article.imageCaption2 || article.caption2 || ''
  const image1Html = figureHtml(
    img1,
    BLOCK_08A.imagePrimaryMaxHeightPx,
    cap1,
    imageAltText(title, cap1, 'ప్రధాన చిత్రం')
  )
  const image2Html = figureHtml(
    img2,
    BLOCK_08A.imageSecondaryMaxHeightPx,
    cap2,
    imageAltText(title, cap2, 'ద్వితీయ చిత్రం')
  )

  const col1Body = bodyParagraphsHtml(split.column1Text, 'block08a__para')
  const col2Body = bodyParagraphsHtml(split.column2Text, 'block08a__para')
  const col3Body = bodyParagraphsHtml(split.column3Text, 'block08a__para')

  const datePublished = String(opts.datePublished || '').trim()
  const author = String(opts.author || '').trim()
  const bylineHtml =
    datePublished || author
      ? `<p class="block08a__byline block08a__visually-hidden">${author ? `<span itemprop="author">${escapeHtml(author)}</span>` : ''}${datePublished ? `<time itemprop="datePublished" datetime="${escapeHtml(datePublished)}">${escapeHtml(datePublished)}</time>` : ''}</p>`
      : ''

  const metaHtml =
    opts.includeMeta === true
      ? `<footer class="block08a__meta" data-block="BLOCK-08A">${escapeHtml(
          `engine ${BLOCK_08A_ENGINE_VERSION} · words: ${opts.wordCount ?? split.wordCount} · col1: ${split.wordsCol1}w · col2: ${split.wordsCol2}w · col3: ${split.wordsCol3}w · bottom Δ${(split.bottomSpreadMm ?? 0).toFixed(1)}mm`
        )}</footer>`
      : ''

  return `<article class="block08a" itemscope itemtype="https://schema.org/NewsArticle" data-block-code="BLOCK-08A" data-flow="threaded-3col" data-engine-version="${escapeHtml(BLOCK_08A_ENGINE_VERSION)}" lang="te">
  <meta itemprop="inLanguage" content="te" />
  <header class="block08a__title-zone">
    <h1 class="block08a__title" itemprop="headline" style="font-size:${titlePx}px">${escapeHtml(title)}</h1>
    ${
      subtitle
        ? `<p class="block08a__subtitle" itemprop="description" style="font-size:${subtitlePx}px">${escapeHtml(subtitle)}</p>`
        : `<meta itemprop="description" content="${escapeHtml(opts.seoDescription || subtitle || title)}" />`
    }
    ${bylineHtml}
  </header>
  <div class="block08a__grid" role="main">
    <section class="block08a__column block08a__column--1" data-column="1" aria-label="మొదటి నిలువు వరుస">
      ${highlightsHtml}
      <div class="block08a__body block08a__body--col1">
        ${col1Body || '<p class="block08a__para">&nbsp;</p>'}
      </div>
    </section>
    <section class="block08a__column block08a__column--2" data-column="2" aria-label="రెండవ నిలువు వరుస">
      ${image1Html}
      <div class="block08a__body block08a__body--col2">
        ${col2Body || ''}
      </div>
    </section>
    <section class="block08a__column block08a__column--3" data-column="3" aria-label="మూడవ నిలువు వరుస">
      ${image2Html}
      <div class="block08a__body block08a__body--col3">
        ${col3Body || ''}
      </div>
    </section>
  </div>
  ${metaHtml}
</article>`
}

export function generateBlock08PreviewDocument(article, css, meta = {}) {
  const html = generateBlock08Html(article, {
    ...meta,
    seoDescription: meta.seoDescription,
  })
  const previewUrl = String(meta.previewUrl || '').trim()
  const seo = buildSeoBundle(article, meta.seo || {}, {
    previewUrl,
    preview: true,
    pageUrl: previewUrl,
  })

  const foot = previewUrl
    ? `<p class="block08a-preview-url"><a href="${escapeHtml(previewUrl)}">${escapeHtml(previewUrl)}</a> · ${escapeHtml(BLOCK_08A_ENGINE_VERSION)}</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="te" dir="ltr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${seo.headHtmlPreview}
  <style>${css}
.block08a-preview-url { text-align:center; font:11px/1.4 ui-monospace,monospace; margin:14px 0 0; color:#64748b; }
.block08a-preview-url a { color:#0f766e; }
  </style>
  ${seo.jsonLdScript}
</head>
<body style="margin:0;padding:24px;background:#e2e8f0;">
  <main id="block08a-root">${html}</main>
  ${foot}
  <script src="/static/threadBalance.js?v=${encodeURIComponent(BLOCK_08A_ENGINE_VERSION)}"></script>
</body>
</html>`
}

/** Full production page shell (indexable) for CMS embed. */
export function generateBlock08Document(article, css, meta = {}) {
  const html = generateBlock08Html(article, meta)
  const seo = buildSeoBundle(article, meta.seo || {}, {
    indexable: meta.indexable !== false,
    canonicalUrl: meta.canonicalUrl,
    pageUrl: meta.pageUrl || meta.canonicalUrl,
  })
  return `<!DOCTYPE html>
<html lang="te" dir="ltr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${seo.headHtmlProduction}
  ${meta.cssUrl ? `<link rel="stylesheet" href="${escapeHtml(meta.cssUrl)}" />` : ''}
  <style>${css}</style>
  ${seo.jsonLdScript}
</head>
<body>
  <main id="block08a-root">${html}</main>
</body>
</html>`
}
