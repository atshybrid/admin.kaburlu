/** User-facing API error text for journalist union admin. */

function errorMessage(err) {
  const data = err?.data || {}
  return data.message || data.error || err?.message || ''
}

/** Backend still selects User.mobile instead of mobileNumber on member detail routes. */
export function isKnownMemberDetailBug(err) {
  const msg = String(errorMessage(err))
  return msg.includes('Unknown field') && msg.includes('mobile')
}

/** Skip noisy toasts for expected missing/broken member-detail responses. */
export function shouldSilenceMemberLoadError(err) {
  const status = err?.status
  if (status === 404 || status === 500) return true
  return isKnownMemberDetailBug(err)
}

export function formatJournalistApiError(err, fallback = 'Request failed') {
  const status = err?.status
  const data = err?.data || {}
  const code = data.code || data.errorCode
  const msg = errorMessage(err) || fallback

  if (status === 404) {
    return code
      ? `${msg} (${code})`
      : `${msg} — endpoint may not be deployed yet (HTTP 404).`
  }
  if (status === 403) {
    if (code === 'UNION_MEMBER_ADMIN_REQUIRED') {
      return 'Access denied — Union Moderator or Super Admin role required.'
    }
    return 'Access denied — you do not have permission for this action.'
  }
  if (code === 'INSURANCE_APPLICATION_REQUIRED') {
    return 'Approve the member insurance application before assigning a policy.'
  }
  if (code === 'INSURANCE_DOCS_REQUIRED') {
    return 'Aadhaar and PAN must be uploaded and approved first.'
  }
  if (code === 'APPLICATION_ALREADY_SUBMITTED') {
    return 'Application is already pending review.'
  }
  if (code === 'ACCIDENTAL_NOT_UNLOCKED') {
    return 'Accidental insurance locked — member must complete party surveys first.'
  }
  if (code === 'HEALTH_REQUIRES_ACCIDENTAL') {
    return 'Health insurance requires an active accidental policy first.'
  }
  if (code === 'INSURANCE_ALREADY_ACTIVE') {
    return 'Member already has an active policy for this type.'
  }
  if (code === 'VALIDATION_ERROR') {
    return msg || 'Application form has missing or invalid fields.'
  }
  if (status === 401) {
    return 'Session expired — please log in again.'
  }
  if (isKnownMemberDetailBug(err)) {
    return 'Full profile could not load from server. You can still edit and save using the form below.'
  }
  if (status === 500) {
    if (String(msg).includes('Prisma') || String(msg).length > 200) {
      return 'Server error — try again or use Edit profile to save changes. If this persists, contact backend team.'
    }
  }
  if (
    String(msg).includes('Unknown field') ||
    String(msg).includes('Prisma') ||
    String(msg).length > 220
  ) {
    return fallback
  }
  return code ? `${msg} (${code})` : msg
}
