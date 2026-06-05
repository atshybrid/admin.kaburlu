/**
 * Member insurance wizard — accidental then health (Super Admin)
 * PATCH .../benefits · POST .../insurance
 */

import { useState } from 'react'
import { journalistApi } from '../../../lib/api/services/journalistApi'
import { formatJournalistApiError } from '../../../lib/journalist/memberErrors'
import {
  canAssignInsurance,
  canForceHealthUnlock,
  canUnlockAccidental,
  canUnlockHealth,
  EMPTY_ASSIGN_FORM,
  insuranceNextStepHint,
  insuranceStatusMeta,
  isInsuranceActive,
  resolvePolicy,
} from '../../../lib/journalist/insuranceFlow'
import { formatDate } from '../../../lib/journalist/memberDisplay'
import { Button, Card, CardRow, FormField, Input, StatusBadge, toast } from '../../ui'

function PolicyDetails({ policy }) {
  if (!policy?.policyNumber) return <p className="text-sm text-gray-500">No policy on file.</p>
  return (
    <div className="text-sm text-gray-700 space-y-1 mt-2 rounded-lg bg-green-50 border border-green-100 p-3">
      <p>
        <span className="font-medium">Policy:</span> {policy.policyNumber}
      </p>
      {policy.insurer ? (
        <p>
          <span className="font-medium">Insurer:</span> {policy.insurer}
        </p>
      ) : null}
      {policy.coverAmount != null ? (
        <p>
          <span className="font-medium">Cover:</span> ₹{Number(policy.coverAmount).toLocaleString('en-IN')}
        </p>
      ) : null}
      {policy.validFrom || policy.validTo ? (
        <p>
          <span className="font-medium">Valid:</span> {formatDate(policy.validFrom)} — {formatDate(policy.validTo)}
        </p>
      ) : null}
    </div>
  )
}

