/**
 * Reporter Insights — print split (field vs syndicate), web views, monthly work report.
 */

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { tenantsApi } from '../../../lib/api/tenantApi'
import { reporterInsightsApi } from '../../../lib/api/services/reporterInsightsApi'
import { todayIstDateString } from '../../../lib/newspaperFeed/articleCopy'
import { filterActiveTenants } from '../../../lib/tenant/isActiveTenant'
import { isPlatformDeskUser } from '../../../lib/platformDesk'
import { getAuthUser } from '../../../utils/auth'
import { getUserTenantId, hasRole, isSuperAdmin } from '../../../utils/roleUtils'
import { Button, FormField, Input, Select, Spinner, toast } from '../../ui'

const TABS = [
  { id: 'print', label: 'Print news' },
  { id: 'web', label: 'Web views' },
  { id: 'work', label: 'Work report' },
]

const SYNDICATE_LOGIN_ROLES = ['NEWS_MODERATOR', 'NEWS_DESK', 'NEWS_DESK_ADMIN']

const AUDIENCES = [
  { id: 'field', label: 'Field reporters' },
  { id: 'moderator', label: 'Syndicate employees' },
]

function unwrap(res) {
  return res?.data && res?.success === undefined ? res.data : res
}

function unwrapTenants(raw) {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.items)) return raw.items
  if (Array.isArray(raw?.data?.items)) return raw.data.items
  if (Array.isArray(raw?.data)) return raw.data
  return []
}

function currentIstMonth() {
  return todayIstDateString().slice(0, 7)
}

const nf = new Intl.NumberFormat('en-IN')
const fmt = (n) => nf.format(Number(n) || 0)

function fmtHours(minutes) {
  const m = Math.round(Number(minutes) || 0)
  if (!m) return '0h'
  const h = Math.floor(m / 60)
  const r = m % 60
  return h ? `${h}h${r ? ` ${r}m` : ''}` : `${r}m`
}

function fmtTimeIst(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtDay(date) {
  if (!date || date === 'unknown') return date || '—'
  const d = new Date(`${date}T00:00:00+05:30`)
  return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', weekday: 'short' })
}

function Stat({ label, value, tone = 'text-slate-900', sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone}`}>{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-slate-500">{sub}</p> : null}
    </div>
  )
}

function Panel({ title, action, children, flush }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {action}
      </header>
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </section>
  )
}

function Segmented({ value, options, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === o.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Empty({ children }) {
  return <p className="px-5 py-10 text-center text-sm text-slate-500">{children}</p>
}

function Bar({ value, max, tone = 'bg-brand' }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function ReporterChips({ reporters, tone }) {
  if (!reporters?.length) return <p className="text-sm text-slate-500">No posts in this window.</p>
  const sorted = [...reporters].sort((a, b) => (b.articleCount ?? 0) - (a.articleCount ?? 0))
  return (
    <div className="flex flex-wrap gap-1.5">
      {sorted.map((r) => (
        <span
          key={r.reporterId || r.name}
          title={r.districtName || ''}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
        >
          <span className="max-w-[160px] truncate">{r.name || '—'}</span>
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${tone}`}>
            {r.articleCount ?? 0}
          </span>
        </span>
      ))}
    </div>
  )
}

