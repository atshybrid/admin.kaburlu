/**
 * Survey campaign detail — publish, assign, review queue, report, close
 */

import { useState, useEffect, useCallback } from 'react'
import { unionSurveysApi } from '../../../lib/api/services/unionSurveysApi'
import {
  extractSurveyId,
  normalizeMemberList,
  normalizeSurvey,
  surveyTitle,
} from '../../../lib/unionSurveys/normalize'
import { memberName } from '../../../lib/journalist/memberDisplay'
import SubmissionReviewPanel from './SubmissionReviewPanel'
import {
  Button,
  Card,
  CardRow,
  FormField,
  Input,
  SlidePanel,
  Spinner,
  StatusBadge,
  toast,
} from '../../ui'
import { ApiError } from '../../../lib/api/client'

function formatErr(err, fb) {
  if (err instanceof ApiError) return err.data?.code ? `${err.message} (${err.data.code})` : err.message
  return err?.message || fb
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'assign', label: 'Assign' },
  { id: 'review', label: 'Review queue' },
  { id: 'report', label: 'Area report' },
]

export default function SurveyDetailPanel({ surveyId, onUpdated }) {
  const [survey, setSurvey] = useState(null)
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [pending, setPending] = useState([])
  const [pendingLoading, setPendingLoading] = useState(false)
  const [reviewProgressId, setReviewProgressId] = useState(null)
  const [reviewOpen, setReviewOpen] = useState(false)

  const [assignForm, setAssignForm] = useState({
    allMembers: true,
    approvedOnly: true,
    districts: '',
    mandals: '',
    profileIds: '',
  })

  const [reportParams, setReportParams] = useState({ state: 'Telangana', district: '' })
  const [report, setReport] = useState(null)

  const loadSurvey = useCallback(async () => {
    if (!surveyId) return
    setLoading(true)
    try {
      const raw = await unionSurveysApi.get(surveyId)
      setSurvey(normalizeSurvey(raw))
    } catch (err) {
      toast.error(formatErr(err, 'Failed to load survey'))
      setSurvey(null)
    } finally {
      setLoading(false)
    }
  }, [surveyId])

  const loadPending = useCallback(async () => {
    if (!surveyId) return
    setPendingLoading(true)
    try {
      const raw = await unionSurveysApi.listMembers(surveyId, { reviewStatus: 'PENDING' })
      setPending(normalizeMemberList(raw).items)
    } catch (err) {
      toast.error(formatErr(err, 'Failed to load queue'))
      setPending([])
    } finally {
      setPendingLoading(false)
    }
  }, [surveyId])

  useEffect(() => {
    loadSurvey()
  }, [loadSurvey])

  useEffect(() => {
    if (tab === 'review') loadPending()
  }, [tab, loadPending])

  const refresh = () => {
    loadSurvey()
    onUpdated?.()
    if (tab === 'review') loadPending()
  }

  const campaignId = () => extractSurveyId(survey) || surveyId

  const publish = async () => {
    const id = campaignId()
    if (!id) {
      toast.error('Survey id missing — close panel and open again from list')
      return
    }
    setActionLoading(true)
    try {
      await unionSurveysApi.publish(id)
      toast.success('Survey published (ACTIVE)')
      refresh()
    } catch (err) {
      toast.error(formatErr(err, 'Publish failed'))
    } finally {
      setActionLoading(false)
    }
  }

  const closeSurvey = async () => {
    if (!window.confirm('Close this survey? Members cannot submit new answers.')) return
    setActionLoading(true)
    try {
      await unionSurveysApi.close(surveyId)
      toast.success('Survey closed')
      refresh()
    } catch (err) {
      toast.error(formatErr(err, 'Close failed'))
    } finally {
      setActionLoading(false)
    }
  }

  const assign = async () => {
    setActionLoading(true)
    try {
      const body = {}
      if (assignForm.profileIds.trim()) {
        body.profileIds = assignForm.profileIds.split(/[\s,]+/).filter(Boolean)
      } else {
        body.allMembers = assignForm.allMembers
        body.approvedOnly = assignForm.approvedOnly
        if (assignForm.districts.trim()) {
          body.districts = assignForm.districts.split(',').map((s) => s.trim()).filter(Boolean)
        }
        if (assignForm.mandals.trim()) {
          body.mandals = assignForm.mandals.split(',').map((s) => s.trim()).filter(Boolean)
        }
      }
      const res = await unionSurveysApi.assign(campaignId(), body)
      toast.success(res?.message || 'Members assigned')
      refresh()
    } catch (err) {
      toast.error(formatErr(err, 'Assign failed'))
    } finally {
      setActionLoading(false)
    }
  }

  const loadReport = async () => {
    setActionLoading(true)
    try {
      const params = {}
      if (reportParams.state.trim()) params.state = reportParams.state.trim()
      if (reportParams.district.trim()) params.district = reportParams.district.trim()
      const raw = await unionSurveysApi.areaReport(campaignId(), params)
      setReport(raw?.data ?? raw)
      toast.success('Report loaded')
    } catch (err) {
      toast.error(formatErr(err, 'Report failed'))
      setReport(null)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading && !survey) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (!survey) return <p className="text-sm text-gray-500">Survey not found.</p>

  const status = survey.campaignStatus || survey.status || 'DRAFT'

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={status} color={status === 'ACTIVE' ? 'green' : status === 'CLOSED' ? 'red' : 'gray'} />
        <StatusBadge label={survey.surveyType || 'GENERAL'} color="blue" />
        {survey.requiredForInsuranceType ? (
          <StatusBadge label={`Insurance: ${survey.requiredForInsuranceType}`} color="yellow" />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              tab === t.id ? 'bg-white shadow text-gray-900' : 'text-gray-600'
            }`}
          >
            {t.label}
            {t.id === 'review' && pending.length > 0 ? (
              <span className="ml-1 text-xs text-amber-600">({pending.length})</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <>
          <Card title={surveyTitle(survey)}>
            <CardRow label="Union" value={survey.unionName || '—'} />
            <CardRow label="State" value={survey.state || '—'} />
            <CardRow label="Review required" value={survey.requiresReview ? 'Yes' : 'No'} />
            <CardRow label="Questions" value={survey.questions?.length ?? '—'} />
            <CardRow
              label="Campaign ID"
              value={<span className="font-mono text-xs break-all">{campaignId() || '—'}</span>}
            />
          </Card>
          <div
            className="h-3 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${survey.primaryColor || '#333'}, ${survey.secondaryColor || '#fff'})`,
            }}
          />
          <div className="flex flex-wrap gap-2">
            {status === 'DRAFT' ? (
              <Button size="sm" loading={actionLoading} onClick={publish}>
                Publish → ACTIVE
              </Button>
            ) : null}
            {status === 'ACTIVE' ? (
              <Button size="sm" variant="danger" loading={actionLoading} onClick={closeSurvey}>
                Close survey
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={refresh}>
              Refresh
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Flow: DRAFT → Publish → Assign members → Members answer → Review (if required) → Area report
          </p>
        </>
      ) : null}

      {tab === 'assign' ? (
        <Card title="Assign members">
          <label className="flex items-center gap-2 text-sm mb-2">
            <input
              type="checkbox"
              checked={assignForm.allMembers}
              onChange={(e) => setAssignForm((f) => ({ ...f, allMembers: e.target.checked }))}
            />
            All members in union
          </label>
          <label className="flex items-center gap-2 text-sm mb-4">
            <input
              type="checkbox"
              checked={assignForm.approvedOnly}
              onChange={(e) => setAssignForm((f) => ({ ...f, approvedOnly: e.target.checked }))}
            />
            Approved membership only
          </label>
          <FormField label="Districts (comma-separated)">
            <Input
              value={assignForm.districts}
              onChange={(e) => setAssignForm((f) => ({ ...f, districts: e.target.value }))}
              placeholder="Warangal, Karimnagar"
            />
          </FormField>
          <FormField label="Mandals (comma-separated)">
            <Input
              value={assignForm.mandals}
              onChange={(e) => setAssignForm((f) => ({ ...f, mandals: e.target.value }))}
            />
          </FormField>
          <FormField label="Or specific profile IDs">
            <Input
              value={assignForm.profileIds}
              onChange={(e) => setAssignForm((f) => ({ ...f, profileIds: e.target.value }))}
              placeholder="clprof_abc, clprof_xyz"
            />
          </FormField>
          <Button size="sm" className="mt-3" loading={actionLoading} onClick={assign}>
            Run assign
          </Button>
        </Card>
      ) : null}

      {tab === 'review' ? (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Pending video / answer review</p>
            <Button size="sm" variant="ghost" onClick={loadPending} loading={pendingLoading}>
              Refresh
            </Button>
          </div>
          {pendingLoading ? (
            <Spinner />
          ) : pending.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center border border-dashed rounded-lg">
              No pending submissions.
            </p>
          ) : (
            <ul className="space-y-2">
              {pending.map((row) => {
                const pid = row.progressId || row.id
                return (
                  <li key={pid}>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewProgressId(pid)
                        setReviewOpen(true)
                      }}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-brand/40 bg-white"
                    >
                      <p className="font-medium text-gray-900">{memberName(row)}</p>
                      <p className="text-xs text-gray-500">{row.mobileNumber || row.district || pid}</p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}

      {tab === 'report' ? (
        <Card title="Area breakdown">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <FormField label="State">
              <Input
                value={reportParams.state}
                onChange={(e) => setReportParams((p) => ({ ...p, state: e.target.value }))}
              />
            </FormField>
            <FormField label="District">
              <Input
                value={reportParams.district}
                onChange={(e) => setReportParams((p) => ({ ...p, district: e.target.value }))}
              />
            </FormField>
          </div>
          <Button size="sm" loading={actionLoading} onClick={loadReport}>
            Load report
          </Button>
          {report ? (
            <pre className="mt-4 text-xs bg-gray-50 border rounded-lg p-3 overflow-auto max-h-64">
              {JSON.stringify(report, null, 2)}
            </pre>
          ) : null}
        </Card>
      ) : null}

      <SlidePanel
        isOpen={reviewOpen}
        onClose={() => {
          setReviewOpen(false)
          setReviewProgressId(null)
        }}
        title="Review submission"
        width="lg"
      >
        {reviewProgressId ? (
          <SubmissionReviewPanel
            surveyId={surveyId}
            progressId={reviewProgressId}
            onDone={() => {
              setReviewOpen(false)
              setReviewProgressId(null)
              loadPending()
              refresh()
            }}
          />
        ) : null}
      </SlidePanel>
    </div>
  )
}
