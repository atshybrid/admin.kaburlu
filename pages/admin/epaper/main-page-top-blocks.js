/**
 * Main Page Top Blocks — template table + InDesign-style studio (BLOCK-TOP8x7).
 * Templates stored in localStorage until backend table is wired.
 */
import React, { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import MainPageTopBlock from '../../../components/epaper/MainPageTopBlock'
import MainPageTopBlockStudio from '../../../components/epaper/MainPageTopBlockStudio'
import MainPageTopHeroImagePicker from '../../../components/epaper/MainPageTopHeroImagePicker'
import { BLOCK_TOP8X7_DIMENSIONS } from '../../../lib/epaper/mainPageTopBlockRules'
import {
  listMainPageTopTemplates,
  duplicateMainPageTopTemplate,
  deleteMainPageTopTemplate,
  exportMainPageTopTemplatesJson,
  importMainPageTopTemplatesJson,
  getMainPageTopTemplate,
} from '../../../lib/epaper/mainPageTopBlockStore'
import { BLOCK_SAMPLES } from '../../../lib/epaper/blockSamples'
import { seedTopBlockBodyColumns } from '../../../lib/epaper/mainPageTopBlockContent'
import { mergeStyle2ArticleBody } from '../../../lib/epaper/mainPageTopStyle2Text'
import { MAIN_PAGE_TOP_STYLE2_SAMPLE } from '../../../lib/epaper/mainPageTopStyle2Sample'
import { DEFAULT_MAIN_PAGE_TOP_TEMPLATE_STYLE2 } from '../../../lib/epaper/mainPageTopBlockRules'

const SAMPLE = BLOCK_SAMPLES['BLOCK-TOP8x7']?.props || {}

function sampleWithBodyColumns(sample, { style2 = false } = {}) {
  const hasPoints = (sample.highlights || []).length > 0
  const firstPara = (sample.paragraphs || [])
    .map((p) => String(p?.content ?? p ?? '').trim())
    .find(Boolean)
  const bodyCols = seedTopBlockBodyColumns({
    paragraphs: sample.paragraphs,
    quoteText: sample.quoteText,
    skipFirstParagraph: !hasPoints && !!firstPara,
  })
  if (style2) {
    const article = mergeStyle2ArticleBody(bodyCols.bodyLeftText, bodyCols.bodyRightText)
    return {
      ...sample,
      ...bodyCols,
      bodyArticleText: article,
      bodyLeftText: article,
      bodyRightText: '',
    }
  }
  return { ...sample, ...bodyCols }
}

export default function MainPageTopBlocksPage() {
  const [templates, setTemplates] = useState([])
  const [activeId, setActiveId] = useState('default-top8x7-style2')
  const [previewZoom, setPreviewZoom] = useState(0.55)
  const [content, setContent] = useState(() =>
    sampleWithBodyColumns(MAIN_PAGE_TOP_STYLE2_SAMPLE, { style2: true })
  )
  const [heroUrl, setHeroUrl] = useState(
    MAIN_PAGE_TOP_STYLE2_SAMPLE.images?.[0]?.src || ''
  )
  const [pointsText, setPointsText] = useState(
    (MAIN_PAGE_TOP_STYLE2_SAMPLE.highlights || []).join('\n')
  )
  const [tab, setTab] = useState('studio')

  const refresh = useCallback(() => {
    const list = listMainPageTopTemplates()
    setTemplates(list)
    if (!list.find((t) => t.id === activeId) && list[0]) setActiveId(list[0].id)
  }, [activeId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const designTemplate = getMainPageTopTemplate(activeId)

  const previewProps = {
    ...content,
    images: heroUrl ? [{ src: heroUrl, alt: 'Hero PNG' }] : [],
    highlights: pointsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    designTemplate,
  }

  const handleExport = () => {
    const blob = new Blob([exportMainPageTopTemplatesJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'main-page-top-templates.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        importMainPageTopTemplatesJson(reader.result)
        refresh()
      } catch (err) {
        alert(err.message || 'Import failed')
      }
    }
    reader.readAsText(file)
  }

  return (
    <DashboardLayout title="Main page top blocks">
      <Head>
        <title>Main page top blocks | ePaper</title>
      </Head>

      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Main page top blocks</h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              BLOCK-TOP8x7 — {BLOCK_TOP8X7_DIMENSIONS.widthIn}×{BLOCK_TOP8X7_DIMENSIONS.heightIn} in max.
              Style 1 (stroke title + PNG) or Style 2 (green band + yellow callout). Same studio controls;
              templates in this browser.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveId('default-top8x7')
                  setContent(sampleWithBodyColumns(SAMPLE))
                  setHeroUrl(SAMPLE.images?.[0]?.src || '')
                  setPointsText((SAMPLE.highlights || []).join('\n'))
                }}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold ${
                  activeId === 'default-top8x7'
                    ? 'border-red-600 bg-red-50 text-red-800'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                Style 1
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = MAIN_PAGE_TOP_STYLE2_SAMPLE
                  setActiveId(DEFAULT_MAIN_PAGE_TOP_TEMPLATE_STYLE2.id)
                  setContent(sampleWithBodyColumns(s, { style2: true }))
                  setHeroUrl(s.images?.[0]?.src || '')
                  setPointsText((s.highlights || []).join('\n'))
                }}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold ${
                  activeId === DEFAULT_MAIN_PAGE_TOP_TEMPLATE_STYLE2.id
                    ? 'border-green-700 bg-green-50 text-green-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                Style 2
              </button>
            </div>
          </div>
          <Link
            href="/admin/epaper/block-style"
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            ← Block style workbench
          </Link>
        </div>

        <div className="flex gap-2 border-b border-slate-200">
          {[
            { id: 'studio', label: 'Design studio' },
            { id: 'preview', label: 'Preview' },
            { id: 'table', label: 'Template table' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-red-600 text-red-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'table' && (
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-wrap gap-2 p-4 border-b border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => {
                  const dup = duplicateMainPageTopTemplate(activeId)
                  setActiveId(dup.id)
                  refresh()
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium"
              >
                Duplicate selected
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium"
              >
                Export JSON
              </button>
              <label className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium cursor-pointer">
                Import JSON
                <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
              </label>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-t border-slate-100 ${
                      row.id === activeId ? 'bg-red-50/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.id}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {BLOCK_TOP8X7_DIMENSIONS.widthIn}×{BLOCK_TOP8X7_DIMENSIONS.heightIn} in
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setActiveId(row.id)}
                        className="text-blue-700 font-medium mr-3"
                      >
                        Use
                      </button>
                      {!['default-top8x7', 'default-top8x7-style2'].includes(row.id) ? (
                        <button
                          type="button"
                          onClick={() => {
                            deleteMainPageTopTemplate(row.id)
                            refresh()
                          }}
                          className="text-red-600 font-medium"
                        >
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {tab === 'studio' && (
          <MainPageTopBlockStudio
            templateId={activeId}
            content={previewProps}
            onContentChange={(patch) => {
              if (patch.titleKicker !== undefined || patch.subtitle !== undefined) {
                const k = patch.titleKicker ?? patch.subtitle
                setContent((c) => ({ ...c, titleKicker: k, subtitle: k }))
              }
              if (patch.title !== undefined) {
                setContent((c) => ({ ...c, title: patch.title }))
              }
              if (patch.heroUrl !== undefined || patch.images !== undefined) {
                const url = patch.heroUrl ?? patch.images?.[0]?.src ?? ''
                setHeroUrl(url)
              }
              if (patch.highlights !== undefined) {
                setPointsText(patch.highlights.join('\n'))
              }
              if (patch.continuedPage !== undefined) {
                setContent((c) => ({ ...c, continuedPage: patch.continuedPage }))
              }
              if (patch.dateline !== undefined) {
                setContent((c) => ({ ...c, dateline: patch.dateline }))
              }
              if (patch.calloutTitle !== undefined) {
                setContent((c) => ({ ...c, calloutTitle: patch.calloutTitle }))
              }
              if (patch.calloutText !== undefined) {
                setContent((c) => ({ ...c, calloutText: patch.calloutText }))
              }
              if (patch.titleImportant !== undefined) {
                setContent((c) => ({
                  ...c,
                  titleImportant: patch.titleImportant,
                  title: patch.title ?? patch.titleImportant,
                }))
              }
              if (patch.bodyArticleText !== undefined) {
                setContent((c) => ({
                  ...c,
                  bodyArticleText: patch.bodyArticleText,
                  bodyLeftText: patch.bodyArticleText,
                  bodyRightText: '',
                }))
              }
              if (
                patch.bodyLeftText !== undefined ||
                patch.bodyRightText !== undefined ||
                patch.bodyQuoteText !== undefined ||
                patch.quoteAttribution !== undefined
              ) {
                setContent((c) => ({
                  ...c,
                  ...(patch.bodyLeftText !== undefined
                    ? {
                        bodyLeftText: patch.bodyLeftText,
                        bodyArticleText: patch.bodyLeftText,
                      }
                    : {}),
                  ...(patch.bodyRightText !== undefined
                    ? { bodyRightText: patch.bodyRightText }
                    : {}),
                  ...(patch.bodyQuoteText !== undefined
                    ? { bodyQuoteText: patch.bodyQuoteText, quoteText: patch.bodyQuoteText }
                    : {}),
                  ...(patch.quoteAttribution !== undefined
                    ? { quoteAttribution: patch.quoteAttribution }
                    : {}),
                }))
              }
            }}
            onSaved={() => refresh()}
          />
        )}

        {tab === 'preview' && (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 text-sm">
              <h3 className="font-bold text-slate-900">Sample content</h3>
              <label className="block">
                <span className="text-slate-500 text-xs">Title kicker</span>
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                  value={content.titleKicker || ''}
                  onChange={(e) => setContent((c) => ({ ...c, titleKicker: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-slate-500 text-xs">Main title</span>
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                  value={content.title || ''}
                  onChange={(e) => setContent((c) => ({ ...c, title: e.target.value }))}
                />
              </label>
              <MainPageTopHeroImagePicker value={heroUrl} onChange={setHeroUrl} />
              <label className="block">
                <span className="text-slate-500 text-xs">Points (one per line)</span>
                <textarea
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 h-20"
                  value={pointsText}
                  onChange={(e) => setPointsText(e.target.value)}
                />
              </label>
              <p className="text-xs text-slate-500">
                Clear points to preview lead paragraph instead.
              </p>
              <label className="block">
                <span className="text-slate-500 text-xs">Body left column</span>
                <textarea
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 h-28 text-sm"
                  value={content.bodyLeftText ?? ''}
                  onChange={(e) =>
                    setContent((c) => ({ ...c, bodyLeftText: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                <span className="text-slate-500 text-xs">Body right column</span>
                <textarea
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 h-28 text-sm"
                  value={content.bodyRightText ?? ''}
                  onChange={(e) =>
                    setContent((c) => ({ ...c, bodyRightText: e.target.value }))
                  }
                />
              </label>
            </aside>
            <div className="rounded-xl border border-slate-200 bg-slate-100/80 p-6 overflow-auto">
              <div className="mb-3 flex items-center gap-3 text-sm text-slate-600">
                <span>Zoom</span>
                <input
                  type="range"
                  min={0.35}
                  max={1}
                  step={0.05}
                  value={previewZoom}
                  onChange={(e) => setPreviewZoom(Number(e.target.value))}
                />
                {Math.round(previewZoom * 100)}%
              </div>
              <div
                style={{
                  transform: `scale(${previewZoom})`,
                  transformOrigin: 'top left',
                  width: BLOCK_TOP8X7_DIMENSIONS.nativeWidthPx,
                }}
              >
                <MainPageTopBlock {...previewProps} />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
