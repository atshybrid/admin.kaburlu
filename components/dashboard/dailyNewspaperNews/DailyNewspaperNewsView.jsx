/**
 * Daily Newspaper News — tenant feed browser with copy-to-clipboard for desk
 */

import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { tenantsApi } from '../../../lib/api/tenantApi'
import { newspaperTenantFeedApi } from '../../../lib/api/services/newspaperTenantFeedApi'
import {
  articleDisplayTitle,
  articleHighlightsList,
  articleMediaImages,
  copyRichClipboard,
  copyToClipboard,
  formatArticleBoard2Rich,
  formatArticleBodyFlowOnly,
  formatBodyPlain,
  formatDatelineCopy,
  resolveArticleParts,
  todayIstDateString,
} from '../../../lib/newspaperFeed/articleCopy'
import {
  articleMatchesWordRange,
  articleWordCount,
  countByWordRange,
  formatArticleCreatedIst,
  sortArticlesByCreated,
  wordCountBucketLabel,
  WORD_RANGE_OPTIONS,
} from '../../../lib/newspaperFeed/articleMetrics'
import {
  articleViewKey,
  loadViewedIdSet,
  persistViewedIdSet,
} from '../../../lib/newspaperFeed/viewedArticles'
import { getAuthUser } from '../../../utils/auth'
import { isSuperAdmin } from '../../../utils/roleUtils'
import { filterActiveTenants } from '../../../lib/tenant/isActiveTenant'
import {
  collectReporterFilterOptions,
  dedupeFeedArticles,
  flattenFeedArticles,
} from '../../../lib/newspaperFeed/feedList'

function contentSourceFromMode(mode) {
  if (mode === 'desk') return 'desk'
  if (mode === 'all') return 'all'
  return 'reporter'
}
import { Button, FormField, Input, Select, Spinner, toast } from '../../ui'

function unwrapTenants(raw) {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.items)) return raw.items
  if (Array.isArray(raw?.data?.items)) return raw.data.items
  if (Array.isArray(raw?.data)) return raw.data
  return []
}

function priorityLabel(bucket) {
  if (bucket === 'p1') return 'Priority 1'
  if (bucket === 'p2') return 'Priority 2'
  if (bucket === 'p3') return 'Priority 3'
  return 'Others'
}

function priorityClass(bucket) {
  if (bucket === 'p1') return 'border-l-rose-500 bg-rose-50/40'
  if (bucket === 'p2') return 'border-l-amber-500 bg-amber-50/40'
  if (bucket === 'p3') return 'border-l-sky-500 bg-sky-50/30'
  return 'border-l-slate-300 bg-white'
}

function TitleCopyButton({ title, onCopied }) {
  const [copied, setCopied] = useState(false)
  const onCopy = async () => {
    const text = String(title || '').trim()
    if (!text) {
      toast.error('No title')
      return
    }
    try {
      const ok = await copyToClipboard(text)
      if (!ok) {
        toast.error('Nothing to copy')
        return
      }
      setCopied(true)
      toast.success('Title copied')
      onCopied?.()
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Copy failed')
    }
  }
  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 transition-colors"
    >
      {copied ? '✓ Copied' : 'Copy title'}
    </button>
  )
}

function BoardCopyButton({ article, onCopied }) {
  const [copied, setCopied] = useState(false)
  const onCopy = async () => {
    try {
      const { plain, html } = formatArticleBoard2Rich(article)
      const ok = await copyRichClipboard({ plain, html })
      if (!ok) {
        toast.error('Nothing to copy')
        return
      }
      setCopied(true)
      toast.success('Article (board 2) copied')
      onCopied?.()
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Copy failed')
    }
  }
  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
    >
      {copied ? '✓ Copied' : 'Copy article (board 2)'}
    </button>
  )
}

