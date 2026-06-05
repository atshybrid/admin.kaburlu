import { getAdminJwtFromRequest } from '../../../../lib/server/auth'

/** Same-origin proxy so PDF export can inline remote header logos (CORS-safe). */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
  }

  const jwt = getAdminJwtFromRequest(req)
  if (!jwt) return res.status(401).json({ error: 'UNAUTHENTICATED' })

  const url = String(req.query.url || '').trim()
  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: 'INVALID_URL' })
  }

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'Kaburlu-Epaper-Export/1.0' },
      signal: AbortSignal.timeout(20000),
    })
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'UPSTREAM_FETCH_FAILED' })
    }
    const contentType = upstream.headers.get('content-type') || 'image/png'
    const buffer = Buffer.from(await upstream.arrayBuffer())
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'private, max-age=3600')
    return res.status(200).send(buffer)
  } catch (e) {
    return res.status(502).json({ error: 'PROXY_ERROR', message: e?.message || String(e) })
  }
}
