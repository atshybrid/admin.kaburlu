/**
 * Lightweight backend probe (no JWT). Used by header "API Online" badge.
 */
import { getBackendApiBase } from '../../lib/server/backend'

export default async function handler(_req, res) {
  const apiBase = getBackendApiBase().replace(/\/api\/v1\/?$/i, '')
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const upstream = await fetch(`${apiBase}/health/ai`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    clearTimeout(timer)
    const text = await upstream.text()
    res.status(upstream.ok ? 200 : upstream.status)
    res.setHeader('Content-Type', 'application/json')
    return res.send(text)
  } catch (e) {
    return res.status(503).json({
      ok: false,
      error: 'BACKEND_UNREACHABLE',
      message: e?.message || String(e),
      apiBase,
    })
  }
}