/**
 * Journalist Union API Service
 * Handles all journalist union endpoints
 * Uses apiClient for consistent API calls through proxy
 */
import { apiClient } from '../client'

export const journalistApi = {
  // ─── Applications ────────────────────────────────────────────────────────────

  /** GET /journalist/admin/applications?status=PENDING|APPROVED|REJECTED */
  listApplications: (params = {}) => apiClient.get('/journalist/admin/applications', params),

  /** POST /journalist/admin/applications/:id/approve */
  approveApplication: (id, pressId) =>
    apiClient.post(`/journalist/admin/applications/${id}/approve`, { pressId }),

  /** POST /journalist/admin/applications/:id/reject */
  rejectApplication: (id, reason) =>
    apiClient.post(`/journalist/admin/applications/${id}/reject`, { reason }),

  // ─── Members ─────────────────────────────────────────────────────────────────

  /** GET /journalist/admin/members */
  listMembers: (params = {}) => apiClient.get('/journalist/admin/members', params),

  /** GET /journalist/admin/members/:id */
  getMember: (id) => apiClient.get(`/journalist/admin/members/${id}`),

  // ─── Press Cards ─────────────────────────────────────────────────────────────

  /** POST /journalist/admin/applications/:id/generate-card */
  generateCard: (applicationId, data) =>
    apiClient.post(`/journalist/admin/applications/${applicationId}/generate-card`, data),

  /** POST /journalist/admin/cards/:cardId/regenerate */
  regenerateCard: (cardId) =>
    apiClient.post(`/journalist/admin/cards/${cardId}/regenerate`, {}),

  /** PATCH /journalist/admin/cards/:cardId */
  updateCard: (cardId, data) => apiClient.patch(`/journalist/admin/cards/${cardId}`, data),

  // ─── Renewals ─────────────────────────────────────────────────────────────────

  /** GET /journalist/admin/renewals */
  listRenewals: (params = {}) => apiClient.get('/journalist/admin/renewals', params),

  /** POST /journalist/admin/renewals/:cardId/approve */
  approveRenewal: (cardId) =>
    apiClient.post(`/journalist/admin/renewals/${cardId}/approve`, {}),

  // ─── KYC ─────────────────────────────────────────────────────────────────────

  /** GET /journalist/admin/kyc */
  listKyc: (params = {}) => apiClient.get('/journalist/admin/kyc', params),

  /** POST /journalist/admin/kyc/:profileId/verify */
  verifyKyc: (profileId) =>
    apiClient.post(`/journalist/admin/kyc/${profileId}/verify`, {}),

  /** POST /journalist/admin/kyc/:profileId/reject */
  rejectKyc: (profileId, reason) =>
    apiClient.post(`/journalist/admin/kyc/${profileId}/reject`, { reason }),

  // ─── Complaints ───────────────────────────────────────────────────────────────

  /** GET /journalist/admin/complaints */
  listComplaints: (params = {}) => apiClient.get('/journalist/admin/complaints', params),

  /** PATCH /journalist/admin/complaints/:id */
  updateComplaint: (id, data) => apiClient.patch(`/journalist/admin/complaints/${id}`, data),

  // ─── Announcements ────────────────────────────────────────────────────────────

  /** GET /journalist/admin/announcements */
  listAnnouncements: () => apiClient.get('/journalist/admin/announcements'),

  /** POST /journalist/admin/announcements */
  createAnnouncement: (data) => apiClient.post('/journalist/admin/announcements', data),

  /** DELETE /journalist/admin/announcements/:id */
  deleteAnnouncement: (id) => apiClient.delete(`/journalist/admin/announcements/${id}`),

  // ─── Insurance ────────────────────────────────────────────────────────────────

  /** GET /journalist/admin/insurance */
  listInsurance: (params = {}) => apiClient.get('/journalist/admin/insurance', params),

  /** POST /journalist/admin/insurance/:profileId */
  assignInsurance: (profileId, data) =>
    apiClient.post(`/journalist/admin/insurance/${profileId}`, data),

  /** PATCH /journalist/admin/insurance/:id */
  updateInsurance: (id, data) => apiClient.patch(`/journalist/admin/insurance/${id}`, data),

  // ─── Committee ────────────────────────────────────────────────────────────────

  /** GET /journalist/admin/committee/post-definitions */
  listPostDefinitions: () => apiClient.get('/journalist/admin/committee/post-definitions'),

  /** POST /journalist/admin/committee/post-definitions */
  createPostDefinition: (data) =>
    apiClient.post('/journalist/admin/committee/post-definitions', data),

  /** GET /journalist/admin/committee */
  listCommittee: (params = {}) => apiClient.get('/journalist/admin/committee', params),

  /** POST /journalist/admin/committee/appoint */
  appointMember: (data) => apiClient.post('/journalist/admin/committee/appoint', data),

  /** PATCH /journalist/admin/committee/:holdingId */
  updateCommittee: (holdingId, data) =>
    apiClient.patch(`/journalist/admin/committee/${holdingId}`, data),

  /** DELETE /journalist/admin/committee/:holdingId */
  vacateCommittee: (holdingId) =>
    apiClient.delete(`/journalist/admin/committee/${holdingId}`),

  // ─── Settings (Union level) ────────────────────────────────────────────────────

  /**
   * GET /journalist/admin/settings
   * SuperAdmin must pass ?unionName=... query param
   * Returns union settings + stateConfigs[]
   */
  getSettings: (unionName) =>
    apiClient.get('/journalist/admin/settings', unionName ? { unionName } : {}),

  /**
   * PUT /journalist/admin/settings
   * Fields: unionName, displayName, registrationNumber, address, states[],
   *         primaryState, foundedYear, email, phone, websiteUrl
   */
  updateSettings: (data) => apiClient.put('/journalist/admin/settings', data),

  /**
   * POST /journalist/admin/settings/upload  (multipart/form-data)
   * Fields: file, field (logo|idCardLogo|stamp|forStamp), unionName (SuperAdmin)
   */
  uploadSettingsImage: (formData) =>
    apiClient.upload('/journalist/admin/settings/upload', formData),

  // ─── Settings (State level) ────────────────────────────────────────────────────

  /**
   * PUT /journalist/admin/settings/state
   * Fields: unionName, state, address, email, phone
   */
  updateStateSettings: (data) => apiClient.put('/journalist/admin/settings/state', data),

  /**
   * POST /journalist/admin/settings/state/upload  (multipart/form-data)
   * Fields: file, field (presidentSignature|stateLogo|stateStamp), state, unionName (SuperAdmin)
   */
  uploadStateImage: (formData) =>
    apiClient.upload('/journalist/admin/settings/state/upload', formData),

  // ─── Super Admin ─────────────────────────────────────────────────────────────

  /** GET /journalist/superadmin/admins */
  listUnionAdmins: () => apiClient.get('/journalist/superadmin/admins'),

  /** POST /journalist/superadmin/admins */
  assignUnionAdmin: (data) => apiClient.post('/journalist/superadmin/admins', data),

  /** DELETE /journalist/superadmin/admins/:userId */
  removeUnionAdmin: (userId) => apiClient.delete(`/journalist/superadmin/admins/${userId}`),

  /** POST /journalist/superadmin/seed-posts */
  seedPostDefinitions: () => apiClient.post('/journalist/superadmin/seed-posts', {}),
}
