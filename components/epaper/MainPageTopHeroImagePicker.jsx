import React, { useEffect, useRef, useState } from 'react'
import mediaApi from '../../lib/api/services/mediaApi'

const RECENT_KEY = 'mainPageTopHeroRecent'
const MAX_RECENT = 12

function loadRecent() {
  try {
    const raw = sessionStorage.getItem(RECENT_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.filter(Boolean) : []
  } catch {
    return []
  }
}

function pushRecent(url) {
  const next = [url, ...loadRecent().filter((u) => u !== url)].slice(0, MAX_RECENT)
  sessionStorage.setItem(RECENT_KEY, JSON.stringify(next))
  return next
}

/**
 * Hero PNG — URL paste or upload; recent uploads for fast multi-image testing.
 */
export default function MainPageTopHeroImagePicker({ value = '', onChange }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [recent, setRecent] = useState([])

  useEffect(() => {
    setRecent(loadRecent())
  }, [])

  const applyUrl = (url) => {
    const trimmed = String(url || '').trim()
    onChange(trimmed)
    if (trimmed) setRecent(pushRecent(trimmed))
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Select a PNG, JPG, or WebP image')
      return
    }
    const mb = file.size / (1024 * 1024)
    if (mb > 8) {
      setError('Image must be under 8 MB')
      return
    }
    setError('')
    setUploading(true)
    try {
      const result = await mediaApi.upload(file, 'epaper-hero')
      if (result?.url) applyUrl(result.url)
      else setError('Upload OK but no URL returned')
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const fileName = (url) => {
    try {
      const path = new URL(url, 'http://local').pathname
      const base = path.split('/').pop() || url
      return base.length > 28 ? `${base.slice(0, 14)}…${base.slice(-10)}` : base
    } catch {
      return url.length > 28 ? `${url.slice(0, 14)}…` : url
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-xs text-slate-500">Hero PNG</span>
      {value ? (
        <div className="mt-1 flex gap-2 items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Hero preview"
            className="h-16 w-16 rounded-lg border border-slate-200 object-contain bg-slate-50 shrink-0"
            onError={(e) => {
              e.currentTarget.style.opacity = '0.35'
            }}
          />
          <div className="min-w-0 flex-1 space-y-1">
            <input
              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-mono"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={(e) => applyUrl(e.target.value)}
              placeholder="https://… or /epaper/…"
            />
            <button
              type="button"
              className="text-xs text-red-600 hover:underline"
              onClick={() => onChange('')}
            >
              Clear image
            </button>
          </div>
        </div>
      ) : (
        <input
          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            const v = e.target.value.trim()
            if (v) applyUrl(v)
          }}
          placeholder="/epaper/your-cutout.png or paste URL"
        />
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleUpload}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload image'}
        </button>
        <button
          type="button"
          className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
          onClick={() => applyUrl('/epaper/main-page-hero-sample.png')}
        >
          Sample PNG
        </button>
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <p className="text-[11px] text-slate-500">PNG cutouts work best. Max 8 MB.</p>

      {recent.length > 0 ? (
        <div className="pt-1">
          <span className="text-[11px] font-semibold text-slate-600">Recent (click to test)</span>
          <ul className="mt-1 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {recent.map((url) => (
              <li key={url}>
                <button
                  type="button"
                  title={url}
                  onClick={() => applyUrl(url)}
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-mono truncate max-w-[140px] ${
                    url === value
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {fileName(url)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
