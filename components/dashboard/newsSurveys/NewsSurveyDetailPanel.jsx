/**
 * Single survey detail + per-survey video submissions
 */

import { useState, useEffect, useCallback } from 'react'
import { newsSurveysApi } from '../../../lib/api/services/newsSurveysApi'
import {
  normalizeSurvey,
  normalizeSubmissionList,
  formatSurveyDate,
  surveyStatusColor,
} from '../../../lib/newsSurveys/normalize'
import PartyChip from '../politicalParties/PartyChip'
import { Button, Card, CardRow, Spinner, StatusBadge, toast } from '../../ui'
import { ApiError } from '../../../lib/api/client'

function formatErr(err, fb) {
  if (err instanceof ApiError) return err.data?.code ? `${err.message} (${err.data.code})` : err.message
  return err?.message || fb
}

function VideoThumb({ url, mobile }) {
  if (!url) return <span className="text-gray-400 text-xs">No video</span>
  return (
    <div className="space-y-2">
      <video
        src={url}
        controls
        preload="metadata"
        className="w-full max-w-sm rounded-lg border border-gray-200 bg-black max-h-48"
      />
      {mobile ? <p className="text-xs text-gray-500 font-mono">{mobile}</p> : null}
    </div>
  )
}

export default function NewsSurveyDetailPanel({ surveyId, onClose }) {
  const [survey, setSurvey] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [subsLoading, setSubsLoading] = useState(false)
  const [page, setPage] = useState(1)

  const loadSurvey = useCallback(async () => {
    if (!surveyId) return
    setLoading(true)
    try {
      const raw = await newsSurveysApi.get(surveyId)
      setSurvey(normalizeSurvey(raw?.survey || raw))
    } catch (err) {
      toast.error(formatErr(err, 'Failed to load survey'))
      setSurvey(null)
    } finally {
      setLoading(false)
    }
  }, [surveyId])

  const loadSubmissions = useCallback(async () => {
    if (!surveyId) return
    setSubsLoading(true)
    try {
      const raw = await newsSurveysApi.listSubmissions(surveyId, { page: String(page), pageSize: '30' })
      setSubmissions(normalizeSubmissionList(raw).items)
    } catch (err) {
      toast.error(formatErr(err, 'Failed to load submissions'))
      setSubmissions([])
    } finally {
      setSubsLoading(false)
    }
  }, [surveyId, page])

  useEffect(() => {
    loadSurvey()
  }, [loadSurvey])

  useEffect(() => {
    loadSubmissions()
  }, [loadSubmissions])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!survey) {
    return <p className="text-sm text-gray-500 py-8 text-center">Survey not found.</p>
  }

  const answerMap = Object.fromEntries((survey.answers || []).map((a) => [a.id, a]))

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{survey.title}</h2>
          <p className="text-sm text-gray-600 mt-1">{survey.question}</p>
        </div>
        <StatusBadge label={survey.status} color={surveyStatusColor(survey.status)} />
      </div>

      {survey.politicalParty ? (
        <div>
          <p className="text-xs text-gray-500 mb-1.5">Linked party</p>
          <PartyChip party={survey.politicalParty} />
        </div>
      ) : null}

      {survey.frameImageUrl ? (
        <div>
          <p className="text-xs text-gray-500 mb-1.5">Frame overlay</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={survey.frameImageUrl}
            alt="Survey frame"
            className="max-h-32 rounded-lg border border-gray-200 object-contain bg-gray-50"
          />
        </div>
      ) : null}

      <Card title="Overview">
        <CardRow label="Responses" value={String(survey.responseCount ?? 0)} />
        <CardRow label="Tenant" value={survey.tenant?.name || survey.tenantId || 'All tenants'} />
        <CardRow label="Created" value={formatSurveyDate(survey.createdAt)} />
      </Card>

      {(survey.answers || []).length > 0 ? (
        <Card title="Answer options">
          <div className="flex flex-wrap gap-2">
            {survey.answers.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white shadow-sm"
                style={{ backgroundColor: a.color || '#64748b' }}
              >
                <span className="font-mono text-[10px] opacity-80">{a.id}</span>
                {a.label}
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Video responses ({submissions.length})</h3>
          <Button size="sm" variant="ghost" loading={subsLoading} onClick={loadSubmissions}>
            Refresh
          </Button>
        </div>

        {subsLoading && submissions.length === 0 ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-xl text-gray-500 text-sm">
            No video responses yet
          </div>
        ) : (
          <ul className="space-y-4">
            {submissions.map((sub) => {
              const ans = answerMap[sub.selectedAnswerId]
              return (
                <li
                  key={sub.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-brand/30 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      {sub.submitterMobile || '—'}
                    </span>
                    <span className="text-xs text-gray-400">reporter</span>
                    {ans ? (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: ans.color }}
                      >
                        {ans.label}
                      </span>
                    ) : sub.selectedAnswerId ? (
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{sub.selectedAnswerId}</span>
                    ) : null}
                    <span className="text-xs text-gray-400 ml-auto">{formatSurveyDate(sub.createdAt)}</span>
                  </div>
                  <VideoThumb url={sub.videoUrl} />
                </li>
              )
            })}
          </ul>
        )}

        {page > 1 ? (
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setPage((p) => p + 1)}>
              Next page
            </Button>
          </div>
        ) : null}
      </div>

      {onClose ? (
        <Button variant="secondary" onClick={onClose} className="w-full">
          Close
        </Button>
      ) : null}
    </div>
  )
}
