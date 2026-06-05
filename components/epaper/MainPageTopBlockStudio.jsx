import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MainPageTopBlock from './MainPageTopBlock'
import MainPageTopBlockStudioToolbox from './MainPageTopBlockStudioToolbox'
import MainPageTopBlockStudioArrange from './MainPageTopBlockStudioArrange'
import MainPageTopBlockTransformOverlay from './MainPageTopBlockTransformOverlay'
import {
  BLOCK_TOP8X7_DIMENSIONS,
  DEFAULT_MAIN_PAGE_TOP_TEMPLATE,
  MAIN_PAGE_TOP_LAYER_IDS,
  isTop8x7Style2,
} from '../../lib/epaper/mainPageTopBlockRules'
import {
  getMainPageTopTemplate,
  saveMainPageTopTemplate,
} from '../../lib/epaper/mainPageTopBlockStore'
import {
  STUDIO_TOOLS,
  layerMatchesTool,
  mergeTemplatePatch,
} from '../../lib/epaper/mainPageTopBlockTransform'
import {
  ARRANGEABLE_LAYER_IDS,
  arrangeLayerPatch,
  applyLayerPresetPatch,
  detectLayerPreset,
  getLayerZIndex,
  getStackOrder,
} from '../../lib/epaper/mainPageTopBlockStack'
import tb from './MainPageTopBlockStudio.module.css'
import MainPageTopHeroImagePicker from './MainPageTopHeroImagePicker'
import { normalizeStyle2ArticleText } from '../../lib/epaper/mainPageTopStyle2Text'

const LAYER_LABELS = {
  heroZone: 'Hero zone',
  heroTextCol: 'Title column',
  titleKicker: 'Title line 1 (kicker)',
  titleMain: 'Title line 2 (red H2 · stroke)',
  heroImage: 'Hero PNG',
  points: 'Points list',
  lead: 'Lead paragraph',
  bodyZone: 'Body zone',
  bodyLeft: 'Body left column',
  bodyRight: 'Body right / quote',
  quoteMark: 'Quote badge',
  continued: 'Continued line',
  dateline: 'Top headline (black H1)',
  subtitleBar: 'Green subtitle band',
  callout: 'Yellow callout box',
}

const LAYOUT_KEYS = [
  { key: 'heroShare', label: 'Hero height %', min: 0.38, max: 0.68, step: 0.01, scale: 100, suffix: '%' },
  { key: 'titleMaxWidthPx', label: 'Title band width (px)', min: 280, max: 744, step: 4 },
  { key: 'heroImageWidthPct', label: 'Hero image width %', min: 22, max: 72, step: 1 },
  { key: 'heroImageHeightPct', label: 'Hero image height %', min: 35, max: 130, step: 1 },
  { key: 'bodyColumnGap', label: 'Column gap (px)', min: 8, max: 40, step: 1 },
]

function RangeField({ label, value, onChange, min, max, step = 1, display }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-slate-500 flex justify-between">
        <span>{label}</span>
        <span className="font-mono text-slate-700">{display ?? value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  )
}

