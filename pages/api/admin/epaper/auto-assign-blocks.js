import { getAdminJwtFromRequest } from '../../../../lib/server/auth'
import { getBackendApiBase } from '../../../../lib/server/backend'
import {
  ACTIVE_BLOCK_CODES,
  coerceToActiveBlockCode,
} from '../../../../lib/epaper/epaperActiveBlocks'

const BLOCK_CODES = ACTIVE_BLOCK_CODES

const ENV_TEMPLATE_MAP = {
  'BLOCK-02A': process.env.EPAPER_BLOCK_02A_TEMPLATE_ID || null,
  'BLOCK-03A': process.env.EPAPER_BLOCK_03A_TEMPLATE_ID || null,
  'BLOCK-04A': process.env.EPAPER_BLOCK_04A_TEMPLATE_ID || null,
  'BLOCK-06A': process.env.EPAPER_BLOCK_06A_TEMPLATE_ID || null,
  'BLOCK-08A': process.env.EPAPER_BLOCK_08A_TEMPLATE_ID || null,
  'BLOCK-09A': process.env.EPAPER_BLOCK_09A_TEMPLATE_ID || null,
  'BLOCK-12A': process.env.EPAPER_BLOCK_12A_TEMPLATE_ID || null,
}

function toBool(value, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
  }
  return fallback
}

function parseWordCount(article) {
  if (typeof article?.wordCount === 'number' && article.wordCount > 0) return article.wordCount
  const source = article?.content || ''
  const words = String(source).trim().split(/\s+/).filter(Boolean)
  return words.length
}

function parseCharCount(article, wordCount = 0) {
  if (typeof article?.charCount === 'number' && article.charCount > 0) return article.charCount
  const title = String(article?.title || '').trim()
  const body = String(article?.content || '').replace(/<[^>]+>/g, ' ').trim()
  const combined = `${title} ${body}`.trim()
  if (combined) return combined.length
  if (wordCount > 0) return Math.round(wordCount * 5.8)
  return 0
}

function parseImageCount(article) {
  const mediaCount = Array.isArray(article?.media) ? article.media.filter(item => item?.url).length : 0
  if (mediaCount > 0) return Math.min(mediaCount, 4)
  if (article?.featuredImageUrl) return 1
  return 0
}

function suggestBlockCode(article) {
  const wordCount = parseWordCount(article)
  const charCount = parseCharCount(article, wordCount)
  const imageCount = parseImageCount(article)
  const pointsCount = Array.isArray(article?.points) ? article.points.length : 0
  const over04 = wordCount > 199 || charCount > 3400

  const pick06or08 = () => {
    let score08 = 0
    if (wordCount >= 180) score08 += 2
    if (charCount >= 4200) score08 += 3
    else if (charCount >= 3600) score08 += 2
    if (imageCount >= 1) score08 += 2
    if (wordCount >= 220) score08 += 3
    return score08 >= 4 ? 'BLOCK-08A' : 'BLOCK-06A'
  }

  if (imageCount >= 4) return 'BLOCK-12A'
  if (imageCount === 3) return wordCount >= 140 ? 'BLOCK-12A' : 'BLOCK-08A'

  if (imageCount === 2) {
    if (wordCount < 90) return 'BLOCK-06A'
    if (wordCount < 200) return 'BLOCK-08A'
    return 'BLOCK-12A'
  }

  if (imageCount === 1) {
    if (!over04 && wordCount < 95) return 'BLOCK-04A'
    if (over04) return pick06or08()
    if (wordCount < 155) return 'BLOCK-06A'
    if (wordCount < 230) return 'BLOCK-08A'
    return 'BLOCK-12A'
  }

  if (!over04 && wordCount <= 199) return 'BLOCK-04A'
  if (over04) return pick06or08()
  if (wordCount < 260) return 'BLOCK-08A'

  return 'BLOCK-12A'
}

function applyBreakingBump(code, article) {
  if (!article?.isBreaking) return code
  if (code === 'BLOCK-04A') return 'BLOCK-06A'
  return code
}

function finalizeBlockCode(code) {
  return coerceToActiveBlockCode(code)
}

