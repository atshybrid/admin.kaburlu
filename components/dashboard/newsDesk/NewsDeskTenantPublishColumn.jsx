import NewsDeskTenantChips from './NewsDeskTenantChips'

function rowLabel(t) {
  const name = t.nativeName || t.tenantId
  if (t.published) return `${name} · Published`
  const review = t.reviewStatus ? String(t.reviewStatus).replace(/_/g, ' ').toLowerCase() : 'intake only'
  return `${name} · ${review}`
}

/** One intake → many tenants; makes "ee article ekkada post aindi" obvious */
export default function NewsDeskTenantPublishColumn({ tenants = [], jobStatus, compact = false }) {
  if (!tenants.length) {
    return <span className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1">No tenant targets</span>
  }

  if (compact) {
    return <NewsDeskTenantChips tenants={tenants} max={2} />
  }

  const jobPub = String(jobStatus || '').toUpperCase() === 'PUBLISHED'

  return (
    <div className="space-y-1.5 max-w-[15rem]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Posted to {jobPub ? '(job published)' : '(draft)'}
      </p>
      <ul className="space-y-1">
        {tenants.map((t) => (
          <li
            key={t.tenantId}
            className={`text-xs leading-snug rounded-md px-2 py-1 border ${
              t.published
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
            title={rowLabel(t)}
          >
            <span className="font-medium block truncate">{t.nativeName || t.tenantId}</span>
            <span className="text-[10px] opacity-80">
              {t.published ? 'Live on site' : t.reviewStatus ? String(t.reviewStatus).replace(/_/g, ' ') : 'Not published yet'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}