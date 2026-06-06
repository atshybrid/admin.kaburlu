/** Normalize News Survey API responses */

const EMPTY_LIST = { items: [], pagination: { page: 1, pageSize: 50, total: 0, totalPages: 1 } }

function unwrap(raw) {
  if (raw == null) return null
  if (Array.isArray(raw)) return raw
  if (typeof raw !== 'object') return raw
  if (raw.survey) return raw.survey
  if (raw.submission) return raw.submission
  if (raw.items || raw.pagination || raw.total != null) return raw
  if (raw.data != null) return unwrap(raw.data)
  if (raw.id) return raw
  return raw
}

export function normalizeSurvey(raw) {
  const s = unwrap(raw)
  if (!s || typeof s !== 'object') return null

  return {
    ...s,
    id: s.id || s.surveyId,
    title: s.title || '',
    question: s.question || '',
    answers: Array.isArray(s.answers) ? s.answers : [],
    frameImageUrl: s.frameImageUrl || null,
    status: s.status || 'ACTIVE',
    responseCount: Number(s.responseCount ?? 0),
    politicalPartyId: s.politicalPartyId || null,
    politicalParty: s.politicalParty || null,
    tenantId: s.tenantId ?? null,
    tenant: s.tenant || null,
    createdAt: s.createdAt || null,
    updatedAt: s.updatedAt || null,
  }
}

export function normalizeSurveyList(raw) {
  const data = unwrap(raw)
  if (!data) return { ...EMPTY_LIST }

  const items = (Array.isArray(data) ? data : data.items || [])
    .map(normalizeSurvey)
    .filter(Boolean)

  const pagination = data.pagination || {}
  const page = Number(pagination.page ?? data.page ?? 1)
  const pageSize = Number(pagination.pageSize ?? data.pageSize ?? 50)
  const total = Number(pagination.total ?? data.total ?? items.length)
  const totalPages = Number(pagination.totalPages ?? Math.max(1, Math.ceil(total / pageSize)))

  return { items, pagination: { page, pageSize, total, totalPages } }
}

export function normalizeSubmission(raw) {
  const s = unwrap(raw)
  if (!s || typeof s !== 'object') return null

  return {
    ...s,
    id: s.id || s.submissionId,
    surveyId: s.surveyId || null,
    surveyTitle: s.surveyTitle || s.survey?.title || '',
    videoUrl: s.videoUrl || null,
    selectedAnswerId: s.selectedAnswerId || s.answerId || null,
    selectedAnswerLabel: s.selectedAnswerLabel || s.answerLabel || null,
    submitterMobile: s.submitterMobile || s.mobile || s.reporterMobile || '',
    tenantId: s.tenantId || null,
    createdAt: s.createdAt || null,
  }
}

export function normalizeSubmissionList(raw) {
  const data = unwrap(raw)
  if (!data) return { ...EMPTY_LIST }

  const items = (Array.isArray(data) ? data : data.items || [])
    .map(normalizeSubmission)
    .filter(Boolean)

  const pagination = data.pagination || {}
  const page = Number(pagination.page ?? data.page ?? 1)
  const pageSize = Number(pagination.pageSize ?? data.pageSize ?? 50)
  const total = Number(pagination.total ?? data.total ?? items.length)
  const totalPages = Number(pagination.totalPages ?? Math.max(1, Math.ceil(total / pageSize)))

  return { items, pagination: { page, pageSize, total, totalPages } }
}

export function surveyStatusColor(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'ACTIVE') return 'green'
  if (s === 'DRAFT') return 'yellow'
  if (s === 'CLOSED' || s === 'ENDED') return 'gray'
  return 'blue'
}

export function formatSurveyDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
