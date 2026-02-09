/**
 * General API Proxy - forwards all requests to backend to bypass CORS
 * Catches all /api/proxy/[...path] routes
 * Example: /api/proxy/tenants -> https://app.kaburlumedia.com/api/v1/tenants
 */
export default async function handler(req, res) {
  const { path } = req.query
  const pathString = Array.isArray(path) ? path.join('/') : path || ''
  
  const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.kaburlumedia.com'
  const backendBase = String(rawBackendUrl || '')
    .replace(/\/+$/, '')
    .replace(/(\/api\/v1)+$/, '')
  const targetUrl = `${backendBase}/api/v1/${pathString}`
  
  // Forward query params
  const url = new URL(targetUrl)
  Object.entries(req.query).forEach(([key, value]) => {
    if (key !== 'path') {
      url.searchParams.append(key, value)
    }
  })

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  // Forward Authorization header if present
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers,
    }

    // Add body for POST, PUT, PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body)
      
      // Debug: Log media images if it's an article creation
      if (pathString.includes('articles/unified')) {
        console.log('📤 Proxy: articles/unified request')
        console.log('📸 Media in payload:', JSON.stringify(req.body?.media, null, 2))
        console.log('📸 Images count:', req.body?.media?.images?.length || 0)
      }
    }

    const response = await fetch(url.toString(), fetchOptions)
    
    // Get response body
    const text = await response.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }

    return res.status(response.status).json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to connect to backend',
      error: error.message 
    })
  }
}
