/** Super Admin insurance flow helpers (journalist union). */

export const INSURANCE_TYPES = ['ACCIDENTAL', 'HEALTH']

/** Human-readable status for UI badges */
export function insuranceStatusMeta(status) {
  const map = {
    LOCKED_SURVEY_REQUIRED: { label: 'Locked — survey', color: 'yellow' },
    UNLOCKED_CAN_APPLY: { label: 'Ready to assign', color: 'green' },
    ACTIVE: { label: 'Active', color: 'green' },
    LOCKED_REQUIRES_ACCIDENTAL: { label: 'Needs accidental', color: 'gray' },
  }
  return map[status] || { label: status || '—', color: 'gray' }
}

export function insuranceNextStepHint(nextStep) {
  const hints = {
    COMPLETE_PARTY_SURVEY: 'Member must complete party surveys, or use admin unlock below.',
    SUPER_ADMIN_ASSIGN_ACCIDENTAL_POLICY: 'Assign accidental policy using the form below.',
    ACTIVATE_ACCIDENTAL_FIRST: 'Assign and activate accidental insurance before health.',
    SUPER_ADMIN_ASSIGN_HEALTH_POLICY: 'Assign health policy using the form below.',
  }
  return hints[nextStep] || nextStep || null
}

export function isInsuranceActive(lane) {
  return lane?.status === 'ACTIVE' || lane?.active === true
}

export function canUnlockAccidental(lane) {
  return lane?.status === 'LOCKED_SURVEY_REQUIRED'
}

export function canUnlockHealth(lane, accidentalLane) {
  if (lane?.status !== 'LOCKED_SURVEY_REQUIRED') return false
  return isInsuranceActive(accidentalLane)
}

export function canForceHealthUnlock(healthLane, accidentalLane) {
  return (
    healthLane?.status === 'LOCKED_REQUIRES_ACCIDENTAL' && !isInsuranceActive(accidentalLane)
  )
}

export function canAssignInsurance(lane) {
  return lane?.status === 'UNLOCKED_CAN_APPLY'
}

/** Policy on lane or from allInsurances history */
export function resolvePolicy(lane, allInsurances, type) {
  if (lane?.policy?.policyNumber) return lane.policy
  const list = Array.isArray(allInsurances) ? allInsurances : []
  const active = list.find((i) => i.type === type && i.isActive)
  if (active) return active
  return list.find((i) => i.type === type) || null
}

export function defaultAssignType(accidental, health) {
  if (canAssignInsurance(accidental)) return 'ACCIDENTAL'
  if (canAssignInsurance(health)) return 'HEALTH'
  return 'ACCIDENTAL'
}

export const EMPTY_ASSIGN_FORM = {
  policyNumber: '',
  insurer: '',
  coverAmount: '',
  premium: '',
  validFrom: '',
  validTo: '',
  notes: '',
  skipUnlockCheck: false,
}
