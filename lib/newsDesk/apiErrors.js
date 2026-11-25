export function formatNewsDeskError(error) {
  if (!error) return 'Request failed'
  if (error.code === 'EXTRACTION_ALREADY_COMPLETE') {
    return 'Extraction already completed for this submission.'
  }
  if (error.code === 'EXTRACTION_IN_PROGRESS') {
    return 'Extraction is already in progress. Please wait.'
  }
  if (error.code === 'PIPELINE_IN_PROGRESS') {
    return 'V2 pipeline is active — legacy Generate is blocked. Use Publish web on the News Desk detail page after extraction and tenant approval.'
  }
  if (error.code === 'EXTRACTION_NOT_READY') {
    return 'Facts extraction must finish successfully before web publish.'
  }
  if (error.code === 'LEGACY_USE_SYNDICATION_PUBLISH') {
    return 'This job has no V2 pipeline — publish from Platform Syndication after Generate.'
  }
  if (error.code === 'V2_USE_PUBLISH_WEB') {
    return 'This is a V2 job — use Publish web on the News Desk detail page, not legacy syndication publish.'
  }
  if (error.code === 'PUBLISH_APPROVAL_OVERRIDE_DENIED') {
    return 'You cannot bypass editorial approval — only NEWS_DESK_ADMIN or publish_override permission.'
  }
  if (error.code === 'TENANT_PUBLISH_IN_PROGRESS') {
    return 'Publish is already running for this tenant. Wait a moment and refresh.'
  }
  if (error.code === 'TENANT_ALREADY_PUBLISHED' || error.code === 'ALREADY_PUBLISHED') {
    return 'This tenant (or job) is already published.'
  }
  if (error.code === 'EDITORIAL_NOT_APPROVED') {
    return 'Approve the tenant in the table below before publishing.'
  }
  if (error.code === 'PIPELINE_NOT_FOUND') {
    return 'No News Desk pipeline for this job yet. If intake just failed V2, restart the API with NEWS_DESK_PIPELINE_V2=true and refresh.'
  }
  if (error.code === 'SNAPSHOT_NOT_FOUND' || error.code === 'JOB_NOT_FOUND') {
    return 'Job not found (404). Wrong link or job deleted — open the list and pick a valid intake.'
  }
  if (error.status === 404) {
    return 'Not found (404). Restart local API (port 3011) if you just pulled changes, then refresh.'
  }
  if (/newsDeskOperatorProfile|NewsDeskOperatorProfile/i.test(String(error.message || ''))) {
    return 'News Desk API needs a database update — run backend migration `20261120150000_newsdesk_operator_profile` on api.kaburlumedia.com and redeploy the API (not the admin site).'
  }
  if (error.status === 401 || error.status === 403) {
    if (error.code === 'SYNDICATION_ACCESS_DISABLED') {
      return 'News Desk access is disabled for your account — ask an admin to enable syndication staff.'
    }
    return 'Session expired or access denied. Please sign in again.'
  }
  if (error.code === 'INVALID_CATEGORY' || /categoryId not found/i.test(String(error.message || ''))) {
    return 'Category not found on server — pick another category or contact admin to sync categories.'
  }
  if (error.code === 'INVALID_TENANT') {
    return 'Invalid tenant selected — refresh the page and pick tenants again.'
  }
  return error.message || 'News Desk request failed'
}