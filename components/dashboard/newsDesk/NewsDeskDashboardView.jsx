import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useLayout } from '../DashboardLayout'
import newsDeskApi, { formatNewsDeskError } from '../../../lib/api/services/newsDeskApi'
import { loadNewsDeskCategories } from '../../../lib/newsDesk/categoryLoader'
import { refreshNewsDeskDashboard } from '../../../lib/newsDesk/dashboardRefresh'
import { mapNewsDeskDashboardStats } from '../../../lib/newsDesk/analyticsMap'
import NewsDeskAccessGate from './NewsDeskAccessGate'
import NewsDeskFilters from './NewsDeskFilters'
import NewsDeskJobTable from './NewsDeskJobTable'
import NewsDeskApiBanner from './NewsDeskApiBanner'
import { Button, StatCard, toast } from '../../ui'
import { canAccessSyndication } from '../../../lib/syndication/platformRoles'
import { canManageNewsDeskStaff } from '../../../lib/newsDesk/adminRoles'
import { IconBarChart, IconClock, IconFileText, IconPlus, IconAlertCircle } from '../../ui/icons'
import { DEFAULT_NEWS_ROOM_BASE, newsRoomPaths } from '../../../lib/newsDesk/paths'

const DEFAULT_FILTERS = {
  q: '',
  pipelineStatus: '',
  extractionStatus: '',
  categoryId: '',
  fromDate: '',
  toDate: '',
  sort: 'createdAt',
  order: 'desc',
}

const PAGE_SIZE = 20

function toIsoDateInput(value) {
  if (!value) return undefined
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return undefined
    return d.toISOString()
  } catch {
    return undefined
  }
}

