import React, { useCallback, useEffect, useRef, useState } from 'react'
import { BLOCK_TOP8X7_DIMENSIONS } from '../../lib/epaper/mainPageTopBlockRules'
import {
  measureLayerBounds,
  moveLayerPatch,
  resizeLayerPatch,
  mergeTemplatePatch,
} from '../../lib/epaper/mainPageTopBlockTransform'
import tb from './MainPageTopBlockStudio.module.css'

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

function applyHandle(start, handle, dx, dy, minW = 24, minH = 16) {
  let { left, top, width, height } = start
  if (handle.includes('e')) width = Math.max(minW, width + dx)
  if (handle.includes('w')) {
    width = Math.max(minW, width - dx)
    left = start.left + (start.width - width)
  }
  if (handle.includes('s')) height = Math.max(minH, height + dy)
  if (handle.includes('n')) {
    height = Math.max(minH, height - dy)
    top = start.top + (start.height - height)
  }
  return { left, top, width, height }
}

export default function MainPageTopBlockTransformOverlay({
  artboardRef,
  selectedLayer,
  template,
  onTemplateChange,
  disabled,
}) {
  const [bounds, setBounds] = useState(null)
  const dragRef = useRef(null)
  const nativeW = BLOCK_TOP8X7_DIMENSIONS.nativeWidthPx

  const remeasure = useCallback(() => {
    if (!artboardRef?.current || !selectedLayer || disabled) {
      setBounds(null)
      return
    }
    const b = measureLayerBounds(artboardRef.current, selectedLayer, nativeW)
    setBounds(b)
  }, [artboardRef, selectedLayer, disabled, nativeW])

  useEffect(() => {
    remeasure()
    const el = artboardRef?.current
    if (!el) return undefined
    const ro = new ResizeObserver(() => remeasure())
    ro.observe(el)
    return () => ro.disconnect()
  }, [artboardRef, selectedLayer, template, remeasure, disabled])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') dragRef.current = null
    }
    window.addEventListener('keyup', onKey)
    return () => window.removeEventListener('keyup', onKey)
  }, [])

  const onPointerDownHandle = (handle) => (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (!bounds || !selectedLayer) return
    const startBounds = { ...bounds }
    const startTemplate = template
    const startX = e.clientX
    const startY = e.clientY
    const zoom =
      (artboardRef.current?.getBoundingClientRect().width || nativeW) / nativeW

    dragRef.current = { mode: 'resize', handle, startBounds, startTemplate, startX, startY, zoom }

    const onMove = (ev) => {
      const d = dragRef.current
      if (!d || d.mode !== 'resize') return
      const dx = (ev.clientX - d.startX) / d.zoom
      const dy = (ev.clientY - d.startY) / d.zoom
      const next = applyHandle(d.startBounds, d.handle, dx, dy)
      setBounds(next)
      const patch = resizeLayerPatch(
        selectedLayer,
        next,
        d.startBounds,
        d.startTemplate,
        d.handle
      )
      if (patch) onTemplateChange(mergeTemplatePatch(d.startTemplate, patch))
    }

    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      remeasure()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const onPointerDownMove = (e) => {
    if (e.target.dataset.handle) return
    e.stopPropagation()
    e.preventDefault()
    if (!bounds || !selectedLayer) return
    const startTemplate = template
    const startX = e.clientX
    const startY = e.clientY
    const zoom =
      (artboardRef.current?.getBoundingClientRect().width || nativeW) / nativeW

    dragRef.current = { mode: 'move', startBounds: { ...bounds }, startTemplate, startX, startY, zoom }

    const onMove = (ev) => {
      const d = dragRef.current
      if (!d || d.mode !== 'move') return
      const dx = (ev.clientX - d.startX) / d.zoom
      const dy = (ev.clientY - d.startY) / d.zoom
      setBounds({
        ...d.startBounds,
        left: d.startBounds.left + dx,
        top: d.startBounds.top + dy,
      })
    }

    const onUp = (ev) => {
      const d = dragRef.current
      if (d?.mode === 'move') {
        const dx = (ev.clientX - d.startX) / d.zoom
        const dy = (ev.clientY - d.startY) / d.zoom
        const patch = moveLayerPatch(selectedLayer, dx, dy, d.startTemplate)
        if (patch && (patch.layers || patch.layout)) {
          onTemplateChange((prev) => mergeTemplatePatch(prev, patch))
        }
      }
      dragRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      remeasure()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  if (!bounds || !selectedLayer || disabled) return null

  return (
    <div
      className={tb.transformLayer}
      style={{
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
      }}
      onPointerDown={onPointerDownMove}
    >
      <div className={tb.transformBox} />
      {HANDLES.map((h) => (
        <div
          key={h}
          data-handle={h}
          className={`${tb.handle} ${tb[`handle_${h}`]}`}
          onPointerDown={onPointerDownHandle(h)}
        />
      ))}
      <div className={tb.transformLabel}>{selectedLayer}</div>
    </div>
  )
}
