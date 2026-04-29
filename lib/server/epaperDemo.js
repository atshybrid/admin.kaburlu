import { getAdminJwtFromRequest } from './auth'
import { getBackendApiBase } from './backend'

export const DEFAULT_EPAPER_DEMO_ARTICLE_ID =
  process.env.EPAPER_DEMO_ARTICLE_ID || 'cmlwdfxlz01otbznkrik7df6a'

function resolveAuthorization(req) {
  const jwt = getAdminJwtFromRequest(req)
  if (jwt) return `Bearer ${jwt}`

  const envToken = process.env.EPAPER_DEMO_API_TOKEN
  if (envToken) return `Bearer ${envToken}`

  return null
}

export async function fetchEpaperDemoArticle(req, articleId = DEFAULT_EPAPER_DEMO_ARTICLE_ID) {
  const authorization = resolveAuthorization(req)
  if (!authorization) {
    return {
      ok: false,
      status: 401,
      error: 'HTTP 401: Login again or set EPAPER_DEMO_API_TOKEN in .env.local',
    }
  }

  const base = getBackendApiBase()
  const url = `${base}/articles/newspaper/${articleId}`

  try {
    const res = await fetch(url, {
      headers: {
        accept: 'application/json',
        Authorization: authorization,
      },
    })

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: `HTTP ${res.status}: ${res.statusText || 'Request failed'}`,
      }
    }

    const data = await res.json()
    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error: error?.message || 'Failed to fetch article',
    }
  }
}
