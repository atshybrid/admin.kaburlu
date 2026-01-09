/**
 * Shared API utilities
 * Uses local proxy to avoid CORS issues
 */

export function getApiBase() {
  // Use local proxy in browser to avoid CORS
  if (typeof window !== 'undefined') {
    return '/api/proxy'
  }
  // Server-side can call backend directly
  return (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.kaburlumedia.com').replace(/\/$/, '') + '/api/v1'
}

export function getBackendUrl() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.kaburlumedia.com').replace(/\/$/, '')
}
