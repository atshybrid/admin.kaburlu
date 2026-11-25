import { useCallback, useEffect, useMemo, useState } from 'react'
import newsDeskApi, { formatNewsDeskError } from '../../../lib/api/services/newsDeskApi'
import { Button, EmptyState, Select, Spinner, StatusBadge, Textarea, toast } from '../../ui'
import NewsDeskTenantTargetsCell from './NewsDeskTenantTargetsCell'

const REVIEW_OPTIONS = [
  { value: 'PENDING_REVIEW', label: 'Pending review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REVISION_REQUIRED', label: 'Needs revision' },
  { value: 'REJECTED', label: 'Rejected' },
]

const TABLE_PREVIEW = 5

function reviewColor(status) {
  if (status === 'APPROVED') return 'green'
  if (status === 'REJECTED') return 'red'
  if (status === 'REVISION_REQUIRED') return 'amber'
  return 'slate'
}

function publishPhaseColor(phase) {
  if (phase === 'PUBLISHED') return 'green'
  if (phase === 'PUBLISHING') return 'blue'
  if (phase === 'FAILED') return 'red'
  if (phase === 'APPROVED') return 'amber'
  return 'slate'
}

function publishPhaseLabel(phase) {
  if (!phase) return 'Pending'
  return String(phase).replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

function toTargetCellShape(tenants) {
  return (tenants || []).map((t) => ({
    tenantId: t.tenantId,
    nativeName: t.nativeName,
    published: t.published,
    reviewStatus: t.reviewStatus,
  }))
}

function WebLinkCell({ tenant }) {
  if (tenant.articleUrl) {
    return (
      <a
        href={tenant.articleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-medium text-brand hover:underline"
        onClick={(e) => e.stopPropagation()}
        title={tenant.articleUrl}
      >
        Website ↗
      </a>
    )
  }
  if (tenant.published && tenant.webArticleId) {
    return (
      <span
        className="text-[11px] text-amber-800"
        title="Backend has webArticleId but no public URL — check tenant primary domain or slug; link 404 may mean draft/wrong path"
      >
        Published — URL unresolved
      </span>
    )
  }
  if (tenant.webArticleId) {
    return (
      <span className="text-[11px] text-slate-500 font-mono" title={tenant.webArticleId}>
        Draft id · {tenant.webArticleId.slice(0, 8)}…
      </span>
    )
  }
  return <span className="text-xs text-slate-400">Not live</span>
}

export default function NewsDeskTenantsPanel({
  jobId,
  canEditReview,
  onOutcomesLoaded,
}) {
  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState(null)
  const [savingTenant, setSavingTenant] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [expandedId, setExpandedId] = useState(null)
  const [showAllRows, setShowAllRows] = useState(false)
  const [publishingTenant, setPublishingTenant] = useState(null)

  const load = useCallback(async () => {
    if (!jobId) return
    setLoading(true)
    try {
      const res = await newsDeskApi.getTenantOutcomes(jobId)
      setPayload(res)
      const next = {}
      ;(res?.tenants || []).forEach((t) => {
        next[t.tenantId] = {
          status: t.reviewStatus || 'PENDING_REVIEW',
          reviewNote: t.reviewNote || '',
        }
      })
      setDrafts(next)
      onOutcomesLoaded?.(res)
    } catch (error) {
      toast.error(formatNewsDeskError(error))
    } finally {
      setLoading(false)
    }
  }, [jobId, onOutcomesLoaded])

  useEffect(() => {
    load()
  }, [load])

  const publishTenant = async (tenantId) => {
    setPublishingTenant(tenantId)
    try {
      const res = await newsDeskApi.publishWebV2Tenant(jobId, tenantId, { requireApproval: true })
      const row = (res?.results || []).find((r) => r.tenantId === tenantId)
      if (row?.ok && !row.skipped) {
        toast.success('Published to tenant site')
      } else if (row?.skipped) {
        toast.info(row.skipReason || 'Already published')
      } else {
        toast.error(formatNewsDeskError({ code: row?.code, message: row?.error }) || 'Publish failed')
      }
      await load()
    } catch (error) {
      toast.error(formatNewsDeskError(error))
    } finally {
      setPublishingTenant(null)
    }
  }

  const saveReview = async (tenantId, statusOverride) => {
    const d = drafts[tenantId]
    if (!d) return
    const status = statusOverride || d.status
    setSavingTenant(tenantId)
    try {
      await newsDeskApi.patchTenantReview(jobId, tenantId, {
        status,
        reviewNote: d.reviewNote,
      })
      toast.success('Review updated')
      await load()
      setExpandedId(null)
    } catch (error) {
      toast.error(formatNewsDeskError(error))
    } finally {
      setSavingTenant(null)
    }
  }

  const tenants = useMemo(() => payload?.tenants || [], [payload?.tenants])
  const summaryTargets = toTargetCellShape(tenants)
  const visibleRows = useMemo(
    () => (showAllRows ? tenants : tenants.slice(0, TABLE_PREVIEW)),
    [showAllRows, tenants],
  )
  const approvedCount = tenants.filter((t) => String(t.reviewStatus).toUpperCase() === 'APPROVED').length

  if (loading) {
    return (
      <section className="rounded-lg border border-slate-200/80 bg-white py-12 flex justify-center">
        <Spinner />
      </section>
    )
  }

  if (!tenants.length) {
    return (
      <section className="rounded-lg border border-slate-200/80 bg-white p-6">
        <EmptyState title="No target tenants" subtitle="This intake was not routed to any tenant." className="py-8" />
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-slate-200/80 bg-white overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/40">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Tenant targets</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {tenants.length} publishers · {approvedCount} approved · {payload?.syndicationStatus || 'DRAFT'}
          </p>
        </div>
        <div className="max-w-[12rem] hidden sm:block">
          <NewsDeskTenantTargetsCell tenants={summaryTargets} stopPropagation={false} />
        </div>
      </header>

      <div className="sm:hidden px-4 py-2 border-b border-slate-100">
        <NewsDeskTenantTargetsCell tenants={summaryTargets} stopPropagation={false} />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[14%]" />
            <col className="w-[24%]" />
            <col className="w-[18%]" />
            <col className="w-[22%]" />
          </colgroup>
          <thead>
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <th className="px-4 py-2.5 font-semibold">Publisher</th>
              <th className="px-3 py-2.5">Live</th>
              <th className="px-3 py-2.5">Website</th>
              <th className="px-3 py-2.5">Review</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleRows.map((t) => {
              const editing = expandedId === t.tenantId
              return (
                <tr key={t.tenantId} className="align-top hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 first:pl-4">
                    <p className="font-medium text-slate-900 text-[13px] line-clamp-2" title={t.nativeName}>
                      {t.nativeName}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 first:pl-4">
                    <StatusBadge
                      status={publishPhaseLabel(t.publishPhase || (t.published ? 'PUBLISHED' : 'PENDING'))}
                      color={publishPhaseColor(t.publishPhase || (t.published ? 'PUBLISHED' : 'PENDING'))}
                    />
                    {t.lastError ? (
                      <p className="text-[10px] text-red-700 mt-1 line-clamp-2" title={t.lastError}>
                        {t.lastError}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 first:pl-4">
                    <WebLinkCell tenant={t} />
                  </td>
                  <td className="px-4 py-2.5 first:pl-4">
                    {t.reviewStatus ? (
                      <StatusBadge
                        status={String(t.reviewStatus).replace(/_/g, ' ')}
                        color={reviewColor(t.reviewStatus)}
                      />
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    {canEditReview ? (
                      <div className="inline-flex gap-1 justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="!px-2"
                          disabled={savingTenant === t.tenantId}
                          onClick={() => saveReview(t.tenantId, 'APPROVED')}
                        >
                          Approve
                        </Button>
                        {!t.published && String(t.reviewStatus).toUpperCase() === 'APPROVED' ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="!px-2"
                            disabled={publishingTenant === t.tenantId}
                            onClick={() => publishTenant(t.tenantId)}
                          >
                            {publishingTenant === t.tenantId ? '…' : 'Publish'}
                          </Button>
                        ) : null}
                        {t.publishPhase === 'FAILED' ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="!px-2"
                            disabled={publishingTenant === t.tenantId}
                            onClick={() => publishTenant(t.tenantId)}
                          >
                            Retry
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="!px-2"
                          onClick={() => setExpandedId(editing ? null : t.tenantId)}
                        >
                          {editing ? 'Close' : 'Note'}
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {tenants.length > TABLE_PREVIEW ? (
        <button
          type="button"
          className="mt-2 text-xs font-medium text-brand hover:underline"
          onClick={() => setShowAllRows((v) => !v)}
        >
          {showAllRows ? 'Show fewer tenants' : `Show all ${tenants.length} tenants`}
        </button>
      ) : null}

      {canEditReview && expandedId ? (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          {tenants
            .filter((t) => t.tenantId === expandedId)
            .map((t) => {
              const draft = drafts[t.tenantId] || { status: 'PENDING_REVIEW', reviewNote: '' }
              return (
                <div key={t.tenantId} className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-900">Review — {t.nativeName}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-slate-600">Review status</label>
                      <Select
                        className="mt-1"
                        value={draft.status}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [t.tenantId]: { ...prev[t.tenantId], status: e.target.value },
                          }))
                        }
                      >
                        {REVIEW_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-slate-600">Review note</label>
                      <Textarea
                        className="mt-1"
                        rows={2}
                        value={draft.reviewNote}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [t.tenantId]: { ...prev[t.tenantId], reviewNote: e.target.value },
                          }))
                        }
                        placeholder="Editorial note"
                      />
                    </div>
                    <div className="flex gap-2 sm:col-span-2">
                      <Button
                        type="button"
                        disabled={savingTenant === t.tenantId}
                        onClick={() => saveReview(t.tenantId)}
                      >
                        {savingTenant === t.tenantId ? <Spinner size="sm" className="mr-2" /> : null}
                        Save
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setExpandedId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      ) : null}
    </section>
  )
}