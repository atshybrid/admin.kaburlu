/**
 * ID card settings — per-tenant validity & branding
 * GET/PUT /tenants/:tenantId/id-card-settings
 */
import { apiClient } from '../client'

export const idCardSettingsApi = {
  get: (tenantId) =>
    apiClient.get(`/tenants/${encodeURIComponent(tenantId)}/id-card-settings`),

  upsert: (tenantId, body) =>
    apiClient.put(`/tenants/${encodeURIComponent(tenantId)}/id-card-settings`, body),
}

export default idCardSettingsApi
