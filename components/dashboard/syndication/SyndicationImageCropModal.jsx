/**
 * Crop modal — single (16:9 / 3:2) or dual portrait side-by-side composite
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ASPECT_PRESETS,
  defaultPanZoom,
  exportDualComposite,
  exportSingleCrop,
  loadImageFromFile,
  revokeImageSource,
} from '../../../lib/syndication/imageCrop'
import { Button, Modal } from '../../ui'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function CropViewport({
  imageUrl,
  aspectRatio,
  pan,
  zoom,
  onPanChange,
  onZoomChange,
  label,
  active,
  onActivate,
}) {
  const containerRef = useRef(null)
  const dragging = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  const [naturalSize, setNaturalSize] = useState({ width: 4, height: 3 })

  useEffect(() => {
    if (!imageUrl) {
      setNaturalSize({ width: 4, height: 3 })
      return
    }
    const probe = new Image()
    probe.onload = () => {
      setNaturalSize({
        width: probe.naturalWidth || 4,
        height: probe.naturalHeight || 3,
      })
    }
    probe.src = imageUrl
  }, [imageUrl])

  const onPointerDown = (event) => {
    onActivate?.()
    dragging.current = true
    lastPointer.current = { x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event) => {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = event.clientX - lastPointer.current.x
    const dy = event.clientY - lastPointer.current.y
    lastPointer.current = { x: event.clientX, y: event.clientY }
    onPanChange({
      x: clamp(pan.x - dx / rect.width, 0, 1),
      y: clamp(pan.y - dy / rect.height, 0, 1),
    })
  }

  const onPointerUp = (event) => {
    dragging.current = false
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const coverStyle = useMemo(() => {
    const targetAspect = aspectRatio
    const imgAspect = naturalSize.width / naturalSize.height
    let drawW
    let drawH
    if (imgAspect > targetAspect) {
      drawH = 100 * zoom
      drawW = (drawH * imgAspect) / targetAspect
    } else {
      drawW = 100 * zoom
      drawH = (drawW / imgAspect) * targetAspect
    }
    const offsetX = (drawW - 100) * pan.x
    const offsetY = (drawH - 100) * pan.y
    return {
      width: `${drawW}%`,
      height: `${drawH}%`,
      left: `${-offsetX}%`,
      top: `${-offsetY}%`,
    }
  }, [aspectRatio, naturalSize.width, naturalSize.height, pan.x, pan.y, zoom])

  return (
    <div className={`space-y-2 ${active ? '' : 'opacity-90'}`}>
      {label ? (
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</p>
      ) : null}
      <div
        ref={containerRef}
        className={`relative w-full overflow-hidden rounded-xl bg-slate-900 touch-none select-none ${
          active ? 'ring-2 ring-brand' : 'ring-1 ring-slate-200'
        }`}
        style={{ aspectRatio: String(aspectRatio) }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={label || 'Crop preview'}
            className="absolute max-w-none pointer-events-none object-cover"
            style={coverStyle}
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            Add photo
          </div>
        )}
        <div className="absolute inset-0 pointer-events-none border-2 border-white/70 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)]" />
      </div>
      {imageUrl ? (
        <label className="flex items-center gap-3 text-xs text-slate-600">
          <span className="shrink-0">Zoom</span>
          <input
            type="range"
            min="1"
            max="2.5"
            step="0.01"
            value={zoom}
            onChange={(event) => onZoomChange(Number(event.target.value))}
            className="w-full accent-brand"
          />
        </label>
      ) : null}
    </div>
  )
}

export default function SyndicationImageCropModal({
  open,
  initialFile,
  onClose,
  onConfirm,
  confirming = false,
}) {
  const [layout, setLayout] = useState('single')
  const [aspectId, setAspectId] = useState('16:9')
  const [single, setSingle] = useState(null)
  const [left, setLeft] = useState(null)
  const [right, setRight] = useState(null)
  const [activeSlot, setActiveSlot] = useState('left')
  const [loadingSlot, setLoadingSlot] = useState('')

  const aspectRatio = ASPECT_PRESETS.find((item) => item.id === aspectId)?.ratio || (16 / 9)
  const dualCellAspect = aspectRatio / 2

  const loadFileIntoSlot = useCallback(async (file, slot) => {
    setLoadingSlot(slot)
    try {
      const loaded = await loadImageFromFile(file)
      const next = { file, objectUrl: loaded.objectUrl, image: loaded.image, ...defaultPanZoom() }
      if (slot === 'single') setSingle(next)
      if (slot === 'left') setLeft(next)
      if (slot === 'right') setRight(next)
    } finally {
      setLoadingSlot('')
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setLayout('single')
    setAspectId('16:9')
    setActiveSlot('left')
    setRight(null)
    if (initialFile) {
      loadFileIntoSlot(initialFile, 'single')
      setLeft(null)
    } else {
      setSingle(null)
      setLeft(null)
    }
  }, [open, initialFile, loadFileIntoSlot])

  const closeAndRevoke = () => {
    revokeImageSource(single)
    revokeImageSource(left)
    revokeImageSource(right)
    setSingle(null)
    setLeft(null)
    setRight(null)
    onClose?.()
  }

  const switchToDual = () => {
    setLayout('dual')
    if (single?.file) {
      setLeft({
        file: single.file,
        objectUrl: single.objectUrl,
        image: single.image,
        pan: single.pan,
        zoom: single.zoom,
      })
      setActiveSlot(right?.objectUrl ? 'left' : 'right')
      setSingle(null)
    }
  }

  const switchToSingle = () => {
    setLayout('single')
    const source = left || single
    if (source) {
      setSingle(source)
    }
    setLeft(null)
    setRight(null)
  }

  const activeCrop = layout === 'single'
    ? single
    : activeSlot === 'left'
      ? left
      : right

  const updateActiveCrop = (patch) => {
    if (layout === 'single') {
      setSingle((current) => (current ? { ...current, ...patch } : current))
      return
    }
    if (activeSlot === 'left') {
      setLeft((current) => (current ? { ...current, ...patch } : current))
    } else {
      setRight((current) => (current ? { ...current, ...patch } : current))
    }
  }

  const canConfirm = layout === 'single'
    ? Boolean(single?.image)
    : Boolean(left?.image && right?.image)

  const handleConfirm = async () => {
    if (!canConfirm) return
    try {
      let blob
      if (layout === 'single') {
        blob = await exportSingleCrop(single.image, aspectRatio, single.pan, single.zoom)
      } else {
        blob = await exportDualComposite(
          left.image,
          right.image,
          aspectRatio,
          left.pan,
          left.zoom,
          right.pan,
          right.zoom,
        )
      }
      const file = new File([blob], `syndication-cover-${Date.now()}.jpg`, { type: 'image/jpeg' })
      await onConfirm?.(file)
      revokeImageSource(single)
      revokeImageSource(left)
      revokeImageSource(right)
      setSingle(null)
      setLeft(null)
      setRight(null)
    } catch (error) {
      // parent shows toast on upload failure; crop errors are rare
      console.error(error)
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={closeAndRevoke}
      size="xl"
      title="Crop cover image"
      subtitle="Drag to reposition · default 16:9 · portrait photos ki 2-pics side-by-side"
      footer={(
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            {layout === 'dual'
              ? 'Two portraits pakka pakka — combined wide cover'
              : 'Single photo crop'}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={closeAndRevoke} disabled={confirming}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleConfirm} loading={confirming} disabled={!canConfirm}>
              Apply & upload
            </Button>
          </div>
        </div>
      )}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={switchToSingle}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
              layout === 'single' ? 'border-brand bg-brand text-white' : 'border-slate-200 text-slate-600'
            }`}
          >
            Single photo
          </button>
          <button
            type="button"
            onClick={switchToDual}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
              layout === 'dual' ? 'border-brand bg-brand text-white' : 'border-slate-200 text-slate-600'
            }`}
          >
            2 photos side-by-side
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {ASPECT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setAspectId(preset.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                aspectId === preset.id
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {preset.label}
              {preset.id === '16:9' ? ' (default)' : ''}
            </button>
          ))}
        </div>

        {layout === 'single' ? (
          <div className="max-w-2xl mx-auto">
            <CropViewport
              imageUrl={single?.objectUrl}
              aspectRatio={aspectRatio}
              pan={single?.pan || { x: 0.5, y: 0.35 }}
              zoom={single?.zoom || 1}
              onPanChange={(pan) => updateActiveCrop({ pan })}
              onZoomChange={(zoom) => updateActiveCrop({ zoom })}
              label="Cover frame"
              active
            />
            {!single?.objectUrl ? (
              <label className="mt-3 inline-flex cursor-pointer text-sm font-medium text-brand">
                Choose image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) loadFileIntoSlot(file, 'single')
                    event.target.value = ''
                  }}
                />
              </label>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Single person / portrait photos ki best — rendu photos wide {aspectId} cover avutayi.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <CropViewport
                  imageUrl={left?.objectUrl}
                  aspectRatio={dualCellAspect}
                  pan={left?.pan || { x: 0.5, y: 0.35 }}
                  zoom={left?.zoom || 1}
                  onPanChange={(pan) => {
                    setActiveSlot('left')
                    setLeft((current) => (current ? { ...current, pan } : current))
                  }}
                  onZoomChange={(zoom) => {
                    setActiveSlot('left')
                    setLeft((current) => (current ? { ...current, zoom } : current))
                  }}
                  label="Left photo"
                  active={activeSlot === 'left'}
                  onActivate={() => setActiveSlot('left')}
                />
                <label className="inline-flex cursor-pointer text-xs font-medium text-brand">
                  {left?.objectUrl ? 'Replace left' : 'Add left photo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={loadingSlot === 'left'}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) loadFileIntoSlot(file, 'left')
                      event.target.value = ''
                    }}
                  />
                </label>
              </div>
              <div className="space-y-2">
                <CropViewport
                  imageUrl={right?.objectUrl}
                  aspectRatio={dualCellAspect}
                  pan={right?.pan || { x: 0.5, y: 0.35 }}
                  zoom={right?.zoom || 1}
                  onPanChange={(pan) => {
                    setActiveSlot('right')
                    setRight((current) => (current ? { ...current, pan } : current))
                  }}
                  onZoomChange={(zoom) => {
                    setActiveSlot('right')
                    setRight((current) => (current ? { ...current, zoom } : current))
                  }}
                  label="Right photo"
                  active={activeSlot === 'right'}
                  onActivate={() => setActiveSlot('right')}
                />
                <label className="inline-flex cursor-pointer text-xs font-medium text-brand">
                  {right?.objectUrl ? 'Replace right' : 'Add right photo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={loadingSlot === 'right'}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) loadFileIntoSlot(file, 'right')
                      event.target.value = ''
                    }}
                  />
                </label>
              </div>
            </div>

            {left?.objectUrl && right?.objectUrl ? (
              <div
                className="rounded-xl overflow-hidden border border-slate-200 flex"
                style={{ aspectRatio: String(aspectRatio) }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={left.objectUrl} alt="" className="w-1/2 h-full object-cover object-top" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={right.objectUrl} alt="" className="w-1/2 h-full object-cover object-top border-l border-white" />
              </div>
            ) : null}
          </div>
        )}

        {activeCrop ? (
          <p className="text-xs text-slate-500 text-center">
            Drag on photo to move · zoom slider use cheyandi · face center lo pettandi
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
