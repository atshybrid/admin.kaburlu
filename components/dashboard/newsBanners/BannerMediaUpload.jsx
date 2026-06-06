/**
 * Upload banner image (jpg/png → webp) or video (mp4) via /admin/news-banners/upload
 */

import { useRef, useState } from 'react'
import { newsBannersApi } from '../../../lib/api/services/newsBannersApi'
import { isVideoBanner } from '../../../lib/newsBanners/normalize'
import Button from '../../ui/Button'
import Spinner from '../../ui/Spinner'

export default function BannerMediaUpload({
  mediaType = 'IMAGE',
  value = '',
  onChange,
  label,
  accept,
  maxSizeMB = 50,
  disabled = false,
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const isVideo = String(mediaType).toUpperCase() === 'VIDEO'
  const defaultAccept = isVideo ? 'video/mp4,video/quicktime,.mp4' : 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
  const maxMb = isVideo ? maxSizeMB : Math.min(maxSizeMB, 10)

  const handleFile = async (file) => {
    if (!file) return
    const sizeMb = file.size / (1024 * 1024)
    if (sizeMb > maxMb) {
      setError(`File must be under ${maxMb}MB`)
      return
    }
    if (isVideo && !file.type.startsWith('video/') && !file.name.endsWith('.mp4')) {
      setError('Please select an MP4 video')
      return
    }
    if (!isVideo && !file.type.startsWith('image/')) {
      setError('Please select a JPG or PNG image')
      return
    }

    setError('')
    setUploading(true)
    try {
      const { url } = await newsBannersApi.upload(file)
      if (!url) throw new Error('Upload succeeded but no mediaUrl returned')
      onChange?.(url)
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={accept || defaultAccept}
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {value ? (
        <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-900/5">
          {isVideoBanner({ mediaType }) ? (
            <video
              src={value}
              controls
              preload="metadata"
              className="w-full max-h-48 object-contain bg-black"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Banner preview" className="w-full max-h-48 object-contain bg-gray-50" />
          )}
          <button
            type="button"
            onClick={() => onChange?.('')}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 text-sm hover:bg-red-600"
            disabled={disabled}
          >
            ×
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Spinner className="w-4 h-4" />
              <span>Uploading to CDN…</span>
            </>
          ) : (
            <span>{label || (isVideo ? 'Upload MP4 video' : 'Upload banner image')}</span>
          )}
        </Button>
        {value ? (
          <span className="text-xs text-green-700 font-medium">✓ Media ready</span>
        ) : null}
      </div>

      <p className="text-xs text-gray-500">
        {isVideo
          ? 'MP4 → Bunny CDN (carousel loop). Max ' + maxMb + 'MB.'
          : 'JPG/PNG → converted to WebP on Bunny Storage. Max ' + maxMb + 'MB.'}
      </p>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
