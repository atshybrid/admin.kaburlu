import { getAdminJwtFromRequest } from '../../../../lib/server/auth'
import { getBackendApiBase } from '../../../../lib/server/backend'

/**
 * Returns the upload configuration for direct backend upload.
 * This bypasses Vercel's 4.5MB serverless function body limit
 * by allowing the client to upload directly to the backend API.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const jwt = getAdminJwtFromRequest(req)
  if (!jwt) {
    return res.status(401).json({ error: 'UNAUTHENTICATED' })
  }

  const backendBase = getBackendApiBase()
  
  // Build URL with query parameters (e.g., tenantId)
  const urlObj = new URL(`${backendBase}/media/upload`)
  if (req.query) {
    Object.entries(req.query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.append(key, value)
      }
    })
  }
  
  const uploadUrl = urlObj.toString()

  return res.status(200).json({
    uploadUrl,
    token: jwt,
  })
}
