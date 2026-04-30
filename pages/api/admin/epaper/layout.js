import { getAdminJwtFromRequest } from '../../../../lib/server/auth'
import { forwardJson } from '../../../../lib/server/backend'

export default async function handler(req, res) {
  try {
    const jwt = getAdminJwtFromRequest(req)
    if (!jwt) return res.status(401).json({ error: 'UNAUTHENTICATED' })

    // GET  /api/admin/epaper/layout?issueDate=&editionId=&tenantId=
    // POST /api/admin/epaper/layout  (body: save layout payload)
    return await forwardJson(req, res, {
      path: '/epaper/layout',
      authorization: `Bearer ${jwt}`,
    })
  } catch (e) {
    console.error('EPaper layout proxy error:', e)
    return res.status(500).json({ error: 'PROXY_ERROR', message: e?.message || String(e) })
  }
}
