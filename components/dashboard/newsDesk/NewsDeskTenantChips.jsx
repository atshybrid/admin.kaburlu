export default function NewsDeskTenantChips({ tenants = [], max = 2, compact = false, showAll = false }) {
  if (!tenants.length) {
    return (
      <span className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-2 py-1">
        లక్ష్య టెనెంట్ లేదు · No target publishers
      </span>
    )
  }

  const limit = showAll ? tenants.length : max
  const shown = tenants.slice(0, limit)
  const rest = tenants.length - shown.length
  const published = tenants.filter((t) => t.published).length

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${compact || showAll ? '' : 'max-w-[14rem]'}`}>
      {shown.map((t) => (
        <span
          key={t.tenantId}
          className={`inline-flex max-w-[7.5rem] truncate rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${
            t.published
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}
          title={t.nativeName || t.tenantId}
        >
          {t.nativeName || t.tenantId}
        </span>
      ))}
      {rest > 0 ? (
        <span className="text-[11px] font-medium text-slate-500">+{rest}</span>
      ) : null}
      {published > 0 ? (
        <span className="text-[10px] text-emerald-600 font-medium">{published} live</span>
      ) : null}
    </div>
  )
}