/**
 * Tenant reporter drawer — profile CRUD, payments, analytics.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { reportersApi } from '../../../lib/api/tenantApi'
import locationsService from '../../../lib/api/services/locations'
import { reporterDesignationsApi, formatDesignationLabel, sortDesignations } from '../../../lib/api/services/reporterDesignationsApi'
import ReporterCoverageVillages from './ReporterCoverageVillages'
import ReporterSubscriptionsPanel from './ReporterSubscriptionsPanel'
import mediaApi from '../../../lib/api/services/mediaApi'
import {
  resolveReporterLocationForm,
  reporterLocationSummary,
} from '../../../lib/reporters/resolveReporterLocationForm'
import { engagementBadgeClass, formatLastPost } from '../../../lib/reporters/reporterActivityDisplay'

const LEVELS = ['STATE', 'DISTRICT', 'ASSEMBLY', 'MANDAL', 'DIVISION', 'CONSTITUENCY']

function istMonthKey(d = new Date()) {
  const x = new Date(d.getTime() + 5.5 * 60 * 60 * 1000)
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, '0')}`
}

function formatMoney(paise) {
  if (paise == null) return '—'
  return `₹${(Number(paise) / 100).toFixed(2)}`
}

export default function ReporterDetailSheet({ tenantId, reporterId, onClose, onChanged }) {
  const [tab, setTab] = useState('profile')
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [analyticsMode, setAnalyticsMode] = useState('month')
  const [month, setMonth] = useState(istMonthKey())
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [webInsight, setWebInsight] = useState(null)
  const [workReport, setWorkReport] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [mandals, setMandals] = useState([])
  const [constituencies, setConstituencies] = useState([])
  const [designations, setDesignations] = useState([])
  const [photoUploading, setPhotoUploading] = useState(false)

  const [form, setForm] = useState({
    fullName: '',
    mobileNumber: '',
    level: 'DISTRICT',
    designationId: '',
    stateId: '',
    districtId: '',
    mandalId: '',
    assemblyConstituencyId: '',
    subscriptionActive: false,
    monthlySubscriptionAmount: 0,
    profilePhotoUrl: '',
    active: true,
  })

  const loadDetail = useCallback(async () => {
    if (!tenantId || !reporterId) return
    setLoading(true)
    setError('')
    try {
      const data = await reportersApi.get(tenantId, reporterId)
      setDetail(data)
      const loc = await resolveReporterLocationForm(data)
      setForm({
        fullName: data.fullName || '',
        mobileNumber: data.mobileNumber || '',
        level: data.level || 'DISTRICT',
        designationId: data.designationId || '',
        stateId: loc.stateId,
        districtId: loc.districtId,
        mandalId: loc.mandalId,
        assemblyConstituencyId: loc.assemblyConstituencyId,
        subscriptionActive: !!data.subscriptionActive,
        monthlySubscriptionAmount: Number(data.monthlySubscriptionAmount || 0),
        profilePhotoUrl: data.profilePhotoUrl || '',
        active: data.active !== false,
      })
    } catch (e) {
      setError(e.message || 'Failed to load reporter')
    } finally {
      setLoading(false)
    }
  }, [tenantId, reporterId])


  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const base = { audience: 'field', reporterId }
      const webParams =
        analyticsMode === 'month'
          ? { month, ...base }
          : { fromDate, toDate, ...base }
      const [web, work] = await Promise.all([
        reportersApi.webViewsInsight(tenantId, webParams),
        reportersApi.workReport(tenantId, { month, reporterId, audience: 'field' }),
      ])
      setWebInsight(web)
      setWorkReport(work)
    } catch {
      setWebInsight(null)
      setWorkReport(null)
    } finally {
      setAnalyticsLoading(false)
    }
  }, [tenantId, reporterId, analyticsMode, month, fromDate, toDate])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [st, des] = await Promise.all([
          locationsService.states.getAll(),
          reporterDesignationsApi.list(),
        ])
        if (!cancelled) {
          setStates(st || [])
          setDesignations(sortDesignations(des || []).filter((d) => !d.tenantId || d.tenantId === tenantId))
        }
      } catch {
        if (!cancelled) {
          setStates([])
          setDesignations([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tenantId])

  useEffect(() => {
    if (!form.stateId) {
      setDistricts([])
      return
    }
    let cancelled = false
    locationsService.districts.getAll(form.stateId).then((rows) => {
      if (!cancelled) setDistricts(rows || [])
    })
    return () => {
      cancelled = true
    }
  }, [form.stateId])

  useEffect(() => {
    if (!form.districtId) {
      setMandals([])
      return
    }
    let cancelled = false
    locationsService.mandals.getAll(form.districtId).then((rows) => {
      if (!cancelled) setMandals(rows || [])
    })
    return () => {
      cancelled = true
    }
  }, [form.districtId])

  useEffect(() => {
    if (!form.districtId) {
      setConstituencies([])
      return
    }
    let cancelled = false
    locationsService.constituencies.getAll(form.districtId).then((rows) => {
      if (!cancelled) setConstituencies(rows || [])
    })
    return () => {
      cancelled = true
    }
  }, [form.districtId])

  useEffect(() => {
    if (tab === 'analytics') loadAnalytics()
  }, [tab, loadAnalytics])

  const reporterWebStats = useMemo(() => {
    const rows = webInsight?.byReporter || []
    return rows.find((r) => r.reporterId === reporterId) || null
  }, [webInsight, reporterId])

  async function saveProfile() {
    setSaving(true)
    setError('')
    try {
      await reportersApi.updateProfile(tenantId, reporterId, {
        fullName: form.fullName.trim(),
        mobileNumber: form.mobileNumber.trim(),
        profilePhotoUrl: form.profilePhotoUrl.trim() || null,
      })
      await reportersApi.updateAssignment(tenantId, reporterId, {
        level: form.level,
        designationId: form.designationId || undefined,
        stateId: form.stateId || undefined,
        districtId: form.districtId || undefined,
        mandalId: form.mandalId || undefined,
        assemblyConstituencyId: form.assemblyConstituencyId || undefined,
      })
      await reportersApi.update(tenantId, reporterId, {
        subscriptionActive: form.subscriptionActive,
        monthlySubscriptionAmount: form.monthlySubscriptionAmount,
        active: form.active,
      })
      await loadDetail()
      onChanged?.()
    } catch (e) {
      setError(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    const name = form.fullName || 'this reporter'
    if (!window.confirm(`Delete ${name}? Mobile will be released. This cannot be undone.`)) return
    setSaving(true)
    setError('')
    try {
      await reportersApi.delete(tenantId, reporterId)
      onChanged?.()
      onClose()
    } catch (e) {
      setError(e.message || 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  const stats = detail?.stats
  const locationSummary = reporterLocationSummary(detail)

  async function onPhotoFileChange(e) {
    const file = e.target.files?.[0]
    if (!file || !tenantId) return
    setPhotoUploading(true)
    setError('')
    try {
      const result = await mediaApi.upload(file, `tenants/${tenantId}/reporters/${reporterId}/profile`)
      const url = result?.url || result?.publicUrl
      if (!url) throw new Error('Upload did not return a URL')
      setForm((f) => ({ ...f, profilePhotoUrl: url }))
    } catch (err) {
      setError(err.message || 'Photo upload failed')
    } finally {
      setPhotoUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col animate-slide-in">
        <div className="flex items-start justify-between gap-3 p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{form.fullName || 'Reporter'}</h3>
            <p className="text-xs text-slate-500 font-mono">{reporterId}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
            ✕
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-2 border-b">
          {[
            ['profile', 'Profile'],
            ['payments', 'Subscriptions'],
            ['analytics', 'Analytics'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === id ? 'border-brand text-brand' : 'border-transparent text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">{error}</div>}
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading…</div>
          ) : tab === 'profile' ? (
            <>
              {stats && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <StatCard label="Print (month)" value={`${stats.newspaperArticles?.currentMonth?.published ?? 0} pub`} />
                  <StatCard label="Web views (month)" value={stats.webArticleViews?.currentMonth ?? 0} />
                  <StatCard
                    label="Last post"
                    value={formatLastPost(stats.activity?.lastPostAt)}
                  />
                  <StatCard
                    label="Month posts"
                    value={`${stats.activity?.monthPosts ?? 0} (P${stats.activity?.monthPrintPublished ?? 0} W${stats.activity?.monthWebPublished ?? 0})`}
                  />
                  {stats.activity?.engagementTier && (
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="text-[10px] uppercase text-slate-500">Engagement</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${engagementBadgeClass(stats.activity.engagementTier)}`}
                      >
                        Tier {stats.activity.engagementTier} — {stats.activity.engagementLabel} ({stats.activity.engagementScore} pts)
                      </span>
                    </div>
                  )}
                  <StatCard label="Sub (month)" value={stats.subscriptionPayment?.currentMonth?.status || '—'} />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Full name" value={form.fullName} onChange={(v) => setForm((f) => ({ ...f, fullName: v }))} />
                <Field label="Mobile (login)" value={form.mobileNumber} onChange={(v) => setForm((f) => ({ ...f, mobileNumber: v }))} type="tel" />
                <div className="sm:col-span-2 rounded-xl border bg-slate-50 p-3">
                  <div className="text-xs font-medium text-slate-600 mb-2">Profile photo</div>
                  <div className="flex flex-wrap items-start gap-3">
                    {form.profilePhotoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={form.profilePhotoUrl}
                        alt=""
                        className="w-20 h-20 rounded-full object-cover border-2 border-white shadow"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs">
                        No photo
                      </div>
                    )}
                    <div className="flex-1 min-w-[180px] space-y-2">
                      <label className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-white border cursor-pointer hover:bg-slate-50">
                        <input type="file" accept="image/*" className="sr-only" onChange={onPhotoFileChange} disabled={photoUploading} />
                        {photoUploading ? 'Uploading…' : 'Upload image'}
                      </label>
                      <input
                        type="url"
                        value={form.profilePhotoUrl}
                        onChange={(e) => setForm((f) => ({ ...f, profilePhotoUrl: e.target.value }))}
                        placeholder="Or paste CDN URL"
                        className="w-full border rounded-lg px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                </div>
                {locationSummary ? (
                  <p className="sm:col-span-2 text-xs text-slate-600 bg-brand/5 border border-brand/10 rounded-lg px-3 py-2">
                    <span className="font-medium text-slate-800">Assignment: </span>
                    {locationSummary}
                  </p>
                ) : null}
                <div>
                  <label className="text-xs font-medium text-slate-600">Level</label>
                  <select
                    value={form.level}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        level: e.target.value,
                        designationId:
                          designations.find((d) => d.id === f.designationId && d.level === e.target.value)?.id || f.designationId,
                      }))
                    }
                    className="mt-1 w-full border rounded-lg px-2 py-2 text-sm"
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Designation</label>
                  <select
                    value={form.designationId}
                    onChange={(e) => {
                      const id = e.target.value
                      const d = designations.find((x) => x.id === id)
                      setForm((f) => ({
                        ...f,
                        designationId: id,
                        level: d?.level || f.level,
                      }))
                    }}
                    className="mt-1 w-full border rounded-lg px-2 py-2 text-sm"
                  >
                    <option value="">— Select —</option>
                    {designations
                      .filter((d) => !form.level || d.level === form.level)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {formatDesignationLabel(d)}
                        </option>
                      ))}
                  </select>
                </div>
                {(form.level === 'STATE' || form.level === 'DISTRICT' || form.level === 'MANDAL' || form.level === 'ASSEMBLY') && (
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-slate-600">State</label>
                    <select
                      value={form.stateId}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          stateId: e.target.value,
                          districtId: '',
                          mandalId: '',
                        }))
                      }
                      className="mt-1 w-full border rounded-lg px-2 py-2 text-sm"
                    >
                      <option value="">— Select state —</option>
                      {form.stateId && !states.some((s) => s.id === form.stateId) && detail?.state?.name && (
                        <option value={form.stateId}>{detail.state.name}</option>
                      )}
                      {states.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {(form.level === 'DISTRICT' || form.level === 'MANDAL' || form.level === 'ASSEMBLY') && (
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-slate-600">District</label>
                    <select
                      value={form.districtId}
                      disabled={!form.stateId && !form.districtId}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          districtId: e.target.value,
                          mandalId: '',
                          assemblyConstituencyId: '',
                        }))
                      }
                      className="mt-1 w-full border rounded-lg px-2 py-2 text-sm disabled:bg-slate-50"
                    >
                      <option value="">{form.stateId ? '— Select district —' : 'Select state first'}</option>
                      {form.districtId &&
                        !districts.some((d) => d.id === form.districtId) &&
                        detail?.district?.name && (
                          <option value={form.districtId}>{detail.district.name}</option>
                        )}
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {form.level === 'ASSEMBLY' && (
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-slate-600">Assembly constituency</label>
                    <select
                      value={form.assemblyConstituencyId}
                      disabled={!form.districtId}
                      onChange={(e) => setForm((f) => ({ ...f, assemblyConstituencyId: e.target.value }))}
                      className="mt-1 w-full border rounded-lg px-2 py-2 text-sm disabled:bg-slate-50"
                    >
                      <option value="">{form.districtId ? '— Select constituency —' : 'Select district first'}</option>
                      {form.assemblyConstituencyId &&
                        !constituencies.some((c) => c.id === form.assemblyConstituencyId) &&
                        detail?.assemblyConstituency?.name && (
                          <option value={form.assemblyConstituencyId}>{detail.assemblyConstituency.name}</option>
                        )}
                      {constituencies.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {(form.level === 'MANDAL' || form.level === 'ASSEMBLY') && (
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-slate-600">Mandal</label>
                    <select
                      value={form.mandalId}
                      disabled={!form.districtId}
                      onChange={(e) => setForm((f) => ({ ...f, mandalId: e.target.value }))}
                      className="mt-1 w-full border rounded-lg px-2 py-2 text-sm disabled:bg-slate-50"
                    >
                      <option value="">{form.districtId ? '— Select mandal —' : 'Select district first'}</option>
                      {form.mandalId &&
                        !mandals.some((m) => m.id === form.mandalId) &&
                        detail?.mandal?.name && (
                          <option value={form.mandalId}>{detail.mandal.name}</option>
                        )}
                      {mandals.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <ReporterCoverageVillages
                tenantId={tenantId}
                reporterId={reporterId}
                mandalId={form.mandalId || detail?.mandalId}
                enabled={form.level === 'MANDAL' && Boolean(form.mandalId || detail?.mandalId)}
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                Active (can use app)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.subscriptionActive}
                  onChange={(e) => setForm((f) => ({ ...f, subscriptionActive: e.target.checked }))}
                />
                Subscription billing active
              </label>
              <Field
                label="Monthly fee (paise)"
                value={String(form.monthlySubscriptionAmount)}
                onChange={(v) => setForm((f) => ({ ...f, monthlySubscriptionAmount: Number(v) || 0 }))}
              />
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveProfile}
                  className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <Link href={`/admin/tenants/${tenantId}/id-cards`} className="px-4 py-2 rounded-lg border text-sm">
                  ID card tab →
                </Link>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm ml-auto"
                >
                  Delete reporter
                </button>
              </div>
            </>
          ) : tab === 'payments' ? (
            <ReporterSubscriptionsPanel
              tenantId={tenantId}
              reporterId={reporterId}
              subscriptionActive={form.subscriptionActive}
            />
          ) : (
            <>
              <div className="flex flex-wrap gap-2 items-end">
                <div>
                  <label className="text-xs text-slate-600">Range</label>
                  <select
                    value={analyticsMode}
                    onChange={(e) => setAnalyticsMode(e.target.value)}
                    className="block mt-1 border rounded-lg px-2 py-1.5 text-sm"
                  >
                    <option value="month">Month</option>
                    <option value="custom">Custom dates</option>
                  </select>
                </div>
                {analyticsMode === 'month' ? (
                  <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm" />
                ) : (
                  <>
                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm" />
                    <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm" />
                  </>
                )}
                <button type="button" onClick={loadAnalytics} className="px-3 py-1.5 text-sm rounded-lg bg-slate-100">
                  Refresh
                </button>
              </div>
              {analyticsLoading ? (
                <p className="text-sm text-slate-500">Loading analytics…</p>
              ) : (
                <div className="space-y-4">
                  <StatCard
                    label="Web articles (period)"
                    value={reporterWebStats ? `${reporterWebStats.articleCount} posts · ${reporterWebStats.viewCount} views` : '—'}
                  />
                  {workReport?.reporters?.[0]?.summary && (
                    <StatCard
                      label="Work report (month)"
                      value={`${workReport.reporters[0].summary.workingDaysInMonth ?? 0} days · ${workReport.reporters[0].summary.printPosts ?? 0} print · ${workReport.reporters[0].summary.webPosts ?? 0} web`}
                    />
                  )}
                  {(webInsight?.byDay || []).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-700 mb-2">Day-wise (all field reporters)</p>
                      <ul className="max-h-40 overflow-y-auto text-xs space-y-1">
                        {webInsight.byDay.map((d) => (
                          <li key={d.date} className="flex justify-between border-b border-slate-100 py-1">
                            <span>{d.date}</span>
                            <span>{d.articleCount} art · {d.viewCount} views</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', hint, className = '' }) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border rounded-lg px-2 py-2 text-sm"
      />
      {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border bg-slate-50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  )
}