import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import smartDesignApi from '../../../lib/api/services/smartDesignApi'
import epaperApi from '../../../lib/api/services/epaperApi'
import mediaApi from '../../../lib/api/services/mediaApi'
import { setHeaderStyleCatalogCache } from '../../../lib/epaper/headerStyleCatalog'
import { formToSmartDesignPayload, smartDesignToForm } from '../../../lib/epaper/smartDesignForm'
import {
  formToNewspaperConfigPayload,
  newspaperConfigToForm,
} from '../../../lib/epaper/newspaperConfigForm'
import { Button, ConfirmDialog, FormField, Input, Select, Spinner, toast } from '../../ui'

const todayIso = () => new Date().toISOString().slice(0, 10)

const EMPTY_FORM = {
  paperType: 'TABLOID',
  defaultPageCount: 8,
  perPageCostMonthly: 0,
  paperSellCost: 5,
  headerStyleNumber: 1,
  subHeaderStyleNumber: 1,
  headerData: '',
  tagline: '',
  websiteUrl: '',
  publishedAreaText: '',
  headerLogoUrl: '',
  paperNameImageUrl: '',
  headerLeftImageUrl: '',
  headerRightImageUrl: '',
  subHeaderLogoUrl: '',
  lastPageFooterText: '',
  volumeStartNumber: 1,
  volumeStartYear: new Date().getFullYear(),
  issueStartNumber: 1,
  issueStartDate: todayIso(),
  issueCounterMode: 'SEQUENTIAL',
  newsCloseTime: '23:00',
  languageCode: 'te',
}

function formatIst(value) {
  if (!value) return '—'
  const m = String(value).match(/T(\d{2}:\d{2})/)
  const d = String(value).slice(0, 10)
  return m ? `${d} ${m[1]}` : String(value)
}

function validateForm(form) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(form.issueStartDate || ''))) {
    return 'Issue start date is required (YYYY-MM-DD).'
  }
  const issueStart = Number(form.issueStartNumber)
  if (!Number.isFinite(issueStart) || issueStart < 1 || issueStart > 365) {
    return 'Issue start number must be between 1 and 365.'
  }
  if (!/^\d{2}:\d{2}$/.test(String(form.newsCloseTime || ''))) {
    return 'News close time must be HH:MM.'
  }
  if (Number(form.defaultPageCount) < 1) return 'Pages must be at least 1.'
  return ''
}

