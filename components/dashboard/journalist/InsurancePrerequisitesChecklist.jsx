/**
 * Prerequisites checklist — shown before insurance application review / policy assign.
 */

import { buildInsurancePrerequisites } from '../../../lib/journalist/insurancePrerequisites'

function StepIcon({ ok }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
        ok ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
      }`}
      aria-hidden
    >
      {ok ? '✓' : '·'}
    </span>
  )
}

export default function InsurancePrerequisitesChecklist({ member, type, applicationStatus }) {
  const prereq = buildInsurancePrerequisites(member, type, applicationStatus)

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Before {type === 'HEALTH' ? 'health' : 'accidental'} insurance
      </p>
      <ol className="space-y-2">
        {prereq.steps.map((step) => (
          <li key={step.id} className="flex items-start gap-2.5">
            <StepIcon ok={step.ok} />
            <div className="min-w-0">
              <p className={`text-sm leading-snug ${step.ok ? 'text-slate-800' : 'text-slate-700'}`}>
                {step.label}
              </p>
              {!step.ok && step.hint ? (
                <p className="text-xs text-slate-500 mt-0.5">{step.hint}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {!prereq.baseMet ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5 mt-1">
          Member cannot submit insurance form until membership, Aadhaar/PAN
          {type === 'HEALTH' ? ', and active accidental policy' : ', and survey/unlock'} are complete.
        </p>
      ) : null}
    </div>
  )
}
