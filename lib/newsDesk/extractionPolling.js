export const TERMINAL_EXTRACTION_STATUSES = new Set(['EXTRACTION_SUCCEEDED', 'EXTRACTION_FAILED'])

export function isTerminalExtractionStatus(status) {
  return TERMINAL_EXTRACTION_STATUSES.has(String(status || ''))
}

export function shouldPollExtraction(status) {
  return Boolean(status) && !isTerminalExtractionStatus(status)
}