import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useLayout } from '../DashboardLayout'
import newsDeskApi, { formatNewsDeskError } from '../../../lib/api/services/newsDeskApi'
import { loadNewsDeskCategories } from '../../../lib/newsDesk/categoryLoader'
import { refreshNewsDeskDashboard } from '../../../lib/newsDesk/dashboardRefresh'
import NewsDeskAccessGate from './NewsDeskAccessGate'
import NewsDeskFilters from './NewsDeskFilters'
import NewsDeskJobTable from './NewsDeskJobTable'
import { Button, StatCard, toast } from '../../ui'
import { IconBarChart, IconClock, IconFileText, IconPlus, IconAlertCircle } from '../../ui/icons'

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

export default function NewsDeskDashboardView() {
  const { user } = useLayout()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [applied, setApplied] = useState(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
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
    } catch (error) {
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
    } catch (error) {
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

  const applyFilters = () => {
    setApplied({ ...filters })
    setPage(1)
  }

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setApplied(DEFAULT_FILTERS)
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
      <div className="max-w-7xl mx-auto space-y-6 pb-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">Kaburlu News Desk</p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">Editorial intake &amp; facts</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Submit original news, track AI fact extraction, and review structured output. Counts use server totals
              (separate filtered list queries), not page-local rows.
            </p>
          </div>
          <Link href="/admin/news-desk/create">
            <Button type="button">
              <IconPlus className="w-4 h-4 mr-2" />
              Create news
            </Button>
          </Link>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total News" value={stats.loading ? '…' : stats.total ?? '—'} icon={<IconFileText className="w-5 h-5" />} />
          <StatCard title="Extraction pending" value={stats.loading ? '…' : stats.pending ?? '—'} icon={<IconClock className="w-5 h-5" />} />
          <StatCard title="Facts ready" value={stats.loading ? '…' : stats.ready ?? '—'} icon={<IconBarChart className="w-5 h-5" />} />
          <StatCard title="Extraction failed" value={stats.loading ? '…' : stats.failed ?? '—'} icon={<IconAlertCircle className="w-5 h-5" />} />
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
        />
      </div>
    </NewsDeskAccessGate>
  )
}