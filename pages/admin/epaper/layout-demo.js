/**
 * ePaper Layout Demo — 4in + 8in block arrangement across pages
 *
 * Shows how BLOCK-04A (4in) and BLOCK-08A (8in) sit side-by-side on a
 * full 12-inch newspaper page, alternating position on each page.
 *
 * Page 1: [4in | 8in]
 * Page 2: [8in | 4in]
 * Page 3: [4in | 8in]
 * ...
 */
import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import ArticleBlock4in2col from '../../../components/epaper/ArticleBlock4in2col'
import ArticleBlock6in2col from '../../../components/epaper/ArticleBlock6in2col'

// ── Physical dimensions ──────────────────────────────────────────────────────
// Page width: 12in = 304.8mm = 1153px @96dpi
// 4in zone  : 4/12 = 101.6mm
// 8in zone  : 8/12 = 203.2mm  (rendered using ArticleBlock6in2col, scaled to fit)

const PG_W    = 1153  // px — full 12-inch page
const ZONE_4  = Math.round(PG_W * 4 / 12)   // 384px
const ZONE_8  = Math.round(PG_W * 8 / 12)   // 769px

// ── Sample content ───────────────────────────────────────────────────────────

const SAMPLES_4IN = [
  {
    title: 'కేంద్రం కొత్త వ్యవసాయ పథకాన్ని ప్రకటించింది',
    subtitle: 'వ్యవసాయ రంగానికి ప్రోత్సాహం',
    category: 'political',
    dateline: 'న్యూ ఢిల్లీ',
    highlights: ['రూ.1.5 లక్షల కోట్లు', 'కోటి మంది రైతులకు ప్రయోజనం'],
    images: [
      { url: 'https://placehold.co/200x120/1a3a6b/ffffff?text=రైతులు', caption: 'పంట కోత సమయంలో రైతులు' },
    ],
    paragraphs: [
      'కేంద్ర ప్రభుత్వం శుక్రవారం వ్యవసాయ రంగానికి సమగ్ర పథకాన్ని ప్రకటించింది.',
      'ఈ పథకం కింద కోటి మందికి పైగా రైతులకు లబ్ది చేకూరనుంది.',
      'రూ.1.5 లక్షల కోట్ల విలువైన ఈ ప్యాకేజీలో సేద్యపు నీటి సౌకర్యాలు ఉన్నాయి.',
      'ఇది రైతుల ఆదాయాన్ని రెట్టింపు చేయడానికి సహాయపడుతుంది.',
    ],
  },
  {
    title: 'రాష్ట్రంలో భారీ వర్షాలు, వరద హెచ్చరిక',
    subtitle: 'వాతావరణ శాఖ ఎర్ర అలర్ట్',
    category: 'general',
    dateline: 'హైదరాబాద్',
    highlights: ['16 జిల్లాల్లో అలర్ట్', 'ఎన్డీఆర్ఎఫ్ సిద్ధం'],
    images: [
      { url: 'https://placehold.co/200x120/16A085/ffffff?text=వరద', caption: 'వరద ప్రభావిత ప్రాంతం' },
      { url: 'https://placehold.co/200x120/0ea5e9/ffffff?text=రెస్క్యూ', caption: 'రెస్క్యూ బృందాలు' },
    ],
    paragraphs: [
      'గత 24 గంటల్లో రాష్ట్రవ్యాప్తంగా భారీ వర్షాలు కురిశాయి.',
      'పలు జిల్లాల్లో వరదలు పొంగిపొర్లుతున్నాయి.',
      'ప్రభుత్వం రెడ్ అలర్ట్ జారీ చేసింది.',
      'ఎన్డీఆర్ఎఫ్ బృందాలు ప్రభావిత ప్రాంతాలలో విస్తరించాయి.',
    ],
  },
  {
    title: 'స్టార్టప్ రంగంలో తెలుగు యువత ముందంజ',
    subtitle: 'జాతీయ అవార్డులు సాధించిన ఇద్దరు హైదరాబాద్ వ్యవస్థాపకులు',
    category: 'business',
    dateline: 'హైదరాబాద్',
    highlights: ['రూ.50 కోట్ల ఫండింగ్', '200 ఉద్యోగాలు'],
    images: [],
    paragraphs: [
      'హైదరాబాద్ కేంద్రంగా ఉన్న రెండు స్టార్టప్‌లు జాతీయ స్థాయి అవార్డులు సాధించాయి.',
      'ఈ విజయం తెలుగు యువత ఆవిష్కరణ శక్తిని చాటి చెప్పింది.',
      'ప్రభుత్వ టీ-హబ్ మద్దతుతో ఈ సంస్థలు వేగంగా ఎదుగుతున్నాయి.',
      'జాతీయ ఇన్నోవేషన్ పురస్కారం పొందిన తొలి తెలుగు స్టార్టప్‌లుగా చరిత్ర సృష్టించాయి.',
    ],
  },
]

