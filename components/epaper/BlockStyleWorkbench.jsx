import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getToken } from '../../utils/auth'
import { articleToBlockProps, normalizeHighlightLines } from '../../lib/epaper/articleToBlockProps'
import { planBlock08LayoutZones } from '../../lib/epaper/block08ColumnModel'
import { planBlock06LayoutZones } from '../../lib/epaper/block06ColumnModel'
import { planBlock12LayoutZones } from '../../lib/epaper/block12ColumnModel'
import {
  BLOCK_SAMPLES,
  BLOCK_ORDER,
  BLOCK_COLORS,
  getBlockColLabel,
} from '../../lib/epaper/blockSamples'
import {
  BLOCK_03A_BAND,
  DECIDE_ARTICLE_BLOCK_RULES,
  DESIGN_SUGGEST_TIERS,
  FOUR_EIGHT_LEFT_RAIL,
  BLOCK_04A_STYLE_RULES,
  BLOCK_08A_STYLE_RULES,
} from '../../lib/epaper/blockRulesDoc'
import { BLOCK_04A_RULES_VERSION, BLOCK_04A_LOCKED } from '../../lib/epaper/block04LockedRules'
import { BLOCK_03A_IDEAL_WORDS_MIN, BLOCK_03A_IDEAL_WORDS_MAX } from '../../lib/rules/articleRules'
import {
  fetchNewspaperArticleQueue,
  getTenantIdFromAuth,
  annotateQueueForBlock,
} from '../../lib/epaper/blockStyleArticleQueue'
import {
  EPAPER_TENANT_STORAGE_KEY,
  getStoredTenantId,
  setStoredTenantId,
  getTenantDisplayName,
} from '../../lib/epaper/epaperTenantStorage'
import {
  getBlockFitRule,
  partitionArticlesForBlock,
  formatArticleOptionLabel,
} from '../../lib/epaper/blockStyleFit'
import { analyzeColonTitle } from '../../lib/epaper/block04TitleSmart'

/** Same default as lib/server/epaperDemo.js — set NEXT_PUBLIC_EPAPER_DEMO_ARTICLE_ID to override */
const DEFAULT_NEWSPAPER_ARTICLE_ID =
  process.env.NEXT_PUBLIC_EPAPER_DEMO_ARTICLE_ID || 'cmlwdfxlz01otbznkrik7df6a'

const BlockFabricPageLab = dynamic(() => import('./BlockFabricPageLab'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
      Loading layout lab…
    </div>
  ),
})

const TABS = [
  { id: 'preview', label: 'Block preview' },
  { id: 'rules', label: 'Rules & tiers' },
  { id: 'lab', label: 'Page lab (Fabric)' },
]

function defaultZoomForCode(code) {
  if (code === 'BLOCK-12A') return 0.32
  if (code === 'BLOCK-06A' || code === 'BLOCK-08A') return 0.42
  return 0.52
}

