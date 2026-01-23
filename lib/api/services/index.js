/**
 * API Services Index - Model Layer (MVP Pattern)
 */

export { apiClient, ApiError } from '../client'
export { tenantsService } from './tenants'
export { usersService } from './users'
export { locationsService } from './locations'
export { aiArticleService } from './aiArticleService'

// Common API Services
import { apiClient } from '../client'

export const rolesService = {
  async getAll() {
    const data = await apiClient.get('/roles')
    return Array.isArray(data) ? data : (data?.data || [])
  },
  async getById(id) {
    return apiClient.get(`/roles/${id}`)
  },
  async create(payload) {
    return apiClient.post('/roles', payload)
  },
  async update(id, payload) {
    return apiClient.patch(`/roles/${id}`, payload)
  },
  async delete(id) {
    return apiClient.delete(`/roles/${id}`)
  }
}

export const categoriesService = {
  async getAll() {
    const data = await apiClient.get('/categories')
    return Array.isArray(data) ? data : (data?.data || [])
  },
  async getById(id) {
    return apiClient.get(`/categories/${id}`)
  },
  async create(payload) {
    return apiClient.post('/categories', payload)
  },
  async update(id, payload) {
    return apiClient.patch(`/categories/${id}`, payload)
  },
  async delete(id) {
    return apiClient.delete(`/categories/${id}`)
  }
}

export const languagesService = {
  async getAll() {
    const data = await apiClient.get('/languages')
    return Array.isArray(data) ? data : (data?.data || [])
  },
  async getById(id) {
    return apiClient.get(`/languages/${id}`)
  },
  async create(payload) {
    return apiClient.post('/languages', payload)
  },
  async update(id, payload) {
    return apiClient.patch(`/languages/${id}`, payload)
  },
  async delete(id) {
    return apiClient.delete(`/languages/${id}`)
  }
}

export const reportersService = {
  async getAll(params = {}) {
    const data = await apiClient.get('/reporters', params)
    return Array.isArray(data) ? data : (data?.data || [])
  },
  async getById(id) {
    return apiClient.get(`/reporters/${id}`)
  },
  async create(payload) {
    return apiClient.post('/reporters', payload)
  },
  async update(id, payload) {
    return apiClient.patch(`/reporters/${id}`, payload)
  },
  async delete(id) {
    return apiClient.delete(`/reporters/${id}`)
  }
}

export const articlesService = {
  async getAll(params = {}) {
    const data = await apiClient.get('/articles', params)
    return Array.isArray(data) ? data : (data?.data || [])
  },
  async getById(id) {
    return apiClient.get(`/articles/${id}`)
  },
  async create(payload) {
    return apiClient.post('/articles', payload)
  },
  async update(id, payload) {
    return apiClient.patch(`/articles/${id}`, payload)
  },
  async delete(id) {
    return apiClient.delete(`/articles/${id}`)
  },
  async publish(id) {
    return apiClient.post(`/articles/${id}/publish`)
  },
  async unpublish(id) {
    return apiClient.post(`/articles/${id}/unpublish`)
  }
}