function PrintTab({ data, loading, tenantId, date }) {
  if (loading && !data) return <Loading />
  if (!data) return null
  const field = data.field?.summary || {}
  const mod = data.moderator?.summary || {}
  const tw = data.field?.timeWindow || data.moderator?.timeWindow
  const total = (field.articleCount || 0) + (mod.articleCount || 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total print posts" value={fmt(total)} />
        <Stat
          label="Field reporters"
          value={fmt(field.articleCount)}
          tone="text-emerald-700"
          sub={`${fmt(field.reporterCount ?? field.reporters?.length)} reporters`}
        />
        <Stat
          label="Syndicate employees"
          value={fmt(mod.articleCount)}
          tone="text-indigo-700"
          sub={`${fmt(mod.reporterCount ?? mod.reporters?.length)} employees`}
        />
        <Stat
          label="Window (IST)"
          value={<span className="text-base">{tw?.effectiveRule || 'newsroom'}</span>}
          sub={tw ? `${String(tw.startAtIst || '').slice(11, 16)} → ${String(tw.endAtIst || '').slice(11, 16)}` : ''}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={`Field reporters · ${fmt(field.articleCount)} posts`}
          action={
            <Link
              href={`/admin/daily-newspaper-news?tenantId=${encodeURIComponent(tenantId)}`}
              className="text-xs font-medium text-brand hover:underline"
            >
              Read stories
            </Link>
          }
        >
          <ReporterChips reporters={field.reporters} tone="bg-emerald-100 text-emerald-800" />
        </Panel>
        <Panel title={`Syndicate employees · ${fmt(mod.articleCount)} posts`}>
          <ReporterChips reporters={mod.reporters} tone="bg-indigo-100 text-indigo-800" />
        </Panel>
      </div>
      <p className="text-xs text-slate-500">Edition day {date} · posts filed in the newsroom window.</p>
    </div>
  )
}

