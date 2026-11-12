/** Map GET /epaper/newspaper-config → tenant setup form */
export function newspaperConfigToForm(data) {
  const cfg = data?.config || data || {}
  const today = data?.today || cfg.today || {}
  return {
    paperType: cfg.paperType || 'TABLOID',
    pageCount: cfg.pageCount ?? cfg.totalPages ?? 8,
    mainLogoUrl: cfg.mainLogoUrl || '',
    subHeaderLogoUrl: cfg.subHeaderLogoUrl || '',
    headerStyleNumber: cfg.headerStyleNumber ?? 1,
    subHeaderStyleNumber: cfg.subHeaderStyleNumber ?? 1,
    prgiNumber: cfg.prgiNumber || '',
    lastPageFooterText: cfg.lastPageFooterText || '',
    volumeStartNumber: cfg.volumeStartNumber ?? 1,
    volumeStartDate: cfg.volumeStartDate ? String(cfg.volumeStartDate).slice(0, 10) : '',
    issueStartNumber: cfg.issueStartNumber ?? 1,
    issueStartDate: cfg.issueStartDate ? String(cfg.issueStartDate).slice(0, 10) : '',
    newsCloseTime: cfg.newsCloseTime || '23:00',
    todayVolume: today.currentVolume,
    todayIssue: today.currentIssue,
    newsWindow: today.newsWindow || null,
  }
}

/** PUT /epaper/newspaper-config body */
export function formToNewspaperConfigPayload(form) {
  return {
    paperType: form.paperType || 'TABLOID',
    pageCount: Number(form.pageCount) || 8,
    mainLogoUrl: String(form.mainLogoUrl || '').trim() || null,
    subHeaderLogoUrl: String(form.subHeaderLogoUrl || '').trim() || null,
    headerStyleNumber: Number(form.headerStyleNumber) || 1,
    subHeaderStyleNumber: Number(form.subHeaderStyleNumber) || 1,
    lastPageFooterText: String(form.lastPageFooterText || '').trim() || null,
    volumeStartNumber: Number(form.volumeStartNumber) || 1,
    volumeStartDate: form.volumeStartDate || null,
    issueStartNumber: Number(form.issueStartNumber) || 1,
    issueStartDate: form.issueStartDate || null,
    newsCloseTime: form.newsCloseTime || '23:00',
  }
}
