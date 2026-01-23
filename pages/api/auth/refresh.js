import { getBackendApiBase } from '../../../lib/server/backend'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { refreshToken } = req.body
    const authHeader = req.headers.authorization

    if (!refreshToken || !authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'Missing refresh token or authorization' 
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const backendBase = getBackendApiBase()

    // Call backend refresh endpoint
    const response = await fetch(`${backendBase}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ refreshToken })
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    return res.status(200).json(data)
  } catch (error) {
    console.error('Refresh token error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Token refresh failed' 
    })
  }
}
