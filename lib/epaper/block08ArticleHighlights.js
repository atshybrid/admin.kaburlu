/**
 * BLOCK-08A — resolve per-article highlight panel (col1 top), never sample data.
 */

import { getByPath } from './readAny'

export function normalizeHighlightLines(raw) {
  if (!raw) return []
  if (typeof raw === 'string') {
    return raw
      .split(/\n+/)
      .map((s) => s.replace(/^[\s•\-–—]+/, '').trim())
      .filter(Boolean)
  }
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      return String(
        item?.text || item?.content || item?.point || item?.title || item?.headline || ''
      ).trim()
    })
    .filter(Boolean)
}

function stripTags(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** First <ul> in opening HTML → headline points (2–6 items). */
export function extractHighlightsFromHtml(html) {
  const src = String(html || '')
  if (!src.trim()) return []
  const head = src.slice(0, 4000)
  const ulMatch = head.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i)
  if (!ulMatch) return []

  const items = []
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi
  let m
  while ((m = liRe.exec(ulMatch[1])) && items.length < 6) {
    const t = stripTags(m[1])
    if (t.length >= 6 && t.length <= 240) items.push(t)
  }
  return items.length >= 2 ? items : []
}

/** Leading bullet lines in plain paragraphs. */
export function peelBulletHighlightsFromParagraphs(paragraphs = []) {
  const highlights = []
  const body = []
  for (const p of paragraphs) {
    const text = String(p?.content ?? p ?? '').trim()
    if (!text) continue
    const bullet = text.match(/^[\s]*(?:[-•*–—]|\d+[.)])\s+(.+)$/u)
    if (bullet && highlights.length < 6 && body.length === 0) {
      highlights.push(bullet[1].trim())
      continue
    }
    body.push(typeof p === 'string' ? { content: text } : p)
  }
  return { highlights, paragraphs: body.length ? body : paragraphs }
}

const DATELINE_HINT =
  /(జిల్లా|న్యూస్|బ్యూరో|కర్పోరేషన్|మండలం|హైదరాబాద్|అమరావతి|న్యూఢిల్లీ|విజయవాడ|బ్యూరో\s*:)/u

/** Opening 2–5 consecutive short lines (CMS sometimes stores points as paragraphs). */
export function inferSummaryHighlightsFromParagraphs(paragraphs = []) {
  const highlights = []
  let i = 0
  for (; i < paragraphs.length; i++) {
    const text = String(paragraphs[i]?.content ?? paragraphs[i] ?? '').trim()
    if (!text) continue
    const words = text.split(/\s+/).filter(Boolean).length
    const isShort = words >= 4 && words <= 26 && text.length <= 220
    const looksDateline = DATELINE_HINT.test(text) && words <= 14
    if (highlights.length < 5 && isShort && !looksDateline) {
      highlights.push(text)
      continue
    }
    break
  }
  const body = paragraphs.slice(i)
  if (highlights.length >= 2 && highlights.length <= 5) {
    return { highlights, paragraphs: body }
  }
  return { highlights: [], paragraphs }
}

function removeDuplicateHighlightParagraphs(paragraphs, highlights) {
  if (!highlights?.length) return paragraphs
  const keys = new Set(
    highlights.map((h) =>
      String(h || '')
        .replace(/^[\s•\-–—*]+/, '')
        .replace(/\s+/g, ' ')
        .trim()
    )
  )
  return paragraphs.filter((p) => {
    const t = String(p?.content ?? p ?? '')
      .replace(/^[\s•\-–—*]+/, '')
      .replace(/\s+/g, ' ')
      .trim()
    return t && !keys.has(t)
  })
}

const HIGHLIGHT_PATHS = [
  'points',
  'highlights',
  'keyPoints',
  'bulletPoints',
  'summaryPoints',
  'highlightPoints',
  'storyPoints',
  'epaperPoints',
  'headlinePoints',
  'data.points',
  'data.highlights',
  'block.points',
  'block.highlights',
  'payload.points',
  'result.points',
  'story.highlights',
  'story.points',
  'body.points',
  'body.highlights',
  'designConfig.points',
  'designConfig.highlights',
  'designConfig.epaper.points',
  'epaper.points',
  'epaper.highlights',
  'newspaper.points',
  'newspaper.highlights',
  'metadata.points',
  'metadata.highlights',
  'article.points',
  'article.highlights',
]

/** CMS may send points as JSON string or { items: [...] }. */
export function coercePointsArray(val) {
  if (val == null) return []
  if (Array.isArray(val)) return normalizeHighlightLines(val)
  if (typeof val === 'object') {
    if (Array.isArray(val.items)) return normalizeHighlightLines(val.items)
    if (Array.isArray(val.points)) return normalizeHighlightLines(val.points)
    if (Array.isArray(val.data)) return normalizeHighlightLines(val.data)
  }
  if (typeof val === 'string') {
    const t = val.trim()
    if (!t) return []
    if (t.startsWith('[') || t.startsWith('{')) {
      try {
        const parsed = JSON.parse(t)
        if (Array.isArray(parsed)) return normalizeHighlightLines(parsed)
        if (parsed && typeof parsed === 'object') return coercePointsArray(parsed.points || parsed.items)
      } catch {
        /* plain text bullets */
      }
    }
    return normalizeHighlightLines(t)
  }
  return []
}

function highlightSearchRoots(article) {
  const roots = [article]
  const seen = new Set()
  const add = (obj) => {
    if (!obj || typeof obj !== 'object' || seen.has(obj)) return
    seen.add(obj)
    roots.push(obj)
  }
  add(article?.data)
  add(article?.article)
  add(article?.block)
  add(article?.newsArticle)
  add(article?.data?.article)
  add(article?.data?.block)
  return roots
}

function tryHighlightPaths(article) {
  for (const root of highlightSearchRoots(article)) {
    for (const path of HIGHLIGHT_PATHS) {
      const lines = coercePointsArray(getByPath(root, path))
      if (lines.length) return { highlights: lines, source: path }
    }
  }
  return { highlights: [], source: '' }
}

/**
 * Per-article highlights for BLOCK-08A col1 panel (empty = no panel).
 */
export function resolveArticleHighlights(article, paragraphs) {
  let body = [...paragraphs]
  let source = ''

  const fromPaths = tryHighlightPaths(article)
  let highlights = fromPaths.highlights
  if (highlights.length) source = fromPaths.source

  if (!highlights.length) {
    highlights = extractHighlightsFromHtml(article?.content || article?.body || '')
    if (highlights.length) source = 'html-ul'
  }
  if (!highlights.length) {
    const peeled = peelBulletHighlightsFromParagraphs(body)
    highlights = peeled.highlights
    body = peeled.paragraphs
    if (highlights.length) source = 'bullet-peel'
  }
  if (!highlights.length) {
    const inferred = inferSummaryHighlightsFromParagraphs(body)
    highlights = inferred.highlights
    body = inferred.paragraphs
    if (highlights.length) source = 'inferred-openers'
  }

  if (highlights.length) {
    body = removeDuplicateHighlightParagraphs(body, highlights)
  }

  return { highlights: highlights.slice(0, 6), paragraphs: body, source }
}

/** Quick check for workbench / design UI. */
export function hasArticleHighlightPoints(article) {
  return resolveArticleHighlights(article || {}, []).highlights.length > 0
}
