/**
 * Flatten / filter tenant newspaper feed for desk copy UI
 */
import { articleDisplayTitle, flattenGroupedArticles } from './articleCopy'

const BUCKET_ORDER = { p1: 0, p2: 1, p3: 2, others: 3 }

export function flattenFeedArticles(feed) {
  if (!feed) return []
  if (Array.isArray(feed.articles) && feed.articles.length) {
    return feed.articles.map((a) => ({ ...a }))
  }
  if (feed.districts?.length) {
    const out = []
    feed.districts.forEach((district) => {
      ;(district.reporters || []).forEach((reporter) => {
        ;['p1', 'p2', 'p3', 'others'].forEach((bucket) => {
          ;(reporter.priorityWise?.[bucket] || []).forEach((article) => {
            out.push({
              ...article,
              _districtName: district.districtName,
              _districtId: district.districtId,
              _reporterName: reporter.name,
              _reporterId: reporter.reporterId,
              _priorityBucket: bucket,
              _reporterDesignation: reporter.designation,
            })
          })
        })
      })
    })
    return out
  }
  return flattenGroupedArticles(feed.districts)
}

export function dedupeFeedArticles(list) {
  const seenId = new Set()
  const seenTitle = new Set()
  return list.filter((a) => {
    const id = a?.id
    if (id) {
      if (seenId.has(String(id))) return false
      seenId.add(String(id))
    }
    const titleKey = articleDisplayTitle(a).replace(/\s+/g, ' ').trim().toLowerCase()
    if (titleKey.length > 8) {
      if (seenTitle.has(titleKey)) return false
      seenTitle.add(titleKey)
    }
    return true
  })
}

/** Syndicated / news-desk copies (not reporter field best). */
export function isDeskSyndicatedArticle(article) {
  if (article?.newsDeskSyndicated === true) return true
  const ls = article?.layoutSuggestion
  if (ls && typeof ls === 'object' && ls.syndicated === true) return true
  return false
}

export function isDeskSlotArticle(article) {
  if (isDeskSyndicatedArticle(article)) return true
  const bucket = article?._priorityBucket || article?.priorityBucket
  if (bucket === 'p2' || bucket === 'p3') return true
  const code = String(article?._reporterDesignation?.code || article?.reporter?.designation?.code || '').toUpperCase()
  if (code.includes('DESK') || code.includes('NEWS_DESK')) return true
  const district = String(article?._districtName || '').trim()
  if (district === 'Unknown District' && !article?._districtId) return true
  return false
}

/** Default: reporter field / P1 — not desk syndicated slot. */
export function isBestReporterArticle(article) {
  return !isDeskSlotArticle(article)
}

export function sortArticlesForDesk(list) {
  return [...list].sort((a, b) => {
    const da = isDeskSlotArticle(a) ? 1 : 0
    const db = isDeskSlotArticle(b) ? 1 : 0
    if (da !== db) return da - db
    const ba = BUCKET_ORDER[a._priorityBucket] ?? 9
    const bb = BUCKET_ORDER[b._priorityBucket] ?? 9
    if (ba !== bb) return ba - bb
    const dist = String(a._districtName || '').localeCompare(String(b._districtName || ''), 'te')
    if (dist !== 0) return dist
    return articleDisplayTitle(a).localeCompare(articleDisplayTitle(b), 'te')
  })
}

export function collectReporterFilterOptions(articles) {
  const map = new Map()
  articles.forEach((a) => {
    const id = a._reporterId || a.reporter?.reporterId
    const name = a._reporterName || a.reporter?.name || 'Reporter'
    if (!id) return
    map.set(id, { reporterId: id, name })
  })
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'te'))
}
