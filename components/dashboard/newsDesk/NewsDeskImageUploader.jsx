import { useId, useRef, useState } from 'react'
import { uploadMedia } from '../../../lib/api/services/mediaApi'
import { Button, Spinner, toast } from '../../ui'
import { IconChevronDown, IconChevronUp, IconPlus, IconTrash } from '../../ui/icons'

export default function NewsDeskImageUploader({ images = [], onChange, disabled = false }) {
  const inputRef = useRef(null)
  const id = useId()
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const move = (index, dir) => {
    const next = [...images]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const remove = (index) => {
    onChange(images.filter((_, i) => i !== index))
  }

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f?.type?.startsWith('image/'))
    if (!files.length) {
      if (fileList?.length) toast.error('Please choose image files only')
      return
    }
    setUploading(true)
    try {
      const results = await Promise.all(
        files.map((file) => uploadMedia(file, 'news-desk').catch((err) => ({ error: err })),
      )
      const uploaded = []
      let failed = 0
      for (const result of results) {
        if (result?.error) {
          failed += 1
          continue
        }
        if (result?.url) uploaded.push(result.url)
      }
      if (uploaded.length) onChange([...images, ...uploaded])
      if (failed > 0) toast.error(`${failed} image(s) failed to upload`)
      else if (uploaded.length > 1) toast.success(`${uploaded.length} images added`)
    } catch (error) {
      toast.error(error.message || 'Image upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled || uploading) return
    handleFiles(e.dataTransfer?.files)
  }

  return (
    <div className="space-y-3">
      <UploaderLabel id={id} count={images.length} />
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!disabled && !uploading) inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled && !uploading) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => {
          if (!disabled && !uploading) inputRef.current?.click()
        }}
        className={`
          rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-brand bg-brand/5' : 'border-slate-200 bg-slate-50/80 hover:border-brand/40'}
          ${disabled || uploading ? 'opacity-60 pointer-events-none' : ''}
        `}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Spinner size="md" />
            <p className="text-sm text-slate-600">Uploading selected images…</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-800">Select multiple images at once</p>
            <p className="text-xs text-slate-500 mt-1">
              Click to browse, or drag & drop several photos here. Order is kept — first image is the lead.
            </p>
            <Button type="button" variant="outline" className="mt-4 pointer-events-none" tabIndex={-1}>
              <IconPlus className="w-4 h-4 mr-2" />
              Choose images (multi-select)
            </Button>
          </>
        )}
      </div>
      {images.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-36 object-cover bg-slate-100" />
              <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-600">#{index + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-40"
                    disabled={disabled || index === 0}
                    onClick={(e) => {
                      e.stopPropagation()
                      move(index, -1)
                    }}
                    aria-label="Move up"
                  >
                    <IconChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-40"
                    disabled={disabled || index === images.length - 1}
                    onClick={(e) => {
                      e.stopPropagation()
                      move(index, 1)
                    }}
                    aria-label="Move down"
                  >
                    <IconChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation()
                      remove(index)
                    }}
                    aria-label="Remove"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function UploaderLabel({ id, count }) {
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-sm font-semibold text-slate-800">
        Article images
      </label>
      <span className="text-xs text-slate-500">{count} uploaded</span>
    </div>
  )
}