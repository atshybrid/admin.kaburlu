import { getAdminJwtFromRequest } from '../../../../lib/server/auth'
import { forwardJson } from '../../../../lib/server/backend'

export default async function handler(req, res) {
  try {
    const jwt = getAdminJwtFromRequest(req)
    if (!jwt) return res.status(401).json({ error: 'UNAUTHENTICATED' })

    // Forward all query params to backend via forwardJson (handles editionId, subEditionId, tenantId, issueDate, etc.)
    return await forwardJson(req, res, {
      path: `/epaper/pdf-issues`,
      authorization: `Bearer ${jwt}`,
    })
  } catch (e) {
    console.error('PDF issues error:', e)
    return res.status(500).json({ error: 'PROXY_ERROR', message: e?.message || String(e) })
  }
}
