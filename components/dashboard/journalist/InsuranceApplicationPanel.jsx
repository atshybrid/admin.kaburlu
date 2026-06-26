/**
 * Review member insurance application — approve/reject before policy assign
 */

import { useCallback, useEffect, useState } from 'react'
import { insuranceApplicationApi } from '../../../lib/api/services/insuranceApplicationApi'
import { formatJournalistApiError, shouldSilenceMemberLoadError } from '../../../lib/journalist/memberErrors'
import {
  applicationStatusMeta,
  calcAgeFromDob,
  formatAddress,
  formatQuestionnaire,
  HEALTH_CONDITION_LABELS,
  NOMINEE_RELATION_LABELS,
} from '../../../lib/journalist/insuranceApplicationDisplay'
import { formatDate } from '../../../lib/journalist/memberDisplay'
import { Button, FormField, Input, StatusBadge, toast } from '../../ui'

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-3 py-2 border-b border-slate-100 last:border-0">
      <dt className="text-xs font-medium text-slate-500 sm:w-36 shrink-0">{label}</dt>
      <dd className="text-sm text-slate-900">{value || '—'}</dd>
    </div>
  )
}

export default function InsuranceApplicationPanel({ profileId, type, onStatusChange, enabled = true }) {
  const [loading, setLoading] = useState(false)
  const [app, setApp] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    if (!enabled || !profileId || !type) return
    setLoading(true)
    try {
      const detail = await insuranceApplicationApi.getApplication(profileId, type)
      setApp(detail?.application || null)
    } catch (err) {
      if (!shouldSilenceMemberLoadError(err)) {
        toast.error(formatJournalistApiError(err, 'Failed to load application'))
      }
      setApp(null)
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }, [profileId, type, enabled])

  useEffect(() => {
    if (enabled) load()
  }, [load, enabled])

  useEffect(() => {
    onStatusChange?.(app?.status || null)
  }, [app?.status, onStatusChange])

  const handleReview = async (action) => {
    if (!profileId) return
    setSaving(true)
    try {
      await insuranceApplicationApi.review(profileId, {
        type,
        action,
        reviewNote: reviewNote.trim() || undefined,
      })
      toast.success(action === 'APPROVE' ? 'Application approved' : 'Application rejected')
      setReviewNote('')
      await load()
      onStatusChange?.(action === 'APPROVE' ? 'APPROVED' : 'REJECTED')
    } catch (err) {
      toast.error(formatJournalistApiError(err, 'Review failed'))
    } finally {
      setSaving(false)
    }
  }

  if (!enabled) {
    return <p className="text-xs text-slate-400 py-2">Insurance details load when you scroll here.</p>
  }

  if (loading && !loaded) {
    return <p className="text-sm text-slate-500 py-4">Loading application…</p>
  }

  if (!app) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
        <p className="text-sm text-slate-600">No {type === 'HEALTH' ? 'health' : 'accidental'} application on file.</p>
        <p className="text-xs text-slate-400 mt-1">
          Member fills the form in the union app (personal, nominee, questionnaire) after prerequisites above are met.
        </p>
      </div>
    )
  }

  const meta = applicationStatusMeta(app.status)
  const age = app.age ?? calcAgeFromDob(app.dob)
  const ageInvalid = age != null && (age < 18 || age > 65)
  const questions = formatQuestionnaire(app.questionnaire)
  const canReview = app.status === 'SUBMITTED'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-900">
          {type === 'HEALTH' ? 'Health' : 'Accidental'} application
        </h4>
        <StatusBadge label={meta.label} color={meta.color} />
      </div>

      {app.reviewNote ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Previous note: {app.reviewNote}
        </p>
      ) : null}

      <dl className="rounded-lg border border-slate-200 bg-white px-4 py-1">
        <DetailRow label="Full name" value={app.fullName} />
        <DetailRow label="DOB / Age" value={app.dob ? `${formatDate(app.dob)}${age != null ? ` (${age} yrs)` : ''}` : '—'} />
        {ageInvalid ? (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded px-2 py-1 mb-2">
            Age must be 18–65 years for insurance (current: {age}).
          </p>
        ) : null}
        <DetailRow label="Gender" value={app.gender} />
        <DetailRow label="Mobile" value={app.mobile} />
        <DetailRow label="Email" value={app.email} />
        <DetailRow label="Father" value={app.fatherName} />
        <DetailRow label="Press ID" value={app.pressId} />
        <DetailRow label="Address" value={formatAddress(app.address)} />
      </dl>

      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
        <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Nominee</p>
        <dl>
          <DetailRow label="Name" value={app.nomineeName} />
          <DetailRow label="Relation" value={NOMINEE_RELATION_LABELS[app.nomineeRelation] || app.nomineeRelation} />
          <DetailRow label="DOB" value={formatDate(app.nomineeDob)} />
          <DetailRow label="Mobile" value={app.nomineeMobile} />
          <DetailRow label="Share" value={app.nomineeSharePct != null ? `${app.nomineeSharePct}%` : '—'} />
        </dl>
      </div>

      {type === 'HEALTH' ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Health details</p>
          <DetailRow label="Height" value={app.heightCm ? `${app.heightCm} cm` : '—'} />
          <DetailRow label="Weight" value={app.weightKg ? `${app.weightKg} kg` : '—'} />
          <DetailRow
            label="Conditions"
            value={
              Array.isArray(app.healthConditions) && app.healthConditions.length
                ? app.healthConditions
                    .map((c) => {
                      const code = c.code || c
                      const label = HEALTH_CONDITION_LABELS[code] || code
                      return c.details ? `${label} (${c.details})` : label
                    })
                    .join(', ')
                : '—'
            }
          />
        </div>
      ) : null}

      {questions.length > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Medical questionnaire</p>
          <ul className="space-y-2">
            {questions.map((q) => (
              <li key={q.key} className="text-sm">
                <span className="text-slate-700">{q.label}:</span>{' '}
                <span className={q.answer === 'YES' ? 'font-medium text-rose-700' : 'text-slate-900'}>
                  {q.answer}
                </span>
                {q.details ? <span className="block text-xs text-slate-500 mt-0.5">{q.details}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {canReview ? (
        <div className="rounded-lg border border-brand/20 bg-brand/5 p-4 space-y-3">
          <FormField label="Review note (optional)">
            <Input
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Verified all details / reason for rejection…"
            />
          </FormField>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={saving} onClick={() => handleReview('APPROVE')}>
              Approve application
            </Button>
            <Button size="sm" variant="danger" loading={saving} onClick={() => handleReview('REJECT')}>
              Reject application
            </Button>
          </div>
        </div>
      ) : app.status === 'APPROVED' ? (
        <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          Application approved — you can assign the policy below.
        </p>
      ) : null}
    </div>
  )
}
