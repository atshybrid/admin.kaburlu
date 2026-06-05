import { getBackendApiBase } from './backend'

let memoryCache = null
let memoryCacheKey = ''
let cacheAt = 0
const CACHE_MS = 60_000

/**
 * @param {{ bustCache?: boolean, authorization?: string }} opts
 */
export async function fetchHeaderStylesCatalog({ bustCache = false, authorization } = {}) {
  const cacheKey = authorization ? 'admin' : 'public'
  if (!bustCache && memoryCache && memoryCacheKey === cacheKey && Date.now() - cacheAt < CACHE_MS) {
    return memoryCache
  }
  const base = getBackendApiBase()
  const url = authorization
    ? `${base}/admin/epaper/header-styles`
    : `${base}/public/epaper/header-styles`
  const headers = { Accept: 'application/json' }
  if (authorization) headers.Authorization = authorization

  const res = await fetch(url, { headers })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    throw new Error('Invalid header-styles JSON from backend')
  }
  if (!res.ok) {
    throw new Error(data?.error || text || `HTTP ${res.status}`)
  }
  memoryCache = data
  memoryCacheKey = cacheKey
  cacheAt = Date.now()
  return data
}

/** @deprecated use fetchHeaderStylesCatalog */
export async function fetchPublicHeaderStylesCatalog(opts = {}) {
  return fetchHeaderStylesCatalog({ ...opts, authorization: undefined })
}
