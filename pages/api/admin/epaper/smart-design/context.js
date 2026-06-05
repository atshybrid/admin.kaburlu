import { getSmartDesignContext } from '../../../../../lib/server/epaperSmartDesignStore'
import { requireAuth, requireTenantId } from '../../../../../lib/server/epaperSmartDesignHttp'

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const tenantId = requireTenantId(req, res)
  if (!tenantId) return

  const editionId = String(req.query.editionId || req.query.publicationEditionId || '').trim() || undefined
  const subEditionId = String(req.query.subEditionId || '').trim() || undefined
  const tenantName = String(req.query.tenantName || '').trim() || undefined

  const payload = await getSmartDesignContext(tenantId, { editionId, subEditionId, tenantName })
  return res.status(200).json(payload)
}
