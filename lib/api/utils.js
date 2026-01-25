/**
 * Shared API utilities
 * Uses local proxy to avoid CORS issues
 */

export function getApiBase() {
  // Use local proxy in browser to avoid CORS
  if (typeof window !== 'undefined') {
    return '/api/proxy'
  }
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.kaburlumedia.com'
  const base = String(raw || '').replace(/\/+$/, '')
  const collapsed = base.replace(/(\/api\/v1)+$/, '/api/v1')
  return collapsed.endsWith('/api/v1') ? collapsed : `${collapsed}/api/v1`
}

export function getBackendUrl() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.kaburlumedia.com').replace(/\/$/, '')
}
