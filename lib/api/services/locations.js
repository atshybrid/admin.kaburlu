/**
 * Locations API Service - Model Layer (MVP Pattern)
 * Handles States, Districts, Mandals, Assembly Constituencies
 */

import { apiClient } from '../client'

export const locationsService = {
  // States
  states: {
    async getAll() {
      const data = await apiClient.get('/api/v1/states')
      return Array.isArray(data) ? data : (data?.data || [])
    },
    async getById(id) {
      return apiClient.get(`/api/v1/states/${id}`)
    },
    async create(payload) {
      return apiClient.post('/api/v1/states', payload)
    },
    async update(id, payload) {
      return apiClient.patch(`/api/v1/states/${id}`, payload)
    },
    async delete(id) {
      return apiClient.delete(`/api/v1/states/${id}`)
    }
  },

  // Districts
  districts: {
    async getAll(stateId) {
      const params = stateId ? { stateId } : {}
      const data = await apiClient.get('/api/v1/districts', params)
      return Array.isArray(data) ? data : (data?.data || [])
    },
    async getById(id) {
      return apiClient.get(`/api/v1/districts/${id}`)
    },
    async create(payload) {
      return apiClient.post('/api/v1/districts', payload)
    },
    async update(id, payload) {
      return apiClient.patch(`/api/v1/districts/${id}`, payload)
    },
    async delete(id) {
      return apiClient.delete(`/api/v1/districts/${id}`)
    }
  },

  // Mandals
  mandals: {
    async getAll(districtId) {
      const params = districtId ? { districtId } : {}
      const data = await apiClient.get('/api/v1/mandals', params)
      return Array.isArray(data) ? data : (data?.data || [])
    },
    async getById(id) {
      return apiClient.get(`/api/v1/mandals/${id}`)
    },
    async create(payload) {
      return apiClient.post('/api/v1/mandals', payload)
    },
    async update(id, payload) {
      return apiClient.patch(`/api/v1/mandals/${id}`, payload)
    },
    async delete(id) {
      return apiClient.delete(`/api/v1/mandals/${id}`)
    }
  },

  // Assembly Constituencies
  constituencies: {
    async getAll(districtId) {
      const params = districtId ? { districtId } : {}
      const data = await apiClient.get('/api/v1/assembly-constituencies', params)
      return Array.isArray(data) ? data : (data?.data || [])
    },
    async getById(id) {
      return apiClient.get(`/api/v1/assembly-constituencies/${id}`)
    },
    async create(payload) {
      return apiClient.post('/api/v1/assembly-constituencies', payload)
    },
    async update(id, payload) {
      return apiClient.patch(`/api/v1/assembly-constituencies/${id}`, payload)
    },
    async delete(id) {
      return apiClient.delete(`/api/v1/assembly-constituencies/${id}`)
    }
  }
}

export default locationsService