function WebTab({ data, loading, employeeId }) {
  const [articleLimit, setArticleLimit] = useState(25)

  const view = useMemo(() => {
    if (!data) return null
    const articles = (data.byArticle || []).filter(
      (a) => !employeeId || a.reporter?.reporterId === employeeId
    )
    if (!employeeId) {
      return {
        summary: data.summary || {},
        byDay: data.byDay || [],
        byReporter: data.byReporter || [],
        articles,
      }
    }
    const dayMap = new Map()
    let views = 0
    let shares = 0
    for (const a of articles) {
      views += a.viewCount || 0
      shares += a.shareCount || 0
      const key = a.publishedDateIst || 'unknown'
      const row = dayMap.get(key) || { date: key, articleCount: 0, viewCount: 0 }
      row.articleCount += 1
      row.viewCount += a.viewCount || 0
      dayMap.set(key, row)
    }
    return {
      summary: { articleCount: articles.length, totalViews: views, totalShares: shares, reporterCount: 1 },
      byDay: [...dayMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
      byReporter: (data.byReporter || []).filter((r) => r.reporterId === employeeId),
      articles,
    }
  }, [data, employeeId])

  if (loading && !data) return <Loading />
  if (!view) return null

  const maxDayViews = Math.max(0, ...view.byDay.map((d) => d.viewCount))
  const maxRepViews = Math.max(0, ...view.byReporter.map((r) => r.viewCount))
  const avg = view.summary.articleCount ? Math.round(view.summary.totalViews / view.summary.articleCount) : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Web stories (month)" value={fmt(view.summary.articleCount)} />
        <Stat label="Total views" value={fmt(view.summary.totalViews)} tone="text-brand-dark" sub={`${fmt(avg)} avg / story`} />
        <Stat label="Shares" value={fmt(view.summary.totalShares)} />
        <Stat label="Active days" value={fmt(view.byDay.length)} sub={`${fmt(view.byReporter.length)} people`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Day-wise" flush>
          {view.byDay.length ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 text-right font-medium">Stories</th>
                  <th className="px-3 py-2 text-right font-medium">Views</th>
                  <th className="w-1/3 px-5 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {view.byDay.map((d) => (
                  <tr key={d.date}>
                    <td className="px-5 py-2 text-slate-700">{fmtDay(d.date)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(d.articleCount)}</td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">{fmt(d.viewCount)}</td>
                    <td className="px-5 py-2">
                      <Bar value={d.viewCount} max={maxDayViews} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>No web stories this month.</Empty>
          )}
        </Panel>

        <Panel title="By person" flush>
          {view.byReporter.length ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 text-right font-medium">Stories</th>
                  <th className="px-3 py-2 text-right font-medium">Views</th>
                  <th className="w-1/4 px-5 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {view.byReporter.map((r) => (
                  <tr key={r.reporterId || r.name}>
                    <td className="px-5 py-2">
                      <p className="font-medium text-slate-800">{r.name}</p>
                      {r.mobile ? <p className="text-xs text-slate-500">{r.mobile}</p> : null}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(r.articleCount)}</td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">{fmt(r.viewCount)}</td>
                    <td className="px-5 py-2">
                      <Bar value={r.viewCount} max={maxRepViews} tone="bg-emerald-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>No one published web stories this month.</Empty>
          )}
        </Panel>
      </div>

      <Panel title={`Stories by views · ${fmt(view.articles.length)}`} flush>
        {view.articles.length ? (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Story</th>
                  <th className="px-3 py-2 font-medium">By</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 text-right font-medium">Views</th>
                  <th className="px-5 py-2 text-right font-medium">Shares</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {view.articles.slice(0, articleLimit).map((a) => (
                  <tr key={a.id}>
                    <td className="max-w-md px-5 py-2">
                      <p className="line-clamp-2 text-slate-800">{a.title}</p>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{a.reporter?.name || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600">{fmtDay(a.publishedDateIst)}</td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">{fmt(a.viewCount)}</td>
                    <td className="px-5 py-2 text-right tabular-nums">{fmt(a.shareCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {view.articles.length > articleLimit ? (
              <div className="border-t border-slate-100 px-5 py-3 text-center">
                <Button size="sm" variant="ghost" onClick={() => setArticleLimit((n) => n + 50)}>
                  Show more ({fmt(view.articles.length - articleLimit)} left)
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <Empty>No stories.</Empty>
        )}
      </Panel>
    </div>
  )
}

function WorkTab({ data, loading, employeeId }) {
  const [expanded, setExpanded] = useState(null)

  const rows = useMemo(() => {
    const list = data?.reporters || []
    return employeeId ? list.filter((r) => r.reporterId === employeeId) : list
  }, [data, employeeId])

  useEffect(() => {
    setExpanded(employeeId || null)
  }, [employeeId])

  if (loading && !data) return <Loading />
  if (!data) return null

  const totals = rows.reduce(
    (acc, r) => {
      acc.days += r.summary.workingDaysInMonth || 0
      acc.minutes += r.summary.totalWorkingMinutes || 0
      acc.print += r.summary.printPosts || 0
      acc.web += r.summary.webPosts || 0
      if ((r.summary.totalPosts || 0) > 0) acc.active += 1
      return acc
    },
    { days: 0, minutes: 0, print: 0, web: 0, active: 0 }
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="People" value={fmt(rows.length)} sub={`${fmt(totals.active)} active`} />
        <Stat label="Working days" value={fmt(totals.days)} sub={employeeId ? 'this month' : 'sum across people'} />
        <Stat label="Working hours" value={fmtHours(totals.minutes)} tone="text-brand-dark" />
        <Stat label="Print posts" value={fmt(totals.print)} tone="text-emerald-700" />
        <Stat label="Web posts" value={fmt(totals.web)} tone="text-indigo-700" />
      </div>

      <Panel title={`Monthly work report · ${data.month}`} flush>
        {rows.length ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Name</th>
                <th className="px-3 py-2 text-right font-medium">Days</th>
                <th className="px-3 py-2 text-right font-medium">Hours</th>
                <th className="px-3 py-2 text-right font-medium">Print</th>
                <th className="px-3 py-2 text-right font-medium">Web</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="px-5 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const open = expanded === r.reporterId
                return (
                  <Fragment key={r.reporterId}>
                    <tr className={open ? 'bg-slate-50' : 'hover:bg-slate-50/60'}>
                      <td className="px-5 py-2.5">
                        <p className="font-medium text-slate-800">{r.name}</p>
                        <p className="text-xs text-slate-500">
                          {[r.designationName || r.designationCode, r.mobile].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{fmt(r.summary.workingDaysInMonth)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{fmtHours(r.summary.totalWorkingMinutes)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{fmt(r.summary.printPosts)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{fmt(r.summary.webPosts)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{fmt(r.summary.totalPosts)}</td>
                      <td className="px-5 py-2.5 text-right">
                        {r.daily?.length ? (
                          <button
                            type="button"
                            className="text-xs font-medium text-brand hover:underline"
                            onClick={() => setExpanded(open ? null : r.reporterId)}
                          >
                            {open ? 'Hide days' : 'Day-wise'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">No activity</span>
                        )}
                      </td>
                    </tr>
                    {open ? (
                      <tr>
                        <td colSpan={7} className="bg-slate-50 px-5 pb-4 pt-1">
                          <table className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white text-xs">
                            <thead className="bg-slate-50 text-left text-slate-500">
                              <tr>
                                <th className="px-3 py-1.5 font-medium">Date</th>
                                <th className="px-3 py-1.5 text-right font-medium">Print</th>
                                <th className="px-3 py-1.5 text-right font-medium">Web</th>
                                <th className="px-3 py-1.5 text-right font-medium">Login time</th>
                                <th className="px-3 py-1.5 text-right font-medium">Worked</th>
                                <th className="px-3 py-1.5 text-right font-medium">First → last post</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {r.daily.map((d) => (
                                <tr key={d.date}>
                                  <td className="px-3 py-1.5 text-slate-700">{fmtDay(d.date)}</td>
                                  <td className="px-3 py-1.5 text-right tabular-nums">{fmt(d.printPosts)}</td>
                                  <td className="px-3 py-1.5 text-right tabular-nums">{fmt(d.webPosts)}</td>
                                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtHours(d.sessionMinutes)}</td>
                                  <td className="px-3 py-1.5 text-right font-medium tabular-nums">
                                    {fmtHours(d.workingMinutes)}
                                  </td>
                                  <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">
                                    {d.firstActivityAt
                                      ? `${fmtTimeIst(d.firstActivityAt)} → ${fmtTimeIst(d.lastActivityAt)}`
                                      : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        ) : (
          <Empty>No people found for this selection.</Empty>
        )}
      </Panel>
      <p className="text-xs text-slate-500">
        Hours per day = the larger of app login time and first-to-last post span.
      </p>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex justify-center rounded-xl border border-slate-200 bg-white py-16">
      <Spinner size="lg" />
    </div>
  )
}

export default function ReporterInsightsView() {
  const router = useRouter()
  const authUser = useMemo(() => (typeof window !== 'undefined' ? getAuthUser() : null), [])
  const isSyndicate = isPlatformDeskUser(authUser) || hasRole(authUser, SYNDICATE_LOGIN_ROLES)
  const canPickTenant = isSuperAdmin(authUser) || isSyndicate

  const [tenants, setTenants] = useState([])
  const [tenantId, setTenantId] = useState('')
  const [tab, setTab] = useState('print')
  const [audience, setAudience] = useState(isSyndicate ? 'moderator' : 'field')
  const [date, setDate] = useState(todayIstDateString())
  const [timeRule, setTimeRule] = useState('newsroom')
  const [month, setMonth] = useState(currentIstMonth())
  const [employeeId, setEmployeeId] = useState('')

  const [print, setPrint] = useState(null)
  const [web, setWeb] = useState(null)
  const [work, setWork] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!canPickTenant) {
      setTenantId(getUserTenantId(authUser) || '')
      return
    }
    ;(async () => {
      try {
        const list = filterActiveTenants(unwrapTenants(await tenantsApi.list(true)))
        setTenants(list)
        const fromQuery = router.query?.tenantId
        setTenantId((cur) => cur || (fromQuery ? String(fromQuery) : list[0]?.id || ''))
      } catch (e) {
        toast.error(e?.message || 'Failed to load newspapers')
      }
    })()
  }, [canPickTenant, authUser, router.query?.tenantId])

  const baseParams = useCallback(() => (tenantId ? { tenantId } : {}), [tenantId])

  const load = useCallback(async () => {
    if (canPickTenant && !tenantId) return
    setLoading(true)
    setError('')
    try {
      if (tab === 'print') {
        const res = await reporterInsightsApi.getPrintNews({ ...baseParams(), date, timeRule, audience: 'split' })
        setPrint(unwrap(res))
      } else if (tab === 'web') {
        const res = await reporterInsightsApi.getWebViews({ ...baseParams(), month, audience })
        setWeb(unwrap(res))
      } else {
        const res = await reporterInsightsApi.getWorkReport({ ...baseParams(), month, audience })
        setWork(unwrap(res))
      }
    } catch (e) {
      setError(e?.message || 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }, [canPickTenant, tenantId, tab, date, timeRule, month, audience, baseParams])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setEmployeeId('')
    setWeb(null)
    setWork(null)
  }, [tenantId, audience, month])

  useEffect(() => {
    setPrint(null)
  }, [tenantId])

  const employeeOptions = useMemo(() => {
    const map = new Map()
    for (const r of work?.reporters || []) map.set(r.reporterId, r.name)
    for (const r of web?.byReporter || []) if (r.reporterId && !map.has(r.reporterId)) map.set(r.reporterId, r.name)
    return [...map.entries()]
      .map(([id, name]) => ({ id, name: name || id }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [work, web])

  const tenantName = tenants.find((t) => t.id === tenantId)?.name

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Reporter insights</h1>
          <p className="mt-1 text-sm text-slate-500">
            Print and web output, views, working days and hours — field reporters and syndicate employees.
          </p>
        </div>
        <Segmented value={tab} options={TABS} onChange={setTab} />
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        {canPickTenant ? (
          <FormField label="Newspaper" className="min-w-[220px] flex-1">
            <Select value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
              <option value="">— Select —</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || t.slug}
                </option>
              ))}
            </Select>
          </FormField>
        ) : null}

        {tab === 'print' ? (
          <>
            <FormField label="Edition day (IST)">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </FormField>
            <FormField label="Window">
              <Select value={timeRule} onChange={(e) => setTimeRule(e.target.value)}>
                <option value="newsroom">Newsroom (6am–midnight)</option>
                <option value="epaper">ePaper (prev 7pm–4am)</option>
                <option value="auto">Auto</option>
              </Select>
            </FormField>
          </>
        ) : (
          <>
            <FormField label="Month">
              <Input type="month" value={month} max={currentIstMonth()} onChange={(e) => setMonth(e.target.value)} />
            </FormField>
            <FormField label="Who">
              <Segmented value={audience} options={AUDIENCES} onChange={setAudience} />
            </FormField>
            <FormField label={audience === 'moderator' ? 'Employee' : 'Reporter'} className="min-w-[200px]">
              <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                <option value="">Everyone</option>
                {employeeOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </>
        )}

        <Button variant="default" onClick={load} loading={loading} className="ml-auto">
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          {/404|not found/i.test(error) ? (
            <span className="block text-xs text-red-600">
              The insights APIs are not live on the backend yet — deploy the backend and retry.
            </span>
          ) : null}
        </div>
      ) : null}

      {canPickTenant && !tenantId ? (
        <Empty>Select a newspaper to see insights.</Empty>
      ) : tab === 'print' ? (
        <PrintTab data={print} loading={loading} tenantId={tenantId} date={date} />
      ) : tab === 'web' ? (
        <WebTab data={web} loading={loading} employeeId={employeeId} />
      ) : (
        <WorkTab data={work} loading={loading} employeeId={employeeId} />
      )}

      {tenantName ? <p className="text-xs text-slate-400">{tenantName}</p> : null}
    </div>
  )
}
