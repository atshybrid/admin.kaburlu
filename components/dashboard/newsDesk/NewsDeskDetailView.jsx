import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useLayout } from '../DashboardLayout'
import newsDeskApi, { formatNewsDeskError } from '../../../lib/api/services/newsDeskApi'
import { useFactsPolling } from '../../../lib/newsDesk/useFactsPolling'
import { shouldPollExtraction } from '../../../lib/newsDesk/extractionPolling'
import { loadNewsDeskCategories } from '../../../lib/newsDesk/categoryLoader'
import NewsDeskAccessGate from './NewsDeskAccessGate'
import NewsDeskOriginalPanel from './NewsDeskOriginalPanel'
import NewsDeskFactsPanel from './NewsDeskFactsPanel'
import NewsDeskPageShell from './NewsDeskPageShell'
import NewsDeskDetailSkeleton from './NewsDeskDetailSkeleton'
import { Button, EmptyState, toast } from '../../ui'
import NewsDeskTenantsPanel from './NewsDeskTenantsPanel'
import NewsDeskPublishBar from './NewsDeskPublishBar'
import NewsDeskPublishPreview from './NewsDeskPublishPreview'
import NewsDeskExtractionQueueBanner from './NewsDeskExtractionQueueBanner'
import { summarizePublishWebResponse } from '../../../lib/newsDesk/publishResultSummary'
import NewsDeskLocationPanel from './NewsDeskLocationPanel'
import { canManageNewsDeskStaff } from '../../../lib/newsDesk/adminRoles'
import { normalizeSyndicationRole } from '../../../lib/syndication/platformRoles'
import NewsDeskDetailHeader from './NewsDeskDetailHeader'
import { DEFAULT_NEWS_ROOM_BASE, newsRoomPaths } from '../../../lib/newsDesk/paths'

