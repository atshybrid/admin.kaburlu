/** Badge color tokens for pipeline / extraction statuses */

export const EXTRACTION_STATUSES = [
  { value: '', label: 'All extraction states' },
  { value: 'EXTRACTION_PENDING', label: 'Pending' },
  { value: 'EXTRACTION_SUCCEEDED', label: 'Succeeded' },
  { value: 'EXTRACTION_FAILED', label: 'Failed' },
]

export const PIPELINE_STATUS_FILTERS = [
  { value: '', label: 'All pipeline states' },
  { value: 'RAW_ACCEPTED', label: 'Raw accepted' },
  { value: 'EXTRACTION_PENDING', label: 'Extraction pending' },
  { value: 'EXTRACTION_SUCCEEDED', label: 'Extraction succeeded' },
  { value: 'EXTRACTION_FAILED', label: 'Extraction failed' },
]

export function extractionStatusColor(status) {
  if (status === 'EXTRACTION_SUCCEEDED') return 'green'
  if (status === 'EXTRACTION_FAILED') return 'red'
  if (status === 'EXTRACTION_PENDING') return 'amber'
  return 'gray'
}

export function pipelineStatusColor(status) {
  if (String(status || '').includes('FAILED')) return 'red'
  if (String(status || '').includes('SUCCEEDED') || status === 'EXTRACTION_SUCCEEDED') return 'green'
  if (String(status || '').includes('PENDING')) return 'amber'
  return 'gray'
}

export function formatPipelineLabel(status) {
  if (!status) return '—'
  return String(status).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}