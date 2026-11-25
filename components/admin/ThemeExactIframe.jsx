'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ThemeChromePreview } from './ThemeDualPreview'

/**
 * Real kaburlu-Webnews page in iframe — admin postMessage tho unsaved theme apply (dev only).
 */
export default function ThemeExactIframe({ tenantSlug, previewPayload, fallbackProps }) {
  const iframeRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [iframeError, setIframeError] = useState(false)
  const src = tenantSlug
    ? `http://127.0.0.1:3002/${encodeURIComponent(tenantSlug)}`
    : null

  const post = useCallback(() => {
    if (!ready || !iframeRef.current?.contentWindow || !previewPayload) return
    iframeRef.current.contentWindow.postMessage(
      { type: 'kaburlu-theme-preview', ...previewPayload },
      'http://127.0.0.1:3002',
    )
  }, [ready, previewPayload])

  useEffect(() => {
    const onMsg = (ev) => {
      if (ev.data?.type === 'kaburlu-theme-preview-ready') setReady(true)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  useEffect(() => {
    post()
  }, [post])

  if (!tenantSlug || !src) {
    return (
      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
        Tenant slug లేదు — exact preview కాదు. Webnews <code className="font-mono">:3002</code> run చేయండి.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-slate-600">
        <b className="text-slate-900">Exact V2 theme</b> — నిజ Webnews CSS (gradient cards కాదు). Settings మార్చిన వెంటనే iframe update.{' '}
        <code className="font-mono text-[10px]">npm run dev:local</code> @ :3002 required.
      </p>
      {iframeError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          :3002 connect అయ్యలేదు. Webnews start చేయండి.
          <div className="mt-3 h-[200px]">
            <ThemeChromePreview {...fallbackProps} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_160px] gap-3">
          <div className="rounded-xl border-2 border-slate-300 overflow-hidden bg-slate-100 shadow-inner">
            <div className="bg-slate-800 text-white text-[10px] px-2 py-1 flex justify-between">
              <span>🖥 Exact — Webnews V2</span>
              <a href={src} target="_blank" rel="noreferrer" className="underline opacity-90">
                new tab
              </a>
            </div>
            <iframe
              ref={iframeRef}
              title="Webnews exact theme preview"
              src={src}
              className="w-full bg-white"
              style={{ height: 420, border: 0 }}
              onError={() => setIframeError(true)}
            />
          </div>
          <div className="hidden xl:block">
            <p className="text-[10px] font-semibold text-slate-500 mb-1">📱 Mobile (quick)</p>
            <div className="mx-auto w-[150px] h-[280px] rounded-[18px] border-[3px] border-slate-800 p-[2px] bg-slate-800">
              <div className="w-full h-full rounded-[14px] overflow-hidden">
                <ThemeChromePreview {...fallbackProps} compact />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}