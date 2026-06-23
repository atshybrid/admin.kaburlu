import { ApiError } from '../api/client'

export function formatReaderAdminError(err, fallback = 'Something went wrong') {
  if (err instanceof ApiError) {
    const code = err.data?.code
    const msg = err.data?.error || err.message
    if (code) return `${msg} (${code})`
    return msg || fallback
  }
  if (err?.status === 401) return 'Session expired. Please sign in again.'
  if (err?.status === 403) return 'Super admin access only.'
  if (err?.error) return err.error
  return err?.message || fallback
}
