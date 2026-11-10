/**
 * Copy helpers for tenant newspaper feed articles (print desk / Quark · PageMaker)
 */

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const TELUGU_RE = /[\u0C00-\u0C7F]/

export function articleDisplayTitle(article) {
  return (
    String(article?.title || article?.heading || article?.subTitle || '').trim() || 'Untitled'
  )
}

function normalizeMediaItem(item, index, captions) {
  if (typeof item === 'string') {
    const url = item.trim()
    if (!url) return null
    return {
      url,
      caption: (Array.isArray(captions) && String(captions[index] || '').trim()) || '',
      alt: '',
    }
  }
  if (!item || typeof item !== 'object') return null
  const url = String(item.url || item.src || item.href || '').trim()
  if (!url) return null
  return {
    url,
    caption: String(item.caption || (Array.isArray(captions) && captions[index]) || '').trim(),
    alt: String(item.alt || '').trim(),
  }
}

/** Normalize media.images, top-level images[], featuredImageUrl */
export function articleMediaImages(article) {
  const captions = article?.media?.captions || article?.mediaCaptions || []
  const nested = article?.media?.images
  const top = article?.images
  const rawUrls = article?.media?.urls || article?.mediaUrls

  let list = []

  const pushList = (arr) => {
    if (!Array.isArray(arr)) return
    arr.forEach((item, i) => {
      const norm = normalizeMediaItem(item, i, captions)
      if (norm?.url) list.push(norm)
    })
  }

  pushList(top)
  if (!list.length) pushList(nested)
  if (!list.length && Array.isArray(rawUrls) && rawUrls.length) {
    rawUrls.forEach((url, i) => {
      const norm = normalizeMediaItem(url, i, captions.length ? captions : article?.mediaCaptions)
      if (norm?.url) list.push(norm)
    })
  }

  if (list.length && Array.isArray(captions) && captions.length) {
    list = list.map((img, i) => ({
      ...img,
      caption: img.caption || String(captions[i] || '').trim(),
    }))
  }

  if (!list.length) {
    const featured = article?.media?.featuredImageUrl || article?.featuredImageUrl
    if (featured) {
      list = [{
        url: String(featured).trim(),
        caption: (Array.isArray(captions) && String(captions[0] || '').trim()) || '',
        alt: '',
      }]
    }
  }

  return list.filter((img) => img?.url)
}

export function articleHighlightsList(article) {
  const raw = article?.highlights ?? article?.points ?? []
  if (!Array.isArray(raw)) return []
  return raw.map((item) => String(item || '').trim()).filter(Boolean)
}

export const BULLET_CHAR = '•'

export function formatHighlightLine(line) {
  const cleaned = String(line || '').trim().replace(/^[\s•*\u2022\-–]+/, '').trim()
  return cleaned ? `${BULLET_CHAR} ${cleaned}` : ''
}

export function formatHighlightsCopy(article) {
  return articleHighlightsList(article)
    .map(formatHighlightLine)
    .filter(Boolean)
    .join('\n')
}

export function formatHighlightsHtml(article) {
  const lines = articleHighlightsList(article).map(formatHighlightLine).filter(Boolean)
  if (!lines.length) return ''
  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')
}

/** API dateline is often English newspaper name — not the Telugu print dateline tag */
function looksLikeNewspaperNameOnly(dateline) {
  const d = String(dateline || '').trim()
  if (!d) return true
  if (TELUGU_RE.test(d)) return false
  return d.length <= 80
}

/**
 * Telugu print articles often end with a short dateline tag (e.g. "భారతదేశ మాజీ ప్రధాని").
 * Move that line out of body for display + copy.
 */
function looksLikePrintDateline(text) {
  const t = String(text || '').trim()
  if (!t || t.length > 160) return false
  const hasTelugu = TELUGU_RE.test(t)
  const hasLatinPlace = /[A-Za-z][A-Za-z\s]{2,40},/.test(t)
  const hasDayMonth = /\d{1,2}\s+[\u0C00-\u0C7F]{2,20}/.test(t)
  if (hasLatinPlace && (hasTelugu || hasDayMonth)) return true
  const wordCount = t.split(/\s+/).filter(Boolean).length
  const endsWithFullStop = /[.!?।]$/.test(t)
  return (
    hasTelugu
    && wordCount <= 12
    && t.length <= 120
    && (!endsWithFullStop || wordCount <= 4)
  )
}

