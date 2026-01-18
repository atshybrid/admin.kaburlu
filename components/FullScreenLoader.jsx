import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'

export default function FullScreenLoader({ show = false, message = 'Loading...' }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/lotti/loading.json', { headers: { 'accept': 'application/json' } })
        if (!res.ok) throw new Error('Failed to load loader animation')
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
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {data ? (
          <Lottie animationData={data} loop autoplay style={{ width: 200, height: 200 }} />
        ) : (
          <div className="h-16 w-16 border-4 border-gray-200 border-t-brand rounded-full animate-spin" />
        )}
        {message && (
          <p className="text-lg font-medium text-slate-700 animate-pulse">{message}</p>
        )}
      </div>
    </div>
  )
}