async function backendFetch(path, { method = 'GET', token, body, backendBaseUrl } = {}) {
  const base = (backendBaseUrl || getBackendApiBase()).replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${base}${normalizedPath}`

  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }

  return { ok: response.ok, status: response.status, data }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Use POST' })
  }

  try {
    const authHeader = req.headers?.authorization || ''
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
    const jwt = bearerToken || getAdminJwtFromRequest(req)
    if (!jwt) return res.status(401).json({ error: 'UNAUTHENTICATED' })

    const tenantId = req.body?.tenantId || req.query?.tenantId
    if (!tenantId) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'tenantId is required' })
    }

    const status = req.body?.status || req.query?.status || 'PUBLISHED'
    const fromDate = req.body?.fromDate || req.query?.fromDate
    const pageSize = Number(req.body?.pageSize || req.query?.pageSize || 50)
    const backendBaseUrl = req.body?.backendBaseUrl || req.query?.backendBaseUrl || null
    const dryRun = toBool(req.body?.dryRun ?? req.query?.dryRun, false)
    const clearUnmapped = toBool(req.body?.clearUnmapped ?? req.query?.clearUnmapped, false)

    const requestTemplateMap = req.body?.templateMap && typeof req.body.templateMap === 'object'
      ? req.body.templateMap
      : {}

    const templateMap = BLOCK_CODES.reduce((acc, code) => {
      const bodyValue = requestTemplateMap?.[code]
      acc[code] = bodyValue !== undefined ? bodyValue : ENV_TEMPLATE_MAP[code]
      return acc
    }, {})

    const collected = []
    let page = 1
    let totalPages = 1

    while (page <= totalPages) {
      const params = new URLSearchParams()
      params.set('tenantId', tenantId)
      params.set('status', status)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      if (fromDate) params.set('fromDate', fromDate)

      const articlesResp = await backendFetch(`/epaper/designer/articles?${params.toString()}`, {
        method: 'GET',
        token: jwt,
        backendBaseUrl,
      })

      if (!articlesResp.ok) {
        return res.status(articlesResp.status).json({
          error: 'FETCH_ARTICLES_FAILED',
          message: articlesResp?.data?.message || 'Failed to fetch articles',
          details: articlesResp.data,
        })
      }

      const payload = articlesResp.data || {}
      const blocks = Array.isArray(payload.blocks) ? payload.blocks : []
      totalPages = Number(payload.totalPages || 1)
      collected.push(...blocks)
      page += 1
    }

    const results = []
    let assignedCount = 0
    let skippedCount = 0
    let failedCount = 0

    for (const article of collected) {
      const suggestedCode = finalizeBlockCode(
        applyBreakingBump(suggestBlockCode(article), article)
      )
      const selectedTemplateId = templateMap[suggestedCode]
      const wordCount = parseWordCount(article)
      const imageCount = parseImageCount(article)

      if (!selectedTemplateId && !clearUnmapped) {
        skippedCount += 1
        results.push({
          articleId: article.id,
          title: article.title,
          wordCount,
          imageCount,
          suggestedBlockCode: suggestedCode,
          assignedTemplateBlockId: null,
          status: 'SKIPPED_NO_TEMPLATE_ID',
        })
        continue
      }

      if (dryRun) {
        assignedCount += 1
        results.push({
          articleId: article.id,
          title: article.title,
          wordCount,
          imageCount,
          suggestedBlockCode: suggestedCode,
          assignedTemplateBlockId: selectedTemplateId || null,
          status: 'DRY_RUN',
        })
        continue
      }

      const patchParams = new URLSearchParams()
      patchParams.set('tenantId', tenantId)

      const patchResp = await backendFetch(
        `/epaper/designer/articles/${article.id}/block-template?${patchParams.toString()}`,
        {
          method: 'PATCH',
          token: jwt,
          body: { templateBlockId: selectedTemplateId || null },
          backendBaseUrl,
        }
      )

      if (!patchResp.ok) {
        failedCount += 1
        results.push({
          articleId: article.id,
          title: article.title,
          wordCount,
          imageCount,
          suggestedBlockCode: suggestedCode,
          assignedTemplateBlockId: selectedTemplateId || null,
          status: 'FAILED',
          error: patchResp?.data?.error || patchResp?.data?.message || 'Patch failed',
        })
        continue
      }

      assignedCount += 1
      results.push({
        articleId: article.id,
        title: article.title,
        wordCount,
        imageCount,
        suggestedBlockCode: suggestedCode,
        assignedTemplateBlockId: selectedTemplateId || null,
        status: 'ASSIGNED',
      })
    }

    return res.status(200).json({
      ok: true,
      tenantId,
      status,
      fromDate: fromDate || null,
      backendBaseUrl: backendBaseUrl || getBackendApiBase(),
      dryRun,
      clearUnmapped,
      totalArticles: collected.length,
      assignedCount,
      skippedCount,
      failedCount,
      templateMap,
      results,
    })
  } catch (error) {
    return res.status(500).json({
      error: 'AUTO_ASSIGN_FAILED',
      message: error?.message || String(error),
    })
  }
}
