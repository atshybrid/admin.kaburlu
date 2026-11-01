/**
 * Copy helpers for tenant newspaper feed articles (print desk)
 */

export function articleDisplayTitle(article) {
  return (
    String(article?.title || article?.heading || article?.subTitle || '').trim() || 'Untitled'
  )
}

export function articleHighlightsList(article) {
  const raw = article?.highlights ?? article?.points ?? []
  if (!Array.isArray(raw)) return []
  return raw.map((item) => String(item || '').trim()).filter(Boolean)
}

export function formatHighlightsCopy(article) {
  return articleHighlightsList(article)
    .map((line) => (line.startsWith('•') ? line : `• ${line}`))
    .join('\n')
}

export function formatDatelineCopy(article) {
  return String(article?.dateline || '').trim()
}

export function formatBodyCopy(article) {
  const parts = []
  const lead = String(article?.lead || '').trim()
  const content = String(article?.content || '').trim()
  if (lead) parts.push(lead)
  if (content && content !== lead) parts.push(content)
  return parts.join('\n\n')
}

export function formatFullArticleCopy(article) {
  const blocks = []
  const title = articleDisplayTitle(article)
  if (title && title !== 'Untitled') blocks.push(title)

  const bullets = formatHighlightsCopy(article)
  if (bullets) blocks.push(bullets)

  const dateline = formatDatelineCopy(article)
  if (dateline) blocks.push(dateline)

  const body = formatBodyCopy(article)
  if (body) blocks.push(body)

  return blocks.join('\n\n')
}

export async function copyToClipboard(text) {
  const value = String(text || '').trim()
  if (!value) return false
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return true
  }
  return false
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
