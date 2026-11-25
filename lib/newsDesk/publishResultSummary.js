/**
 * Summarize POST publish-web response for UI toasts and inline panels.
 */
export function summarizePublishWebResponse(res) {
  const results = Array.isArray(res?.results) ? res.results : []
  const published = results.filter((r) => r.ok && !r.skipped)
  const skipped = results.filter((r) => r.skipped)
  const failed = results.filter((r) => !r.ok)

  const lines = []
  for (const r of published) {
    lines.push({ type: 'ok', tenantId: r.tenantId, label: r.nativeName || r.tenantId, slug: r.webSlug })
  }
  for (const r of failed) {
    lines.push({
      type: 'fail',
      tenantId: r.tenantId,
      label: r.nativeName || r.tenantId,
      code: r.code || 'PUBLISH_FAILED',
    })
  }
  for (const r of skipped) {
    lines.push({
      type: 'skip',
      tenantId: r.tenantId,
      label: r.nativeName || r.tenantId,
      code: r.code || r.skipReason,
    })
  }

  return {
    partial: Boolean(res?.partial),
    success: Boolean(res?.success),
    publishedCount: published.length,
    failedCount: failed.length,
    skippedCount: skipped.length,
    lines,
  }
}

export function blockerLabel(code) {
  const map = {
    EXTRACTION_NOT_READY: 'Waiting for facts extraction',
    NOT_APPROVED: 'Editorial approval required',
    ALREADY_PUBLISHED: 'Already published',
    PUBLISH_IN_PROGRESS: 'Publish in progress',
    SNAPSHOT_INVALID: 'Snapshot missing body text',
    LEGACY_WORKFLOW: 'Use legacy syndication desk',
  }
  return map[code] || String(code || '').replace(/_/g, ' ')
}