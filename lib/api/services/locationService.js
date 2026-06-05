/**
 * Location Service - Search and resolve locations
 * Handles village, mandal, district, state resolution
 */

import { apiClient } from '../client'

export const locationService = {
  /**
   * Search locations by query text
   * GET /locations/search-combined?q={query}&tenantId={tenantId}
   * @param {string} query - Location search text (Telugu or English)
   * @param {string} tenantId - Tenant ID
   * @param {number} limit - Max results (default: 20)
   * @returns {Promise} Location search results
   */
  async search(query, tenantId, limit = 20) {
    if (!query || !tenantId) {
      throw new Error('Query and tenantId are required')
    }
    return this.searchCombined(query, { tenantId, limit })
  },

  /**
   * GET /locations/search-combined?q=&limit=20
   * Union / admin flows — tenantId optional (API allows null tenant).
   */
  async searchCombined(query, { tenantId, limit = 20 } = {}) {
    if (!query || !String(query).trim()) {
      return { items: [], count: 0 }
    }

    const params = {
      q: String(query).trim(),
      limit: String(limit),
    }
    if (tenantId) params.tenantId = tenantId

    return apiClient.get('/locations/search-combined', params)
  },

  /** Display label for dropdown (district / mandal / village). */
  formatItemLabel(item) {
    if (!item) return ''
    const primary = item.match?.name || item.village?.name || item.mandal?.name || item.district?.name || ''
    const district = item.district?.name
    const state = item.state?.name
    const parts = [primary]
    if (district && district !== primary) parts.push(district)
    if (state) parts.push(state)
    return parts.filter(Boolean).join(', ')
  },

  /** State / mandal strings for union member forms after search-combined pick. */
  fieldsFromPick(item) {
    if (!item) return { state: '', mandal: '' }
    const state = item.state?.name || ''
    let mandal = item.mandal?.name || ''
    if (!mandal && item.type === 'MANDAL') {
      mandal = item.match?.name || ''
    }
    if (!mandal && item.village?.name && item.mandal?.id) {
      mandal = item.mandal.name
    }
    return { state, mandal }
  },

  /** Last 4 digits of mobile for default MPIN. */
  mpinFromMobile(mobile) {
    const digits = String(mobile || '').replace(/\D/g, '')
    return digits.length >= 4 ? digits.slice(-4) : ''
  },

  /**
   * Get best match from search results
   * Returns first result (most relevant)
   */
  getBestMatch(searchResponse) {
    if (!searchResponse?.items || searchResponse.items.length === 0) {
      return null
    }
    return searchResponse.items[0]
  },

  /**
   * Build location resolved object for unified article API
   * @param {Object} match - Location match from search
   * @returns {Object} Resolved location with village/mandal/district/state
   */
  buildResolvedLocation(match) {
    if (!match) {
      return {
        village: {},
        mandal: {},
        district: {},
        state: {}
      }
    }

    return {
      village: match.village ? {
        id: match.village.id,
        name: match.village.name,
        names: match.village.names
      } : {},
      mandal: match.mandal ? {
        id: match.mandal.id,
        name: match.mandal.name,
        names: match.mandal.names
      } : {},
      district: match.district ? {
        id: match.district.id,
        name: match.district.name,
        names: match.district.names
      } : {},
      state: match.state ? {
        id: match.state.id,
        name: match.state.name,
        names: match.state.names
      } : {}
    }
  },

  /**
   * Format dateline from location
   * Format: "LocationNativeName (PublisherName) MonthName Day"
   * Example: "కూకట్‌పల్లి (డాక్సిన్ టైమ్స్) జనవరి 26"
   * @param {Object} match - Location match object
   * @param {string} languageCode - Language code (te/en)
   * @param {string} publisherName - Publisher/tenant native name
   */
  formatDateline(match, languageCode = 'te', publisherName = '') {
    if (!match) return null

    const today = new Date()
    const months = {
      te: ['జనవరి', 'ఫిబ్రవరి', 'మార్చి', 'ఏప్రిల్', 'మే', 'జూన్', 'జూలై', 'ఆగస్టు', 'సెప్టెంబర్', 'అక్టోబర్', 'నవంబర్', 'డిసెంబర్'],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    }

    const monthName = months[languageCode]?.[today.getMonth()] || months.en[today.getMonth()]
    const day = today.getDate()

    // Get place name based on hierarchy (village > mandal > district > state)
    const placeObj = match.village || match.mandal || match.district || match.state || null
    const areaName = placeObj?.name || ''
    const nativeName = placeObj?.names?.[languageCode] || placeObj?.names?.te || ''
    const placeName = nativeName || areaName

    // Format: "LocationNativeName (PublisherName) MonthName Day"
    // e.g., "కూకట్‌పల్లి (డాక్సిన్ టైమ్స్) జనవరి 26"
    let formatted = placeName
    if (publisherName) {
      formatted = `${placeName} (${publisherName}) ${monthName} ${day}`
    } else {
      formatted = `${placeName}, ${monthName} ${day}`
    }

    return {
      placeName,
      areaName,
      nativeName,
      publisherName: publisherName || '',
      date: today.toISOString().split('T')[0],
      formatted
    }
  }
}
