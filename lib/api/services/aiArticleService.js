/**
 * AI Article Service - Model Layer (MVP Pattern)
 * Handles AI rewrite and auto-resolution logic for articles
 */

import { apiClient } from '../client'

export const aiArticleService = {
  /**
   * AI Rewrite API - Process raw news into structured article
   * @param {Object} payload - Full AI request payload
   * @param {string} payload.rawText - Raw news text from reporter
   * @param {string} payload.tenantId - Tenant ID for context
   * @param {string} payload.languageCode - Language code (e.g., 'te', 'en')
   * @param {Array} payload.categories - Optional category names for context
   * @param {string} payload.newspaperName - Optional newspaper name
   * @param {Object} payload.language - Optional language details
   * @returns {Promise} AI structured response with all fields
   */
  async rewrite(payload) {
    return apiClient.post('/ai/rewrite/unified', payload)
  },

  /**
   * Location Search API - Tenant-aware geo search
   * @param {string} query - Place name to search (e.g., "హైదరాబాద్")
   * @param {string} tenantId - Tenant ID for geo mapping
   * @param {string} languageCode - Language code
   * @returns {Promise} Array of location matches
   */
  async searchLocation(query, tenantId, languageCode) {
    return apiClient.post('/location/search', {
      q: query,
      lang: languageCode,
      tenantId
    })
  },

  /**
   * Category Match Helper - Find category by name
   * @param {string} categoryName - AI detected category name
   * @param {Array} categories - Available categories list
   * @returns {Object|null} Matched category or null
   */
  matchCategory(categoryName, categories) {
    if (!categoryName || !Array.isArray(categories)) return null
    
    const normalizedName = categoryName.toLowerCase().trim()
    
    // Exact match first
    const exactMatch = categories.find(
      c => (c.name || '').toLowerCase().trim() === normalizedName
    )
    if (exactMatch) return exactMatch

    // Fallback: partial match
    const partialMatch = categories.find(
      c => (c.name || '').toLowerCase().includes(normalizedName) ||
           normalizedName.includes((c.name || '').toLowerCase())
    )
    return partialMatch || null
  },

  /**
   * Build Dateline String - Auto-format from location and date
   * @param {Object} location - Resolved location object
   * @param {string} dateStr - Date string from AI
   * @param {string} publisherName - Publisher name
   * @returns {string} Formatted dateline
   */
  buildDateline(location, dateStr, publisherName) {
    const parts = []
    
    if (location?.nativeName || location?.name) {
      parts.push(location.nativeName || location.name)
    }
    
    if (dateStr) {
      parts.push(dateStr)
    }
    
    if (publisherName) {
      parts.push(`(${publisherName})`)
    }
    
    return parts.join(', ')
  },

  /**
   * Calculate Publish Readiness - Based on completion percentage
   * @param {number} completionPercentage - AI completion score
   * @returns {string} Status: 'AI_APPROVED' or 'REVIEW_REQUIRED'
   */
  getPublishStatus(completionPercentage) {
    const completion = Number(completionPercentage) || 0
    return completion >= 80 ? 'AI_APPROVED' : 'REVIEW_REQUIRED'
  },

  /**
   * Extract Domain ID from Tenant Data
   * @param {Object} tenant - Tenant object
   * @returns {string|null} Domain ID
   */
  extractDomainId(tenant) {
    if (!tenant) return null
    
    // Try different possible structures
    return (
      tenant.domainId ||
      tenant.primaryDomainId ||
      tenant.domains?.[0]?.id ||
      tenant.domain?.id ||
      null
    )
  }
}
