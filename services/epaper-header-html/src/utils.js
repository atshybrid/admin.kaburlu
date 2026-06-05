export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function splitLines(text, max = 0) {
  const lines = String(text || '')
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean)
  return max > 0 ? lines.slice(0, max) : lines
}

/** Dynamic running commentary — array of strings or { text } objects, else multiline text */
export function resolveRunningComments(settings = {}, maxLines = 8) {
  const raw = settings.runningComments
  if (Array.isArray(raw) && raw.length) {
    const lines = raw
      .map((item) => (typeof item === 'string' ? item : item?.text || ''))
      .map((x) => String(x).trim())
      .filter(Boolean)
    return maxLines > 0 ? lines.slice(0, maxLines) : lines
  }
  return splitLines(settings.runningCommentText, maxLines)
}

export function resolveCenterLogoUrl(settings = {}) {
  const custom =
    settings.paperNameImageUrl ||
    settings.logoUrl ||
    settings.headerLogoUrl ||
    ''
  if (custom) return custom
  if (settings.useDemoLogo === false) return ''
  return settings.demoLogoUrl || ''
}

export function splitPoints(text, max = 4) {
  return String(text || '')
    .split(/[\n•]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, max)
}

export function splitPublishedAreas(text) {
  return String(text || '')
    .split(/[•,|]/)
    .map((x) => x.trim())
    .filter(Boolean)
}

export function mergeSettings(input = {}) {
  return { ...input }
}
