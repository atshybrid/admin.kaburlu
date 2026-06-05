import { readAny } from './readAny'
import {
  normalizeHighlightLines,
  peelBulletHighlightsFromParagraphs,
  resolveArticleHighlights,
  coercePointsArray,
} from './block08ArticleHighlights'
import { decide06Or08Block, exceedsBlock04A } from './wideBlockRules'
import { seedTopBlockBodyColumns } from './mainPageTopBlockContent'

export { normalizeHighlightLines, peelBulletHighlightsFromParagraphs, resolveArticleHighlights }

/**
 * Map backend newspaper article JSON → props for ArticleBlock* components.
 * (Same contract as pages/admin/epaper/design.js had inline.)
 */
const HOIST_FROM_ENVELOPE = [
  'points',
  'highlights',
  'keyPoints',
  'bulletPoints',
  'summaryPoints',
  'highlightPoints',
  'storyPoints',
  'epaperPoints',
  'headlinePoints',
  'dateline',
  'subtitle',
  'subTitle',
  'featuredImageUrl',
  'media',
  'category',
]

/** Merge article core + sibling fields (e.g. data.points next to data.article). */
function unwrapNewspaperArticle(raw) {
  if (!raw || typeof raw !== 'object') return raw

  const dataEnvelope =
    raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data) ? raw.data : null
  const nestedArticle =
    raw.article ||
    raw.newsArticle ||
    raw.block ||
    (dataEnvelope ? dataEnvelope.article || dataEnvelope.newsArticle || dataEnvelope.block : null)

  const core =
    nestedArticle && (nestedArticle.title || nestedArticle.content || nestedArticle.body)
      ? nestedArticle
      : dataEnvelope && (dataEnvelope.title || dataEnvelope.content || dataEnvelope.body)
        ? dataEnvelope
        : raw

  const merged = { ...raw, ...(dataEnvelope || {}), ...core }

  for (const key of HOIST_FROM_ENVELOPE) {
    const empty =
      merged[key] == null ||
      merged[key] === '' ||
      (Array.isArray(merged[key]) && merged[key].length === 0)
    if (!empty) continue
    if (dataEnvelope?.[key] != null && dataEnvelope[key] !== '') merged[key] = dataEnvelope[key]
    else if (raw[key] != null && raw[key] !== '') merged[key] = raw[key]
    else if (nestedArticle?.[key] != null && nestedArticle[key] !== '') merged[key] = nestedArticle[key]
  }

  return merged
}

function countArticleImages(article) {
  if (!article) return 0
  return collectArticleImages(article, 6).length
}

/** Fast peek (list UI) — points from CMS fields only, not full HTML peel. */
export function peekArticleContentSignals(raw) {
  if (!raw) {
    return { hasPoints: false, pointCount: 0, imageCount: 0, isMultiImage: false }
  }
  const article = unwrapNewspaperArticle(raw)
  const pointKeys = [
    'points',
    'highlights',
    'keyPoints',
    'bulletPoints',
    'summaryPoints',
    'highlightPoints',
    'storyPoints',
    'epaperPoints',
    'headlinePoints',
  ]
  let pointCount = 0
  for (const key of pointKeys) {
    const n = coercePointsArray(article[key]).length
    if (n > pointCount) pointCount = n
  }
  const imageCount = countArticleImages(article)
  return {
    hasPoints: pointCount > 0,
    pointCount,
    imageCount,
    isMultiImage: imageCount >= 2,
  }
}

/**
 * Full signals (editor / preview) — same data BLOCK-06A & BLOCK-08A use at render.
 */
