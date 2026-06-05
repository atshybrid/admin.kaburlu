/**
 * Fetch newspaper articles for Block style workbench (dropdown + fit filters).
 */

import { getStoredTenantId } from './epaperTenantStorage'
import {
  parseWordCountFromArticle,
  parseCharCountFromArticle,
  parseImageCountFromArticle,
  suggestBlockFromCounts,
  articleFitsBlock,
} from './blockStyleFit'

export function getTenantIdFromAuth(tokenData, explicitTenantId = '') {
  const picked = String(explicitTenantId || '').trim()
  if (picked) return picked

  const stored = getStoredTenantId()
  if (stored) return stored

  if (!tokenData) return process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || null

  const user = tokenData.user || tokenData.data?.user
  const loginResponse = tokenData.data?.loginResponse || user?.loginResponse
  const tenants = loginResponse?.tenants || user?.tenants || []
  if (tenants[0]?.id) return tenants[0].id
  if (user?.tenantId) return user.tenantId
  if (user?.tenant?.id) return user.tenant.id
  return process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || null
}

function mapBlockToQueueItem(block) {
  const id = String(block?.id || block?.articleId || '').trim()
  if (!id) return null

  const title = String(block?.title || block?.headline || block?.printHeadline || id).trim()
  const wordCount = parseWordCountFromArticle(block)
  const charCount = parseCharCountFromArticle(block, wordCount)
  const imageCount = parseImageCountFromArticle(block)
  const suggestedBlock = String(block?.blockCode || block?.suggestedBlock || '').trim()
    || suggestBlockFromCounts(wordCount, imageCount, charCount)
  const highlightCount = Array.isArray(block?.points)
    ? block.points.length
    : Array.isArray(block?.highlights)
      ? block.highlights.length
      : 0

  return {
    id,
    title,
    wordCount,
    charCount,
    imageCount,
    highlightCount,
    suggestedBlock,
  }
}

/**
 * @param {{ token: string, tenantId: string, status?: string, maxPages?: number, pageSize?: number, maxItems?: number }}
 */
export async function fetchNewspaperArticleQueue({
  token,
  tenantId,
  status = 'PUBLISHED',
  maxPages = 8,
  pageSize = 50,
  maxItems = 300,
}) {
  const collected = []
  const seen = new Set()
  let page = 1
  let totalPages = 1

  while (page <= totalPages && page <= maxPages) {
    const params = new URLSearchParams({
      tenantId,
      status,
      page: String(page),
      pageSize: String(pageSize),
    })

    let res
    try {
      res = await fetch(`/api/admin/epaper/designer/articles?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
    } catch (err) {
      if (collected.length) break
      throw new Error(
        `Article list unreachable (${err?.message || 'network'}). Backend may be slow — try Refresh list.`
      )
    }

    const text = await res.text()
    let json = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }

    if (!res.ok) {
      const msg = json?.message || json?.error || text || `HTTP ${res.status}`
      if (collected.length) break
      throw new Error(msg)
    }

    const payload = json?.data && typeof json.data === 'object' ? json.data : json || {}
    const blocks = Array.isArray(payload.blocks)
      ? payload.blocks
      : Array.isArray(payload.items)
        ? payload.items
        : []

    for (const block of blocks) {
      const item = mapBlockToQueueItem(block)
      if (!item || seen.has(item.id)) continue
      seen.add(item.id)
      collected.push(item)
      if (collected.length >= maxItems) break
    }

    if (collected.length >= maxItems) break

    totalPages = Number(payload.totalPages || 1)
    if (!Number.isFinite(totalPages) || totalPages < 1) totalPages = 1
    if (!blocks.length && page > 1) break
    page += 1
  }

  collected.sort((a, b) => (b.wordCount || 0) - (a.wordCount || 0))

  return { items: collected, total: collected.length }
}

/**
 * Annotate queue items with fit flags for active block.
 * @param {Array} items
 * @param {string} activeBlockCode
 */
export function annotateQueueForBlock(items, activeBlockCode) {
  return items.map((item) => ({
    ...item,
    fitsActive: articleFitsBlock(item, activeBlockCode),
    fitsSuggested: item.suggestedBlock === activeBlockCode,
  }))
}
