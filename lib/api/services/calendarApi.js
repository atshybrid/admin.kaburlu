import api from '../client' // default apiClient

const calendarApi = {
  getConfig(tenantId) {
    return api.get(`/calendar/admin/tenants/${tenantId}/config`)
  },
  saveConfig(tenantId, body) {
    return api.put(`/calendar/admin/tenants/${tenantId}/config`, body)
  },
}

export default calendarApi