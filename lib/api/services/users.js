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
  },

  // User Logs/Activity
  async getLogs(userId, params = {}) {
    const data = await apiClient.get(`/users/${userId}/logs`, params)
    return Array.isArray(data) ? data : (data?.data || data?.logs || [])
  },

  async getAllLogs(params = {}) {
    const data = await apiClient.get('/users/logs', params)
    return Array.isArray(data) ? data : (data?.data || data?.logs || [])
  },

  async createLog(userId, payload) {
    const data = await apiClient.post(`/users/${userId}/logs`, payload)
    return data?.data || data
  }
}

export default usersService
