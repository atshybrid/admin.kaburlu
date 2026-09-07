/**
 * Platform Syndication desk — multi-tenant AI news workflow
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { tenantsApi } from '../../../lib/api/tenantApi'
import { apiClient } from '../../../lib/api/client'
import syndicationApi, { SyndicationApiError } from '../../../lib/api/services/syndicationApi'
import { categoriesService, languagesService } from '../../../lib/api/services'
import { resolveTenantId } from '../../../lib/article/resolveAuthTenants'
import { buildPublishPrepPatch, resolvePublishDomain } from '../../../lib/syndication/publishPrep'
import SyndicationImageSection, { syndicationHasCoverImage } from './SyndicationImageSection'
import SyndicationAiLoader from './SyndicationAiLoader'
import SyndicationStepper from './SyndicationStepper'
import { Button, FormField, Input, Select, Spinner, Textarea, toast } from '../../ui'

function unwrapList(raw) {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.items)) return raw.items
  if (Array.isArray(raw?.data?.items)) return raw.data.items
  if (Array.isArray(raw?.data)) return raw.data
  if (Array.isArray(raw?.tenants)) return raw.tenants
  return []
}

const DEFAULT_SHORT_NEWS_TENANT_ID = process.env.NEXT_PUBLIC_SHORT_NEWS_TENANT_ID || 'cmk7e7tg401ezlp22wkz5rxky'

function normalizeTenantRecord(tenant) {
  const id = resolveTenantId(tenant)
  if (!id) return null
  return { ...tenant, id }
}

function isPrintSyndicationTenant(tenant, shortNewsTenantId = DEFAULT_SHORT_NEWS_TENANT_ID) {
  const id = resolveTenantId(tenant)
  return Boolean(id) && id !== shortNewsTenantId
}

function findShortNewsTenant(allTenants) {
  return allTenants.find((tenant) => (
    /kaburlu\s*today/i.test(tenant.name || '')
    || (tenant.slug || '').includes('kaburlu-today')
  )) || allTenants.find((tenant) => tenant.id === DEFAULT_SHORT_NEWS_TENANT_ID)
}

function getJobPrintTenantIds(job, shortNewsTenantId) {
  return (job?.tenants || [])
    .map((tenant) => tenant.tenantId)
    .filter((id) => id && id !== shortNewsTenantId)
}

function jobHasStaleTenants(job, selectedTenantIds, shortNewsTenantId) {
  const savedPrintIds = getJobPrintTenantIds(job, shortNewsTenantId).sort()
  const currentIds = [...selectedTenantIds].sort()
  const includesShortNewsAsPrint = (job?.tenants || []).some((tenant) => tenant.tenantId === shortNewsTenantId)
  if (includesShortNewsAsPrint) return true
  if (savedPrintIds.length !== currentIds.length) return true
  return savedPrintIds.some((id, index) => id !== currentIds[index])
}

function getTenantPublishWarning(tenant, domains) {
  if (!tenant) return 'Tenant not found in admin list'
  const list = domains ?? tenant?.domains ?? []
  if (!list.length) return null
  if (!resolvePublishDomain(list)?.id) return 'No domain configured for this tenant'
  return null
}

const STEPS = [
  { key: 'input', label: 'Raw news', hint: 'Telugu paste' },
  { key: 'tenants', label: 'Tenants', hint: 'Multi-select' },
  { key: 'review', label: 'Review', hint: 'AI + images' },
  { key: 'publish', label: 'Publish', hint: 'Go live' },
]

function tenantLabel(tenant) {
  return tenant?.name || tenant?.slug || tenant?.nativeName || tenant?.id || 'Tenant'
}

function tenantNativeName(tenant) {
  return tenant?.entity?.nativeName || tenant?.nativeName || tenant?.name || tenant?.slug || ''
}

function resolveCategoryPayload(categoryList, existingJob) {
  if (existingJob?.category?.categoryId) {
    return { categoryId: existingJob.category.categoryId }
  }
  if (existingJob?.category?.categoryName) {
    return { categoryName: existingJob.category.categoryName }
  }

  const preferred = categoryList.find((cat) => cat.id) || categoryList[0]
  if (preferred?.id) return { categoryId: preferred.id }
  if (preferred?.name || preferred?.translatedName) {
    return { categoryName: preferred.name || preferred.translatedName }
  }

  return { categoryName: 'Politics' }
}

function extractPublishErrorMessage(errorItem) {
  const nested = errorItem?.error
  if (typeof nested === 'string') return nested
  if (typeof nested?.error === 'string') return nested.error
  if (nested?.message) return nested.message
  if (errorItem?.message) return errorItem.message
  return 'Unknown tenant publish error'
}

function summarizePublishResponse(response) {
  const published = response?.published || {}
  return {
    status: response?.status || response?.job?.status || 'UNKNOWN',
    errors: Array.isArray(response?.errors) ? response.errors : [],
    outputSummary: response?.outputSummary || null,
    publishedPrint: published.print || [],
    publishedWeb: published.web || [],
    publishedShortNews: published.shortNews || null,
  }
}

export default function SyndicationDesk({ jobId: initialJobId, onJobChange, onPublished }) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [metaLoading, setMetaLoading] = useState(true)
  const [tenants, setTenants] = useState([])
  const [categories, setCategories] = useState([])
  const [rawText, setRawText] = useState('')
  const [rawTime, setRawTime] = useState('')
  const [postTime, setPostTime] = useState('')
  const [sharedImageUrl, setSharedImageUrl] = useState('')
  const [selectedTenantIds, setSelectedTenantIds] = useState([])
  const [nativeNames, setNativeNames] = useState({})
  const [tenantImages, setTenantImages] = useState({})
  const [job, setJob] = useState(null)
  const [jobId, setJobId] = useState(initialJobId || '')
  const [selectedTitleIndex, setSelectedTitleIndex] = useState(0)
  const [missingElements, setMissingElements] = useState([])
  const [publishShortNews, setPublishShortNews] = useState(true)
  const [publishSummary, setPublishSummary] = useState(null)
  const [shortNewsTenantId, setShortNewsTenantId] = useState(DEFAULT_SHORT_NEWS_TENANT_ID)
  const [allTenants, setAllTenants] = useState([])
  const [tenantDomains, setTenantDomains] = useState({})
  const [domainsLoading, setDomainsLoading] = useState(false)

  const selectedTenants = useMemo(
    () => tenants.filter((tenant) => selectedTenantIds.includes(tenant.id)),
    [tenants, selectedTenantIds],
  )

  const categoryNames = useMemo(
    () => categories.map((cat) => cat.name || cat.translatedName).filter(Boolean),
    [categories],
  )

  const staleJobTenants = useMemo(
    () => jobHasStaleTenants(job, selectedTenantIds, shortNewsTenantId),
    [job, selectedTenantIds, shortNewsTenantId],
  )

  const loadTenantDomains = useCallback(async (tenantIds) => {
    const ids = [...new Set((tenantIds || []).filter(Boolean))]
    if (!ids.length) return {}
    setDomainsLoading(true)
    try {
      const entries = await Promise.all(ids.map(async (tenantId) => {
        try {
          const response = await apiClient.get(`/tenants/${tenantId}/domains`)
          return [tenantId, unwrapList(response)]
        } catch {
          return [tenantId, []]
        }
      }))
      const next = Object.fromEntries(entries)
      setTenantDomains((current) => ({ ...current, ...next }))
      return next
    } finally {
      setDomainsLoading(false)
    }
  }, [])

  const loadTenants = useCallback(async () => {
    try {
      const response = await tenantsApi.list(true)
      const normalized = unwrapList(response).map(normalizeTenantRecord).filter(Boolean)
      const shortNews = findShortNewsTenant(normalized)
      const resolvedShortNewsId = resolveTenantId(shortNews) || DEFAULT_SHORT_NEWS_TENANT_ID
      setShortNewsTenantId(resolvedShortNewsId)
      setAllTenants(normalized)
      const tenantList = normalized.filter((tenant) => isPrintSyndicationTenant(tenant, resolvedShortNewsId))
      setTenants(tenantList)
      const names = {}
      tenantList.forEach((tenant) => {
        names[tenant.id] = tenantNativeName(tenant)
      })
      setNativeNames((current) => ({ ...current, ...names }))
    } catch (error) {
      toast.error(error.message || 'Failed to load tenants')
      setTenants([])
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const languages = await languagesService.getAll()
      const telugu = languages.find(
        (lang) => (lang.code || lang.languageCode || '').toLowerCase() === 'te',
      ) || languages[0]

      let categoryList = []
      if (telugu?.id) {
        const byLanguageId = await apiClient.get('/categories', { languageId: telugu.id })
        categoryList = unwrapList(byLanguageId)
      }
      if (!categoryList.length && telugu?.code) {
        const byLanguageCode = await apiClient.get('/categories', { languageCode: telugu.code })
        categoryList = unwrapList(byLanguageCode)
      }
      if (!categoryList.length) {
        const allCategories = await categoriesService.getAll()
        categoryList = unwrapList(allCategories)
      }

      setCategories(categoryList)
    } catch (error) {
      console.warn('Syndication: failed to load Telugu categories for AI context', error)
      setCategories([])
    }
  }, [])

  const loadMeta = useCallback(async () => {
    setMetaLoading(true)
    await Promise.all([loadTenants(), loadCategories()])
    setMetaLoading(false)
  }, [loadTenants, loadCategories])

  const loadJob = useCallback(async (id) => {
    if (!id) return
    setLoading(true)
    try {
      const response = await syndicationApi.getJob(id)
      const loaded = response?.job || response
      setJob(loaded)
      setJobId(loaded.jobId || id)
      setRawText(loaded.rawText || '')
      setRawTime(loaded.rawTime || loaded.options?.rawTime || '')
      setPostTime(loaded.postTime || loaded.options?.postTime || '')
      setSharedImageUrl(loaded.images?.sharedImageUrl || '')
      setSelectedTitleIndex(loaded.selectedTitleIndex || 0)
      const ids = (loaded.tenants || [])
        .map((tenant) => tenant.tenantId)
        .filter((id) => {
          if (!id) return false
          if (id === shortNewsTenantId || id === DEFAULT_SHORT_NEWS_TENANT_ID) return false
          const match = (loaded.tenants || []).find((tenant) => tenant.tenantId === id)
          return !/kaburlu\s*today/i.test(match?.nativeName || '')
        })
      setSelectedTenantIds(ids)
      const names = {}
      const images = {}
      ;(loaded.tenants || []).forEach((tenant) => {
        names[tenant.tenantId] = tenant.nativeName || ''
        images[tenant.tenantId] = tenant.imageUrl || ''
      })
      setNativeNames((current) => ({ ...current, ...names }))
      setTenantImages((current) => ({
        ...current,
        ...images,
        ...(loaded.images?.tenantImages || {}),
      }))
      if (loaded.status === 'PREVIEW_READY' || loaded.status === 'PUBLISHED') setStep(2)
      onJobChange?.(loaded.jobId || id)
    } catch (error) {
      toast.error(error.message || 'Failed to load syndication job')
    } finally {
      setLoading(false)
    }
  }, [onJobChange, shortNewsTenantId])

  useEffect(() => {
    loadMeta()
  }, [loadMeta])

  useEffect(() => {
    if (initialJobId) loadJob(initialJobId)
  }, [initialJobId, loadJob])

  useEffect(() => {
    if (selectedTenantIds.length) loadTenantDomains(selectedTenantIds)
  }, [selectedTenantIds, loadTenantDomains])

  const toggleTenant = (tenantId) => {
    setSelectedTenantIds((current) => (
      current.includes(tenantId) ? current.filter((id) => id !== tenantId) : [...current, tenantId]
    ))
  }

  const buildImagePatch = () => ({
    images: {
      sharedImageUrl: sharedImageUrl.trim() || null,
      tenantImages: Object.fromEntries(
        selectedTenantIds.map((id) => [id, tenantImages[id]?.trim() || null]),
      ),
    },
  })

  const syncImagesToJob = async () => {
    if (!jobId) return
    const response = await syndicationApi.patchJob(jobId, buildImagePatch())
    if (response?.job) setJob(response.job)
  }

  const syncReviewToJob = async (domainMap = tenantDomains) => {
    if (!jobId || !job) return
    const patch = buildPublishPrepPatch({
      job,
      selectedTenantIds,
      nativeNames,
      tenantDomains: domainMap,
      tenantImages,
      sharedImageUrl,
      selectedTitleIndex,
      shortNewsTenantId,
    })
    const response = await syndicationApi.patchJob(jobId, patch)
    if (response?.job) setJob(response.job)
  }

  const labelForTenantId = (tenantId) => tenantLabel(tenants.find((tenant) => tenant.id === tenantId)
    || allTenants.find((tenant) => tenant.id === tenantId))

  const tenantPublishWarnings = useMemo(
    () => selectedTenantIds.map((tenantId) => {
      const tenant = allTenants.find((item) => item.id === tenantId)
      const domains = tenantDomains[tenantId]
      const domain = resolvePublishDomain(domains || [])
      return {
        tenantId,
        label: tenantLabel(tenant),
        domainName: domain?.domain || domain?.name || null,
        warning: domains === undefined
          ? null
          : getTenantPublishWarning(tenant, domains),
      }
    }),
    [selectedTenantIds, allTenants, tenantDomains],
  )

  const buildPayload = () => {
    const category = resolveCategoryPayload(categories, job)
    return {
      rawText: rawText.trim(),
      category,
      categories: categoryNames,
      ...(rawTime.trim() ? { rawTime: rawTime.trim() } : {}),
      ...(postTime.trim() ? { postTime: postTime.trim() } : {}),
      images: {
        sharedImageUrl: sharedImageUrl.trim() || null,
        tenantImages: Object.fromEntries(
          selectedTenantIds.map((id) => [id, tenantImages[id]?.trim() || null]),
        ),
      },
      tenants: selectedTenantIds.map((tenantId) => ({
        tenantId,
        nativeName: nativeNames[tenantId]?.trim() || tenantLabel(tenants.find((t) => t.id === tenantId)),
      })),
      options: {
        shortNewsTenantId,
        alternateTitlesCount: 10,
        languageCode: 'te',
        showSourceLinkOnWeb: false,
        categoryNames,
        ...(rawTime.trim() ? { rawTime: rawTime.trim() } : {}),
        ...(postTime.trim() ? { postTime: postTime.trim() } : {}),
      },
    }
  }

  const onGenerate = async () => {
    if (!rawText.trim()) return toast.error('Paste raw Telugu news first')
    if (!selectedTenantIds.length) return toast.error('Select at least one tenant')
    if (!categories.length) {
      await loadCategories()
    }
    const payload = buildPayload()
    if (!payload.category?.categoryId && !payload.category?.categoryName) {
      toast.error('Categories not loaded — refresh the page and retry')
      return
    }
    setAiLoading(true)
    setLoading(true)
    setMissingElements([])
    try {
      const response = await syndicationApi.generate(payload)
      if (response.blocked) {
        setMissingElements(response.missingElements || [])
        toast.error('5W data missing — add WHO/WHAT/WHERE/WHEN and retry')
        return
      }
      setJob(response.job)
      setJobId(response.job?.jobId || '')
      setSharedImageUrl(response.job?.images?.sharedImageUrl || sharedImageUrl)
      setSelectedTitleIndex(response.job?.selectedTitleIndex || 0)
      onJobChange?.(response.job?.jobId)
      setStep(2)
      toast.success('AI preview ready')
    } catch (error) {
      if (error instanceof SyndicationApiError && error.status === 422) {
        setMissingElements(error.data?.missingElements || [])
        toast.error('Insufficient data (5W). Update raw text and retry.')
      } else {
        toast.error(error.message || 'Generate failed')
      }
    } finally {
      setAiLoading(false)
      setLoading(false)
    }
  }

  const onSaveDraft = async () => {
    if (!rawText.trim() || !selectedTenantIds.length) return toast.error('Raw text and tenants are required')
    if (!categories.length) {
      await loadCategories()
    }
    const payload = buildPayload()
    if (!payload.category?.categoryId && !payload.category?.categoryName) {
      toast.error('Categories not loaded — refresh the page and retry')
      return
    }
    setLoading(true)
    try {
      const response = await syndicationApi.createJob({
        ...payload,
        options: { ...payload.options, autoGenerate: false },
      })
      const saved = response?.job || response
      setJob(saved)
      setJobId(saved.jobId)
      onJobChange?.(saved.jobId)
      toast.success('Draft saved')
    } catch (error) {
      toast.error(error.message || 'Failed to save draft')
    } finally {
      setLoading(false)
    }
  }

  const onPublish = async () => {
    if (!jobId) return toast.error('Generate preview first')
    if (!syndicationHasCoverImage(sharedImageUrl, tenantImages, selectedTenantIds)) {
      return toast.error('Upload at least one cover image before publishing')
    }
    if (!job?.masterPrint?.body?.length) {
      return toast.error('Print article missing — go back to Review and regenerate AI preview')
    }
    if (staleJobTenants) {
      return toast.error('Job has old tenant list (includes Kaburlu Today?). Go to Review and click Generate AI preview again.')
    }
    setLoading(true)
    setPublishSummary(null)
    try {
      const freshDomains = {
        ...tenantDomains,
        ...(await loadTenantDomains(selectedTenantIds)),
      }
      await syncReviewToJob(freshDomains)
      const shouldPublishShortNews = publishShortNews && Boolean(
        job?.shortNews?.body || job?.shortNews?.h1 || job?.shortNews?.unifiedPost,
      )
      const response = await syndicationApi.publishJob(jobId, {
        selectedTitleIndex,
        publishShortNews: shouldPublishShortNews,
        shortNewsTenantId,
        tenantDomainMap: Object.fromEntries(
          selectedTenantIds
            .map((tenantId) => [tenantId, resolvePublishDomain(freshDomains[tenantId] || [])?.id])
            .filter(([, domainId]) => Boolean(domainId)),
        ),
      })
      const summary = summarizePublishResponse(response)
      setPublishSummary(summary)

      if (summary.status === 'PARTIAL') {
        const firstError = summary.errors[0]
        const detail = firstError ? extractPublishErrorMessage(firstError) : 'Some tenants failed'
        toast.error(`Partial publish — ${detail}`)
      } else if (summary.status === 'PUBLISHED') {
        toast.success('Published to all selected tenants')
        onPublished?.(response)
      } else {
        toast.success('Publish completed')
        onPublished?.(response)
      }
      await loadJob(jobId)
      setStep(3)
    } catch (error) {
      if (error instanceof SyndicationApiError) {
        const summary = summarizePublishResponse(error.data || {})
        if (summary.errors.length) {
          setPublishSummary(summary)
        }
        toast.error(error.message || 'Publish failed')
      } else {
        toast.error(error.message || 'Publish failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const canNext = () => {
    if (step === 0) return Boolean(rawText.trim())
    if (step === 1) return selectedTenantIds.length > 0
    return true
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-24">
      <SyndicationAiLoader show={aiLoading} />

      <SyndicationStepper
        steps={STEPS}
        currentStep={step}
        onStepClick={(index) => index <= step && setStep(index)}
      />

      {step === 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Paste Telugu news</h2>
            <p className="text-sm text-slate-500 mt-1">WHO, WHAT, WHERE, WHEN include cheyandi — AI gate pass avutundi</p>
          </div>
          <FormField label="News text">
            <Textarea value={rawText} onChange={(e) => setRawText(e.target.value)} rows={12} placeholder="హైదరాబాద్: ..." className="text-base" />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Raw time (optional)" description="When the event happened">
              <Input type="datetime-local" value={rawTime} onChange={(e) => setRawTime(e.target.value)} />
            </FormField>
            <FormField label="Post time (optional)" description="When to publish on web">
              <Input type="datetime-local" value={postTime} onChange={(e) => setPostTime(e.target.value)} />
            </FormField>
          </div>
          {missingElements.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-medium">Missing 5W elements:</p>
              <ul className="list-disc ml-5 mt-1">
                {missingElements.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}

      {step === 1 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Choose newspapers</h2>
            <p className="text-sm text-slate-500 mt-1">Multi-select · Kaburlu Today short news is separate on publish step</p>
          </div>
          {metaLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-6">
              <Spinner size="sm" />
              Loading tenants…
            </div>
          ) : (
            <>
            {!tenants.length ? (
              <p className="text-sm text-amber-700">No tenants available for your account.</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {tenants.map((tenant) => {
                const checked = selectedTenantIds.includes(tenant.id)
                return (
                  <button
                    key={tenant.id}
                    type="button"
                    onClick={() => toggleTenant(tenant.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium border transition-all ${
                      checked
                        ? 'border-brand bg-brand text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {tenantLabel(tenant)}
                  </button>
                )
              })}
            </div>
            {selectedTenantIds.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-800">Print newspaper names</p>
                {selectedTenantIds.map((tenantId) => (
                  <FormField key={tenantId} label={labelForTenantId(tenantId)}>
                    <Input
                      value={nativeNames[tenantId] || ''}
                      onChange={(e) => setNativeNames((current) => ({ ...current, [tenantId]: e.target.value }))}
                      placeholder="Telugu newspaper name for print dateline"
                    />
                  </FormField>
                ))}
              </div>
            )}
          <p className="text-xs text-slate-500">{selectedTenantIds.length} newspaper(s) selected</p>
            </>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="rounded-xl bg-gradient-to-r from-brand/10 via-orange-50 to-amber-50 border border-brand/20 p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-slate-900">AI rewrite & preview</h2>
            <p className="text-sm text-slate-600 mt-1">One click — print + web + short news for all selected tenants</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button type="button" onClick={onGenerate} disabled={loading || !rawText.trim() || !selectedTenantIds.length}>
                {aiLoading ? 'Rewriting…' : job ? 'Regenerate preview' : 'Generate AI preview'}
              </Button>
              <Button type="button" variant="outline" onClick={onSaveDraft} disabled={loading}>
                Save draft
              </Button>
            </div>
          </div>
          {!job && !aiLoading && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
              <p className="font-medium text-slate-700">Preview ready kaadu</p>
              <p className="text-sm mt-1">Generate AI preview click cheyandi — Lottie animation chupistundi</p>
            </div>
          )}
          {job?.alternateTitles?.length > 0 && (
            <FormField label="Pick print headline">
              <Select
                value={String(selectedTitleIndex)}
                onChange={(e) => setSelectedTitleIndex(Number(e.target.value))}
              >
                {job.alternateTitles.map((title, index) => (
                  <option key={index} value={String(index)}>{title}</option>
                ))}
              </Select>
            </FormField>
          )}
          {job?.masterPrint?.headline && (
            <article className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-xl font-bold text-slate-900">{job.masterPrint.headline}</h3>
              {(job.masterPrint.body || []).map((block, index) => (
                <p key={index} className="mt-2 text-sm text-slate-700">{block.text}</p>
              ))}
            </article>
          )}
          {job?.tenants?.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900">Per-tenant web preview</h3>
              {job.tenants.map((tenant) => (
                <div key={tenant.tenantId} className="rounded-lg border border-slate-100 p-3">
                  <p className="text-xs text-slate-500">{tenant.nativeName}</p>
                  <p className="font-medium text-slate-900">{tenant.webArticle?.headline || '—'}</p>
                </div>
              ))}
            </div>
          )}

          {job && (
            <SyndicationImageSection
              sharedImageUrl={sharedImageUrl}
              onSharedImageUrlChange={setSharedImageUrl}
              tenantImages={tenantImages}
              onTenantImageChange={(tenantId, url) => {
                setTenantImages((current) => ({ ...current, [tenantId]: url }))
              }}
              selectedTenantIds={selectedTenantIds}
              tenantLabel={labelForTenantId}
            />
          )}
        </section>
      )}

      {step === 3 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Publish</h2>
            <p className="text-sm text-slate-500 mt-1">Go live to all selected newspapers</p>
          </div>
          {staleJobTenants && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Old job — regenerate required</p>
              <p className="mt-1">
                Saved job still has Kaburlu Today or outdated tenants. Backend will fail with
                &quot;Could not determine tenant&quot;. Go to <strong>Review</strong> and click
                <strong> Generate AI preview</strong> again (or start a new job).
              </p>
            </div>
          )}

          {domainsLoading && (
            <p className="text-sm text-slate-500">Checking tenant domains…</p>
          )}

          {!domainsLoading && tenantPublishWarnings.some((item) => item.warning) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
              <p className="font-semibold">Tenant setup warnings</p>
              {tenantPublishWarnings.filter((item) => item.warning).map((item) => (
                <p key={item.tenantId}>
                  {item.label}: {item.warning}
                  {' '}
                  <a href={`/admin/tenants/${item.tenantId}`} className="underline font-medium">Open tenant admin</a>
                </p>
              ))}
            </div>
          )}

          {!domainsLoading && tenantPublishWarnings.length > 0 && !tenantPublishWarnings.some((item) => item.warning) && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Domain check passed for {tenantPublishWarnings.length} tenant(s).
              {tenantPublishWarnings.map((item) => item.domainName && (
                <span key={item.tenantId} className="block text-xs mt-1">{item.label}: {item.domainName}</span>
              ))}
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-700 rounded-lg border border-slate-200 p-3 bg-slate-50">
            <input type="checkbox" checked={publishShortNews} onChange={(event) => setPublishShortNews(event.target.checked)} />
            Publish Kaburlu Today short news
          </label>
          {job?.status === 'PUBLISHED' && (
            <p className="text-sm text-green-700">Job status: PUBLISHED</p>
          )}
          {job?.status === 'PREVIEW_READY' && publishSummary?.status === 'PARTIAL' && (
            <p className="text-sm text-amber-700">Job status: PREVIEW_READY — fix errors below and retry publish</p>
          )}

          {publishSummary && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-900">Publish result</h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  publishSummary.status === 'PARTIAL'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {publishSummary.status}
                </span>
              </div>

              {publishSummary.outputSummary && (
                <p className="text-sm text-slate-600">
                  Print: {publishSummary.outputSummary.print ?? 0} ·
                  Web: {publishSummary.outputSummary.web ?? 0} ·
                  Short: {publishSummary.outputSummary.short ?? 0} ·
                  Total: {publishSummary.outputSummary.total ?? 0}
                </p>
              )}

              {(publishSummary.publishedPrint.length > 0 || publishSummary.publishedWeb.length > 0) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-800">Succeeded</p>
                  <ul className="text-sm text-slate-700 space-y-1">
                    {publishSummary.publishedPrint.map((item) => (
                      <li key={`print-${item.tenantId}`}>
                        Print · {labelForTenantId(item.tenantId)} · {item.headline || item.newspaperArticleId}
                      </li>
                    ))}
                    {publishSummary.publishedWeb.map((item) => (
                      <li key={`web-${item.tenantId}`}>
                        Web · {labelForTenantId(item.tenantId)} · {item.slug || item.webArticleId}
                      </li>
                    ))}
                    {publishSummary.publishedShortNews && (
                      <li>Short news · Kaburlu Today · {publishSummary.publishedShortNews.id || 'published'}</li>
                    )}
                  </ul>
                </div>
              )}

              {publishSummary.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-800">Failed tenants (backend errors)</p>
                  <ul className="space-y-2">
                    {publishSummary.errors.map((item, index) => (
                      <li key={`${item.tenantId || 'err'}-${index}`} className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                        <p className="font-medium">
                          {labelForTenantId(item.tenantId) || 'Unknown tenant'}
                          {item.tenantId ? <span className="text-xs text-red-700 font-normal ml-2">({item.tenantId})</span> : null}
                        </p>
                        <p className="mt-1">{extractPublishErrorMessage(item)}</p>
                        {item.status ? <p className="text-xs text-red-700 mt-1">HTTP {item.status}</p> : null}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-slate-500">
                    Backend publish failed — usually missing tenantId/domainId/printArticle on the saved job.
                    Go to <strong>Review → Generate AI preview</strong> again, then retry.
                    If it persists, backend syndication API needs a fix.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-3">
          <Button type="button" variant="outline" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || aiLoading}>
            Back
          </Button>
          {step < 2 ? (
            <Button type="button" onClick={() => setStep((current) => Math.min(STEPS.length - 1, current + 1))} disabled={!canNext()}>
              Continue
            </Button>
          ) : step === 2 ? (
            <Button
              type="button"
              onClick={async () => {
                if (!job) return toast.error('Generate AI preview first')
                if (!syndicationHasCoverImage(sharedImageUrl, tenantImages, selectedTenantIds)) {
                  toast.error('Upload at least one cover image before continuing')
                  return
                }
                try {
                  await syncReviewToJob()
                  setStep(3)
                } catch (error) {
                  toast.error(error.message || 'Failed to save images')
                }
              }}
              disabled={!job || aiLoading}
            >
              Continue to publish
            </Button>
          ) : (
            <Button type="button" onClick={onPublish} disabled={loading || !jobId}>
              {loading ? 'Publishing…' : publishSummary?.status === 'PARTIAL' ? 'Retry publish' : 'Publish now'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
