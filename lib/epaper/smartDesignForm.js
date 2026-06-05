import { mainStyleKey, subStyleKey } from './headerStyleCatalog'

function normPaperType(v) {
  const s = String(v || 'TABLOID').toUpperCase()
  if (s.includes('BROAD')) return 'Broadsheet'
  if (s.includes('TAB')) return 'Tabloid'
  return 'Tabloid'
}

function isoDateOnly(v) {
  if (!v) return new Date().toISOString().slice(0, 10)
  return String(v).slice(0, 10)
}

/** Map tenant setup form → POST/PATCH /epaper/smart-design body (production API). */
export function formToSmartDesignPayload(form, { editionId, subEditionId, scopeType }) {
  const headerStyleNumber = Number(form.headerStyleNumber) || 1
  const subHeaderStyleNumber = Number(form.subHeaderStyleNumber) || 1
  const headerLogoUrl = String(form.headerLogoUrl || form.paperNameImageUrl || '').trim()

  return {
    publicationEditionId: editionId,
    subEditionId: scopeType === 'sub-edition' ? subEditionId || null : null,
    paperType: normPaperType(form.paperType || form.pageSize),
    totalPages: Number(form.defaultPageCount ?? form.totalPages) || 8,
    perPageCostMonthly: Number(form.perPageCostMonthly ?? form.perPagePrice) || 0,
    paperSellCost: Number(form.paperSellCost) || 0,
    headerStyleNumber,
    subHeaderStyleNumber,
    headerStyleKey: form.headerStyleKey || mainStyleKey(headerStyleNumber),
    subHeaderStyleKey: form.subHeaderStyleKey || subStyleKey(subHeaderStyleNumber),
    headerData: String(form.headerData || '').trim() || null,
    headerLogoUrl: headerLogoUrl || null,
    subHeaderLogoUrl: String(form.subHeaderLogoUrl || '').trim() || null,
    paperNameImageUrl: String(form.paperNameImageUrl || '').trim() || null,
    headerLeftImageUrl: String(form.headerLeftImageUrl || '').trim() || null,
    headerRightImageUrl: String(form.headerRightImageUrl || '').trim() || null,
    publishedAreaText: String(form.publishedAreaText || '').trim() || null,
    lastPageFooterText: String(form.lastPageFooterText || '').trim() || null,
    tagline: form.tagline || null,
    websiteUrl: form.websiteUrl || null,
    runningCommentText: form.runningCommentText || null,
    runningCommentAuthor: form.runningCommentAuthor || null,
    rightArticleTitle: form.rightArticleTitle || null,
    rightArticlePoints: form.rightArticlePoints || null,
    volumeStartNumber: Number(form.volumeStartNumber ?? form.volumeNumber) || 1,
    volumeStartYear: Number(form.volumeStartYear) || new Date().getFullYear(),
    issueStartNumber: Number(form.issueStartNumber ?? form.issueNumber) || 1,
    issueStartDate: isoDateOnly(form.issueStartDate),
    issueCounterMode: form.issueCounterMode || 'SEQUENTIAL',
    newsCloseTime: form.newsCloseTime || '20:00',
    languageCode: form.languageCode || 'te',
  }
}

