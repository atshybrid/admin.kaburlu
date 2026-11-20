import newsDeskApi from '../api/services/newsDeskApi'
import { isHttpImageUrl, normalizeImageUrlList } from './imageUrl'
import { resolveCategoryIdByName } from './categoryLoader'
import { parseStructuredNewsDeskPaste } from './structuredPaste'

/**
 * Map parsed brief → create-form field setters (async for source preview image).
 * Returns human-readable summary lines for toast/detail.
 */
export async function applyStructuredPasteToForm(text, categories, callbacks) {
  const parsed = parseStructuredNewsDeskPaste(text)
  const articleText = String(parsed.article || '').trim()
  const headlineText = String(parsed.headline || '').trim()
  if (!articleText && !headlineText) {
    throw new Error('Headline and Article text are empty — check label formatting')
  }
  if (!articleText) {
    throw new Error('Article content is required — add an Article: section with full Telugu text')
  }
  const summary = []

  if (parsed.headline) {
    callbacks.setHeadline(parsed.headline)
    summary.push('Headline')
  }
  if (parsed.article) {
    callbacks.setRawText(parsed.article)
    summary.push('Article')
  }

  const catId = resolveCategoryIdByName(categories, parsed.categoryName)
  if (catId) {
    callbacks.setCategoryId(catId)
    summary.push('Category')
  } else if (parsed.categoryName) {
    summary.push(`Category (unmatched: ${parsed.categoryName})`)
  }

  if (parsed.location?.district) callbacks.setLocationDistrict(parsed.location.district)
  if (parsed.location?.mandal) callbacks.setLocationMandal(parsed.location.mandal)
  if (parsed.location?.area) callbacks.setLocationArea(parsed.location.area)
  if (parsed.location?.note) {
    if (callbacks.setLocationNote) callbacks.setLocationNote(parsed.location.note)
    else if (!parsed.location?.area) callbacks.setLocationArea(parsed.location.note)
  }
  if (parsed.locationLine) summary.push('Location')

  if (parsed.sourceUrl) {
    callbacks.setSourceUrl(parsed.sourceUrl)
    summary.push('Source URL')
  }
  if (parsed.sourceName) {
    callbacks.setAttributionType('GOOGLE')
    callbacks.setAttributionCustom(parsed.sourceName)
    summary.push('Source name')
  }

  const urlAdds = []
  if (parsed.imageUrls.length) {
    urlAdds.push(...parsed.imageUrls)
    summary.push(`${parsed.imageUrls.length} image URL(s)`)
  }

  if (parsed.wantsSourceLeadImage && parsed.sourceUrl) {
    try {
      const res = await newsDeskApi.previewSource(parsed.sourceUrl)
      const img = res?.preview?.imageUrl
      if (img && isHttpImageUrl(img)) {
        urlAdds.push(img)
        summary.push('Lead image from source preview')
        callbacks.setSourcePreview?.(res)
      }
    } catch {
      summary.push('Source image (preview failed — use Images URL or upload)')
    }
  }

  if (urlAdds.length && typeof callbacks.setImages === 'function') {
    callbacks.setImages((prev) => [...prev, ...normalizeImageUrlList(urlAdds, prev)])
  }

  return { parsed, summary }
}