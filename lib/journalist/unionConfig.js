/** Default union when tenant has a single union or settings omit unionName. */
export const DEFAULT_UNION_NAME = 'Democratic Journalist Federation (Working)'

export function resolveUnionName(fromApi) {
  const name = String(fromApi || '').trim()
  return name || DEFAULT_UNION_NAME
}
