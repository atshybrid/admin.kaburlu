/** User-facing API error text for journalist union admin. */
export function formatJournalistApiError(err, fallback = 'Request failed') {
  const status = err?.status
  const data = err?.data || {}
  const code = data.code || data.errorCode
  const msg = data.message || data.error || err?.message || fallback

  if (status === 404) {
    return code
      ? `${msg} (${code})`
      : `${msg} — endpoint may not be deployed yet (HTTP 404).`
  }
  if (status === 403) {
    return 'Access denied — Super Admin role required.'
  }
  if (status === 401) {
    return 'Session expired — please log in again.'
  }
  return code ? `${msg} (${code})` : msg
}