export function getArticleContentSignals(raw) {
  const empty = {
    hasPoints: false,
    pointCount: 0,
    imageCount: 0,
    isMultiImage: false,
    highlightSource: '',
    autoWideBlock: null,
    exceeds04A: false,
  }
  if (!raw) return empty

  const props = articleToBlockProps(raw)
  const article = unwrapNewspaperArticle(raw)
  const pointCount = props.highlights?.length || 0
  const imageCount = props.images?.length || 0
  const words = Number(article?.wordCount || 0)
  const chars =
    Number(article?.charCount || article?.characterCount || 0) ||
    (words > 0 ? Math.round(words * 5.8) : 0)
  const over04 = exceedsBlock04A(words, chars)

  return {
    hasPoints: pointCount > 0,
    pointCount,
    imageCount,
    isMultiImage: imageCount >= 2,
    highlightSource: props.highlightSource || '',
    exceeds04A: over04,
    autoWideBlock: over04 ? decide06Or08Block(words, chars, imageCount) : null,
  }
}

/** Block dropdown label — shows points:true / multi-images for 06A & 08A. */
export function formatBlockSelectLabel(blockCode, signals) {
  const code = String(blockCode || '')
  if (code !== 'BLOCK-06A' && code !== 'BLOCK-08A') return code
  if (!signals) return code

  const parts = [code, code === 'BLOCK-06A' ? '2col' : '3col']
  parts.push(signals.hasPoints ? `points:true (${signals.pointCount})` : 'points:false')
  if (signals.isMultiImage) parts.push(`multi-images (${signals.imageCount})`)
  else if (signals.imageCount === 1) parts.push('1-image')
  else parts.push('no-image')
  return parts.join(' · ')
}

function canonicalImageKey(src) {
  const s = String(src || '').trim()
  if (!s || s.startsWith('data:')) return s
  try {
    const u = new URL(s, 'https://cdn.local')
    return `${u.origin}${u.pathname}`.toLowerCase()
  } catch {
    return s.split('?')[0].toLowerCase()
  }
}

function mediaImageUrl(item) {
  return readAny(
    item,
    [
      'url',
      'imageUrl',
      'src',
      'fileUrl',
      'originalUrl',
      'cdnUrl',
      'publicUrl',
      'mediaUrl',
      'thumbnailUrl',
      'thumbUrl',
      'path',
      'asset.url',
      'asset.src',
      'image.url',
      'image.src',
      'image.fileUrl',
    ],
    ''
  )
}

