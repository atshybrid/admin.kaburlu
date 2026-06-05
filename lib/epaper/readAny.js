/** Resolve first non-empty nested path on an object (shared by ePaper mappers). */
export function getByPath(obj, path) {
  if (!obj || !path) return undefined
  return String(path)
    .split('.')
    .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj)
}

export function readAny(obj, paths, fallback = '') {
  for (const path of paths) {
    const value = getByPath(obj, path)
    if (value !== undefined && value !== null && value !== '') return value
  }
  return fallback
}
