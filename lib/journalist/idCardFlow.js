/** ID card generation rules — DJFW Super Admin API */

const DOC_LABELS = {
  photo: 'Photo',
  aadhaar: 'Aadhaar',
  pan: 'PAN',
  workingIdCard: 'Working ID',
}

/** True status for UI — legacy rows may have url but status NOT_UPLOADED */
export function docEffectiveStatus(doc) {
  if (!doc) return 'NOT_UPLOADED'
  if (doc.status === 'APPROVED' || doc.status === 'REJECTED') return doc.status
  if (doc.url || doc.uploaded) {
    if (doc.status === 'PENDING') return 'PENDING'
    // Uploaded file exists but backend flag wrong — still needs admin review
    return 'PENDING'
  }
  return doc.status || 'NOT_UPLOADED'
}

export function isDocReviewable(doc) {
  const st = docEffectiveStatus(doc)
  return Boolean(doc?.url || doc?.uploaded) && st !== 'APPROVED' && st !== 'REJECTED'
}

export function requiredDocsForIdCard(memberType) {
  if (memberType === 'NON_TENANT_REPORTER') {
    return ['photo', 'aadhaar', 'pan', 'workingIdCard']
  }
  return ['photo', 'aadhaar', 'pan']
}

export function idCardReadiness(member) {
  const required = requiredDocsForIdCard(member?.memberType)
  const missing = []
  const pending = []
  const approved = []

  required.forEach((key) => {
    const d = member?.documents?.[key]
    const st = docEffectiveStatus(d)
    if (!d?.url && !d?.uploaded) {
      missing.push(key)
    } else if (st === 'APPROVED') {
      approved.push(key)
    } else {
      pending.push(key)
    }
  })

  return {
    required,
    missing,
    pending,
    approved,
    ready: missing.length === 0 && pending.length === 0,
  }
}

export function idCardBlockReason(member) {
  const { missing, pending, ready } = idCardReadiness(member)
  if (ready) return null
  const parts = []
  if (missing.length) {
    parts.push(`Upload: ${missing.map((k) => DOC_LABELS[k] || k).join(', ')}`)
  }
  if (pending.length) {
    parts.push(`Approve: ${pending.map((k) => DOC_LABELS[k] || k).join(', ')}`)
  }
  return parts.join(' · ')
}

export function parseApproveIdCardResult(res) {
  const idCard = res?.idCard
  if (!idCard) return { generated: false, message: 'No ID card in response' }
  if (idCard.skipped) {
    return {
      generated: false,
      skipped: true,
      message: 'ID card skipped — approve required KYC documents first, then generate card',
    }
  }
  const pdfUrl = idCard.pdfResult?.pdfUrl || idCard.card?.pdfUrl || res?.member?.card?.pdfUrl
  if (pdfUrl || idCard.pdfResult?.ok) {
    return {
      generated: true,
      pdfUrl,
      whatsappSent: idCard.whatsappSent,
      message: 'ID card generated' + (idCard.whatsappSent ? ' · WhatsApp sent' : ''),
    }
  }
  return {
    generated: false,
    message: 'Membership approved but PDF not ready — approve docs then use Generate ID card',
  }
}
