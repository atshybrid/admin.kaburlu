import axios from 'axios'
import { getAdminJwtFromRequest } from '../../../../lib/server/auth'
import { getBackendApiBase } from '../../../../lib/server/backend'

export const config = {
  api: {
    bodyParser: false,
  },
}

function pickForwardHeaders(reqHeaders, jwt) {
  const out = {}
  if (reqHeaders['content-type']) out['content-type'] = reqHeaders['content-type']
  if (reqHeaders['content-length']) out['content-length'] = reqHeaders['content-length']
  out.accept = reqHeaders.accept || 'application/json'
  out.authorization = `Bearer ${jwt}`
  return out
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const jwt = getAdminJwtFromRequest(req)
  if (!jwt) return res.status(401).json({ error: 'UNAUTHENTICATED' })

  const url = `${getBackendApiBase()}/platform/news-cartoons/upload`

  try {
    const upstream = await axios({
      method: 'POST',
      url,
      data: req,
      headers: pickForwardHeaders(req.headers, jwt),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true,
    })

    res.status(upstream.status)
    if (upstream.headers?.['content-type']) {
      res.setHeader('Content-Type', upstream.headers['content-type'])
    }
    return res.send(upstream.data)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('News cartoon upload proxy error:', e)
    return res.status(500).json({ error: 'PROXY_ERROR', message: e?.message || String(e) })
  }
}
