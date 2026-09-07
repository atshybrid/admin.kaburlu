/**
 * AI rewrite loading animation — used during syndication generate
 */

import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'

const ANIMATION_URL = '/lotti/ai-loading.json'

export default function SyndicationAiLoader({
  show = false,
  title = 'AI rewrite running…',
  subtitle = 'Print, web & short news generate avutunnayi',
  size = 220,
}) {
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(ANIMATION_URL, { headers: { accept: 'application/json' } })
        if (!res.ok) throw new Error('animation missing')
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch {
        if (!cancelled) setData(null)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white shadow-2xl px-6 py-8 text-center">
        {data ? (
          <Lottie animationData={data} loop autoplay style={{ width: size, height: size, margin: '0 auto' }} />
        ) : (
          <div className="mx-auto h-16 w-16 border-4 border-slate-200 border-t-brand rounded-full animate-spin" />
        )}
        <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        <p className="mt-4 text-xs text-slate-400">15–45 seconds pattutundi — wait cheyandi</p>
      </div>
    </div>
  )
}
