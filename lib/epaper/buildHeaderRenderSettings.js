import { readAny } from './readAny'
import { pickHeaderMediaUrl, normalizeHeaderMediaUrl } from './headerMediaUrl'

/**
 * Build the `s` props object for HeaderStyles components from API config.
 */
export function buildHeaderRenderSettings({
  config,
  headerConfig,
  tenant,
  pageNumber = '1',
  issueDateText = '',
  volumeLabel = '',
  issueLabel = '',
  publishedAreasText = '',
  accentColor = '#dc2626',
}) {
  const hc = headerConfig || {}
  const cfg = config || {}

  const paperName =
    hc.mainPageHeader ||
    String(readAny(cfg, ['designConfig.headerData', 'mainPageHeader', 'headerData'], '')) ||
    tenant?.displayName ||
    tenant?.name ||
    'కాబుర్లు టుడే'

  const paperNameEn =
    String(readAny(cfg, ['designConfig.paperNameEn', 'paperNameEn'], '')) ||
    tenant?.displayName ||
    tenant?.name ||
    'Kaburlu Today'

  const headerLogoUrl = pickHeaderMediaUrl(
    readAny(cfg, ['designConfig.headerLogoUrl', 'headerLogoUrl'], ''),
    hc.logoUrl,
    readAny(cfg, ['logoUrl', 'header.logoUrl'], '')
  )

  const subHeaderLogoUrl = pickHeaderMediaUrl(
    readAny(cfg, ['designConfig.subHeaderLogoUrl', 'subHeaderLogoUrl'], '')
  )

  const paperNameImageUrl = normalizeHeaderMediaUrl(
    readAny(cfg, ['designConfig.paperNameImageUrl', 'paperNameImageUrl'], '')
  )

  const headerLeft = pickHeaderMediaUrl(
    readAny(cfg, ['designConfig.headerLeftImageUrl', 'headerLeftImageUrl'], ''),
    hc.headerLeftImageUrl
  )
  const headerRight = pickHeaderMediaUrl(
    readAny(cfg, ['designConfig.headerRightImageUrl', 'headerRightImageUrl'], ''),
    hc.headerRightImageUrl,
    hc.headerAdUrl
  )

  const priceRaw = hc.paperSellCost || readAny(cfg, ['designConfig.paperSellCost', 'paperSellCost'], '')
  const price = priceRaw ? (String(priceRaw).startsWith('₹') ? String(priceRaw) : `₹${priceRaw}`) : '₹5.00'

  return {
    paperName,
    paperNameEn,
    sectionName:
      hc.secondPageHeader ||
      String(readAny(cfg, ['designConfig.subHeaderData', 'secondPageHeader'], 'వార్తలు')),
    date: issueDateText || String(readAny(cfg, ['designConfig.issueDateText', 'date'], '')),
    volume: volumeLabel || `సంపుటి ${hc.startVolumeNumber || ''}`,
    issue: issueLabel || `సంచిక ${hc.issueNumber || hc.issueStartNumber || ''}`,
    price,
    publishedAreas:
      publishedAreasText ||
      hc.publishedAreaText ||
      String(readAny(cfg, ['designConfig.publishedAreaText', 'publishedAreas'], '')),
    logoUrl: headerLogoUrl,
    headerLogoUrl,
    subHeaderLogoUrl,
    paperNameImageUrl,
    adLeftUrl: headerLeft,
    adRightUrl: headerRight,
    adUrl: headerRight,
    accentColor: String(readAny(cfg, ['designConfig.accentColor', 'accentColor'], accentColor)),
    pageNumber: String(pageNumber),
    mainHeaderImageUrl: String(readAny(cfg, ['designConfig.mainHeaderImageUrl', 'mainHeaderImageUrl'], '')),
    subHeaderImageUrl: hc.subHeaderImageUrl || String(readAny(cfg, ['designConfig.subHeaderImageUrl'], '')),
    runningCommentText: String(readAny(cfg, ['designConfig.runningCommentText'], '')),
    runningCommentAuthor: String(readAny(cfg, ['designConfig.runningCommentAuthor'], '')),
    tagline: String(readAny(cfg, ['designConfig.tagline'], '')),
    websiteUrl: String(readAny(cfg, ['designConfig.websiteUrl'], '')),
    rightArticleTitle: String(readAny(cfg, ['designConfig.rightArticleTitle'], '')),
    rightArticlePoints: String(readAny(cfg, ['designConfig.rightArticlePoints'], '')),
  }
}
