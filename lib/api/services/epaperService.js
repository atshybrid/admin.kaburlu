/**
 * ePaper API Service - Complete ePaper management
 * Handles PDF issues, editions, clips, and domain settings
 */

import { apiClient } from '../client'

export const epaperService = {
  /**
   * List ePaper Issues
   * GET /epaper/issues/all-by-date
   */
  async listIssues(tenantId, fromDate, toDate, editionId = null) {
    const params = new URLSearchParams({
      tenantId,
      fromDate,
      toDate
    })
    if (editionId) params.append('editionId', editionId)
    
    return apiClient.get(`/epaper/issues/all-by-date?${params.toString()}`)
  },

  /**
   * Get Issue by Date
   * GET /epaper/issues/by-date
   */
  async getIssueByDate(tenantId, date, editionId) {
    const params = new URLSearchParams({
      tenantId,
      date,
      editionId
    })
    
    return apiClient.get(`/epaper/issues/by-date?${params.toString()}`)
  },

  /**
   * Upload ePaper Issue (PDF)
   * POST /epaper/issues
   */
  async uploadIssue(formData) {
    // Use multipart/form-data for file upload
    return fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://app.kaburlumedia.com/api/v1'}/epaper/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('kab_admin_auth') || '{}').token || ''}`
      },
      body: formData
    }).then(res => {
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
      return res.json()
    })
  },

  /**
   * Delete ePaper Issue
   * DELETE /epaper/issues/{issueId}
   */
  async deleteIssue(issueId) {
    return apiClient.delete(`/epaper/issues/${issueId}`)
  },

  /**
   * List Editions
   * GET /tenants/{tenantId}/epaper/editions
   */
  async listEditions(tenantId) {
    return apiClient.get(`/tenants/${tenantId}/epaper/editions`)
  },

  /**
   * Create Edition
   * POST /tenants/{tenantId}/epaper/editions
   */
  async createEdition(tenantId, data) {
    return apiClient.post(`/tenants/${tenantId}/epaper/editions`, data)
  },

  /**
   * Update Edition
   * PATCH /tenants/{tenantId}/epaper/editions/{editionId}
   */
  async updateEdition(tenantId, editionId, data) {
    return apiClient.patch(`/tenants/${tenantId}/epaper/editions/${editionId}`, data)
  },

  /**
   * Delete Edition
   * DELETE /tenants/{tenantId}/epaper/editions/{editionId}
   */
  async deleteEdition(tenantId, editionId) {
    return apiClient.delete(`/tenants/${tenantId}/epaper/editions/${editionId}`)
  },

  /**
   * Get ePaper Domain Settings
   * GET /tenants/{tenantId}/domains/{domainId}/settings
   */
  async getSettings(tenantId, domainId) {
    return apiClient.get(`/tenants/${tenantId}/domains/${domainId}/settings`)
  },

  /**
   * Update ePaper Domain Settings
   * PATCH /tenants/{tenantId}/domains/{domainId}/settings
   */
  async updateSettings(tenantId, domainId, settings) {
    return apiClient.patch(`/tenants/${tenantId}/domains/${domainId}/settings`, settings)
  }
}
