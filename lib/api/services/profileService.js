/**
 * Profile API Service - Model Layer (MVP Pattern)
 * Handles user profile CRUD operations
 */

import { apiClient } from '../client'

export const profileService = {
  /**
   * Get current user's profile
   */
  async getMyProfile() {
    const data = await apiClient.get('/profiles/me')
    return data?.data || data
  },

  /**
   * Create profile for current user
   */
  async createMyProfile(payload) {
    const data = await apiClient.post('/profiles/me', payload)
    return data?.data || data
  },

  /**
   * Update current user's profile
   */
  async updateMyProfile(payload) {
    const data = await apiClient.put('/profiles/me', payload)
    return data?.data || data
  },

  /**
   * Delete current user's profile
   */
  async deleteMyProfile() {
    return apiClient.delete('/profiles/me')
  },

  /**
   * Get profile by user ID (admin only)
   */
  async getByUserId(userId) {
    const data = await apiClient.get(`/profiles/user/${userId}`)
    return data?.data || data
  },

  /**
   * Upload profile photo
   */
  async uploadPhoto(formData) {
    return apiClient.upload('/media/upload', formData)
  }
}

export default profileService
