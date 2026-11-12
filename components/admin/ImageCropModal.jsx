import { useCallback, useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import { Button, Modal } from '../ui'

const DEFAULT_ASPECTS = [
  { id: 'original', label: 'Original' },
  { id: '1:1', label: '1 : 1', value: 1 },
  { id: '3:1', label: '3 : 1', value: 3 },
  { id: '4:1', label: '4 : 1', value: 4 },
  { id: '6:1', label: '6 : 1', value: 6 },
  { id: '4:3', label: '4 : 3', value: 4 / 3 },
]

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function cropToFile(src, area, fileName, mimeType) {
  const img = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(area.width)
  canvas.height = Math.round(area.height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height)
  const type = mimeType === 'image/jpeg' ? 'image/jpeg' : 'image/png'
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.95))
  if (!blob) throw new Error('Could not crop image')
  const base = String(fileName || 'image').replace(/\.[^.]+$/, '')
  return new File([blob], `${base}-cropped.${type === 'image/jpeg' ? 'jpg' : 'png'}`, { type })
}

/**
 * Crop an image before upload. Transparent PNG/WebP logos stay transparent (PNG output).
 * onConfirm receives the cropped File; "Use original" passes the untouched file.
 */
export default function ImageCropModal({
  file,
  title = 'Crop image',
  defaultAspect = 'original',
  onCancel,
  onConfirm,
  busy = false,
}) {
  const [src, setSrc] = useState('')
  const [naturalAspect, setNaturalAspect] = useState(1)
  const [aspectId, setAspectId] = useState(defaultAspect)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState(null)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    if (!file) return undefined
    const url = URL.createObjectURL(file)
    setSrc(url)
    setAspectId(defaultAspect)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    loadImage(url)
      .then((img) => setNaturalAspect(img.naturalWidth / img.naturalHeight || 1))
      .catch(() => setNaturalAspect(1))
    return () => URL.revokeObjectURL(url)
  }, [file, defaultAspect])

  const aspect =
    aspectId === 'original'
      ? naturalAspect
      : DEFAULT_ASPECTS.find((a) => a.id === aspectId)?.value || naturalAspect

  const onCropComplete = useCallback((_, pixels) => setArea(pixels), [])

  const handleApply = async () => {
    if (!area) return
    setWorking(true)
    try {
      onConfirm(await cropToFile(src, area, file?.name, file?.type))
    } finally {
      setWorking(false)
    }
  }

  return (
    <Modal
      isOpen={!!file}
      onClose={busy || working ? undefined : onCancel}
      title={title}
      subtitle="Drag to position, use the slider to zoom."
      size="xl"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" onClick={() => onConfirm(file)} disabled={busy || working}>
            Use original
          </Button>
          <div className="flex gap-2">
            <Button variant="default" onClick={onCancel} disabled={busy || working}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApply} loading={busy || working} disabled={!area}>
              Crop & upload
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div
          className="relative h-[360px] w-full overflow-hidden rounded-lg"
          style={{
            backgroundColor: '#f1f5f9',
            backgroundImage:
              'linear-gradient(45deg,#e2e8f0 25%,transparent 25%),linear-gradient(-45deg,#e2e8f0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e2e8f0 75%),linear-gradient(-45deg,transparent 75%,#e2e8f0 75%)',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0,0 8px,8px -8px,-8px 0',
          }}
        >
          {src ? (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              minZoom={0.5}
              maxZoom={4}
              aspect={aspect}
              restrictPosition={false}
              objectFit="contain"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{ containerStyle: { background: 'transparent' } }}
            />
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_ASPECTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAspectId(a.id)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                  aspectId === a.id
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
          <label className="flex min-w-[200px] flex-1 items-center gap-3 text-xs text-slate-600">
            Zoom
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-slate-900"
            />
            <span className="w-10 text-right tabular-nums">{zoom.toFixed(1)}×</span>
          </label>
        </div>
      </div>
    </Modal>
  )
}
