/**
 * Sync JWT from existing client session (localStorage) into an httpOnly cookie.
 * This is a migration helper so new server-only BFF routes can work.
 */
import { buildSetCookieHeader } from '../../../lib/server/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const jwt = req.body?.jwt
  if (!jwt || typeof jwt !== 'string') return res.status(400).json({ error: 'MISSING_JWT' })

  const cookieName = process.env.KABURLU_ADMIN_JWT_COOKIE_NAME || 'kab_admin_jwt'
  const maxAge = Number(process.env.KABURLU_ADMIN_JWT_MAX_AGE_SECONDS || 60 * 60 * 24 * 7)

  res.setHeader('Set-Cookie', buildSetCookieHeader({ name: cookieName, value: jwt, maxAgeSeconds: maxAge }))
  return res.status(200).json({ ok: true })
}