/** Collect up to 6 distinct article images (shared by props + queue counts). */
export function collectArticleImages(article, max = 6) {
  const images = []
  const seen = new Set()
  const pushImage = (src, alt, caption, meta = {}) => {
    const key = canonicalImageKey(src)
    if (!key || seen.has(key) || images.length >= max) return
    seen.add(key)
    images.push({
      src: String(src).trim(),
      alt: alt || '',
      caption: caption || '',
      width: Number(meta.width || meta.naturalWidth || 0) || 0,
      height: Number(meta.height || meta.naturalHeight || 0) || 0,
      tags: meta.tags || meta.subject || meta.label || '',
    })
  }
  const featuredSrc = readAny(
    article,
    [
      'featuredImageUrl',
      'featuredImage.url',
      'featuredImage.src',
      'leadImageUrl',
      'leadImage.url',
      'leadImage.src',
      'heroImageUrl',
      'heroImage.url',
      'heroImage.src',
    ],
    ''
  )
  if (featuredSrc) {
    pushImage(featuredSrc, article.title || '', '', {
      width: readAny(article, ['featuredImageWidth', 'featuredImage.width', 'leadImage.width'], 0),
      height: readAny(article, ['featuredImageHeight', 'featuredImage.height', 'leadImage.height'], 0),
    })
  }
  const extraUrls = [
    'secondaryImageUrl',
    'secondImageUrl',
    'image2Url',
    'additionalImageUrl',
  ]
  extraUrls.forEach((path) => {
    const u = readAny(article, [path], '')
    if (u) pushImage(u, article?.title || '', '')
  })

  if (Array.isArray(article?.media)) {
    article.media.forEach((m) => {
      const url = mediaImageUrl(m)
      pushImage(url, m?.alt || m?.title || article?.title || '', m?.caption || m?.description || '', m)
    })
  }
  if (Array.isArray(article?.images)) {
    article.images.forEach((m) => {
      const url = mediaImageUrl(m)
      pushImage(url, m?.alt || m?.title || article?.title || '', m?.caption || m?.description || '', m)
    })
  }
  if (Array.isArray(article?.gallery)) {
    article.gallery.forEach((m) => {
      const url = mediaImageUrl(m)
      pushImage(url, m?.alt || m?.title || article?.title || '', m?.caption || m?.description || '', m)
    })
  }
  ;['attachments', 'attachmentList', 'additionalMedia', 'secondaryMedia', 'inlineImages'].forEach(
    (key) => {
      const arr = article[key]
      if (!Array.isArray(arr)) return
      arr.forEach((m) => {
        const url = typeof m === 'string' ? m : mediaImageUrl(m)
        pushImage(url, m?.alt || article?.title || '', m?.caption || '', m)
      })
    }
  )

  const rawContent = article?.content || article?.body || ''
  if (typeof rawContent === 'string' && rawContent.trim()) {
    const imgTags = rawContent.match(/<img[^>]+>/gi)
    if (imgTags) {
      imgTags.forEach((tag) => {
        const srcMatch =
          tag.match(/\b(?:src|data-src)=["']([^"']+)["']/i) ||
          tag.match(/\bsrcset=["']([^"',\s]+)/i)
        const altMatch = tag.match(/\balt=["']([^"']*)["']/i)
        if (srcMatch?.[1]) pushImage(srcMatch[1], altMatch?.[1] || article?.title || '', '')
      })
    }
  }

  return images
}

export function articleToBlockProps(raw) {
  const article = unwrapNewspaperArticle(raw)
  const images = collectArticleImages(article)

  let paragraphs = []
  const rawContent = article?.content || article?.body || ''
  const stripHtml = (str) =>
    String(str || '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()
  if (typeof rawContent === 'string' && rawContent.trim()) {
    const imgTags = rawContent.match(/<img[^>]+>/gi)
    if (imgTags) {
      const seen = new Set(images.map((im) => canonicalImageKey(im.src)))
      const pushFromHtml = (src, alt) => {
        const key = canonicalImageKey(src)
        if (!key || seen.has(key) || images.length >= 6) return
        seen.add(key)
        images.push({
          src: String(src).trim(),
          alt: alt || '',
          caption: '',
          width: 0,
          height: 0,
          tags: '',
        })
      }
      imgTags.forEach((tag) => {
        const srcMatch =
          tag.match(/\b(?:src|data-src)=["']([^"']+)["']/i) ||
          tag.match(/\bsrcset=["']([^"',\s]+)/i)
        const altMatch = tag.match(/\balt=["']([^"']*)["']/i)
        if (srcMatch?.[1]) pushFromHtml(srcMatch[1], altMatch?.[1] || article?.title || '')
      })
    }
    const pTags = rawContent.match(/<p[^>]*>[\s\S]*?<\/p>/gi)
    if (pTags && pTags.length > 0) {
      pTags.forEach((tag) => {
        const t = stripHtml(tag)
        if (t) paragraphs.push({ content: t })
      })
    } else {
      rawContent
        .split(/\n{2,}|\r\n{2,}/)
        .filter(Boolean)
        .forEach((p) => {
          const t = stripHtml(p)
          if (t) paragraphs.push({ content: t })
        })
    }
  } else if (Array.isArray(article?.paragraphs)) {
    article.paragraphs.forEach((p) => paragraphs.push(typeof p === 'string' ? { content: p } : p))
  } else if (Array.isArray(article?.content)) {
    article.content.forEach((p) => paragraphs.push(typeof p === 'string' ? { content: p } : p))
  }
  if (!paragraphs.length) {
    const excerpt = article?.excerpt || article?.description || article?.lead || article?.summary || ''
    if (excerpt) paragraphs.push({ content: excerpt })
    else paragraphs.push({ content: article?.title || '' })
  }

  const {
    highlights,
    paragraphs: bodyParagraphs,
    source: highlightSource,
  } = resolveArticleHighlights(article, paragraphs)
  paragraphs = bodyParagraphs

  const category = String(
    article?.category?.name || article?.categoryName || article?.category || 'general'
  ).toLowerCase()
  const dateline = String(
    article?.dateline
    || article?.locationLine
    || article?.districtName
    || article?.district?.name
    || article?.location?.districtName
    || ''
  ).trim()
  const subtitle = String(
    article?.subtitle || article?.subTitle || article?.sub_title || article?.dek || ''
  ).trim()
  const titleColor = String(
    readAny(
      article,
      [
        'epaperTitleColor',
        'designTitleColor',
        'titleColor',
        'designConfig.epaperTitleColor',
        'branding.epaperTitleColor',
        'settings.epaperTitleColor',
      ],
      ''
    ) || ''
  ).trim()
  const titleColorEnabled = readAny(
    article,
    [
      'titleColorEnabled',
      'useTitleColor',
      'epaperTitleColorEnabled',
      'designConfig.titleColorEnabled',
      'designConfig.useTitleColor',
      'branding.titleColorEnabled',
      'settings.titleColorEnabled',
    ],
    false
  )
  const firstMedia = Array.isArray(article?.media) ? article.media[0] : null
  const imageObjectPosition = String(
    readAny(article, ['featuredImageFocus', 'featuredImageObjectPosition'], '')
    || readAny(firstMedia || {}, ['focus', 'objectPosition', 'focalPoint'], '')
    || ''
  ).trim()

  return {
    title: article?.title || '',
    subtitle,
    category,
    dateline,
    highlights,
    highlightSource: highlightSource || '',
    images,
    paragraphs,
    titleColor,
    titleColorEnabled,
    imageObjectPosition,
  }
}

/** BLOCK-TOP8x7 — main page hero props + optional saved design template id. */
export function articleToMainPageTopProps(article, designTemplate = null) {
  const base = articleToBlockProps(article)
  const titleKicker = String(
    article?.titleKicker
      || article?.kicker
      || article?.epaperTitleKicker
      || base.subtitle
      || ''
  ).trim()
  const titleImportant = String(
    article?.titleImportant || article?.epaperTitleImportant || ''
  ).trim()
  const quoteAttribution = String(
    article?.quoteAttribution || article?.quoteBy || article?.attribution || ''
  ).trim()
  const continuedPage = String(article?.continuedPage || article?.jumpPage || '2').trim()
  const quoteText = String(article?.quote || article?.pullQuote || '').trim()
  const dateline = String(
    article?.dateline || article?.epaperDateline || article?.topLine || ''
  ).trim()
  const calloutTitle = String(
    article?.calloutTitle || article?.sidebarTitle || article?.epaperCalloutTitle || ''
  ).trim()
  const calloutText = String(
    article?.calloutText || article?.sidebarText || article?.epaperCalloutText || ''
  ).trim()

  const hasPoints = (base.highlights || []).length > 0
  const firstPara = (base.paragraphs || [])
    .map((p) => String(p?.content ?? p ?? '').trim())
    .find(Boolean)
  const bodyCols = seedTopBlockBodyColumns({
    paragraphs: base.paragraphs,
    quoteText,
    skipFirstParagraph: !hasPoints && !!firstPara,
  })

  const bodyLeftText =
    article?.bodyLeftText ?? article?.epaperBodyLeft ?? bodyCols.bodyLeftText
  const bodyRightText =
    article?.bodyRightText ?? article?.epaperBodyRight ?? bodyCols.bodyRightText
  const bodyQuoteText =
    article?.bodyQuoteText ?? article?.epaperBodyQuote ?? bodyCols.bodyQuoteText

  return {
    ...base,
    blockCode: 'BLOCK-TOP8x7',
    titleKicker,
    titleImportant,
    quoteText,
    quoteAttribution,
    continuedPage,
    dateline,
    calloutTitle,
    calloutText,
    bodyLeftText,
    bodyRightText,
    bodyQuoteText,
    designTemplate,
  }
}
