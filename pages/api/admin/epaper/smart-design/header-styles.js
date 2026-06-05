import { getAdminJwtFromRequest } from '../../../../../lib/server/auth'
import { forwardJson } from '../../../../../lib/server/backend'

/** GET — same as media backend GET /epaper/smart-design/header-styles */
export default async function handler(req, res) {
  if (!getAdminJwtFromRequest(req)) return res.status(401).json({ error: 'UNAUTHENTICATED' })
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const tenantId = String(req.headers['x-tenant-id'] || req.query.tenantId || '').trim()
  return forwardJson(req, res, {
    path: '/epaper/smart-design/header-styles',
    authorization: `Bearer ${getAdminJwtFromRequest(req)}`,
    extraHeaders: tenantId ? { 'X-Tenant-Id': tenantId } : undefined,
  })
}