function AssignPolicyForm({ type, profileId, onSuccess, skipUnlockDefault = false }) {
  const [form, setForm] = useState({ ...EMPTY_ASSIGN_FORM, skipUnlockCheck: skipUnlockDefault })
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!profileId) return
    if (!form.policyNumber.trim() || !form.insurer.trim()) {
      toast.error('Policy number and insurer are required')
      return
    }
    setSaving(true)
    try {
      const res = await journalistApi.assignMemberInsurance(profileId, {
        type,
        policyNumber: form.policyNumber.trim(),
        insurer: form.insurer.trim(),
        coverAmount: form.coverAmount ? Number(form.coverAmount) : undefined,
        premium: form.premium ? Number(form.premium) : undefined,
        validFrom: form.validFrom || undefined,
        validTo: form.validTo || undefined,
        notes: form.notes.trim() || undefined,
        skipUnlockCheck: Boolean(form.skipUnlockCheck),
      })
      toast.success(res?.message || `${type} insurance assigned`)
      setForm({ ...EMPTY_ASSIGN_FORM, skipUnlockCheck: skipUnlockDefault })
      onSuccess?.()
    } catch (err) {
      toast.error(formatJournalistApiError(err, 'Assign failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-lg border border-brand/20 bg-brand/5 p-3">
      <p className="text-xs font-semibold uppercase text-brand">Assign {type === 'ACCIDENTAL' ? 'accidental' : 'health'} policy</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Policy number *">
          <Input
            value={form.policyNumber}
            onChange={(e) => setForm((f) => ({ ...f, policyNumber: e.target.value }))}
            placeholder="LIC/ACC/2026/00421"
          />
        </FormField>
        <FormField label="Insurer *">
          <Input
            value={form.insurer}
            onChange={(e) => setForm((f) => ({ ...f, insurer: e.target.value }))}
            placeholder="LIC of India"
          />
        </FormField>
        <FormField label="Cover amount (₹)">
          <Input
            type="number"
            value={form.coverAmount}
            onChange={(e) => setForm((f) => ({ ...f, coverAmount: e.target.value }))}
          />
        </FormField>
        <FormField label="Premium (₹)">
          <Input
            type="number"
            value={form.premium}
            onChange={(e) => setForm((f) => ({ ...f, premium: e.target.value }))}
          />
        </FormField>
        <FormField label="Valid from">
          <Input
            type="date"
            value={form.validFrom}
            onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
          />
        </FormField>
        <FormField label="Valid to">
          <Input
            type="date"
            value={form.validTo}
            onChange={(e) => setForm((f) => ({ ...f, validTo: e.target.value }))}
          />
        </FormField>
      </div>
      <FormField label="Notes">
        <Input
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Annual policy"
        />
      </FormField>
      <label className="flex items-center gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={form.skipUnlockCheck}
          onChange={(e) => setForm((f) => ({ ...f, skipUnlockCheck: e.target.checked }))}
          className="rounded border-gray-300"
        />
        Super Admin override (skip unlock check)
      </label>
      <Button type="submit" size="sm" loading={saving}>
        Assign {type === 'ACCIDENTAL' ? 'accidental' : 'health'}
      </Button>
    </form>
  )
}

function InsuranceLane({
  title,
  type,
  lane,
  otherLane,
  survey,
  allInsurances,
  profileId,
  onRefresh,
}) {
  const [benefitsSaving, setBenefitsSaving] = useState(false)
  const meta = insuranceStatusMeta(lane?.status)
  const policy = resolvePolicy(lane, allInsurances, type)
  const hint = insuranceNextStepHint(lane?.nextStep)

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

  const forceHealth = async () => {
    setBenefitsSaving(true)
    try {
      await journalistApi.updateBenefits(profileId, {
        healthInsuranceActive: true,
        forceHealthUnlock: true,
      })
      toast.success('Health unlocked (forced)')
      onRefresh?.()
    } catch (err) {
      toast.error(formatJournalistApiError(err, 'Force unlock failed'))
    } finally {
      setBenefitsSaving(false)
    }
  }

  const showUnlockAccidental = type === 'ACCIDENTAL' && canUnlockAccidental(lane)
  const showUnlockHealth = type === 'HEALTH' && canUnlockHealth(lane, otherLane)
  const showForceHealth = type === 'HEALTH' && canForceHealthUnlock(lane, otherLane)
  const showAssign = canAssignInsurance(lane)

  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <StatusBadge label={meta.label} color={meta.color} />
      </div>

      {hint ? <p className="text-xs text-gray-500 mb-2">{hint}</p> : null}

      {survey?.overallStatus === 'NO_CAMPAIGNS' && type === 'ACCIDENTAL' && lane?.status === 'LOCKED_SURVEY_REQUIRED' ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5 mb-2">
          No party surveys configured — use admin unlock to enable accidental insurance.
        </p>
      ) : null}

      {isInsuranceActive(lane) ? <PolicyDetails policy={policy} /> : null}

      <div className="flex flex-wrap gap-2 mt-3">
        {showUnlockAccidental ? (
          <Button size="sm" variant="secondary" loading={benefitsSaving} onClick={unlockAccidental}>
            Unlock accidental (skip survey)
          </Button>
        ) : null}
        {showUnlockHealth ? (
          <Button size="sm" variant="secondary" loading={benefitsSaving} onClick={unlockHealth}>
            Unlock health (skip survey)
          </Button>
        ) : null}
        {showForceHealth ? (
          <Button size="sm" variant="ghost" loading={benefitsSaving} onClick={forceHealth}>
            Force health unlock
          </Button>
        ) : null}
      </div>

      {showAssign ? (
        <AssignPolicyForm type={type} profileId={profileId} onSuccess={onRefresh} />
      ) : null}

      {lane?.status === 'LOCKED_REQUIRES_ACCIDENTAL' && type === 'HEALTH' ? (
        <p className="text-xs text-gray-500 mt-2">
          Complete accidental assignment first, or use force unlock above.
        </p>
      ) : null}
    </div>
  )
}

export default function MemberInsuranceSection({ profileId, member, onRefresh }) {
  const acc = member?.insurance?.accidental
  const health = member?.insurance?.health
  const allInsurances = member?.allInsurances || []

  if (!member?.insurance && !allInsurances.length) {
    return (
      <Card title="Insurance">
        <p className="text-sm text-gray-500">No insurance data for this member.</p>
      </Card>
    )
  }

  return (
    <Card title="Insurance benefits">
      <p className="text-xs text-gray-500 mb-4">
        Flow: unlock accidental → assign accidental → unlock health → assign health.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsuranceLane
          title="1. Accidental insurance"
          type="ACCIDENTAL"
          lane={acc}
          otherLane={health}
          survey={member.survey}
          allInsurances={allInsurances}
          profileId={profileId}
          onRefresh={onRefresh}
        />
        <InsuranceLane
          title="2. Health insurance"
          type="HEALTH"
          lane={health}
          otherLane={acc}
          survey={member.survey}
          allInsurances={allInsurances}
          profileId={profileId}
          onRefresh={onRefresh}
        />
      </div>

      {allInsurances.length > 0 ? (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold uppercase text-gray-500 mb-2">All policies</p>
          <ul className="space-y-2 text-sm">
            {allInsurances.map((ins) => (
              <li
                key={ins.id || `${ins.type}-${ins.policyNumber}`}
                className="flex flex-wrap justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2"
              >
                <span className="font-medium">{ins.type}</span>
                <span className="text-gray-600">{ins.policyNumber}</span>
                <StatusBadge
                  label={ins.isActive ? 'Active' : 'Inactive'}
                  color={ins.isActive ? 'green' : 'gray'}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  )
}
