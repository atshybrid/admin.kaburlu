/** Map GET /platform/newsdesk/analytics → dashboard stat cards. */
export function mapNewsDeskDashboardStats(analytics) {
  const a = analytics?.analytics || analytics
  if (!a || typeof a !== 'object') return null
  const ext = a.extraction || {}
  return {
    total: a.pipelineTotal ?? null,
    pending: ext.pendingApprox ?? null,
    ready: ext.factsSucceeded ?? null,
    failed: ext.queueDead ?? null,
  }
}