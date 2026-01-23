/**
 * Tenants API Service - Model Layer (MVP Pattern)
 */

import { apiClient } from '../client'

export const tenantsService = {
  async getAll(params = {}) {
    const data = await apiClient.get('/tenants', { full: true, ...params })
    return Array.isArray(data) ? data : (data?.data || [])
  },

  async getById(id) {
    const data = await apiClient.get(`/tenants/${id}`)
    return data?.data || data
  },

  async create(payload) {
    const data = await apiClient.post('/tenants', payload)
    return data?.data || data
  },

  async update(id, payload) {
    const data = await apiClient.patch(`/tenants/${id}`, payload)
    return data?.data || data
  },

  async delete(id) {
    return apiClient.delete(`/tenants/${id}`)
  },

  async verify(id, payload) {
    return apiClient.patch(`/tenants/${id}/verify`, payload)
  },

  // Entity operations
  async getEntities(tenantId) {
    const data = await apiClient.get(`/tenants/${tenantId}/entity`)
    return Array.isArray(data) ? data : (data?.data || [])
  },

  async createEntity(tenantId, payload) {
    return apiClient.post(`/tenants/${tenantId}/entity`, payload)
  },

  async updateEntity(tenantId, entityId, payload) {
    return apiClient.patch(`/tenants/${tenantId}/entity/${entityId}`, payload)
  },

  // Domain operations
  async getDomains(tenantId) {
    const data = await apiClient.get(`/tenants/${tenantId}/domains`)
    return Array.isArray(data) ? data : (data?.data || [])
  },

  async addDomain(tenantId, payload) {
    return apiClient.post(`/tenants/${tenantId}/domains`, payload)
  },

  async verifyDomain(tenantId, domainId) {
    return apiClient.post(`/tenants/${tenantId}/domains/${domainId}/verify`)
  },

  async getDomainSettings(tenantId, domainId) {
    const data = await apiClient.get(`/tenants/${tenantId}/domains/${domainId}/settings`)
    return data?.settings || data?.effective || data
  },

  async updateDomainSettings(tenantId, domainId, settings) {
    return apiClient.patch(`/tenants/${tenantId}/domains/${domainId}/settings`, settings)
  },

  // Categories operations
  async getCategories(tenantId) {
    const data = await apiClient.get(`/tenants/${tenantId}/categories`)
    return Array.isArray(data) ? data : (data?.data || [])
  },

  async linkCategories(tenantId, categoryIds) {
    return apiClient.post(`/tenants/${tenantId}/categories`, { categoryIds })
  }
}

export default tenantsService
