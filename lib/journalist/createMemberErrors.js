/** Map API error codes → user-facing messages for member create. */
const MESSAGES = {
  MISSING_REQUIRED_FIELDS: 'Mobile number and union name are required.',
  INVALID_MEMBER_TYPE: 'Invalid member type. Use TENANT_REPORTER or NON_TENANT_REPORTER.',
  TENANT_REPORTER_NOT_FOUND:
    'No platform reporter exists for this mobile. Register them as a newspaper reporter first, or use Non-tenant reporter (Super Admin only).',
  MISSING_NON_TENANT_FIELDS:
    'Fill name, newspaper, working area, designation, and publisher mobile for non-tenant members.',
  MISSING_PUBLISHER_MOBILE: 'Publisher mobile number is required for non-tenant reporters.',
  MISSING_DOCUMENT_UPLOADS: 'Upload photo, Aadhaar, PAN, and working ID card, or enable skip required uploads.',
  INVALID_MPIN: 'MPIN must be exactly 4 digits.',
  TENANT_ADMIN_SCOPE_DENIED: 'Tenant admins cannot create non-tenant reporters.',
  TENANT_MISMATCH: 'This reporter belongs to another newspaper (tenant).',
  UNION_MEMBER_ALREADY_EXISTS: 'This mobile already has a union membership.',
  NO_LANGUAGE_CONFIGURED: 'Server language config missing. Contact platform admin.',
  CREATE_FAILED: 'Could not create member. Try again or check server logs.',
}

export function messageForCreateMemberError(err) {
  const data = err?.data || {}
  const code = data.code || data.errorCode
  const raw = String(data.message || data.error || err?.message || '')
  if (/tenant reporter not found/i.test(raw)) {
    return MESSAGES.TENANT_REPORTER_NOT_FOUND
  }
  if (code && MESSAGES[code]) {
    if (code === 'MISSING_DOCUMENT_UPLOADS' && Array.isArray(data.missing)) {
      return `${MESSAGES[code]} Missing: ${data.missing.join(', ')}`
    }
    return MESSAGES[code]
  }
  return data.message || data.error || err?.message || 'Create member failed'
}

export function buildCreateMemberFormData(fields, files = {}) {
  const fd = new FormData()
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    fd.append(key, typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value))
  })
  ;['photo', 'aadhaar', 'pan', 'workingIdCard'].forEach((key) => {
    if (files[key]) fd.append(key, files[key])
  })
  return fd
}
