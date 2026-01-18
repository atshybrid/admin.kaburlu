import { getAdminJwtFromRequest } from '../../../../lib/server/auth'
import { forwardJson } from '../../../../lib/server/backend'

export default async function handler(req, res) {
  try {
    const jwt = getAdminJwtFromRequest(req)
    if (!jwt) return res.status(401).json({ error: 'UNAUTHENTICATED' })

    const { tenantId } = req.query

    // Forward publish request to backend
    return await forwardJson(req, res, {
      path: tenantId 
        ? `/epaper/publish-issue?tenantId=${tenantId}`
        : '/epaper/publish-issue',
      authorization: `Bearer ${jwt}`,
    })
  } catch (e) {
    console.error('Publish issue error:', e)
    return res.status(500).json({ error: 'PROXY_ERROR', message: e?.message || String(e) })
  }
}
