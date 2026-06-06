/**
 * Union surveys embedded in Journalist Union workflow
 */

import UnionSurveysView from '../unionSurveys/UnionSurveysView'

export default function UnionSurveysTab() {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-sm text-violet-900">
        <strong>Why surveys?</strong> Create party video surveys (ACCIDENTAL unlock) or general choice
        surveys. Publish → assign to approved members → review submissions. Approving a submission tied to
        insurance auto-unlocks that benefit lane.
      </div>
      <UnionSurveysView />
    </div>
  )
}