const SAMPLES_8IN = [
  {
    title: 'రాష్ట్రపతి ఎన్నిక: ఎన్డీఏ అభ్యర్థి ఘనవిజయం',
    subtitle: 'ఇండియా కూటమి అభ్యర్థిపై 3 లక్షల ఓట్ల తేడా — నూతన రాష్ట్రపతి ప్రమాణ స్వీకారం వచ్చే నెల',
    category: 'political',
    dateline: 'న్యూ ఢిల్లీ',
    highlights: [
      'ఎన్డీఏ అభ్యర్థికి 6.78 లక్షల ఓట్లు',
      'కూటమి అభ్యర్థికి 3.80 లక్షల ఓట్లు',
      'నూతన రాష్ట్రపతి ప్రమాణ స్వీకారం',
    ],
    images: [
      { url: 'https://placehold.co/360x220/1a1a2e/ffffff?text=విజయం', caption: 'ఫలితాలు ప్రకటించిన తర్వాత వేడుకలు' },
    ],
    paragraphs: [
      'భారత రాష్ట్రపతి ఎన్నికలో ఎన్డీఏ అభ్యర్థి భారీ మెజారిటీతో విజయం సాధించారు.',
      'ఇండియా కూటమి అభ్యర్థిపై దాదాపు 3 లక్షల ఓట్ల తేడాతో గెలిచారు.',
      'ఎన్నికల కమిషన్ గురువారం రాత్రి అధికారికంగా ఫలితాలు ప్రకటించింది.',
      'బిజెపి నేతృత్వంలోని ఎన్డీఏ సంకీర్ణం ఈ విజయాన్ని వేడుకలతో స్వాగతించింది.',
      'నూతన రాష్ట్రపతి వచ్చే నెల 25న ప్రమాణ స్వీకారం చేయనున్నారు.',
      'ఈ ఎన్నిక దేశంలో ప్రజాస్వామ్యం బలంగా ఉందని నేతలు అభిప్రాయపడ్డారు.',
    ],
  },
  {
    title: 'తెలంగాణలో పారిశ్రామిక పెట్టుబడులు రూ.2 లక్షల కోట్లు దాటాయి',
    subtitle: 'హైదరాబాద్ ఐటీ, ఫార్మా రంగాల్లో వేగవంతమైన వృద్ధి',
    category: 'business',
    dateline: 'హైదరాబాద్',
    highlights: [
      '500 స్టార్టప్‌లకు అనుమతి',
      'ఐటీ ఉద్యోగాలు 40% పెరిగాయి',
      'అంతర్జాతీయ కంపెనీల ఆసక్తి',
      'రూ.2 లక్షల కోట్ల పెట్టుబడులు',
    ],
    images: [
      { url: 'https://placehold.co/360x200/8E44AD/ffffff?text=ఐటీ+హైదరాబాద్', caption: 'హైటెక్ సిటీలో కొత్త కార్యాలయాలు' },
    ],
    paragraphs: [
      'హైదరాబాద్‌లో సాంకేతిక పరిశ్రమ అభివృద్ధి వేగంగా జరుగుతోంది.',
      'గత ఆర్థిక సంవత్సరంలో రూ.2 లక్షల కోట్లకు పైగా పెట్టుబడులు వచ్చాయి.',
      'ఇందులో అమెరికా, జపాన్, కొరియా దేశాల నుండి వచ్చిన విదేశీ పెట్టుబడులు ఎక్కువగా ఉన్నాయి.',
      'మైక్రోసాఫ్ట్, గూగుల్, అమెజాన్ కంపెనీలు తమ కార్యాలయాలను మరింత విస్తరిస్తున్నాయి.',
      'ఐటీ రంగంలో 40 శాతం ఉద్యోగాలు పెరిగాయని అధికారిక లెక్కలు చెప్తున్నాయి.',
      'ముఖ్యమంత్రి ఈ పెట్టుబడులను ఆహ్వానిస్తూ మరిన్ని రాయితీలు ప్రకటించారు.',
    ],
  },
  {
    title: 'ఆంధ్రప్రదేశ్ అమరావతి నిర్మాణం మళ్ళీ ప్రారంభం',
    subtitle: 'సుప్రీంకోర్టు ఆదేశాలతో పనులు వేగవంతం — 2027 నాటికి తొలిదశ పూర్తి',
    category: 'political',
    dateline: 'అమరావతి',
    highlights: [
      'రూ.50,000 కోట్ల ప్రాజెక్ట్',
      '2027 నాటికి తొలిదశ పూర్తి',
      'సింగపూర్ నమూనాలో రాజధాని',
    ],
    images: [
      { url: 'https://placehold.co/360x200/0f3460/ffffff?text=అమరావతి', caption: 'అమరావతి నిర్మాణ ప్రాంతం' },
    ],
    paragraphs: [
      'ఆంధ్రప్రదేశ్ రాజధాని అమరావతి నిర్మాణం మళ్ళీ ముమ్మరంగా ప్రారంభమైంది.',
      'సుప్రీంకోర్టు ఆదేశాల నేపథ్యంలో నిర్మాణ సంస్థలు పని వేగాన్ని పెంచాయి.',
      'రూ.50,000 కోట్ల అంచనా వ్యయంతో రాజధాని నిర్మాణం జరుగుతోంది.',
      '2027 నాటికి తొలి దశ పనులు పూర్తి చేయాలని ప్రభుత్వం లక్ష్యంగా నిర్ణయించింది.',
      'సింగపూర్ నమూనాలో తీర్చిదిద్దే ఈ రాజధాని అభివృద్ధికి అంతర్జాతీయ నిధులు లభించాయి.',
      'ముఖ్యమంత్రి శనివారం నిర్మాణ ప్రాంతాన్ని పరిశీలించారు.',
    ],
  },
]

