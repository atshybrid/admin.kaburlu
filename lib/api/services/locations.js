/**
 * Locations API Service - Model Layer (MVP Pattern)
 * Handles States, Districts, Mandals, Assembly Constituencies
 */

import { apiClient } from '../client'

export const locationsService = {
  // States
  states: {
    async getAll() {
      const data = await apiClient.get('/states')
      return Array.isArray(data) ? data : (data?.data || [])
    },
    async getById(id) {
      return apiClient.get(`/states/${id}`)
    },
    async create(payload) {
      return apiClient.post('/states', payload)
    },
    async update(id, payload) {
      return apiClient.patch(`/states/${id}`, payload)
    },
    async delete(id) {
      return apiClient.delete(`/states/${id}`)
    }
  },

  // Districts
  districts: {
    async getAll(stateId) {
      const params = stateId ? { stateId } : {}
      const data = await apiClient.get('/districts', params)
      return Array.isArray(data) ? data : (data?.data || [])
    },
    async getById(id) {
      return apiClient.get(`/districts/${id}`)
    },
    async create(payload) {
      return apiClient.post('/districts', payload)
    },
    async update(id, payload) {
      return apiClient.patch(`/districts/${id}`, payload)
    },
    async delete(id) {
      return apiClient.delete(`/districts/${id}`)
    }
  },

  // Mandals
  mandals: {
    async getAll(districtId) {
      const params = districtId ? { districtId } : {}
      const data = await apiClient.get('/mandals', params)
      return Array.isArray(data) ? data : (data?.data || [])
    },
    async getById(id) {
      return apiClient.get(`/mandals/${id}`)
    },
    async create(payload) {
      return apiClient.post('/mandals', payload)
    },
    async update(id, payload) {
      return apiClient.patch(`/mandals/${id}`, payload)
    },
    async delete(id) {
      return apiClient.delete(`/mandals/${id}`)
    }
  },

  // Assembly Constituencies
  constituencies: {
    async getAll(districtId) {
      const params = districtId ? { districtId } : {}
      const data = await apiClient.get('/assembly-constituencies', params)
      return Array.isArray(data) ? data : (data?.data || [])
    },
    async getById(id) {
      return apiClient.get(`/assembly-constituencies/${id}`)
    },
    async create(payload) {
      return apiClient.post('/assembly-constituencies', payload)
    },
    async update(id, payload) {
      return apiClient.patch(`/assembly-constituencies/${id}`, payload)
    },
    async delete(id) {
      return apiClient.delete(`/assembly-constituencies/${id}`)
    }
  }
}

export default locationsService
