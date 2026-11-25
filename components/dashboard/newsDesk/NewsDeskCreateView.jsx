import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useLayout } from '../DashboardLayout'
import newsDeskApi, { formatNewsDeskError } from '../../../lib/api/services/newsDeskApi'
import { buildNewsDeskIntakePayload, assertV2CreateResponse } from '../../../lib/newsDesk/buildIntakePayload'
import {
  buildLocationHintFromFields,
  canonicalStateFromText,
  formatLocationHintDisplay,
} from '../../../lib/newsDesk/locationHint'
import {
  buildNewsDeskCategoryPayload,
  categoryPayloadNameOnly,
  loadNewsDeskCategories,
  pickNewsDeskDefaultCategoryId,
} from '../../../lib/newsDesk/categoryLoader'
import {
  buildTenantsIntakePayload,
  loadNewsDeskTenants,
} from '../../../lib/newsDesk/tenantList'
import { filterTenantsForOperator, resolveIntakeTenantSelection } from '../../../lib/newsDesk/operatorTenants'
import NewsDeskTenantPicker from './NewsDeskTenantPicker'
import { languagesService } from '../../../lib/api/services'
import NewsDeskAccessGate from './NewsDeskAccessGate'
import NewsDeskImageUploader from './NewsDeskImageUploader'
import NewsDeskStructuredPaste from './NewsDeskStructuredPaste'
import { applyStructuredPasteToForm } from '../../../lib/newsDesk/applyStructuredPaste'
import { uploadDeskImages } from '../../../lib/newsDesk/uploadDeskImages'
import { Button, FormField, Input, Select, Spinner, Textarea, toast } from '../../ui'
import NewsDeskPageShell from './NewsDeskPageShell'
import NewsDeskPageHeader from './NewsDeskPageHeader'
import NewsDeskSection from './NewsDeskSection'
import NewsDeskLocationSearch from './NewsDeskLocationSearch'
import NewsDeskTenantImageOverrides from './NewsDeskTenantImageOverrides'
import { DEFAULT_NEWS_ROOM_BASE, newsRoomPaths } from '../../../lib/newsDesk/paths'

const ATTRIBUTION_TYPES = [
  { value: 'DESK', label: 'Desk' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'GOOGLE', label: 'Google / web' },
  { value: 'TRENDING', label: 'Trending' },
  { value: 'SOCIAL', label: 'Social' },
]

