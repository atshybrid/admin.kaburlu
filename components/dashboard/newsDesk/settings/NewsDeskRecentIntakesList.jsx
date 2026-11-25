import Link from 'next/link'
import { Button, Spinner, StatusBadge } from '../../../ui'
import { displayHeadline, formatDeskDate } from '../../../../lib/newsDesk/formatDeskList'
import { extractionStatusColor, formatPipelineLabel } from '../../../../lib/newsDesk/statusBadges'
import NewsDeskTenantTargetsCell from '../NewsDeskTenantTargetsCell'

export default function NewsDeskRecentIntakesList({ items, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    )
  }

  if (!items?.length) {
    return (
      <p className="text-sm text-slate-600 py-6 text-center border border-dashed border-slate-200 rounded-xl">
        No News Desk intakes yet.{' '}
        <Link href="/admin/news-desk/create" className="text-brand font-medium hover:underline">
          Create intake
        </Link>
      </p>
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((row) => (
        <li
          key={row.jobId}
          className="px-4 py-3 flex flex-wrap gap-4 justify-between hover:bg-slate-50/80 transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900 line-clamp-2">{displayHeadline(row)}</p>
            <p className="text-xs text-slate-500 mt-1">{formatDeskDate(row.createdAt)} · {row.categoryName || '—'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <StatusBadge
                status={formatPipelineLabel(row.extractionStatus)}
                color={extractionStatusColor(row.extractionStatus)}
              />
              <StatusBadge status={String(row.syndicationStatus || 'DRAFT')} color="gray" />
            </div>
          </div>
          <div className="w-full sm:w-44 shrink-0">
            <NewsDeskTenantTargetsCell tenants={row.targetTenants} stopPropagation={false} />
          </div>
          <Link href={`/admin/news-desk/${row.jobId}`}>
            <Button type="button" variant="outline" className="!py-1.5">
              Review
            </Button>
          </Link>
        </li>
      ))}
    </ul>
  )
}