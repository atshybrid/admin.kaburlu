import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useLayout } from '../DashboardLayout'
import newsDeskApi, { formatNewsDeskError } from '../../../lib/api/services/newsDeskApi'
import { useFactsPolling } from '../../../lib/newsDesk/useFactsPolling'
import { shouldPollExtraction } from '../../../lib/newsDesk/extractionPolling'
import { loadNewsDeskCategories } from '../../../lib/newsDesk/categoryLoader'
import NewsDeskAccessGate from './NewsDeskAccessGate'
import NewsDeskOriginalPanel from './NewsDeskOriginalPanel'
import NewsDeskFactsPanel from './NewsDeskFactsPanel'
import { Button, Spinner, StatusBadge, toast } from '../../ui'
import { extractionStatusColor, formatPipelineLabel } from '../../../lib/newsDesk/statusBadges'

export default function NewsDeskDetailView({ jobId }) {
  const { user } = useLayout()
  const [loading, setLoading] = useState(true)
  const [snapshot, setSnapshot] = useState(null)
  const [pipeline, setPipeline] = useState(null)
  const [facts, setFacts] = useState(null)
  const [categoryName, setCategoryName] = useState('')
  const [retrying, setRetrying] = useState(false)

  const loadAll = useCallback(async () => {
    if (!jobId) return
    setLoading(true)
    try {
      const [snap, pipe, fact] = await Promise.all([
        newsDeskApi.getSnapshot(jobId),
        newsDeskApi.getPipeline(jobId),
        newsDeskApi.getFacts(jobId),
      ])
      setSnapshot(snap)
      setPipeline(pipe?.pipeline || null)
      setFacts(fact)

      const cats = await loadNewsDeskCategories()
      const match = cats.find((c) => c.categoryId === snap?.categoryId)
      setCategoryName(match?.categoryName || '')
    } catch (error) {
      toast.error(formatNewsDeskError(error))
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const onFactsUpdate = useCallback((payload) => {
    setFacts(payload)
  }, [])

  const pollingEnabled = Boolean(facts?.extractionStatus) && shouldPollExtraction(facts.extractionStatus)

  const { restart } = useFactsPolling({
    jobId,
    enabled: pollingEnabled && !loading && Boolean(jobId),
    onUpdate: onFactsUpdate,
    onError: (err) => {
      if (err?.status === 401 || err?.status === 403) toast.error(formatNewsDeskError(err))
    },
  })

  const onRetry = async () => {
    if (retrying) return
    setRetrying(true)
    try {
      await newsDeskApi.retryExtraction(jobId)
      toast.success('Extraction retry queued')
      const fact = await newsDeskApi.getFacts(jobId)
      setFacts(fact)
      restart()
    } catch (error) {
      toast.error(formatNewsDeskError(error))
    } finally {
      setRetrying(false)
    }
  }

  const canRetry = facts?.extractionStatus === 'EXTRACTION_FAILED'

  return (
    <NewsDeskAccessGate user={user}>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/admin/news-desk" className="text-sm text-brand hover:underline">
              ← News Desk
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">
              {snapshot?.headline || 'Submission review'}
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-mono">Job {jobId}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {facts?.extractionStatus && (
              <StatusBadge
                status={formatPipelineLabel(facts.extractionStatus)}
                color={extractionStatusColor(facts.extractionStatus)}
              />
            )}
            {canRetry && (
              <Button type="button" variant="outline" onClick={onRetry} disabled={retrying}>
                {retrying ? <Spinner size="sm" className="mr-2" /> : null}
                Retry extraction
              </Button>
            )}
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <NewsDeskOriginalPanel snapshot={snapshot} categoryName={categoryName} pipeline={pipeline} />
            <NewsDeskFactsPanel
              factsPayload={facts?.facts}
              extractionStatus={facts?.extractionStatus}
              failure={facts?.failure}
            />
          </div>
        )}
      </div>
    </NewsDeskAccessGate>
  )
}