function Section({ title, description, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="border-b border-slate-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}

function ImageField({ label, hint, value, onChange, onUpload, uploading, disabled }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="text-[10px] text-slate-400">No image</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-800">{label}</p>
          {hint ? <p className="text-[11px] text-slate-500">{hint}</p> : null}
        </div>
      </div>
      <Input
        size="sm"
        type="url"
        className="mt-3"
        value={value || ''}
        disabled={disabled}
        placeholder="https://… or upload"
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-2 flex items-center gap-2">
        <label
          className={`inline-flex cursor-pointer items-center rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 ${
            disabled || uploading ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          {uploading ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUpload(file)
              e.target.value = ''
            }}
          />
        </label>
        {value ? (
          <button
            type="button"
            className="text-xs text-red-600 hover:underline"
            disabled={disabled}
            onClick={() => onChange('')}
          >
            Remove
          </button>
        ) : null}
      </div>
    </div>
  )
}

function StatusDot({ configured }) {
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${configured ? 'bg-emerald-500' : 'bg-slate-300'}`}
      aria-hidden
    />
  )
}

function ScopeButton({ active, configured, title, subtitle, meta, onClick, indent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
        indent ? 'pl-7' : ''
      } ${active ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-800'}`}
    >
      <StatusDot configured={configured} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span className={`block text-[11px] ${active ? 'text-slate-300' : 'text-slate-500'}`}>{subtitle}</span>
      </span>
      {meta ? (
        <span className={`shrink-0 text-[11px] tabular-nums ${active ? 'text-slate-300' : 'text-slate-500'}`}>
          {meta}
        </span>
      ) : null}
    </button>
  )
}

export default function TenantEpaperTab({ tenantContext }) {
  const tenantId = tenantContext?.tenantId

  const [catalog, setCatalog] = useState(null)
  const [styles, setStyles] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [selected, setSelected] = useState(null)
  const [design, setDesign] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [dirty, setDirty] = useState(false)
  const [scopeLoading, setScopeLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [uploading, setUploading] = useState({})
  const [collect, setCollect] = useState(null)
  const [collecting, setCollecting] = useState(false)

  const [defaultsOpen, setDefaultsOpen] = useState(false)
  const [defaults, setDefaults] = useState(null)
  const [defaultsSaving, setDefaultsSaving] = useState(false)

  const editions = useMemo(() => catalog?.editions || [], [catalog])
  const mainStyles = useMemo(() => styles?.mainHeaders || [], [styles])
  const subStyles = useMemo(() => styles?.subHeaders || [], [styles])

  const selectedEdition = useMemo(
    () => editions.find((e) => e.id === selected?.editionId) || null,
    [editions, selected]
  )
  const selectedSub = useMemo(
    () => selectedEdition?.subEditions?.find((s) => s.id === selected?.subEditionId) || null,
    [selectedEdition, selected]
  )

  const mainStyle = mainStyles.find((s) => Number(s.number) === Number(form.headerStyleNumber))
  const subStyle = subStyles.find((s) => Number(s.number) === Number(form.subHeaderStyleNumber))
  const caps = {
    headerLogoUrl: mainStyle?.supportsCenterLogo !== false,
    paperNameImageUrl: mainStyle?.supportsPaperNameImage === true,
    headerLeftImageUrl: mainStyle?.supportsLeftImage !== false,
    headerRightImageUrl: mainStyle?.supportsRightImage !== false,
    subHeaderLogoUrl: subStyle?.supportsSubHeaderCenterImage !== false,
  }

  const loadCatalog = useCallback(async () => {
    if (!tenantId) return null
    setLoadError('')
    try {
      const res = await smartDesignApi.getEditions(tenantId)
      setCatalog(res)
      return res
    } catch (e) {
      setLoadError(e?.message || 'Failed to load editions')
      return null
    }
  }, [tenantId])

  useEffect(() => {
    if (!tenantId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const [cat, st, cfg] = await Promise.all([
        loadCatalog(),
        smartDesignApi.getHeaderStyles(tenantId).catch(() => null),
        epaperApi.getNewspaperConfig(tenantId).catch(() => null),
      ])
      if (cancelled) return
      if (st) {
        setStyles(st)
        setHeaderStyleCatalogCache(st)
      }
      setDefaults(newspaperConfigToForm(cfg || {}))
      const first = cat?.editions?.[0]
      if (first) setSelected({ editionId: first.id, subEditionId: null })
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [tenantId, loadCatalog])

  const loadScope = useCallback(
    async (scope) => {
      if (!tenantId || !scope?.editionId) return
      setScopeLoading(true)
      setCollect(null)
      try {
        const query = { publicationEditionId: scope.editionId }
        if (scope.subEditionId) query.subEditionId = scope.subEditionId
        const res = await smartDesignApi.getByEdition(tenantId, query)
        const found = res?.exists && res?.design ? res.design : null
        setDesign(found)
        setForm(found ? { ...EMPTY_FORM, ...smartDesignToForm(found) } : { ...EMPTY_FORM })
        setDirty(false)
      } catch (e) {
        toast.error(e?.message || 'Failed to load design')
      } finally {
        setScopeLoading(false)
      }
    },
    [tenantId]
  )

  useEffect(() => {
    if (selected) loadScope(selected)
  }, [selected, loadScope])

  const selectScope = (editionId, subEditionId = null) => {
    if (dirty && !window.confirm('You have unsaved changes. Discard them?')) return
    setSelected({ editionId, subEditionId })
  }

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    setDirty(true)
  }

  const handleUpload = async (field, file) => {
    setUploading((prev) => ({ ...prev, [field]: true }))
    try {
      const result = await mediaApi.upload(file, `tenants/${tenantId}/epaper/smart-design`)
      const url =
        result?.internalUrl || result?.data?.internalUrl || result?.data?.internalPath || result?.url || ''
      if (!url) throw new Error('Upload succeeded but no URL returned')
      setField(field, url)
      if (field === 'headerLogoUrl' && !caps.paperNameImageUrl) setField('paperNameImageUrl', url)
      toast.success('Image uploaded — save to apply')
    } catch (e) {
      toast.error(e?.message || 'Upload failed')
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }))
    }
  }

  const handleSave = async () => {
    if (!selected) return
    const problem = validateForm(form)
    if (problem) {
      toast.error(problem)
      return
    }
    setSaving(true)
    try {
      const payload = formToSmartDesignPayload(form, {
        editionId: selected.editionId,
        subEditionId: selected.subEditionId,
        scopeType: selected.subEditionId ? 'sub-edition' : 'edition',
      })
      let saved
      if (design?.id) {
        saved = (await smartDesignApi.patch(tenantId, design.id, payload))?.design
        toast.success('Design updated')
      } else {
        try {
          saved = (await smartDesignApi.create(tenantId, payload))?.design
          toast.success('Design created')
        } catch (e) {
          if (e?.status === 409 && e?.data?.existingId) {
            saved = (await smartDesignApi.patch(tenantId, e.data.existingId, payload))?.design
            toast.success('Design already existed — updated')
          } else {
            throw e
          }
        }
      }
      await loadCatalog()
      if (saved) {
        setDesign(saved)
        setForm({ ...EMPTY_FORM, ...smartDesignToForm(saved) })
      } else {
        await loadScope(selected)
      }
      setDirty(false)
    } catch (e) {
      toast.error(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!design?.id) return
    setDeleting(true)
    try {
      await smartDesignApi.remove(tenantId, design.id)
      toast.success('Design deleted')
      setConfirmDelete(false)
      await loadCatalog()
      await loadScope(selected)
    } catch (e) {
      toast.error(e?.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const handleCollect = async () => {
    if (!selected) return
    setCollecting(true)
    try {
      const issueDate = design?.today?.issueDate || todayIso()
      const query = { publicationEditionId: selected.editionId, issueDate, excludeMainPage: 'true' }
      if (selected.subEditionId) query.subEditionId = selected.subEditionId
      const res = await smartDesignApi.collectNews(tenantId, query)
      const nw = res?.newsWindow || res?.pipeline?.newsWindow || {}
      setCollect({
        issueDate,
        count: res?.articleCount ?? res?.articles?.length ?? res?.summary?.articleCount ?? 0,
        from: nw.fromIST || nw.fromDate,
        to: nw.toIST || nw.toDate,
      })
    } catch (e) {
      toast.error(e?.message || 'collect-news failed')
    } finally {
      setCollecting(false)
    }
  }

  const handleSaveDefaults = async () => {
    setDefaultsSaving(true)
    try {
      const saved = await epaperApi.putNewspaperConfig(tenantId, formToNewspaperConfigPayload(defaults))
      setDefaults(newspaperConfigToForm(saved))
      toast.success('Tenant defaults saved')
    } catch (e) {
      toast.error(e?.message || 'Save failed')
    } finally {
      setDefaultsSaving(false)
    }
  }

  const totalScopes = editions.reduce((n, e) => n + 1 + (e.subEditions?.length || 0), 0)
  const configuredScopes = editions.reduce(
    (n, e) => n + (e.hasEditionDesign ? 1 : 0) + (e.subEditions || []).filter((s) => s.hasDesign).length,
    0
  )

  if (loading) {
    return (
      <div className="flex justify-center rounded-xl border bg-white py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  const busy = saving || deleting || scopeLoading
  const scopeTitle = selectedSub
    ? selectedSub.name
    : selectedEdition?.name || '—'
  const scopeKind = selectedSub ? 'District edition' : 'State edition'
  const today = design?.today

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">ePaper settings</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              One smart design per edition. Pick a state or district edition on the left, then create or edit it.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/daily-newspaper-news?tenantId=${encodeURIComponent(tenantId || '')}`}
              className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Reporter news
            </Link>
            <Button
              size="sm"
              variant="default"
              onClick={async () => {
                await loadCatalog()
                if (selected) await loadScope(selected)
              }}
            >
              Refresh
            </Button>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-slate-500">PRGI</dt>
            <dd className="mt-0.5 truncate font-mono text-sm text-slate-900">{catalog?.prgiNumber || '—'}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-slate-500">ePaper domain</dt>
            <dd className="mt-0.5 truncate text-sm text-slate-900">{catalog?.epaperDomain || 'Not set'}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-slate-500">Editions</dt>
            <dd className="mt-0.5 text-sm text-slate-900">
              {editions.length} state · {totalScopes - editions.length} district
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-slate-500">Configured</dt>
            <dd className="mt-0.5 text-sm text-slate-900">
              {configuredScopes} / {totalScopes}
            </dd>
          </div>
        </dl>
        {loadError ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>
        ) : null}
      </div>

      {editions.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium text-slate-800">No publication editions yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Create a state edition (and optional district sub-editions) first, then come back to set up the ePaper.
          </p>
          <Link
            href={`/admin/tenants/${tenantId}/editions`}
            className="mt-4 inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Go to ePaper Editions
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-2 lg:sticky lg:top-4">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Editions</p>
              <Link href={`/admin/tenants/${tenantId}/editions`} className="text-xs text-brand hover:underline">
                Manage
              </Link>
            </div>
            <div className="space-y-0.5">
              {editions.map((ed) => {
                const d = ed.editionDesign
                return (
                  <div key={ed.id}>
                    <ScopeButton
                      active={selected?.editionId === ed.id && !selected?.subEditionId}
                      configured={!!ed.hasEditionDesign}
                      title={ed.name || ed.slug}
                      subtitle={`State${ed.state?.name ? ` · ${ed.state.name}` : ''}`}
                      meta={d ? `${d.totalPages ?? '—'}p` : null}
                      onClick={() => selectScope(ed.id, null)}
                    />
                    {(ed.subEditions || []).map((sub) => (
                      <ScopeButton
                        key={sub.id}
                        indent
                        active={selected?.subEditionId === sub.id}
                        configured={!!sub.hasDesign}
                        title={sub.name || sub.slug}
                        subtitle="District"
                        meta={sub.design ? `${sub.design.totalPages ?? '—'}p` : null}
                        onClick={() => selectScope(ed.id, sub.id)}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
            <div className="mt-2 flex items-center gap-4 border-t border-slate-100 px-3 py-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <StatusDot configured /> Configured
              </span>
              <span className="flex items-center gap-1.5">
                <StatusDot configured={false} /> Not set
              </span>
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {scopeKind}
                    {selectedSub ? ` · ${selectedEdition?.name}` : ''}
                  </p>
                  <h3 className="mt-0.5 text-xl font-semibold text-slate-900">{scopeTitle}</h3>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    design ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {design ? 'Configured' : 'Not configured'}
                </span>
              </div>
              {today ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <p className="text-[11px] text-slate-500">Today</p>
                    <p className="text-sm font-medium text-slate-900">
                      {today.issueDate}
                      {today.dayNameTelugu ? ` · ${today.dayNameTelugu}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Volume / Issue</p>
                    <p className="text-sm font-medium tabular-nums text-slate-900">
                      Vol {today.currentVolume ?? '—'} · Issue {today.currentIssue ?? '—'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] text-slate-500">Print news window (IST)</p>
                    <p className="text-sm font-medium tabular-nums text-slate-900">
                      {formatIst(today.newsWindow?.fromDate)} → {formatIst(today.newsWindow?.toDate)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  No design for this edition yet. Fill in the form below and press <strong>Create design</strong>.
                </p>
              )}
            </div>

            {scopeLoading ? (
              <div className="flex justify-center rounded-xl border bg-white py-16">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                <Section title="Paper & pricing">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <FormField label="Paper type">
                      <Select
                        value={String(form.paperType || 'TABLOID').toUpperCase().includes('BROAD') ? 'BROADSHEET' : 'TABLOID'}
                        onChange={(e) => setField('paperType', e.target.value)}
                        disabled={busy}
                      >
                        <option value="TABLOID">Tabloid</option>
                        <option value="BROADSHEET">Broadsheet</option>
                      </Select>
                    </FormField>
                    <FormField label="Pages per issue">
                      <Input
                        type="number"
                        min="1"
                        value={form.defaultPageCount}
                        onChange={(e) => setField('defaultPageCount', e.target.value)}
                        disabled={busy}
                      />
                    </FormField>
                    <FormField label="Design cost / page / month (₹)">
                      <Input
                        type="number"
                        min="0"
                        value={form.perPageCostMonthly}
                        onChange={(e) => setField('perPageCostMonthly', e.target.value)}
                        disabled={busy}
                      />
                    </FormField>
                    <FormField label="Paper price (₹)">
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={form.paperSellCost}
                        onChange={(e) => setField('paperSellCost', e.target.value)}
                        disabled={busy}
                      />
                    </FormField>
                  </div>
                </Section>

                <Section
                  title="Header"
                  description="Image slots below follow the selected header style."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Main header (page 1)">
                      <Select
                        value={form.headerStyleNumber}
                        onChange={(e) => setField('headerStyleNumber', Number(e.target.value))}
                        disabled={busy}
                      >
                        {mainStyles.map((s) => (
                          <option key={s.key || s.number} value={s.number}>
                            {s.number}. {s.name}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="Sub header (page 2+)">
                      <Select
                        value={form.subHeaderStyleNumber}
                        onChange={(e) => setField('subHeaderStyleNumber', Number(e.target.value))}
                        disabled={busy}
                      >
                        {subStyles.map((s) => (
                          <option key={s.key || s.number} value={s.number}>
                            {s.number}. {s.name}
                            {s.nameTe ? ` — ${s.nameTe}` : ''}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="Newspaper name (masthead text)">
                      <Input
                        value={form.headerData}
                        placeholder="తెలుగుప్రభ"
                        onChange={(e) => setField('headerData', e.target.value)}
                        disabled={busy}
                      />
                    </FormField>
                    <FormField label="Tagline">
                      <Input
                        value={form.tagline}
                        onChange={(e) => setField('tagline', e.target.value)}
                        disabled={busy}
                      />
                    </FormField>
                    <FormField label="Published areas">
                      <Input
                        value={form.publishedAreaText}
                        placeholder="Hyderabad • Warangal"
                        onChange={(e) => setField('publishedAreaText', e.target.value)}
                        disabled={busy}
                      />
                    </FormField>
                    <FormField label="Website">
                      <Input
                        type="url"
                        value={form.websiteUrl}
                        placeholder={catalog?.epaperDomain ? `https://${catalog.epaperDomain}` : 'https://'}
                        onChange={(e) => setField('websiteUrl', e.target.value)}
                        disabled={busy}
                      />
                    </FormField>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {caps.headerLogoUrl ? (
                      <ImageField
                        label="Center logo"
                        hint="Page 1 masthead"
                        value={form.headerLogoUrl}
                        onChange={(v) => setField('headerLogoUrl', v)}
                        onUpload={(f) => handleUpload('headerLogoUrl', f)}
                        uploading={uploading.headerLogoUrl}
                        disabled={busy}
                      />
                    ) : null}
                    {caps.paperNameImageUrl ? (
                      <ImageField
                        label="Paper name image"
                        hint="Masthead title as image"
                        value={form.paperNameImageUrl}
                        onChange={(v) => setField('paperNameImageUrl', v)}
                        onUpload={(f) => handleUpload('paperNameImageUrl', f)}
                        uploading={uploading.paperNameImageUrl}
                        disabled={busy}
                      />
                    ) : null}
                    {caps.headerLeftImageUrl ? (
                      <ImageField
                        label="Left slot"
                        hint="Logo, custom image or ad"
                        value={form.headerLeftImageUrl}
                        onChange={(v) => setField('headerLeftImageUrl', v)}
                        onUpload={(f) => handleUpload('headerLeftImageUrl', f)}
                        uploading={uploading.headerLeftImageUrl}
                        disabled={busy}
                      />
                    ) : null}
                    {caps.headerRightImageUrl ? (
                      <ImageField
                        label="Right slot"
                        hint="Image or ad"
                        value={form.headerRightImageUrl}
                        onChange={(v) => setField('headerRightImageUrl', v)}
                        onUpload={(f) => handleUpload('headerRightImageUrl', f)}
                        uploading={uploading.headerRightImageUrl}
                        disabled={busy}
                      />
                    ) : null}
                    {caps.subHeaderLogoUrl ? (
                      <ImageField
                        label="Inner page logo"
                        hint="Page 2+ sub header"
                        value={form.subHeaderLogoUrl}
                        onChange={(v) => setField('subHeaderLogoUrl', v)}
                        onUpload={(f) => handleUpload('subHeaderLogoUrl', f)}
                        uploading={uploading.subHeaderLogoUrl}
                        disabled={busy}
                      />
                    ) : null}
                  </div>
                </Section>

                <Section
                  title="Volume & issue"
                  description="Volume goes up every calendar year from the start year. Issue counts daily from the start date, or uses day of year."
                >
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <FormField label="Volume start #">
                      <Input
                        type="number"
                        min="1"
                        value={form.volumeStartNumber}
                        onChange={(e) => setField('volumeStartNumber', e.target.value)}
                        disabled={busy}
                      />
                    </FormField>
                    <FormField label="Volume start year">
                      <Input
                        type="number"
                        min="1900"
                        value={form.volumeStartYear}
                        onChange={(e) => setField('volumeStartYear', e.target.value)}
                        disabled={busy}
                      />
                    </FormField>
                    <FormField label="Issue start #" required>
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={form.issueStartNumber}
                        onChange={(e) => setField('issueStartNumber', e.target.value)}
                        disabled={busy}
                      />
                    </FormField>
                    <FormField label="Issue start date" required>
                      <Input
                        type="date"
                        value={form.issueStartDate}
                        onChange={(e) => setField('issueStartDate', e.target.value)}
                        disabled={busy}
                      />
                    </FormField>
                    <FormField label="Issue counter">
                      <Select
                        value={form.issueCounterMode}
                        onChange={(e) => setField('issueCounterMode', e.target.value)}
                        disabled={busy}
                      >
                        <option value="SEQUENTIAL">Daily +1</option>
                        <option value="DAY_OF_YEAR">Day of year</option>
                      </Select>
                    </FormField>
                  </div>
                </Section>

                <Section title="Print & footer">
                  <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
                    <FormField label="News close time (IST)" hint="Print window: 00:00 → this time">
                      <Input
                        type="time"
                        value={form.newsCloseTime}
                        onChange={(e) => setField('newsCloseTime', e.target.value)}
                        disabled={busy}
                      />
                    </FormField>
                    <FormField label="Last page footer">
                      <Input
                        value={form.lastPageFooterText}
                        placeholder={`Printed at … PRGI ${catalog?.prgiNumber || ''}`.trim()}
                        onChange={(e) => setField('lastPageFooterText', e.target.value)}
                        disabled={busy}
                      />
                    </FormField>
                  </div>
                </Section>

                <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 px-5 py-3 shadow-lg backdrop-blur">
                  <div className="flex flex-wrap items-center gap-3">
                    {design ? (
                      <Button variant="outline-danger" size="sm" onClick={() => setConfirmDelete(true)} disabled={busy}>
                        Delete
                      </Button>
                    ) : null}
                    {design ? (
                      <Button variant="ghost" size="sm" onClick={handleCollect} loading={collecting} disabled={busy}>
                        Test collect-news
                      </Button>
                    ) : null}
                    {collect ? (
                      <span className="text-xs text-slate-600">
                        {collect.count} articles · {formatIst(collect.from)} → {formatIst(collect.to)}
                      </span>
                    ) : dirty ? (
                      <span className="text-xs font-medium text-amber-700">Unsaved changes</span>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    {dirty ? (
                      <Button variant="default" onClick={() => loadScope(selected)} disabled={busy}>
                        Discard
                      </Button>
                    ) : null}
                    <Button variant="primary" onClick={handleSave} loading={saving} disabled={busy || (design && !dirty)}>
                      {design ? 'Save changes' : 'Create design'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {defaults ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setDefaultsOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-3 text-left"
          >
            <span>
              <span className="block text-sm font-semibold text-slate-900">Tenant defaults (fallback)</span>
              <span className="block text-xs text-slate-500">
                Used when an edition has no smart design · newspaper-config
              </span>
            </span>
            <span className="text-sm text-slate-500">{defaultsOpen ? 'Hide' : 'Show'}</span>
          </button>
          {defaultsOpen ? (
            <div className="space-y-4 border-t border-slate-100 p-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <FormField label="Pages">
                  <Input
                    type="number"
                    min="1"
                    value={defaults.pageCount}
                    onChange={(e) => setDefaults((p) => ({ ...p, pageCount: e.target.value }))}
                  />
                </FormField>
                <FormField label="News close (IST)">
                  <Input
                    type="time"
                    value={defaults.newsCloseTime}
                    onChange={(e) => setDefaults((p) => ({ ...p, newsCloseTime: e.target.value }))}
                  />
                </FormField>
                <FormField label="Main header #">
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={defaults.headerStyleNumber}
                    onChange={(e) => setDefaults((p) => ({ ...p, headerStyleNumber: e.target.value }))}
                  />
                </FormField>
                <FormField label="Sub header #">
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={defaults.subHeaderStyleNumber}
                    onChange={(e) => setDefaults((p) => ({ ...p, subHeaderStyleNumber: e.target.value }))}
                  />
                </FormField>
                <FormField label="Main logo URL" className="sm:col-span-2">
                  <Input
                    type="url"
                    value={defaults.mainLogoUrl}
                    onChange={(e) => setDefaults((p) => ({ ...p, mainLogoUrl: e.target.value }))}
                  />
                </FormField>
                <FormField label="Sub header logo URL" className="sm:col-span-2">
                  <Input
                    type="url"
                    value={defaults.subHeaderLogoUrl}
                    onChange={(e) => setDefaults((p) => ({ ...p, subHeaderLogoUrl: e.target.value }))}
                  />
                </FormField>
                <FormField label="Last page footer" className="sm:col-span-2 lg:col-span-4">
                  <Input
                    value={defaults.lastPageFooterText}
                    onChange={(e) => setDefaults((p) => ({ ...p, lastPageFooterText: e.target.value }))}
                  />
                </FormField>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  {defaults.newsWindow
                    ? `Today window: ${formatIst(defaults.newsWindow.fromDate)} → ${formatIst(defaults.newsWindow.toDate)}`
                    : ''}
                </p>
                <Button variant="primary" size="sm" onClick={handleSaveDefaults} loading={defaultsSaving}>
                  Save defaults
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this design?"
        message={`The smart design for ${scopeTitle} will be removed. You can create it again later.`}
        confirmText="Delete"
      />
    </div>
  )
}