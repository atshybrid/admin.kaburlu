import { isHttpImageUrl } from './imageUrl.js'

const FIELD_ALIASES = {
  headline: ['headline', 'title', 'శీర్షిక', 'హెడ్‌లైన్', 'హెడ్లైన్'],
  article: ['article', 'content', 'body', 'story', 'కథనం', 'వ్యాసం', 'మాటలు'],
  category: ['category', 'వర్గం', 'క్యాటగరీ'],
  location: ['location', 'place', 'loc', 'స్థానం', 'ప్రాంతం', 'చోటు'],
  sourceName: ['source name', 'publisher', 'site', 'మూలం', 'వెబ్‌సైట్', 'సోర్స్ పేరు'],
  sourceUrl: ['source url', 'source link', 'url', 'link', 'లింక్', 'జోడు', 'source'],
  images: ['images', 'image', 'photos', 'pictures', 'చిత్రాలు', 'ఫోటోలు', 'ఇమేజ్'],
}

function stripMarkdownDecorators(label) {
  return String(label || '')
    .replace(/^\*+|\*+$/g, '')
    .replace(/^#+\s*/, '')
    .trim()
}

function normalizeLabel(raw) {
  return stripMarkdownDecorators(raw)
    .toLowerCase()
    .replace(/[:\s]+$/g, '')
    .replace(/\s+/g, ' ')
}

function resolveFieldKey(label) {
  const n = normalizeLabel(label)
  if (!n) return null
  for (const [key, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((a) => n === normalizeLabel(a))) return key
  }
  return null
}

/** Unwrap ChatGPT markdown: [https://…], [text](url), stray brackets. */
export function cleanDeskFieldValue(raw) {
  let s = String(raw || '').trim()
  if (!s) return ''

  const mdLink = s.match(/^\[([^\]]*)\]\((https?:\/\/[^)]+)\)\s*$/i)
  if (mdLink) return mdLink[2].trim()

  if (/^\[[\s\S]+\]$/.test(s)) {
    const inner = s.slice(1, -1).trim()
    if (/^https?:\/\//i.test(inner)) return inner.replace(/[)\]]+$/, '')
    return inner
  }

  return s.replace(/^["'`]+|["'`]+$/g, '')
}

function matchLabelLine(line) {
  const trimmed = String(line || '').trim()
  if (!trimmed) return null

  // ChatGPT: **Headline:**  (colon inside bold, closing ** after colon)
  const mdColonInside = trimmed.match(/^\*{1,2}\s*([^*]+?)\s*:\s*\*{1,2}\s*(.*)$/)
  if (mdColonInside) {
    const key = resolveFieldKey(stripMarkdownDecorators(mdColonInside[1]))
    if (key) return { key, inlineValue: cleanDeskFieldValue(mdColonInside[2]) }
  }

  // **Headline:** inline value  or  **Source URL:** https://…
  const mdBoldWrap = trimmed.match(/^\*{1,2}\s*([^*]+?)\s*\*{1,2}\s*:\s*(.*)$/)
  if (mdBoldWrap) {
    const key = resolveFieldKey(stripMarkdownDecorators(mdBoldWrap[1]))
    if (key) return { key, inlineValue: cleanDeskFieldValue(mdBoldWrap[2]) }
  }

  const plain = trimmed.match(/^#{0,3}\s*([^:]+):\s*(.*)$/)
  if (!plain) return null
  const key = resolveFieldKey(stripMarkdownDecorators(plain[1]))
  if (!key) return null
  return { key, inlineValue: cleanDeskFieldValue(plain[2]) }
}

/** Light normalize (line endings + optional plain labels). */
export function normalizeDeskPasteText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(
      /^\s*\*{1,2}\s*([^*\n]+?)\s*:\s*\*{1,2}\s*$/gm,
      (_, label) => `${stripMarkdownDecorators(label)}:`,
    )
}

function collectFieldKeys(text) {
  const keys = new Set()
  const normalized = normalizeDeskPasteText(text)
  for (const line of normalized.split('\n')) {
    const m = matchLabelLine(line)
    if (m?.key) keys.add(m.key)
  }
  return keys
}

/** Gate before applying — must have real article (or headline + short article). */
export function validateDeskBriefForApply(parsed) {
  const articleLen = String(parsed?.article || '').trim().length
  const headlineLen = String(parsed?.headline || '').trim().length
  if (articleLen >= 30) return { ok: true }
  if (headlineLen >= 8 && articleLen >= 15) return { ok: true }
  return {
    ok: false,
    message:
      'Article text not found or too short. Labels alone are not enough — paste the full ChatGPT output, then click Apply to form.',
  }
}

export function extractImageUrlsFromBlock(block) {
  const urls = []
  const raw = String(block || '')
  const mdLinks = raw.matchAll(/\[[^\]]*\]\((https?:\/\/[^)]+)\)/gi)
  for (const m of mdLinks) {
    if (isHttpImageUrl(m[1])) urls.push(m[1])
  }
  const regex = /https?:\/\/[^\s<>"')\]]+/gi
  let m
  while ((m = regex.exec(raw))) {
    const u = m[0].replace(/[.,;)\]]+$/g, '')
    if (isHttpImageUrl(u) && !urls.includes(u)) urls.push(u)
  }
  return [...new Set(urls)]
}

