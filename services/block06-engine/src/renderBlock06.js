import { validateBlock06 } from './validateBlock06.js'
import { generateBlock06Html, generateBlock06PreviewDocument } from './generateBlock06Html.js'
import { generateBlock06Css } from './generateBlock06Css.js'
import { normalizeHighlights, normalizeImageUrl } from './utils.js'
import { fetchBlockTemplate } from './db/templates.js'

/**
 * Full render pipeline for API.
 * @param {object} body — API request body
 */
export async function renderBlock06(body) {
  const title = String(body?.title || '').trim()
  const subtitle = String(body?.subtitle || '').trim()
  const content = String(body?.content || '').trim()
  const highlights = normalizeHighlights(body?.highlights)
  const imageUrl = normalizeImageUrl(body?.image)
  const imageCaption = String(body?.imageCaption || body?.caption || '').trim()

  const template = await fetchBlockTemplate('BLOCK-06A')

  const layoutPreview = body?.layoutPreview === true || body?.previewMode === true

  const validation = validateBlock06(
    {
      title,
      subtitle,
      highlights,
      image: body?.image,
      content,
    },
    { layoutPreview },
  )

  const css = generateBlock06Css('block06a-root')

  if (!validation.valid && !layoutPreview) {
    return {
      valid: false,
      wordCount: validation.wordCount,
      estimatedHeightMm: validation.estimatedHeightMm,
      errors: validation.errors,
      template: {
        block_code: template.block_code || 'BLOCK-06A',
        width_mm: Number(template.width_mm) || 152.4,
        max_height_mm: Number(template.max_height_mm) || 254,
        min_words: Number(template.min_words) || 150,
        max_words: Number(template.max_words) || 300,
      },
      html: '',
      css,
    }
  }

  const article = {
    title: validation.normalized.title,
    subtitle: validation.normalized.subtitle,
    highlights: validation.normalized.highlights,
    imageUrl: validation.normalized.imageUrl,
    imageCaption,
    content: validation.normalized.content,
  }

  const html = generateBlock06Html(article, {
    wordCount: validation.wordCount,
    estimatedHeightMm: validation.estimatedHeightMm,
    includeMeta: body?.includeMeta === true,
  })

  const warnBanner =
    layoutPreview && validation.errors.length
      ? `<div class="block06a__preview-warn" style="background:#fffbeb;color:#92400e;font:600 11px/1.3 system-ui;padding:6px 8px;margin-bottom:6px;border:1px solid #fde68a;border-radius:4px">Layout preview only: ${validation.errors.join(' · ')}</div>`
      : ''

  return {
    valid: validation.valid,
    wordCount: validation.wordCount,
    estimatedHeightMm: validation.estimatedHeightMm,
    errors: [],
    template: {
      block_code: template.block_code || 'BLOCK-06A',
      width_mm: Number(template.width_mm) || 152.4,
      max_height_mm: Number(template.max_height_mm) || 254,
      min_words: Number(template.min_words) || 150,
      max_words: Number(template.max_words) || 300,
    },
    html: warnBanner + html,
    css,
    previewHtml: generateBlock06PreviewDocument(article, css, {
      wordCount: validation.wordCount,
      estimatedHeightMm: validation.estimatedHeightMm,
    }),
  }
}
