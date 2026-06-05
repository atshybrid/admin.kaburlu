/**
 * Newspaper Layout Engine — Interactive Demo
 * URL: /admin/epaper/layout-engine
 *
 * Lets you add articles with priority / span / content, run the engine,
 * and see the resulting grid layout rendered visually with the JSON output.
 */
import React, { useState, useCallback } from 'react'
import Head from 'next/head'
import {
  runLayoutEngine,
  validateLayout,
  calcHeight,
  snapToGrid,
  DEFAULT_PAGE,
  SPAN,
  PRIORITY,
} from '../../../lib/epaper/layoutEngine'

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_LABELS = {
  100: 'Lead (Breaking)',
  90 : 'Breaking',
  60 : 'Secondary',
  40 : 'Normal',
  20 : 'Brief',
}

const SPAN_LABELS = {
  12: 'Full (12 col)',
  6 : 'Half (6 col)',
  4 : 'Third (4 col)',
  3 : 'Quarter (3 col)',
}

const CATEGORY_COLORS = {
  political    : '#1a3a6b',
  crime        : '#C0392B',
  sports       : '#16A085',
  business     : '#8E44AD',
  entertainment: '#D35400',
  general      : '#34495E',
}

const BLOCK_COLORS = {
  12: '#1a3a6b',
  6 : '#16A085',
  4 : '#8E44AD',
  3 : '#D35400',
}

