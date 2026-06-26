/**
 * Member insurance — application review → policy assign → card upload
 */

import { useState, useEffect, useRef } from 'react'
import { journalistApi } from '../../../lib/api/services/journalistApi'
import { unionAdminApi } from '../../../lib/api/services/unionAdminApi'
import { formatJournalistApiError } from '../../../lib/journalist/memberErrors'
import {
  canUnlockAccidental,
  canUnlockHealth,
  EMPTY_ASSIGN_FORM,
  insuranceNextStepHint,
  insuranceStatusMeta,
  isInsuranceActive,
  resolvePolicy,
} from '../../../lib/journalist/insuranceFlow'
import { formatDate } from '../../../lib/journalist/memberDisplay'
import { buildInsurancePrerequisites } from '../../../lib/journalist/insurancePrerequisites'
import InsuranceApplicationPanel from './InsuranceApplicationPanel'
import InsurancePrerequisitesChecklist from './InsurancePrerequisitesChecklist'
import { Button, Card, FormField, Input, StatusBadge, toast } from '../../ui'

function PolicyDetails({ policy }) {
  if (!policy?.policyNumber) return <p className="text-sm text-slate-500">No policy on file.</p>
  return (
    <div className="text-sm text-slate-700 space-y-1 mt-2 rounded-lg bg-emerald-50 border border-emerald-100 p-3">
      <p><span className="font-medium">Policy:</span> {policy.policyNumber}</p>
      {policy.insurer ? <p><span className="font-medium">Insurer:</span> {policy.insurer}</p> : null}
      {policy.coverAmount != null ? (
        <p><span className="font-medium">Cover:</span> ₹{Number(policy.coverAmount).toLocaleString('en-IN')}</p>
      ) : null}
      {policy.validFrom || policy.validTo ? (
        <p><span className="font-medium">Valid:</span> {formatDate(policy.validFrom)} — {formatDate(policy.validTo)}</p>
      ) : null}
    </div>
  )
}

function AssignPolicyForm({ type, profileId, onSuccess, applicationApproved, prerequisitesMet }) {
  const [form, setForm] = useState({ ...EMPTY_ASSIGN_FORM })
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!profileId) return
    if (!form.policyNumber.trim() || !form.insurer.trim()) {
      toast.error('Policy number and insurer are required')
      return
    }
    if (!applicationApproved && !form.skipApplicationCheck) {
      toast.error('Approve the insurance application form first')
      return
    }
    if (!prerequisitesMet && !form.skipApplicationCheck) {
      toast.error('Complete all prerequisite steps above first')
      return
    }
    setSaving(true)
    try {
      const res = await unionAdminApi.assignInsurance(profileId, {
        type,
        policyNumber: form.policyNumber.trim(),
        insurer: form.insurer.trim(),
        coverAmount: form.coverAmount ? Number(form.coverAmount) : undefined,
        premium: form.premium ? Number(form.premium) : undefined,
        validFrom: form.validFrom || undefined,
        validTo: form.validTo || undefined,
        notes: form.notes.trim() || undefined,
        skipApplicationCheck: Boolean(form.skipApplicationCheck),
      })
      toast.success(res?.message || `${type} policy assigned`)
      setForm({ ...EMPTY_ASSIGN_FORM })
      onSuccess?.()
    } catch (err) {
      toast.error(formatJournalistApiError(err, 'Assign failed'))
    } finally {
      setSaving(false)
    }
  }

  const canAssign = (applicationApproved && prerequisitesMet) || form.skipApplicationCheck

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-600">
        Assign {type === 'ACCIDENTAL' ? 'accidental' : 'health'} policy
      </p>
      {!applicationApproved ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">
          Approve the member&apos;s insurance application first, or use admin override below.
        </p>
      ) : !prerequisitesMet ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">
          Complete prerequisite steps above (membership, docs, survey/unlock).
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Policy number *">
          <Input value={form.policyNumber} onChange={(e) => setForm((f) => ({ ...f, policyNumber: e.target.value }))} />
        </FormField>
        <FormField label="Insurer *">
          <Input value={form.insurer} onChange={(e) => setForm((f) => ({ ...f, insurer: e.target.value }))} />
        </FormField>
        <FormField label="Cover (₹)">
          <Input type="number" value={form.coverAmount} onChange={(e) => setForm((f) => ({ ...f, coverAmount: e.target.value }))} />
        </FormField>
        <FormField label="Premium (₹)">
          <Input type="number" value={form.premium} onChange={(e) => setForm((f) => ({ ...f, premium: e.target.value }))} />
        </FormField>
        <FormField label="Valid from">
          <Input type="date" value={form.validFrom} onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))} />
        </FormField>
        <FormField label="Valid to">
          <Input type="date" value={form.validTo} onChange={(e) => setForm((f) => ({ ...f, validTo: e.target.value }))} />
        </FormField>
      </div>
      <FormField label="Notes">
        <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
      </FormField>
      <label className="flex items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={form.skipApplicationCheck}
          onChange={(e) => setForm((f) => ({ ...f, skipApplicationCheck: e.target.checked }))}
          className="rounded border-slate-300"
        />
        Admin override (skip application check)
      </label>
      <Button type="submit" size="sm" loading={saving} disabled={!canAssign}>
        Assign policy
      </Button>
    </form>
  )
}

