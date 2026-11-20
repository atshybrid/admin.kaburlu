import { useId, useRef, useState } from 'react'
import { uploadMedia } from '../../../lib/api/services/mediaApi'
import { Button, Spinner, toast } from '../../ui'
import { IconChevronDown, IconChevronUp, IconPlus, IconTrash } from '../../ui/icons'

export default function NewsDeskImageUploader({ images = [], onChange, disabled = false }) {
  const inputRef = useRef(null)
  const id = useId()
  const [uploading, setUploading] = useState(false)

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
    if (!files.length) return
    setUploading(true)
  try {
      const uploaded = []
      for (const file of files) {
        const { url } = await uploadMedia(file, 'news-desk')
        if (url) uploaded.push(url)
      }
      if (uploaded.length) onChange([...images, ...uploaded])
    } catch (error) {
      toast.error(error.message || 'Image upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
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
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Spinner size="sm" className="mr-2" /> : <IconPlus className="w-4 h-4 mr-2" />}
          Upload images
        </Button>
        <p className="text-xs text-slate-500">
          Order is preserved in submission. First image is the lead.
        </p>
      </div>
      {images.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
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
                    onClick={() => move(index, -1)}
                    aria-label="Move up"
                  >
                    <IconChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-40"
                    disabled={disabled || index === images.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label="Move down"
                  >
                    <IconChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                    disabled={disabled}
                    onClick={() => remove(index)}
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