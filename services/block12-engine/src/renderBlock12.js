import { BLOCK_12A } from './constants.js'
import { validateBlock12 } from './validateBlock12.js'
import {
  generateBlock12Html,
  generateBlock12PreviewDocument,
} from './generateBlock12Html.js'
import { generateBlock12Css } from './generateBlock12Css.js'
import { fetchBlockTemplate } from './db/templates.js'
import { buildSeoBundle } from './seo12.js'

export async function renderBlock12(body, opts = {}) {
  const title = String(body?.title || '').trim()
  const subtitle = String(body?.subtitle || '').trim()
  const content = String(body?.content || '').trim()
  const imageCaption = String(body?.imageCaption || body?.caption || '').trim()
  const imageCaption2 = String(body?.imageCaption2 || body?.caption2 || '').trim()
  const imageCaption3 = String(body?.imageCaption3 || body?.caption3 || '').trim()

  const template = await fetchBlockTemplate('BLOCK-12A')

  const validation = validateBlock12({
    title,
    subtitle,
    highlights: body?.highlights,
    image: body?.image ?? body?.images,
    content,
  })

  const css = generateBlock12Css('block12a-root')

  if (!validation.valid) {
    return {
      valid: false,
      wordCount: validation.wordCount,
      estimatedHeightMm: validation.estimatedHeightMm,
      errors: validation.errors,
      template: {
        block_code: template.block_code || 'BLOCK-12A',
        width_mm: Number(template.width_mm) || BLOCK_12A.widthMm,
        max_height_mm: Number(template.max_height_mm) || BLOCK_12A.maxHeightMm,
        min_words: Number(template.min_words) || BLOCK_12A.minWords,
        max_words: Number(template.max_words) || BLOCK_12A.maxWords,
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
    imageSplit: validation.normalized.imageSplit,
    imageCaption,
    imageCaption2,
    imageCaption3,
    content: validation.normalized.content,
  }

  const seoIn = body?.seo && typeof body.seo === 'object' ? body.seo : {}
  const seo = buildSeoBundle(article, seoIn, {
    previewUrl: opts.previewUrl || '',
    canonicalUrl: seoIn.canonicalUrl || body?.canonicalUrl,
    pageUrl: seoIn.pageUrl || body?.pageUrl,
    indexable: seoIn.indexable === true,
  })

  const html = generateBlock12Html(article, {
    wordCount: validation.wordCount,
    estimatedHeightMm: validation.estimatedHeightMm,
    includeMeta: body?.includeMeta === true,
    seoDescription: seo.context.description,
  })

  const previewMeta = {
    wordCount: validation.wordCount,
    estimatedHeightMm: validation.estimatedHeightMm,
    previewUrl: opts.previewUrl || '',
    seo: seoIn,
  }

  return {
    valid: true,
    wordCount: validation.wordCount,
    estimatedHeightMm: validation.estimatedHeightMm,
    imageCount: article.imageUrls.length,
    columnTopCount: article.imageSplit.columnTop.length,
    bottomImageCount: article.imageSplit.bottom.length,
    errors: [],
    template: {
      block_code: template.block_code || 'BLOCK-12A',
      width_mm: Number(template.width_mm) || BLOCK_12A.widthMm,
      max_height_mm: Number(template.max_height_mm) || BLOCK_12A.maxHeightMm,
      min_words: Number(template.min_words) || BLOCK_12A.minWords,
      max_words: Number(template.max_words) || BLOCK_12A.maxWords,
      column_count: BLOCK_12A.columnCount,
    },
    html,
    css,
    seo: {
      title: seo.context.title,
      description: seo.context.description,
      jsonLd: seo.jsonLd,
    },
    previewHtml: generateBlock12PreviewDocument(article, css, previewMeta),
  }
}
