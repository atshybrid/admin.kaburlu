/**
 * Optional links only — main controls live in WhitelabelThemeStudio + ThemeDualPreview.
 */
import Link from 'next/link'

export default function WebnewsV2ThemePanel({ tenantId, tenantSlug }) {
  return null
}

export function WebnewsV2ThemeLinks({ tenantId, tenantSlug }) {
  const localPreview = tenantSlug
    ? `http://localhost:3002/${encodeURIComponent(tenantSlug)}`
    : 'http://localhost:3002/<tenant-slug>'

  if (!tenantId) return null

  return (
    <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 border">
      Webnews v2 homepage rails are automatic. Menu order:{' '}
      <Link href={`/admin/tenants/${tenantId}/domain-settings`} className="text-brand font-medium underline">
        Domain Settings → Navigation
      </Link>
      {' · '}Live:{' '}
      <a href={localPreview} target="_blank" rel="noreferrer" className="text-brand underline break-all">
        {localPreview}
      </a>
    </p>
  )
}