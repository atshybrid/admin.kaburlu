/**
 * ePaper Block Template Design Studio
 * Preview and evaluate each block type with realistic Telugu sample content.
 * Use this page to approve block designs before wiring them into page-layout logic.
 */
import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { BLOCK_SAMPLES as SAMPLES, BLOCK_ORDER, BLOCK_COLORS } from '../../../lib/epaper/blockSamples'

export default function BlockTemplates() {
  const [active, setActive] = useState('BLOCK-04A')
  const [zoom, setZoom] = useState(0.6)

  const activeSample = SAMPLES[active]
  const BlockComp = activeSample.component

  return (
    <DashboardLayout title="Block Templates — ePaper Design Studio">
      <Head>
        <title>Block Templates | ePaper Studio</title>
      </Head>

      <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside style={{
          width: 220,
          flexShrink: 0,
          background: '#0f172a',
          color: '#e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #1e293b',
        }}>
          <div style={{ padding: '16px 16px 10px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#64748b', textTransform: 'uppercase' }}>Block Types</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>Click to preview</div>
          </div>

          <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {BLOCK_ORDER.map(code => {
              const s = SAMPLES[code]
              const isActive = active === code
              return (
                <button
                  key={code}
                  onClick={() => setActive(code)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    background: isActive ? '#1e293b' : 'transparent',
                    borderLeft: `3px solid ${isActive ? BLOCK_COLORS[code] : 'transparent'}`,
                    border: 'none',
                    borderLeft: `3px solid ${isActive ? BLOCK_COLORS[code] : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-block',
                      width: 8, height: 8,
                      borderRadius: '50%',
                      background: BLOCK_COLORS[code],
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#f1f5f9' : '#94a3b8' }}>{code}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 3, paddingLeft: 16 }}>{s.label.split('·').slice(1).join('·').trim()}</div>
                </button>
              )
            })}
          </nav>

          {/* Zoom control */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #1e293b' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Zoom: {Math.round(zoom * 100)}%</div>
            <input
              type="range"
              min={0.25}
              max={1}
              step={0.05}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              style={{ width: '100%', accentColor: BLOCK_COLORS[active] }}
            />
          </div>
        </aside>

        {/* ── MAIN PANEL ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f1f5f9' }}>

          {/* Top bar */}
          <div style={{
            background: '#fff',
            borderBottom: '1px solid #e2e8f0',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexShrink: 0,
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: BLOCK_COLORS[active],
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              padding: '4px 12px',
              borderRadius: 6,
            }}>
              {active}
            </span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{activeSample.label}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{activeSample.description}</div>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <Link
                href="/admin/epaper/design"
                style={{
                  fontSize: 12,
                  color: '#6366f1',
                  textDecoration: 'none',
                  padding: '6px 14px',
                  border: '1px solid #6366f1',
                  borderRadius: 6,
                  fontWeight: 500,
                }}
              >
                → Open Design Studio
              </Link>
            </div>
          </div>

          {/* Canvas area */}
          <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>

            {/* Spec badges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Block Code', val: active },
                { label: 'Width', val: `${activeSample.nativeW}px native` },
                { label: 'Category', val: activeSample.props.category },
                { label: 'Columns', val: active === 'BLOCK-02A' || active === 'BLOCK-03A' ? '1 col' : active === 'BLOCK-12A' ? '4 col' : active === 'BLOCK-09A' ? '3 col' : '2 col' },
              ].map(b => (
                <span key={b.label} style={{
                  background: '#e2e8f0',
                  color: '#334155',
                  fontSize: 11,
                  fontWeight: 500,
                  padding: '3px 10px',
                  borderRadius: 20,
                }}>
                  <span style={{ color: '#64748b' }}>{b.label}: </span>{b.val}
                </span>
              ))}
            </div>

            {/* Rendered block */}
            <div style={{ position: 'relative' }}>
              {/* Newspaper-white background, shadowed card */}
              <div style={{
                display: 'inline-block',
                background: '#fffef9',
                boxShadow: '0 4px 32px rgba(0,0,0,0.14)',
                transformOrigin: 'top left',
                transform: `scale(${zoom})`,
                /* keep layout flow correct even when scaled */
                marginBottom: `calc((${activeSample.nativeW}px * ${zoom} - ${activeSample.nativeW}px))`,
              }}>
                <BlockComp {...activeSample.props} />
              </div>
            </div>

          </div>
        </div>

        {/* ── RIGHT PANEL — props inspector ── */}
        <aside style={{
          width: 280,
          flexShrink: 0,
          background: '#0f172a',
          color: '#e2e8f0',
          overflowY: 'auto',
          borderLeft: '1px solid #1e293b',
          fontSize: 12,
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e293b', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', color: '#64748b', textTransform: 'uppercase' }}>
            Sample Props
          </div>
          <div style={{ padding: 16 }}>
            {Object.entries(activeSample.props).map(([key, val]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{key}</div>
                <div style={{
                  background: '#1e293b',
                  borderRadius: 6,
                  padding: '8px 10px',
                  color: '#94a3b8',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 120,
                  overflowY: 'auto',
                }}>
                  {Array.isArray(val)
                    ? val.length === 0
                      ? '[]'
                      : val.map((v, i) => (
                          <div key={i} style={{ borderBottom: i < val.length - 1 ? '1px solid #334155' : 'none', paddingBottom: 4, marginBottom: 4 }}>
                            {typeof v === 'object' ? JSON.stringify(v, null, 2) : `"${v}"`}
                          </div>
                        ))
                    : typeof val === 'object'
                      ? JSON.stringify(val, null, 2)
                      : `"${val}"`}
                </div>
              </div>
            ))}
          </div>

          {/* All blocks quick nav */}
          <div style={{ padding: '0 16px 16px', borderTop: '1px solid #1e293b', paddingTop: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>All Templates</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {BLOCK_ORDER.map(code => (
                <button
                  key={code}
                  onClick={() => setActive(code)}
                  style={{
                    background: active === code ? BLOCK_COLORS[code] : '#1e293b',
                    color: active === code ? '#fff' : '#94a3b8',
                    border: 'none',
                    borderRadius: 4,
                    padding: '4px 8px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {code.replace('BLOCK-', '')}
                </button>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </DashboardLayout>
  )
}