function InsuranceLane({
  title,
  type,
  lane,
  otherLane,
  member,
  allInsurances,
  profileId,
  onRefresh,
  loadApplications = false,
}) {
  const [benefitsSaving, setBenefitsSaving] = useState(false)
  const [appStatus, setAppStatus] = useState(null)
  const [uploadingCard, setUploadingCard] = useState(false)

  const prereq = buildInsurancePrerequisites(member, type, appStatus)
  const meta = insuranceStatusMeta(lane?.status)
  const policy = resolvePolicy(lane, allInsurances, type)
  const hint = insuranceNextStepHint(lane?.nextStep)
  const appApproved = appStatus === 'APPROVED'
  const showAssignForm = lane?.status === 'UNLOCKED_CAN_APPLY' && !isInsuranceActive(lane)

  const unlockAccidental = async () => {
    setBenefitsSaving(true)
    try {
      await journalistApi.updateBenefits(profileId, { accidentalUnlocked: true })
      toast.success('Accidental benefits unlocked')
      onRefresh?.()
    } catch (err) {
      toast.error(formatJournalistApiError(err, 'Unlock failed'))
    } finally {
      setBenefitsSaving(false)
    }
  }

  const unlockHealth = async () => {
    setBenefitsSaving(true)
    try {
      await journalistApi.updateBenefits(profileId, { healthUnlocked: true })
      toast.success('Health benefits unlocked')
      onRefresh?.()
    } catch (err) {
      toast.error(formatJournalistApiError(err, 'Unlock failed'))
    } finally {
      setBenefitsSaving(false)
    }
  }

  const uploadCard = async (insuranceId, file) => {
    if (!file || !profileId || !insuranceId) return
    setUploadingCard(true)
    try {
      const fd = new FormData()
      fd.append('insuranceCard', file)
      await unionAdminApi.uploadInsuranceCard(profileId, insuranceId, fd)
      toast.success('Insurance card uploaded')
      onRefresh?.()
    } catch (err) {
      toast.error(formatJournalistApiError(err, 'Upload failed'))
    } finally {
      setUploadingCard(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-semibold text-slate-900">{title}</h4>
        <StatusBadge label={meta.label} color={meta.color} />
      </div>

      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}

      <InsurancePrerequisitesChecklist
        member={member}
        type={type}
        applicationStatus={appStatus}
      />

      <InsuranceApplicationPanel
        profileId={profileId}
        type={type}
        enabled={loadApplications && prereq.canShowApplicationReview}
        onStatusChange={setAppStatus}
      />

      {loadApplications && !prereq.canShowApplicationReview ? (
        <p className="text-xs text-slate-500 py-2">
          Application review opens once membership and insurance documents are approved.
        </p>
      ) : null}

      {isInsuranceActive(lane) ? <PolicyDetails policy={policy} /> : null}

      <div className="flex flex-wrap gap-2">
        {type === 'ACCIDENTAL' && canUnlockAccidental(lane) ? (
          <Button size="sm" variant="secondary" loading={benefitsSaving} onClick={unlockAccidental}>
            Unlock accidental
          </Button>
        ) : null}
        {type === 'HEALTH' && canUnlockHealth(lane, otherLane) ? (
          <Button size="sm" variant="secondary" loading={benefitsSaving} onClick={unlockHealth}>
            Unlock health
          </Button>
        ) : null}
      </div>

      {showAssignForm ? (
        <AssignPolicyForm
          type={type}
          profileId={profileId}
          applicationApproved={appApproved}
          prerequisitesMet={prereq.baseMet}
          onSuccess={onRefresh}
        />
      ) : null}

      {policy?.id && isInsuranceActive(lane) ? (
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <span className="font-medium">Upload insurance card</span>
          <input
            type="file"
            accept="image/*,.pdf"
            disabled={uploadingCard}
            className="text-xs"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) uploadCard(policy.id, file)
              e.target.value = ''
            }}
          />
        </label>
      ) : null}
    </div>
  )
}

export default function MemberInsuranceSection({ profileId, member, onRefresh, forceLoadApplications = false }) {
  const acc = member?.insurance?.accidental
  const health = member?.insurance?.health
  const allInsurances = member?.allInsurances || []
  const sectionRef = useRef(null)
  const [loadApplications, setLoadApplications] = useState(forceLoadApplications)

  useEffect(() => {
    if (forceLoadApplications) setLoadApplications(true)
  }, [forceLoadApplications])

  useEffect(() => {
    const el = sectionRef.current
    if (!el || loadApplications) return undefined
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setLoadApplications(true)
      },
      { rootMargin: '120px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadApplications])

  return (
    <div id="member-insurance" ref={sectionRef}>
      <Card title="Insurance">
        <p className="text-xs text-slate-500 mb-4">
          Flow: membership + Aadhaar/PAN approved → survey/unlock → member fills form (personal, nominee,
          questionnaire) → you approve form → assign policy → upload card.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <InsuranceLane
            title="Accidental"
            type="ACCIDENTAL"
            lane={acc}
            otherLane={health}
            member={member}
            allInsurances={allInsurances}
            profileId={profileId}
            onRefresh={onRefresh}
            loadApplications={loadApplications}
          />
          <InsuranceLane
            title="Health"
            type="HEALTH"
            lane={health}
            otherLane={acc}
            member={member}
            allInsurances={allInsurances}
            profileId={profileId}
            onRefresh={onRefresh}
            loadApplications={loadApplications}
          />
        </div>
      </Card>
    </div>
  )
}
