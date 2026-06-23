/**
 * Multi-step cartoon composer — upload → story → targeting → SEO & publish
 */

import { useCallback, useEffect, useState } from 'react'
import { newsCartoonsApi } from '../../../lib/api/services/newsCartoonsApi'
import { normalizeCartoon } from '../../../lib/newsCartoons/normalize'
import { apiClient } from '../../../lib/api/client'
import CartoonMediaUpload from './CartoonMediaUpload'
import ElectionLocationPicker, { EMPTY_ELECTION_LOCATION } from '../journalist/ElectionLocationPicker'
import { Button, FormField, Input, Select, Textarea, toast } from '../../ui'
import { formatCartoonError } from '../../../lib/newsCartoons/cartoonErrors'

const STEPS = [
  { key: 'image', label: 'Cartoon', hint: 'Upload image' },
  { key: 'story', label: 'Story', hint: 'Title & caption' },
  { key: 'target', label: 'Targeting', hint: 'Category & place' },
  { key: 'publish', label: 'SEO & publish', hint: 'Review & post' },
]

const EMPTY = {
  title: '',
  caption: '',
  rawText: '',
  imageUrl: '',
  categoryId: '',
  languageCode: 'te',
  location: { ...EMPTY_ELECTION_LOCATION },
  placeName: '',
  latitude: '',
  longitude: '',
  status: 'PUBLISHED',
  publishToShortNews: true,
  autoSeo: true,
  seo: {
    metaTitle: '',
    metaDescription: '',
    tags: '',
  },
}

function formatErr(err, fb) {
  return formatCartoonError(err, fb)
}

function parseTags(str) {
  return String(str || '')
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
}

