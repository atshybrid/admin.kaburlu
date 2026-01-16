/**
 * Clear the httpOnly admin JWT cookie.
 */
import { buildSetCookieHeader } from '../../../lib/server/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const cookieName = process.env.KABURLU_ADMIN_JWT_COOKIE_NAME || 'kab_admin_jwt'
  res.setHeader('Set-Cookie', buildSetCookieHeader({ name: cookieName, value: '', maxAgeSeconds: 0 }))
  return res.status(200).json({ ok: true })
}
