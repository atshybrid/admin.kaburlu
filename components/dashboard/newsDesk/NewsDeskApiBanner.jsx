/**
 * Shown when News Desk list/snapshot APIs fail (e.g. backend not deployed).
 */
export default function NewsDeskApiBanner({ error }) {
  if (!error) return null
  const status = error?.status
  const isNotFound = status === 404
  const isAuth = status === 401 || status === 403

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        isAuth
          ? 'border-amber-200 bg-amber-50 text-amber-900'
          : 'border-rose-200 bg-rose-50 text-rose-900'
      }`}
    >
      <p className="font-semibold">
        {isNotFound
          ? 'News Desk API not available on this server'
          : isAuth
            ? 'Sign in or permissions required'
            : 'Could not load News Desk data'}
      </p>
      <p className="mt-1 text-xs opacity-90">
        {isNotFound
          ? 'Deploy backend News Desk V1 routes (`GET /platform/newsdesk/jobs`) or point NEXT_PUBLIC_BACKEND_URL to a environment that has them.'
          : error?.message || 'Check your connection and try Refresh.'}
      </p>
    </div>
  )
}