function ArticleCard({
  article,
  reporterName,
  districtName,
  priorityBucket,
  viewed,
  wordCount,
  createdLabel,
  onViewed,
}) {
  const title = articleDisplayTitle(article)
  const { datelineTag, bodyParagraphs } = resolveArticleParts(article)
  const dateline = datelineTag
  const articleBodyOnly = formatArticleBodyFlowOnly(article)
  const mediaImages = articleMediaImages(article)
  const lengthLabel = wordCountBucketLabel(wordCount)

  return (
    <article
      className={`rounded-2xl border border-slate-200 border-l-4 shadow-sm overflow-hidden ${priorityClass(
        priorityBucket || article.priorityBucket,
      )}`}
    >
      <div className="border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/80 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">
            {priorityLabel(priorityBucket || article.priorityBucket)}
          </span>
          {article.important?.isBreaking ? (
            <span className="text-[10px] font-bold uppercase text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
              Breaking
            </span>
          ) : null}
          <span className="text-[10px] font-semibold tabular-nums text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
            {wordCount} words · {lengthLabel}
          </span>
          <span className="text-[10px] text-slate-500">Created {createdLabel}</span>
          {viewed ? (
            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Viewed
            </span>
          ) : null}
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">{title}</h3>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500 min-w-0">
            {[districtName, reporterName, article.reporter?.designation?.nativeName || article.reporter?.designation?.name]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <TitleCopyButton title={title} onCopied={onViewed} />
            <BoardCopyButton article={article} onCopied={onViewed} />
          </div>
        </div>
      </div>

      {mediaImages.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 bg-slate-950/5 px-5 py-4">
          {mediaImages.map((img, index) => (
            <figure
              key={img.url || index}
              className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${
                mediaImages.length === 1 ? 'sm:col-span-2' : ''
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt || img.caption || `Photo ${index + 1}`}
                className="w-full max-h-[22rem] object-contain bg-slate-100"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              {img.caption ? (
                <figcaption className="border-t border-slate-100 px-3 py-2 text-sm text-slate-700 leading-snug">
                  {img.caption}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      ) : null}

      {(dateline || bodyParagraphs.length || articleBodyOnly) ? (
        <main className="px-5 py-4 text-sm text-slate-800 leading-relaxed bg-white space-y-2">
          {dateline || articleBodyOnly ? (
            <p>
              {dateline ? (
                <>
                  <span className="font-bold text-slate-900">{dateline}</span>
                  {articleBodyOnly ? (
                    <>
                      <span> : </span>
                      <span className="font-normal">{articleBodyOnly}</span>
                    </>
                  ) : (
                    <span className="font-bold"> :</span>
                  )}
                </>
              ) : (
                <span className="font-normal">{articleBodyOnly}</span>
              )}
            </p>
          ) : null}
        </main>
      ) : null}
    </article>
  )
}

export default function DailyNewspaperNewsView() {
  const router = useRouter()
  const authUser = useMemo(() => (typeof window !== 'undefined' ? getAuthUser() : null), [])
  const canPickTenant = isSuperAdmin(authUser)

  const [tenants, setTenants] = useState([])
  const [tenantsLoading, setTenantsLoading] = useState(true)
  const [tenantId, setTenantId] = useState('')
  const [businessDate, setBusinessDate] = useState(todayIstDateString())
  const [timeRule, setTimeRule] = useState('newsroom')
  const [districtId, setDistrictId] = useState('')
  const [reporterId, setReporterId] = useState('')
  const [contentMode, setContentMode] = useState('best') // best | desk | all
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [feed, setFeed] = useState(null)
  const [filterOptions, setFilterOptions] = useState({ districts: [], states: [], reporters: [] })
  const [feedPage, setFeedPage] = useState(1)
  const [articleIndex, setArticleIndex] = useState(0)
  const [feedHint, setFeedHint] = useState(null)
  const [wordRange, setWordRange] = useState('all')
  const [viewedIds, setViewedIds] = useState(() => new Set())

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setTenantsLoading(true)
      try {
        const raw = await tenantsApi.list(true)
        const list = filterActiveTenants(unwrapTenants(raw))
        if (cancelled) return
        setTenants(list)
        if (!canPickTenant && authUser?.tenantId) {
          setTenantId(authUser.tenantId)
        } else if (list[0]?.id) {
          setTenantId((current) => current || list[0].id)
        }
      } catch (err) {
        if (!cancelled) toast.error(err.message || 'Failed to load tenants')
      } finally {
        if (!cancelled) setTenantsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [authUser?.tenantId, canPickTenant])

  useEffect(() => {
    const fromQuery = router.query?.tenantId
    if (fromQuery && canPickTenant) {
      setTenantId(String(fromQuery))
    }
  }, [router.query?.tenantId, canPickTenant])

  useEffect(() => {
    if (!tenantId || !businessDate) {
      setViewedIds(new Set())
      return
    }
    setViewedIds(loadViewedIdSet(tenantId, businessDate))
  }, [tenantId, businessDate])

  const markArticleViewed = useCallback(
    (article) => {
      const key = articleViewKey(article)
      if (!key || !tenantId || !businessDate) return
      setViewedIds((prev) => {
        if (prev.has(key)) return prev
        const next = new Set(prev)
        next.add(key)
        persistViewedIdSet(tenantId, businessDate, next)
        return next
      })
    },
    [tenantId, businessDate],
  )

  const loadFeed = useCallback(async () => {
    if (!tenantId) {
      toast.error('Select a newspaper (tenant)')
      return
    }
    setLoading(true)
    try {
      const params = {
        tenantId,
        date: businessDate,
        timeRule,
        contentSource: contentSourceFromMode(contentMode),
        view: 'both',
        includeFilterOptions: 'true',
        page: String(feedPage),
        pageSize: '500',
      }
      if (districtId) params.districtId = districtId
      if (reporterId) params.reporterId = reporterId

      const response = await newspaperTenantFeedApi.getPublicTenantFeed(params)
      const data = response?.data ?? response
      if (data?.success === false) {
        throw new Error(data.message || 'Feed request failed')
      }
      setFeed(data)
      const opts = data.filterOptions || {}
      setFilterOptions({
        districts: opts.districts || [],
        states: opts.states || [],
        reporters: opts.reporters || [],
      })

      const dayTotal = data?.summary?.articleCount ?? 0
      const source = contentSourceFromMode(contentMode)
      if (source === 'reporter' && dayTotal === 0) {
        try {
          const base = {
            tenantId,
            date: businessDate,
            timeRule,
            view: 'both',
            page: '1',
            pageSize: '1',
          }
          if (districtId) base.districtId = districtId
          const [allWrap, deskWrap] = await Promise.all([
            newspaperTenantFeedApi.getPublicTenantFeed({ ...base, contentSource: 'all' }),
            newspaperTenantFeedApi.getPublicTenantFeed({ ...base, contentSource: 'desk' }),
          ])
          const allData = allWrap?.data ?? allWrap
          const deskData = deskWrap?.data ?? deskWrap
          setFeedHint({
            all: allData?.summary?.articleCount ?? 0,
            desk: deskData?.summary?.articleCount ?? 0,
          })
        } catch {
          setFeedHint(null)
        }
      } else {
        setFeedHint(null)
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load newspaper news')
      setFeed(null)
    } finally {
      setLoading(false)
    }
  }, [tenantId, businessDate, timeRule, districtId, reporterId, contentMode, feedPage])

  useEffect(() => {
    if (tenantId && !tenantsLoading) {
      loadFeed()
    }
  }, [
    tenantId,
    tenantsLoading,
    businessDate,
    timeRule,
    districtId,
    reporterId,
    contentMode,
    feedPage,
    loadFeed,
  ])

  const allFlattened = useMemo(() => {
    if (!feed) return []
    return dedupeFeedArticles(flattenFeedArticles(feed))
  }, [feed])

  const reporterOptions = useMemo(() => {
    const fromApi = filterOptions.reporters || []
    if (fromApi.length) {
      return fromApi.map((r) => ({
        reporterId: r.reporterId,
        name:
          r.articleCount != null
            ? `${r.name} (${r.articleCount})`
            : r.name || r.reporterId,
      }))
    }
    return collectReporterFilterOptions(allFlattened)
  }, [filterOptions.reporters, allFlattened])

  const filteredFlat = useMemo(() => {
    let list = allFlattened
    if (reporterId) {
      list = list.filter((a) => String(a._reporterId || a.reporter?.reporterId || '') === reporterId)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((a) => {
        const hay = [
          articleDisplayTitle(a),
          formatDatelineCopy(a),
          formatBodyPlain(a),
          a._reporterName,
          a._districtName,
          ...(articleHighlightsList(a)),
        ]
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
    }
    if (wordRange !== 'all') {
      list = list.filter((a) => articleMatchesWordRange(a, wordRange))
    }
    return sortArticlesByCreated(list, 'desc')
  }, [allFlattened, reporterId, search, wordRange])

  const rangeCounts = useMemo(() => countByWordRange(allFlattened), [allFlattened])

  useEffect(() => {
    setArticleIndex(0)
  }, [filteredFlat.length, tenantId, businessDate, reporterId, contentMode, districtId, search, wordRange])

  useEffect(() => {
    if (articleIndex >= filteredFlat.length) {
      setArticleIndex(Math.max(0, filteredFlat.length - 1))
    }
  }, [articleIndex, filteredFlat.length])

  const currentArticle = filteredFlat[articleIndex] || null
  const currentViewKey = currentArticle ? articleViewKey(currentArticle) : ''
  const currentViewed = currentViewKey ? viewedIds.has(currentViewKey) : false
  const currentWordCount = currentArticle ? articleWordCount(currentArticle) : 0

  useEffect(() => {
    if (currentArticle) markArticleViewed(currentArticle)
  }, [currentArticle, markArticleViewed])

  const goPrev = () => setArticleIndex((i) => Math.max(0, i - 1))
  const goNext = () => setArticleIndex((i) => Math.min(filteredFlat.length - 1, i + 1))

  const tenantName = feed?.tenant?.name || tenants.find((t) => t.id === tenantId)?.name || '—'
  const summary = feed?.summary
  const timeWindow = feed?.timeWindow
  const dateMismatch =
    timeWindow?.businessDate &&
    businessDate &&
    String(timeWindow.businessDate) !== String(businessDate)
  const feedPagination = summary?.pagination

  const onContentMode = (id) => {
    setContentMode(id)
    setFeedPage(1)
  }

  const reporterDayChips = useMemo(() => {
    const fromSummary = summary?.reporters
    if (Array.isArray(fromSummary) && fromSummary.length) {
      return [...fromSummary].sort((a, b) => (b.articleCount ?? 0) - (a.articleCount ?? 0))
    }
    const fromFilters = filterOptions.reporters
    if (Array.isArray(fromFilters) && fromFilters.length) {
      return [...fromFilters].sort((a, b) => (b.articleCount ?? 0) - (a.articleCount ?? 0))
    }
    return []
  }, [summary?.reporters, filterOptions.reporters])

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-orange-50/30 to-amber-50/50 p-5 sm:p-6 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Get Daily Newspaper News</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Edition day newsroom window (6am–midnight IST). API{' '}
          <code className="text-xs bg-slate-100 px-1 rounded">contentSource=reporter</code> by default — no desk
          syndication. Copy one story at a time.
        </p>
      </div>

      {feed && summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Articles (day)</p>
            <p className="text-2xl font-bold tabular-nums text-slate-900 mt-0.5">
              {summary.articleCount ?? allFlattened.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Reporters</p>
            <p className="text-2xl font-bold tabular-nums text-emerald-700 mt-0.5">
              {summary.reporterCount ?? reporterDayChips.length ?? '—'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">This page</p>
            <p className="text-2xl font-bold tabular-nums text-slate-800 mt-0.5">{filteredFlat.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm col-span-2 sm:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Source</p>
            <p className="text-sm font-semibold text-brand-dark mt-1">
              {summary.contentSource || contentSourceFromMode(contentMode)}
            </p>
          </div>
        </div>
      ) : null}

      {feed && reporterDayChips.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-700">
              Reporter-wise posts (full day)
              <span className="ml-2 font-normal text-slate-500">chip click → filter</span>
            </p>
            {reporterId ? (
              <button
                type="button"
                onClick={() => {
                  setReporterId('')
                  setFeedPage(1)
                }}
                className="text-[11px] font-semibold text-brand hover:underline"
              >
                Clear reporter filter
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
            {reporterDayChips.map((r) => {
              const id = r.reporterId
              const active = reporterId === String(id)
              const label = r.name || id
              const count = r.articleCount ?? 0
              return (
                <button
                  key={id}
                  type="button"
                  title={r.districtName ? `${label} · ${r.districtName}` : label}
                  onClick={() => {
                    setReporterId(active ? '' : String(id))
                    setFeedPage(1)
                    setArticleIndex(0)
                  }}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-white'
                  }`}
                >
                  <span className="truncate max-w-[140px]">{label}</span>
                  <span
                    className={`tabular-nums rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField label="Newspaper (tenant)" required>
            {tenantsLoading ? (
              <Spinner size="sm" />
            ) : (
              <Select
                value={tenantId}
                disabled={!canPickTenant && Boolean(authUser?.tenantId)}
                onChange={(e) => {
                  setTenantId(e.target.value)
                  setFeedPage(1)
                }}
              >
                <option value="">— Select —</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name || t.slug || t.id}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField label="Business date (IST)">
            <Input
              type="date"
              value={businessDate}
              onChange={(e) => {
                setBusinessDate(e.target.value)
                setFeedPage(1)
              }}
            />
          </FormField>
          <FormField label="Edition time rule">
            <Select
              value={timeRule}
              onChange={(e) => {
                setTimeRule(e.target.value)
                setFeedPage(1)
              }}
            >
              <option value="newsroom">Newsroom (6am–midnight IST)</option>
              <option value="today">Today (= newsroom)</option>
              <option value="auto">Auto (before 6am → ePaper)</option>
              <option value="epaper">ePaper (prev 7pm → 4am)</option>
            </Select>
          </FormField>
          <FormField label="District filter">
            <Select
              value={districtId}
              onChange={(e) => {
                setDistrictId(e.target.value)
                setFeedPage(1)
              }}
            >
              <option value="">All districts</option>
              {(filterOptions.districts.length
                ? filterOptions.districts
                : []
              ).map((d) => (
                <option key={d.id || d.districtId} value={d.id || d.districtId}>
                  {d.name || d.districtName || d.id}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Reporter">
            <Select
              value={reporterId}
              onChange={(e) => {
                setReporterId(e.target.value)
                setFeedPage(1)
              }}
              disabled={!reporterOptions.length}
            >
              <option value="">All reporters</option>
              {reporterOptions.map((r) => (
                <option key={r.reporterId} value={r.reporterId}>
                  {r.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'best', label: 'Reporter only' },
            { id: 'desk', label: 'Desk / syndicated' },
            { id: 'all', label: 'All' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onContentMode(m.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                contentMode === m.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <FormField label="Search in results" className="flex-1 min-w-[200px]">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, dateline, reporter…"
            />
          </FormField>
          <Button type="button" onClick={loadFeed} loading={loading} disabled={!tenantId}>
            Load news
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setBusinessDate(todayIstDateString())
              setDistrictId('')
              setReporterId('')
              setContentMode('best')
              setTimeRule('newsroom')
              setWordRange('all')
              setFeedPage(1)
            }}
          >
            Reset filters
          </Button>
        </div>

        {feed && allFlattened.length > 0 ? (
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-700">
              Word count · sorted by create time (newest first)
            </p>
            <div className="flex flex-wrap gap-2">
              {WORD_RANGE_OPTIONS.map((r) => {
                const count =
                  r.id === 'all'
                    ? allFlattened.length
                    : r.id === 'short'
                      ? rangeCounts.short
                      : r.id === 'medium'
                        ? rangeCounts.medium
                        : rangeCounts.long
                const active = wordRange === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setWordRange(r.id)
                      setArticleIndex(0)
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {r.label}
                    <span
                      className={`tabular-nums rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        active ? 'bg-white/20' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {timeWindow ? (
          <div className="flex flex-wrap gap-2 text-xs items-center">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              {tenantName}
            </span>
            <span className="rounded-full bg-brand/10 px-3 py-1 text-brand-dark font-medium">
              Loaded {timeWindow.businessDate} · {timeWindow.effectiveRule || timeRule}
            </span>
            {dateMismatch ? (
              <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-800 font-semibold">
                Pick {businessDate} but API returned {timeWindow.businessDate} — reload or fix date
              </span>
            ) : null}
            {summary ? (
              <>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
                  {summary.articleCount ?? allFlattened.length} articles · {summary.reporterCount ?? '—'} reporters
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                  {filteredFlat.length} on page · source={summary.contentSource || contentSourceFromMode(contentMode)}
                </span>
              </>
            ) : null}
            {feedPagination?.totalPages > 1 ? (
              <span className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={feedPage <= 1 || loading}
                  onClick={() => setFeedPage((p) => Math.max(1, p - 1))}
                >
                  Feed page −
                </Button>
                <span className="tabular-nums px-1">
                  {feedPage}/{feedPagination.totalPages}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={
                    loading || feedPage >= (feedPagination.totalPages || 1)
                  }
                  onClick={() => setFeedPage((p) => p + 1)}
                >
                  Feed page +
                </Button>
              </span>
            ) : null}
          </div>
        ) : null}
      </section>

      {loading && !feed ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : null}

      {!loading && feed && filteredFlat.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 sm:p-10 text-center space-y-4">
          <p className="text-slate-700 font-medium">No articles for this date / filters.</p>
          {timeWindow ? (
            <p className="text-xs text-slate-500 font-mono max-w-lg mx-auto">
              Window: {timeWindow.startAtIst || timeWindow.fromDate} →{' '}
              {timeWindow.endAtIst || timeWindow.toDate} · source=
              {summary?.contentSource || contentSourceFromMode(contentMode)}
            </p>
          ) : null}
          {feedHint && (feedHint.all > 0 || feedHint.desk > 0) ? (
            <div className="max-w-xl mx-auto rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-left text-sm text-amber-950">
              <p className="font-semibold">News ఉంది — కానీ Reporter only లో కనిపించడం లేదు</p>
              <p className="mt-2 text-xs leading-relaxed text-amber-900">
                ఈ రోజు edition window లో <strong>{feedHint.all}</strong> published stories ఉన్నాయి (
                <strong>{feedHint.desk}</strong> desk/syndicated). Default{' '}
                <code className="bg-white/80 px-1 rounded">contentSource=reporter</code> వాటిని exclude
                చేస్తుంది — author కి Reporter profile లేకుండా లేదా news desk నుండి file అయినవి.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                <Button type="button" size="sm" onClick={() => onContentMode('all')}>
                  Show all ({feedHint.all})
                </Button>
                {feedHint.desk > 0 ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => onContentMode('desk')}>
                    Desk only ({feedHint.desk})
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try <strong>All</strong> or <strong>Desk / syndicated</strong>, or another business date / epaper window.
            </p>
          )}
        </div>
      ) : null}

      {feed && filteredFlat.length > 0 && currentArticle ? (
        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm sticky top-0 z-20 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Story navigator</p>
                <p className="text-sm text-slate-800 mt-0.5">
                  <span className="font-bold tabular-nums">{articleIndex + 1}</span>
                  <span className="text-slate-500"> / {filteredFlat.length}</span>
                  <span className="text-slate-500"> · {currentWordCount} words</span>
                  {currentViewed ? <span className="text-emerald-700 font-semibold"> · Viewed</span> : null}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" disabled={articleIndex <= 0} onClick={goPrev}>
                  ← Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={articleIndex >= filteredFlat.length - 1}
                  onClick={goNext}
                >
                  Next →
                </Button>
              </div>
            </div>
            <div className="max-h-44 overflow-y-auto px-2 py-2 space-y-0.5 bg-slate-50/80">
              {filteredFlat.map((a, i) => {
                const key = articleViewKey(a) || String(i)
                const active = i === articleIndex
                const viewed = viewedIds.has(articleViewKey(a))
                const wc = articleWordCount(a)
                const titleOne = articleDisplayTitle(a)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setArticleIndex(i)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                      active ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-white/80'
                    }`}
                  >
                    <span className={`shrink-0 tabular-nums font-bold ${active ? 'text-brand' : 'text-slate-500'}`}>
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-slate-800" title={titleOne}>
                      {titleOne}
                    </span>
                    <span className="shrink-0 tabular-nums text-slate-500">{wc}w</span>
                    <span className="shrink-0 text-slate-400 hidden sm:inline">{formatArticleCreatedIst(a)}</span>
                    {viewed ? (
                      <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        Viewed
                      </span>
                    ) : (
                      <span className="shrink-0 w-12 hidden sm:inline" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <ArticleCard
            key={currentArticle.id || articleIndex}
            article={currentArticle}
            reporterName={currentArticle._reporterName || currentArticle.reporter?.name}
            districtName={currentArticle._districtName}
            priorityBucket={currentArticle._priorityBucket || currentArticle.priorityBucket}
            viewed={currentViewed}
            wordCount={currentWordCount}
            createdLabel={formatArticleCreatedIst(currentArticle)}
            onViewed={() => markArticleViewed(currentArticle)}
          />
        </section>
      ) : null}
    </div>
  )
}
