import Link from 'next/link'
import { Button, Spinner } from '../../../ui'

export default function NewsDeskPublishedList({ items, loading, emptyHint }) {
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
        {emptyHint || 'No published web articles from News Desk syndication yet.'}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
            <th className="px-4 py-3">Article / headline</th>
            <th className="px-4 py-3">Tenant</th>
            <th className="px-4 py-3 hidden md:table-cell">Published</th>
            <th className="px-4 py-3 text-right">Desk job</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((row) => (
            <tr key={`${row.jobId}-${row.tenantId}-${row.webArticleId}`} className="hover:bg-slate-50/80">
              <td className="px-4 py-3 font-medium text-slate-900 max-w-xs">
                <span className="line-clamp-2">{row.webTitle || row.headlinePreview || 'Untitled'}</span>
              </td>
              <td className="px-4 py-3 text-slate-700">{row.tenantNativeName || row.tenantId}</td>
              <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell whitespace-nowrap">
                {row.publishedAt ? new Date(row.publishedAt).toLocaleString() : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                <Link href={`/admin/news-desk/${row.jobId}`}>
                  <Button type="button" variant="outline" className="!py-1 !px-2 text-xs">
                    Open intake
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}