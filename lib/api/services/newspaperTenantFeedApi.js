/**
 * Tenant daily newspaper feed — public tenant-feed + optional authenticated smart-get
 */
import { apiClient } from '../client'

export const newspaperTenantFeedApi = {
  /**
   * GET /public/newspaper-news/tenant-feed (no JWT required)
   */
  getPublicTenantFeed(params = {}) {
    return apiClient.get('/public/newspaper-news/tenant-feed', params)
  },

  /**
   * GET /newspaper-articles/smart-get (JWT + tenantId)
   */
  getSmartFeed(params = {}) {
    return apiClient.get('/newspaper-articles/smart-get', params)
  },
}

export default newspaperTenantFeedApi
