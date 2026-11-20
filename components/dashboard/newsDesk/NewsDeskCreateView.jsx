import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useLayout } from '../DashboardLayout'
import newsDeskApi, { formatNewsDeskError } from '../../../lib/api/services/newsDeskApi'
import { buildNewsDeskIntakePayload, assertV2CreateResponse } from '../../../lib/newsDesk/buildIntakePayload'
import { loadNewsDeskCategories } from '../../../lib/newsDesk/categoryLoader'
import { languagesService } from '../../../lib/api/services'
import NewsDeskAccessGate from './NewsDeskAccessGate'
import NewsDeskImageUploader from './NewsDeskImageUploader'
import { Button, FormField, Input, Select, Spinner, Textarea, toast } from '../../ui'

const ATTRIBUTION_TYPES = [
  { value: 'DESK', label: 'Desk' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'GOOGLE', label: 'Google / web' },
  { value: 'TRENDING', label: 'Trending' },
  { value: 'SOCIAL', label: 'Social' },
]

export default function NewsDeskCreateView() {
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
  const [locationHint, setLocationHint] = useState('')
  const [languageCode, setLanguageCode] = useState('te')
  const [images, setImages] = useState([])

  useEffect(() => {
    ;(async () => {
      setMetaLoading(true)
      try {
        const [cats, langs] = await Promise.all([loadNewsDeskCategories(), languagesService.getAll()])
        setCategories(cats)
        setLanguages(langs || [])
        if (cats[0]?.categoryId) setCategoryId(cats[0].categoryId)
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

    const sourceAttribution = { type: attributionType }
    if (attributionPlatform.trim()) sourceAttribution.platform = attributionPlatform.trim().toUpperCase()
    if (attributionCustom.trim()) sourceAttribution.customText = attributionCustom.trim()

    const payload = buildNewsDeskIntakePayload({
      rawText: text,
      headline,
      categoryId,
      sourceUrl,
      sourceAttribution,
      locationHint,
      languageCode,
      imageUrls: images,
    })

    setSubmitting(true)
    try {
      const response = await newsDeskApi.createSubmission(payload)
      const check = assertV2CreateResponse(response)
      if (!check.ok) {
        toast.error(check.message)
        if (check.jobId) router.push(`/admin/news-desk/${check.jobId}`)
        return
      }
      toast.success('News submitted to News Desk pipeline')
      router.push(`/admin/news-desk/${check.jobId}`)
    } catch (error) {
      toast.error(formatNewsDeskError(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (metaLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <NewsDeskAccessGate user={user}>
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create News Desk intake</h1>
            <p className="text-sm text-slate-500 mt-1">Original copy is saved as an immutable snapshot; facts extract asynchronously.</p>
          </div>
          <Link href="/admin/news-desk">
            <Button type="button" variant="outline">← Dashboard</Button>
          </Link>
        </header>

        <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <FormField label="Headline" hint="Optional — shown in lists when provided">
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} disabled={submitting} />
          </FormField>

          <FormField label="Article content" required>
            <Textarea
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
                <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Source URL">
            <Input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} disabled={submitting} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Source attribution">
              <Select value={attributionType} onChange={(e) => setAttributionType(e.target.value)} disabled={submitting}>
                {ATTRIBUTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Platform (optional)" hint="For social sources">
              <Input value={attributionPlatform} onChange={(e) => setAttributionPlatform(e.target.value)} disabled={submitting} placeholder="YOUTUBE, X, …" />
            </FormField>
          </div>

          <FormField label="Attribution note">
            <Input value={attributionCustom} onChange={(e) => setAttributionCustom(e.target.value)} disabled={submitting} />
          </FormField>

          <FormField label="Location hint">
            <Input value={locationHint} onChange={(e) => setLocationHint(e.target.value)} disabled={submitting} placeholder="District, landmark, or brief note" />
          </FormField>

          <FormField label="Language">
            <Select value={languageCode} onChange={(e) => setLanguageCode(e.target.value)} disabled={submitting}>
              {(languages || []).map((lang) => {
                const code = lang.code || lang.languageCode
                const name = lang.name || lang.languageName || code
                return (
                  <option key={lang.id || code} value={code}>{name}</option>
                )
              })}
            </Select>
          </FormField>

          <NewsDeskImageUploader images={images} onChange={setImages} disabled={submitting} />

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? <Spinner size="sm" className="mr-2" /> : null}
              Submit to News Desk
            </Button>
            <p className="text-xs text-slate-500">V2 pipeline — does not run legacy syndication generate/publish.</p>
          </div>
        </form>
      </div>
    </NewsDeskAccessGate>
  )
}