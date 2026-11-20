/** Pure helpers for V2 syndication job tenants[] payload (no API imports). */

export const DEFAULT_NEWS_DESK_TENANT_ID =
  process.env.NEXT_PUBLIC_SHORT_NEWS_TENANT_ID || 'cmk7e7tg401ezlp22wkz5rxky'

export function buildTenantsIntakePayload(selectedIds, tenantRows) {
  const map = new Map((tenantRows || []).map((t) => [t.id, t]))
  return (selectedIds || [])
    .map((tenantId) => {
      const row = map.get(tenantId)
      const nativeName = (row?.nativeName || row?.name || '').trim()
      if (!tenantId || !nativeName) return null
      return { tenantId, nativeName }
    })
    .filter(Boolean)
}

export function defaultTenantSelection(tenantRows) {
  const ids = (tenantRows || []).map((t) => t.id)
  if (ids.includes(DEFAULT_NEWS_DESK_TENANT_ID)) return [DEFAULT_NEWS_DESK_TENANT_ID]
  const kaburlu = tenantRows.find(
    (t) => /kaburlu\s*today/i.test(t.name || '') || (t.slug || '').includes('kaburlu'),
  )
  if (kaburlu?.id) return [kaburlu.id]
  return ids.length ? [ids[0]] : []
}