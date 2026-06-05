import {
  deleteSmartDesign,
  getSmartDesign,
  updateSmartDesign,
} from '../../../../../lib/server/epaperSmartDesignStore'
import { requireAuth, requireTenantId, sendStoreError } from '../../../../../lib/server/epaperSmartDesignHttp'

export default function handler(req, res) {
  if (!requireAuth(req, res)) return
  const tenantId = requireTenantId(req, res)
  if (!tenantId) return

  const id = String(req.query.id || '').trim()
  if (!id) return res.status(400).json({ error: 'Design id required' })

  if (req.method === 'GET') {
    const row = getSmartDesign(tenantId, id)
    if (!row) return res.status(404).json({ error: 'Smart design not found' })
    return res.status(200).json(row)
  }

  if (req.method === 'PUT') {
    try {
      const result = updateSmartDesign(tenantId, id, req.body || {}, { partial: false })
      if (!result) return res.status(404).json({ error: 'Smart design not found' })
      return res.status(200).json(result)
    } catch (e) {
      return sendStoreError(res, e)
    }
  }

  if (req.method === 'PATCH') {
    try {
      const result = updateSmartDesign(tenantId, id, req.body || {}, { partial: true })
      if (!result) return res.status(404).json({ error: 'Smart design not found' })
      return res.status(200).json(result)
    } catch (e) {
      return sendStoreError(res, e)
    }
  }

  if (req.method === 'DELETE') {
    const result = deleteSmartDesign(tenantId, id)
    if (!result) return res.status(404).json({ error: 'Smart design not found' })
    return res.status(200).json(result)
  }

  res.setHeader('Allow', 'GET, PUT, PATCH, DELETE')
  return res.status(405).json({ error: 'Method not allowed' })
}
