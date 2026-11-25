import { useState } from 'react'

const PREVIEW = 2

/**
 * Compact tenant routing — avoids 8-row table explosion (expand for full list).
 */
export default function NewsDeskTenantTargetsCell({ tenants = [], stopPropagation = true }) {
  const [expanded, setExpanded] = useState(false)

  if (!tenants.length) {
    return (
      <span className="inline-flex text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-2 py-1">
        No targets
      </span>
    )
  }

  const live = tenants.filter((t) => t.published).length
  const preview = expanded ? tenants : tenants.slice(0, PREVIEW)
  const rest = tenants.length - PREVIEW

  const onToggle = (e) => {
    if (stopPropagation) e.stopPropagation()
    setExpanded((v) => !v)
  }

  return (
    <div className="max-w-[11rem]">
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
          {tenants.length} tenant{tenants.length === 1 ? '' : 's'}
        </span>
        {live > 0 ? (
          <span className="text-[10px] font-medium text-emerald-700">{live} live</span>
        ) : (
          <span className="text-[10px] text-slate-400">draft</span>
        )}
      </div>
      <ul className="space-y-1" aria-label="Target tenants">
        {preview.map((t) => (
          <li key={t.tenantId} className="flex items-start gap-1.5 min-w-0">
            <span
              className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${t.published ? 'bg-emerald-500' : 'bg-slate-300'}`}
              aria-hidden
            />
            <span className="min-w-0">
              <span className="block text-[11px] font-medium text-slate-800 truncate" title={t.nativeName}>
                {t.nativeName || t.tenantId}
              </span>
              {!t.published && t.reviewStatus ? (
                <span className="block text-[10px] text-slate-500 truncate">
                  {String(t.reviewStatus).replace(/_/g, ' ').toLowerCase()}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      {rest > 0 ? (
        <button
          type="button"
          className="mt-1.5 text-[11px] font-medium text-brand hover:underline"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          {expanded ? 'Show less' : `View all ${tenants.length}`}
        </button>
      ) : null}
    </div>
  )
}