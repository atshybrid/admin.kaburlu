import { useCallback, useEffect, useMemo, useState } from 'react'
import newsDeskApi, { formatNewsDeskError } from '../../../lib/api/services/newsDeskApi'
import { Button, Spinner, toast } from '../../ui'
import { TELUGU_HEADLINE_CLASS, TELUGU_READER_CLASS } from '../../../lib/newsDesk/teluguTypography'
import NewsDeskPublishPreviewTable from './NewsDeskPublishPreviewTable'

export default function NewsDeskPublishPreview({ jobId, tenants = [], extractionStatus }) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [selectedTenantId, setSelectedTenantId] = useState(tenants[0]?.tenantId || '')

  const liveUrlByTenant = useMemo(() => {
    const map = {}
    ;(tenants || []).forEach((t) => {
      if (t.articleUrl) map[t.tenantId] = t.articleUrl
    })
    return map
  }, [tenants])

  const load = useCallback(async () => {
    if (!jobId) return
    setLoading(true)
    try {
      const res = await newsDeskApi.getPublishPreview(jobId)
      setPreview(res)
      if (!selectedTenantId && res?.tenants?.[0]?.tenantId) {
        setSelectedTenantId(res.tenants[0].tenantId)
      }
    } catch (error) {
      setPreview(null)
      toast.error(formatNewsDeskError(error))
    } finally {
      setLoading(false)
    }
  }, [jobId, selectedTenantId])

  useEffect(() => {
    if (tenants[0]?.tenantId && !selectedTenantId) setSelectedTenantId(tenants[0].tenantId)
  }, [tenants, selectedTenantId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (extractionStatus === 'EXTRACTION_SUCCEEDED') {
      load()
    }
  }, [extractionStatus, load])

  const previewRows = preview?.tenants || []
  const row =
    previewRows.find((t) => t.tenantId === selectedTenantId) || previewRows[0]

  return (
    <section className="rounded-lg border border-slate-200/80 bg-white overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">ప్రకాశన ప్రివ్యూ · Publish preview</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tenant-wise table — ప్రతి సైట్ URL/slug. Row click → full body కింద
          </p>
          {previewRows.length ? (
            <p className="text-[11px] text-slate-500 mt-0.5">
              {previewRows.length} publisher(s) · local DB dry-run (not live until Publish)
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {previewRows.length > 1 ? (
            <select
              className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white"
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              aria-label="Preview tenant"
            >
              {previewRows.map((t) => (
                <option key={t.tenantId} value={t.tenantId}>
                  {t.nativeName || t.tenantId}
                </option>
              ))}
            </select>
          ) : null}
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={load}>
          {loading ? <Spinner size="sm" className="mr-1" /> : null}
          Refresh
          </Button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {loading && !previewRows.length ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : !previewRows.length ? (
          <p className="text-sm text-slate-500">Preview unavailable — check category and snapshot.</p>
        ) : (
          <>
            <div className="rounded-md border border-blue-100 bg-blue-50/80 px-3 py-2.5 text-xs text-blue-950">
              <p className="font-semibold">ఇది ఎలా పని చేస్తుంది · V2 syndication</p>
              <p className="mt-1 text-blue-900/90 leading-relaxed">
                మీరు వ్రాసిన{' '}
                <strong>ఒక intake</strong> (source URL/టెక్స్ట్) + AI facts →{' '}
                <strong>అన్ని publishersకు అదే శీర్షిక &amp; బాడీ</strong>. Prati website కి వేరే source నుంచి వేరే
                వార్త రాయడం <strong>ఇంకా build కాలేదు</strong>. Table లో మారేది: domain, URL, optional tenant hero
                image, slug collision suffix మాత్రమే.
              </p>
              {preview?.copyStrategyNote ? (
                <p className="mt-1 text-[11px] text-blue-800/80">{preview.copyStrategyNote}</p>
              ) : null}
            </div>
            <NewsDeskPublishPreviewTable
              rows={previewRows}
              liveUrlByTenant={liveUrlByTenant}
              selectedTenantId={selectedTenantId}
              onSelect={setSelectedTenantId}
              maxRows={30}
            />
          {!row ? null : (
          <div className="space-y-4 border-t border-slate-100 pt-4">
            {row.slugWarning ? (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                {row.slugWarning}
              </p>
            ) : null}
            <p className="text-[11px] text-slate-500">
              Local dev: URLs → <code className="font-mono">localhost:3002/&lt;tenant-slug&gt;/…</code> (kaburlu-Webnews).
              Production domain links DB నుండి వస్తాయి.
            </p>
            {!preview?.extractionReady ? (
              <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-md px-3 py-2">
                AI extraction ఇంకా పూర్తి కాలేదు — కింద snapshot టెక్స్ట్ మాత్రమే
              </p>
            ) : null}

            <div className="text-xs text-slate-500">
              <span className="font-medium text-slate-700">{row.nativeName}</span>
              {row.domainName ? (
                <>
                  {' · '}
                  <span className="font-mono">{row.domainName}</span>
                </>
              ) : null}
              {row.heroSource ? (
                <>
                  {' · '}
                  <span>Hero: {row.heroSource.replace(/_/g, ' ')}</span>
                </>
              ) : null}
              {row.categoryName ? (
                <>
                  {' · '}
                  <span>{row.categoryName}</span>
                  {row.categorySlug ? <span className="font-mono text-slate-400"> ({row.categorySlug})</span> : null}
                </>
              ) : null}
            </div>

            <p className={`${TELUGU_HEADLINE_CLASS} text-lg text-slate-900`}>{row.headline}</p>
            {row.lead ? <p className={`${TELUGU_READER_CLASS} text-sm text-slate-700`}>{row.lead}</p> : null}

            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Body (web)</h3>
              <div className={`mt-2 space-y-3 ${TELUGU_READER_CLASS} text-sm text-slate-800`}>
                {row.bodyParagraphs?.length ? (
                  row.bodyParagraphs.map((para, i) => <p key={i}>{para}</p>)
                ) : (
                  <p className="text-slate-400">—</p>
                )}
              </div>
            </div>

            {row.imageUrls?.length ? (
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Images at publish ({row.imageUrls.length})
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {row.imageUrls.map((url, i) => (
                    <figure key={url} className="rounded border border-slate-200 overflow-hidden w-20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-20 h-14 object-cover" />
                      <figcaption className="text-[9px] text-center text-slate-500 py-0.5">
                        {i === 0 ? 'Hero' : `#${i + 1}`}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            ) : null}

            <dl className="rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2 text-xs space-y-2">
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-semibold text-slate-500 shrink-0">Slug</dt>
                <dd className="font-mono text-slate-800 break-all">{row.predictedSlug}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-semibold text-slate-500 shrink-0">URL</dt>
                <dd className="min-w-0">
                  {row.predictedUrl ? (
                    <a
                      href={row.predictedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline break-all"
                    >
                      {row.predictedUrl}
                    </a>
                  ) : (
                    <span className="text-amber-800">Domain missing — set tenant primary NEWS domain</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
          )}
          </>
        )}
      </div>
    </section>
  )
}