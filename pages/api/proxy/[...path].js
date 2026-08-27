/**
 * General API Proxy - forwards all requests to backend to bypass CORS
 * Catches all /api/proxy/[...path] routes
 * Example: /api/proxy/tenants -> https://api.kaburlumedia.com/api/v1/tenants
 */
import { forwardJson } from '../../../lib/server/backend'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
}

export default async function handler(req, res) {
  const { path } = req.query
  const pathString = Array.isArray(path) ? path.join('/') : path || ''

  try {
    return await forwardJson(req, res, {
      path: `/${pathString}`,
      authorization: req.headers.authorization || '',
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to connect to backend',
      error: error?.message || String(error),
    })
  }
}
