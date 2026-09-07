/**
 * Normalize syndication API envelopes ({ success, data }) to flat payloads
 */

export function unwrapSyndicationResponse(response) {
  if (!response || typeof response !== 'object') return response
  if (response.data && typeof response.data === 'object') {
    const nested = response.data
    if (
      nested.job
      || nested.blocked !== undefined
      || nested.items
      || nested.status
      || nested.published
      || nested.errors
    ) {
      return nested
    }
  }
  return response
}

export function extractSyndicationErrorMessage(error) {
  const data = error?.data || {}
  const missingSections = data.missingSections || data.missing_sections
  if (Array.isArray(missingSections) && missingSections.length) {
    return `AI response missing sections: ${missingSections.join(', ')}`
  }
  if (Array.isArray(data.missingElements) && data.missingElements.length) {
    return data.missingElements.join(' · ')
  }
  return error?.message || 'Syndication request failed'
}

export function validateGeneratedJob(job) {
  const issues = []
  if (!job?.masterPrint?.headline?.trim()) issues.push('print headline')
  if (!Array.isArray(job?.masterPrint?.body) || !job.masterPrint.body.some((block) => block?.text?.trim())) {
    issues.push('print body')
  }
  if (!Array.isArray(job?.alternateTitles) || job.alternateTitles.length < 1) {
    issues.push('alternate titles')
  }
  const tenants = job?.tenants || []
  tenants.forEach((tenant) => {
    const headline = tenant?.webArticle?.headline
      || tenant?.unifiedPost?.webArticle?.headline
    if (!headline?.trim()) {
      issues.push(`web headline (${tenant.nativeName || tenant.tenantId})`)
    }
  })
  return issues
}

export function tenantWebHeadline(tenant) {
  return tenant?.webArticle?.headline
    || tenant?.unifiedPost?.webArticle?.headline
    || tenant?.unifiedPost?.webArticle?.title
    || ''
}
