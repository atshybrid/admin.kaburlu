/**
 * Daily Newspaper News — tenant feed browser with copy-to-clipboard for desk
 */

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
  flattenGroupedArticles,
  formatArticleAfterDatelineRich,
  formatBodyPlain,
  formatDatelineCopy,
  formatFullArticleRich,
  formatHighlightsHtml,
  formatHighlightLine,
  formatHighlightsCopy,
  formatImageBlockCopy,
  formatImageCaptionCopy,
  formatImageUrlCopy,
  todayIstDateString,
} from '../../../lib/newspaperFeed/articleCopy'
import { getAuthUser } from '../../../utils/auth'
import { isSuperAdmin } from '../../../utils/roleUtils'
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
  const dateline = formatDatelineCopy(article)
  const paragraphs = articleBodyParagraphs(article)
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
          {paragraphs.length > 0 ? (
            <CopyButton label="article" getRich={articleRich} size="xs" />
          ) : null}
        </div>

        {highlights.length > 0 ? (
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase mb-1">Bullet points</p>
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

        {(dateline || paragraphs.length > 0) ? (
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase mb-1">Dateline &amp; article</p>
            <div className="text-sm text-slate-800 leading-relaxed">
              {dateline ? (
                <p className="font-medium text-slate-900">{dateline}</p>
              ) : null}
              {paragraphs.map((para, i) => (
                <p
                  key={i}
                  className={`font-bold text-slate-800 ${
                    i === 0 && dateline ? 'mt-1' : i > 0 ? 'mt-2' : ''
                  }`}
                >
                  {para}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  )
}

export default function DailyNewspaperNewsView() {
  const authUser = useMemo(() => (typeof window !== 'undefined' ? getAuthUser() : null), [])
  const canPickTenant = isSuperAdmin(authUser)

  const [tenants, setTenants] = useState([])
  const [tenantsLoading, setTenantsLoading] = useState(true)
  const [tenantId, setTenantId] = useState('')
  const [businessDate, setBusinessDate] = useState(todayIstDateString())
  const [timeRule, setTimeRule] = useState('auto')
  const [districtId, setDistrictId] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [feed, setFeed] = useState(null)
  const [filterOptions, setFilterOptions] = useState({ districts: [], states: [] })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setTenantsLoading(true)
      try {
        const raw = await tenantsApi.list(true)
        const list = unwrapTenants(raw)
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
        view: 'both',
        includeFilterOptions: 'true',
        limit: '500',
      }
      if (districtId) params.districtId = districtId

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
      })
    } catch (err) {
      toast.error(err.message || 'Failed to load newspaper news')
      setFeed(null)
    } finally {
      setLoading(false)
    }
  }, [tenantId, businessDate, timeRule, districtId])

  useEffect(() => {
    if (tenantId && !tenantsLoading) {
      loadFeed()
    }
  }, [tenantId, tenantsLoading]) // eslint-disable-line react-hooks/exhaustive-deps -- initial load only

  const flatArticles = useMemo(() => {
    if (!feed) return []
    if (Array.isArray(feed.articles) && feed.articles.length) {
      return feed.articles.map((a) => ({ ...a }))
    }
    return flattenGroupedArticles(feed.districts)
  }, [feed])

  const filteredFlat = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return flatArticles
    return flatArticles.filter((a) => {
      const hay = [
        articleDisplayTitle(a),
        formatDatelineCopy(a),
        formatBodyPlain(a),
        ...(articleHighlightsList(a)),
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [flatArticles, search])

  const tenantName = feed?.tenant?.name || tenants.find((t) => t.id === tenantId)?.name || '—'
  const summary = feed?.summary
  const timeWindow = feed?.timeWindow

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-orange-50/30 to-amber-50/50 p-5 sm:p-6 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Get Daily Newspaper News</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Tenant-wise published news for today or a selected date (IST). Filter by district, copy title,
          bullet points, dateline, and full article for print desk.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField label="Newspaper (tenant)" required>
            {tenantsLoading ? (
              <Spinner size="sm" />
            ) : (
              <Select
                value={tenantId}
                disabled={!canPickTenant && Boolean(authUser?.tenantId)}
                onChange={(e) => setTenantId(e.target.value)}
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
              onChange={(e) => setBusinessDate(e.target.value)}
            />
          </FormField>
          <FormField label="Time rule">
            <Select value={timeRule} onChange={(e) => setTimeRule(e.target.value)}>
              <option value="auto">Auto (today / ePaper by clock)</option>
              <option value="today">Today 00:00–23:30 IST</option>
              <option value="epaper">ePaper window (7pm–4am)</option>
            </Select>
          </FormField>
          <FormField label="District filter">
            <Select value={districtId} onChange={(e) => setDistrictId(e.target.value)}>
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
            }}
          >
            Today · all districts
          </Button>
        </div>

        {timeWindow ? (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              {tenantName}
            </span>
            <span className="rounded-full bg-brand/10 px-3 py-1 text-brand-dark font-medium">
              {timeWindow.businessDate} · {timeWindow.effectiveRule}
            </span>
            {summary ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
                {summary.articleCount ?? filteredFlat.length} articles · {summary.districtCount ?? '—'} districts
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

      {feed?.districts?.length && !search.trim() ? (
        <div className="space-y-6">
          {feed.districts.map((district) => (
            <div key={district.districtId || district.districtName} className="space-y-4">
              <div className="flex items-center justify-between gap-2 sticky top-0 z-10 bg-slate-50/95 backdrop-blur py-2 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">
                  {district.districtName || 'District'}
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    ({district.totalArticles ?? 0} articles)
                  </span>
                </h2>
              </div>
              {(district.reporters || []).map((reporter) => (
                <div key={reporter.reporterId || reporter.name} className="space-y-3 pl-2 sm:pl-4 border-l-2 border-slate-200">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="font-semibold text-slate-800">{reporter.name || 'Reporter'}</h3>
                    {reporter.designation?.nativeName || reporter.designation?.name ? (
                      <span className="text-xs text-slate-500">
                        {reporter.designation.nativeName || reporter.designation.name}
                      </span>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {['p1', 'p2', 'p3', 'others'].map((bucket) => {
                      const items = reporter.priorityWise?.[bucket] || []
                      if (!items.length) return null
                      return items.map((article) => (
                        <ArticleCard
                          key={article.id}
                          article={article}
                          reporterName={reporter.name}
                          districtName={district.districtName}
                          priorityBucket={bucket}
                        />
                      ))
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {search.trim() && filteredFlat.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Search results ({filteredFlat.length})</h2>
          {filteredFlat.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              reporterName={article._reporterName || article.reporter?.name}
              districtName={article._districtName}
              priorityBucket={article._priorityBucket || article.priorityBucket}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
