export function getBackendApiBase() {
  const direct = process.env.KABURLU_BACKEND_URL
  if (direct) return String(direct).replace(/\/$/, '')

  const host = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com'
  const cleaned = String(host).replace(/\/$/, '')
  // If caller already included /api/*, don't append another /api/v1
  if (/\/api\//i.test(cleaned)) return cleaned
  return `${cleaned}/api/v1`
}

export async function forwardJson(req, res, { path, authorization }) {
  const base = getBackendApiBase()
  const rawPath = `${path.startsWith('/') ? '' : '/'}${path}`
  // Backward-compat: many callers include '/api/v1' in the path. Since base already
  // defaults to include '/api/v1', strip it to avoid '/api/v1/api/v1/...'.
  const normalizedPath = rawPath === '/api/v1'
    ? ''
    : rawPath.replace(/^\/api\/v1\b/i, '')

  const url = new URL(`${base}${normalizedPath}`)

  Object.entries(req.query || {}).forEach(([k, v]) => {
    if (k === 'path') return
    if (Array.isArray(v)) {
      v.forEach((vv) => url.searchParams.append(k, vv))
    } else if (typeof v !== 'undefined') {
      url.searchParams.append(k, v)
    }
  })

  const headers = {
    Accept: 'application/json',
  }
  if (authorization) headers.Authorization = authorization
  else if (req.headers.authorization) headers.Authorization = req.headers.authorization

  const method = req.method || 'GET'
  const init = {
    method,
    headers,
  }

  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(req.body ?? {})
  }

  const upstream = await fetch(url.toString(), init)
  const contentType = upstream.headers.get('content-type') || 'application/json'
  const text = await upstream.text()

  res.status(upstream.status)
  res.setHeader('Content-Type', contentType)
  return res.send(text)
}
