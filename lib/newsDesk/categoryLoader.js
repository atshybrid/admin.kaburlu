import { apiClient } from '../api/client'
import { getAuthUser } from '../../utils/auth'
import { categoriesService, languagesService } from '../api/services'

const DEFAULT_SHORT_NEWS_TENANT_ID = process.env.NEXT_PUBLIC_SHORT_NEWS_TENANT_ID || 'cmk7e7tg401ezlp22wkz5rxky'

function unwrapList(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw.data)) return raw.data
  if (Array.isArray(raw.items)) return raw.items
  if (Array.isArray(raw.categories)) return raw.categories
  return []
}

function resolveCategoryRecord(cat) {
  if (!cat) return null
  const id = cat.category?.id || cat.id || cat.categoryId
  const name =
    (cat.translatedName || cat.name || cat.categoryName || cat.category?.name || cat.title || '').trim()
  if (!id || !name) return null
  return { categoryId: id, categoryName: name }
}

export function mergeCategoryOptions(apiCategories) {
  const map = new Map()
  ;(apiCategories || []).forEach((cat) => {
    const row = resolveCategoryRecord(cat)
    if (!row) return
    if (!map.has(row.categoryId)) map.set(row.categoryId, row)
  })
  return Array.from(map.values()).sort((a, b) => a.categoryName.localeCompare(b.categoryName))
}

/** Prefer sports / politics-style default for desk intake (matches syndication desk). */
export function pickNewsDeskDefaultCategoryId(categories) {
  const list = categories || []
  const sports = list.find((c) => /క్రీడ|sport/i.test(c.categoryName || ''))
  if (sports?.categoryId) return sports.categoryId
  return list[0]?.categoryId || ''
}

function normalizeCategoryMatchText(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function resolveCategoryIdByName(categories, categoryName) {
  const target = normalizeCategoryMatchText(categoryName)
  if (!target) return ''
  const list = categories || []
  const exact = list.find((c) => normalizeCategoryMatchText(c.categoryName) === target)
  if (exact?.categoryId) return exact.categoryId
  const partial = list.find((c) => {
    const n = normalizeCategoryMatchText(c.categoryName)
    return n.includes(target) || target.includes(n)
  })
  return partial?.categoryId || ''
}

export function buildNewsDeskCategoryPayload(categoryId, categories) {
  const selected = (categories || []).find((c) => c.categoryId === categoryId)
  if (!selected) {
    const id = String(categoryId || '').trim()
    return id ? { categoryId: id } : {}
  }
  return {
    categoryId: selected.categoryId,
    categoryName: selected.categoryName,
  }
}

export async function loadNewsDeskCategories() {
  const authUser = getAuthUser()
  let categoryList = []

  if (authUser?.languageId) {
    const byUserLanguage = await apiClient.get('/categories', { languageId: authUser.languageId })
    categoryList = unwrapList(byUserLanguage)
  }

  if (!categoryList.length) {
    const languages = await languagesService.getAll()
    const telugu =
      languages.find((lang) => (lang.code || lang.languageCode || '').toLowerCase() === 'te') || languages[0]

    if (telugu?.id) {
      const byLanguageId = await apiClient.get('/categories', { languageId: telugu.id })
      categoryList = unwrapList(byLanguageId)
    }
    if (!categoryList.length && telugu?.code) {
      const byLanguageCode = await apiClient.get('/categories', { languageCode: telugu.code })
      categoryList = unwrapList(byLanguageCode)
    }
  }

  if (!categoryList.length) {
    const allCategories = await categoriesService.getAll()
    categoryList = unwrapList(allCategories)
  }

  let tenantCategoryList = []
  try {
    const tenantCategories = await apiClient.get(`/tenants/${DEFAULT_SHORT_NEWS_TENANT_ID}/categories`)
    tenantCategoryList = unwrapList(tenantCategories)
    categoryList = [...tenantCategoryList, ...categoryList]
  } catch {
    // optional
  }

  const merged = mergeCategoryOptions(categoryList)
  if (tenantCategoryList.length) {
    const tenantIds = new Set(
      unwrapList(tenantCategoryList)
        .map((c) => resolveCategoryRecord(c)?.categoryId)
        .filter(Boolean),
    )
    const onTenant = merged.filter((c) => tenantIds.has(c.categoryId))
    if (onTenant.length) return onTenant
  }
  return merged
}