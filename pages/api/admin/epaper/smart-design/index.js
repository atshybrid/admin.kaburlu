import {
  createSmartDesign,
  listSmartDesigns,
} from '../../../../../lib/server/epaperSmartDesignStore'
import { requireAuth, requireTenantId, sendStoreError } from '../../../../../lib/server/epaperSmartDesignHttp'

export default function handler(req, res) {
  if (!requireAuth(req, res)) return
  const tenantId = requireTenantId(req, res)
  if (!tenantId) return

  if (req.method === 'GET') {
    const publicationEditionId =
      String(req.query.publicationEditionId || req.query.editionId || '').trim() || undefined
    const subEditionId = String(req.query.subEditionId || '').trim() || undefined
    return res.status(200).json(listSmartDesigns(tenantId, { publicationEditionId, subEditionId }))
  }

  if (req.method === 'POST') {
    try {
      const result = createSmartDesign(tenantId, req.body || {})
      return res.status(201).json(result)
    } catch (e) {
      return sendStoreError(res, e)
    }
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}