function extractTrailingDatelineInline(text) {
  const t = String(text || '').trim()
  if (!t) return { body: '', datelineTag: '' }

  const punctMatches = [...t.matchAll(/[.!?।]/g)]
  for (let i = punctMatches.length - 1; i >= 0; i -= 1) {
    const idx = punctMatches[i].index
    if (idx == null) continue
    const body = t.slice(0, idx + 1).trim()
    const tail = t.slice(idx + 1).replace(/^\s+/, '').trim()
    if (!tail || tail.length > 160) continue
    if (looksLikePrintDateline(tail)) {
      return { body, datelineTag: tail }
    }
  }

  return { body: t, datelineTag: '' }
}

function stripKnownDatelineFromBody(body, datelineTag) {
  if (!body || !datelineTag) return body
  let b = normalizeInlineSpaces(body)
  const tag = normalizeInlineSpaces(datelineTag)
  if (!tag) return b

  const suffixes = [
    tag,
    `.${tag}`,
    ` ${tag}`,
    `, ${tag}`,
  ]
  for (const suffix of suffixes) {
    if (b.endsWith(suffix)) {
      b = b.slice(0, -suffix.length).trim()
      if (/[.!?।]$/.test(b)) return b
      return b.replace(/\.\s*$/, '').trim()
    }
  }
  return body
}

function extractTrailingDatelineTag(content) {
  const trimmed = String(content || '').trim()
  if (!trimmed) return { body: '', datelineTag: '' }

  const lines = trimmed.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) {
    return extractTrailingDatelineInline(trimmed)
  }

  const last = lines[lines.length - 1]
  const rest = lines.slice(0, -1).join('\n')

  const wordCount = last.split(/\s+/).filter(Boolean).length
  const endsWithFullStop = /[.!?।]$/.test(last)
  const looksLikeTag =
    TELUGU_RE.test(last)
    && wordCount <= 12
    && last.length <= 120
    && (!endsWithFullStop || wordCount <= 4)

  if (looksLikeTag || looksLikePrintDateline(last)) {
    return { body: rest, datelineTag: last }
  }

  const inline = extractTrailingDatelineInline(trimmed)
  if (inline.datelineTag) return inline
  return { body: trimmed, datelineTag: '' }
}

function normalizeInlineSpaces(text) {
  return String(text || '').replace(/\s*\n+\s*/g, ' ').replace(/\s{2,}/g, ' ').trim()
}

/**
 * Split body for on-screen paragraphs only (blank lines). Copy uses continuous flow.
 */
function splitBodyForDisplay(rawBody) {
  const raw = String(rawBody || '').trim()
  if (!raw) return []
  const parts = raw.split(/\n{2,}/).map((p) => normalizeInlineSpaces(p)).filter(Boolean)
  if (parts.length) return parts
  return [normalizeInlineSpaces(raw)]
}

/** Single continuous string for PageMaker / Quark — no newlines between paragraphs */
export function paragraphsToContinuousFlow(paragraphs) {
  return (paragraphs || [])
    .map((p) => normalizeInlineSpaces(p))
    .filter(Boolean)
    .join('')
}

export function resolveArticleParts(article) {
  const lead = String(article?.lead || '').trim()
  let content = String(article?.content || '').trim()
  const apiDateline = String(article?.dateline || '').trim()

  if (lead && content === lead) content = ''
  if (lead && content.startsWith(lead)) {
    content = content.slice(lead.length).replace(/^\s+/, '')
  }

  let merged = content
  if (lead && merged) merged = `${lead}\n\n${merged}`
  else if (lead) merged = lead

  const { body: bodyRaw, datelineTag: tailTag } = extractTrailingDatelineTag(merged)

  let datelineTag = tailTag
  if (!datelineTag && apiDateline && !looksLikeNewspaperNameOnly(apiDateline)) {
    datelineTag = apiDateline
  }

  let body = bodyRaw
  if (datelineTag) {
    body = stripKnownDatelineFromBody(body, datelineTag)
  } else {
    const again = extractTrailingDatelineInline(body)
    if (again.datelineTag) {
      datelineTag = again.datelineTag
      body = again.body
    }
  }

  const bodyParagraphs = splitBodyForDisplay(body)
  const newspaperLabel = looksLikeNewspaperNameOnly(apiDateline) ? apiDateline : ''

  return {
    datelineTag,
    bodyParagraphs,
    newspaperLabel,
    apiDateline,
  }
}

export function formatDatelineCopy(article) {
  return resolveArticleParts(article).datelineTag
}

export function articleBodyParagraphs(article) {
  return resolveArticleParts(article).bodyParagraphs
}

export function formatArticleBodyFlowOnly(article) {
  const { bodyParagraphs } = resolveArticleParts(article)
  return paragraphsToContinuousFlow(bodyParagraphs)
}

