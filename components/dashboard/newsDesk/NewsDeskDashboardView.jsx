import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useLayout } from '../DashboardLayout'
import newsDeskApi, { formatNewsDeskError } from '../../../lib/api/services/newsDeskApi'
import { loadNewsDeskCategories } from '../../../lib/newsDesk/categoryLoader'
import { refreshNewsDeskDashboard } from '../../../lib/newsDesk/dashboardRefresh'
import NewsDeskAccessGate from './NewsDeskAccessGate'
import NewsDeskFilters from './NewsDeskFilters'
import NewsDeskJobTable from './NewsDeskJobTable'
import NewsDeskApiBanner from './NewsDeskApiBanner'
import { Button, toast } from '../../ui'
import { canAccessSyndication } from '../../../lib/syndication/platformRoles'
import { canManageNewsDeskStaff } from '../../../lib/newsDesk/adminRoles'
import { IconPlus } from '../../ui/icons'
import { DEFAULT_NEWS_ROOM_BASE, newsRoomPaths } from '../../../lib/newsDesk/paths'
import { countRowsByDeskTab, filterRowsByDeskTab } from '../../../lib/newsDesk/deskQueueStage'
import NewsDeskQueueTabs from './NewsDeskQueueTabs'

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
const QUEUE_FETCH_SIZE = 50

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
  const [queueTab, setQueueTab] = useState('queue')
  const [highlightJobId, setHighlightJobId] = useState('')
  const [tabCounts, setTabCounts] = useState({ queue: null, published: null, all: null })

  useEffect(() => {
    loadNewsDeskCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  const listParams = useMemo(
    () => ({
      page: queueTab === 'all' ? page : 1,
      pageSize: queueTab === 'all' ? PAGE_SIZE : QUEUE_FETCH_SIZE,
      q: applied.q || undefined,
      pipelineStatus: applied.pipelineStatus || undefined,
      extractionStatus: applied.extractionStatus || undefined,
      categoryId: applied.categoryId || undefined,
      fromDate: toIsoDateInput(applied.fromDate),
      toDate: toIsoDateInput(applied.toDate ? `${applied.toDate}T23:59:59` : ''),
      sort: applied.sort,
      order: applied.order,
    }),
    [applied, page, queueTab],
  )

  const displayItems = useMemo(
    () => filterRowsByDeskTab(items, queueTab),
    [items, queueTab],
  )

  const displayTotal = queueTab === 'all' ? total : displayItems.length

  const loadTabCounts = useCallback(async () => {
    try {
      const res = await newsDeskApi.listJobs({ page: 1, pageSize: QUEUE_FETCH_SIZE })
      const rows = res?.items || []
      setTabCounts(countRowsByDeskTab(rows))
      setApiError(null)
    } catch (error) {
      setApiError(error)
    }
  }, [])

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const result = await newsDeskApi.listJobs(listParams)
      const rows = result?.items || []
      setItems(rows)
      setTotal(result?.total || 0)
      setTabCounts(countRowsByDeskTab(rows))
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
    loadTabCounts()
  }, [loadTabCounts])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    const highlight = router.query?.highlight
    const tab = router.query?.tab
    if (tab === 'queue' || tab === 'published' || tab === 'all') {
      setQueueTab(tab)
    }
    if (highlight && typeof highlight === 'string') {
      setHighlightJobId(highlight)
      setQueueTab('queue')
      toast.success('Added to queue — facts extract automatically. Click the row to publish.')
      const { highlight: _h, tab: _t, ...rest } = router.query
      router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true })
    }
  }, [router.query?.highlight, router.query?.tab, router])

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
      await refreshNewsDeskDashboard({ loadStats: loadTabCounts, loadList })
    } catch (error) {
      toast.error(error.message || 'Refresh failed')
    }
  }, [loadTabCounts, loadList])

  const listTitle =
    queueTab === 'published' ? 'Published' : queueTab === 'all' ? 'All stories' : 'Queue — work here first'

  return (
    <NewsDeskAccessGate user={user}>
      <div className="max-w-7xl mx-auto space-y-5 pb-12">
        <header className="flex flex-wrap items-start justify-between gap-4 pb-1 border-b border-slate-200/80">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">News Desk</p>
            <h1 className="text-2xl font-semibold text-slate-900 mt-1 tracking-tight">News queue</h1>
            <p className="text-sm text-slate-500 mt-1.5 max-w-xl">
              Post వార్త → <strong className="text-amber-800">Queue</strong>లో కనిపిస్తుంది → review → publish →{' '}
              <strong className="text-emerald-800">Published</strong> tabలో update. Staff scope:{' '}
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

        <NewsDeskQueueTabs active={queueTab} counts={tabCounts} onChange={setQueueTab} />

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
          items={displayItems}
          loading={loading}
          page={queueTab === 'all' ? page : 1}
          pageSize={queueTab === 'all' ? PAGE_SIZE : QUEUE_FETCH_SIZE}
          total={displayTotal}
          onPageChange={setPage}
          basePath={basePath}
          highlightJobId={highlightJobId}
          listTitle={listTitle}
          showPagination={queueTab === 'all'}
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