/** Map smart design record → tenant setup form */
export function smartDesignToForm(design) {
  if (!design) return null
  const paperType = design.paperType || design.pageSize || 'TABLOID'
  return {
    paperType,
    pageSize: paperType,
    defaultPageCount: design.totalPages ?? design.defaultPageCount ?? 8,
    totalPages: design.totalPages ?? 8,
    perPageCostMonthly: design.perPageCostMonthly ?? design.perPagePrice ?? 0,
    perPagePrice: design.perPageCostMonthly ?? design.perPagePrice ?? 0,
    paperSellCost: design.paperSellCost ?? 5,
    volumeNumber: design.today?.currentVolume ?? design.volumeStartNumber ?? 1,
    volumeStartNumber: design.volumeStartNumber ?? design.today?.currentVolume ?? 1,
    volumeStartYear: design.volumeStartYear ?? new Date().getFullYear(),
    issueNumber: design.today?.currentIssue ?? design.issueStartNumber ?? 1,
    issueStartNumber: design.issueStartNumber ?? design.today?.currentIssue ?? 1,
    issueStartDate: design.issueStartDate ? String(design.issueStartDate).slice(0, 10) : '',
    issueCounterMode: design.issueCounterMode || 'SEQUENTIAL',
    newsCloseTime: design.newsCloseTime || '20:00',
    languageCode: design.languageCode || 'te',
    headerStyleNumber: design.headerStyleNumber ?? 1,
    subHeaderStyleNumber: design.subHeaderStyleNumber ?? 1,
    headerStyleKey: design.headerStyleKey || '',
    subHeaderStyleKey: design.subHeaderStyleKey || '',
    headerData: design.headerData || '',
    headerLogoUrl: design.headerLogoUrl || '',
    subHeaderLogoUrl: design.subHeaderLogoUrl || '',
    subHeaderImageUrl: design.subHeaderImageUrl || '',
    paperNameImageUrl: design.paperNameImageUrl || design.headerLogoUrl || '',
    headerLeftImageUrl: design.headerLeftImageUrl || '',
    headerRightImageUrl: design.headerRightImageUrl || '',
    publishedAreaText: design.publishedAreaText || '',
    lastPageFooterText: design.lastPageFooterText || '',
    tagline: design.tagline || '',
    websiteUrl: design.websiteUrl || '',
    runningCommentText: design.runningCommentText || '',
    runningCommentAuthor: design.runningCommentAuthor || '',
    rightArticleTitle: design.rightArticleTitle || '',
    rightArticlePoints: design.rightArticlePoints || '',
  }
}

/** Build table rows from GET /smart-design/editions */
export function rowsFromEditionsCatalog(catalog, editionsList = []) {
  const rows = []
  const editionItems = catalog?.editions || editionsList || []

  for (const ed of editionItems) {
    const design = ed.editionDesign || null
    rows.push({
      id: design?.id || null,
      key: `edition:${ed.id}`,
      source: 'smart-design/editions',
      scopeType: 'edition',
      editionId: ed.id,
      subEditionId: '',
      scopeLabel: ed.name || ed.slug || ed.id,
      paperType: design?.paperType,
      pageSize: design?.paperType || design?.pageSize,
      defaultPageCount: design?.totalPages,
      perPageCostMonthly: design?.perPageCostMonthly,
      paperSellCost: design?.paperSellCost,
      volumeNumber: design?.today?.currentVolume ?? design?.volumeStartNumber,
      issueNumber: design?.today?.currentIssue ?? design?.issueStartNumber,
      headerStyleNumber: design?.headerStyleNumber,
      subHeaderStyleNumber: design?.subHeaderStyleNumber,
      hasDesign: ed.hasEditionDesign ?? !!design,
      nextAction: design ? 'UPDATE' : 'CREATE',
      updatedAt: design?.updatedAt || design?.createdAt,
      raw: design,
    })

    for (const sub of ed.subEditions || []) {
      const subDesign = sub.design || null
      rows.push({
        id: subDesign?.id || null,
        key: `sub:${sub.id}`,
        source: 'smart-design/editions',
        scopeType: 'sub-edition',
        editionId: ed.id,
        subEditionId: sub.id,
        scopeLabel: `${ed.name || ed.slug} › ${sub.name || sub.slug}`,
        paperType: subDesign?.paperType,
        pageSize: subDesign?.paperType,
        defaultPageCount: subDesign?.totalPages,
        perPageCostMonthly: subDesign?.perPageCostMonthly,
        paperSellCost: subDesign?.paperSellCost,
        volumeNumber: subDesign?.today?.currentVolume,
        issueNumber: subDesign?.today?.currentIssue,
        headerStyleNumber: subDesign?.headerStyleNumber,
        subHeaderStyleNumber: subDesign?.subHeaderStyleNumber,
        hasDesign: sub.hasDesign ?? !!subDesign,
        nextAction: subDesign ? 'UPDATE' : 'CREATE',
        updatedAt: subDesign?.updatedAt,
        raw: subDesign,
      })
    }
  }

  return rows
}
