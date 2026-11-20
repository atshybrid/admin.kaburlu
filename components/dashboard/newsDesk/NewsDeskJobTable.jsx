import Link from 'next/link'
import { Button, EmptyState, Spinner, StatusBadge } from '../../ui'
import Pagination from '../../ui/Pagination.jsx'
import { extractionStatusColor, formatPipelineLabel, pipelineStatusColor } from '../../../lib/newsDesk/statusBadges'
import { IconEye } from '../../ui/icons'

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function shortUrl(url) {
  if (!url) return '—'
  const s = String(url)
  if (s.length <= 48) return s
  return `${s.slice(0, 45)}…`
}

export default function NewsDeskJobTable({ items, loading, page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))

  if (loading && !items.length) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!loading && !items.length) {
    return (
      <EmptyState
        title="No News Desk submissions"
        subtitle="Try adjusting filters or create a new intake."
        className="py-16"
      />
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Headline</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 hidden lg:table-cell">Source</th>
              <th className="px-4 py-3">Extraction</th>
              <th className="px-4 py-3 hidden md:table-cell">Pipeline</th>
              <th className="px-4 py-3 hidden xl:table-cell">Created</th>
              <th className="px-4 py-3 hidden xl:table-cell">Updated</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((row) => (
              <tr key={row.jobId} className="hover:bg-slate-50/80">
                <td className="px-4 py-3 font-medium text-slate-900 max-w-xs">
                  <span className="line-clamp-2">{row.headline || 'Untitled'}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{row.categoryName || '—'}</td>
                <td className="px-4 py-3 text-slate-500 hidden lg:table-cell max-w-[10rem] truncate" title={row.sourceUrl || ''}>
                  {shortUrl(row.sourceUrl)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={formatPipelineLabel(row.extractionStatus)}
                    color={extractionStatusColor(row.extractionStatus)}
                  />
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <StatusBadge
                    status={formatPipelineLabel(row.pipelineStatus)}
                    color={pipelineStatusColor(row.pipelineStatus)}
                  />
                </td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap hidden xl:table-cell">
                  {formatDate(row.createdAt)}
                </td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap hidden xl:table-cell">
                  {formatDate(row.updatedAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/news-desk/${row.jobId}`}>
                    <Button type="button" variant="outline" className="!py-1.5 !px-3 text-xs">
                      <IconEye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          {total} total · page {page} of {totalPages}
        </p>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  )
}