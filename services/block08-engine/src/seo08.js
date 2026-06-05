import { escapeHtml } from './utils.js'

/** @param {string} text @param {number} max */
export function excerptText(text, max = 160) {
  const t = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t) return ''
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const sp = cut.lastIndexOf(' ')
  return (sp > 40 ? cut.slice(0, sp) : cut).trim() + '…'
}

/**
 * @param {object} article
 * @param {object} [seoIn] — API: description, keywords, canonicalUrl, ogImage, author, datePublished, indexable
 * @param {object} [page] — previewUrl, indexable override
 */
export function buildSeoContext(article, seoIn = {}, page = {}) {
  const title = String(article.title || '').trim()
  const subtitle = String(article.subtitle || '').trim()
  const content = String(article.content || '').trim()
  const highlights = article.highlights || []
  const imageUrls = article.imageUrls || []

  const description =
    String(seoIn.description || '').trim() ||
    excerptText(subtitle ? `${subtitle}. ${content}` : content, 165)

  const keywords = String(seoIn.keywords || seoIn.tags || '').trim()
  const author = String(seoIn.author || seoIn.authorName || '').trim()
  const datePublished = String(seoIn.datePublished || seoIn.publishedAt || '').trim()
  const canonicalUrl = String(seoIn.canonicalUrl || page.canonicalUrl || '').trim()
  const pageUrl = String(page.pageUrl || seoIn.pageUrl || canonicalUrl || page.previewUrl || '').trim()
  const ogImage = String(seoIn.ogImage || imageUrls[0] || '').trim()
  const siteName = String(seoIn.siteName || 'Kaburlu Media').trim()
  const indexable = seoIn.indexable === true || page.indexable === true
  const locale = String(seoIn.locale || 'te_IN').trim()

  return {
    title,
    description,
    keywords,
    author,
    datePublished,
    canonicalUrl,
    pageUrl,
    ogImage,
    siteName,
    indexable,
    locale,
    imageUrls,
    highlights,
    content,
    subtitle,
  }
}

export function buildNewsArticleJsonLd(ctx) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: ctx.title,
    description: ctx.description,
    inLanguage: 'te',
    articleBody: ctx.content,
    ...(ctx.author ? { author: { '@type': 'Person', name: ctx.author } } : {}),
    ...(ctx.datePublished ? { datePublished: ctx.datePublished } : {}),
    ...(ctx.pageUrl ? { mainEntityOfPage: { '@type': 'WebPage', '@id': ctx.pageUrl } } : {}),
    ...(ctx.imageUrls.length
      ? { image: ctx.imageUrls.map((url) => ({ '@type': 'ImageObject', url })) }
      : {}),
  }
  return JSON.stringify(data, null, 0)
}

/**
 * Full <head> SEO tags for preview or production page.
 */
export function buildSeoHeadHtml(ctx, { preview = false } = {}) {
  const title = escapeHtml(ctx.title || 'Article')
  const desc = escapeHtml(ctx.description)
  const robots = preview || !ctx.indexable ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'
  const canonical = ctx.canonicalUrl
    ? `<link rel="canonical" href="${escapeHtml(ctx.canonicalUrl)}" />`
    : ''

  const ogImage = ctx.ogImage
    ? `<meta property="og:image" content="${escapeHtml(ctx.ogImage)}" />
  <meta name="twitter:image" content="${escapeHtml(ctx.ogImage)}" />`
    : ''

  const keywords = ctx.keywords
    ? `<meta name="keywords" content="${escapeHtml(ctx.keywords)}" />`
    : ''

  const author = ctx.author ? `<meta name="author" content="${escapeHtml(ctx.author)}" />` : ''
  const hreflang =
    ctx.pageUrl || ctx.canonicalUrl
      ? `<link rel="alternate" hreflang="te" href="${escapeHtml(ctx.pageUrl || ctx.canonicalUrl)}" />`
      : ''

  return `<title>${title}</title>
<meta name="description" content="${desc}" />
<meta name="robots" content="${robots}" />
${canonical}
<meta name="language" content="te" />
${keywords}
${author}
${hreflang}
<meta property="og:type" content="article" />
<meta property="og:locale" content="${escapeHtml(ctx.locale)}" />
<meta property="og:site_name" content="${escapeHtml(ctx.siteName)}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
${ctx.pageUrl ? `<meta property="og:url" content="${escapeHtml(ctx.pageUrl)}" />` : ''}
${ctx.datePublished ? `<meta property="article:published_time" content="${escapeHtml(ctx.datePublished)}" />` : ''}
${ogImage}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${desc}" />`
}

export function buildSeoBundle(article, seoIn = {}, page = {}) {
  const ctx = buildSeoContext(article, seoIn, page)
  const jsonLd = buildNewsArticleJsonLd(ctx)
  return {
    context: ctx,
    jsonLd,
    jsonLdScript: `<script type="application/ld+json">${jsonLd}</script>`,
    headHtml: buildSeoHeadHtml(ctx, { preview: page.preview === true }),
    headHtmlPreview: buildSeoHeadHtml(ctx, { preview: true }),
    headHtmlProduction: buildSeoHeadHtml(ctx, { preview: false }),
  }
}
