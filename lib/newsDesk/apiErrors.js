export function formatNewsDeskError(error) {
  if (!error) return 'Request failed'
  if (error.code === 'EXTRACTION_ALREADY_COMPLETE') {
    return 'Extraction already completed for this submission.'
  }
  if (error.code === 'EXTRACTION_IN_PROGRESS') {
    return 'Extraction is already in progress. Please wait.'
  }
  if (error.code === 'PIPELINE_NOT_FOUND') {
    return 'No News Desk pipeline found for this job.'
  }
  if (error.status === 401 || error.status === 403) {
    return 'Session expired or access denied. Please sign in again.'
  }
  return error.message || 'News Desk request failed'
}