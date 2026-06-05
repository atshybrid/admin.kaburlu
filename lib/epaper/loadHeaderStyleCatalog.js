import { setHeaderStyleCatalogCache } from './headerStyleCatalog'
import { getToken } from '../../utils/auth'

/** Browser: admin proxy → GET /admin/epaper/header-styles (catalog + paperPageSpecs + renderEngine). */
export async function loadHeaderStyleCatalogClient() {
  const token = getToken()?.token
  const headers = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch('/api/admin/epaper/header-styles', { headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || `header-styles HTTP ${res.status}`)
  }
  const catalog = {
    source: data.source,
    mainHeaders: data.mainHeaders || data.mainHeaderStyles || [],
    subHeaders: data.subHeaders || data.subHeaderStyles || [],
    all: data.all || [],
    renderEngine: data.renderEngine,
    paperPageSpecs: data.paperPageSpecs || [],
    recommended: data.renderEngine?.recommended,
  }
  setHeaderStyleCatalogCache(catalog)
  return catalog
}
