/**
 * Proxy API route for login to bypass CORS
 * POST /api/auth/login -> https://app.kaburlumedia.com/api/v1/auth/login
 */
import { buildSetCookieHeader } from '../../../lib/server/auth'
import { getBackendApiBase } from '../../../lib/server/backend'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const backendApiBase = getBackendApiBase()
  
  try {
    const response = await fetch(`${backendApiBase}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(req.body),
    })

    const data = await response.json()

    // Best-practice: store JWT in httpOnly cookie (server can use it for BFF routes)
    const jwt = data?.data?.jwt
    if (response.ok && jwt) {
      const cookieName = process.env.KABURLU_ADMIN_JWT_COOKIE_NAME || 'kab_admin_jwt'
      const maxAge = Number(process.env.KABURLU_ADMIN_JWT_MAX_AGE_SECONDS || 60 * 60 * 24 * 7)
      res.setHeader(
        'Set-Cookie',
        buildSetCookieHeader({ name: cookieName, value: jwt, maxAgeSeconds: maxAge })
      )
    }

    return res.status(response.status).json(data)
  } catch (error) {
    console.error('Login proxy error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to connect to backend',
      error: error.message 
    })
  }
}
