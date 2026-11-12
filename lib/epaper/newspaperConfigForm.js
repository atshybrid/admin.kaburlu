export const EPAPER_PAPER_TYPE = 'BROADSHEET'

const dateOnly = (v) => (v ? String(v).slice(0, 10) : '')

/** Map GET /epaper/newspaper-config → tenant defaults form */
export function newspaperConfigToForm(data) {
  const cfg = data?.config || {}
  const today = data?.today || {}
  return {
    exists: !!data?.config,
    pageCount: cfg.pageCount ?? 8,
    perPageCost: cfg.perPageCost ?? '',
    mainLogoUrl: cfg.mainLogoUrl || '',
    subHeaderLogoUrl: cfg.subHeaderLogoUrl || '',
    headerStyleNumber: cfg.headerStyleNumber ?? 1,
    subHeaderStyleNumber: cfg.subHeaderStyleNumber ?? 1,
    prgiNumber: cfg.prgiNumber || '',
    lastPageFooterText: cfg.lastPageFooterText || '',
    volumeStartNumber: cfg.volumeStartNumber ?? 1,
    volumeStartDate: dateOnly(cfg.volumeStartDate),
    issueStartNumber: cfg.issueStartNumber ?? 1,
    issueStartDate: dateOnly(cfg.issueStartDate),
    newsCloseTime: cfg.newsCloseTime || '23:00',
    today: data?.config ? today : null,
  }
}

/** PUT /epaper/newspaper-config body (upsert; create needs both start dates) */
export function formToNewspaperConfigPayload(form) {
  return {
    paperType: EPAPER_PAPER_TYPE,
    pageCount: Number(form.pageCount) || 8,
    perPageCost: form.perPageCost === '' ? null : Number(form.perPageCost),
    mainLogoUrl: String(form.mainLogoUrl || '').trim() || null,
    subHeaderLogoUrl: String(form.subHeaderLogoUrl || '').trim() || null,
    headerStyleNumber: Number(form.headerStyleNumber) || 1,
    subHeaderStyleNumber: Number(form.subHeaderStyleNumber) || 1,
    prgiNumber: String(form.prgiNumber || '').trim() || null,
    lastPageFooterText: String(form.lastPageFooterText || '').trim() || null,
    volumeStartNumber: Number(form.volumeStartNumber) || 1,
    volumeStartDate: form.volumeStartDate || undefined,
    issueStartNumber: Number(form.issueStartNumber) || 1,
    issueStartDate: form.issueStartDate || undefined,
    newsCloseTime: form.newsCloseTime || '23:00',
  }
}

export const IMPRINT_FIELDS = [
  'printerName',
  'printerAddress',
  'printerCity',
  'publisherName',
  'editorName',
  'ownerName',
  'rniNumber',
]

/** Map GET /epaper/settings → last-page imprint form */
export function epaperSettingsToImprint(data) {
  const s = data || {}
  const out = {
    initialized: s.initialized === true,
    showPrinterInfoOnLastPage: s.showPrinterInfoOnLastPage !== false,
  }
  for (const k of IMPRINT_FIELDS) out[k] = s[k] || ''
  return out
}

export function imprintToPayload(form) {
  const body = { showPrinterInfoOnLastPage: !!form.showPrinterInfoOnLastPage }
  for (const k of IMPRINT_FIELDS) body[k] = String(form[k] || '').trim() || null
  return body
}
