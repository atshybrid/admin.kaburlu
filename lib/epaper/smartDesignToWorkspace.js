/**
 * Map GET /epaper/smart-design items → design workspace header state.
 */
import { normalizeHeaderMediaUrl } from './headerMediaUrl'

export function pickSmartDesignForEdition(items = [], editionId = '') {
  const list = Array.isArray(items) ? items : []
  if (!list.length) return null
  const id = String(editionId || '').trim()
  if (id) {
    const match = list.find((row) => String(row.publicationEditionId || '') === id)
    if (match) return match
  }
  const active = list.find((row) => row.isActive === true)
  return active || list[0]
}

/** Map API paperType / pageSize / preset string → TABLOID | BROADSHEET */
export function paperTypeToPreset(paperTypeOrPageSize) {
  const p = String(paperTypeOrPageSize || '').toUpperCase()
  if (!p) return null
  if (p.includes('BROAD')) return 'BROADSHEET'
  if (p.includes('TAB')) return 'TABLOID'
  return null
}

export function smartDesignPaperPreset(design) {
  if (!design || typeof design !== 'object') return null
  return (
    paperTypeToPreset(design.paperType) ||
    paperTypeToPreset(design.pageSize) ||
    paperTypeToPreset(design.pageType)
  )
}

/** Wrap API row as design-config envelope for extractHeaderConfig / buildHeaderRenderSettings. */
export function smartDesignToConfigEnvelope(design, { tenantName = '' } = {}) {
  if (!design || typeof design !== 'object') return null

  const today = design.today || {}
  const issueDate =
    today.issueDate ||
    (design.issueStartDate ? String(design.issueStartDate).slice(0, 10) : '')

  const editionName = design.publicationEdition?.name || ''
  const paperNameEn =
    String(design.paperNameEn || '').trim() ||
    (tenantName && !/[\u0C00-\u0C7F]/.test(tenantName) ? tenantName : '') ||
    editionName ||
    'Kaburlu'

  return {
    designConfig: {
      ...design,
      headerData: design.headerData || '',
      subHeaderData: design.publishedAreaText || editionName || '',
      headerLogoUrl: normalizeHeaderMediaUrl(design.headerLogoUrl),
      paperNameImageUrl: normalizeHeaderMediaUrl(design.paperNameImageUrl),
      subHeaderLogoUrl: normalizeHeaderMediaUrl(design.subHeaderLogoUrl),
      headerLeftImageUrl: normalizeHeaderMediaUrl(design.headerLeftImageUrl),
      headerRightImageUrl: normalizeHeaderMediaUrl(design.headerRightImageUrl),
      publishedAreaText: design.publishedAreaText || '',
      paperSellCost: design.paperSellCost,
      headerStyleNumber: design.headerStyleNumber ?? 1,
      subHeaderStyleNumber: design.subHeaderStyleNumber ?? 1,
      headerStyleKey: design.headerStyleKey,
      subHeaderStyleKey: design.subHeaderStyleKey,
      numberOfPages: design.totalPages ?? design.defaultPageCount ?? 8,
      issueStartNumber: today.currentIssue ?? design.issueStartNumber ?? 1,
      startVolumeNumber: today.currentVolume ?? design.volumeStartNumber ?? 1,
      issueDateText: issueDate,
      paperNameEn,
      footerText: design.lastPageFooterText || '',
      lastPageFooterText: design.lastPageFooterText || '',
      tagline: design.tagline || '',
      websiteUrl: design.websiteUrl || '',
      runningCommentText: design.runningCommentText || '',
      runningCommentAuthor: design.runningCommentAuthor || '',
      rightArticleTitle: design.rightArticleTitle || '',
      rightArticlePoints: design.rightArticlePoints || '',
    },
    smartDesign: design,
  }
}

export function smartDesignEditionLabel(design) {
  if (!design) return ''
  if (design.publicationEdition?.name) return design.publicationEdition.name
  if (design.publicationEditionId) return design.publicationEditionId
  return 'smart-design'
}
