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

export function mergeCategoryOptions(apiCategories) {
  const map = new Map()
  ;(apiCategories || []).forEach((cat) => {
    const id = cat.id || cat.categoryId
    if (!id) return
    const name = cat.name || cat.categoryName || cat.title || 'Category'
    if (!map.has(id)) map.set(id, { categoryId: id, categoryName: name })
  })
  return Array.from(map.values()).sort((a, b) => a.categoryName.localeCompare(b.categoryName))
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

  try {
    const tenantCategories = await apiClient.get(`/tenants/${DEFAULT_SHORT_NEWS_TENANT_ID}/categories`)
    categoryList = [...categoryList, ...unwrapList(tenantCategories)]
  } catch {
    // optional
  }

  return mergeCategoryOptions(categoryList)
}