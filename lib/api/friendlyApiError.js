/** Strip HTML / Next dev cache errors into a short UI message. */
export function friendlyApiError(e) {
  const msg = e?.message || String(e)
  if (msg.includes('vendor-chunks') || msg.includes('<!DOCTYPE')) {
    return 'Admin API error — run: cd admin.kaburlu && npm run dev:clean (corrupt .next cache)'
  }
  if (msg.includes('UPSTREAM_TIMEOUT') || msg.includes('fetch failed')) {
    return 'Backend unreachable — start API (API_DEV_PORT=3011 npm run start:dev:env) and check .env.local NEXT_PUBLIC_BACKEND_URL'
  }
  return msg.length > 280 ? `${msg.slice(0, 280)}…` : msg
}