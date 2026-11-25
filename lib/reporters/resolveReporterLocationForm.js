import locationsService from '../api/services/locations'

/** Backfill stateId from district/mandal when DB only stores leaf location (common for DISTRICT reporters). */
export async function resolveReporterLocationForm(data) {
  let stateId = data?.stateId || data?.state?.id || ''
  let districtId = data?.districtId || data?.district?.id || ''
  let mandalId = data?.mandalId || data?.mandal?.id || ''
  const assemblyConstituencyId = data?.assemblyConstituencyId || data?.assemblyConstituency?.id || ''

  if (districtId && !stateId) {
    try {
      const d = await locationsService.districts.getById(districtId)
      stateId = d?.stateId || d?.state?.id || stateId
    } catch {
      /* keep */
    }
  }

  if (mandalId && (!districtId || !stateId)) {
    try {
      const m = await locationsService.mandals.getById(mandalId)
      districtId = districtId || m?.districtId || m?.district?.id || ''
      if (districtId && !stateId) {
        const d = await locationsService.districts.getById(districtId)
        stateId = d?.stateId || d?.state?.id || stateId
      }
    } catch {
      /* keep */
    }
  }

  return { stateId, districtId, mandalId, assemblyConstituencyId }
}

export function reporterLocationSummary(detail) {
  if (!detail) return ''
  const parts = [
    detail.state?.name,
    detail.district?.name,
    detail.mandal?.name,
    detail.assemblyConstituency?.name,
  ].filter(Boolean)
  return parts.join(' · ')
}