// ── How many pages to show ───────────────────────────────────────────────────
const PAGE_COUNT = 3

// ── Page renderer ────────────────────────────────────────────────────────────

function NewspaperPage({ pageIndex, zoom }) {
  // odd pages → [4in | 8in], even → [8in | 4in]
  const flip = pageIndex % 2 === 1

  const s4 = SAMPLES_4IN[pageIndex % SAMPLES_4IN.length]
  const s8 = SAMPLES_8IN[pageIndex % SAMPLES_8IN.length]

  const scaledW  = Math.round(PG_W * zoom)
  const scaled4  = Math.round(ZONE_4 * zoom)
  const scaled8  = Math.round(ZONE_8 * zoom)

  const block4 = (
    <div
      style={{
        width: scaled4,
        flexShrink: 0,
        overflow: 'hidden',
        borderRight: flip ? 'none' : '1px solid #c0c0c0',
        borderLeft:  flip ? '1px solid #c0c0c0' : 'none',
        background: '#fff',
        position: 'relative',
      }}
    >
      {/* Scale the block component from its natural 101.6mm width to our scaled zone */}
      <div style={{
        transformOrigin: 'top left',
        transform: `scale(${zoom})`,
        width: ZONE_4,
      }}>
        <ArticleBlock4in2col {...s4} />
      </div>
    </div>
  )

  const block8 = (
    <div
      style={{
        width: scaled8,
        flexShrink: 0,
        overflow: 'hidden',
        background: '#fff',
        position: 'relative',
      }}
    >
      {/* Scale 6in2col (152.4mm / ~576px) to fill the 8in zone */}
      <div style={{
        transformOrigin: 'top left',
        transform: `scale(${zoom * (ZONE_8 / 576)})`,
        width: 576,
      }}>
        <ArticleBlock6in2col {...s8} />
      </div>
    </div>
  )

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Page label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 6,
      }}>
        <span style={{
          background: '#1e293b',
          color: '#94a3b8',
          fontSize: 11,
          fontWeight: 700,
          padding: '3px 10px',
          borderRadius: 4,
          letterSpacing: '0.07em',
        }}>
          PAGE {pageIndex + 1}
        </span>
        <span style={{ color: '#475569', fontSize: 11 }}>
          {flip ? '← 8in (right) · 4in (left) →' : '← 4in (left) · 8in (right) →'}
        </span>
        <span style={{ color: '#334155', fontSize: 10, marginLeft: 'auto' }}>
          {Math.round(PG_W * zoom)}px @ {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Page canvas */}
      <div style={{
        display: 'flex',
        flexDirection: flip ? 'row-reverse' : 'row',
        width: scaledW,
        border: '1px solid #334155',
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        background: '#fff',
        minHeight: 300,
      }}>
        {block4}
        {block8}
      </div>

      {/* Zone guide labels */}
      <div style={{
        display: 'flex',
        flexDirection: flip ? 'row-reverse' : 'row',
        width: scaledW,
        marginTop: 3,
      }}>
        <div style={{ width: scaled4, textAlign: 'center', fontSize: 9, color: '#10b981', fontWeight: 700, letterSpacing: '0.06em' }}>
          ◀ BLOCK-04A · 4in ▶
        </div>
        <div style={{ width: scaled8, textAlign: 'center', fontSize: 9, color: '#ef4444', fontWeight: 700, letterSpacing: '0.06em' }}>
          ◀ BLOCK-08A · 8in ▶
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LayoutDemo() {
  const [zoom, setZoom] = useState(0.5)

  return (
    <>
      <Head>
        <title>Layout Demo — 4in + 8in | ePaper</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Mandali&display=swap" rel="stylesheet" />
      </Head>

      <div style={{
        minHeight: '100vh',
        fontFamily: "'Inter', system-ui, sans-serif",
        background: '#020617',
        color: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* ── Toolbar ── */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: '#0f172a',
          borderBottom: '1px solid #1e293b',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
        }}>
          <Link
            href="/admin/epaper"
            style={{ fontSize: 11, color: '#475569', textDecoration: 'none' }}
          >
            ← ePaper
          </Link>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>
            Layout Demo
          </span>
          <span style={{
            fontSize: 11,
            color: '#475569',
            borderLeft: '1px solid #1e293b',
            paddingLeft: 16,
          }}>
            4in + 8in = 12in full page · alternating per page
          </span>

          {/* Zoom slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>Zoom</span>
            <input
              type="range"
              min={0.25}
              max={0.9}
              step={0.05}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              style={{ width: 110, accentColor: '#6366f1' }}
            />
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#6366f1',
              minWidth: 36,
              textAlign: 'right',
            }}>
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <span style={{ width: 12, height: 12, background: '#10b981', borderRadius: 2, display: 'inline-block' }} />
              BLOCK-04A 4in
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <span style={{ width: 12, height: 12, background: '#ef4444', borderRadius: 2, display: 'inline-block' }} />
              BLOCK-08A 8in
            </span>
          </div>
        </div>

        {/* ── Pages ── */}
        <div style={{ padding: '28px 28px 48px', overflowX: 'auto' }}>

          {/* Layout rule explanation */}
          <div style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: 8,
            padding: '14px 18px',
            marginBottom: 28,
            fontSize: 12,
            color: '#94a3b8',
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
            alignItems: 'flex-start',
          }}>
            <div>
              <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Page layout rule</div>
              <div>4in + 8in = 12in (full page width)</div>
              <div>Odd pages → 4in left · 8in right</div>
              <div>Even pages → 8in left · 4in right</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#10b981', marginBottom: 4 }}>BLOCK-04A (4in)</div>
              <div>Adaptive 2-col or 3-col</div>
              <div>Highlights top-left · Image top-right</div>
              <div>Bold dateline · category accent colour</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>BLOCK-08A (8in)</div>
              <div>2-col balanced layout</div>
              <div>Large headline · highlights · image</div>
              <div>Full multi-paragraph article</div>
            </div>
          </div>

          {Array.from({ length: PAGE_COUNT }, (_, i) => (
            <NewspaperPage key={i} pageIndex={i} zoom={zoom} />
          ))}
        </div>
      </div>
    </>
  )
}