export default function CartoonComposer({ cartoon, onSaved, onCancel }) {
  const isEdit = Boolean(cartoon?.id)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [seoLoading, setSeoLoading] = useState(false)
  const [seoPreview, setSeoPreview] = useState(null)
  const [saveError, setSaveError] = useState('')
  const [form, setForm] = useState(EMPTY)

  const [languages, setLanguages] = useState([])
  const [categories, setCategories] = useState([])
  const [langLoading, setLangLoading] = useState(false)

  useEffect(() => {
    if (!cartoon) {
      setForm({ ...EMPTY, location: { ...EMPTY_ELECTION_LOCATION } })
      setStep(0)
      setSeoPreview(null)
      return
    }
    setForm({
      title: cartoon.title || '',
      caption: cartoon.caption || '',
      rawText: cartoon.rawText || '',
      imageUrl: cartoon.imageUrl || '',
      categoryId: cartoon.categoryId || '',
      languageCode: cartoon.languageCode || 'te',
      location: {
        stateId: cartoon.stateId || '',
        districtId: cartoon.districtId || '',
        mandalId: cartoon.mandalId || '',
        stateName: '',
        districtName: '',
        mandalName: '',
      },
      placeName: cartoon.placeName || '',
      latitude: cartoon.latitude != null ? String(cartoon.latitude) : '',
      longitude: cartoon.longitude != null ? String(cartoon.longitude) : '',
      status: cartoon.status || 'PUBLISHED',
      publishToShortNews: cartoon.publishToShortNews !== false,
      autoSeo: true,
      seo: {
        metaTitle: cartoon.seo?.metaTitle || '',
        metaDescription: cartoon.seo?.metaDescription || '',
        tags: (cartoon.seo?.tags || []).join(', '),
      },
    })
    setSeoPreview(cartoon.seoSource ? { seo: cartoon.seo, seoSource: cartoon.seoSource } : null)
    setStep(0)
  }, [cartoon])

  const loadLanguages = useCallback(async () => {
    setLangLoading(true)
    try {
      const raw = await apiClient.get('/languages')
      const list = Array.isArray(raw) ? raw : raw?.data || raw?.items || []
      setLanguages(list)
    } catch {
      setLanguages([{ code: 'te', name: 'Telugu' }, { code: 'en', name: 'English' }])
    } finally {
      setLangLoading(false)
    }
  }, [])

  const loadCategories = useCallback(async (languageCode) => {
    if (!languageCode) {
      setCategories([])
      return
    }
    const lang = languages.find((l) => l.code === languageCode || l.languageCode === languageCode)
    const languageId = lang?.id
    if (!languageId) {
      setCategories([])
      return
    }
    try {
      const raw = await apiClient.get('/categories', { languageId })
      const list = Array.isArray(raw) ? raw : raw?.data || raw?.items || []
      setCategories(list)
    } catch {
      setCategories([])
    }
  }, [languages])

  useEffect(() => {
    loadLanguages()
  }, [loadLanguages])

  useEffect(() => {
    if (languages.length) loadCategories(form.languageCode)
  }, [form.languageCode, languages, loadCategories])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const validateStep = (idx) => {
    if (idx === 0 && !form.imageUrl.trim()) {
      toast.error('Upload a cartoon image first')
      return false
    }
    if (idx === 1 && !form.title.trim()) {
      toast.error('Title is required')
      return false
    }
    if (idx === 2) {
      if (!form.categoryId) {
        toast.error('Select a category')
        return false
      }
      if (!form.location.stateId) {
        toast.error('Select state')
        return false
      }
    }
    return true
  }

  const next = () => {
    if (!validateStep(step)) return
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const back = () => setStep((s) => Math.max(s - 1, 0))

  const buildBody = () => {
    const tags = parseTags(form.seo.tags)
    const seoPayload =
      form.seo.metaTitle || form.seo.metaDescription || tags.length
        ? {
            metaTitle: form.seo.metaTitle.trim() || undefined,
            metaDescription: form.seo.metaDescription.trim() || undefined,
            tags: tags.length ? tags : undefined,
          }
        : undefined

    return {
      title: form.title.trim(),
      caption: form.caption.trim() || undefined,
      rawText: form.rawText.trim() || undefined,
      imageUrl: form.imageUrl.trim(),
      categoryId: form.categoryId,
      stateId: form.location.stateId,
      districtId: form.location.districtId || undefined,
      mandalId: form.location.mandalId || undefined,
      languageCode: form.languageCode,
      placeName: form.placeName.trim() || undefined,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
      status: form.status,
      publishToShortNews: form.publishToShortNews,
      autoSeo: form.autoSeo,
      ...(seoPayload ? { seo: seoPayload } : {}),
    }
  }

  const handlePreviewSeo = async () => {
    if (!form.title.trim() || !form.imageUrl) {
      toast.error('Title and image required for SEO preview')
      return
    }
    setSeoLoading(true)
    try {
      const body = buildBody()
      const res = await newsCartoonsApi.generateSeo(body)
      const preview = res?.seo ? res : res?.data || res
      setSeoPreview(preview)
      if (preview?.seo) {
        setForm((f) => ({
          ...f,
          seo: {
            metaTitle: preview.seo.metaTitle || f.seo.metaTitle,
            metaDescription: preview.seo.metaDescription || f.seo.metaDescription,
            tags: (preview.seo.tags || []).join(', ') || f.seo.tags,
          },
        }))
      }
      toast.success('SEO preview generated')
    } catch (err) {
      toast.error(formatErr(err, 'SEO preview failed'))
    } finally {
      setSeoLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) return

    setSaving(true)
    setSaveError('')
    try {
      const body = buildBody()
      let res
      if (isEdit) {
        res = await newsCartoonsApi.patch(cartoon.id, body)
      } else {
        res = await newsCartoonsApi.create(body)
      }
      const saved = normalizeCartoon(res?.cartoon || res)
      toast.success(isEdit ? 'Cartoon updated' : 'Cartoon published')
      onSaved?.(saved)
    } catch (err) {
      const msg = formatErr(err, 'Save failed')
      setSaveError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Step indicator */}
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap gap-2 sm:gap-0 sm:justify-between">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => i < step || validateStep(step) ? setStep(i) : null}
              className={`flex items-center gap-2 sm:flex-1 sm:flex-col sm:py-1 px-2 rounded-lg transition-colors ${
                i === step ? 'text-slate-900' : i < step ? 'text-brand' : 'text-slate-400'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                  i < step
                    ? 'bg-brand text-white'
                    : i === step
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-200 text-slate-500'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </span>
              <span className="text-left sm:text-center">
                <span className="block text-xs font-semibold">{s.label}</span>
                <span className="hidden sm:block text-[10px] text-slate-400">{s.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6 max-w-3xl">
        {step === 0 ? (
          <FormField label="Cartoon image" required>
            <CartoonMediaUpload value={form.imageUrl} onChange={(url) => set('imageUrl', url)} />
          </FormField>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <FormField label="Title" required>
              <Input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="అసెంబ్లీ కార్టూన్"
              />
            </FormField>
            <FormField label="Caption" hint="Short line under the image in the app">
              <Input
                value={form.caption}
                onChange={(e) => set('caption', e.target.value)}
                placeholder="ఈ రోజు అసెంబ్లీ వివాదం"
              />
            </FormField>
            <FormField label="Story / context" hint="Optional — helps AI SEO and editors">
              <Textarea
                value={form.rawText}
                onChange={(e) => set('rawText', e.target.value)}
                rows={5}
                placeholder="విపక్ష నాయకులు వాక్స్ ఆఫ్…"
              />
            </FormField>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Language" required>
                <Select
                  value={form.languageCode}
                  onChange={(e) => {
                    set('languageCode', e.target.value)
                    set('categoryId', '')
                  }}
                  disabled={langLoading}
                >
                  {languages.map((l) => (
                    <option key={l.id || l.code} value={l.code || l.languageCode}>
                      {l.name || l.code}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Category" required>
                <Select
                  value={form.categoryId}
                  onChange={(e) => set('categoryId', e.target.value)}
                >
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <FormField label="Location">
              <ElectionLocationPicker
                level="MANDAL"
                value={form.location}
                onChange={(loc) => set('location', loc)}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Place name">
                <Input
                  value={form.placeName}
                  onChange={(e) => set('placeName', e.target.value)}
                  placeholder="Hyderabad"
                />
              </FormField>
              <FormField label="Latitude">
                <Input
                  value={form.latitude}
                  onChange={(e) => set('latitude', e.target.value)}
                  placeholder="17.385"
                  inputMode="decimal"
                />
              </FormField>
              <FormField label="Longitude">
                <Input
                  value={form.longitude}
                  onChange={(e) => set('longitude', e.target.value)}
                  placeholder="78.486"
                  inputMode="decimal"
                />
              </FormField>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            {saveError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {saveError}
              </div>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Status">
                <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </Select>
              </FormField>
              <FormField label="Short News feed">
                <label className="flex items-center gap-2 h-[42px] text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.publishToShortNews}
                    onChange={(e) => set('publishToShortNews', e.target.checked)}
                  />
                  Publish to Short News feed
                </label>
              </FormField>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoSeo}
                onChange={(e) => set('autoSeo', e.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="text-sm font-medium text-slate-800">Auto SEO (recommended)</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  Backend generates meta title, description, tags, and slug. Your fields below merge
                  with AI when provided.
                </span>
              </span>
            </label>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" loading={seoLoading} onClick={handlePreviewSeo}>
                Preview SEO
              </Button>
              {seoPreview?.seoSource ? (
                <span className="text-xs text-slate-500 self-center">
                  Last preview source: <strong>{seoPreview.seoSource}</strong>
                </span>
              ) : null}
            </div>

            <FormField label="Meta title">
              <Input
                value={form.seo.metaTitle}
                onChange={(e) => setForm((f) => ({ ...f, seo: { ...f.seo, metaTitle: e.target.value } }))}
              />
            </FormField>
            <FormField label="Meta description">
              <Textarea
                value={form.seo.metaDescription}
                onChange={(e) =>
                  setForm((f) => ({ ...f, seo: { ...f.seo, metaDescription: e.target.value } }))
                }
                rows={3}
              />
            </FormField>
            <FormField label="Tags" hint="comma-separated">
              <Input
                value={form.seo.tags}
                onChange={(e) => setForm((f) => ({ ...f, seo: { ...f.seo, tags: e.target.value } }))}
                placeholder="politics, assembly, cartoon"
              />
            </FormField>

            {form.imageUrl ? (
              <div className="rounded-xl border border-slate-100 p-3 flex gap-4 items-start bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.imageUrl} alt="" className="w-24 h-24 object-cover rounded-lg shrink-0" />
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-slate-900 truncate">{form.title || 'Untitled'}</p>
                  <p className="text-slate-500 text-xs mt-1 line-clamp-2">{form.caption}</p>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="border-t border-slate-100 px-4 sm:px-6 py-4 flex flex-wrap justify-between gap-3 bg-slate-50/50">
        <div className="flex gap-2">
          {onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={back}>
              Back
            </Button>
          ) : null}
        </div>
        <div className="flex gap-2">
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next}>
              Continue
            </Button>
          ) : (
            <Button type="button" loading={saving} onClick={handleSubmit}>
              {isEdit ? 'Save changes' : 'Publish cartoon'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
