/** Display helpers for insurance application review UI */

export const APPLICATION_STATUS_META = {
  DRAFT: { label: 'Draft', color: 'gray' },
  SUBMITTED: { label: 'Awaiting review', color: 'yellow' },
  APPROVED: { label: 'Approved', color: 'green' },
  REJECTED: { label: 'Rejected', color: 'red' },
}

export const NOMINEE_RELATION_LABELS = {
  SPOUSE: 'Spouse',
  SON: 'Son',
  DAUGHTER: 'Daughter',
  FATHER: 'Father',
  MOTHER: 'Mother',
  BROTHER: 'Brother',
  SISTER: 'Sister',
  OTHER: 'Other',
}

export const HEALTH_CONDITION_LABELS = {
  NONE: 'None',
  DIABETES: 'Diabetes',
  HYPERTENSION: 'Hypertension',
  HEART_DISEASE: 'Heart disease',
  ASTHMA: 'Asthma',
  TB: 'Tuberculosis',
  CANCER: 'Cancer',
  KIDNEY_DISEASE: 'Kidney disease',
  LIVER_DISEASE: 'Liver disease',
  HIV_AIDS: 'HIV/AIDS',
  DISABILITY: 'Disability',
  OTHER: 'Other',
}

export function applicationStatusMeta(status) {
  const key = String(status || '').toUpperCase()
  return APPLICATION_STATUS_META[key] || { label: status || '—', color: 'gray' }
}

export function unwrapInsuranceApplication(raw) {
  if (!raw) return null
  const data = raw.application || raw.data?.application || raw.data || raw
  if (!data || typeof data !== 'object') return null
  if (Array.isArray(data)) return null
  return {
    ...data,
    type: data.type || data.policyType,
    status: data.status || data.applicationStatus,
  }
}

/** GET .../insurance-application full envelope */
export function normalizeInsuranceApplicationDetail(raw) {
  if (!raw) {
    return { application: null, member: null, activeInsurances: [], documents: null }
  }
  const envelope = raw.data && typeof raw.data === 'object' && !raw.application ? raw.data : raw
  const application = unwrapInsuranceApplication(envelope.application || envelope)
  const member = envelope.member || envelope.profile || null
  return {
    application,
    member,
    documents: envelope.documents || member?.documents || null,
    activeInsurances:
      envelope.activeInsurances ||
      envelope.insurances ||
      member?.allInsurances ||
      [],
    insurance: envelope.insurance || member?.insurance || null,
  }
}

export function formatAddress(addr) {
  if (!addr || typeof addr !== 'object') return '—'
  const parts = [addr.line1, addr.line2, addr.city, addr.district, addr.state, addr.pincode].filter(Boolean)
  return parts.join(', ') || '—'
}

export function formatQuestionnaire(q) {
  if (!q || typeof q !== 'object') return []
  return Object.entries(q).map(([key, val]) => {
    const answer = val?.answer || val
    const details = val?.details
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (c) => c.toUpperCase())
      .trim()
    return { key, label, answer: String(answer || '—').toUpperCase(), details }
  })
}

export function calcAgeFromDob(dob) {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1
  return age
}