export default function NewsDeskCreateView({ basePath = DEFAULT_NEWS_ROOM_BASE }) {
  const paths = newsRoomPaths(basePath)
  const router = useRouter()
  const { user } = useLayout()
  const [categories, setCategories] = useState([])
  const [languages, setLanguages] = useState([])
  const [metaLoading, setMetaLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [headline, setHeadline] = useState('')
  const [rawText, setRawText] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [attributionType, setAttributionType] = useState('DESK')
  const [attributionPlatform, setAttributionPlatform] = useState('')
  const [attributionCustom, setAttributionCustom] = useState('')
  const [locationState, setLocationState] = useState('')
  const [locationDistrict, setLocationDistrict] = useState('')
  const [locationMandal, setLocationMandal] = useState('')
  const [locationArea, setLocationArea] = useState('')
  const [locationNote, setLocationNote] = useState('')
  const [locationMaster, setLocationMaster] = useState(null)
  const [deskTenants, setDeskTenants] = useState([])
  const [selectedTenantIds, setSelectedTenantIds] = useState([])
  const [tenantScope, setTenantScope] = useState({ lockSelection: false, hidePicker: false })
  const [sourcePreview, setSourcePreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [languageCode, setLanguageCode] = useState('te')
  const [images, setImages] = useState([])
  const [tenantImageOverrides, setTenantImageOverrides] = useState({})
  const [intakeHighlight, setIntakeHighlight] = useState(false)
  const articleFieldRef = useRef(null)
  const locationPreview = formatLocationHintDisplay(
    buildLocationHintFromFields({
      state: locationState,
      district: locationDistrict,
      mandal: locationMandal,
      area: locationArea,
      note: locationNote,
    }),
  )

  useEffect(() => {
    ;(async () => {
      setMetaLoading(true)
      try {
        const [cats, langs, tenants, scope] = await Promise.all([
          loadNewsDeskCategories(),
          languagesService.getAll(),
          loadNewsDeskTenants().catch(() => []),
          newsDeskApi.getOperatorScope().catch(() => null),
        ])
        const scopedTenants = filterTenantsForOperator(tenants, scope)
        const intake = resolveIntakeTenantSelection(scope, scopedTenants)
        setCategories(cats)
        setLanguages(langs || [])
        setDeskTenants(scopedTenants)
        setSelectedTenantIds(intake.selectedIds)
        setTenantScope({ lockSelection: intake.lockSelection, hidePicker: intake.hidePicker })
        setCategoryId(pickNewsDeskDefaultCategoryId(cats))
        const te = (langs || []).find((l) => (l.code || l.languageCode || '').toLowerCase() === 'te')
        if (te?.code) setLanguageCode(te.code)
        else if (te?.languageCode) setLanguageCode(te.languageCode)
      } catch (error) {
        toast.error(error.message || 'Failed to load form options')
      } finally {
        setMetaLoading(false)
      }
    })()
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    const text = rawText.trim()
    if (!text) {
      toast.error('Article content is required')
      return
    }
    if (!categoryId) {
      toast.error('Category is required')
      return
    }
    if (!selectedTenantIds.length) {
      toast.error('Select at least one target tenant')
      return
    }

    const sourceAttribution = { type: attributionType }
    if (attributionPlatform.trim()) sourceAttribution.platform = attributionPlatform.trim().toUpperCase()
    if (attributionCustom.trim()) sourceAttribution.customText = attributionCustom.trim()

    const baseHint =
      buildLocationHintFromFields({
        state: locationState,
        district: locationDistrict,
        mandal: locationMandal,
        area: locationArea,
        note: locationNote,
      }) || {}
    const locationHint = { ...baseHint, ...(locationMaster ? { master: locationMaster } : {}) }
    const cleanLocationHint = Object.keys(locationHint).length ? locationHint : null

    const tenantPayload = buildTenantsIntakePayload(selectedTenantIds, deskTenants, tenantImageOverrides)
    if (!tenantPayload.length) {
      toast.error('Could not resolve tenant names — reload the page')
      return
    }

    const buildPayload = (category) =>
      buildNewsDeskIntakePayload({
        rawText: text,
        headline,
        category,
        sourceUrl,
        sourceAttribution,
        locationHint: cleanLocationHint,
        languageCode,
        imageUrls: images,
        tenantImages: tenantImageOverrides,
        tenants: tenantPayload,
      })

    setSubmitting(true)
    try {
      let response
      try {
        response = await newsDeskApi.createSubmission(
          buildPayload(buildNewsDeskCategoryPayload(categoryId, categories)),
        )
      } catch (firstErr) {
        const msg = String(firstErr?.message || '')
        const code = firstErr?.code || firstErr?.data?.code
        if (code === 'INVALID_CATEGORY' || /categoryId not found/i.test(msg)) {
          const retryCategory = categoryPayloadNameOnly(categoryId, categories)
          if (!retryCategory.categoryName) throw firstErr
          toast.warning('Retrying with category name…')
          response = await newsDeskApi.createSubmission(buildPayload(retryCategory))
        } else {
          throw firstErr
        }
      }
      const check = assertV2CreateResponse(response)
      if (!check.ok) {
        toast.error(check.message)
        if (check.jobId) router.push(paths.review(check.jobId))
        return
      }
      toast.success('News submitted — added to queue')
      router.push(`${paths.posts}?highlight=${encodeURIComponent(check.jobId)}&tab=queue`)
    } catch (error) {
      toast.error(formatNewsDeskError(error))
    } finally {
      setSubmitting(false)
    }
  }

  const onPreviewSource = async () => {
    const url = sourceUrl.trim()
    if (!url) {
      toast.error('Enter a source URL first')
      return
    }
    setPreviewLoading(true)
    setSourcePreview(null)
    try {
      const res = await newsDeskApi.previewSource(url)
      setSourcePreview(res)
      const title = res?.preview?.title
      if (title && !headline.trim()) setHeadline(title)
      if (res?.platform && !attributionPlatform.trim()) {
        setAttributionPlatform(String(res.platform))
      }
      toast.success('Source preview loaded')
    } catch (error) {
      toast.error(formatNewsDeskError(error))
    } finally {
      setPreviewLoading(false)
    }
  }

  if (metaLoading) {
    return (
      <NewsDeskAccessGate user={user}>
        <NewsDeskPageShell maxWidth="max-w-3xl">
          <div className="flex justify-center py-24">
            <Spinner size="lg" />
          </div>
        </NewsDeskPageShell>
      </NewsDeskAccessGate>
    )
  }

  return (
    <NewsDeskAccessGate user={user}>
      <NewsDeskPageShell maxWidth="max-w-3xl">
        <NewsDeskPageHeader
          backHref={paths.posts}
          backLabel="All submissions"
          title="New intake"
          description="Snapshot is saved immediately; facts extraction runs in the background."
          actions={
            <Link href={paths.settings}>
              <Button type="button" variant="ghost" size="sm">
                Settings
              </Button>
            </Link>
          }
        />

        <NewsDeskStructuredPaste
          disabled={submitting}
          onApplied={() => {
            setIntakeHighlight(true)
            window.setTimeout(() => setIntakeHighlight(false), 4000)
            document.getElementById('news-desk-intake-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            window.setTimeout(() => {
              articleFieldRef.current?.focus?.()
            }, 450)
          }}
          onParse={async (text, files) => {
            const result = await applyStructuredPasteToForm(text, categories, {
              setHeadline,
              setRawText,
              setCategoryId,
              setSourceUrl,
              setAttributionType,
              setAttributionCustom,
              setLocationDistrict,
              setLocationMandal,
              setLocationArea,
              setLocationNote,
              setImages,
              setSourcePreview,
            })
            const extra = result.summary.filter((s) => s.includes('unmatched'))
            if (extra.length) toast.warning(extra.join('; '))
            if (files?.length) {
              const { uploaded, failed } = await uploadDeskImages(files)
              if (uploaded.length) setImages((prev) => [...prev, ...uploaded])
              if (failed) toast.error(`${failed} pasted image(s) failed to upload`)
            }
            return result
          }}
          onUploadFiles={async (files) => {
            const { uploaded, failed } = await uploadDeskImages(files)
            if (uploaded.length) setImages((prev) => [...prev, ...uploaded])
            if (failed) toast.error(`${failed} image(s) failed to upload`)
          }}
        />

        <form
          id="news-desk-intake-form"
          onSubmit={onSubmit}
          className={`space-y-5 transition-shadow ${intakeHighlight ? 'ring-2 ring-brand/25 rounded-xl' : ''}`}
        >
          <NewsDeskSection title="Story" subtitle="Headline and full article text">
            <div className="space-y-4">
              <FormField label="Headline" hint="Optional — shown in lists when provided">
                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} disabled={submitting} />
              </FormField>
              <FormField label="Article content" required>
                <Textarea
                  ref={articleFieldRef}
                  id="news-desk-article"
                  rows={12}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  disabled={submitting}
                  placeholder="Paste the full original article text"
                />
              </FormField>
              <FormField label="Category" required>
                <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={submitting}>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.categoryName}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Language">
                <Select value={languageCode} onChange={(e) => setLanguageCode(e.target.value)} disabled={submitting}>
                  {(languages || []).map((lang) => {
                    const code = lang.code || lang.languageCode
                    const name = lang.name || lang.languageName || code
                    return (
                      <option key={lang.id || code} value={code}>
                        {name}
                      </option>
                    )
                  })}
                </Select>
              </FormField>
            </div>
          </NewsDeskSection>

          <NewsDeskSection title="Routing" subtitle="Which publisher(s) receive this intake">
            {tenantScope.hidePicker ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Assigned tenant</p>
                <p className="text-sm font-medium text-slate-900 mt-0.5">
                  {deskTenants.find((t) => t.id === selectedTenantIds[0])?.name || 'Your assigned tenant'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Set in Settings — no pick needed each post.</p>
              </div>
            ) : (
              <>
                {tenantScope.lockSelection ? (
                  <p className="text-xs text-slate-500 mb-3">
                    Pre-selected from your assigned tenants ({selectedTenantIds.length}).
                  </p>
                ) : null}
                <NewsDeskTenantPicker
                  tenants={deskTenants}
                  selectedIds={selectedTenantIds}
                  onChange={setSelectedTenantIds}
                  disabled={submitting || tenantScope.lockSelection}
                />
                {selectedTenantIds.length > 0 && images.length > 0 ? (
                  <NewsDeskSection
                    title="Publisher images"
                    subtitle="Optional hero per site — publish uses intake images only (max 8)"
                  >
                    <NewsDeskTenantImageOverrides
                      tenants={deskTenants.filter((t) => selectedTenantIds.includes(t.id))}
                      intakeImages={images}
                      overrides={tenantImageOverrides}
                      onChange={setTenantImageOverrides}
                      disabled={submitting}
                    />
                  </NewsDeskSection>
                ) : null}
              </>
            )}
          </NewsDeskSection>

          <NewsDeskSection title="Source" subtitle="URL, attribution, and optional preview">
            <div className="space-y-4">
              <FormField label="Source URL">
                <div className="flex flex-wrap gap-2">
                  <Input
                    type="url"
                    className="flex-1 min-w-[12rem]"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    disabled={submitting}
                    placeholder="https://…"
                  />
                  <Button type="button" variant="outline" size="sm" disabled={submitting || previewLoading} onClick={onPreviewSource}>
                    {previewLoading ? <Spinner size="sm" className="mr-2" /> : null}
                    Preview
                  </Button>
                </div>
              </FormField>
              {sourcePreview?.preview ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm space-y-1">
                  <p className="font-medium text-slate-800">{sourcePreview.preview.title || 'No title in preview'}</p>
                  {sourcePreview.preview.description ? (
                    <p className="text-slate-600 text-xs line-clamp-3">{sourcePreview.preview.description}</p>
                  ) : null}
                  <p className="text-xs text-slate-500">
                    Platform: {sourcePreview.platform || '—'} · Status: {sourcePreview.previewStatus || '—'}
                  </p>
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Source attribution">
                  <Select value={attributionType} onChange={(e) => setAttributionType(e.target.value)} disabled={submitting}>
                    {ATTRIBUTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Platform (optional)" hint="For social sources">
                  <Input
                    value={attributionPlatform}
                    onChange={(e) => setAttributionPlatform(e.target.value)}
                    disabled={submitting}
                    placeholder="YOUTUBE, X, …"
                  />
                </FormField>
              </div>
              <FormField label="Attribution note">
                <Input value={attributionCustom} onChange={(e) => setAttributionCustom(e.target.value)} disabled={submitting} />
              </FormField>
            </div>
          </NewsDeskSection>

          <NewsDeskSection
            title="Location hint"
            subtitle={
              locationPreview
                ? `Saved on snapshot: ${locationPreview}`
                : 'Optional — district / mandal help routing & AI checks'
            }
          >
            <div className="space-y-3">
              <NewsDeskLocationSearch
                disabled={submitting}
                selectedLabel={locationMaster?.displayName || locationPreview}
                state={locationState}
                district={locationDistrict}
                mandal={locationMandal}
                area={locationArea}
                onPick={({ state, district, mandal, area: pickedArea, master }) => {
                  const districtAsState = canonicalStateFromText(district)
                  const isStatePick =
                    master?.level === 'state' || Boolean(state && !district) || Boolean(districtAsState && !state)
                  if (isStatePick) {
                    setLocationState(state || districtAsState || master?.displayName || district || '')
                    setLocationDistrict('')
                    setLocationMandal(mandal || '')
                  } else {
                    setLocationDistrict(district || '')
                    setLocationMandal(mandal || '')
                    if (state) setLocationState(state)
                  }
                  if (pickedArea) setLocationArea(pickedArea)
                  setLocationMaster(master || null)
                }}
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <FormField label="State (రాష్ట్రం)">
                  <Input
                    value={locationState}
                    onChange={(e) => setLocationState(e.target.value)}
                    disabled={submitting}
                    placeholder="Telangana / తెలంగాణ"
                  />
                </FormField>
                <FormField label="District">
                  <Input
                    value={locationDistrict}
                    onChange={(e) => setLocationDistrict(e.target.value)}
                    disabled={submitting}
                    placeholder="Hyderabad"
                  />
                </FormField>
                <FormField label="Mandal">
                  <Input
                    value={locationMandal}
                    onChange={(e) => setLocationMandal(e.target.value)}
                    disabled={submitting}
                    placeholder="Charminar"
                  />
                </FormField>
                <FormField label="Area">
                  <Input
                    value={locationArea}
                    onChange={(e) => setLocationArea(e.target.value)}
                    disabled={submitting}
                    placeholder="Bangaru Peta"
                  />
                </FormField>
              </div>
              <FormField label="Region note" hint="State / broader area (optional)">
                <Input
                  value={locationNote}
                  onChange={(e) => setLocationNote(e.target.value)}
                  disabled={submitting}
                  placeholder="Optional — not the state field above"
                />
              </FormField>
            </div>
          </NewsDeskSection>

          <NewsDeskSection title="Media" subtitle="Up to 8 images at intake — used at publish (order matters for default hero)">
            <NewsDeskImageUploader images={images} onChange={setImages} disabled={submitting} />
          </NewsDeskSection>

          <div className="flex flex-wrap items-center gap-3 sticky bottom-0 py-3 bg-slate-50/90 border-t border-slate-200 -mx-1 px-1 backdrop-blur-sm rounded-lg">
            <Button type="submit" disabled={submitting}>
              {submitting ? <Spinner size="sm" className="mr-2" /> : null}
              Submit intake
            </Button>
            <Link href={paths.posts}>
              <Button type="button" variant="ghost" disabled={submitting}>
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </NewsDeskPageShell>
    </NewsDeskAccessGate>
  )
}