export default function NewsDeskDetailView({ jobId, basePath = DEFAULT_NEWS_ROOM_BASE }) {
  const paths = newsRoomPaths(basePath)
  const router = useRouter()
  const { user } = useLayout()
  const autoPublishDoneRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [snapshot, setSnapshot] = useState(null)
  const [pipeline, setPipeline] = useState(null)
  const [facts, setFacts] = useState(null)
  const [categoryName, setCategoryName] = useState('')
  const [retrying, setRetrying] = useState(false)
  const [outcomes, setOutcomes] = useState(null)
  const [approvingAll, setApprovingAll] = useState(false)
  const [tenantPanelKey, setTenantPanelKey] = useState(0)

  const loadAll = useCallback(async () => {
    if (!jobId) return
    setLoading(true)
    setLoadError(null)
    try {
      const [snapRes, pipeRes, factRes, outcomesRes] = await Promise.allSettled([
        newsDeskApi.getSnapshot(jobId),
        newsDeskApi.getPipeline(jobId),
        newsDeskApi.getFacts(jobId),
        newsDeskApi.getTenantOutcomes(jobId),
      ])

      const errors = []
      if (snapRes.status === 'fulfilled') {
        setSnapshot(snapRes.value)
      } else {
        setSnapshot(null)
        errors.push(snapRes.reason)
      }
      if (pipeRes.status === 'fulfilled') {
        setPipeline(pipeRes.value?.pipeline || null)
      } else {
        setPipeline(null)
        errors.push(pipeRes.reason)
      }
      if (factRes.status === 'fulfilled') {
        setFacts(factRes.value)
      } else {
        setFacts(null)
        errors.push(factRes.reason)
      }
      if (outcomesRes.status === 'fulfilled') {
        setOutcomes(outcomesRes.value)
      } else {
        setOutcomes(null)
      }

      const snap = snapRes.status === 'fulfilled' ? snapRes.value : null
      const cats = await loadNewsDeskCategories()
      const match = cats.find((c) => c.categoryId === snap?.categoryId)
      setCategoryName(match?.categoryName || '')

      if (errors.length && !snap) {
        const first = errors[0]
        const msg = formatNewsDeskError(first)
        setLoadError(msg)
        toast.error(msg)
      }
    } catch (error) {
      const msg = formatNewsDeskError(error)
      setLoadError(msg)
      toast.error(msg)
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
  const deskRole = normalizeSyndicationRole(user)
  const canEditReview =
    canManageNewsDeskStaff(user) || deskRole === 'NEWS_DESK' || deskRole === 'NEWS_MODERATOR'

  const tenants = outcomes?.tenants || []
  const approvedCount = tenants.filter((t) => String(t.reviewStatus).toUpperCase() === 'APPROVED').length
  const onApproveAll = async () => {
    if (!canEditReview || !jobId || approvingAll) return
    const pending = tenants.filter((t) => String(t.reviewStatus || '').toUpperCase() !== 'APPROVED')
    if (!pending.length) {
      toast.success('All tenants already approved')
      return
    }
    setApprovingAll(true)
    try {
      for (const t of pending) {
        await newsDeskApi.patchTenantReview(jobId, t.tenantId, {
          status: 'APPROVED',
          reviewNote: t.reviewNote || '',
        })
      }
      toast.success(`Approved ${pending.length} tenant(s)`)
      setTenantPanelKey((k) => k + 1)
    } catch (error) {
      toast.error(formatNewsDeskError(error))
    } finally {
      setApprovingAll(false)
    }
  }

  const headline = snapshot?.headline || 'Submission review'
  const autoPublishRequested = router.query?.autopublish === '1'

  const stageRow = useMemo(
    () => ({
      extractionStatus: facts?.extractionStatus,
      syndicationStatus: outcomes?.syndicationStatus || pipeline?.status,
      targetTenants: tenants.map((t) => ({
        tenantId: t.tenantId,
        nativeName: t.nativeName,
        published: t.published,
        reviewStatus: t.reviewStatus,
      })),
    }),
    [facts?.extractionStatus, outcomes?.syndicationStatus, pipeline?.status, tenants],
  )

  const onQueueRefresh = useCallback(async () => {
    try {
      const fact = await newsDeskApi.getFacts(jobId)
      setFacts(fact)
      restart()
    } catch (error) {
      toast.error(formatNewsDeskError(error))
    }
  }, [jobId, restart])

  useEffect(() => {
    if (!autoPublishRequested || autoPublishDoneRef.current || !jobId) return
    if (facts?.extractionStatus !== 'EXTRACTION_SUCCEEDED') return
  const publishable = tenants.length > 0
    if (!publishable) return
    autoPublishDoneRef.current = true
    ;(async () => {
      try {
        if (canEditReview) {
          const pending = tenants.filter((t) => String(t.reviewStatus || '').toUpperCase() !== 'APPROVED')
          for (const t of pending) {
            await newsDeskApi.patchTenantReview(jobId, t.tenantId, {
              status: 'APPROVED',
              reviewNote: t.reviewNote || '',
            })
          }
          if (pending.length) setTenantPanelKey((k) => k + 1)
        }
        const res = await newsDeskApi.publishWebV2(jobId, { requireApproval: true })
        const summary = summarizePublishWebResponse(res)
        if (summary.publishedCount) {
          toast.success(`Auto publish — ${summary.publishedCount} tenant site(s) live`)
        } else if (summary.failedCount) {
          toast.error(`Auto publish — ${summary.failedCount} failed`)
        } else {
          toast.info('Auto publish — no new live sites (check approval or prior publish)')
        }
        const outcomesRes = await newsDeskApi.getTenantOutcomes(jobId)
        setOutcomes(outcomesRes)
        setTenantPanelKey((k) => k + 1)
      } catch (error) {
        toast.error(formatNewsDeskError(error))
      }
    })()
  }, [autoPublishRequested, facts?.extractionStatus, tenants, canEditReview, jobId])

  return (
    <NewsDeskAccessGate user={user}>
      <NewsDeskPageShell maxWidth="max-w-[min(100%,90rem)]" className="px-1 sm:px-0">
        <NewsDeskDetailHeader
          paths={paths}
          headline={headline}
          loading={loading}
          stageRow={stageRow}
          categoryName={categoryName}
          acceptedAt={snapshot?.acceptedAt}
          tenants={tenants}
          canRetry={canRetry}
          onRetry={onRetry}
          retrying={retrying}
        />

        {loading ? (
          <NewsDeskDetailSkeleton />
        ) : loadError && !snapshot ? (
          <EmptyState
            title="Could not load submission"
            subtitle={loadError}
            action={
              <Button type="button" variant="outline" onClick={loadAll}>
                Try again
              </Button>
            }
            className="rounded-lg border border-slate-200 bg-white py-12"
          />
        ) : (
          <div className="space-y-4 lg:space-y-5">
            <NewsDeskPublishBar
              jobId={jobId}
              extractionStatus={facts?.extractionStatus}
              extractionQueue={facts?.queue}
              factsPayload={facts?.facts}
              locationHint={snapshot?.locationHint}
              syndicationStatus={outcomes?.syndicationStatus || pipeline?.status}
              approvedCount={approvedCount}
              tenantCount={tenants.length}
              onApproveAll={canEditReview ? onApproveAll : undefined}
              approvingAll={approvingAll}
              onPublished={() => setTenantPanelKey((k) => k + 1)}
            />

            <NewsDeskTenantsPanel
              key={tenantPanelKey}
              jobId={jobId}
              canEditReview={canEditReview}
              onOutcomesLoaded={setOutcomes}
            />

            <NewsDeskExtractionQueueBanner
              jobId={jobId}
              extractionStatus={facts?.extractionStatus}
              queue={facts?.queue}
              onRefresh={onQueueRefresh}
            />

            <NewsDeskPublishPreview
              jobId={jobId}
              tenants={tenants}
              extractionStatus={facts?.extractionStatus}
            />

            <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
              <div className="lg:col-span-7 space-y-4">
                <NewsDeskLocationPanel jobId={jobId} locationHint={snapshot?.locationHint} />
                <NewsDeskOriginalPanel
                  snapshot={snapshot}
                  categoryName={categoryName}
                  pipeline={pipeline}
                  targetTenants={tenants}
                />
              </div>
              <div className="lg:col-span-5">
                <NewsDeskFactsPanel
                  factsPayload={facts?.facts}
                  extractionStatus={facts?.extractionStatus}
                  failure={facts?.failure}
                  queue={facts?.queue}
                />
              </div>
            </div>
          </div>
        )}
      </NewsDeskPageShell>
    </NewsDeskAccessGate>
  )
}