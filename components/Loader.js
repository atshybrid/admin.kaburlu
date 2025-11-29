import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'

export default function Loader({ size = 64, className = '', label = '' }) {
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

  return (
    <div className={`flex items-center justify-center ${className}`} style={{ minHeight: size }}>
      {data ? (
        <Lottie animationData={data} loop autoplay style={{ width: size, height: size }} />
      ) : (
        <span className="inline-block h-5 w-5 border-2 border-gray-300 border-t-brand rounded-full animate-spin" />
      )}
      {label ? <span className="ml-2 text-sm text-gray-600">{label}</span> : null}
    </div>
  )
}
