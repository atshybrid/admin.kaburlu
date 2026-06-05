/**
 * Reporter designations catalog — GET /reporter-designations
 */
import { apiClient } from '../client'

export const reporterDesignationsApi = {
  list: async () => {
    const data = await apiClient.get('/reporter-designations')
    return Array.isArray(data) ? data : data?.data || []
  },
}

export function formatDesignationLabel(item) {
  if (!item) return ''
  const te = item.nativeName ? ` · ${item.nativeName}` : ''
  const level = item.level ? ` (${item.level})` : ''
  return `${item.name || item.code || ''}${te}${level}`
}

export function sortDesignations(list) {
  return [...list].sort((a, b) => {
    const lo = (a.levelOrder ?? 99) - (b.levelOrder ?? 99)
    if (lo !== 0) return lo
    return String(a.name || '').localeCompare(String(b.name || ''))
  })
}
