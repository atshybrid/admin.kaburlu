export function resolvePublishDomain(domains = []) {
  if (!Array.isArray(domains) || !domains.length) return null
  const newsDomain = domains.find((domain) => String(domain.kind || domain.type || '').toUpperCase() === 'NEWS')
  if (newsDomain?.id) return newsDomain
  const primaryDomain = domains.find((domain) => domain.isPrimary)
  if (primaryDomain?.id) return primaryDomain
  return domains[0] || null
}

export function buildPrintArticleFromMaster(masterPrint, newspaperName) {
  if (!masterPrint?.headline) return null
  return {
    headline: masterPrint.headline,
    subtitle: masterPrint.subtitle ?? null,
    mainPageLayout: masterPrint.mainPageLayout,
    body: (masterPrint.body || []).map((block) => ({
      heading: block?.heading ?? null,
      text: block?.text || '',
    })),
    highlights: masterPrint.highlights ?? null,
    fact_box: masterPrint.fact_box ?? null,
    dateline: {
      ...(masterPrint.dateline || {}),
      newspaper: newspaperName || masterPrint.dateline?.newspaper,
    },
  }
}

export function buildTenantPublishPatch({
  jobTenant,
  masterPrint,
  nativeName,
  domainId,
  category,
  imageUrl,
}) {
  if (!jobTenant?.tenantId) return null

  const printArticle = jobTenant.unifiedPost?.printArticle
    || buildPrintArticleFromMaster(masterPrint, nativeName)

  const webArticle = jobTenant.webArticle || jobTenant.unifiedPost?.webArticle
  const coverUrl = imageUrl || jobTenant.imageUrl || jobTenant.unifiedPost?.media?.images?.[0]?.url

  return {
    nativeName,
    imageUrl: coverUrl || null,
    printArticle,
    webArticle,
    unifiedPost: {
      ...(jobTenant.unifiedPost || {}),
      tenantId: jobTenant.tenantId,
      domainId: jobTenant.unifiedPost?.domainId || domainId || null,
      baseArticle: {
        ...(jobTenant.unifiedPost?.baseArticle || {}),
        languageCode: jobTenant.unifiedPost?.baseArticle?.languageCode || 'te',
        category: jobTenant.unifiedPost?.baseArticle?.category || {
          categoryId: category?.categoryId,
          categoryName: category?.categoryName,
        },
        publisher: {
          ...(jobTenant.unifiedPost?.baseArticle?.publisher || {}),
          tenantId: jobTenant.tenantId,
          domainId: jobTenant.unifiedPost?.baseArticle?.publisher?.domainId || domainId || null,
          publisherName: nativeName,
        },
      },
      printArticle,
      webArticle,
      media: coverUrl
        ? { images: [{ url: coverUrl, caption: null, alt: printArticle?.headline || '' }] }
        : jobTenant.unifiedPost?.media,
    },
  }
}

export function buildPublishPrepPatch({
  job,
  selectedTenantIds,
  nativeNames,
  tenantDomains,
  tenantImages,
  sharedImageUrl,
  selectedTitleIndex,
  shortNewsTenantId,
}) {
  const headline = job?.alternateTitles?.[selectedTitleIndex]
  const masterPrint = headline && job?.masterPrint
    ? { ...job.masterPrint, headline }
    : job?.masterPrint

  const tenantPatches = {}
  selectedTenantIds.forEach((tenantId) => {
    const jobTenant = (job?.tenants || []).find((tenant) => tenant.tenantId === tenantId)
    if (!jobTenant) return
    const domain = resolvePublishDomain(tenantDomains[tenantId] || [])
    const patch = buildTenantPublishPatch({
      jobTenant,
      masterPrint,
      nativeName: nativeNames[tenantId] || jobTenant.nativeName,
      domainId: domain?.id || null,
      category: job?.category,
      imageUrl: tenantImages[tenantId] || sharedImageUrl,
    })
    if (patch) tenantPatches[tenantId] = patch
  })

  const tenantDomainMap = {}
  selectedTenantIds.forEach((tenantId) => {
    const domain = resolvePublishDomain(tenantDomains[tenantId] || [])
    if (domain?.id) tenantDomainMap[tenantId] = domain.id
  })

  return {
    selectedTitleIndex,
    masterPrint,
    images: {
      sharedImageUrl: sharedImageUrl?.trim() || null,
      tenantImages: Object.fromEntries(
        selectedTenantIds.map((id) => [id, tenantImages[id]?.trim() || null]),
      ),
    },
    ...(Object.keys(tenantPatches).length ? { tenantPatches } : {}),
    options: {
      ...(job?.options || {}),
      shortNewsTenantId,
      tenantDomainMap,
    },
  }
}
