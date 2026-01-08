/**
 * Users API Service - Model Layer (MVP Pattern)
 */

import { apiClient } from '../client'

export const usersService = {
  async getAll(params = {}) {
    const data = await apiClient.get('/api/v1/users', params)
    return Array.isArray(data) ? data : (data?.data || [])
  },

  async getById(id) {
    const data = await apiClient.get(`/api/v1/users/${id}`)
    return data?.data || data
  },

  async create(payload) {
    const data = await apiClient.post('/api/v1/users', payload)
    return data?.data || data
  },

  async update(id, payload) {
    const data = await apiClient.patch(`/api/v1/users/${id}`, payload)
    return data?.data || data
  },

  async delete(id) {
    return apiClient.delete(`/api/v1/users/${id}`)
  },

  async updateRole(userId, roleId) {
    return apiClient.patch(`/api/v1/users/${userId}/role`, { roleId })
  },

  async updateStatus(userId, status) {
    return apiClient.patch(`/api/v1/users/${userId}/status`, { status })
  }
}

export default usersService
