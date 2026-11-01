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

export function articleDisplayTitle(article) {
  return (
    String(article?.title || article?.heading || article?.subTitle || '').trim() || 'Untitled'
  )
}

/** Normalize media.images, top-level images[], featuredImageUrl */
export function articleMediaImages(article) {
  const top = article?.images
  const nested = article?.media?.images
  let list = []
  if (Array.isArray(top) && top.length) list = top
  else if (Array.isArray(nested) && nested.length) list = nested

  const captions = article?.media?.captions
  if (list.length && Array.isArray(captions)) {
    list = list.map((img, i) => ({
      ...img,
      caption: img.caption || captions[i] || '',
    }))
  }

  if (!list.length) {
    const featured = article?.media?.featuredImageUrl || article?.featuredImageUrl
    if (featured) {
      list = [{
        url: featured,
        caption: (Array.isArray(captions) && captions[0]) || '',
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

/** Bullet char used in UI + plain copy (PageMaker-friendly) */
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

export function formatDatelineCopy(article) {
  return String(article?.dateline || '').trim()
}

/**
 * Body paragraphs — split on blank lines; keep single newlines inside a paragraph.
 */
export function articleBodyParagraphs(article) {
  const lead = String(article?.lead || '').trim()
  let content = String(article?.content || '').trim()

  if (lead && content === lead) content = ''
  if (lead && content.startsWith(lead)) {
    content = content.slice(lead.length).replace(/^\s+/, '')
  }

  let raw = ''
  if (lead && content) raw = `${lead}\n\n${content}`
  else if (content) raw = content
  else if (lead) raw = lead
  else return []

  const parts = raw.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  if (parts.length) return parts
  return raw.trim() ? [raw.trim()] : []
}

/** Plain body: one paragraph per line (no extra blank lines) */
export function formatBodyPlain(article) {
  return articleBodyParagraphs(article).join('\n')
}

/** HTML body: each paragraph bold for Quark / PageMaker paste */
export function formatBodyHtml(article) {
  return articleBodyParagraphs(article)
    .map((p) => `<p><b>${escapeHtml(p)}</b></p>`)
    .join('')
}

/** @deprecated alias */
export function formatBodyCopy(article) {
  return formatBodyPlain(article)
}

/**
 * After dateline, article continues on next line (single \n), no blank line.
 * Body paragraphs: newline between, bold in HTML.
 */
export function formatArticleAfterDatelineRich(article) {
  const dateline = formatDatelineCopy(article)
  const paras = articleBodyParagraphs(article)
  const bodyPlain = paras.join('\n')
  const bodyHtml = formatBodyHtml(article)

  if (!dateline) {
    return { plain: bodyPlain, html: bodyHtml }
  }
  if (!paras.length) {
    return { plain: dateline, html: `<p>${escapeHtml(dateline)}</p>` }
  }

  return {
    plain: `${dateline}\n${bodyPlain}`,
    html: `<p>${escapeHtml(dateline)}</p>${bodyHtml}`,
  }
}

export function formatFullArticleRich(article) {
  const title = articleDisplayTitle(article)
  const bulletsPlain = formatHighlightsCopy(article)
  const bulletsHtml = formatHighlightsHtml(article)
  const afterDt = formatArticleAfterDatelineRich(article)

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
  if (afterDt.plain) {
    plainParts.push(afterDt.plain)
    htmlParts.push(afterDt.html)
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

/** Walk grouped `districts` tree from tenant-feed API */
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
