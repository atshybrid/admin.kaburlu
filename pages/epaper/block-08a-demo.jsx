import React, { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import ArticleBlock6in2col from '../../components/epaper/ArticleBlock6in2col'

/** Built-in sample — no login. Mirrors block-style BLOCK-08A preview. */
const SAMPLE_BLOCK_08A = {
  blockCode: 'BLOCK-08A',
  title: 'రైతులకు ఇబ్బందులు లేకుండా ధాన్యం కొనుగోలు',
  subtitle: 'వ్యవసాయ శాఖ కొత్త విధానం',
  category: 'general',
  dateline: 'హైదరాబాద్',
  highlights: [
    'రూ.2,500 క్వింటాల్ మినిమం మద్దతు ధర',
    'ఆన్‌లైన్‌లో నమోదు తప్పనిసరి',
    'ఈ నెల 15 వరకు దరఖాస్తులు',
  ],
  images: [
    {
      src: 'https://placehold.co/320x200/1e3a5f/ffffff?text=Editorial+Photo',
      alt: '',
      caption: 'వ్యవసాయ శాఖ అధికారుల సమీక్షా సమావేశం',
    },
  ],
  paragraphs: [
    'రాష్ట్రంలో ధాన్యం కొనుగోలు కార్యక్రమం ఈ సంవత్సరం నుంచి పూర్తి విధంగా ఆన్‌లైన్‌లో నిర్వహించబడుతుంది.',
    'రైతులు ఇబ్బందులు లేకుండా పంటను అమ్ముకోవడానికి ప్రభుత్వం కొత్త సాఫ్ట్‌వేర్‌ను ప్రవేశపెట్టింది.',
    'గత సంవత్సరం కొనుగోలు కేంద్రాల వద్ద పొడవైన సరితూగలతో ఎదురైన సమస్యలను పరిష్కరించాలని నిర్ణయం తీసుకున్నారు.',
    'వ్యవసాయ శాఖ అధికారులు జిల్లా స్థాయిలో ప్రత్యేక శిక్షణ బృందాలను ఏర్పాటు చేశారు.',
    'బియ్యం, మొక్కజొన్న, పప్పుధాన్యాల కొనుగోలుకు వేర్వేరు మద్దతు ధరలు వర్తిస్తాయి.',
    'రైతు భరోసా కేంద్రాల వద్ద సహాయ డెస్క్‌లను ఏర్పాటు చేసి సమస్యలు తక్షణం పరిష్కరించాలని ఆదేశించారు.',
    'ఈ నెల 15వ తేదీ వరకు ఆన్‌లైన్‌లో నమోదు చేసుకోవాలని అధికారులు సూచించారు.',
    'నమోదు లేకుండా మార్కెట్‌కు తీసుకువెళితే కొనుగోలు జరగదని హెచ్చరికలు జారీ చేశారు.',
    'రాష్ట్రవ్యాప్తంగా 850 కొనుగోలు కేంద్రాలు సిద్ధంగా ఉన్నాయని వ్యవసాయ మంత్రి తెలిపారు.',
    'ప్రభుత్వం రైతులకు ఎటువంటి మధ్యవర్తుల అవసరం లేకుండా నేరుగా లాభం చేరేలా చర్యలు తీసుకుంటోంది.',
    'గత మూడు సంవత్సరాల్లో కొనుగోలు పరిమాణం 40 శాతం పెరిగిందని అధికారిక గణాంకాలు చూపిస్తున్నాయి.',
    'అన్నదాతల సంఘాలు కొత్త విధానాన్ని స్వాగతిస్తూ పూర్తి సహకారం అందించాలని కోరుతున్నాయి.',
  ],
}

function ColumnHeightMeter({ blockRef }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const block = blockRef.current
    if (!block) return undefined

    const measure = () => {
      const frame = block.querySelector('[data-text-frame]')
      if (!frame) return
      const frameH = Math.round(frame.getBoundingClientRect().height)
      setStats({ frameH, model: 'quark-multicol' })
    }

    measure()
    const t2 = setTimeout(measure, 600)
    const ro = new ResizeObserver(measure)
    ro.observe(block)
    return () => {
      clearTimeout(t2)
      ro.disconnect()
    }
  }, [blockRef])

  if (!stats) return null

  return (
    <div
      style={{
        marginTop: 12,
        padding: '10px 14px',
        borderRadius: 8,
        fontFamily: 'ui-monospace, monospace',
        fontSize: 12,
        background: '#ecfdf5',
        border: '1px solid #6ee7b7',
        color: '#1e293b',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>
        Quark text frame · column-count 3 · height {stats.frameH}px
      </div>
      <div style={{ color: '#64748b' }}>
        All 3 text columns share one frame — tops and bottoms align by design (like Quark/InDesign).
      </div>
    </div>
  )
}

export default function Block08aDemo() {
  const blockWrapRef = useRef(null)

  return (
    <>
      <Head>
        <title>BLOCK-08A sample · 3 column partition demo</title>
      </Head>

      <div
        style={{
          minHeight: '100vh',
          background: '#e8edf2',
          padding: '24px 16px 48px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ maxWidth: 820, margin: '0 auto 20px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
            BLOCK-08A sample preview
          </h1>
          <p style={{ fontSize: 14, color: '#475569', margin: '0 0 12px', lineHeight: 1.5 }}>
            Built-in Telugu story — 3 columns, center image, headline panel. No login required.
            One text frame with 3 CSS columns — same as Quark/InDesign (see meter below).
          </p>
          <p style={{ fontSize: 13, margin: 0 }}>
            <Link href="/admin/epaper/block-style" style={{ color: '#2563eb' }}>
              Block style workbench
            </Link>
            {' · '}
            <Link href="/epaper/blocks-demo" style={{ color: '#2563eb' }}>
              All blocks demo
            </Link>
          </p>
        </div>

        <div
          ref={blockWrapRef}
          style={{
            maxWidth: 820,
            margin: '0 auto',
            background: '#fffef9',
            boxShadow: '0 4px 24px rgba(15,23,42,0.08)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <ArticleBlock6in2col {...SAMPLE_BLOCK_08A} showColumnDebug />
        </div>

        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <ColumnHeightMeter blockRef={blockWrapRef} />
        </div>
      </div>
    </>
  )
}
