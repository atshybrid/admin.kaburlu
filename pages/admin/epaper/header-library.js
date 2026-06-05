/**
 * ePaper Header Library — same automation canvas as Design Studio.
 * Dimensions from lib/epaper/epaperPageSpec.js:
 *   Broadsheet main 14.5×2.5 in · sub 14.5×1 in
 *   Tabloid    main 11×1.75 in · sub 11×0.60 in
 */
import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { getToken } from '../../../utils/auth'

function getApiBase() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://app.kaburlumedia.com').replace(/\/$/, '') + '/api/v1'
}

// Dimensions from lib/epaper/epaperPageSpec.js (automation canvas)
const DEFAULT = {
  paperName:      'కాబుర్లు టుడే',
  paperNameEn:    'Kaburlu Today',
  sectionName:    'రాజకీయాలు',
  publishedAreas: 'Hyderabad • Warangal • Karimnagar • Khammam • Nalgonda',
  date:           '1 మే 2026, గురువారం',
  volume:         'సంపుటి 14',
  issue:          'సంచిక 236',
  price:          '₹5.00',
  pageNumber:     '2',
  logoUrl:        '',
  subHeaderLogoUrl: '',
  mainHeaderImageUrl: '',
  subHeaderImageUrl: '',
  paperNameImageUrl: '',
  adLeftUrl:      '',
  adRightUrl:     '',
  adUrl:          '',
  accentColor:    '#dc2626',
  runningCommentText: 'జర్నలిజం పడలు\nప్రారంభించిన అమెరికా\nఅనుకూల భాషనే\nపెట్టిన పలక',
  runningCommentAuthor: '- సి.ఎన్.రంగనాథ్',
  rightArticleTitle: 'కరోనా విజృంభణపై కేంద్ర అప్రమత్తం',
  rightArticlePoints: 'నిశితంగా గమనిస్తున్నామని\nకేంద్ర ఆరోగ్య శాఖ\nదేశంలో కరోనా పెరుగుదల',
  websiteUrl:     'www.teluguprabha.net',
  tagline:        'మన భాష.. మన పత్రిక',
}

import { MAIN_STYLES, SUB_STYLES } from '../../../components/epaper/HeaderStyles'
import { getHeaderSlotPx, headerDimLabel } from '../../../lib/epaper/epaperPageSpec'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'

const FONT_SANS = "'Inter', system-ui, sans-serif"

const UI = {
  pageBg: '#f1f5f9',
  panelBg: '#ffffff',
  panelBorder: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  textDim: '#94a3b8',
  inputBg: '#ffffff',
  inputBorder: '#cbd5e1',
  canvasBg: '#e2e8f0',
  accent: '#2563eb',
  activeRow: '#eff6ff',
}