export default function MainPageTopBlockStudio({
  templateId = 'default-top8x7',
  content: contentProp,
  onContentChange,
  onSaved,
}) {
  const [template, setTemplate] = useState(DEFAULT_MAIN_PAGE_TOP_TEMPLATE)
  const [selectedLayer, setSelectedLayer] = useState('titleMain')
  const [activeTool, setActiveTool] = useState('select')
  const [zoom, setZoom] = useState(0.72)
  const [name, setName] = useState('')
  const artboardRef = useRef(null)
  const nativeW = BLOCK_TOP8X7_DIMENSIONS.nativeWidthPx
  const nativeH = BLOCK_TOP8X7_DIMENSIONS.nativeHeightPx

  useEffect(() => {
    const t = getMainPageTopTemplate(templateId)
    setTemplate({
      ...DEFAULT_MAIN_PAGE_TOP_TEMPLATE,
      ...t,
      layout: {
        ...DEFAULT_MAIN_PAGE_TOP_TEMPLATE.layout,
        ...t.layout,
      },
      layers: {
        ...DEFAULT_MAIN_PAGE_TOP_TEMPLATE.layers,
        ...t.layers,
      },
    })
    setName(t.name)
  }, [templateId])

  const handleArrange = useCallback(
    (action) => {
      if (!selectedLayer) return
      const patch = arrangeLayerPatch(template, selectedLayer, action)
      if (patch) setTemplate((prev) => mergeTemplatePatch(prev, patch))
    },
    [template, selectedLayer]
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const key = e.key.toLowerCase()
      for (const tool of Object.values(STUDIO_TOOLS)) {
        if (key === tool.shortcut.toLowerCase()) {
          e.preventDefault()
          setActiveTool(tool.id)
        }
      }
      if (e.key === ']' && !e.shiftKey) {
        e.preventDefault()
        handleArrange('forward')
      }
      if (e.key === '[' && !e.shiftKey) {
        e.preventDefault()
        handleArrange('backward')
      }
      if (e.key === ']' && e.shiftKey) {
        e.preventDefault()
        handleArrange('front')
      }
      if (e.key === '[' && e.shiftKey) {
        e.preventDefault()
        handleArrange('back')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleArrange])

  const layer = template.layers?.[selectedLayer] || {}
  const layerStyle = layer.style || {}
  const layout = template.layout || DEFAULT_MAIN_PAGE_TOP_TEMPLATE.layout
  const isStyle2 = isTop8x7Style2(template)

  const updateLayer = useCallback((layerId, patch) => {
    setTemplate((prev) => ({
      ...prev,
      layers: {
        ...prev.layers,
        [layerId]: {
          ...prev.layers[layerId],
          ...patch,
          style: patch.style
            ? { ...prev.layers[layerId]?.style, ...patch.style }
            : prev.layers[layerId]?.style,
        },
      },
    }))
  }, [])

  const updateLayout = useCallback((patch) => {
    setTemplate((prev) => ({
      ...prev,
      layout: { ...prev.layout, ...patch },
    }))
  }, [])

  const handleSelectLayer = useCallback(
    (layerId) => {
      if (!layerId) {
        setSelectedLayer('')
        return
      }
      if (!layerMatchesTool(layerId, activeTool)) return
      setSelectedLayer(layerId)
    },
    [activeTool]
  )

  const handleSave = () => {
    const saved = saveMainPageTopTemplate({ ...template, name: name || template.name })
    setTemplate(saved)
    onSaved?.(saved)
  }

  const previewProps = useMemo(
    () => ({
      ...contentProp,
      designTemplate: template,
      studioMode: true,
      activeTool,
      onSelectLayer: handleSelectLayer,
    }),
    [contentProp, template, activeTool, handleSelectLayer]
  )

  const patchContent = (patch) => onContentChange?.(patch)

  const isTypographyLayer =
    selectedLayer &&
    layerStyle &&
    (layerStyle.fontSizePx != null ||
      layerStyle.color != null ||
      layerStyle.strokeWidthPx != null)

  const showLayoutPanel =
    !selectedLayer ||
    selectedLayer === 'heroZone' ||
    selectedLayer === 'heroTextCol' ||
    selectedLayer === 'bodyZone'

  const transformEnabled =
    !!selectedLayer &&
    (activeTool === 'select' || layerMatchesTool(selectedLayer, activeTool))

  const canArrange = ARRANGEABLE_LAYER_IDS.includes(selectedLayer)
  const stackOrder = useMemo(() => [...getStackOrder(template)].reverse(), [template])
  const activeLayerPreset = useMemo(() => detectLayerPreset(template), [template])

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(220px,260px)_1fr_minmax(240px,300px)]">
      <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-sm order-2 xl:order-1">
        <h3 className="text-sm font-bold text-slate-900">Content</h3>
        <p className="text-xs text-slate-500">
          {isStyle2 ? 'Style 2 · 8×7in' : 'Style 1 · 8×7in'} — live preview
        </p>
        {isStyle2 ? (
          <>
            <label className="block">
              <span className="text-xs text-slate-500">Top headline — black H1</span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-bold text-slate-900"
                value={contentProp?.dateline || ''}
                onChange={(e) => patchContent({ dateline: e.target.value })}
                placeholder="పర్యావరణహిత టెక్నాలజీతో"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">Main title — red H2, stroke (max 3 words)</span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-lg font-bold text-red-700"
                value={contentProp?.titleImportant || contentProp?.title || ''}
                onChange={(e) =>
                  patchContent({ titleImportant: e.target.value, title: e.target.value })
                }
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">Green band subtitle (max 5 words)</span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                value={contentProp?.titleKicker || contentProp?.subtitle || ''}
                onChange={(e) =>
                  patchContent({ titleKicker: e.target.value, subtitle: e.target.value })
                }
              />
            </label>
          </>
        ) : (
          <>
            <label className="block">
              <span className="text-xs text-slate-500">Title kicker</span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                value={contentProp?.titleKicker || contentProp?.subtitle || ''}
                onChange={(e) =>
                  patchContent({ titleKicker: e.target.value, subtitle: e.target.value })
                }
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">Main title</span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                value={contentProp?.title || ''}
                onChange={(e) => patchContent({ title: e.target.value })}
              />
            </label>
          </>
        )}
        <MainPageTopHeroImagePicker
          value={contentProp?.images?.[0]?.src || ''}
          onChange={(url) =>
            patchContent({
              heroUrl: url,
              images: url ? [{ src: url, alt: 'Hero' }] : [],
            })
          }
        />
        <label className="block">
          <span className="text-xs text-slate-500">Points (one per line)</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm h-24"
            value={
              contentProp?.highlights
                ?.map((h) => (typeof h === 'string' ? h : h?.text || ''))
                .join('\n') || ''
            }
            onChange={(e) =>
              patchContent({
                highlights: e.target.value
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>

        <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 space-y-2">
          <h4 className="text-xs font-bold text-amber-900">
            {isStyle2 ? 'Article body · single column (beside points)' : 'Article body · 2 columns'}
          </h4>
          <p className="text-[11px] text-amber-800/90 leading-snug">
            Default 18px. Press Enter only for a new paragraph (not after every word).
          </p>
          {isStyle2 ? (
            <label className="block">
              <span className="text-xs text-slate-600">Article text</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm h-44 font-[family-name:var(--font-mandali)]"
                value={
                  contentProp?.bodyArticleText ??
                  [contentProp?.bodyLeftText, contentProp?.bodyRightText]
                    .map((s) => String(s || '').trim())
                    .filter(Boolean)
                    .join('\n\n')
                }
                onChange={(e) => {
                  const cleaned = normalizeStyle2ArticleText(e.target.value)
                  patchContent({
                    bodyArticleText: cleaned,
                    bodyLeftText: cleaned,
                    bodyRightText: '',
                  })
                }}
                onFocus={() => setSelectedLayer('bodyLeft')}
              />
            </label>
          ) : (
            <>
              <label className="block">
                <span className="text-xs text-slate-600">Left column</span>
                <textarea
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm h-36 font-[family-name:var(--font-mandali)]"
                  value={contentProp?.bodyLeftText ?? ''}
                  onChange={(e) => patchContent({ bodyLeftText: e.target.value })}
                  onFocus={() => setSelectedLayer('bodyLeft')}
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-600">Right column</span>
                <textarea
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm h-36 font-[family-name:var(--font-mandali)]"
                  value={contentProp?.bodyRightText ?? ''}
                  onChange={(e) => patchContent({ bodyRightText: e.target.value })}
                  onFocus={() => setSelectedLayer('bodyRight')}
                />
              </label>
            </>
          )}
        </div>

        {isStyle2 ? (
          <div className="rounded-lg border border-yellow-300 bg-yellow-50/90 p-3 space-y-2">
            <h4 className="text-xs font-bold text-yellow-900">Lead box (below photo)</h4>
            <label className="block">
              <span className="text-xs text-slate-600">Callout headline</span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-bold"
                value={contentProp?.calloutTitle || ''}
                onChange={(e) => patchContent({ calloutTitle: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Callout bullets (one per line)</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm h-20"
                value={contentProp?.calloutText || ''}
                onChange={(e) => patchContent({ calloutText: e.target.value })}
              />
            </label>
          </div>
        ) : null}

        <label className="block">
          <span className="text-xs text-slate-500">
            {isStyle2 ? 'Jump page (callout badge)' : 'Jump page badge (2nd col bottom-right)'}
          </span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm w-20"
            value={contentProp?.continuedPage || '2'}
            onChange={(e) => patchContent({ continuedPage: e.target.value })}
            placeholder="2"
          />
          <p className="text-[11px] text-slate-500 mt-1">Page number only (e.g. 2).</p>
        </label>
      </aside>

      <div className="min-w-0 order-1 xl:order-2">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="text-sm font-semibold text-slate-700">
            {BLOCK_TOP8X7_DIMENSIONS.widthIn}×{BLOCK_TOP8X7_DIMENSIONS.heightIn} in
          </span>
          <span className="text-xs text-slate-500">
            V/T/I/Z tools · drag move · corner/side resize · ] [ layer order
          </span>
          <label className="text-xs text-slate-500 flex items-center gap-2 ml-auto">
            Zoom
            <input
              type="range"
              min={0.45}
              max={1}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
            {Math.round(zoom * 100)}%
          </label>
        </div>

        <div className="overflow-auto rounded-xl border border-slate-300 bg-slate-200/60 p-5">
          <MainPageTopBlockStudioArrange
            selectedLayer={selectedLayer}
            canArrange={canArrange}
            onArrange={handleArrange}
          />
          <div className={tb.canvasRow}>
            <MainPageTopBlockStudioToolbox activeTool={activeTool} onToolChange={setActiveTool} />
            <div
              className={tb.artboardWrap}
              style={{
                width: nativeW * zoom,
                minHeight: nativeH * zoom,
              }}
            >
              <div
                ref={artboardRef}
                className={tb.artboard}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  width: nativeW,
                  height: nativeH,
                }}
              >
                <MainPageTopBlock {...previewProps} />
                <MainPageTopBlockTransformOverlay
                  artboardRef={artboardRef}
                  selectedLayer={selectedLayer}
                  template={template}
                  onTemplateChange={(next) => {
                    if (typeof next === 'function') setTemplate(next)
                    else setTemplate(next)
                  }}
                  disabled={!transformEnabled}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside className="space-y-3 order-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Template</h3>
          <input
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name"
          />
          <button
            type="button"
            onClick={handleSave}
            className="mt-3 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Save template
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Stack order (front → back)</h3>
          <ul className={`mt-2 ${tb.stackList}`}>
            {stackOrder.map((id) => (
              <li key={`stack-${id}`}>
                <button
                  type="button"
                  className={`${tb.stackItem} ${selectedLayer === id ? tb.stackItemActive : ''}`}
                  onClick={() => handleSelectLayer(id)}
                >
                  <span>{LAYER_LABELS[id] || id}</span>
                  <span className={tb.stackZ}>z{getLayerZIndex(template, id)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Layers</h3>
          <ul className="mt-2 max-h-36 overflow-y-auto text-sm space-y-0.5">
            {['heroZone', 'heroTextCol', 'bodyZone', ...MAIN_PAGE_TOP_LAYER_IDS].map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => handleSelectLayer(id)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg ${
                    selectedLayer === id
                      ? 'bg-blue-50 text-blue-800 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {LAYER_LABELS[id] || id}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {showLayoutPanel ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Layout</h3>
            {(isStyle2
              ? LAYOUT_KEYS.filter(
                  (cfg) =>
                    !['heroShare', 'heroImageWidthPct', 'heroImageHeightPct'].includes(cfg.key)
                )
              : LAYOUT_KEYS
            ).map((cfg) => {
              const raw = layout[cfg.key] ?? (cfg.key === 'titleMaxWidthPx' ? 744 : 0)
              const displayVal =
                cfg.key === 'heroShare'
                  ? `${Math.round(raw * 100)}%`
                  : cfg.suffix
                    ? `${raw}${cfg.suffix}`
                    : raw
              const sliderVal = cfg.key === 'heroShare' ? raw * (cfg.scale || 1) : raw
              return (
                <RangeField
                  key={cfg.key}
                  label={cfg.label}
                  value={sliderVal}
                  display={displayVal}
                  min={cfg.min * (cfg.key === 'heroShare' ? cfg.scale : 1)}
                  max={cfg.max * (cfg.key === 'heroShare' ? cfg.scale : 1)}
                  step={cfg.step * (cfg.key === 'heroShare' ? cfg.scale : 1)}
                  onChange={(v) =>
                    updateLayout({
                      [cfg.key]: cfg.key === 'heroShare' ? v / (cfg.scale || 1) : v,
                    })
                  }
                />
              )
            })}
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-slate-500">Column rule color</span>
              <input
                type="color"
                value={layout.columnRuleColor || '#c4a574'}
                onChange={(e) => updateLayout({ columnRuleColor: e.target.value })}
              />
            </label>
            {isStyle2 ? (
              <>
                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-slate-500">Green band color</span>
                  <input
                    type="color"
                    value={layout.subtitleBarColor || '#1a9e3f'}
                    onChange={(e) => updateLayout({ subtitleBarColor: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-slate-500">Callout box color</span>
                  <input
                    type="color"
                    value={layout.calloutBoxColor || '#f7ea00'}
                    onChange={(e) => updateLayout({ calloutBoxColor: e.target.value })}
                  />
                </label>
                <RangeField
                  label="Photo height % (right column)"
                  value={layout.style2PhotoRowShare ?? 62}
                  min={42}
                  max={78}
                  step={1}
                  display={`${layout.style2PhotoRowShare ?? 62}%`}
                  onChange={(v) => updateLayout({ style2PhotoRowShare: v })}
                />
                <p className="text-[11px] text-slate-500 leading-snug">
                  Yellow lead box stays below the photo; only photo height changes.
                </p>
                <RangeField
                  label="Callout width %"
                  value={layout.calloutWidthPct ?? 36}
                  min={24}
                  max={48}
                  onChange={(v) => updateLayout({ calloutWidthPct: v })}
                />
              </>
            ) : (
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-slate-500">Quote badge color</span>
                <input
                  type="color"
                  value={layout.quoteBadgeColor || '#e85d04'}
                  onChange={(e) => updateLayout({ quoteBadgeColor: e.target.value })}
                />
              </label>
            )}
          </div>
        ) : null}

        {selectedLayer && template.layers[selectedLayer] ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              {LAYER_LABELS[selectedLayer] || selectedLayer}
            </h3>
            {(layer.offsetX || layer.offsetY) ? (
              <p className="text-xs text-slate-500 font-mono">
                Position: {layer.offsetX ?? 0}px, {layer.offsetY ?? 0}px
              </p>
            ) : null}
            {layer.zIndex != null ? (
              <p className="text-xs text-slate-500 font-mono">Stack: z-index {layer.zIndex}</p>
            ) : null}

            {selectedLayer === 'heroImage' ? (
              <div className="space-y-3 border-b border-slate-100 pb-3">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  {isStyle2 ? 'Hero photo (Style 2)' : 'Hero PNG stretch'}
                </p>
                {isStyle2 ? (
                  <RangeField
                    label="Photo height %"
                    value={layout.style2PhotoRowShare ?? 62}
                    min={42}
                    max={78}
                    step={1}
                    display={`${layout.style2PhotoRowShare ?? 62}%`}
                    onChange={(v) => updateLayout({ style2PhotoRowShare: v })}
                  />
                ) : (
                  <>
                    <RangeField
                      label="Width %"
                      value={layout.heroImageWidthPct ?? 48}
                      min={22}
                      max={72}
                      onChange={(v) => updateLayout({ heroImageWidthPct: v })}
                    />
                    <RangeField
                      label="Height %"
                      value={layout.heroImageHeightPct ?? 100}
                      min={35}
                      max={130}
                      onChange={(v) => updateLayout({ heroImageHeightPct: v })}
                    />
                  </>
                )}
                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-slate-500">Fit mode</span>
                  <select
                    className="rounded border border-slate-200 px-2 py-1.5"
                    value={layout.heroImageObjectFit || 'contain'}
                    onChange={(e) => updateLayout({ heroImageObjectFit: e.target.value })}
                  >
                    <option value="contain">Contain (keep ratio)</option>
                    <option value="cover">Cover (crop fill)</option>
                    <option value="fill">Fill (stretch W×H)</option>
                  </select>
                </label>

                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide pt-1">
                  Image edit
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`text-xs px-2.5 py-1 rounded border ${
                      layout.heroImageFlipH
                        ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                    onClick={() => updateLayout({ heroImageFlipH: !layout.heroImageFlipH })}
                  >
                    Flip ↔
                  </button>
                  <button
                    type="button"
                    className={`text-xs px-2.5 py-1 rounded border ${
                      layout.heroImageFlipV
                        ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                    onClick={() => updateLayout({ heroImageFlipV: !layout.heroImageFlipV })}
                  >
                    Flip ↕
                  </button>
                  <button
                    type="button"
                    className="text-xs px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                    onClick={() =>
                      updateLayout({
                        heroImageFlipH: false,
                        heroImageFlipV: false,
                        heroImageRotationDeg: 0,
                        heroImageOpacity: 100,
                        heroImageBrightness: 100,
                        heroImageContrast: 100,
                        heroImageSaturate: 100,
                        heroImageObjectPosition: 'bottom right',
                      })
                    }
                  >
                    Reset edits
                  </button>
                </div>
                <RangeField
                  label="Rotation"
                  value={layout.heroImageRotationDeg ?? 0}
                  display={`${layout.heroImageRotationDeg ?? 0}°`}
                  min={-45}
                  max={45}
                  step={1}
                  onChange={(v) => updateLayout({ heroImageRotationDeg: v })}
                />
                <RangeField
                  label="Opacity"
                  value={layout.heroImageOpacity ?? 100}
                  display={`${layout.heroImageOpacity ?? 100}%`}
                  min={20}
                  max={100}
                  step={1}
                  onChange={(v) => updateLayout({ heroImageOpacity: v })}
                />
                <RangeField
                  label="Brightness"
                  value={layout.heroImageBrightness ?? 100}
                  display={`${layout.heroImageBrightness ?? 100}%`}
                  min={50}
                  max={150}
                  step={1}
                  onChange={(v) => updateLayout({ heroImageBrightness: v })}
                />
                <RangeField
                  label="Contrast"
                  value={layout.heroImageContrast ?? 100}
                  display={`${layout.heroImageContrast ?? 100}%`}
                  min={50}
                  max={150}
                  step={1}
                  onChange={(v) => updateLayout({ heroImageContrast: v })}
                />
                <RangeField
                  label="Saturation"
                  value={layout.heroImageSaturate ?? 100}
                  display={`${layout.heroImageSaturate ?? 100}%`}
                  min={0}
                  max={150}
                  step={1}
                  onChange={(v) => updateLayout({ heroImageSaturate: v })}
                />
                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-slate-500">PNG anchor in frame</span>
                  <select
                    className="rounded border border-slate-200 px-2 py-1.5"
                    value={layout.heroImageObjectPosition || 'bottom right'}
                    onChange={(e) => updateLayout({ heroImageObjectPosition: e.target.value })}
                  >
                    <option value="bottom right">Bottom right</option>
                    <option value="bottom center">Bottom center</option>
                    <option value="bottom left">Bottom left</option>
                    <option value="center right">Center right</option>
                    <option value="center">Center</option>
                    <option value="top right">Top right</option>
                  </select>
                </label>
                <RangeField
                  label="Points ↔ subject gap"
                  value={layout.heroTextGapPx ?? 12}
                  display={`${layout.heroTextGapPx ?? 12}px`}
                  min={4}
                  max={48}
                  step={1}
                  onChange={(v) => updateLayout({ heroTextGapPx: v })}
                />
                <RangeField
                  label="Subject edge (alpha)"
                  value={layout.heroImageAlphaThreshold ?? 32}
                  display={`${layout.heroImageAlphaThreshold ?? 32}`}
                  min={8}
                  max={120}
                  step={1}
                  onChange={(v) => updateLayout({ heroImageAlphaThreshold: v })}
                />
                <p className="text-[11px] text-slate-500 leading-snug">
                  Points only: runaround the cutout subject (white area near PNG is OK). Lower alpha
                  = tighter wrap on hair/edges.
                </p>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Image + title రెండూ కావాలి: newspaper లో title stroke PNG వెనుక, points ముందు.
                  మీరు title ముందు కావాలంటే అది వేరు preset.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`text-xs px-2 py-1 rounded border ${
                      activeLayerPreset === 'titleBehindPng'
                        ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold'
                        : 'border-slate-200 bg-slate-50 hover:bg-blue-50'
                    }`}
                    onClick={() => {
                      const patch = applyLayerPresetPatch('titleBehindPng')
                      if (patch) setTemplate((prev) => mergeTemplatePatch(prev, patch))
                    }}
                  >
                    Title behind PNG
                  </button>
                  <button
                    type="button"
                    className={`text-xs px-2 py-1 rounded border ${
                      activeLayerPreset === 'titleInFront'
                        ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold'
                        : 'border-slate-200 bg-slate-50 hover:bg-blue-50'
                    }`}
                    onClick={() => {
                      const patch = applyLayerPresetPatch('titleInFront')
                      if (patch) setTemplate((prev) => mergeTemplatePatch(prev, patch))
                    }}
                  >
                    Title in front
                  </button>
                </div>
              </div>
            ) : null}

            {isTypographyLayer ? (
              <div className="space-y-3 border-b border-slate-100 pb-3">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Typography
                </p>
                {layerStyle.fontSizePx != null ? (
                  <RangeField
                    label="Font size"
                    value={layerStyle.fontSizePx}
                    display={`${layerStyle.fontSizePx}px`}
                    min={8}
                    max={96}
                    step={1}
                    onChange={(v) => updateLayer(selectedLayer, { style: { fontSizePx: v } })}
                  />
                ) : null}
                {layerStyle.color != null ? (
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-slate-500">Color</span>
                    <input
                      type="color"
                      value={layerStyle.color}
                      onChange={(e) =>
                        updateLayer(selectedLayer, { style: { color: e.target.value } })
                      }
                    />
                  </label>
                ) : null}
                {layerStyle.strokeWidthPx != null ? (
                  <>
                    <RangeField
                      label="Stroke width"
                      value={layerStyle.strokeWidthPx}
                      display={`${layerStyle.strokeWidthPx}px`}
                      min={0}
                      max={24}
                      onChange={(v) =>
                        updateLayer(selectedLayer, { style: { strokeWidthPx: v } })
                      }
                    />
                    <label className="flex flex-col gap-1 text-xs">
                      <span className="text-slate-500">Stroke color</span>
                      <input
                        type="color"
                        value={layerStyle.strokeColor || '#ffffff'}
                        onChange={(e) =>
                          updateLayer(selectedLayer, {
                            style: { strokeColor: e.target.value },
                          })
                        }
                      />
                    </label>
                  </>
                ) : null}
              </div>
            ) : selectedLayer === 'quoteMark' ? (
              <div className="space-y-2">
                <RangeField
                  label="Badge size"
                  value={layerStyle.fontSizePx || 17}
                  min={12}
                  max={44}
                  onChange={(v) => updateLayer(selectedLayer, { style: { fontSizePx: v } })}
                />
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Drag the blue box on canvas to move or resize. Use Layout for zone height.
              </p>
            )}
            <button
              type="button"
              className="text-xs text-blue-700 font-medium"
              onClick={() =>
                updateLayer(selectedLayer, { offsetX: 0, offsetY: 0 })
              }
            >
              Reset position offset
            </button>
          </div>
        ) : null}

        <div className="rounded-xl border border-amber-100 bg-amber-50/90 p-3 text-xs text-amber-950 leading-relaxed">
          <strong>InDesign-style:</strong> Drag to move · corners/sides to resize · Hero side handles
          = width/height · <strong>Send backward</strong> on title puts it behind PNG ·{' '}
          <strong>Fill</strong> stretch for newspaper cutout.
        </div>
      </aside>
    </div>
  )
}
