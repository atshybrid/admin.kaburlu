/**
 * Tenant reporter insights (JWT) — print split, web views, monthly work report.
 * audience: field reporters vs syndicate employees (STATE_NEWS_MODERATOR).
 */
import { apiClient } from '../client'

export const reporterInsightsApi = {
  /** GET /tenant-reporter-insights/print-news — audience=split|field|moderator */
  getPrintNews(params = {}) {
    return apiClient.get('/tenant-reporter-insights/print-news', params)
  },

  /** GET /tenant-reporter-insights/web-views — month=YYYY-MM, audience=field|moderator */
  getWebViews(params = {}) {
    return apiClient.get('/tenant-reporter-insights/web-views', params)
  },

  /** GET /tenant-reporter-insights/work-report — month=YYYY-MM, audience=field|moderator */
  getWorkReport(params = {}) {
    return apiClient.get('/tenant-reporter-insights/work-report', params)
  },
}

export default reporterInsightsApi
