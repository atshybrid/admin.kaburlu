/**
 * Single submission review — approve / reject
 */

import { useState, useEffect } from 'react'
import { unionSurveysApi } from '../../../lib/api/services/unionSurveysApi'
import { normalizeSurvey } from '../../../lib/unionSurveys/normalize'
import { memberName } from '../../../lib/journalist/memberDisplay'
import { Button, Card, CardRow, FormField, Input, Spinner, StatusBadge, toast } from '../../ui'
import { ApiError } from '../../../lib/api/client'

function formatErr(err, fb) {
  if (err instanceof ApiError) return err.data?.code ? `${err.message} (${err.data.code})` : err.message
  return err?.message || fb
}

export default function SubmissionReviewPanel({ surveyId, progressId, onDone }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [acting, setActing] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const raw = await unionSurveysApi.getSubmission(surveyId, progressId)
      setData(normalizeSurvey(raw) || raw)
    } catch (err) {
      toast.error(formatErr(err, 'Failed to load submission'))
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId, progressId])

  const approve = async () => {
    setActing(true)
    try {
      await unionSurveysApi.approveSubmission(surveyId, progressId, note.trim() ? { note: note.trim() } : {})
      toast.success('Submission approved')
      onDone?.()
    } catch (err) {
      toast.error(formatErr(err, 'Approve failed'))
    } finally {
      setActing(false)
    }
  }

  const reject = async () => {
    if (!note.trim()) {
      toast.error('Rejection note is required')
      return
    }
    setActing(true)
    try {
      await unionSurveysApi.rejectSubmission(surveyId, progressId, { note: note.trim() })
      toast.success('Submission rejected — member can resubmit')
      onDone?.()
    } catch (err) {
      toast.error(formatErr(err, 'Reject failed'))
    } finally {
      setActing(false)
    }
  }

  if (loading) return <Spinner />
  if (!data) return <p className="text-sm text-gray-500">Submission not found.</p>

  const member = data.member || data.journalistProfile || data.profile
  const answers = data.answers || data.responses || []
  const videos = answers.filter((a) => a.videoUrl)

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-wrap gap-2">
        <StatusBadge label={data.reviewStatus || 'PENDING'} color="yellow" />
        <StatusBadge label={data.status || data.progressStatus || '—'} color="gray" />
      </div>

      <Card title="Member">
        <CardRow label="Name" value={memberName(member || data)} />
        <CardRow label="Mobile" value={member?.mobileNumber || data.mobileNumber || '—'} />
        <CardRow label="District" value={member?.district || data.district || '—'} />
      </Card>

      {answers.length > 0 ? (
        <Card title="Answers">
          <ul className="space-y-3 text-sm">
            {answers.map((a) => (
              <li key={a.answerId || a.questionId} className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                <p className="font-medium text-gray-800">{a.questionText || a.questionId}</p>
                <p className="text-gray-600 mt-1">
                  {a.answerJson?.value ||
                    a.answerJson?.selectedId ||
                    (typeof a.answerJson === 'string' ? a.answerJson : JSON.stringify(a.answerJson || a.value || '—'))}
                </p>
                {a.videoUrl ? (
                  <video src={a.videoUrl} controls className="mt-2 w-full max-h-64 rounded-lg bg-black" />
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {videos.length === 0 && data.videoUrl ? (
        <Card title="Video">
          <video src={data.videoUrl} controls className="w-full max-h-80 rounded-lg bg-black" />
        </Card>
      ) : null}

      <FormField label="Admin note">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Required for reject" />
      </FormField>

      <div className="flex gap-2">
        <Button loading={acting} onClick={approve}>Approve</Button>
        <Button variant="danger" loading={acting} onClick={reject}>Reject</Button>
      </div>
    </div>
  )
}
