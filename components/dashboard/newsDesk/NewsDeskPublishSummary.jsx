/** One-line publish summary — avoids per-tenant status clutter in the list. */
export default function NewsDeskPublishSummary({ tenants = [] }) {
  if (!tenants.length) {
    return <span className="text-xs text-amber-800">No target papers — set on review</span>
  }
  const live = tenants.filter((t) => t.published).length
  const names = tenants
    .slice(0, 3)
    .map((t) => t.nativeName || t.tenantId)
    .join(', ')
  const more = tenants.length > 3 ? ` +${tenants.length - 3}` : ''
  if (live === tenants.length) {
    return (
      <span className="text-xs text-emerald-800 font-medium">
        Live · {names}
        {more}
      </span>
    )
  }
  if (live > 0) {
    return (
      <span className="text-xs text-slate-700">
        {live}/{tenants.length} live · {names}
        {more}
      </span>
    )
  }
  return (
    <span className="text-xs text-slate-600" title={tenants.map((t) => t.nativeName).join(', ')}>
      {tenants.length} paper{tenants.length === 1 ? '' : 's'} · {names}
      {more} · not live yet
    </span>
  )
}