/**
 * States API Service
 * Handles fetching states for dropdowns and location data
 */
import { apiClient } from '../client'


export const statesApi = {
  /**
   * GET /states
   * Returns list of all states
   */
  list: async () => {
    const response = await apiClient.get('/states')
    if (Array.isArray(response)) return response
    if (response?.success && Array.isArray(response?.data)) return response.data
    if (Array.isArray(response?.data)) return response.data
    return []
  },
}
