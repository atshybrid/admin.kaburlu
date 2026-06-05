/**
 * Pull editionConfigs[] from any design-config API response shape.
 */
export function extractEditionConfigs(resp) {
  if (!resp || typeof resp !== 'object') return []

  const buckets = [
    resp.editionConfigs,
    resp.designConfig?.editionConfigs,
    resp.data?.editionConfigs,
    resp.data?.designConfig?.editionConfigs,
    resp.config?.editionConfigs,
    resp.config?.designConfig?.editionConfigs,
    resp.result?.editionConfigs,
    resp.result?.designConfig?.editionConfigs,
  ]

  for (const list of buckets) {
    if (Array.isArray(list) && list.length) return list
  }
  return []
}
