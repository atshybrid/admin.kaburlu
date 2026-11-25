import { TELUGU_HEADLINE_CLASS } from '../../../lib/newsDesk/teluguTypography'

const DEFAULT_MAX_ROWS = 25

function trimTelugu(text, max = 72) {
  const s = String(text || '').trim()
  if (s.length <= max) return s
  return `${s.slice(0, max)}…`
}

const HERO_LABELS = {
  tenant_override: 'Tenant hero',
  shared_job: 'Shared image',
  intake_gallery: 'Intake gallery',
}

export default function NewsDeskPublishPreviewTable({
  rows = [],
  liveUrlByTenant = {},
  selectedTenantId,
  onSelect,
  maxRows = DEFAULT_MAX_ROWS,
}) {
  if (!rows.length) return null
  const visible = rows.slice(0, maxRows)
  const allSameTitle = rows.length > 1 && rows.every((r) => r.headline === rows[0].headline)

  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[28rem] rounded-md border border-slate-200">
      <table className="w-full text-xs text-left">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2 font-semibold">Publisher</th>
            <th className="px-3 py-2 font-semibold">Website</th>
            <th className="px-3 py-2 font-semibold min-w-[10rem]">Title (web)</th>
            <th className="px-3 py-2 font-semibold">Hero</th>
            <th className="px-3 py-2 font-semibold">Category</th>
            <th className="px-3 py-2 font-semibold min-w-[9rem]">Slug</th>
            <th className="px-3 py-2 font-semibold">Open</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {visible.map((row) => {
            const live = liveUrlByTenant[row.tenantId]
            const href = live || row.predictedUrl
            const isSelected = selectedTenantId === row.tenantId
            return (
              <tr
                key={row.tenantId}
                className={
                  isSelected
                    ? 'bg-brand/5 cursor-pointer'
                    : 'hover:bg-slate-50/80 cursor-pointer'
                }
                onClick={() => onSelect?.(row.tenantId)}
              >
                <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{row.nativeName}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-slate-600 max-w-[8rem] truncate" title={row.domainName}>
                  {row.domainName?.startsWith('http://localhost') || row.predictedUrl?.includes('localhost')
                    ? 'local'
                    : row.domainName || '—'}
                </td>
                <td className={`px-3 py-2 text-slate-700 max-w-xs ${TELUGU_HEADLINE_CLASS}`}>
                  {allSameTitle && visible.indexOf(row) > 0 ? (
                    <span className="text-slate-400 italic">Same intake copy</span>
                  ) : (
                    trimTelugu(row.headline)
                  )}
                </td>
                <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                  <span className="block">{HERO_LABELS[row.heroSource] || 'Gallery'}</span>
                  {row.coverImageUrl ? (
                    <span className="font-mono text-[9px] text-slate-400 truncate max-w-[7rem] inline-block" title={row.coverImageUrl}>
                      {row.coverImageUrl.replace(/^https?:\/\//, '').slice(0, 28)}…
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                  {row.categoryName || '—'}
                  {row.categorySlug ? (
                    <span className="block font-mono text-[10px] text-slate-400">{row.categorySlug}</span>
                  ) : null}
                </td>
                <td className="px-3 py-2 font-mono text-[10px] text-slate-600 max-w-[14rem] truncate" title={row.predictedSlug}>
                  {row.predictedSlug}
                  {row.slugWarning ? (
                    <span className="block text-amber-800 font-sans normal-case">⚠ {row.slugWarning}</span>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand font-medium hover:underline whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {live ? 'Live ↗' : 'Preview ↗'}
                    </a>
                  ) : (
                    <span className="text-slate-400">No domain</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {rows.length > maxRows ? (
        <p className="text-[11px] text-slate-500 px-3 py-2 border-t border-slate-100">
          Showing {maxRows} of {rows.length} — select row below for full body
        </p>
      ) : null}
    </div>
  )
}