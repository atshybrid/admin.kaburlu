import { BLOCK_12A, BLOCK_12A_ENGINE_VERSION } from './constants.js'
import { escapeHtml, estimateTitleLines } from './utils.js'
import { escapeAttrUrl, proxiedImageSrc } from './imageProxy.js'
import { splitArticleIntoFourColumns } from './splitArticleIntoFourColumns.js'
import { buildSeoBundle } from './seo12.js'

function titleFontSizePx(title) {
  const lines = estimateTitleLines(title, BLOCK_12A.titleMaxLines)
  const len = String(title || '').length
  if (lines === 1) {
    if (len <= 28) return BLOCK_12A.titleMaxPx
    if (len <= 44) return 54
    if (len <= 58) return 48
    return BLOCK_12A.titleMinPx + 10
  }
  if (lines === 2) return len <= 64 ? 44 : 38
  return BLOCK_12A.titleMinPx
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

function resolveImgSrc(url, opts) {
  const raw = opts?.useImageProxy !== false ? proxiedImageSrc(url) : url
  return escapeAttrUrl(raw)
}

function topFigureHtml(url, caption, altText, opts) {
  if (!url) return ''
  const alt = escapeHtml(altText)
  const src = resolveImgSrc(url, opts)
  return `<figure class="block12a__figure block12a__figure--top" itemprop="image" itemscope itemtype="https://schema.org/ImageObject">
  <div class="block12a__media">
    <img src="${src}" alt="${alt}" itemprop="url" loading="eager" decoding="async" referrerpolicy="no-referrer" />
  </div>
  ${caption ? `<figcaption class="block12a__caption" itemprop="caption">${escapeHtml(caption)}</figcaption>` : ''}
</figure>`
}

function bottomGalleryHtml(images, title, captions = [], opts = {}) {
  if (!images.length) return ''

  /** Column-major: img4→col1, img5→col2, img6→col3, img7→col4, img8→col1… */
  const byCol = [[], [], [], []]
  images.forEach((url, i) => {
    byCol[i % 4].push({ url, globalIdx: i + 4 })
  })
  const maxSlots = Math.max(...byCol.map((c) => c.length), 0)
  const h = BLOCK_12A.bottomThumbHeightPx

  const colsHtml = byCol
    .map((stack, colIdx) => {
      const slots = []
      for (let s = 0; s < maxSlots; s++) {
        const item = stack[s]
        if (!item) {
          slots.push(`<div class="block12a__bottom-slot block12a__bottom-slot--empty" aria-hidden="true"></div>`)
          continue
        }
        const cap = captions[item.globalIdx - 4] || ''
        const alt = imageAltText(title, cap, `చిత్రం ${item.globalIdx}`)
        const src = resolveImgSrc(item.url, opts)
        slots.push(`<figure class="block12a__bottom-figure">
    <div class="block12a__media block12a__media--bottom" style="height:${h}px">
      <img src="${src}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" width="200" height="${h}" />
    </div>
    ${cap ? `<figcaption class="block12a__caption">${escapeHtml(cap)}</figcaption>` : ''}
  </figure>`)
      }
      return `<div class="block12a__bottom-col" data-column="${colIdx + 1}">${slots.join('\n')}</div>`
    })
    .join('\n')

  return `<section class="block12a__bottom-gallery" aria-label="అదనపు చిత్రాలు">
  <h2 class="block12a__visually-hidden">గ్యాలరీ — 4 నిలువు వరుసలు · సమాన ఎత్తు</h2>
  <div class="block12a__bottom-columns">${colsHtml}</div>
</section>`
}

export function generateBlock12Html(article, opts = {}) {
  const title = String(article.title || '').trim()
  const subtitle = String(article.subtitle || '').trim()
  const highlights = article.highlights || []
  const imageUrls = article.imageUrls || []
  const content = String(article.content || '').trim()
  const bottomCaptions = article.bottomCaptions || []

  const titlePx = titleFontSizePx(title)
  const subtitlePx = Math.max(13, Math.round(titlePx * BLOCK_12A.subtitleSizeRatio))

  const split = splitArticleIntoFourColumns(content, { highlights, imageUrls })
  const top = split.columnTopImages
  const bottom = split.bottomImages

  const highlightsHtml =
    highlights.length > 0
      ? `<aside class="block12a__highlights" aria-labelledby="block12a-highlights-title">
  <h2 id="block12a-highlights-title" class="block12a__visually-hidden">ముఖ్య అంశాలు</h2>
  <ul>
${highlights
  .map(
    (h) =>
      `    <li><span class="block12a__bullet" aria-hidden="true">•</span><span class="block12a__point">${escapeHtml(h)}</span></li>`
  )
  .join('\n')}
  </ul>
</aside>`
      : ''

  const cap1 = article.imageCaption || article.caption1 || ''
  const cap2 = article.imageCaption2 || article.caption2 || ''
  const cap3 = article.imageCaption3 || article.caption3 || ''

  const image2Html = topFigureHtml(top[0], cap1, imageAltText(title, cap1, 'నిలువు వరుస 2'), opts)
  const image3Html = topFigureHtml(top[1], cap2, imageAltText(title, cap2, 'నిలువు వరుస 3'), opts)
  const image4Html = topFigureHtml(top[2], cap3, imageAltText(title, cap3, 'నిలువు వరుస 4'), opts)

  const col1Body = bodyParagraphsHtml(split.column1Text, 'block12a__para')
  const col2Body = bodyParagraphsHtml(split.column2Text, 'block12a__para')
  const col3Body = bodyParagraphsHtml(split.column3Text, 'block12a__para')
  const col4Body = bodyParagraphsHtml(split.column4Text, 'block12a__para')

  const metaHtml =
    opts.includeMeta === true
      ? `<footer class="block12a__meta" data-block="BLOCK-12A">${escapeHtml(
          `engine ${BLOCK_12A_ENGINE_VERSION} · words: ${opts.wordCount ?? split.wordCount} · cols: ${split.wordsCol1}/${split.wordsCol2}/${split.wordsCol3}/${split.wordsCol4}w · top imgs: ${top.length} · bottom: ${bottom.length} · Δ${(split.bottomSpreadMm ?? 0).toFixed(1)}mm`
        )}</footer>`
      : ''

  const galleryHtml = bottomGalleryHtml(bottom, title, bottomCaptions, opts)

  return `<article class="block12a" itemscope itemtype="https://schema.org/NewsArticle" data-block-code="BLOCK-12A" data-flow="threaded-4col" data-engine-version="${escapeHtml(BLOCK_12A_ENGINE_VERSION)}" data-width-in="12" data-max-height-in="21" data-w1="${split.wordsCol1}" data-w2="${split.wordsCol2}" data-w3="${split.wordsCol3}" lang="te">
  <meta itemprop="inLanguage" content="te" />
  <header class="block12a__title-zone">
    <h1 class="block12a__title" itemprop="headline" style="font-size:${titlePx}px">${escapeHtml(title)}</h1>
    ${
      subtitle
        ? `<p class="block12a__subtitle" itemprop="description" style="font-size:${subtitlePx}px">${escapeHtml(subtitle)}</p>`
        : `<meta itemprop="description" content="${escapeHtml(opts.seoDescription || title)}" />`
    }
  </header>
  <div class="block12a__grid" role="main">
    <section class="block12a__column block12a__column--1" data-column="1" aria-label="మొదటి నిలువు వరుస — అంశాలు మరియు వార్తా వివరాలు">
      ${highlightsHtml}
      <div class="block12a__body block12a__body--col1" itemprop="articleBody">
        ${col1Body || '<p class="block12a__para">&nbsp;</p>'}
      </div>
    </section>
    <section class="block12a__column block12a__column--2" data-column="2" aria-label="రెండవ నిలువు వరుస — మొదటి చిత్రం">
      ${image2Html}
      <div class="block12a__body block12a__body--col2">${col2Body || ''}</div>
    </section>
    <section class="block12a__column block12a__column--3" data-column="3" aria-label="మూడవ నిలువు వరుస — రెండవ చిత్రం">
      ${image3Html}
      <div class="block12a__body block12a__body--col3">${col3Body || ''}</div>
    </section>
    <section class="block12a__column block12a__column--4" data-column="4" aria-label="నాల్గవ నిలువు వరుస — మూడవ చిత్రం">
      ${image4Html}
      <div class="block12a__body block12a__body--col4">${col4Body || ''}</div>
    </section>
  </div>
  ${galleryHtml}
  ${metaHtml}
</article>`
}

export function generateBlock12PreviewDocument(article, css, meta = {}) {
  const html = generateBlock12Html(article, meta)
  const previewUrl = String(meta.previewUrl || '').trim()
  const seo = buildSeoBundle(article, meta.seo || {}, {
    previewUrl,
    preview: true,
    pageUrl: previewUrl,
  })
  const foot = previewUrl
    ? `<p class="block12a-preview-url"><a href="${escapeHtml(previewUrl)}">${escapeHtml(previewUrl)}</a> · ${escapeHtml(BLOCK_12A_ENGINE_VERSION)} · 12in×4col · max 21in</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="te" dir="ltr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${seo.headHtmlPreview}
  <style>${css}
.block12a-preview-url { text-align:center; font:11px/1.4 ui-monospace,monospace; margin:14px 0 0; color:#64748b; }
.block12a-preview-url a { color:#7c3aed; }
  </style>
  ${seo.jsonLdScript}
</head>
<body style="margin:0;padding:20px;background:#e2e8f0;">
  <main id="block12a-root">${html}</main>
  ${foot}
  <script src="/static/threadBalance.js?v=${encodeURIComponent(BLOCK_12A_ENGINE_VERSION)}"></script>
</body>
</html>`
}
