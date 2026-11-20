import { isHttpImageUrl } from './imageUrl.js'

const FIELD_ALIASES = {
  headline: ['headline', 'title', 'శీర్షిక', 'హెడ్‌లైన్', 'హెడ్లైన్'],
  article: ['article', 'content', 'body', 'story', 'కథనం', 'వ్యాసం', 'మాటలు'],
  category: ['category', 'వర్గం', 'క్యాటగరీ'],
  location: ['location', 'place', 'loc', 'స్థానం', 'ప్రాంతం', 'చోటు'],
  sourceName: ['source name', 'source', 'publisher', 'site', 'మూలం', 'వెబ్‌సైట్'],
  sourceUrl: ['source url', 'source link', 'url', 'link', 'లింక్', 'జోడు'],
  images: ['images', 'image', 'photos', 'pictures', 'చిత్రాలు', 'ఫోటోలు', 'ఇమేజ్'],
}

function normalizeLabel(raw) {
  return String(raw || '')
    .trim()
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

function matchLabelLine(line) {
  const trimmed = String(line || '').trim()
  if (!trimmed) return null
  const m = trimmed.match(/^([^:]+):\s*(.*)$/)
  if (!m) return null
  const key = resolveFieldKey(m[1])
  if (!key) return null
  return { key, inlineValue: m[2].trim() }
}

export function looksLikeStructuredNewsDeskPaste(text) {
  const t = String(text || '')
  if (!t.trim()) return false
  let hits = 0
  for (const line of t.split(/\r?\n/)) {
    const m = matchLabelLine(line)
    if (m?.key === 'headline') hits++
    if (m?.key === 'article') hits++
  }
  return hits >= 2
}

export function extractImageUrlsFromBlock(block) {
  const urls = []
  const regex = /https?:\/\/[^\s<>"')\]]+/gi
  let m
  const raw = String(block || '')
  while ((m = regex.exec(raw))) {
    const u = m[0].replace(/[.,;)\]]+$/g, '')
    if (isHttpImageUrl(u)) urls.push(u)
  }
  return [...new Set(urls)]
}

export function parseLocationLine(line) {
  const s = String(line || '').trim()
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
 */
export function parseStructuredNewsDeskPaste(text) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n')
  const sections = {}
  let currentKey = null
  let buffer = []

  const flush = () => {
    if (!currentKey) return
    const body = buffer.join('\n').trim()
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

  const imagesBlock = sections.images || ''
  const imageUrls = extractImageUrlsFromBlock(imagesBlock)
  const wantsSourceLeadImage =
    imageUrls.length === 0 &&
    /original\s+source\s+image|source\s+image|lead\s+image|మూల\s+చిత్ర|original\s+image\s+url/i.test(imagesBlock)

  return {
    headline: sections.headline || '',
    article: sections.article || '',
    categoryName: sections.category || '',
    locationLine: sections.location || '',
    sourceName: sections.sourceName || '',
    sourceUrl: sections.sourceUrl || '',
    imageUrls,
    wantsSourceLeadImage,
    location: parseLocationLine(sections.location || ''),
  }
}