/** Union survey API response helpers */

const EMPTY = { items: [], total: 0, page: 1, limit: 20, totalPages: 1 }

function unwrap(raw) {
  if (raw == null) return null
  if (Array.isArray(raw)) return raw
  if (typeof raw !== 'object') return raw
  if (Array.isArray(raw.items) || raw.total != null || raw.campaigns) {
    return { ...raw, items: raw.items ?? raw.campaigns ?? raw.surveys }
  }
  if (raw.data != null) {
    if (Array.isArray(raw.data)) return raw.data
    if (raw.data.items || raw.data.surveys || raw.data.total != null) return raw.data
    if (raw.data.id || raw.data.surveyId || raw.data.campaignId) return raw.data
  }
  if (raw.id || raw.surveyId || raw.campaignId) return raw
  return raw
}

export function normalizeSurveyList(raw) {
  const data = unwrap(raw)
  if (!data) return { ...EMPTY }
  if (Array.isArray(data)) {
    return { items: data, total: data.length, page: 1, limit: data.length || 20, totalPages: 1 }
  }
  const items = data.items ?? data.surveys ?? data.campaigns ?? []
  const list = Array.isArray(items) ? items : []
  const normalized = list.map((row) => normalizeSurvey(row)).filter(Boolean)
  const limit = Number(data.limit ?? 20)
  const total = Number(data.total ?? list.length)
  return {
    items: normalized.length ? normalized : list,
    total,
    page: Number(data.page ?? 1),
    limit,
    totalPages: Number(data.totalPages ?? Math.max(1, Math.ceil(total / limit))),
  }
}

/** Prefer campaign id fields (list rows often have unrelated `id`) */
export function pickCampaignId(obj) {
  if (!obj || typeof obj !== 'object') return null

  const nested = obj.surveyCampaign || obj.campaign
  if (nested && typeof nested === 'object') {
    const nestedId = pickCampaignId(nested)
    if (nestedId) return nestedId
  }

  return (
    obj.surveyCampaignId ||
    obj.campaignId ||
    obj.surveyId ||
    obj.id ||
    obj._id ||
    null
  )
}

function pickId(obj) {
  return pickCampaignId(obj)
}

/** Extract survey id from any create/get/list API shape */
export function extractSurveyId(raw) {
  if (raw == null) return null
  if (typeof raw === 'string') return raw

  const direct = pickId(raw)
  if (direct) return String(direct)

  const nested = [
    raw.data,
    raw.survey,
    raw.campaign,
    raw.result,
    raw.data?.survey,
    raw.data?.campaign,
    raw.data?.surveyCampaign,
  ]
  for (const n of nested) {
    const id = pickId(n)
    if (id) return String(id)
  }

  const norm = normalizeSurvey(raw)
  return norm?.id ? String(norm.id) : null
}

export function normalizeSurvey(raw) {
  const data = unwrap(raw)
  if (!data || typeof data !== 'object') return null
  const id = pickId(data)
  if (id) {
    return { ...data, id: String(id) }
  }
  return null
}

export function normalizeMemberList(raw) {
  return normalizeSurveyList(raw)
}

export function surveyTitle(s) {
  return s?.displayName || s?.title || s?.surveyType || 'Survey'
}

export function surveyStatusColor(status) {
  const map = {
    DRAFT: 'gray',
    ACTIVE: 'green',
    CLOSED: 'red',
    PUBLISHED: 'green',
  }
  return map[status] || 'yellow'
}
