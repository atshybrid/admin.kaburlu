/**
 * Cartoon image upload — platform news-cartoons/upload
 */

import { useRef, useState } from 'react'
import { newsCartoonsApi } from '../../../lib/api/services/newsCartoonsApi'
import { Button, Spinner } from '../../ui'

export default function CartoonMediaUpload({ value, onChange, disabled }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleFile = async (file) => {
    if (!file || disabled) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image (JPG, PNG, WebP)')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image must be under 8MB')
      return
    }

    setError('')
    setUploading(true)
    try {
      const { url } = await newsCartoonsApi.upload(file)
      if (!url) throw new Error('Upload succeeded but no image URL returned')
      onChange?.(url)
    } catch (e) {
      setError(e.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    handleFile(file)
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-colors overflow-hidden ${
          dragOver
            ? 'border-brand bg-brand/5'
            : value
              ? 'border-slate-200 bg-slate-50'
              : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        {value ? (
          <div className="relative aspect-[4/3] max-h-[420px] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Cartoon preview" className="w-full h-full object-contain bg-slate-100" />
            <div className="absolute inset-x-0 bottom-0 flex gap-2 justify-center p-3 bg-gradient-to-t from-black/60 to-transparent">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={uploading || disabled}
                onClick={() => inputRef.current?.click()}
              >
                Replace image
              </Button>
              <Button type="button" size="sm" variant="ghost" className="text-white" onClick={() => onChange?.('')}>
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={uploading || disabled}
            onClick={() => inputRef.current?.click()}
            className="w-full py-16 px-6 flex flex-col items-center gap-3 text-center disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Spinner className="w-8 h-8" />
                <span className="text-sm text-slate-600">Uploading cartoon…</span>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">
                  🖼️
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Drop cartoon image here</p>
                  <p className="text-xs text-slate-500 mt-1">or click to browse · max 8MB · WebP recommended</p>
                </div>
              </>
            )}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading || disabled}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  )
}
