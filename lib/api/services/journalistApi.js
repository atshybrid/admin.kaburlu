/**
 * Journalist Union API Service
 * Handles all journalist union endpoints
 * Uses apiClient for consistent API calls through proxy
 */
import { apiClient } from '../client'
import { normalizeMemberDetail } from '../../journalist/apiNormalize'

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

  /**
   * GET /journalist/admin/members/pending?unionName=&page=&limit=
   * Queue: membership pending and/or document KYC pending
   */
  listPendingMembers: (params = {}) =>
    apiClient.get('/journalist/admin/members/pending', params),

  /** GET /journalist/admin/members/:profileId → member object */
  getMember: async (profileId) => {
    const raw = await apiClient.get(`/journalist/admin/members/${profileId}`)
    return normalizeMemberDetail(raw)
  },

  /**
   * PATCH /journalist/admin/members/:profileId/documents
   * Body: { photo: "approve"|"reject", aadhaar, pan, workingIdCard }
   */
  updateMemberDocuments: (profileId, actions) =>
    apiClient.patch(`/journalist/admin/members/${profileId}/documents`, actions),

  /**
   * PATCH /journalist/admin/members/:profileId/approve-membership
   * Body: { approved: true|false, generateIdCard?: boolean, reason?: string }
   */
  approveMembership: (profileId, body) =>
    apiClient.patch(`/journalist/admin/members/${profileId}/approve-membership`, body),

  /** PATCH /journalist/admin/members/:profileId/benefits */
  updateBenefits: (profileId, body) =>
    apiClient.patch(`/journalist/admin/members/${profileId}/benefits`, body),

  /** POST /journalist/admin/members/:profileId/insurance */
  assignMemberInsurance: (profileId, body) =>
    apiClient.post(`/journalist/admin/members/${profileId}/insurance`, body),

  /**
   * POST /journalist/admin/members/create (multipart/form-data)
   * Case A: TENANT_REPORTER — mobile + unionName (+ optional docs)
   * Case B: NON_TENANT_REPORTER — Super Admin only; full profile + publisher mobile
   */
  createMember: (formData) => apiClient.upload('/journalist/admin/members/create', formData),

  // ─── Press Cards ─────────────────────────────────────────────────────────────

  /** POST /journalist/admin/generate-card */
  generatePressCard: (body) => apiClient.post('/journalist/admin/generate-card', body),

  /** POST /journalist/admin/cards/:profileId/generate-pdf */
  regenerateMemberPdf: (profileId) =>
    apiClient.post(`/journalist/admin/cards/${profileId}/generate-pdf`, {}),

  /** PATCH /journalist/admin/cards/:profileId */
  updatePressCard: (profileId, data) =>
    apiClient.patch(`/journalist/admin/cards/${profileId}`, data),

  /** @deprecated legacy application card route */
  generateCard: (applicationId, data) =>
    apiClient.post(`/journalist/admin/applications/${applicationId}/generate-card`, data),

  /** @deprecated use regenerateMemberPdf */
  regenerateCard: (cardId) =>
    apiClient.post(`/journalist/admin/cards/${cardId}/regenerate`, {}),

  /** @deprecated use updatePressCard */
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

  /** @deprecated use assignMemberInsurance */
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

  /** GET /journalist/admin/union-admins */
  listUnionAdmins: () => apiClient.get('/journalist/admin/union-admins'),

  /** POST /journalist/admin/assign-union-admin */
  assignUnionAdmin: (data) => apiClient.post('/journalist/admin/assign-union-admin', data),

  /** DELETE /journalist/admin/union-admins/:id */
  removeUnionAdmin: (id) => apiClient.delete(`/journalist/admin/union-admins/${id}`),

  /** @deprecated superadmin path — kept for older backends */
  listUnionAdminsLegacy: () => apiClient.get('/journalist/superadmin/admins'),

  // ─── Elections (STATE / DISTRICT / MANDAL) ─────────────────────────────────────

  /** GET /journalist/admin/elections/readiness?level=&stateId=&districtId=&mandalId=&unionName= */
  getElectionReadiness: (params = {}) =>
    apiClient.get('/journalist/admin/elections/readiness', params),

  /** POST /journalist/admin/elections/conduct */
  conductElection: (body) => apiClient.post('/journalist/admin/elections/conduct', body),

  /** GET /journalist/president/post-holders */
  listPostHolders: (params = {}) => apiClient.get('/journalist/president/post-holders', params),

  /** GET /journalist/posts/definitions */
  listPostDefinitionsPublic: (params = {}) =>
    apiClient.get('/journalist/posts/definitions', params),

  /** POST /journalist/admin/posts/seed-defaults */
  seedPostDefaults: (body = {}) => apiClient.post('/journalist/admin/posts/seed-defaults', body),

  /** POST /journalist/admin/posts/appoint */
  appointPostHolder: (data) => apiClient.post('/journalist/admin/posts/appoint', data),

  /** PATCH /journalist/admin/posts/holders/:id */
  updatePostHolder: (id, data) => apiClient.patch(`/journalist/admin/posts/holders/${id}`, data),

  /** DELETE /journalist/admin/posts/holders/:id */
  removePostHolder: (id) => apiClient.delete(`/journalist/admin/posts/holders/${id}`),

  /** GET /journalist/admin/cards/renewal-due */
  listCardsRenewalDue: (params = {}) =>
    apiClient.get('/journalist/admin/cards/renewal-due', params),

  /** PATCH /journalist/admin/cards/:profileId/renew */
  renewPressCard: (profileId) =>
    apiClient.patch(`/journalist/admin/cards/${profileId}/renew`, {}),

  /** POST /journalist/superadmin/seed-posts — legacy */
  seedPostDefinitions: () => apiClient.post('/journalist/superadmin/seed-posts', {}),
}
