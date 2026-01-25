import { apiClient } from '../client'

export const entityApi = {
  // Create entity for a tenant
  create: async (tenantId, entityData) => {
    const response = await apiClient.post(`/tenants/${tenantId}/entity`, entityData)
    return response?.success ? response.data : response
  },

  // Update entity for a tenant
  update: async (tenantId, entityData) => {
    const response = await apiClient.put(`/tenants/${tenantId}/entity`, entityData)
    return response?.success ? response.data : response
  },

  // Get entity details for a tenant
  get: async (tenantId) => {
    const response = await apiClient.get(`/tenants/${tenantId}/entity`)
    return response?.success ? response.data : response
  },

  // Update native name for entity
  updateNativeName: async (tenantId, nativeName) => {
    const response = await apiClient.put(`/tenants/${tenantId}/entity/native-name`, { nativeName })
    return response?.success ? response.data : response
  }
}