/**
 * Print order: bullets (if any) → dateline+article (continuous; no gap between dateline and body).
 */
export function formatBodyPlain(article) {
  const datelineTag = formatDatelineCopy(article)
  const bullets = formatHighlightsCopy(article)
  const flow = formatArticleBodyFlowOnly(article)
  const tail = datelineTag ? `${datelineTag}${flow || ''}` : flow
  const chunks = []
  if (bullets) chunks.push(bullets)
  if (tail) chunks.push(tail)
  if (!chunks.length) return ''
  if (!bullets) return tail || ''
  return chunks.join('\n\n')
}

export function formatBodyHtml(article) {
  const datelineTag = formatDatelineCopy(article)
  const bullets = formatHighlightsHtml(article)
  const flow = formatArticleBodyFlowOnly(article)
  const htmlParts = []
  if (bullets) htmlParts.push(bullets)
  const tail = datelineTag ? `${datelineTag}${flow || ''}` : flow
  if (tail) htmlParts.push(`<p><b>${escapeHtml(tail)}</b></p>`)
  return htmlParts.join('')
}

export function formatBodyCopy(article) {
  return formatBodyPlain(article)
}

/** Print flow: dateline first, then body — continuous (no line breaks) */
export function formatArticleAfterDatelineRich(article) {
  const plain = formatBodyPlain(article)
  const html = formatBodyHtml(article)
  return { plain, html }
}

export function formatFullArticleRich(article) {
  const title = articleDisplayTitle(article)
  const datelineTag = formatDatelineCopy(article)
  const bulletsPlain = formatHighlightsCopy(article)
  const bulletsHtml = formatHighlightsHtml(article)
  const bodyFlow = formatArticleBodyFlowOnly(article)

  let plainParts = []
  let htmlParts = []

  if (title && title !== 'Untitled') {
    plainParts.push(title)
    htmlParts.push(`<p><b>${escapeHtml(title)}</b></p>`)
  }
  if (bulletsPlain) {
    plainParts.push(bulletsPlain)
    htmlParts.push(bulletsHtml)
  }
  const tail = datelineTag ? `${datelineTag}${bodyFlow || ''}` : bodyFlow
  if (tail) {
    plainParts.push(tail)
    htmlParts.push(`<p><b>${escapeHtml(tail)}</b></p>`)
  }

  const images = articleMediaImages(article)
  if (images.length) {
    const capLines = images
      .map((img, i) => {
        const cap = String(img.caption || '').trim()
        return cap ? `${BULLET_CHAR} Photo ${i + 1}: ${cap}` : null
      })
      .filter(Boolean)
    if (capLines.length) {
      plainParts.push(capLines.join('\n'))
      htmlParts.push(capLines.map((l) => `<p>${escapeHtml(l)}</p>`).join(''))
    }
  }

  return {
    plain: plainParts.join('\n\n'),
    html: htmlParts.join(''),
  }
}

export function formatFullArticleCopy(article) {
  return formatFullArticleRich(article).plain
}

export function formatImageUrlCopy(img) {
  return String(img?.url || '').trim()
}

export function formatImageCaptionCopy(img) {
  return String(img?.caption || img?.alt || '').trim()
}

export function formatImageBlockCopy(img, index = 0) {
  const url = formatImageUrlCopy(img)
  const cap = formatImageCaptionCopy(img)
  if (cap && url) return `${cap}\n${url}`
  return url || cap
}

export async function copyToClipboard(text) {
  const value = String(text ?? '')
  if (!value.trim()) return false
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return true
  }
  return false
}

export async function copyRichClipboard({ plain, html }) {
  const text = String(plain ?? '')
  const markup = String(html ?? '')
  if (!text.trim() && !markup.trim()) return false

  if (
    typeof navigator !== 'undefined'
    && navigator.clipboard?.write
    && markup.trim()
    && typeof ClipboardItem !== 'undefined'
  ) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          'text/html': new Blob([markup], { type: 'text/html' }),
        }),
      ])
      return true
    } catch {
      // fall through to plain text
    }
  }
  return copyToClipboard(text)
}

export function flattenGroupedArticles(districts) {
  const out = []
  ;(districts || []).forEach((district) => {
    ;(district.reporters || []).forEach((reporter) => {
      const pw = reporter.priorityWise || {}
      ;['p1', 'p2', 'p3', 'others'].forEach((key) => {
        ;(pw[key] || []).forEach((article) => {
          out.push({
            ...article,
            _districtName: district.districtName,
            _reporterName: reporter.name,
            _priorityBucket: key,
          })
        })
      })
    })
  })
  return out
}

export function todayIstDateString() {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}
