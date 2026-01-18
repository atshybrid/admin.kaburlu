import { getAdminJwtFromRequest } from '../../../../lib/server/auth'
import { forwardJson } from '../../../../lib/server/backend'

export default async function handler(req, res) {
  try {
    const jwt = getAdminJwtFromRequest(req)
    if (!jwt) return res.status(401).json({ error: 'UNAUTHENTICATED' })

    const { tenantId, issueDate, issueId } = req.query

    // Build query params
    const params = new URLSearchParams()
    if (tenantId) params.set('tenantId', tenantId)
    if (issueDate) params.set('issueDate', issueDate)
    if (issueId) params.set('issueId', issueId)

    const queryString = params.toString() ? `?${params.toString()}` : ''

    // Forward request to backend
    return await forwardJson(req, res, {
      path: `/epaper/pdf-issues${queryString}`,
      authorization: `Bearer ${jwt}`,
    })
  } catch (e) {
    console.error('PDF issues error:', e)
    return res.status(500).json({ error: 'PROXY_ERROR', message: e?.message || String(e) })
  }
}
