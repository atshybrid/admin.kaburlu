/**
 * Main Page Top Block templates — client-side table (localStorage).
 * Ready to sync to backend `/epaper/main-page-top-templates` when API exists.
 */

import {
  BUILTIN_MAIN_PAGE_TOP_TEMPLATES,
  DEFAULT_MAIN_PAGE_TOP_TEMPLATE,
} from './mainPageTopBlockRules'

const PROTECTED_TEMPLATE_IDS = new Set(
  BUILTIN_MAIN_PAGE_TOP_TEMPLATES.map((t) => t.id)
)

const STORAGE_KEY = 'kaburlu_main_page_top_templates_v1'

function safeParse(json, fallback) {
  try {
    return JSON.parse(json) || fallback
  } catch {
    return fallback
  }
}

function ensureBuiltinTemplates(list) {
  let out = [...list]
  for (const builtin of BUILTIN_MAIN_PAGE_TOP_TEMPLATES) {
    if (!out.some((t) => t.id === builtin.id)) {
      out = [builtin, ...out]
    }
  }
  return out
}

export function listMainPageTopTemplates() {
  if (typeof window === 'undefined') return BUILTIN_MAIN_PAGE_TOP_TEMPLATES
  const raw = window.localStorage.getItem(STORAGE_KEY)
  const list = safeParse(raw, [])
  if (!list.length) return BUILTIN_MAIN_PAGE_TOP_TEMPLATES
  return ensureBuiltinTemplates(list)
}

export function getMainPageTopTemplate(id) {
  const list = listMainPageTopTemplates()
  return list.find((t) => t.id === id) || DEFAULT_MAIN_PAGE_TOP_TEMPLATE
}

export function saveMainPageTopTemplate(template) {
  if (typeof window === 'undefined') return template
  const list = listMainPageTopTemplates().filter((t) => t.id !== template.id)
  const next = {
    ...template,
    updatedAt: new Date().toISOString(),
  }
  list.unshift(next)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  return next
}

export function deleteMainPageTopTemplate(id) {
  if (PROTECTED_TEMPLATE_IDS.has(id)) return false
  if (typeof window === 'undefined') return false
  const list = listMainPageTopTemplates().filter((t) => t.id !== id)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  return true
}

export function duplicateMainPageTopTemplate(id) {
  const src = getMainPageTopTemplate(id)
  const copy = {
    ...JSON.parse(JSON.stringify(src)),
    id: `top8x7-${Date.now()}`,
    name: `${src.name} (copy)`,
    updatedAt: new Date().toISOString(),
  }
  return saveMainPageTopTemplate(copy)
}

export function exportMainPageTopTemplatesJson() {
  return JSON.stringify(listMainPageTopTemplates(), null, 2)
}

export function importMainPageTopTemplatesJson(json) {
  const parsed = safeParse(json, null)
  if (!Array.isArray(parsed) || !parsed.length) throw new Error('Invalid template JSON')
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
  }
  return parsed
}
