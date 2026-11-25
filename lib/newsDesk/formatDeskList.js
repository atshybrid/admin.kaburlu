export function formatDeskDate(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    const now = new Date()
    const sameDay =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    if (sameDay) {
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

export function displayHeadline(row) {
  const hl = String(row?.headline || '').trim()
  if (hl && hl.length > 8) return hl
  const preview = String(row?.articlePreview || '').trim()
  if (preview) return preview.length > 90 ? `${preview.slice(0, 87)}…` : preview
  return hl || 'Untitled submission'
}

export function headlineSubtext(row) {
  const hl = String(row?.headline || '').trim()
  const preview = String(row?.articlePreview || '').trim()
  if (hl && preview && hl !== preview && preview.length > hl.length) {
    return preview.length > 72 ? `${preview.slice(0, 69)}…` : preview
  }
  return row?.categoryName || null
}

export function countActiveFilters(filters) {
  let n = 0
  if (filters?.q?.trim()) n += 1
  if (filters?.extractionStatus) n += 1
  if (filters?.pipelineStatus) n += 1
  if (filters?.categoryId) n += 1
  if (filters?.fromDate) n += 1
  if (filters?.toDate) n += 1
  return n
}