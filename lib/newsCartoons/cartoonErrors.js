import { ApiError } from '../api/client'

/** Shorten Prisma / long server errors for UI */
export function formatCartoonError(err, fallback = 'Something went wrong') {
  if (err instanceof ApiError) {
    const raw = err.message || err.data?.error || err.data?.message || fallback
    return shortenServerError(raw, err.data?.code)
  }
  return shortenServerError(err?.message || err?.error || fallback)
}

function shortenServerError(msg, code) {
  const text = String(msg || '')
  if (text.includes("Unknown field 'name'") && text.includes('model `User`')) {
    return (
      'Backend bug: API is querying User.name but the database uses fullName. ' +
      'Ask backend team to fix POST /platform/news-cartoons (replace name → fullName in User select).'
    )
  }
  if (text.includes('Invalid `prisma.') || text.includes('PrismaClient')) {
    const firstLine = text.split('\n').find((l) => l.trim() && !l.includes('→'))?.trim()
    return firstLine ? firstLine.slice(0, 280) : 'Database error — contact backend team'
  }
  if (code) return `${text.slice(0, 200)} (${code})`
  return text.length > 320 ? `${text.slice(0, 320)}…` : text
}
