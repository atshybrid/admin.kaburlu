import { BLOCK_08A } from './constants.js'
import { validateBlock08 } from './validateBlock08.js'
import {
  generateBlock08Html,
  generateBlock08PreviewDocument,
  generateBlock08Document,
} from './generateBlock08Html.js'
import { buildSeoBundle } from './seo08.js'
import { generateBlock08Css } from './generateBlock08Css.js'
import { fetchBlockTemplate } from './db/templates.js'

export async function renderBlock08(body, opts = {}) {
  const title = String(body?.title || '').trim()
  const subtitle = String(body?.subtitle || '').trim()
  const content = String(body?.content || '').trim()
  const imageCaption = String(body?.imageCaption || body?.caption || '').trim()
  const imageCaption2 = String(body?.imageCaption2 || body?.caption2 || '').trim()

  const template = await fetchBlockTemplate('BLOCK-08A')

  const layoutPreview = body?.layoutPreview === true || body?.previewMode === true

  const validation = validateBlock08(
    {
      title,
      subtitle,
      highlights: body?.highlights,
      image: body?.image ?? body?.images,
      content,
    },
    { layoutPreview },
  )

  const css = generateBlock08Css('block08a-root')

  if (!validation.valid && !layoutPreview) {
    return {
      valid: false,
      wordCount: validation.wordCount,
      estimatedHeightMm: validation.estimatedHeightMm,
      errors: validation.errors,
      template: {
        block_code: template.block_code || 'BLOCK-08A',
        width_mm: Number(template.width_mm) || BLOCK_08A.widthMm,
        max_height_mm: Number(template.max_height_mm) || BLOCK_08A.maxHeightMm,
        min_words: Number(template.min_words) || BLOCK_08A.minWords,
        max_words: Number(template.max_words) || BLOCK_08A.maxWords,
      },
      html: '',
      css,
    }
  }

  const article = {
    title: validation.normalized.title,
    subtitle: validation.normalized.subtitle,
    highlights: validation.normalized.highlights,
    imageUrls: validation.normalized.imageUrls,
    imageCaption,
    imageCaption2,
    content: validation.normalized.content,
  }

  const seoIn = body?.seo && typeof body.seo === 'object' ? body.seo : {}
  const seo = buildSeoBundle(article, seoIn, {
    previewUrl: opts.previewUrl || '',
    canonicalUrl: seoIn.canonicalUrl || body?.canonicalUrl,
    pageUrl: seoIn.pageUrl || body?.pageUrl,
    indexable: seoIn.indexable === true,
  })

  const warnBanner =
    layoutPreview && validation.errors.length
      ? `<div class="block08a__preview-warn" style="background:#fffbeb;color:#92400e;font:600 11px/1.3 system-ui;padding:6px 8px;margin-bottom:6px;border:1px solid #fde68a;border-radius:4px">Layout preview only: ${validation.errors.join(' · ')}</div>`
      : ''

  const html =
    warnBanner +
    generateBlock08Html(article, {
      wordCount: validation.wordCount,
      estimatedHeightMm: validation.estimatedHeightMm,
      includeMeta: body?.includeMeta === true,
      seoDescription: seo.context.description,
      datePublished: seo.context.datePublished,
      author: seo.context.author,
    })

  const previewMeta = {
    wordCount: validation.wordCount,
    estimatedHeightMm: validation.estimatedHeightMm,
    previewUrl: opts.previewUrl || '',
    seo: seoIn,
  }

  return {
    valid: validation.valid,
    wordCount: validation.wordCount,
    estimatedHeightMm: validation.estimatedHeightMm,
    errors: validation.valid ? [] : validation.errors,
    template: {
      block_code: template.block_code || 'BLOCK-08A',
      width_mm: Number(template.width_mm) || BLOCK_08A.widthMm,
      max_height_mm: Number(template.max_height_mm) || BLOCK_08A.maxHeightMm,
      min_words: Number(template.min_words) || BLOCK_08A.minWords,
      max_words: Number(template.max_words) || BLOCK_08A.maxWords,
    },
    html,
    css,
    seo: {
      title: seo.context.title,
      description: seo.context.description,
      jsonLd: seo.jsonLd,
      headHtml: seo.headHtmlProduction,
    },
    previewHtml: generateBlock08PreviewDocument(article, css, previewMeta),
    documentHtml: generateBlock08Document(article, css, {
      ...previewMeta,
      indexable: seoIn.indexable !== false,
      canonicalUrl: seo.context.canonicalUrl,
      pageUrl: seo.context.pageUrl,
    }),
  }
}
