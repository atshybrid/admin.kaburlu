import { formatArticleBodyFlowOnly, formatHighlightsCopy } from './articleCopy'

export const WORD_RANGE_OPTIONS = [
  { id: 'all', label: 'All lengths', min: 0, max: Infinity },
  { id: 'short', label: '50–199 words', min: 50, max: 199 },
  { id: 'medium', label: '200–399 words', min: 200, max: 399 },
  { id: 'long', label: '400+ words', min: 400, max: Infinity },
]

/** Prefer API important.wordCount; else estimate from paste body. */
export function articleWordCount(article) {
  const fromApi = article?.important?.wordCount
  if (Number.isFinite(fromApi) && fromApi > 0) return Math.round(fromApi)
  const body = formatArticleBodyFlowOnly(article)
  const bullets = formatHighlightsCopy(article)
  const text = [bullets, body].filter(Boolean).join(' ')
  return text.split(/\s+/).filter(Boolean).length
}

export function wordCountBucket(count) {
  if (count >= 400) return 'long'
  if (count >= 200) return 'medium'
  if (count >= 50) return 'short'
  return 'tiny'
}

export function wordCountBucketLabel(count) {
  const b = wordCountBucket(count)
  if (b === 'long') return '400+'
  if (b === 'medium') return '200–399'
  if (b === 'short') return '50–199'
  return '<50'
}

export function articleMatchesWordRange(article, rangeId) {
  const opt = WORD_RANGE_OPTIONS.find((r) => r.id === rangeId) || WORD_RANGE_OPTIONS[0]
  if (opt.id === 'all') return true
  const n = articleWordCount(article)
  return n >= opt.min && n <= opt.max
}

export function articleCreatedAtMs(article) {
  const t = article?.createdAt || article?.publishedAt || article?.updatedAt
  if (!t) return 0
  const ms = Date.parse(t)
  return Number.isFinite(ms) ? ms : 0
}

export function formatArticleCreatedIst(article) {
  const ms = articleCreatedAtMs(article)
  if (!ms) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(ms)
}

export function sortArticlesByCreated(list, direction = 'desc') {
  const sign = direction === 'asc' ? 1 : -1
  return [...list].sort((a, b) => {
    const da = articleCreatedAtMs(a)
    const db = articleCreatedAtMs(b)
    if (da !== db) return (da - db) * sign
    return String(articleWordCount(a)).localeCompare(String(articleWordCount(b)))
  })
}

export function countByWordRange(articles) {
  const counts = { all: articles.length, short: 0, medium: 0, long: 0, tiny: 0 }
  articles.forEach((a) => {
    const b = wordCountBucket(articleWordCount(a))
    if (b === 'short') counts.short += 1
    else if (b === 'medium') counts.medium += 1
    else if (b === 'long') counts.long += 1
    else counts.tiny += 1
  })
  return counts
}