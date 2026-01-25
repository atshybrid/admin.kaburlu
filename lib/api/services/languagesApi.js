/**
 * Languages API Service
 * Handles fetching languages for tenant entity configuration
 */
import { apiClient } from '../client'

export const languagesApi = {
  /**
   * GET /languages
   * Returns list of all languages
   */
  list: async () => {
    const response = await apiClient.get('/languages')
    if (Array.isArray(response)) return response
    if (response?.success && Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.data)) return response.data
    return []
  },
}
