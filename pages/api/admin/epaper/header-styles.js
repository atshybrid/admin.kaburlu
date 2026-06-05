/**
 * GET /api/admin/epaper/header-styles
 * Proxies GET /admin/epaper/header-styles (JWT) or public catalog fallback.
 */
import { getAdminJwtFromRequest } from '../../../../lib/server/auth'
import { forwardJson } from '../../../../lib/server/backend'
import { fetchHeaderStylesCatalog } from '../../../../lib/server/fetchHeaderStylesCatalog'
import { HEADER_STYLE_UI_HINTS } from '../../../../lib/epaper/headerStyleUiHints'
import { EPAPER_HEADER_DESIGN_CONFIG_SCHEMA } from '../../../../lib/epaper/headerStyleCatalog'

function withHints(rows) {
  return (rows || []).map((row) => ({
    ...row,
    ...(HEADER_STYLE_UI_HINTS[row.key] || {}),
  }))
}

function normalizeCatalogPayload(catalog) {
  return {
    source: catalog.source || 'catalog',
    mainHeaders: catalog.mainHeaders || catalog.mainHeaderStyles || [],
    subHeaders: catalog.subHeaders || catalog.subHeaderStyles || [],
    mainHeaderStyles: withHints(catalog.mainHeaders || catalog.mainHeaderStyles),
    subHeaderStyles: withHints(catalog.subHeaders || catalog.subHeaderStyles),
    all: catalog.all || [],
    designConfigFields: EPAPER_HEADER_DESIGN_CONFIG_SCHEMA,
    renderEngine: catalog.renderEngine,
    paperPageSpecs: catalog.paperPageSpecs || [],
    pageSizes: catalog.pageSizes || catalog.paperPageSpecs || [],
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const jwt = getAdminJwtFromRequest(req)
  if (jwt) {
    try {
      const catalog = await fetchHeaderStylesCatalog({ authorization: `Bearer ${jwt}` })
      return res.status(200).json(normalizeCatalogPayload(catalog))
    } catch (e) {
      /* fall through to public */
    }
  }

  try {
    const catalog = await fetchHeaderStylesCatalog()
    return res.status(200).json(normalizeCatalogPayload(catalog))
  } catch (e) {
    return res.status(503).json({ error: e?.message || String(e) })
  }
}
