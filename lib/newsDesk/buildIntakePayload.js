/**
 * Build V2 News Desk intake body for POST /platform/syndication/jobs
 */

export function buildNewsDeskIntakePayload({
  rawText,
  headline,
  categoryId,
  categoryName,
  category,
  sourceUrl,
  sourceAttribution,
  locationHint,
  languageCode,
  imageUrls,
  tenantImages,
  tenants,
}) {
  const text = String(rawText || '').trim()
  const categoryPayload =
    category && typeof category === 'object'
      ? category
      : {
          ...(categoryId ? { categoryId: String(categoryId).trim() } : {}),
          ...(categoryName ? { categoryName: String(categoryName).trim() } : {}),
        }
  const payload = {
    rawText: text,
    category: categoryPayload,
    options: {
      newsDeskPipelineV2: true,
      languageCode: languageCode || 'te',
    },
    tenants: Array.isArray(tenants) ? tenants : [],
  }

  const hl = String(headline || '').trim()
  if (hl) payload.headline = hl

  const url = String(sourceUrl || '').trim()
  if (url) payload.sourceUrl = url

  if (sourceAttribution && typeof sourceAttribution === 'object') {
    payload.sourceAttribution = sourceAttribution
  }

  if (locationHint != null && locationHint !== '') {
    if (typeof locationHint === 'object' && !Array.isArray(locationHint)) {
      payload.locationHint = locationHint
    } else {
      payload.locationHint = { note: String(locationHint).trim() }
    }
  }

  const urls = (imageUrls || []).map((u) => String(u).trim()).filter(Boolean).slice(0, 8)
  if (urls.length) payload.images = urls

  const tMap = tenantImages && typeof tenantImages === 'object' ? tenantImages : {}
  const cleanedTenantImages = {}
  for (const [tid, u] of Object.entries(tMap)) {
    const url = String(u || '').trim()
    if (tid && url) cleanedTenantImages[tid] = url
  }
  if (Object.keys(cleanedTenantImages).length) {
    payload.imagesLegacy = {
      sharedImageUrl: urls[0] || null,
      tenantImages: cleanedTenantImages,
    }
  }

  return payload
}

export function assertV2CreateResponse(response) {
  if (!response?.job?.jobId && !response?.job?.id) {
    return { ok: false, reason: 'INVALID_RESPONSE', message: 'Unexpected server response after submit.' }
  }
  const jobId = response.job.jobId || response.job.id
  if (!response.pipeline) {
    return {
      ok: false,
      reason: 'V2_NOT_ACTIVE',
      message:
        'News Desk pipeline was not created. Set NEWS_DESK_PIPELINE_V2=true on the API server and restart it, then open this job again (orphan jobs are repaired automatically).',
      jobId,
    }
  }
  return { ok: true, jobId, response }
}