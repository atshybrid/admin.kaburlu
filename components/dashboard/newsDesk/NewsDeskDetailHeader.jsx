import Link from 'next/link'
import { Button } from '../../ui'
import { TELUGU_HEADLINE_CLASS } from '../../../lib/newsDesk/teluguTypography'
import NewsDeskQueueStageBadge from './NewsDeskQueueStageBadge'
import NewsDeskPublishSummary from './NewsDeskPublishSummary'
import { formatDeskDate } from '../../../lib/newsDesk/formatDeskList'

export default function NewsDeskDetailHeader({
  paths,
  headline,
  loading,
  stageRow,
  categoryName,
  acceptedAt,
  tenants,
  canRetry,
  onRetry,
  retrying,
}) {
  return (
    <header className="mb-5 pb-4 border-b border-slate-200/90">
      <Link href={paths.posts} className="text-sm font-medium text-brand hover:underline">
        ← Back to queue
      </Link>
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          {!loading ? (
            <h1 className={`${TELUGU_HEADLINE_CLASS} text-2xl sm:text-[1.65rem] text-slate-900`}>{headline}</h1>
          ) : (
            <h1 className="text-xl font-semibold text-slate-400">Loading…</h1>
          )}
          <p className="mt-2 text-sm text-slate-600">
            <NewsDeskPublishSummary tenants={tenants} />
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {categoryName ? `${categoryName} · ` : ''}
            {acceptedAt ? formatDeskDate(acceptedAt) : ''}
          </p>
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
          {!loading && stageRow ? <NewsDeskQueueStageBadge row={stageRow} showStep /> : null}
          <div className="flex flex-wrap gap-2 justify-end">
            {canRetry ? (
              <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
                Retry extraction
              </Button>
            ) : null}
            <Link href={paths.post}>
              <Button type="button" variant="secondary" size="sm">
                New intake
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}