export default function BlockStyleWorkbench() {
  const [tab, setTab] = useState('preview')
  const [active, setActive] = useState('BLOCK-04A')
  const [zoom, setZoom] = useState(() => defaultZoomForCode('BLOCK-04A'))
  const [articleIdInput, setArticleIdInput] = useState(DEFAULT_NEWSPAPER_ARTICLE_ID)
  const [apiProps, setApiProps] = useState(null)
  const [articleStatus, setArticleStatus] = useState('idle')
  const [articleErr, setArticleErr] = useState('')
  const [loadTick, setLoadTick] = useState(0)
  const [articleQueue, setArticleQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [queueStatus, setQueueStatus] = useState('idle')
  const [queueErr, setQueueErr] = useState('')
  const [onlyShowFits, setOnlyShowFits] = useState(true)
  const [tenantList, setTenantList] = useState([])
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [tenantsLoading, setTenantsLoading] = useState(false)
  const articleIdRef = useRef(articleIdInput)
  articleIdRef.current = articleIdInput

  const activeFitRule = useMemo(() => getBlockFitRule(active), [active])

  const annotatedQueue = useMemo(
    () => annotateQueueForBlock(articleQueue, active),
    [articleQueue, active]
  )

  const { fitting: fittingArticles, other: otherArticles } = useMemo(
    () => partitionArticlesForBlock(annotatedQueue, active, { onlyFits: false }),
    [annotatedQueue, active]
  )

  const dropdownArticles = useMemo(
    () => (onlyShowFits ? fittingArticles : [...fittingArticles, ...otherArticles]),
    [onlyShowFits, fittingArticles, otherArticles]
  )

  const selectArticleById = useCallback(
    (id, list = annotatedQueue) => {
      const trimmed = String(id || '').trim()
      if (!trimmed) return
      setArticleIdInput(trimmed)
      const idx = list.findIndex((a) => a.id === trimmed)
      if (idx >= 0) setQueueIndex(idx)
      setLoadTick((n) => n + 1)
    },
    [annotatedQueue]
  )

  const loadArticleQueue = useCallback(async () => {
    setQueueStatus('loading')
    setQueueErr('')
    const tokenData = getToken()
    if (!tokenData?.token) {
      setQueueStatus('error')
      setQueueErr('Login required to load article list.')
      return
    }
    const tenantId = getTenantIdFromAuth(tokenData, selectedTenantId)
    if (!tenantId) {
      setQueueStatus('error')
      setQueueErr('Pick a tenant below (or set NEXT_PUBLIC_DEFAULT_TENANT_ID in .env.local).')
      return
    }
    try {
      const { items } = await fetchNewspaperArticleQueue({
        token: tokenData.token,
        tenantId,
      })
      setArticleQueue(items)
      setQueueStatus(items.length ? 'ok' : 'empty')
    } catch (e) {
      setQueueStatus('error')
      setQueueErr(e?.message || 'Failed to load articles')
      setArticleQueue([])
    }
  }, [selectedTenantId])

  useEffect(() => {
    let cancelled = false

    async function loadTenants() {
      setTenantsLoading(true)
      const tokenData = getToken()
      if (!tokenData?.token) {
        if (!cancelled) setTenantsLoading(false)
        return
      }
      try {
        const res = await fetch('/api/admin/proxy/tenants?full=true', {
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${tokenData.token}`,
          },
        })
        const text = await res.text()
        let json = null
        try {
          json = text ? JSON.parse(text) : null
        } catch {
          json = null
        }
        const items = Array.isArray(json) ? json : json?.data || json?.items || []
        const list = Array.isArray(items) ? items : []
        if (cancelled) return

        setTenantList(list)
        const stored = getStoredTenantId()
        const fromAuth = getTenantIdFromAuth(tokenData)
        const fallback = list[0]?.id || ''
        const initial =
          (stored && list.some((t) => t.id === stored) && stored) ||
          (fromAuth && list.some((t) => t.id === fromAuth) && fromAuth) ||
          fallback

        setSelectedTenantId((prev) => {
          if (prev && list.some((t) => t.id === prev)) return prev
          return initial
        })
      } catch {
        if (!cancelled) setTenantList([])
      } finally {
        if (!cancelled) setTenantsLoading(false)
      }
    }

    loadTenants()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedTenantId) return
    setStoredTenantId(selectedTenantId)
  }, [selectedTenantId])

  const goToQueueIndex = useCallback(
    (delta) => {
      const list = dropdownArticles.length ? dropdownArticles : annotatedQueue
      if (!list.length) return
      const currentId = articleIdRef.current
      let i = list.findIndex((a) => a.id === currentId)
      if (i < 0) i = 0
      i = Math.max(0, Math.min(list.length - 1, i + delta))
      selectArticleById(list[i].id)
    },
    [annotatedQueue, dropdownArticles, selectArticleById]
  )

  const loadNewspaperArticle = useCallback(async () => {
    setArticleStatus('loading')
    setArticleErr('')
    setApiProps(null)
    const tokenData = getToken()
    if (!tokenData?.token) {
      setArticleStatus('error')
      setArticleErr('Login required. Sign in to admin, then reload — data loads via /api/admin/proxy → your backend (e.g. app.kaburlumedia.com).')
      return
    }
    const id = String(articleIdRef.current || '').trim() || DEFAULT_NEWSPAPER_ARTICLE_ID
    try {
      const res = await fetch(`/api/admin/proxy/articles/newspaper/${encodeURIComponent(id)}`, {
        headers: {
          Authorization: `Bearer ${tokenData.token}`,
          Accept: 'application/json',
        },
      })
      const text = await res.text()
      if (!res.ok) {
        setArticleStatus('error')
        let msg = text || `HTTP ${res.status}`
        if (/<html/i.test(msg)) {
          if (/503/i.test(msg)) msg = 'Backend unavailable (503). Try again or pick another article.'
          else if (/401|403/i.test(msg)) msg = 'Not authorized to load this article.'
          else msg = `Server error (${res.status}). Try Reload or another article.`
        }
        setArticleErr(msg)
        return
      }
      const data = JSON.parse(text)
      setApiProps(articleToBlockProps(data))
      setArticleStatus('ok')
    } catch (e) {
      setArticleStatus('error')
      setArticleErr(e?.message || 'Request failed')
    }
  }, [])

  useEffect(() => {
    if (tab !== 'preview') return
    loadNewspaperArticle()
  }, [tab, loadTick, loadNewspaperArticle])

  useEffect(() => {
    if (tab !== 'preview') return
    if (!selectedTenantId) return
    loadArticleQueue().catch(() => {
      /* errors handled inside loadArticleQueue */
    })
  }, [tab, selectedTenantId, loadArticleQueue])

  const sample = BLOCK_SAMPLES[active]
  const BlockComp = sample.component
  const previewProps = (() => {
    const base = { ...sample.props, blockCode: active }
    if (articleStatus !== 'ok' || !apiProps) return base
    return {
      ...base,
      ...apiProps,
      blockCode: active,
      highlights: normalizeHighlightLines(apiProps.highlights),
      images: apiProps.images?.length ? apiProps.images : [],
      paragraphs: apiProps.paragraphs?.length ? apiProps.paragraphs : base.paragraphs || [],
    }
  })()

  const loadedContentSignals = useMemo(() => {
    if (articleStatus !== 'ok' || !apiProps) return null
    const pointCount = apiProps.highlights?.length || 0
    const imageCount = apiProps.images?.length || 0
    return {
      hasPoints: pointCount > 0,
      pointCount,
      imageCount,
      isMultiImage: imageCount >= 2,
      highlightSource: apiProps.highlightSource || '',
    }
  }, [articleStatus, apiProps])

  const selectedQueueItem = useMemo(
    () => annotatedQueue.find((a) => a.id === articleIdInput) || null,
    [annotatedQueue, articleIdInput]
  )

  const tabBtn = (id) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition ${
      tab === id ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
    }`

  const bandNote = `BLOCK-03A word band (code): ${BLOCK_03A_IDEAL_WORDS_MIN}–${BLOCK_03A_IDEAL_WORDS_MAX} words. Doc mirror: ${BLOCK_03A_BAND.min}–${BLOCK_03A_BAND.max}.`

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Epaper Block style</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Correct React block previews, assignment rules, and a Fabric.js page lab for drag-and-drop flow (Quark / InDesign–style frames — not a full replacement for print export yet).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/epaper/block-templates"
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-800 hover:bg-indigo-100"
            >
              Template studio →
            </Link>
            <Link
              href="/admin/epaper/block-studio"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Block studio →
            </Link>
            <Link
              href="/admin/epaper/design"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              ePaper Design →
            </Link>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-wrap gap-2 border-t border-slate-100 px-4 py-3">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={tabBtn(t.id)} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-6">
        {tab === 'preview' && (
          <div className="flex flex-col gap-4 lg:flex-row">
            <nav className="w-full shrink-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:w-56">
              <div className="mb-2 text-xs font-bold uppercase text-slate-500">Blocks</div>
              <ul className="space-y-1">
                {BLOCK_ORDER.map((code) => {
                  const s = BLOCK_SAMPLES[code]
                  const on = active === code
                  return (
                    <li key={code}>
                      <button
                        type="button"
                        onClick={() => {
                          setActive(code)
                          setZoom(defaultZoomForCode(code))
                        }}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${
                          on ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: BLOCK_COLORS[code] }}
                        />
                        <span className="font-mono text-xs font-semibold">{code}</span>
                      </button>
                      <div className={`pl-8 text-[11px] leading-snug ${on ? 'text-slate-300' : 'text-slate-500'}`}>
                        {s.label}
                      </div>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <label className="text-xs font-semibold text-slate-600">Zoom {Math.round(zoom * 100)}%</label>
                <input
                  type="range"
                  min={0.2}
                  max={1}
                  step={0.02}
                  className="mt-1 w-full"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  style={{ accentColor: BLOCK_COLORS[active] }}
                />
              </div>
            </nav>

            <div className="min-w-0 flex-1 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Live article (tenant API)</div>
                <p className="mt-1 text-xs text-slate-600">
                  Pick a <strong>tenant</strong>, then choose from all published articles (word + char counts). Filter
                  shows stories that fit <strong>{active}</strong> ({activeFitRule.wordsMin}–{activeFitRule.wordsMax}{' '}
                  words, ≤{activeFitRule.charsMax} chars, ~{activeFitRule.heightIn}in). Same tenant as Design Studio (
                  <code className="text-[10px]">{EPAPER_TENANT_STORAGE_KEY}</code>).
                </p>
                <label className="mt-3 block text-xs font-semibold text-slate-700">
                  Tenant
                  <select
                    value={selectedTenantId}
                    onChange={(e) => {
                      setSelectedTenantId(e.target.value)
                      setArticleQueue([])
                    }}
                    disabled={tenantsLoading || !tenantList.length}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    {tenantsLoading ? (
                      <option value="">Loading tenants…</option>
                    ) : !tenantList.length ? (
                      <option value="">No tenants — check login</option>
                    ) : (
                      tenantList.map((t) => (
                        <option key={t.id} value={t.id}>
                          {getTenantDisplayName(t)}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                {selectedTenantId && queueStatus === 'ok' ? (
                  <p className="mt-1 text-xs text-slate-500">
                    {articleQueue.length} published article{articleQueue.length === 1 ? '' : 's'} for{' '}
                    {getTenantDisplayName(tenantList.find((t) => t.id === selectedTenantId)) || 'tenant'}
                  </p>
                ) : null}
                <label className="mt-2 flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={onlyShowFits}
                    onChange={(e) => setOnlyShowFits(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Only articles that fit {active} (word / char band)
                </label>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToQueueIndex(-1)}
                    disabled={!dropdownArticles.length || articleStatus === 'loading'}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => goToQueueIndex(1)}
                    disabled={!dropdownArticles.length || articleStatus === 'loading'}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next →
                  </button>
                  <button
                    type="button"
                    onClick={loadArticleQueue}
                    disabled={queueStatus === 'loading'}
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-100 disabled:opacity-50"
                  >
                    {queueStatus === 'loading' ? 'Loading list…' : 'Refresh list'}
                  </button>
                  {dropdownArticles.length > 0 ? (
                    <span className="text-xs font-medium text-slate-600">
                      {fittingArticles.length} fit · {dropdownArticles.length} shown
                    </span>
                  ) : null}
                </div>
                {queueStatus === 'error' ? (
                  <p className="mt-2 text-xs text-amber-800 whitespace-pre-wrap">{queueErr}</p>
                ) : null}
                {queueStatus === 'empty' ? (
                  <p className="mt-2 text-xs text-amber-800">No articles in list — click Refresh list.</p>
                ) : null}
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <label className="min-w-0 flex-1 text-xs font-semibold text-slate-700">
                    Article
                    <select
                      value={articleIdInput}
                      onChange={(e) => selectArticleById(e.target.value)}
                      disabled={!dropdownArticles.length || articleStatus === 'loading'}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      {!dropdownArticles.length ? (
                        <option value="">No articles — refresh list</option>
                      ) : (
                        <>
                          {fittingArticles.length > 0 ? (
                            <optgroup label={`Fits ${active} (${fittingArticles.length})`}>
                              {fittingArticles.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {formatArticleOptionLabel({ ...a, fitsActive: true })}
                                </option>
                              ))}
                            </optgroup>
                          ) : null}
                          {!onlyShowFits && otherArticles.length > 0 ? (
                            <optgroup label={`Other (${otherArticles.length})`}>
                              {otherArticles.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {formatArticleOptionLabel({ ...a, fitsActive: false })}
                                </option>
                              ))}
                            </optgroup>
                          ) : null}
                          {onlyShowFits && fittingArticles.length === 0 ? (
                            <option value="">No fit-band articles — uncheck filter</option>
                          ) : null}
                        </>
                      )}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => setLoadTick((n) => n + 1)}
                    disabled={articleStatus === 'loading' || !articleIdInput}
                    className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {articleStatus === 'loading' ? 'Loading…' : 'Reload'}
                  </button>
                </div>
                {selectedQueueItem ? (
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <p>
                      <span
                        className={
                          selectedQueueItem.fitsActive
                            ? 'font-medium text-emerald-700'
                            : 'text-amber-800'
                        }
                      >
                        {selectedQueueItem.fitsActive ? 'Fits' : 'May overflow'} {active}
                      </span>
                      {' · '}
                      {selectedQueueItem.wordCount} words · {selectedQueueItem.charCount} chars
                      {selectedQueueItem.suggestedBlock &&
                      selectedQueueItem.suggestedBlock !== active ? (
                        <span className="text-slate-500">
                          {' '}
                          · auto-suggest {selectedQueueItem.suggestedBlock} (length only — preview still uses{' '}
                          {active})
                        </span>
                      ) : null}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className={`rounded px-2 py-0.5 font-bold ${
                          (loadedContentSignals?.hasPoints ?? selectedQueueItem.highlightCount > 0)
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        points:{' '}
                        {(loadedContentSignals?.hasPoints ?? selectedQueueItem.highlightCount > 0)
                          ? `true (${loadedContentSignals?.pointCount ?? selectedQueueItem.highlightCount})`
                          : 'false'}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 font-bold ${
                          (loadedContentSignals?.isMultiImage ?? selectedQueueItem.imageCount >= 2)
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        images: {loadedContentSignals?.imageCount ?? selectedQueueItem.imageCount ?? 0}
                        {(loadedContentSignals?.isMultiImage ?? selectedQueueItem.imageCount >= 2)
                          ? ' · multi-images'
                          : ''}
                      </span>
                      {(active === 'BLOCK-06A' || active === 'BLOCK-08A') && loadedContentSignals ? (
                        <span className="rounded bg-violet-100 px-2 py-0.5 font-bold text-violet-800">
                          {active} preview:{' '}
                          {loadedContentSignals.hasPoints
                            ? 'col1 points panel ON'
                            : 'col1 body from top (no points)'}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-snug">
                      Dropdown లో కూడా · points:true/false · multi-images · article select చేసిన తర్వాత ఇక్కడ green/blue chips.
                      Loaded తర్వాత full parse (HTML bullets) — chips update అవుతాయి.
                    </p>
                    {active === 'BLOCK-12A' &&
                    loadedContentSignals?.isMultiImage &&
                    selectedQueueItem?.suggestedBlock === 'BLOCK-08A' ? (
                      <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] font-medium text-amber-900">
                        This article has 2 photos — auto-suggest is{' '}
                        <span className="font-bold">BLOCK-08A</span> (3-col). You are previewing{' '}
                        <span className="font-bold">BLOCK-12A</span> (4-col). Click BLOCK-08A in the left
                        list for the usual 2-image layout, or stay on 12A (img1 col2 · img2 col3).
                      </p>
                    ) : null}
                    {apiProps?.title && analyzeColonTitle(apiProps.title) ? (
                      <p className="text-slate-500">
                        {active === 'BLOCK-08A' ? (
                          <>
                            Title (7.5in): <span className="font-medium">35–58px</span> · few words → <span className="font-medium">1 line, big</span> · long → <span className="font-medium">2–3 lines</span> · never outside rail
                          </>
                        ) : (
                          <>
                            Title rule: <span className="font-medium">:</span> hidden · before {analyzeColonTitle(apiProps.title).beforeCount}w / after{' '}
                            {analyzeColonTitle(apiProps.title).afterCount}w → fewer side colour + max 12% bigger · both lines stay inside 4in
                          </>
                        )}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {articleStatus === 'ok' ? (
                  <p className="mt-2 text-xs font-medium text-emerald-700">
                    Loaded real article into preview props.
                    {active === 'BLOCK-08A' ? (
                      <>
                        {' '}
                        Highlights: {previewProps.highlights?.length || 0} point
                        {(previewProps.highlights?.length || 0) === 1 ? '' : 's'}
                        {(previewProps.highlights?.length || 0) === 0
                          ? ' (none — col1 body from top)'
                          : ` (col1 panel · ${apiProps.highlightSource || 'api'})`}
                        {' · '}
                        {(() => {
                          const z = planBlock08LayoutZones(
                            previewProps.highlights?.length || 0,
                            previewProps.images?.length || 0
                          )
                          return z.col3.image
                            ? 'col3: 2nd image top + body'
                            : 'col3: body from top (no 2nd image)'
                        })()}
                      </>
                    ) : null}
                    {active === 'BLOCK-06A' ? (
                      <>
                        {' '}
                        Highlights: {previewProps.highlights?.length || 0} point
                        {(previewProps.highlights?.length || 0) === 1 ? '' : 's'}
                        {(previewProps.highlights?.length || 0) === 0
                          ? ' (none — col1 body from top)'
                          : ` (col1 panel · ${apiProps.highlightSource || 'api'})`}
                        {' · '}
                        {(() => {
                          const z = planBlock06LayoutZones(
                            previewProps.highlights?.length || 0,
                            previewProps.images?.length || 0
                          )
                          return z.col1.image
                            ? 'col1: 2nd image + col2: primary'
                            : z.col2.image
                              ? 'col2: image top + body'
                              : 'text only'
                        })()}
                      </>
                    ) : null}
                    {active === 'BLOCK-12A' ? (
                      <>
                        {' '}
                        Highlights: {previewProps.highlights?.length || 0} · images:{' '}
                        {previewProps.images?.length || 0}/6 max
                        {' · '}
                        {(() => {
                          const n = previewProps.images?.length || 0
                          const z = planBlock12LayoutZones(
                            previewProps.highlights?.length || 0,
                            n
                          )
                          if (n === 2) {
                            return 'col2: img1 top · col3: img2 top · col1+col4: threaded body'
                          }
                          return `col2: img1+2 below · col3: img3 · col4: img4${z.col4.stackBelow ? '+5+6' : ''}`
                        })()}
                      </>
                    ) : null}
                  </p>
                ) : null}
                {articleStatus === 'error' ? (
                  <p className="mt-2 text-xs text-red-700 whitespace-pre-wrap">{articleErr}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <span
                  className="rounded-md px-2 py-1 text-xs font-bold text-white"
                  style={{ background: BLOCK_COLORS[active] }}
                >
                  {active}
                </span>
                <span className="text-sm font-semibold text-slate-800">{sample.label}</span>
                <span className="text-xs text-slate-500">· {sample.nativeW}px native</span>
                <span className="text-xs text-slate-500">· {getBlockColLabel(active)}</span>
              </div>
              <p className="text-sm text-slate-600">{sample.description}</p>
              <div className="overflow-auto rounded-xl border border-slate-200 bg-slate-200/60 p-6 shadow-inner">
                <div
                  className="mx-auto w-full"
                  style={{
                    maxWidth: sample.nativeW ? `${sample.nativeW}px` : '100%',
                  }}
                >
                  <div
                    className="inline-block w-full max-w-full bg-[#fffef9] shadow-lg"
                    style={{
                      transformOrigin: 'top center',
                      transform: `scale(${zoom})`,
                    }}
                  >
                    <BlockComp
                      key={
                        active === 'BLOCK-08A' || active === 'BLOCK-12A'
                          ? `${active}-${articleIdInput}-${(apiProps?.title || '').slice(0, 40)}`
                          : active
                      }
                      {...previewProps}
                      showColumnDebug={active === 'BLOCK-08A' || active === 'BLOCK-12A'}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'rules' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">decideArticleBlock()</h2>
              <p className="mt-1 text-xs text-slate-500">lib/rules/articleRules.ts — first matching row wins.</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {DECIDE_ARTICLE_BLOCK_RULES.map((row) => (
                  <li key={row.block} className="flex gap-2 border-b border-slate-100 pb-2">
                    <code className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono">{row.block}</code>
                    <span>{row.condition}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-lg p-3">{bandNote}</p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Design Studio suggestBlock()</h2>
              <p className="mt-1 text-xs text-slate-500">pages/admin/epaper/design.js — word + image tiers.</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                {DESIGN_SUGGEST_TIERS.map((row) => (
                  <li key={row.tier}>
                    <div className="font-semibold text-slate-900">{row.tier}</div>
                    <div className="text-slate-600">{row.result}</div>
                  </li>
                ))}
              </ul>
            </section>

            {(active === 'BLOCK-08A' || active === 'BLOCK-06A') && (
              <section className="rounded-xl border border-violet-200 bg-violet-50/40 p-5 shadow-sm lg:col-span-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {active} wide story rules
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  <code className="text-[10px]">lib/epaper/wideBlockRules.js</code> · 3 col (08A) · title from BLOCK-04A
                </p>
                {active === 'BLOCK-08A' ? (
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
                    {BLOCK_08A_STYLE_RULES.map((row) => (
                      <li key={row.rule}>
                        <span className="font-semibold text-slate-900">Rule {row.rule}.</span> {row.text}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 text-sm text-slate-700">
                    6-inch · 2 columns. Over BLOCK-04A copy uses this block unless 08A score wins (length, chars, images).
                  </p>
                )}
              </section>
            )}

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">BLOCK-04A Style 1 (layout rules)</h2>
                {BLOCK_04A_LOCKED ? (
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                    LOCKED v{BLOCK_04A_RULES_VERSION}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Source of truth: <code className="text-[10px]">lib/epaper/block04LockedRules.js</code>
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
                {BLOCK_04A_STYLE_RULES.map((row) => (
                  <li key={row.rule}>
                    <span className="font-semibold text-slate-900">Rule {row.rule}.</span> {row.text}
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-bold text-slate-900">4+8 layout — left rail (assignFourEightBlock)</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-3 text-sm text-slate-700">
                {FOUR_EIGHT_LEFT_RAIL.map((row) => (
                  <li key={row.block} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <code className="text-xs font-mono font-bold">{row.block}</code>
                    <div className="mt-1 text-xs text-slate-600">{row.condition}</div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {tab === 'lab' && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Page lab — Fabric.js</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Drag story frames, rule lines, and editable headline text. Use the inspector for fill, stroke, opacity, and
              font size (IText). Next steps toward InDesign parity: snap to grid, master pages, and export to PDF — not
              implemented in this pass.
            </p>
            <div className="mt-6">
              <BlockFabricPageLab />
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
