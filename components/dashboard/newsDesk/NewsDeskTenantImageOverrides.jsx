/**
 * Optional per-tenant cover image at intake (overrides shared gallery order for that publisher).
 */
export default function NewsDeskTenantImageOverrides({
  tenants = [],
  intakeImages = [],
  overrides = {},
  onChange,
  disabled = false,
}) {
  if (!tenants.length) return null

  const sharedPreview = intakeImages[0] || null

  const setOverride = (tenantId, value) => {
    const next = { ...overrides }
    const v = String(value || '').trim()
    if (v) next[tenantId] = v
    else delete next[tenantId]
    onChange?.(next)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-600">
        Optional: pick a different hero per publisher. Empty = use intake order (image #1, then #2…).
      </p>
      <ul className="space-y-2">
        {tenants.map((t) => {
          const id = t.tenantId || t.id
          const value = overrides[id] || ''
          const effective = value || sharedPreview
          return (
            <li
              key={id}
              className="flex flex-wrap items-center gap-2 rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2"
            >
              <span className="text-sm font-medium text-slate-800 min-w-[7rem] truncate" title={t.nativeName || t.name}>
                {t.nativeName || t.name}
              </span>
              <select
                className="flex-1 min-w-[12rem] text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white"
                value={value}
                disabled={disabled || !intakeImages.length}
                onChange={(e) => setOverride(id, e.target.value)}
                aria-label={`Cover image for ${t.nativeName || id}`}
              >
                <option value="">Default (intake order)</option>
                {intakeImages.map((url, i) => (
                  <option key={`${id}-${i}`} value={url}>
                    Image #{i + 1}
                  </option>
                ))}
              </select>
              {effective ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={effective} alt="" className="w-12 h-12 rounded object-cover border border-slate-200" />
              ) : (
                <span className="text-[11px] text-slate-400">No images</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}