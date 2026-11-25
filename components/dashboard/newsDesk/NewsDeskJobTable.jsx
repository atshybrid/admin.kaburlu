import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, EmptyState, Spinner, StatusBadge } from '../../ui'
import Pagination from '../../ui/Pagination.jsx'
import { displayHeadline, formatDeskDate } from '../../../lib/newsDesk/formatDeskList'
import NewsDeskPublishSummary from './NewsDeskPublishSummary'
import NewsDeskQueueStageBadge from './NewsDeskQueueStageBadge'
import { IconEye } from '../../ui/icons'

function shortUrl(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return String(url).slice(0, 32)
  }
}

function TableSkeleton() {
  return (
    <tbody className="divide-y divide-slate-100">
      {[1, 2, 3, 4].map((i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-4" colSpan={6}>
            <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
            <div className="h-3 bg-slate-50 rounded w-1/2" />
          </td>
        </tr>
      ))}
    </tbody>
  )
}

export default function NewsDeskJobTable({
  items,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  basePath = '/admin/news-room',
  highlightJobId = '',
  listTitle = 'Queue',
  showPagination = true,
}) {
  const router = useRouter()
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))

  const openJob = (jobId) => {
    if (jobId) router.push(`${basePath.replace(/\/$/, '')}/${jobId}`)
  }

  if (loading && !items.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3">Story</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Targets</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <TableSkeleton />
          </table>
        </div>
        <div className="flex justify-center py-16 md:hidden">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  if (!loading && !items.length) {
    return (
      <EmptyState
        title="No News Desk submissions"
        subtitle="Try adjusting filters or create a new intake."
        className="py-20 rounded-xl border border-slate-200 bg-white"
      />
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-100 bg-white">
        <p className="text-sm font-semibold text-slate-900">{listTitle}</p>
        <p className="text-xs text-slate-500 tabular-nums">
          {loading ? '…' : `${total} total`}
        </p>
      </div>

      <ul className="md:hidden divide-y divide-slate-100">
        {items.map((row) => (
          <li key={row.jobId}>
            <button
              type="button"
              className="w-full text-left px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              onClick={() => openJob(row.jobId)}
            >
              <p className="font-semibold text-slate-900 line-clamp-2 text-[15px] leading-snug">
                {displayHeadline(row)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {row.categoryName || '—'} · {formatDeskDate(row.createdAt)}
              </p>
              <div className="mt-2">
                <NewsDeskPublishSummary tenants={row.targetTenants} />
              </div>
              <div className="mt-2">
                <NewsDeskQueueStageBadge row={row} showStep={false} />
              </div>
            </button>
          </li>
        ))}
      </ul>

      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm table-fixed w-full">
          <colgroup>
            <col className="w-[min(38%,440px)]" />
            <col className="w-[18%]" />
            <col className="w-[16%]" />
            <col className="w-[10%]" />
            <col className="w-[48px]" />
          </colgroup>
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-100">
              <th className="px-4 py-2.5">Story</th>
              <th className="px-4 py-2.5">Papers</th>
              <th className="px-4 py-2.5">Step</th>
              <th className="px-4 py-2.5">Time</th>
              <th className="px-2 py-2.5" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((row) => {
              const source = shortUrl(row.sourceUrl)
              const highlighted = highlightJobId && row.jobId === highlightJobId
              return (
                <tr
                  key={row.jobId}
                  className={`group hover:bg-slate-50/80 cursor-pointer transition-colors ${
                    highlighted ? 'bg-brand/5 ring-1 ring-inset ring-brand/30' : ''
                  }`}
                  onClick={() => openJob(row.jobId)}
                >
                  <td className="px-4 py-3 align-middle">
                    <p className="font-medium text-slate-900 line-clamp-2 leading-snug text-[13px] group-hover:text-brand">
                      {displayHeadline(row)}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-slate-500">
                      {row.categoryName ? <span>{row.categoryName}</span> : null}
                      {source ? (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="truncate max-w-[10rem]">{source}</span>
                        </>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <NewsDeskPublishSummary tenants={row.targetTenants} />
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <NewsDeskQueueStageBadge row={row} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 align-middle text-xs whitespace-nowrap tabular-nums">
                    {formatDeskDate(row.createdAt)}
                  </td>
                  <td className="px-2 py-3 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                    <Link href={`${basePath.replace(/\/$/, '')}/${row.jobId}`}>
                      <Button
                        type="button"
                        variant="outline"
                        className="!p-2 min-w-[36px] min-h-[36px]"
                        aria-label="View submission"
                      >
                        <IconEye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-100 bg-slate-50/40">
          <p className="text-xs text-slate-500 tabular-nums">
            Page {page} of {totalPages}
          </p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      ) : null}
    </div>
  )
}