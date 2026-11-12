/**
 * Daily Newspaper News — tenant feed browser with copy-to-clipboard for desk
 */

import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { tenantsApi } from '../../../lib/api/tenantApi'
import { newspaperTenantFeedApi } from '../../../lib/api/services/newspaperTenantFeedApi'
import {
  articleBodyParagraphs,
  articleDisplayTitle,
  articleHighlightsList,
  articleMediaImages,
  BULLET_CHAR,
  copyRichClipboard,
  copyToClipboard,
  formatArticleAfterDatelineRich,
  formatArticleBodyFlowOnly,
  formatBodyPlain,
  formatDatelineCopy,
  formatFullArticleRich,
  formatHighlightsHtml,
  formatHighlightLine,
  formatHighlightsCopy,
  formatImageBlockCopy,
  formatImageCaptionCopy,
  formatImageUrlCopy,
  resolveArticleParts,
  todayIstDateString,
} from '../../../lib/newspaperFeed/articleCopy'
import { getAuthUser } from '../../../utils/auth'
import { isSuperAdmin } from '../../../utils/roleUtils'
import { filterActiveTenants } from '../../../lib/tenant/isActiveTenant'
import {
  collectReporterFilterOptions,
  dedupeFeedArticles,
  flattenFeedArticles,
  sortArticlesForDesk,
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

function CopyButton({ label, getText, getRich, size = 'sm' }) {
  const [copied, setCopied] = useState(false)
  const onCopy = async () => {
    try {
      let ok = false
      if (getRich) {
        const { plain, html } = getRich()
        ok = await copyRichClipboard({ plain, html })
      } else {
        const text = typeof getText === 'function' ? getText() : getText
        ok = await copyToClipboard(text)
      }
      if (!ok) {
        toast.error('Nothing to copy')
        return
      }
      setCopied(true)
      toast.success(`${label} copied`)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Copy failed')
    }
  }
  return (
    <button
      type="button"
      onClick={onCopy}
      className={`inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-brand/40 transition-colors ${
        size === 'xs' ? 'px-1.5 py-0.5 text-[11px]' : ''
      }`}
    >
      {copied ? '✓ Copied' : `Copy ${label}`}
    </button>
  )
}

function ArticleCard({ article, reporterName, districtName, priorityBucket }) {
  const title = articleDisplayTitle(article)
  const highlights = articleHighlightsList(article)
  const { datelineTag, bodyParagraphs, newspaperLabel } = resolveArticleParts(article)
  const dateline = datelineTag
  const paragraphs = bodyParagraphs
  const articleBodyOnly = formatArticleBodyFlowOnly(article)
  const articleCopyPreview = formatBodyPlain(article)
  const mediaImages = articleMediaImages(article)
  const articleRich = () => formatArticleAfterDatelineRich(article)
  const fullRich = () => formatFullArticleRich(article)

  return (
    <article
      className={`rounded-xl border border-slate-200 border-l-4 shadow-sm overflow-hidden ${priorityClass(
        priorityBucket || article.priorityBucket,
      )}`}
    >
      <div className="px-4 py-3 border-b border-slate-100 bg-white/80 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">
              {priorityLabel(priorityBucket || article.priorityBucket)}
            </span>
            {article.important?.isBreaking ? (
              <span className="text-[10px] font-bold uppercase text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                Breaking
              </span>
            ) : null}
          </div>
          <h3 className="text-base font-bold text-slate-900 leading-snug">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">
            {[districtName, reporterName, article.reporter?.designation?.nativeName || article.reporter?.designation?.name]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <CopyButton label="all" getRich={fullRich} />
      </div>

      <div className="px-4 py-3 space-y-3 bg-white">
        <div className="flex flex-wrap gap-2">
          <CopyButton label="title" getText={() => title} size="xs" />
          {highlights.length > 0 ? (
            <CopyButton
              label="bullets"
              getText={() => formatHighlightsCopy(article)}
              getRich={() => ({
                plain: formatHighlightsCopy(article),
                html: formatHighlightsHtml(article),
              })}
              size="xs"
            />
          ) : null}
          {dateline ? <CopyButton label="dateline" getText={() => dateline} size="xs" /> : null}
          {paragraphs.length > 0 || dateline ? (
            <CopyButton label="article (board)" getRich={articleRich} size="xs" />
          ) : null}
        </div>

        {highlights.length > 0 ? (
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase mb-1">Bullet points (first in paste)</p>
            <ul className="text-sm text-slate-800 space-y-0.5 list-none pl-0">
              {highlights.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-slate-500 shrink-0">{BULLET_CHAR}</span>
                  <span>{String(line).replace(/^[\s•*\u2022\-–]+/, '').trim()}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {mediaImages.length > 0 ? (
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Photos</p>
            {mediaImages.map((img, index) => (
              <div key={img.url || index} className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt || img.caption || `Photo ${index + 1}`}
                  className="w-full max-h-72 object-contain bg-black/5"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                {img.caption ? (
                  <p className="px-3 py-2 text-sm text-slate-800 border-t border-slate-200 bg-white">
                    {img.caption}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2 px-3 py-2 border-t border-slate-100 bg-white">
                  <CopyButton label="image URL" getText={() => formatImageUrlCopy(img)} size="xs" />
                  {img.caption ? (
                    <CopyButton label="caption" getText={() => formatImageCaptionCopy(img)} size="xs" />
                  ) : null}
                  <CopyButton label="photo block" getText={() => formatImageBlockCopy(img, index)} size="xs" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {(dateline || articleBodyOnly || articleCopyPreview) ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3">
              <p className="text-[11px] font-semibold text-slate-500 uppercase mb-2">
                Paste sample (Copy article / Copy all)
              </p>
              <main className="text-sm text-slate-800 space-y-2 leading-relaxed">
                {highlights.length > 0 ? (
                  <ul className="list-none pl-0 space-y-0.5 font-normal">
                    {highlights.map((line, i) => (
                      <li key={i}>{formatHighlightLine(line)}</li>
                    ))}
                  </ul>
                ) : null}
                {dateline || articleBodyOnly ? (
                  <p className="text-slate-800">
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
            </div>
            {newspaperLabel ? (
              <p className="text-[11px] text-slate-400">Newspaper field in API: {newspaperLabel}</p>
            ) : null}
          </div>
        ) : null}
      </div>
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
    return sortArticlesForDesk(list)
  }, [allFlattened, reporterId, search])

  useEffect(() => {
    setArticleIndex(0)
  }, [filteredFlat.length, tenantId, businessDate, reporterId, contentMode, districtId, search])

  useEffect(() => {
    if (articleIndex >= filteredFlat.length) {
      setArticleIndex(Math.max(0, filteredFlat.length - 1))
    }
  }, [articleIndex, filteredFlat.length])

  const currentArticle = filteredFlat[articleIndex] || null

  const goPrev = () => setArticleIndex((i) => Math.max(0, i - 1))
  const goNext = () => setArticleIndex((i) => Math.min(filteredFlat.length - 1, i + 1))

  const tenantName = feed?.tenant?.name || tenants.find((t) => t.id === tenantId)?.name || '—'
  const summary = feed?.summary
  const timeWindow = feed?.timeWindow
  const feedPagination = summary?.pagination

  const onContentMode = (id) => {
    setContentMode(id)
    setFeedPage(1)
  }

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
              setFeedPage(1)
            }}
          >
            Reset filters
          </Button>
        </div>

        {timeWindow ? (
          <div className="flex flex-wrap gap-2 text-xs items-center">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              {tenantName}
            </span>
            <span className="rounded-full bg-brand/10 px-3 py-1 text-brand-dark font-medium">
              {timeWindow.businessDate} · {timeWindow.effectiveRule || timeRule}
            </span>
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
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
          No articles for this date / filters.
        </div>
      ) : null}

      {feed && filteredFlat.length > 0 && currentArticle ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sticky top-0 z-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Story navigator</p>
              <p className="text-sm text-slate-800 mt-0.5">
                <span className="font-bold tabular-nums">{articleIndex + 1}</span>
                <span className="text-slate-500"> / {filteredFlat.length}</span>
                {currentArticle._reporterName ? (
                  <span className="text-slate-600"> · {currentArticle._reporterName}</span>
                ) : null}
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

          <ArticleCard
            key={currentArticle.id}
            article={currentArticle}
            reporterName={currentArticle._reporterName || currentArticle.reporter?.name}
            districtName={currentArticle._districtName}
            priorityBucket={currentArticle._priorityBucket || currentArticle.priorityBucket}
          />
        </section>
      ) : null}
    </div>
  )
}
