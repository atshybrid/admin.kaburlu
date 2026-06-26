/**
 * Union Admin API — member workflow (SUPER_ADMIN + UNION_MODERATOR)
 * Base: /journalist/union-admin/*
 */
import { apiClient } from '../client'
import { normalizeMemberDetail } from '../../journalist/apiNormalize'
import { getToken } from '../../../utils/auth'

const BASE = '/journalist/union-admin'

function directBackendBase() {
  const raw =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    'https://api.kaburlumedia.com'
  let url = String(raw).trim().replace(/\/+$/, '')
  while (url.endsWith('/api/v1')) url = url.slice(0, -7)
  return `${url}/api/v1`
}

export const unionAdminApi = {
  /** GET /journalist/union-admin/members/pending */
  listPending: (params = {}) => apiClient.get(`${BASE}/members/pending`, params),

  /** GET /journalist/union-admin/members/:profileId */
  getMember: async (profileId) => {
    const raw = await apiClient.get(`${BASE}/members/${encodeURIComponent(profileId)}`)
    return normalizeMemberDetail(raw)
  },

  /** PATCH /journalist/union-admin/members/:profileId */
  patchProfile: (profileId, body) =>
    apiClient.patch(`${BASE}/members/${encodeURIComponent(profileId)}`, body),

  /** POST multipart — photo */
  uploadPhoto: (profileId, formData) =>
    apiClient.upload(`${BASE}/members/${encodeURIComponent(profileId)}/photo`, formData),

  /** POST multipart — document + file */
  uploadDocument: (profileId, formData) =>
    apiClient.upload(`${BASE}/members/${encodeURIComponent(profileId)}/documents`, formData),

  /** PATCH — photo, workingIdCard */
  patchVerification: (profileId, body) =>
    apiClient.patch(`${BASE}/members/${encodeURIComponent(profileId)}/verification`, body),

  /** PATCH — aadhaar, pan */
  patchInsuranceDocuments: (profileId, body) =>
    apiClient.patch(`${BASE}/members/${encodeURIComponent(profileId)}/insurance-documents`, body),

  /** PATCH — membership approve/reject */
  patchMembership: (profileId, body) =>
    apiClient.patch(`${BASE}/members/${encodeURIComponent(profileId)}/membership`, body),

  /** GET id card meta */
  getIdCard: (profileId) =>
    apiClient.get(`${BASE}/members/${encodeURIComponent(profileId)}/id-card`),

  /** POST generate */
  generateIdCard: (profileId) =>
    apiClient.post(`${BASE}/members/${encodeURIComponent(profileId)}/id-card/generate`, {}),

  /** POST regenerate */
  regenerateIdCard: (profileId) =>
    apiClient.post(`${BASE}/members/${encodeURIComponent(profileId)}/id-card/regenerate`, {}),

  /** POST insurance policy */
  assignInsurance: (profileId, body) =>
    apiClient.post(`${BASE}/members/${encodeURIComponent(profileId)}/insurance`, body),

  /** POST insurance card image */
  uploadInsuranceCard: (profileId, insuranceId, formData) =>
    apiClient.upload(
      `${BASE}/members/${encodeURIComponent(profileId)}/insurance/${encodeURIComponent(insuranceId)}/card`,
      formData
    ),

  /** Authenticated PDF download */
  async downloadIdCard(profileId, filename = 'union-id-card.pdf') {
    const token = getToken()
    const url = `${directBackendBase()}${BASE}/members/${encodeURIComponent(profileId)}/id-card/download`
    const res = await fetch(url, {
      headers: token?.token ? { Authorization: `Bearer ${token.token}` } : {},
    })
    if (!res.ok) {
      let data = null
      try {
        data = await res.json()
      } catch {
        /* ignore */
      }
      const msg = data?.message || data?.error || `Download failed (${res.status})`
      throw new Error(msg)
    }
    const blob = await res.blob()
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = filename
    a.click()
    URL.revokeObjectURL(href)
  },
}

export default unionAdminApi
