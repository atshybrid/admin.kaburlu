import React, { useCallback, useEffect, useRef, useState } from 'react'

const PAGE = { left: 36, top: 24, width: 448, height: 632 }

export default function BlockFabricPageLab() {
  const canvasEl = useRef(null)
  const fabricCanvas = useRef(null)
  const fabricLib = useRef(null)
  const storyIndex = useRef(2)
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [kind, setKind] = useState('')
  const [styleForm, setStyleForm] = useState({
    fill: '#dbeafe',
    stroke: '#0ea5e9',
    strokeWidth: 2,
    opacity: 1,
    fontSize: 20,
  })

  const readActive = useCallback(() => {
    const c = fabricCanvas.current
    const obj = c?.getActiveObject?.()
    if (!obj || obj.selectable === false) {
      setKind('')
      return
    }
    setKind(obj.type || '')
    setStyleForm({
      fill: typeof obj.fill === 'string' ? obj.fill : '#dbeafe',
      stroke: typeof obj.stroke === 'string' ? obj.stroke : '#64748b',
      strokeWidth: Number(obj.strokeWidth) || 0,
      opacity: obj.opacity != null ? Number(obj.opacity) : 1,
      fontSize: Number(obj.fontSize) || 20,
    })
  }, [])

  useEffect(() => {
    let disposed = false
    setReady(false)
    setLoadError(false)

    const el = canvasEl.current
    if (!el) return undefined

    import('fabric')
      .then((F) => {
        if (disposed || !canvasEl.current) return
        try {
          fabricLib.current = F
          const { Canvas, Rect, Line } = F
          const c = new Canvas(canvasEl.current, {
            width: 520,
            height: 708,
            backgroundColor: '#cbd5e1',
            preserveObjectStacking: true,
          })
          fabricCanvas.current = c

          const pageBg = new Rect({
            left: PAGE.left,
            top: PAGE.top,
            width: PAGE.width,
            height: PAGE.height,
            fill: '#fffef9',
            stroke: '#475569',
            strokeWidth: 1,
            selectable: false,
            evented: false,
          })
          c.add(pageBg)

          const innerL = PAGE.left + 16
          const innerR = PAGE.left + PAGE.width - 16
          const innerT = PAGE.top + 16
          const innerB = PAGE.top + PAGE.height - 16
          ;[
            new Line([innerL, innerT, innerR, innerT], {
              stroke: '#fca5a5',
              strokeDashArray: [5, 5],
              selectable: false,
              evented: false,
            }),
            new Line([innerL, innerB, innerR, innerB], {
              stroke: '#fca5a5',
              strokeDashArray: [5, 5],
              selectable: false,
              evented: false,
            }),
          ].forEach((ln) => c.add(ln))

          const slot = new Rect({
            left: innerL + 8,
            top: innerT + 20,
            width: 168,
            height: 220,
            fill: 'rgba(14,165,233,0.14)',
            stroke: '#0ea5e9',
            strokeWidth: 2,
            rx: 4,
            ry: 4,
          })
          c.add(slot)
          c.setActiveObject(slot)

          const fire = () => readActive()
          c.on('selection:created', fire)
          c.on('selection:updated', fire)
          c.on('selection:cleared', () => setKind(''))
          c.on('object:modified', fire)
          c.on('text:changed', fire)

          readActive()
          if (!disposed) setReady(true)
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[Fabric]', e)
          if (!disposed) setLoadError(true)
        }
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error('[Fabric import]', e)
        if (!disposed) setLoadError(true)
      })

    return () => {
      disposed = true
      try {
        fabricCanvas.current?.dispose?.()
      } catch (_) {
        /* ignore */
      }
      fabricCanvas.current = null
      fabricLib.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getCanvas = () => fabricCanvas.current

  const addStorySlot = () => {
    const F = fabricLib.current
    const c = getCanvas()
    if (!F || !c) return
    const { Rect } = F
    const n = storyIndex.current++
    const innerL = PAGE.left + 24
    const innerT = PAGE.top + 32
    const slot = new Rect({
      left: innerL + (n % 4) * 22,
      top: innerT + 80 + (n % 5) * 18,
      width: 150,
      height: 140,
      fill: 'rgba(99,102,241,0.12)',
      stroke: '#6366f1',
      strokeWidth: 2,
      rx: 4,
      ry: 4,
    })
    c.add(slot)
    c.setActiveObject(slot)
    c.requestRenderAll()
    readActive()
  }

  const addRuleLine = () => {
    const F = fabricLib.current
    const c = getCanvas()
    if (!F || !c) return
    const { Line } = F
    const innerL = PAGE.left + 20
    const innerR = PAGE.left + PAGE.width - 20
    const y = PAGE.top + 140 + Math.floor(Math.random() * 280)
    const line = new Line([innerL, y, innerR, y], {
      stroke: '#64748b',
      strokeWidth: 2,
    })
    c.add(line)
    c.setActiveObject(line)
    c.requestRenderAll()
    readActive()
  }

  const addHeadline = () => {
    const F = fabricLib.current
    const c = getCanvas()
    if (!F || !c) return
    const { IText } = F
    const te = new IText('శీర్షిక ఇక్కడ డబుల్-క్లిక్ చేసి మార్చండి', {
      left: PAGE.left + 32,
      top: PAGE.top + 48,
      fontSize: 22,
      fontFamily: 'Georgia, "Noto Serif Telugu", serif',
      fill: '#0f172a',
    })
    c.add(te)
    c.setActiveObject(te)
    c.requestRenderAll()
    readActive()
  }

  const removeSelected = () => {
    const c = getCanvas()
    if (!c) return
    const o = c.getActiveObject()
    if (!o || o.selectable === false) return
    c.remove(o)
    c.discardActiveObject()
    c.requestRenderAll()
    setKind('')
  }

  const pushStyle = (patch) => {
    const c = getCanvas()
    const o = c?.getActiveObject()
    if (!c || !o || o.selectable === false) return
    o.set(patch)
    o.setCoords()
    c.requestRenderAll()
    readActive()
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-3">
        {ready ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addStorySlot}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              + Story box
            </button>
            <button
              type="button"
              onClick={addRuleLine}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              + Rule line
            </button>
            <button
              type="button"
              onClick={addHeadline}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              + Headline (IText)
            </button>
            <button
              type="button"
              onClick={removeSelected}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
            >
              Delete selection
            </button>
          </div>
        ) : null}
        {ready ? (
          <p className="text-xs text-slate-500">
            Drag, resize, and rotate objects. Red dashed lines are margin guides. This is a DTP-style scratch pad; real
            article typography still comes from each React block component.
          </p>
        ) : null}

        <div className="relative min-h-[360px] rounded-lg border border-slate-300 bg-slate-200 p-2 shadow-inner">
          {!ready && !loadError ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-slate-50/95 text-slate-600">
              Loading Fabric canvas…
            </div>
          ) : null}
          {loadError ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-md bg-amber-50 p-4 text-center text-amber-950">
              <p className="font-semibold">Fabric did not start</p>
              <p className="max-w-sm text-sm">Check the browser console. Try `npm install` and restart `npm run dev`.</p>
            </div>
          ) : null}
          <canvas ref={canvasEl} width={520} height={708} className="block max-w-full" />
        </div>
      </div>

      {ready ? (
        <aside className="w-full shrink-0 space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:w-72">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Selection</h3>
            <p className="mt-1 font-mono text-sm text-slate-800">{kind || '—'}</p>
          </div>
          {kind ? (
            <>
              <label className="block text-xs font-semibold text-slate-600">
                Fill
                <input
                  type="color"
                  className="mt-1 h-9 w-full cursor-pointer rounded border border-slate-200"
                  value={/^#/.test(styleForm.fill) ? styleForm.fill : '#dbeafe'}
                  onChange={(e) => {
                    setStyleForm((s) => ({ ...s, fill: e.target.value }))
                    pushStyle({ fill: e.target.value })
                  }}
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Stroke
                <input
                  type="color"
                  className="mt-1 h-9 w-full cursor-pointer rounded border border-slate-200"
                  value={/^#/.test(styleForm.stroke) ? styleForm.stroke : '#0ea5e9'}
                  onChange={(e) => {
                    setStyleForm((s) => ({ ...s, stroke: e.target.value }))
                    pushStyle({ stroke: e.target.value })
                  }}
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Stroke width ({styleForm.strokeWidth}px)
                <input
                  type="range"
                  min={0}
                  max={12}
                  step={1}
                  className="mt-1 w-full"
                  value={styleForm.strokeWidth}
                  onChange={(e) => {
                    const strokeWidth = Number(e.target.value)
                    setStyleForm((s) => ({ ...s, strokeWidth }))
                    pushStyle({ strokeWidth })
                  }}
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Opacity ({Math.round(styleForm.opacity * 100)}%)
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  className="mt-1 w-full"
                  value={styleForm.opacity}
                  onChange={(e) => {
                    const opacity = Number(e.target.value)
                    setStyleForm((s) => ({ ...s, opacity }))
                    pushStyle({ opacity })
                  }}
                />
              </label>
              {kind === 'i-text' || kind === 'textbox' ? (
                <label className="block text-xs font-semibold text-slate-600">
                  Font size ({styleForm.fontSize}px)
                  <input
                    type="range"
                    min={12}
                    max={48}
                    step={1}
                    className="mt-1 w-full"
                    value={styleForm.fontSize}
                    onChange={(e) => {
                      const fontSize = Number(e.target.value)
                      setStyleForm((s) => ({ ...s, fontSize }))
                      pushStyle({ fontSize })
                    }}
                  />
                </label>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-slate-500">Select an object on the canvas to edit fill, stroke, and opacity.</p>
          )}
        </aside>
      ) : null}
    </div>
  )
}
