/**
 * Document approve/reject — routes to verification vs insurance-documents endpoints.
 */
import { unionAdminApi } from '../api/services/unionAdminApi'
import { journalistApi } from '../api/services/journalistApi'
import { formatJournalistApiError, isKnownMemberDetailBug } from './memberErrors'

export const VERIFICATION_DOC_KEYS = ['photo', 'workingIdCard']
export const INSURANCE_DOC_KEYS = ['aadhaar', 'pan']

function splitDocActions(keys, action) {
  const verification = {}
  const insurance = {}
  keys.forEach((key) => {
    if (VERIFICATION_DOC_KEYS.includes(key)) verification[key] = action
    else if (INSURANCE_DOC_KEYS.includes(key)) insurance[key] = action
  })
  return { verification, insurance }
}

async function patchDocumentsUnionAdmin(profileId, keys, action) {
  const { verification, insurance } = splitDocActions(keys, action)
  let lastRes = null
  if (Object.keys(verification).length) {
    lastRes = await unionAdminApi.patchVerification(profileId, verification)
  }
  if (Object.keys(insurance).length) {
    lastRes = await unionAdminApi.patchInsuranceDocuments(profileId, insurance)
  }
  return lastRes || { message: `Documents ${action}d` }
}

async function patchDocumentsLegacy(profileId, keys, action) {
  const body = Object.fromEntries(keys.map((k) => [k, action]))
  return journalistApi.updateMemberDocuments(profileId, body)
}

/** Approve or reject one or more documents (union-admin first, legacy fallback). */
export async function patchMemberDocuments(profileId, keys, action) {
  if (!profileId || !keys?.length) return null
  try {
    return await patchDocumentsUnionAdmin(profileId, keys, action)
  } catch (err) {
    if (err?.status === 404) {
      return patchDocumentsLegacy(profileId, keys, action)
    }
    throw err
  }
}

export async function approveMembership(profileId, body) {
  try {
    return await unionAdminApi.patchMembership(profileId, body)
  } catch (err) {
    if (err?.status === 404) {
      return journalistApi.approveMembership(profileId, body)
    }
    throw err
  }
}

export async function fetchUnionMember(profileId, listFallback = null) {
  let lastErr = null

  try {
    return await unionAdminApi.getMember(profileId)
  } catch (err) {
    lastErr = err
    if (isKnownMemberDetailBug(err)) {
      // Legacy endpoint hits the same Prisma bug — skip extra round trip.
    } else if (err?.status === 404 || err?.status === 500) {
      try {
        return await journalistApi.getMember(profileId)
      } catch (err2) {
        lastErr = err2
      }
    } else {
      throw err
    }
  }

  if (listFallback && typeof listFallback === 'object') {
    return { ...listFallback, _fromListFallback: true }
  }
  throw lastErr || new Error('Member not found')
}

export async function patchMemberProfile(profileId, body) {
  try {
    return await unionAdminApi.patchProfile(profileId, body)
  } catch (err) {
    if (err?.status === 404) {
      throw new Error('Profile update API not available on this server version')
    }
    throw err
  }
}

export async function generateUnionIdCard(profileId) {
  try {
    return await unionAdminApi.generateIdCard(profileId)
  } catch (err) {
    if (err?.status === 404) {
      return journalistApi.generatePressCard({ profileId })
    }
    throw err
  }
}

export async function regenerateUnionIdCard(profileId) {
  try {
    return await unionAdminApi.regenerateIdCard(profileId)
  } catch (err) {
    if (err?.status === 404) {
      return journalistApi.regenerateMemberPdf(profileId)
    }
    throw err
  }
}

export function formatDocActionError(err, fallback) {
  return formatJournalistApiError(err, fallback)
}
