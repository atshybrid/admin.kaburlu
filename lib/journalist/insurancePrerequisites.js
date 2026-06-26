/**
 * Insurance prerequisites — member must complete before form / admin can assign policy.
 */

import { docEffectiveStatus } from './idCardFlow'
import { isInsuranceActive } from './insuranceFlow'
import { membershipStatusKey } from './memberDisplay'

export function insuranceDocsApproved(member) {
  const aadhaar = docEffectiveStatus(member?.documents?.aadhaar)
  const pan = docEffectiveStatus(member?.documents?.pan)
  return aadhaar === 'APPROVED' && pan === 'APPROVED'
}

export function insuranceDocsDetail(member) {
  const aadhaar = docEffectiveStatus(member?.documents?.aadhaar)
  const pan = docEffectiveStatus(member?.documents?.pan)
  return { aadhaar, pan }
}

function surveyCompleteForAccidental(member, accidentalLane) {
  if (member?.survey?.overallStatus === 'COMPLETED') return true
  const status = accidentalLane?.status || member?.insurance?.accidental?.status
  if (status && status !== 'LOCKED_SURVEY_REQUIRED') return true
  if (member?.insurance?.accidental?.unlocked === true) return true
  return false
}

/**
 * @param {object} member — union member row / detail
 * @param {'ACCIDENTAL'|'HEALTH'} type
 * @param {string|null} applicationStatus — DRAFT | SUBMITTED | APPROVED | REJECTED
 */
export function buildInsurancePrerequisites(member, type = 'ACCIDENTAL', applicationStatus = null) {
  const accLane = member?.insurance?.accidental
  const healthLane = member?.insurance?.health
  const lane = type === 'HEALTH' ? healthLane : accLane
  const appStatus = applicationStatus ? String(applicationStatus).toUpperCase() : null

  const membershipOk = membershipStatusKey(member) === 'approved'
  const docsOk = insuranceDocsApproved(member)
  const docsDetail = insuranceDocsDetail(member)

  const steps = [
    {
      id: 'membership',
      label: 'Membership approved',
      ok: membershipOk,
      hint: membershipOk ? null : 'Approve membership in the review panel above.',
    },
    {
      id: 'insurance_docs',
      label: 'Aadhaar & PAN uploaded and approved',
      ok: docsOk,
      hint: docsOk
        ? null
        : `Aadhaar: ${docsDetail.aadhaar} · PAN: ${docsDetail.pan} — upload & approve in KYC section.`,
    },
  ]

  if (type === 'ACCIDENTAL') {
    const surveyOk = surveyCompleteForAccidental(member, accLane)
    steps.push({
      id: 'survey_unlock',
      label: 'Party survey complete (or admin unlock accidental)',
      ok: surveyOk,
      hint: surveyOk ? null : 'Member completes surveys in app, or use Unlock accidental below.',
    })
  } else {
    const accActive = isInsuranceActive(accLane)
    steps.push({
      id: 'accidental_active',
      label: 'Accidental insurance policy active',
      ok: accActive,
      hint: accActive ? null : 'Assign and activate accidental policy first.',
    })
  }

  const baseMet = steps.every((s) => s.ok)

  const applicationSubmitted = ['SUBMITTED', 'APPROVED', 'REJECTED'].includes(appStatus)
  const applicationApproved = appStatus === 'APPROVED'
  const policyActive = isInsuranceActive(lane)

  steps.push({
    id: 'member_form',
    label: 'Member submitted insurance application form',
    ok: applicationSubmitted,
    hint: applicationSubmitted
      ? null
      : baseMet
        ? 'Waiting for member to fill & submit form in union app.'
        : 'Complete steps above first — then member can submit from app.',
    adminOnly: false,
  })

  steps.push({
    id: 'admin_review',
    label: 'Admin approved application form',
    ok: applicationApproved,
    hint: applicationApproved
      ? null
      : appStatus === 'SUBMITTED'
        ? 'Review and approve the application below.'
        : appStatus === 'REJECTED'
          ? 'Application was rejected — member must resubmit.'
          : 'Approve member form after submission.',
    adminOnly: true,
  })

  steps.push({
    id: 'policy_assigned',
    label: `${type === 'HEALTH' ? 'Health' : 'Accidental'} policy assigned`,
    ok: policyActive,
    hint: policyActive ? null : 'Assign policy after application is approved.',
    adminOnly: true,
  })

  const hasCard = Boolean(
    lane?.policy?.insuranceCardUrl ||
      lane?.policy?.cardUrl ||
      lane?.insuranceCardUrl
  )
  if (policyActive) {
    steps.push({
      id: 'insurance_card',
      label: 'Insurance card uploaded',
      ok: hasCard,
      hint: hasCard ? null : 'Upload insurance card PDF/image below.',
      adminOnly: true,
    })
  }

  return {
    type,
    baseMet,
    applicationSubmitted,
    applicationApproved,
    policyActive,
    canShowApplicationReview: baseMet || applicationSubmitted,
    canAssignPolicy:
      baseMet &&
      applicationApproved &&
      lane?.status === 'UNLOCKED_CAN_APPLY' &&
      !policyActive,
    steps,
  }
}