export default function NewsDeskDashboardView({ basePath = DEFAULT_NEWS_ROOM_BASE }) {
  const paths = newsRoomPaths(basePath)
  const router = useRouter()
  const { user } = useLayout()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [applied, setApplied] = useState(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState({
    total: null,
    pending: null,
    ready: null,
    failed: null,
    loading: true,
  })

  useEffect(() => {
    loadNewsDeskCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  const listParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      q: applied.q || undefined,
      pipelineStatus: applied.pipelineStatus || undefined,
      extractionStatus: applied.extractionStatus || undefined,
      categoryId: applied.categoryId || undefined,
      fromDate: toIsoDateInput(applied.fromDate),
      toDate: toIsoDateInput(applied.toDate ? `${applied.toDate}T23:59:59` : ''),
      sort: applied.sort,
      order: applied.order,
    }),
    [applied, page],
  )

  const loadStats = useCallback(async () => {
    setStats((s) => ({ ...s, loading: true }))
    try {
      const base = { page: 1, pageSize: 1 }
      const analyticsRes = await newsDeskApi.getAnalytics().catch(() => null)
      const mapped = mapNewsDeskDashboardStats(analyticsRes)
      if (mapped && mapped.total != null) {
        setStats({
          total: mapped.total,
          pending: mapped.pending ?? 0,
          ready: mapped.ready ?? 0,
          failed: mapped.failed ?? 0,
          loading: false,
        })
        setApiError(null)
        return
      }
      const [all, pending, ready, failed] = await Promise.all([
        newsDeskApi.listJobs(base),
        newsDeskApi.listJobs({ ...base, extractionStatus: 'EXTRACTION_PENDING' }),
        newsDeskApi.listJobs({ ...base, extractionStatus: 'EXTRACTION_SUCCEEDED' }),
        newsDeskApi.listJobs({ ...base, extractionStatus: 'EXTRACTION_FAILED' }),
      ])
      setStats({
        total: all?.total ?? 0,
        pending: pending?.total ?? 0,
        ready: ready?.total ?? 0,
        failed: failed?.total ?? 0,
        loading: false,
      })
      setApiError(null)
    } catch (error) {
      setApiError(error)
      toast.error(formatNewsDeskError(error))
      setStats({ total: null, pending: null, ready: null, failed: null, loading: false })
    }
  }, [])

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const result = await newsDeskApi.listJobs(listParams)
      setItems(result?.items || [])
      setTotal(result?.total || 0)
      setApiError(null)
    } catch (error) {
      setApiError(error)
      toast.error(formatNewsDeskError(error))
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [listParams])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    const highlight = router.query?.highlight
    if (highlight && typeof highlight === 'string') {
      toast.success('New submission added — open from the table or view detail.')
      const { highlight: _h, ...rest } = router.query
      router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true })
    }
  }, [router.query?.highlight])

  const applyFilters = () => {
    setApplied({ ...filters })
    setPage(1)
  }

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setApplied(DEFAULT_FILTERS)
    setPage(1)
  }

  const applyExtractionFilter = (extractionStatus) => {
    const next = { ...DEFAULT_FILTERS, extractionStatus }
    setFilters(next)
    setApplied(next)
    setPage(1)
  }

  const refreshAll = useCallback(async () => {
    try {
      await refreshNewsDeskDashboard({ loadStats, loadList })
    } catch (error) {
      toast.error(error.message || 'Refresh failed')
    }
  }, [loadStats, loadList])

  return (
    <NewsDeskAccessGate user={user}>
      <div className="max-w-7xl mx-auto space-y-5 pb-12">
        <header className="flex flex-wrap items-start justify-between gap-4 pb-1 border-b border-slate-200/80">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">News Desk</p>
            <h1 className="text-2xl font-semibold text-slate-900 mt-1 tracking-tight">
              Intake &amp; publishing
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 max-w-lg">
              One row = one story. <strong className="font-medium text-slate-700">Targets</strong> shows which tenants
              received it — expand for full list. Staff tenant scope:{' '}
              <Link href={paths.settings} className="text-brand hover:underline">
                Settings
              </Link>
              .
            </p>
          </div>
            <div className="flex flex-wrap gap-2">
              {canManageNewsDeskStaff(user) && (
                <Link href={paths.settings}>
                  <Button type="button" variant="secondary">
                    Staff &amp; analytics
                  </Button>
                </Link>
              )}
              <Link href={paths.post}>
                <Button type="button">
                  <IconPlus className="w-4 h-4 mr-2" />
                  New intake
                </Button>
              </Link>
            </div>
        </header>

        <NewsDeskApiBanner error={apiError} />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { key: '', title: 'Total', value: stats.total, icon: IconFileText },
            { key: 'EXTRACTION_PENDING', title: 'Pending', value: stats.pending, icon: IconClock },
            { key: 'EXTRACTION_SUCCEEDED', title: 'Facts ready', value: stats.ready, icon: IconBarChart },
            { key: 'EXTRACTION_FAILED', title: 'Failed', value: stats.failed, icon: IconAlertCircle },
          ].map(({ key, title, value, icon: Icon }) => {
            const active = (applied.extractionStatus || '') === key
            return (
              <button
                key={key || 'all'}
                type="button"
                className={`text-left rounded-xl transition-all ${
                  active ? 'ring-2 ring-brand/40 ring-offset-2' : 'hover:ring-1 hover:ring-slate-200'
                }`}
                onClick={() => applyExtractionFilter(key)}
              >
                <StatCard
                  title={title}
                  value={stats.loading ? '…' : value ?? '—'}
                  icon={<Icon className="w-5 h-5" />}
                  className="w-full cursor-pointer border-slate-200/80"
                />
              </button>
            )
          })}
        </div>

        <NewsDeskFilters
          filters={filters}
          onChange={setFilters}
          categories={categories}
          onApply={applyFilters}
          onReset={resetFilters}
          onRefresh={refreshAll}
          loading={loading}
        />

        <NewsDeskJobTable
          items={items}
          loading={loading}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          basePath={basePath}
        />

        {canAccessSyndication(user) && (
          <p className="text-xs text-slate-400 text-center pt-4">
            Need legacy multi-tenant AI publish?{' '}
            <Link href="/admin/platform-syndication?legacy=1" className="text-brand hover:underline">
              Open legacy syndication
            </Link>
          </p>
        )}
      </div>
    </NewsDeskAccessGate>
  )
}