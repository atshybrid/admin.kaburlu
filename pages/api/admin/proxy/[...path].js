import { getAdminJwtFromRequest } from '../../../../lib/server/auth'
import { forwardJson } from '../../../../lib/server/backend'

export default async function handler(req, res) {
  try {
    const jwt = getAdminJwtFromRequest(req)
    console.log('[Proxy] Path:', req.query.path, '| JWT present:', !!jwt)
    if (!jwt) return res.status(401).json({ error: 'UNAUTHENTICATED' })

    // Reject non-JSON requests for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.headers['content-type'] || ''
      if (!contentType.includes('application/json')) {
        return res.status(400).json({ 
          error: 'BAD_REQUEST', 
          message: `This endpoint only accepts JSON. Received: ${contentType}` 
        })
      }
    }

    const pathParts = req.query.path
    const pathString = Array.isArray(pathParts) ? pathParts.join('/') : String(pathParts || '')
    const tenantIdFromQuery = String(req.query.tenantId || '').trim()
    const tenantIdFromHeader = String(req.headers['x-tenant-id'] || '').trim()
    const tenantId = tenantIdFromHeader || tenantIdFromQuery

    return await forwardJson(req, res, {
      path: `/${pathString}`,
      authorization: `Bearer ${jwt}`,
      extraHeaders: tenantId ? { 'X-Tenant-Id': tenantId } : undefined,
    })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Admin proxy error:', e)
    return res.status(500).json({ error: 'PROXY_ERROR', message: e?.message || String(e) })
  }
}
