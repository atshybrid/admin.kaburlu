import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import newsDeskApi, { formatNewsDeskError } from '../../../lib/api/services/newsDeskApi'
import syndicationApi from '../../../lib/api/services/syndicationApi'
import { Button, StatusBadge, toast } from '../../ui'
import { extractionStatusColor, formatPipelineLabel } from '../../../lib/newsDesk/statusBadges'
import { formatLocationHintDisplay } from '../../../lib/newsDesk/locationHint'
import { buildExtractionQueueSummary } from '../../../lib/newsDesk/formatExtractionQueue'
import { summarizePublishWebResponse, blockerLabel } from '../../../lib/newsDesk/publishResultSummary'
import NewsDeskWorkflowSteps from './NewsDeskWorkflowSteps'

export default function NewsDeskPublishBar({
  jobId,
  extractionStatus,
  extractionQueue,
  factsPayload,
  locationHint,
  syndicationStatus,
  approvedCount = 0,
  tenantCount = 0,
  onApproveAll,
  approvingAll = false,
  onPublished,
}) {
  const [syndJob, setSyndJob] = useState(null)
  const [caps, setCaps] = useState(null)
  const [publishing, setPublishing] = useState(false)
  const [lastSummary, setLastSummary] = useState(null)

  const refreshCaps = useCallback(async () => {
    if (!jobId) return
    try {
      const [job, publishCaps] = await Promise.all([
        syndicationApi.getJob(jobId),
        newsDeskApi.getPublishCapabilities(jobId),
      ])
      setSyndJob(job)
      setCaps(publishCaps)
    } catch {
      setSyndJob(null)
      setCaps(null)
    }
  }, [jobId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!jobId) return
      await refreshCaps()
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
  }, [jobId, extractionStatus, approvedCount, refreshCaps])

  const factsReady = extractionStatus === 'EXTRACTION_SUCCEEDED'
  const factsFailed = extractionStatus === 'EXTRACTION_FAILED'
  const locationOk = Boolean(formatLocationHintDisplay(locationHint))
  const aiOk = factsReady && !factsFailed

  const legacyHref = `/admin/platform-syndication?legacy=1&jobId=${encodeURIComponent(jobId || '')}`
  const syndStatus = syndJob?.status || syndicationStatus || 'DRAFT'
  const hasMasterPrint = Boolean(syndJob?.masterPrint?.headline?.trim())
  const workflowV2 = caps?.workflow === 'v2'
  const jobPublished = syndStatus === 'PUBLISHED'
  const elig = caps?.eligibility
  const readyCount = elig?.publishableCount ?? 0
  const v2PublishReady = workflowV2 && elig?.jobEligible === true && readyCount > 0 && !jobPublished && !publishing

  const publishDisabledReason = useMemo(() => {
    if (publishing) return 'Publish in progress'
    if (jobPublished) return 'Job already marked published'
    if (!workflowV2) return 'Legacy job — use Platform Syndication'
    if (!aiOk) return factsFailed ? 'Extraction failed — retry on header' : 'Waiting for extraction'
    if (approvedCount < 1) return 'Approve at least one tenant'
    if (readyCount < 1) return 'No tenants eligible — check approval and prior publish state'
    if (elig?.jobBlockers?.length) return elig.jobBlockers.map((b) => blockerLabel(b)).join(' · ')
    return null
  }, [publishing, jobPublished, workflowV2, aiOk, factsFailed, approvedCount, readyCount, elig])

  const onPublishV2 = async (retryFailedOnly = false) => {
    if (!jobId || publishing) return
    setPublishing(true)
    setLastSummary(null)
    try {
      const res = await newsDeskApi.publishWebV2(jobId, {
        requireApproval: true,
        retryFailedOnly,
      })
      const summary = summarizePublishWebResponse(res)
      setLastSummary(summary)
      if (summary.failedCount) {
        toast.error(`${summary.failedCount} failed · ${summary.publishedCount} published · ${summary.skippedCount} skipped`)
      } else if (summary.publishedCount) {
        toast.success(`Published to ${summary.publishedCount} tenant site(s)`)
      } else {
        toast.info('No new publishes — tenants may already be live or not approved.')
      }
      await refreshCaps()
      onPublished?.()
    } catch (error) {
      toast.error(formatNewsDeskError(error))
    } finally {
      setPublishing(false)
    }
  }

  const steps = workflowV2
    ? [
        {
          key: 'extract',
          label: 'Extraction',
          ok: aiOk,
          active: !aiOk && !factsFailed,
          hint: factsFailed ? 'Failed' : aiOk ? 'Ready' : 'In progress',
        },
        {
          key: 'approve',
          label: 'Approval',
          ok: approvedCount > 0 && approvedCount >= tenantCount,
          active: approvedCount > 0 && approvedCount < tenantCount,
          hint: `${approvedCount}/${tenantCount} approved`,
        },
        {
          key: 'location',
          label: 'Location',
          ok: locationOk,
          active: false,
          hint: locationOk ? 'Linked' : 'Optional',
        },
        {
          key: 'publish',
          label: 'Publish',
          ok: jobPublished,
          active: v2PublishReady,
          hint: `${readyCount} ready`,
        },
      ]
    : []

  return (
    <section className="rounded-lg border border-slate-200/80 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Publishing control</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {workflowV2 ? 'V2 web' : 'Legacy'} · {syndStatus} · {approvedCount}/{tenantCount} approved
          </p>
        </div>
        {extractionStatus ? (
          <StatusBadge
            status={formatPipelineLabel(extractionStatus)}
            color={extractionStatusColor(extractionStatus)}
          />
        ) : null}
      </header>

      <div className="px-4 py-4 space-y-4">
        {extractionQueue && !factsReady ? (
          <p className="text-xs text-amber-900 bg-amber-50/80 border border-amber-100 rounded-md px-3 py-2">
            {buildExtractionQueueSummary({ queue: extractionQueue, extractionStatus }) || 'Extraction queue pending'}
          </p>
        ) : null}
        {workflowV2 ? <NewsDeskWorkflowSteps steps={steps} /> : null}

        {!workflowV2 ? (
          <p className="text-sm text-slate-600">
            This job uses legacy syndication generate → publish. Open Platform Syndication to continue.
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-4">
          <div className="flex flex-wrap gap-2">
            {onApproveAll ? (
              <Button type="button" variant="outline" size="sm" disabled={approvingAll} onClick={onApproveAll}>
                {approvingAll ? 'Approving…' : 'Approve all tenants'}
              </Button>
            ) : null}
            {workflowV2 ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  disabled={!v2PublishReady}
                  title={publishDisabledReason || undefined}
                  onClick={() => onPublishV2(false)}
                >
                  {publishing ? 'Publishing…' : 'Publish web (V2)'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={publishing || jobPublished}
                  onClick={() => onPublishV2(true)}
                >
                  Retry failed only
                </Button>
              </>
            ) : (
              <Link href={legacyHref}>
                <Button type="button" size="sm">
                  Legacy desk →
                </Button>
              </Link>
            )}
          </div>
          {publishDisabledReason && workflowV2 && !v2PublishReady ? (
            <p className="text-xs text-amber-800 max-w-md">{publishDisabledReason}</p>
          ) : null}
          {!workflowV2 && !hasMasterPrint && syndStatus !== 'PREVIEW_READY' ? (
            <p className="text-xs text-slate-500">Run generate in legacy desk first.</p>
          ) : null}
        </div>

        {lastSummary?.lines?.length ? (
          <div className="rounded-md bg-slate-50 border border-slate-100 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Last publish run</p>
            <ul className="space-y-1 text-xs">
              {lastSummary.lines.map((line) => (
                <li
                  key={`${line.type}-${line.tenantId}`}
                  className={
                    line.type === 'fail' ? 'text-red-700' : line.type === 'skip' ? 'text-slate-500' : 'text-emerald-700'
                  }
                >
                  {line.label}
                  {line.slug ? <span className="text-slate-600 font-mono"> · /articles/{line.slug}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}