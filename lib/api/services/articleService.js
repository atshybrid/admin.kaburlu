/**
 * Article Service - Model Layer (MVP Pattern)
 * Handles article CRUD operations with role-based access control
 */

import { apiClient } from '../client'

export const articleService = {
  /**
   * Create Article - Role-based creation
   * @param {Object} articleData - Article payload
   * @param {string} articleData.tenantId - Required for Super Admin, auto-filled for Tenant Admin/Reporter
   * @param {string} articleData.title - Article title
   * @param {string} articleData.content - Article body/content
   * @param {string} articleData.categoryId - Category ID
   * @param {string} articleData.languageCode - Language code (e.g., 'te', 'en')
   * @param {string} articleData.tags - Comma-separated tags
   * @param {string} articleData.summary - Article summary/excerpt
   * @param {string} articleData.imageUrl - Featured image URL
   * @param {string} articleData.status - Article status (DRAFT, PUBLISHED, etc.)
   * @returns {Promise} Created article object
   */
  async create(articleData) {
    const { tenantId, ...rest } = articleData
    
    // Validate required fields
    if (!tenantId) {
      throw new Error('Tenant ID is required')
    }
    if (!rest.title || !rest.content) {
      throw new Error('Title and content are required')
    }

    return apiClient.post(`/tenants/${tenantId}/articles`, rest)
  },

  /**
   * Get Articles List - Tenant-scoped
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Optional filters (page, limit, status, categoryId)
   * @returns {Promise} Articles array
   */
  async list(tenantId, filters = {}) {
    if (!tenantId) {
      throw new Error('Tenant ID is required')
    }

    const queryParams = new URLSearchParams()
    if (filters.page) queryParams.append('page', filters.page)
    if (filters.limit) queryParams.append('limit', filters.limit)
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.categoryId) queryParams.append('categoryId', filters.categoryId)

    const query = queryParams.toString()
    const endpoint = query 
      ? `/tenants/${tenantId}/articles?${query}`
      : `/tenants/${tenantId}/articles`

    return apiClient.get(endpoint)
  },

  /**
   * Get Single Article
   * @param {string} tenantId - Tenant ID
   * @param {string} articleId - Article ID
   * @returns {Promise} Article object
   */
  async get(tenantId, articleId) {
    if (!tenantId || !articleId) {
      throw new Error('Tenant ID and Article ID are required')
    }

    return apiClient.get(`/tenants/${tenantId}/articles/${articleId}`)
  },

  /**
   * Update Article
   * @param {string} tenantId - Tenant ID
   * @param {string} articleId - Article ID
   * @param {Object} updates - Fields to update
   * @returns {Promise} Updated article object
   */
  async update(tenantId, articleId, updates) {
    if (!tenantId || !articleId) {
      throw new Error('Tenant ID and Article ID are required')
    }

    return apiClient.patch(`/tenants/${tenantId}/articles/${articleId}`, updates)
  },

  /**
   * Delete Article
   * @param {string} tenantId - Tenant ID
   * @param {string} articleId - Article ID
   * @returns {Promise} Deletion confirmation
   */
  async delete(tenantId, articleId) {
    if (!tenantId || !articleId) {
      throw new Error('Tenant ID and Article ID are required')
    }

    return apiClient.delete(`/tenants/${tenantId}/articles/${articleId}`)
  },

  /**
   * Get Categories for Tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise} Categories array
   */
  async getCategories(tenantId) {
    if (!tenantId) {
      throw new Error('Tenant ID is required')
    }

    return apiClient.get(`/tenants/${tenantId}/categories`)
  },

  /**
   * Get Languages (Global)
   * @returns {Promise} Languages array
   */
  async getLanguages() {
    return apiClient.get(`/languages`)
  },

  /**
   * Upload Media (Image/Video)
   * POST /media/upload
   * @param {File} file - Media file
   * @param {Object} metadata - { key: alt text (en), filename: caption (te), kind: 'image' }
   * @returns {Promise} { publicUrl, key, name, contentType, size, kind }
   */
  async uploadMedia(file, metadata = {}) {
    if (!file) {
      throw new Error('File is required')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('key', metadata.key || file.name) // Alt text (English)
    formData.append('filename', metadata.filename || file.name) // Caption (Telugu)
    formData.append('folder', metadata.folder || '') // Optional folder
    formData.append('kind', metadata.kind || 'image') // 'image' or 'video'

    const response = await apiClient.upload('/media/upload', formData)
    
    // Return publicUrl for easy access
    return {
      url: response.publicUrl,
      key: response.key,
      name: response.name,
      contentType: response.contentType,
      size: response.size,
      kind: response.kind
    }
  },

  /**
   * @deprecated Use uploadMedia instead
   * Upload Article Image (legacy)
   */
  async uploadImage(tenantId, file) {
    console.warn('uploadImage is deprecated, use uploadMedia instead')
    return this.uploadMedia(file, { key: file.name, filename: file.name })
  },

  /**
   * Get Unified Articles List
   * GET /articles/unified?tenantId=xxx&type=all&status=PUBLISHED
   * Fetches articles across all types (newspaper, web, shortNews)
   * @param {Object} params - Query parameters
   * @param {string} params.tenantId - Tenant ID (required for SUPER_ADMIN)
   * @param {string} params.type - Article type: 'all', 'newspaper', 'web', 'shortNews' (default: 'all')
   * @param {string} params.status - Filter by status: 'PUBLISHED', 'PENDING', 'REJECTED'
   * @param {string} params.fromDate - From date (YYYY-MM-DD)
   * @param {string} params.toDate - To date (YYYY-MM-DD)
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20)
   * @param {string} params.sortBy - Sort field (default: 'createdAt')
   * @param {string} params.sortOrder - Sort order: 'asc', 'desc' (default: 'desc')
   * @returns {Promise} Articles grouped by type
   */
  async getUnifiedArticles(params = {}) {
    const queryParams = new URLSearchParams()
    
    // Required params
    if (params.tenantId) queryParams.append('tenantId', params.tenantId)
    
    // Optional params with defaults
    queryParams.append('type', params.type || 'all')
    queryParams.append('page', params.page || 1)
    queryParams.append('limit', params.limit || 20)
    queryParams.append('sortBy', params.sortBy || 'createdAt')
    queryParams.append('sortOrder', params.sortOrder || 'desc')
    
    // Filter params
    if (params.status) queryParams.append('status', params.status)
    if (params.fromDate) queryParams.append('fromDate', params.fromDate)
    if (params.toDate) queryParams.append('toDate', params.toDate)
    if (params.domainId) queryParams.append('domainId', params.domainId)

    const response = await apiClient.get(`/articles/unified?${queryParams.toString()}`)
    return response
  },

  /**
   * Create Unified Article (Print + Web + Short News)
   * POST /articles/unified
   * Creates NewspaperArticle, TenantWebArticle, and ShortNews atomically
   * @param {Object} payload - Unified article payload
   * @returns {Promise} Created articles
   */
  async createUnified(payload) {
    // Validate required fields
    if (!payload.tenantId) {
      throw new Error('Tenant ID is required')
    }
    if (!payload.baseArticle?.languageCode) {
      throw new Error('Language code is required')
    }
    if (!payload.printArticle?.headline) {
      throw new Error('Article headline is required')
    }
    if (!payload.printArticle?.body || payload.printArticle.body.length === 0) {
      throw new Error('Article body is required')
    }

    console.log('📤 Creating Unified Article:', {
      tenantId: payload.tenantId,
      headline: payload.printArticle.headline,
      category: payload.baseArticle.category?.categoryName
    })

    return apiClient.post('/articles/unified', payload)
  }
}
