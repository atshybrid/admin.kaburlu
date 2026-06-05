import React, { useLayoutEffect, useRef, useState } from 'react'
import {
  buildInnerPageRowLayout,
  columnGutterPx,
} from '../../lib/epaper/collectNewsLayout'

function TruncationRuler() {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <div style={{ height: 3, background: '#b91c1c' }} />
      <div
        style={{
          background: '#b91c1c',
          color: '#fff',
          padding: '3px 5px',
          fontSize: 7,
          fontWeight: 800,
        }}
      >
        ✂ INCOMPLETE — jump to next page
      </div>
    </div>
  )
}

function ArticleCanvasCell({
  placement,
  article,
  cellW,
  cellH,
  layoutTruncated,
  selectedPlacementId,
  onSelectPlacement,
  onRemovePlacement,
  CanvasBlockPreview,
}) {
  const wrapRef = useRef(null)
  const [domOverflow, setDomOverflow] = useState(false)
  const isActive = selectedPlacementId === placement.id
  const showRuler = layoutTruncated || domOverflow

  useLayoutEffect(() => {
    let cancelled = false
    const measure = () => {
      const inner = wrapRef.current?.querySelector('[data-epaper-block-inner]')
      if (!inner || cancelled) return
      const sc = Number(inner.getAttribute('data-scale')) || 1
      const nh = Number(inner.getAttribute('data-natural-h')) || 1
      setDomOverflow(nh * sc > cellH + 6)
    }
    measure()
    const t1 = requestAnimationFrame(measure)
    const t2 = setTimeout(measure, 200)
    return () => {
      cancelled = true
      cancelAnimationFrame(t1)
      clearTimeout(t2)
    }
  }, [cellW, cellH, placement?.id, article?.id, placement?.blockCode])

  return (
    <div
      style={{
        width: cellW,
        height: cellH,
        flexShrink: 0,
        boxSizing: 'border-box',
        position: 'relative',
        cursor: 'pointer',
        outline: isActive ? '2px solid #2563eb' : showRuler ? '2px solid #b91c1c' : 'none',
        overflow: 'hidden',
        backgroundColor: '#fff',
      }}
      onClick={() => onSelectPlacement?.(placement.id)}
    >
      <div ref={wrapRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        <CanvasBlockPreview placement={placement} article={article} cellW={cellW} cellH={cellH} />
      </div>
      {showRuler ? <TruncationRuler /> : null}
      <button
        type="button"
        style={{
          position: 'absolute',
          top: 2,
          right: 2,
          zIndex: 25,
          background: showRuler ? '#b91c1c' : 'rgba(15,23,42,0.75)',
          color: '#fff',
          border: 'none',
          borderRadius: 2,
          fontSize: 8,
          padding: '1px 4px',
          cursor: 'pointer',
          fontWeight: 700,
        }}
        onClick={(e) => {
          e.stopPropagation()
          onRemovePlacement?.(placement.id)
        }}
      >
        ✕
      </button>
    </div>
  )
}

/** Broadsheet inner page — full-article rows only (12 · 6+6 · 8+4), no brief rail. */
export default function InnerPageArticleGrid({
  placements = [],
  articles = [],
  articleAreaH,
  totalWidthPx,
  layoutScale = 24,
  rowWidthIn = 12,
  selectedPlacementId,
  onSelectPlacement,
  onRemovePlacement,
  CanvasBlockPreview,
}) {
  const rows = buildInnerPageRowLayout({
    placements,
    articleAreaH,
    totalWidthPx,
    rowWidthIn,
    articles,
    layoutScale,
  })
  const colGutter = columnGutterPx(layoutScale)

  return (
    <div
      style={{
        width: '100%',
        height: articleAreaH,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#334155',
        boxSizing: 'border-box',
      }}
    >
      {rows.map((row, ri) => {
        const gutter = row.colGutter ?? colGutter
        const isLastRow = ri === rows.length - 1

        return (
          <div
            key={`row-${ri}`}
            style={{
              width: '100%',
              height: row.heightPx,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'row',
              overflow: 'hidden',
              borderBottom: isLastRow ? 'none' : '1px solid rgba(148, 163, 184, 0.85)',
            }}
          >
            {row.cells.map((cell, ci) => (
              <React.Fragment key={cell.placement.id}>
                <ArticleCanvasCell
                  placement={cell.placement}
                  article={cell.article}
                  cellW={cell.cellW}
                  cellH={cell.heightPx}
                  layoutTruncated={cell.layoutTruncated}
                  selectedPlacementId={selectedPlacementId}
                  onSelectPlacement={onSelectPlacement}
                  onRemovePlacement={onRemovePlacement}
                  CanvasBlockPreview={CanvasBlockPreview}
                />
                {ci < row.cells.length - 1 ? (
                  <div
                    aria-hidden
                    style={{ width: gutter, flexShrink: 0, background: 'rgba(148, 163, 184, 0.85)' }}
                  />
                ) : null}
              </React.Fragment>
            ))}
          </div>
        )
      })}
    </div>
  )
}
