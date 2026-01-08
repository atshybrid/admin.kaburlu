/**
 * API Services Index - Model Layer (MVP Pattern)
 */

export { apiClient, ApiError } from '../client'
export { tenantsService } from './tenants'
export { usersService } from './users'
export { locationsService } from './locations'

// Common API Services
import { apiClient } from '../client'

export const rolesService = {
  async getAll() {
    const data = await apiClient.get('/api/v1/roles')
    return Array.isArray(data) ? data : (data?.data || [])
  },
  async getById(id) {
    return apiClient.get(`/api/v1/roles/${id}`)
  },
  async create(payload) {
    return apiClient.post('/api/v1/roles', payload)
  },
  async update(id, payload) {
    return apiClient.patch(`/api/v1/roles/${id}`, payload)
  },
  async delete(id) {
    return apiClient.delete(`/api/v1/roles/${id}`)
  }
}

export const categoriesService = {
  async getAll() {
    const data = await apiClient.get('/api/v1/categories')
    return Array.isArray(data) ? data : (data?.data || [])
  },
  async getById(id) {
    return apiClient.get(`/api/v1/categories/${id}`)
  },
  async create(payload) {
    return apiClient.post('/api/v1/categories', payload)
  },
  async update(id, payload) {
    return apiClient.patch(`/api/v1/categories/${id}`, payload)
  },
  async delete(id) {
    return apiClient.delete(`/api/v1/categories/${id}`)
  }
}

export const languagesService = {
  async getAll() {
    const data = await apiClient.get('/api/v1/languages')
    return Array.isArray(data) ? data : (data?.data || [])
  },
  async getById(id) {
    return apiClient.get(`/api/v1/languages/${id}`)
  },
  async create(payload) {
    return apiClient.post('/api/v1/languages', payload)
  },
  async update(id, payload) {
    return apiClient.patch(`/api/v1/languages/${id}`, payload)
  },
  async delete(id) {
    return apiClient.delete(`/api/v1/languages/${id}`)
  }
}

export const reportersService = {
  async getAll(params = {}) {
    const data = await apiClient.get('/api/v1/reporters', params)
    return Array.isArray(data) ? data : (data?.data || [])
  },
  async getById(id) {
    return apiClient.get(`/api/v1/reporters/${id}`)
  },
  async create(payload) {
    return apiClient.post('/api/v1/reporters', payload)
  },
  async update(id, payload) {
    return apiClient.patch(`/api/v1/reporters/${id}`, payload)
  },
  async delete(id) {
    return apiClient.delete(`/api/v1/reporters/${id}`)
  }
}

export const articlesService = {
  async getAll(params = {}) {
    const data = await apiClient.get('/api/v1/articles', params)
    return Array.isArray(data) ? data : (data?.data || [])
  },
  async getById(id) {
    return apiClient.get(`/api/v1/articles/${id}`)
  },
  async create(payload) {
    return apiClient.post('/api/v1/articles', payload)
  },
  async update(id, payload) {
    return apiClient.patch(`/api/v1/articles/${id}`, payload)
  },
  async delete(id) {
    return apiClient.delete(`/api/v1/articles/${id}`)
  },
  async publish(id) {
    return apiClient.post(`/api/v1/articles/${id}/publish`)
  },
  async unpublish(id) {
    return apiClient.post(`/api/v1/articles/${id}/unpublish`)
  }
}
