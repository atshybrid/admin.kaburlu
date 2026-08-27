import { apiClient } from '../client'

const BASE = '/ipr-empanelments'

function slimFormData(form = {}) {
  const { documents, ...rest } = form
  return {
    ...rest,
    documents: Object.fromEntries(
      Object.entries(documents || {}).map(([key, value]) => [key, { present: Boolean(value?.present), name: value?.name || '' }]),
    ),
  }
}

export function toIprPayload(form, { tenantId } = {}) {
  const payload = {
    status: 'DRAFT',
    prgiNo: form.prgiNo || '',
    newspaperName: form.newspaperName || '',
    publisher: { name: form.publisherName || '', address: form.publisherAddress || '', phone: form.publisherPhone || '', email: form.publisherEmail || '', panNo: form.panNo || '' },
    editor: { name: form.editorName || '', address: form.editorAddress || '', phone: form.editorPhone || '', email: form.editorEmail || '', qualification: form.editorQualification || '', accreditationNo: form.accreditationNo || '' },
    press: { details: form.pressDetails || '', printerName: form.printerName || '', ownership: form.pressOwnership || '', capacity: form.pressCapacity || '', type: form.pressType || '', paperSize: form.paperSize || '', colour: form.printColour || '' },
    circulation: { dailyPrintCount: form.dailyPrintCount || '', colourPageCount: form.colourPageCount || '', circulation: form.circulation || '', districtMandalCirculation: form.districtMandalCirculation || '', agentDetails: form.agentDetails || '', newsprintQuantity: form.newsprintQuantity || '' },
    davp: { empanelled: form.davpEmpanelled || 'No', code: form.davpCode || '', copies: form.davpCopies || '', rate: form.davpRate || '' },
    staff: form.staff || [],
    publisherPublications: form.publisherPublications || [],
    editorPublications: form.editorPublications || [],
    documents: form.documents || {},
    formData: slimFormData(form),
  }
  if (tenantId) payload.tenantId = tenantId
  return payload
}

export const iprEmpanelmentApi = {
  create: (form, options) => apiClient.post(BASE, toIprPayload(form, options)),
  update: (id, form) => apiClient.put(`${BASE}/${encodeURIComponent(id)}`, toIprPayload(form)),
  list: (params) => apiClient.get(BASE, params),
  get: (id) => apiClient.get(`${BASE}/${encodeURIComponent(id)}`),
  attachDocument: (id, document) => apiClient.post(`${BASE}/${encodeURIComponent(id)}/documents`, document),
  async uploadAndAttachDocument(id, key, file) {
    const body = new FormData()
    body.append('file', file)
    const upload = await apiClient.upload('/media/upload', body)
    if (!upload?.publicUrl) throw new Error('Media upload did not return publicUrl')
    return this.attachDocument(id, { key, url: upload.publicUrl, fileName: upload.name || file.name, mimeType: upload.contentType || file.type, sizeBytes: upload.size || file.size })
  },
}
