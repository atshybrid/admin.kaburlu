'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { webnewsLocalPreviewUrl } from '../../lib/newsThemeCatalog'
import { getPlacementById, parsePlacementSize } from '../../lib/webnewsAdPlacements'

const PREVIEW_ORIGINS = ['http://127.0.0.1:3002', 'http://localhost:3002']

/**
 * Live Webnews homepage in iframe — highlights selected ad slot + optional draft image.
 */
export default function WebnewsAdsLivePreview({ tenantSlug, highlightPosition, draft }) {
  const iframeRef = useRef(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [postError, setPostError] = useState(false)
  const src = tenantSlug ? webnewsLocalPreviewUrl(tenantSlug).replace('localhost', '127.0.0.1') : null

  const post = useCallback(() => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    const payload = {
      type: 'kaburlu-ads-preview',
      highlightPosition,
      draft: draft?.imageUrl
        ? { placement: highlightPosition, imageUrl: draft.imageUrl, title: draft.title }
        : undefined,
    }
    let ok = false
    for (const origin of PREVIEW_ORIGINS) {
      try {
        win.postMessage(payload, origin)
        ok = true
      } catch {
        /* ignore */
      }
    }
    setPostError(!ok)
  }, [highlightPosition, draft])

  useEffect(() => {
    const onMsg = (ev) => {
      if (ev.data?.type === 'kaburlu-theme-preview-ready' || ev.data?.type === 'kaburlu-ads-preview-ready') {
        setIframeLoaded(true)
        post()
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [post])

  useEffect(() => {
    if (!iframeLoaded) return
    post()
  }, [iframeLoaded, post])

  const meta = getPlacementById(highlightPosition)
  const size =
    highlightPosition === 'popup'
      ? parsePlacementSize('600×800') || { w: 600, h: 800 }
      : parsePlacementSize(meta?.desktop)

  if (!tenantSlug) {
    return (
      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
        Tenant slug లేదు — preview కాదు.
      </p>
    )
  }

  return (
    <div className="rounded-xl border-2 border-slate-300 overflow-hidden bg-slate-100 shadow-inner">
      <div className="bg-slate-800 text-white text-xs px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong>Live site preview</strong> — నిజ theme + ad slots (Webnews :3002)
        </span>
        <a href={webnewsLocalPreviewUrl(tenantSlug)} target="_blank" rel="noreferrer" className="underline opacity-90">
          Open site
        </a>
      </div>

      {draft?.imageUrl && (
        <div className="bg-white border-b border-slate-200 p-3">
          <p className="text-[11px] font-semibold text-slate-700 mb-2">
            Banner preview ({meta?.nameTe || highlightPosition}
            {size ? ` · ${size.w}×${size.h}` : ''})
          </p>
          <div
            className="mx-auto border border-dashed border-amber-400 bg-slate-50 flex items-center justify-center overflow-hidden rounded-lg"
            style={{
              maxWidth: '100%',
              width: size?.w ? Math.min(size.w, 728) : '100%',
              aspectRatio: size ? `${size.w} / ${size.h}` : '728 / 90',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={draft.imageUrl} alt="" className="max-w-full max-h-full object-contain" />
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-600 bg-slate-50 px-3 py-1.5 border-b border-slate-200">
        Orange highlight = selected slot on real homepage. Webnews dev <code className="font-mono">:3002</code> run ఉండాలి.
        {postError && ' Iframe connect చూడండి.'}
      </p>
      <iframe
        ref={iframeRef}
        title="Webnews ads preview"
        src={src}
        className="w-full bg-white"
        style={{ height: 420, border: 0 }}
        onLoad={() => {
          setIframeLoaded(true)
          setTimeout(post, 300)
          setTimeout(post, 1200)
        }}
      />
    </div>
  )
}