const FLD_STYLE = {
  width: '100%', background: UI.inputBg, border: `1px solid ${UI.inputBorder}`,
  borderRadius: 8, color: UI.text, fontSize: 12, padding: '6px 10px',
  fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
}
const LBL_STYLE = {
  fontSize: 10, fontWeight: 700, color: UI.textMuted,
  textTransform: 'uppercase', letterSpacing: '0.07em',
  display: 'block', marginBottom: 3,
}
function EditField({ label, value, onChange, textarea }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <label style={LBL_STYLE}>{label}</label>
      {textarea
        ? <textarea rows={2} value={value} onChange={e => onChange(e.target.value)} style={{ ...FLD_STYLE, resize: 'vertical' }} />
        : <input value={value} onChange={e => onChange(e.target.value)} style={FLD_STYLE} />}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HeaderLibrary() {
  const [tab, setTab]           = useState('main')        // 'main' | 'sub'
  const [pageType, setPageType] = useState('tabloid')     // 'tabloid' | 'broadsheet'
  const [activeKey, setActiveKey] = useState('main_style1')
  const [zoom, setZoom]         = useState(0.55)
  const [settings, setSettings] = useState({ ...DEFAULT })
  const [savedMain, setSavedMain] = useState(null)  // e.g. 'main_style3'
  const [savedSub, setSavedSub]   = useState(null)  // e.g. 'sub_header_style5'
  const [saving, setSaving]       = useState(false)
  const [saveMsg, setSaveMsg]     = useState('')
  const [uploadingField, setUploadingField] = useState('')

  // Load saved style numbers from backend on mount
  useEffect(() => {
    const auth = getToken()
    if (!auth?.token) return
    fetch(`${getApiBase()}/epaper/newspaper-config`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.config) return
        const { headerStyleNumber, subHeaderStyleNumber } = data.config
        if (headerStyleNumber)    setSavedMain(`main_style${headerStyleNumber}`)
        if (subHeaderStyleNumber) setSavedSub(`sub_header_style${subHeaderStyleNumber}`)
      })
      .catch(() => {})
  }, [])

  async function saveStyle() {
    const auth = getToken()
    if (!auth?.token) { setSaveMsg('Not logged in'); return }
    setSaving(true)
    setSaveMsg('')
    const num = parseInt(activeKey.match(/\d+$/)?.[0] || '1', 10)
    const body = tab === 'main'
      ? { headerStyleNumber: num }
      : { subHeaderStyleNumber: num }
    try {
      const r = await fetch(`${getApiBase()}/epaper/newspaper-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify(body),
      })
      if (r.ok) {
        if (tab === 'main') setSavedMain(activeKey)
        else setSavedSub(activeKey)
        setSaveMsg('Saved!')
        setTimeout(() => setSaveMsg(''), 2500)
      } else {
        const j = await r.json().catch(() => ({}))
        setSaveMsg(j.error || 'Save failed')
      }
    } catch {
      setSaveMsg('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function uploadImageForField(file, fieldName) {
    if (!file) return
    const auth = getToken()
    if (!auth?.token) {
      setSaveMsg('Not logged in')
      return
    }
    setUploadingField(fieldName)
    setSaveMsg('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', `epaper/header-library/${tab}`)
      fd.append('kind', 'image')
      const r = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.token}` },
        body: fd,
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error(j?.message || j?.error || 'Upload failed')
      }
      const data = await r.json()
      const url = data.internalUrl || data.publicUrl || data.url || data.data?.internalUrl || data.data?.publicUrl || data.data?.url
      if (!url) throw new Error('Upload URL missing')
      setSettings((p) => ({ ...p, [fieldName]: url }))
      setSaveMsg('Image uploaded')
      setTimeout(() => setSaveMsg(''), 2000)
    } catch (e) {
      setSaveMsg(e?.message || 'Upload failed')
    } finally {
      setUploadingField('')
    }
  }

  const handleTabChange = t => {
    setTab(t)
    setActiveKey(t === 'main' ? 'main_style1' : 'sub_header_style1')
  }

  const savedKey = tab === 'main' ? savedMain : savedSub
  const styles     = tab === 'main' ? MAIN_STYLES : SUB_STYLES
  const activeStyle = styles[activeKey]
  const HeaderComp  = activeStyle?.component
  const forcedImageUrl = tab === 'main' ? settings.mainHeaderImageUrl : settings.subHeaderImageUrl

  const preset = pageType === 'tabloid' ? 'TABLOID' : 'BROADSHEET'
  const headerKind = tab === 'main' ? 'main' : 'sub'
  const { width: naturalW, height: naturalH } = getHeaderSlotPx(preset, headerKind)
  const displayW = Math.round(naturalW * zoom)
  const displayH = Math.round(naturalH * zoom)
  const dimLabel = `${headerDimLabel(preset, headerKind)} (${pageType})`

  return (
    <DashboardLayout title="ePaper Header Library">
      <Head>
        <title>ePaper Header Library</title>
        <link href="https://fonts.googleapis.com/css2?family=Mandali&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 120px)', overflow: 'hidden', fontFamily: FONT_SANS, background: UI.pageBg, color: UI.text, borderRadius: 12, border: `1px solid ${UI.panelBorder}` }}>

        {/* ══ LEFT — style selector ══ */}
        <aside style={{ width: 210, flexShrink: 0, background: UI.panelBg, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${UI.panelBorder}` }}>
          <div style={{ padding: '12px 14px 8px', borderBottom: `1px solid ${UI.panelBorder}` }}>
            <Link href="/admin/epaper/design" style={{ fontSize: 10, color: UI.textMuted, textDecoration: 'none', display: 'block', marginBottom: 6 }}>← Epaper Design Studio</Link>
            <div style={{ fontSize: 13, fontWeight: 700, color: UI.text }}>Header Library</div>
            <div style={{ fontSize: 10, color: UI.textMuted, marginTop: 2 }}>Same canvas spec as Design Studio</div>
          </div>

          <div style={{ display: 'flex', borderBottom: `1px solid ${UI.panelBorder}`, flexShrink: 0 }}>
            {[
              { id: 'main', label: 'Main Page', sub: 'Front 2.5 / 1.75 in' },
              { id: 'sub',  label: 'Sub Header', sub: 'Inner 1 / 0.60 in' },
            ].map(t => (
              <button key={t.id} onClick={() => handleTabChange(t.id)} style={{
                flex: 1, padding: '9px 4px 7px', border: 'none', background: 'transparent', cursor: 'pointer',
                borderBottom: tab === t.id ? `2px solid ${UI.accent}` : '2px solid transparent',
                color: tab === t.id ? UI.text : UI.textMuted,
              }}>
                <div style={{ fontSize: 11, fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</div>
                <div style={{ fontSize: 9, color: UI.textDim, marginTop: 1 }}>{t.sub}</div>
              </button>
            ))}
          </div>

          {/* Style list */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {Object.entries(styles).map(([key, val]) => {
              const isActive = activeKey === key
              const num = key.match(/\d+$/)?.[0] || ''
              return (
                <button key={key} onClick={() => setActiveKey(key)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  textAlign: 'left', padding: '8px 14px',
                  background: isActive ? UI.activeRow : 'transparent',
                  border: 'none',
                  borderLeft: `3px solid ${isActive ? val.color : 'transparent'}`,
                  cursor: 'pointer',
                }}>
                  <span style={{ width: 22, height: 22, borderRadius: 4, background: isActive ? val.color : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: isActive ? '#fff' : UI.textMuted, flexShrink: 0 }}>{num}</span>
                  <span style={{ fontSize: 11, color: isActive ? UI.text : UI.textMuted, lineHeight: 1.3, flex: 1 }}>
                    {val.label}
                    {val.nameTe ? <span style={{ display: 'block', fontSize: 9, color: '#64748b', marginTop: 1 }}>{val.nameTe}</span> : null}
                  </span>
                  {key === savedKey && <span style={{ fontSize: 9, background: '#16a34a', color: '#fff', borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>✓</span>}
                </button>
              )
            })}
          </nav>

          {/* Zoom */}
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${UI.panelBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: '#64748b' }}>Zoom</span>
              <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>{Math.round(zoom * 100)}%</span>
            </div>
            <input type="range" min={0.2} max={1.5} step={0.05} value={zoom} onChange={e => setZoom(Number(e.target.value))} style={{ width: '100%', accentColor: UI.accent }} />
          </div>
        </aside>

        {/* ══ CENTER — live preview ══ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: UI.canvasBg }}>
          <div style={{ background: UI.panelBg, borderBottom: `1px solid ${UI.panelBorder}`, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
            <span style={{ background: activeStyle?.color || UI.accent, color: '#fff', fontWeight: 800, fontSize: 11, padding: '3px 10px', borderRadius: 5 }}>{activeKey}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: UI.text }}>{activeStyle?.label}</span>
            <span style={{ fontSize: 11, color: UI.textMuted }}>{dimLabel}</span>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <span style={{ fontSize: 11, color: UI.textMuted, alignSelf: 'center' }}>Page type:</span>
              {['tabloid', 'broadsheet'].map(pt => (
                <button key={pt} onClick={() => setPageType(pt)} style={{
                  padding: '4px 10px', border: `1px solid ${UI.panelBorder}`, borderRadius: 6, cursor: 'pointer',
                  fontSize: 11, fontWeight: 600,
                  background: pageType === pt ? UI.accent : UI.panelBg,
                  color: pageType === pt ? '#fff' : UI.textMuted,
                }}>
                  {pt.charAt(0).toUpperCase() + pt.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div style={{ flex: 1, overflow: 'auto', padding: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
            {/* Checkered background to show transparency */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ marginBottom: 12, fontSize: 10, color: UI.textMuted }}>
                Natural: {naturalW}×{naturalH}px &nbsp;|&nbsp; Preview: {displayW}×{displayH}px
              </div>
              <div style={{ width: displayW, height: displayH, overflow: 'hidden', boxShadow: '0 4px 24px rgba(15,23,42,0.12)', borderRadius: 4, border: `1px solid ${UI.panelBorder}` }}>
                <div style={{ width: naturalW, height: naturalH, transformOrigin: 'top left', transform: `scale(${zoom})` }}>
                  {forcedImageUrl ? (
                    <div style={{ width: '100%', height: '100%', background: '#fff', overflow: 'hidden' }}>
                      <img
                        src={forcedImageUrl}
                        alt=""
                        style={{
                          display: 'block',
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center center',
                        }}
                      />
                    </div>
                  ) : (
                    HeaderComp && <HeaderComp s={settings} pt={pageType} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ RIGHT — edit panel ══ */}
        <aside style={{ width: 270, flexShrink: 0, background: UI.panelBg, borderLeft: `1px solid ${UI.panelBorder}`, overflowY: 'auto', fontSize: 12 }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${UI.panelBorder}`, fontSize: 10, fontWeight: 700, color: UI.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Edit Content
          </div>
          <div style={{ padding: '10px 14px 24px' }}>

            <EditField label="Paper Name (Telugu)" value={settings.paperName} onChange={v => setSettings(p => ({ ...p, paperName: v }))} />
            <EditField label="Paper Name (English)" value={settings.paperNameEn} onChange={v => setSettings(p => ({ ...p, paperNameEn: v }))} />

            {tab === 'sub' && <>
              <EditField label="Page Number (left)" value={settings.pageNumber} onChange={v => setSettings(p => ({ ...p, pageNumber: v }))} />
              <EditField label="Date &amp; day (right)" value={settings.date} onChange={v => setSettings(p => ({ ...p, date: v }))} />
            </>}

            {tab === 'sub' && activeKey === 'sub_header_style1' && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: UI.accent, margin: '4px 0 10px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Sub header — center logo (API in production)
                </div>
                <EditField label="Sub header logo URL" value={settings.subHeaderLogoUrl} onChange={v => setSettings(p => ({ ...p, subHeaderLogoUrl: v }))} />
                <div style={{ marginBottom: 11 }}>
                  <label style={LBL_STYLE}>Upload sub header logo (testing)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadImageForField(file, 'subHeaderLogoUrl')
                      e.target.value = ''
                    }}
                    style={{ ...FLD_STYLE, padding: 4 }}
                  />
                  <div style={{ marginTop: 4, fontSize: 10, color: '#94a3b8' }}>
                    Production: logo comes from tenant/API. Falls back to Logo URL if empty.
                  </div>
                </div>
              </>
            )}

            {tab === 'main' && activeKey === 'main_style2' && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: UI.accent, margin: '4px 0 10px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Style 2 — Running commentary &amp; right article
                </div>
                <EditField label="Running comment (lines)" value={settings.runningCommentText} onChange={v => setSettings(p => ({ ...p, runningCommentText: v }))} textarea />
                <EditField label="Comment author" value={settings.runningCommentAuthor} onChange={v => setSettings(p => ({ ...p, runningCommentAuthor: v }))} />
                <EditField label="Tagline" value={settings.tagline} onChange={v => setSettings(p => ({ ...p, tagline: v }))} />
                <EditField label="Website URL" value={settings.websiteUrl} onChange={v => setSettings(p => ({ ...p, websiteUrl: v }))} />
                <EditField label="Right article headline" value={settings.rightArticleTitle} onChange={v => setSettings(p => ({ ...p, rightArticleTitle: v }))} />
                <EditField label="Right article points" value={settings.rightArticlePoints} onChange={v => setSettings(p => ({ ...p, rightArticlePoints: v }))} textarea />
                <EditField label="Continue page no." value={settings.pageNumber} onChange={v => setSettings(p => ({ ...p, pageNumber: v }))} />
              </>
            )}

            {tab !== 'sub' && (
              <EditField label="Issue Date" value={settings.date} onChange={v => setSettings(p => ({ ...p, date: v }))} />
            )}
            <EditField label="Volume (సంపుటి)" value={settings.volume} onChange={v => setSettings(p => ({ ...p, volume: v }))} />
            <EditField label="Issue No (సంచిక)" value={settings.issue} onChange={v => setSettings(p => ({ ...p, issue: v }))} />
            <EditField label="Price (వెల)" value={settings.price} onChange={v => setSettings(p => ({ ...p, price: v }))} />
            <EditField label="Published Areas" value={settings.publishedAreas} onChange={v => setSettings(p => ({ ...p, publishedAreas: v }))} textarea />
            <EditField label="Logo / QR URL" value={settings.logoUrl} onChange={v => setSettings(p => ({ ...p, logoUrl: v }))} />
            <div style={{ marginBottom: 11 }}>
              <label style={LBL_STYLE}>Upload Logo / QR (testing)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadImageForField(file, 'logoUrl')
                  e.target.value = ''
                }}
                style={{ ...FLD_STYLE, padding: 4 }}
              />
            </div>

            <EditField label="Header Center Image URL" value={settings.paperNameImageUrl} onChange={v => setSettings(p => ({ ...p, paperNameImageUrl: v }))} />
            <div style={{ marginBottom: 11 }}>
              <label style={LBL_STYLE}>Upload Center Header Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadImageForField(file, 'paperNameImageUrl')
                  e.target.value = ''
                }}
                style={{ ...FLD_STYLE, padding: 4 }}
              />
            </div>

            <EditField label="Left Ad Image URL" value={settings.adLeftUrl} onChange={v => setSettings(p => ({ ...p, adLeftUrl: v }))} />
            <div style={{ marginBottom: 11 }}>
              <label style={LBL_STYLE}>Upload Left Ad Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadImageForField(file, 'adLeftUrl')
                  e.target.value = ''
                }}
                style={{ ...FLD_STYLE, padding: 4 }}
              />
            </div>

            <EditField label="Right Ad Image URL" value={settings.adRightUrl} onChange={v => setSettings(p => ({ ...p, adRightUrl: v }))} />
            <div style={{ marginBottom: 11 }}>
              <label style={LBL_STYLE}>Upload Right Ad Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadImageForField(file, 'adRightUrl')
                  e.target.value = ''
                }}
                style={{ ...FLD_STYLE, padding: 4 }}
              />
            </div>
            <EditField label="Ad / Sponsor URL" value={settings.adUrl} onChange={v => setSettings(p => ({ ...p, adUrl: v }))} />

            <EditField
              label={tab === 'main' ? 'Main Header Full Image URL (Image-Only Rule)' : 'Sub Header Full Image URL (Image-Only Rule)'}
              value={tab === 'main' ? settings.mainHeaderImageUrl : settings.subHeaderImageUrl}
              onChange={v => setSettings(p => ({ ...p, [tab === 'main' ? 'mainHeaderImageUrl' : 'subHeaderImageUrl']: v }))}
            />
            <div style={{ marginBottom: 11 }}>
              <label style={LBL_STYLE}>{tab === 'main' ? 'Upload Main Header Full Image' : 'Upload Sub Header Full Image'}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadImageForField(file, tab === 'main' ? 'mainHeaderImageUrl' : 'subHeaderImageUrl')
                  e.target.value = ''
                }}
                style={{ ...FLD_STYLE, padding: 4 }}
              />
              <div style={{ marginTop: 4, fontSize: 10, color: '#94a3b8' }}>
                Image-only mode active when this URL is set. It fills the full header box and never overflows.
              </div>
            </div>

            {/* Accent color */}
            <div style={{ marginBottom: 14 }}>
              <label style={LBL_STYLE}>Accent Color</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="color" value={settings.accentColor} onChange={e => setSettings(p => ({ ...p, accentColor: e.target.value }))}
                  style={{ width: 36, height: 30, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }} />
                <span style={{ fontSize: 11, color: UI.textMuted, fontFamily: 'monospace' }}>{settings.accentColor}</span>
              </div>
            </div>

            {/* Quick color presets */}
            <div style={{ marginBottom: 14 }}>
              <label style={LBL_STYLE}>Quick Presets</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {['#dc2626','#ea580c','#b45309','#16a34a','#0284c7','#7c3aed','#db2777','#111111','#1e293b','#0f172a'].map(c => (
                  <button key={c} onClick={() => setSettings(p => ({ ...p, accentColor: c }))} title={c}
                    style={{ width: 22, height: 22, borderRadius: 4, background: c, border: settings.accentColor === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', padding: 0 }} />
                ))}
              </div>
            </div>

            {/* Style key info */}
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px', marginBottom: 14, border: `1px solid ${UI.panelBorder}` }}>
              <div style={{ fontSize: 10, color: UI.textMuted, marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Style Key</div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: UI.text }}>{activeKey}</div>
              <div style={{ fontSize: 10, color: UI.textDim, marginTop: 3 }}>{dimLabel}</div>
            </div>

            <button onClick={() => setSettings({ ...DEFAULT })} style={{ width: '100%', background: 'transparent', border: `1px solid ${UI.inputBorder}`, color: UI.textMuted, borderRadius: 8, padding: '7px', fontSize: 11, cursor: 'pointer' }}>
              ↺ Reset to defaults
            </button>

            <button onClick={saveStyle} disabled={saving} style={{ width: '100%', background: saving ? '#cbd5e1' : UI.accent, border: 'none', color: '#fff', borderRadius: 8, padding: '8px', fontSize: 12, cursor: saving ? 'default' : 'pointer', marginTop: 10, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : `💾 Save as Default`}
            </button>
            {saveMsg && (
              <div style={{ marginTop: 6, fontSize: 11, color: saveMsg === 'Saved!' ? '#16a34a' : '#dc2626', textAlign: 'center', fontWeight: 600 }}>
                {saveMsg}
              </div>
            )}
            {uploadingField && (
              <div style={{ marginTop: 6, fontSize: 10, color: UI.textDim, textAlign: 'center' }}>
                Uploading {uploadingField}...
              </div>
            )}
          </div>
        </aside>

      </div>
    </DashboardLayout>
  )
}
