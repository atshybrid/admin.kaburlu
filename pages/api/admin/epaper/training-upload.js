/**
 * Proxy: POST /api/admin/epaper/training-upload
 * Registers a PDF as an ML training sample with the backend.
 * Forwards to /epaper/ml-training/samples
 */
import { getAdminJwtFromRequest } from '../../../../lib/server/auth'
import { forwardJson } from '../../../../lib/server/backend'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const jwt = getAdminJwtFromRequest(req)
  if (!jwt) return res.status(401).json({ error: 'UNAUTHENTICATED' })

  return await forwardJson(req, res, {
    path: '/epaper/ml-training/samples',
    authorization: `Bearer ${jwt}`,
  })
}