const DEMO_ARTICLES = [
  {
    id: 'lead_1',
    colSpan: SPAN.FULL,
    priority: PRIORITY.LEAD,
    category: 'political',
    title: 'తెలంగాణ బడ్జెట్ సమావేశాలు ప్రారంభం: సీఎం ముఖ్యమైన ప్రకటనలు',
    subtitle: 'అసెంబ్లీలో ప్రతిపక్షం నిరసన',
    dateline: 'హైదరాబాద్',
    highlights: ['రూ. 2.5 లక్షల కోట్ల బడ్జెట్', '50 కొత్త పథకాలు'],
    paragraphs: [
      'తెలంగాణ శాసనసభ బడ్జెట్ సమావేశాలు సోమవారం ఘనంగా ప్రారంభమయ్యాయి.',
      'ముఖ్యమంత్రి రేవంత్ రెడ్డి అనేక కీలక ప్రకటనలు చేశారు.',
      'ప్రతిపక్ష పార్టీలు అనేక అంశాలపై నిరసన తెలిపాయి.',
      'బడ్జెట్‌లో వ్యవసాయం, విద్య, ఆరోగ్యానికి ప్రాధాన్యత ఇచ్చినట్లు సీఎం పేర్కొన్నారు.',
    ],
    images: [{ url: 'https://placehold.co/800x300/1a3a6b/fff?text=Assembly', height: 300 }],
  },
  {
    id: 'sec_1',
    colSpan: SPAN.HALF,
    priority: PRIORITY.SECONDARY,
    category: 'crime',
    title: 'హైదరాబాద్‌లో భారీ వ్యాపార మోసం: 12 మంది అరెస్ట్',
    subtitle: 'రూ. 500 కోట్ల స్కామ్',
    dateline: 'హైదరాబాద్',
    highlights: ['12 మంది అరెస్ట్', 'రూ. 500 కోట్ల స్కామ్'],
    paragraphs: [
      'హైదరాబాద్‌లో పెద్ద ఎత్తున చోటుచేసుకున్న వ్యాపార మోసంలో పోలీసులు 12 మందిని అరెస్ట్ చేశారు.',
      'నిందితులు బాధితులకు హామీ ఇచ్చిన పెట్టుబడి పథకంలో రూ. 500 కోట్లు మోసం చేశారు.',
      'కేసు విచారణ కొనసాగుతోంది.',
    ],
    images: [],
  },
  {
    id: 'sec_2',
    colSpan: SPAN.HALF,
    priority: PRIORITY.SECONDARY,
    category: 'sports',
    title: 'IPL 2026: హైదరాబాద్ జట్టు సెమీఫైనల్‌కు చేరుకుంది',
    subtitle: 'ముంబైపై ఘన విజయం',
    dateline: 'హైదరాబాద్',
    highlights: ['8 వికెట్ల విజయం', 'ప్రసిద్ కృష్ణ 4 వికెట్లు'],
    paragraphs: [
      'ముంబై ఇండియన్స్‌పై 8 వికెట్ల విజయంతో సన్‌రైజర్స్ హైదరాబాద్ సెమీఫైనల్‌కు అర్హత పొందింది.',
      'ప్రసిద్ కృష్ణ అద్భుతమైన బౌలింగ్ ప్రదర్శనతో 4 వికెట్లు తీశాడు.',
    ],
    images: [{ url: 'https://placehold.co/300x180/16A085/fff?text=IPL', height: 180 }],
  },
  {
    id: 'norm_1',
    colSpan: SPAN.THIRD,
    priority: PRIORITY.NORMAL,
    category: 'business',
    title: 'సెన్సెక్స్ రికార్డ్ స్థాయికి',
    subtitle: 'మార్కెట్ ర్యాలీ కొనసాగింది',
    dateline: 'ముంబై',
    highlights: ['85,000 దాటింది'],
    paragraphs: [
      'భారత స్టాక్ మార్కెట్ సోమవారం రికార్డ్ స్థాయికి చేరుకుంది.',
      'సెన్సెక్స్ మొదటిసారిగా 85,000 పాయింట్లు దాటింది.',
    ],
    images: [],
  },
  {
    id: 'norm_2',
    colSpan: SPAN.THIRD,
    priority: PRIORITY.NORMAL,
    category: 'general',
    title: 'వాతావరణ మార్పు: తెలంగాణలో వడగాలులు',
    subtitle: 'ఉష్ణోగ్రత 45°C దాటింది',
    dateline: 'హైదరాబాద్',
    highlights: ['7 జిల్లాల్లో హీట్‌వేవ్'],
    paragraphs: [
      'రాష్ట్రంలో వడగాలుల ప్రభావం తీవ్రమైంది.',
      'హైదరాబాద్ సహా 7 జిల్లాల్లో ఉష్ణోగ్రత 45°C దాటింది.',
      'వాతావరణ శాఖ రెడ్ అలర్ట్ జారీ చేసింది.',
    ],
    images: [],
  },
  {
    id: 'norm_3',
    colSpan: SPAN.THIRD,
    priority: PRIORITY.NORMAL,
    category: 'entertainment',
    title: 'తెలుగు సినిమా బాక్సాఫీస్‌లో రికార్డులు',
    subtitle: 'కొత్త చిత్రం ₹100 కోట్లు',
    dateline: 'హైదరాబాద్',
    highlights: ['₹100 కోట్లు 3 రోజుల్లో'],
    paragraphs: [
      'తాజాగా విడుదలైన తెలుగు చిత్రం కేవలం 3 రోజుల్లో ₹100 కోట్లు వసూలు చేసింది.',
    ],
    images: [],
  },
  {
    id: 'brief_1',
    colSpan: SPAN.QUARTER,
    priority: PRIORITY.BRIEF,
    category: 'general',
    title: 'అమెరికా అధ్యక్షుడి భారత పర్యటన',
    dateline: 'వాషింగ్టన్',
    paragraphs: ['అమెరికా అధ్యక్షుడు జూన్‌లో భారత్ పర్యటించనున్నారు.'],
    images: [],
  },
  {
    id: 'brief_2',
    colSpan: SPAN.QUARTER,
    priority: PRIORITY.BRIEF,
    category: 'business',
    title: 'బంగారం ధర తగ్గింది',
    dateline: 'హైదరాబాద్',
    paragraphs: ['10 గ్రాముల బంగారం ధర ₹200 తగ్గి ₹73,400కు చేరింది.'],
    images: [],
  },
  {
    id: 'brief_3',
    colSpan: SPAN.QUARTER,
    priority: PRIORITY.BRIEF,
    category: 'sports',
    title: 'ఒలింపిక్ కోచ్ నియామకం',
    dateline: 'న్యూ ఢిల్లీ',
    paragraphs: ['భారత ఒలింపిక్ జట్టుకు కొత్త కోచ్‌ను నియమించారు.'],
    images: [],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return `article_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

const EMPTY_ARTICLE = {
  title     : '',
  subtitle  : '',
  dateline  : '',
  category  : 'general',
  colSpan   : SPAN.HALF,
  priority  : PRIORITY.NORMAL,
  paragraphs: [''],
  highlights: [],
  images    : [],
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GridCanvas({ layout, page, pageHeightPx }) {
  const cfg = { ...DEFAULT_PAGE, ...page }
  const { totalCols, colPx, gutterPx, marginPx, rowPx } = cfg

  const canvasW = marginPx * 2 + totalCols * colPx
  const canvasH = pageHeightPx || 1200

  return (
    <div style={{ position: 'relative', width: canvasW, height: canvasH, background: '#fff', border: '1px solid #ccc', flexShrink: 0 }}>
      {/* Column guides */}
      {Array.from({ length: totalCols }).map((_, c) => (
        <div key={c} style={{
          position : 'absolute',
          left     : marginPx + c * colPx,
          top      : 0,
          width    : colPx - gutterPx,
          height   : canvasH,
          background: 'rgba(100,160,255,0.04)',
          borderLeft: '1px dashed rgba(100,160,255,0.25)',
          pointerEvents: 'none',
        }} />
      ))}

      {/* Row guides every 5 rows */}
      {Array.from({ length: Math.ceil(canvasH / rowPx / 5) }).map((_, r) => (
        <div key={r} style={{
          position  : 'absolute',
          left      : 0,
          top       : r * 5 * rowPx,
          width     : canvasW,
          height    : 1,
          background: 'rgba(0,0,0,0.06)',
          pointerEvents: 'none',
        }} />
      ))}

      {/* Placed blocks */}
      {layout.map(item => {
        const color = BLOCK_COLORS[item.colSpan] || '#555'
        return (
          <div key={item.id} style={{
            position  : 'absolute',
            left      : item.x,
            top       : item.y,
            width     : item.width,
            height    : item.height,
            background: color + '18',
            border    : `2px solid ${color}`,
            boxSizing : 'border-box',
            overflow  : 'hidden',
            padding   : '4px 6px',
          }}>
            <div style={{ fontSize: 9, color, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.colSpan}col · {item.rowSpan}rows
            </div>
            <div style={{ fontSize: 10, color: '#333', marginTop: 2, lineHeight: 1.3, overflow: 'hidden', maxHeight: item.height - 30 }}>
              {item.id}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ValidationBadge({ violations }) {
  if (violations.length === 0) {
    return <span style={{ background: '#16A085', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>✓ VALID</span>
  }
  return <span style={{ background: '#C0392B', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>✗ {violations.length} VIOLATION{violations.length > 1 ? 'S' : ''}</span>
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function LayoutEnginePage() {
  const [articles, setArticles]         = useState(DEMO_ARTICLES)
  const [result, setResult]             = useState(null)
  const [violations, setViolations]     = useState([])
  const [showJson, setShowJson]         = useState(false)
  const [addForm, setAddForm]           = useState(null)   // null | EMPTY_ARTICLE copy
  const [pageConfig, setPageConfig]     = useState(DEFAULT_PAGE)

  // Run engine
  const runEngine = useCallback(() => {
    const { layout, errors, occupancyRows } = runLayoutEngine(articles, pageConfig)
    const v = validateLayout(layout, pageConfig)
    setResult({ layout, errors, occupancyRows })
    setViolations(v)
  }, [articles, pageConfig])

  const removeArticle = (id) => setArticles(prev => prev.filter(a => a.id !== id))

  const submitAdd = () => {
    if (!addForm?.title?.trim()) return
    setArticles(prev => [...prev, { ...addForm, id: uid() }])
    setAddForm(null)
  }

  const pageH = result ? result.occupancyRows * pageConfig.rowPx + 40 : 1200

  const S = {
    page     : { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#111', color: '#e0e0e0', fontFamily: 'Inter, sans-serif', fontSize: 13 },
    toolbar  : { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', background: '#1a1a2e', borderBottom: '1px solid #333', flexWrap: 'wrap' },
    body     : { display: 'flex', gap: 0, flex: 1, overflow: 'hidden' },
    sidebar  : { width: 320, borderRight: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', background: '#161622', overflowY: 'auto' },
    main     : { flex: 1, overflowY: 'auto', padding: 24, background: '#0e0e18' },
    btn      : { padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 },
    card     : { background: '#1e1e2e', border: '1px solid #2a2a3a', borderRadius: 8, padding: 12, marginBottom: 8 },
    label    : { fontSize: 11, color: '#888', marginBottom: 3, display: 'block' },
    input    : { background: '#111', border: '1px solid #333', borderRadius: 4, color: '#e0e0e0', padding: '4px 8px', width: '100%', boxSizing: 'border-box', fontSize: 12 },
    select   : { background: '#111', border: '1px solid #333', borderRadius: 4, color: '#e0e0e0', padding: '4px 8px', width: '100%', boxSizing: 'border-box', fontSize: 12 },
    sectionH : { fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, padding: '10px 14px 4px', borderBottom: '1px solid #2a2a2a' },
  }

  return (
    <>
      <Head><title>Layout Engine · ePaper Studio</title></Head>
      <div style={S.page}>

        {/* ── Toolbar ── */}
        <div style={S.toolbar}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>📐 Newspaper Layout Engine</span>
          <button style={{ ...S.btn, background: '#16A085', color: '#fff' }} onClick={runEngine}>▶ Run Engine</button>
          {result && (
            <>
              <ValidationBadge violations={violations} />
              <button style={{ ...S.btn, background: '#2a2a3a', color: '#ccc' }} onClick={() => setShowJson(v => !v)}>
                {showJson ? 'Hide' : 'View'} JSON
              </button>
              <span style={{ fontSize: 12, color: '#888' }}>{result.layout.length} articles · {result.occupancyRows} rows used</span>
              {result.errors.length > 0 && (
                <span style={{ color: '#e74c3c', fontSize: 12 }}>⚠ {result.errors.length} unplaced</span>
              )}
            </>
          )}

          {/* Page config mini */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 11, color: '#888' }}>Cols</label>
            <select style={{ ...S.select, width: 60 }} value={pageConfig.totalCols} onChange={e => setPageConfig(c => ({ ...c, totalCols: +e.target.value }))}>
              {[6, 8, 9, 12].map(v => <option key={v}>{v}</option>)}
            </select>
            <label style={{ fontSize: 11, color: '#888' }}>Col px</label>
            <input type="number" style={{ ...S.input, width: 55 }} value={pageConfig.colPx} onChange={e => setPageConfig(c => ({ ...c, colPx: +e.target.value }))} />
            <label style={{ fontSize: 11, color: '#888' }}>Row px</label>
            <input type="number" style={{ ...S.input, width: 55 }} value={pageConfig.rowPx} onChange={e => setPageConfig(c => ({ ...c, rowPx: +e.target.value }))} />
          </div>
        </div>

        <div style={S.body}>

          {/* ── Sidebar — article list ── */}
          <div style={S.sidebar}>
            <div style={S.sectionH}>Articles ({articles.length})</div>

            <div style={{ padding: '8px 10px 0' }}>
              <button style={{ ...S.btn, background: '#1a3a6b', color: '#fff', width: '100%' }}
                onClick={() => setAddForm({ ...EMPTY_ARTICLE })}>
                + Add Article
              </button>
            </div>

            {/* Add form */}
            {addForm && (
              <div style={{ ...S.card, margin: 10, border: '1px solid #1a3a6b' }}>
                <div style={{ fontWeight: 700, marginBottom: 8, color: '#7ec8e3' }}>New Article</div>
                {['title', 'subtitle', 'dateline'].map(f => (
                  <div key={f} style={{ marginBottom: 6 }}>
                    <label style={S.label}>{f}</label>
                    <input style={S.input} value={addForm[f] || ''} onChange={e => setAddForm(v => ({ ...v, [f]: e.target.value }))} />
                  </div>
                ))}
                <div style={{ marginBottom: 6 }}>
                  <label style={S.label}>Body text</label>
                  <textarea rows={3} style={{ ...S.input, resize: 'vertical' }}
                    value={(addForm.paragraphs || []).join('\n')}
                    onChange={e => setAddForm(v => ({ ...v, paragraphs: e.target.value.split('\n') }))} />
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <label style={S.label}>Columns</label>
                    <select style={S.select} value={addForm.colSpan} onChange={e => setAddForm(v => ({ ...v, colSpan: +e.target.value }))}>
                      {Object.entries(SPAN_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={S.label}>Priority</label>
                    <select style={S.select} value={addForm.priority} onChange={e => setAddForm(v => ({ ...v, priority: +e.target.value }))}>
                      {Object.entries(PRIORITY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ ...S.btn, background: '#16A085', color: '#fff', flex: 1 }} onClick={submitAdd}>Add</button>
                  <button style={{ ...S.btn, background: '#333', color: '#ccc', flex: 1 }} onClick={() => setAddForm(null)}>Cancel</button>
                </div>
              </div>
            )}

            {/* Article cards */}
            <div style={{ padding: '4px 10px 16px' }}>
              {articles.map(a => (
                <div key={a.id} style={{ ...S.card, borderLeft: `3px solid ${CATEGORY_COLORS[a.category] || '#555'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 12, color: '#ddd', flex: 1, marginRight: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title || a.id}</span>
                    <button style={{ ...S.btn, padding: '1px 7px', background: '#2a0a0a', color: '#e74c3c', fontSize: 11 }} onClick={() => removeArticle(a.id)}>✕</button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, background: '#1a3a6b44', color: '#7ec8e3', padding: '1px 6px', borderRadius: 4 }}>{SPAN_LABELS[a.colSpan] || `${a.colSpan}col`}</span>
                    <span style={{ fontSize: 10, background: '#2a2a0044', color: '#f0c040', padding: '1px 6px', borderRadius: 4 }}>{PRIORITY_LABELS[a.priority] || `p${a.priority}`}</span>
                    {result?.layout.find(l => l.id === a.id) && (() => {
                      const l = result.layout.find(x => x.id === a.id)
                      return <span style={{ fontSize: 10, background: '#16A08522', color: '#16A085', padding: '1px 6px', borderRadius: 4 }}>col{l.colStart} row{l.rowStart} · {l.height}px</span>
                    })()}
                  </div>
                </div>
              ))}
            </div>

            {/* Config reference */}
            <div style={S.sectionH}>Page Config</div>
            <div style={{ padding: '8px 14px 16px', fontSize: 11, color: '#888', lineHeight: 1.8 }}>
              <div>Total cols: <b style={{ color: '#ccc' }}>{pageConfig.totalCols}</b></div>
              <div>Col width: <b style={{ color: '#ccc' }}>{pageConfig.colPx}px</b></div>
              <div>Gutter: <b style={{ color: '#ccc' }}>{pageConfig.gutterPx}px</b></div>
              <div>Row unit: <b style={{ color: '#ccc' }}>{pageConfig.rowPx}px</b></div>
              <div>Margin: <b style={{ color: '#ccc' }}>{pageConfig.marginPx}px</b></div>
              <div>Page width: <b style={{ color: '#ccc' }}>{pageConfig.marginPx * 2 + pageConfig.totalCols * pageConfig.colPx}px</b></div>
            </div>

            {/* Violations */}
            {violations.length > 0 && (
              <>
                <div style={S.sectionH}>Violations</div>
                <div style={{ padding: '8px 14px' }}>
                  {violations.map((v, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#e74c3c', marginBottom: 4 }}>
                      <b>{v.type}</b>: {v.id || (v.ids && v.ids.join(' ↔ ')) || ''}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Unplaced */}
            {result?.errors.length > 0 && (
              <>
                <div style={S.sectionH}>Unplaced Articles</div>
                <div style={{ padding: '8px 14px' }}>
                  {result.errors.map((e, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#e67e22', marginBottom: 4 }}>{e.reason}</div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Main canvas area ── */}
          <div style={S.main}>
            {!result ? (
              <div style={{ color: '#555', textAlign: 'center', paddingTop: 80, fontSize: 15 }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📐</div>
                <div>Press <b style={{ color: '#16A085' }}>▶ Run Engine</b> to generate the layout</div>
                <div style={{ marginTop: 8, fontSize: 12 }}>{articles.length} articles loaded · {pageConfig.totalCols}-column grid</div>
              </div>
            ) : (
              <>
                {/* Legend */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#888' }}>Block legend:</span>
                  {Object.entries(BLOCK_COLORS).map(([cols, color]) => (
                    <span key={cols} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                      <span style={{ width: 14, height: 14, background: color + '40', border: `2px solid ${color}`, display: 'inline-block', borderRadius: 2 }} />
                      {SPAN_LABELS[cols] || `${cols}col`}
                    </span>
                  ))}
                  <span style={{ fontSize: 11, color: '#555', marginLeft: 'auto' }}>
                    Canvas: {pageConfig.marginPx * 2 + pageConfig.totalCols * pageConfig.colPx}×{pageH}px
                  </span>
                </div>

                {/* Grid canvas */}
                <div style={{ overflowX: 'auto' }}>
                  <GridCanvas layout={result.layout} page={pageConfig} pageHeightPx={pageH} />
                </div>

                {/* JSON output */}
                {showJson && (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontWeight: 700, color: '#888', fontSize: 12, marginBottom: 6 }}>JSON Output</div>
                    <pre style={{ background: '#0a0a14', border: '1px solid #2a2a3a', borderRadius: 6, padding: 16, fontSize: 11, color: '#7ec8e3', overflowX: 'auto', maxHeight: 400 }}>
                      {JSON.stringify(result.layout.map(({ id, x, y, width, height, colSpan, rowSpan, colStart, rowStart }) => ({
                        id, colStart, rowStart, colSpan, rowSpan, x, y, width, height
                      })), null, 2)}
                    </pre>
                  </div>
                )}

                {/* Stats table */}
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontWeight: 700, color: '#888', fontSize: 12, marginBottom: 8 }}>Placement Summary</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#1e1e2e' }}>
                        {['ID', 'ColStart', 'RowStart', 'ColSpan', 'RowSpan', 'X', 'Y', 'Width', 'Height'].map(h => (
                          <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#888', fontWeight: 600, borderBottom: '1px solid #2a2a3a' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.layout.map((item, i) => (
                        <tr key={item.id} style={{ background: i % 2 ? '#111120' : 'transparent' }}>
                          {[item.id, item.colStart, item.rowStart, item.colSpan, item.rowSpan, item.x, item.y, item.width, item.height].map((v, j) => (
                            <td key={j} style={{ padding: '5px 10px', color: '#ddd', borderBottom: '1px solid #1a1a2a', fontFamily: j === 0 ? 'monospace' : 'inherit', fontSize: j === 0 ? 11 : 12 }}>{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
