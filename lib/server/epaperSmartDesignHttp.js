import { getAdminJwtFromRequest } from './auth'

export function requireAuth(req, res) {
  const jwt = getAdminJwtFromRequest(req)
  if (!jwt) {
    res.status(401).json({ error: 'UNAUTHENTICATED' })
    return null
  }
  return jwt
}

export function requireTenantId(req, res) {
  const tenantId =
    String(req.headers['x-tenant-id'] || req.query.tenantId || '').trim()
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant context required (X-Tenant-Id)' })
    return null
  }
  return tenantId
}

export function sendStoreError(res, e) {
  if (e?.status === 409) {
    return res.status(409).json({ error: e.message, existingId: e.existingId })
  }
  // eslint-disable-next-line no-console
  console.error('Smart design store error:', e)
  return res.status(500).json({ error: 'STORE_ERROR', message: e?.message || String(e) })
}
