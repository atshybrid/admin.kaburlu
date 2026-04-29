function parseCookies(cookieHeader) {
  const header = cookieHeader || ''
  const out = {}
  header.split(';').forEach((part) => {
    const [rawKey, ...rest] = part.split('=')
    const key = (rawKey || '').trim()
    if (!key) return
    const value = rest.join('=').trim()
    out[key] = decodeURIComponent(value)
  })
  return out
}

export function getAdminJwtFromRequest(req) {
  const cookieName = process.env.KABURLU_ADMIN_JWT_COOKIE_NAME || 'kab_admin_jwt'
  const cookies = parseCookies(req?.headers?.cookie)
  if (cookies[cookieName]) return cookies[cookieName]

  const authHeader = req?.headers?.authorization || req?.headers?.Authorization || ''
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim() || null
  }

  return null
}

export function buildSetCookieHeader({ name, value, maxAgeSeconds }) {
  const secure = process.env.NODE_ENV === 'production'
  const attrs = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : null,
    typeof maxAgeSeconds === 'number' ? `Max-Age=${maxAgeSeconds}` : null,
  ].filter(Boolean)

  return attrs.join('; ')
}