function cleanSectionBody(body, key) {
  let trimmed = String(body || '').trim()
  trimmed = trimmed.replace(/^\*+\s*$/m, '').replace(/^\*+\s*\n/, '').trim()
  if (!trimmed) return ''
  if (key === 'sourceUrl') {
    const lines = trimmed.split('\n').map((l) => cleanDeskFieldValue(l.trim())).filter(Boolean)
    for (const line of lines) {
      if (/^https?:\/\//i.test(line)) return line
      const md = line.match(/\((https?:\/\/[^)]+)\)/)
      if (md) return md[1]
    }
    const fromText = trimmed.match(/https?:\/\/[^\s\])"]+/i)
    if (fromText) return fromText[0].replace(/[.,;)\]]+$/, '')
  }
  if (key === 'sourceName') return cleanDeskFieldValue(trimmed.split('\n')[0])
  return trimmed
}

export function parseLocationLine(line) {
  const s = cleanDeskFieldValue(line)
  if (!s) return {}
  const parts = s.split(/[,،]/).map((p) => p.trim()).filter(Boolean)
  if (parts.length === 1) return { district: parts[0] }
  if (parts.length === 2) return { district: parts[0], note: parts[1] }
  return {
    district: parts[0],
    mandal: parts[1] || '',
    area: parts.slice(2).join(', '),
  }
}

/**
 * Parse desk brief with labeled blocks (Headline:, Article:, Category:, …).
 * Supports plain text and ChatGPT markdown (**Label:**, [urls]).
 */
export function parseStructuredNewsDeskPaste(text) {
  const lines = normalizeDeskPasteText(text).split('\n')
  const sections = {}
  let currentKey = null
  let buffer = []

  const flush = () => {
    if (!currentKey) return
    const body = cleanSectionBody(buffer.join('\n').trim(), currentKey)
    if (body) sections[currentKey] = body
    buffer = []
  }

  for (const line of lines) {
    const label = matchLabelLine(line)
    if (label) {
      flush()
      currentKey = label.key
      if (label.inlineValue) buffer = [label.inlineValue]
      else buffer = []
      continue
    }
    if (currentKey) buffer.push(line)
  }
  flush()

  let sourceUrl = sections.sourceUrl || ''
  if (!sourceUrl) {
    const fromText = String(text || '').match(/https?:\/\/[^\s\])"]+/i)
    if (fromText) sourceUrl = fromText[0].replace(/[.,;)\]]+$/, '')
  }

  const imagesBlock = sections.images || ''
  const imageUrls = extractImageUrlsFromBlock(imagesBlock)
  const wantsSourceLeadImage =
    imageUrls.length === 0 &&
    /original\s+source\s+image|source\s+image|lead\s+image|మూల\s+చిత్ర|original\s+image\s+url|\[original/i.test(imagesBlock)

  return {
    headline: sections.headline || '',
    article: sections.article || '',
    categoryName: cleanDeskFieldValue(sections.category || ''),
    locationLine: sections.location || '',
    sourceName: cleanDeskFieldValue(sections.sourceName || ''),
    sourceUrl: cleanDeskFieldValue(sourceUrl),
    imageUrls,
    wantsSourceLeadImage,
    location: parseLocationLine(sections.location || ''),
  }
}

export function looksLikeStructuredNewsDeskPaste(text) {
  if (!String(text || '').trim()) return false
  const keys = collectFieldKeys(text)
  if (!keys.has('headline') || !keys.has('article')) return false
  return validateDeskBriefForApply(parseStructuredNewsDeskPaste(text)).ok
}

/** True if parse produced enough to fill the form. */
export function hasMeaningfulDeskParseResult(parsed) {
  return validateDeskBriefForApply(parsed).ok
}