import { useMemo, useState } from 'react'
import { FormField, Input } from '../../ui'

export default function NewsDeskTenantPicker({
  tenants = [],
  selectedIds = [],
  onChange,
  disabled = false,
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tenants
    return tenants.filter(
      (t) =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.nativeName || '').toLowerCase().includes(q) ||
        (t.slug || '').toLowerCase().includes(q),
    )
  }, [tenants, query])

  const toggle = (id) => {
    if (disabled) return
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id))
    else onChange([...selectedIds, id])
  }

  return (
    <FormField
      label="Target tenant(s)"
      required
      hint="V2 intake — job is linked to these tenants for routing / publish (API: tenants[] on create)."
    >
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={disabled}
        placeholder="Search tenant name…"
        className="mb-2"
      />
      <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500">No tenants found.</p>
        ) : (
          filtered.map((t) => (
            <label
              key={t.id}
              className="flex items-start gap-3 rounded-lg border border-transparent hover:border-slate-200 hover:bg-white px-2 py-2 cursor-pointer"
            >
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand/20"
                checked={selectedIds.includes(t.id)}
                onChange={() => toggle(t.id)}
                disabled={disabled}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-900">{t.name}</span>
                {t.nativeName && t.nativeName !== t.name ? (
                  <span className="block text-xs text-slate-500 truncate">{t.nativeName}</span>
                ) : null}
              </span>
            </label>
          ))
        )}
      </div>
      <p className="text-xs text-slate-500 mt-1.5">{selectedIds.length} selected</p>
    </FormField>
  )
}