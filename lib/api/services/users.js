/**
 * Users API Service - Model Layer (MVP Pattern)
 */

import { apiClient } from '../client'

export const usersService = {
  async getAll(params = {}) {
    const data = await apiClient.get('/users', params)
    return Array.isArray(data) ? data : (data?.data || [])
  },

  async getById(id) {
    const data = await apiClient.get(`/users/${id}`)
    return data?.data || data
  },

  async create(payload) {
    const data = await apiClient.post('/users', payload)
    return data?.data || data
  },

  async update(id, payload) {
    const data = await apiClient.patch(`/users/${id}`, payload)
    return data?.data || data
  },

  async delete(id) {
    return apiClient.delete(`/users/${id}`)
  },

  async updateRole(userId, roleId) {
    return apiClient.patch(`/users/${userId}/role`, { roleId })
  },

  async updateStatus(userId, status) {
    return apiClient.patch(`/users/${userId}/status`, { status })
  }
}

export default usersService
