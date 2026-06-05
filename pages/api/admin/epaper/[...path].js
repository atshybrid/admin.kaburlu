import { getAdminJwtFromRequest } from '../../../../lib/server/auth'
import { forwardJson } from '../../../../lib/server/backend'

export default async function handler(req, res) {
  try {
    const jwt = getAdminJwtFromRequest(req)
    if (!jwt) return res.status(401).json({ error: 'UNAUTHENTICATED' })

    const pathParts = req.query.path
    const pathString = Array.isArray(pathParts) ? pathParts.join('/') : String(pathParts || '')
    const tenantIdFromQuery = String(req.query.tenantId || '').trim()
    const tenantIdFromHeader = String(req.headers['x-tenant-id'] || '').trim()
    const tenantId = tenantIdFromHeader || tenantIdFromQuery

    // Only proxy EPaper endpoints under /epaper/*
    return await forwardJson(req, res, {
      path: `/epaper/${pathString}`,
      authorization: `Bearer ${jwt}`,
      extraHeaders: tenantId ? { 'X-Tenant-Id': tenantId } : undefined,
    })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('EPaper admin proxy error:', e)
    return res.status(500).json({ error: 'PROXY_ERROR', message: e?.message || String(e) })
  }
}
