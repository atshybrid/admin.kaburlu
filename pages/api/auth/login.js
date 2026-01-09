/**
 * Proxy API route for login to bypass CORS
 * POST /api/auth/login -> https://app.kaburlumedia.com/api/v1/auth/login
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.kaburlumedia.com'
  
  try {
    const response = await fetch(`${backendUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(req.body),
    })

    const data = await response.json()
    
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
