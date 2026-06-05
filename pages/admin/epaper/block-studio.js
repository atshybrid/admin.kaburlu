/**
 * ePaper Block Design Studio — Standalone fullscreen editor
 * Live-edit every prop for each block type. Use this page to
 * test, redesign, and approve block templates before touching source components.
 */
import React, { useState, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import ArticleBlock2in1col from '../../../components/epaper/ArticleBlock2in1col'
import ArticleBlock3in1col from '../../../components/epaper/ArticleBlock3in1col'
import ArticleBlock4in2col from '../../../components/epaper/ArticleBlock4in2col'
import ArticleBlock6in2col from '../../../components/epaper/ArticleBlock6in2col'
import ArticleBlock9in3col from '../../../components/epaper/ArticleBlock9in3col'
import ArticleBlock12in4col from '../../../components/epaper/ArticleBlock12in4col'
import ArticleBlockMainPageTop from '../../../components/epaper/ArticleBlockMainPageTop'
import { ACTIVE_BLOCK_CODES } from '../../../lib/epaper/epaperActiveBlocks'
import { BLOCK_SAMPLES } from '../../../lib/epaper/blockSamples'

// ─── Block meta ──────────────────────────────────────────────────────────────

const BLOCK_META = {
  'BLOCK-TOP8x7': {
    label: '8×7 in · Main page top',
    inches: 8,
    cols: 2,
    color: '#dc2626',
    cssWidth: '203.2mm',
    fontRange: 'Hero title + 2-col body',
    use: 'Front-page hero — Style 1 / Style 2',
    maxHighlights: 8,
    maxImages: 1,
    layout: 'hero + 2-column body',
    component: ArticleBlockMainPageTop,
  },
  'BLOCK-02A': {
    label: '2-inch · 1 col',
    inches: 2,
    cols: 1,
    color: '#6366f1',
    cssWidth: '50.8mm',
    fontRange: '8–20px title',
    use: 'News-in-brief, single sentence items',
    maxHighlights: 0,
    maxImages: 1,
    component: ArticleBlock2in1col,
  },
  'BLOCK-03A': {
    label: '3-inch · 1 col',
    inches: 3,
    cols: 1,
    color: '#0ea5e9',
    cssWidth: '76.2mm',
    fontRange: '9–24px title',
    use: 'Short news, 3–4 paragraphs',
    maxHighlights: 3,
    maxImages: 1,
    component: ArticleBlock3in1col,
  },
  'BLOCK-04A': {
    label: '4-inch · 2 or 3 col (adaptive)',
    inches: 4,
    cols: 2,
    color: '#10b981',
    cssWidth: '101.6mm',
    fontRange: '20–44px title (auto-fit, accent colour)',
    use: '2 images → 3 col, else 2 col. Col 1: highlights + dateline + article. Col 2/3: image + article. Bottom balanced.',
    maxHighlights: 3,
    maxImages: 2,
    layout: '2-col (adaptive 3-col with 2 images)',
    component: ArticleBlock4in2col,
  },
  'BLOCK-06A': {
    label: '6-inch · 2 col',
    inches: 6,
    cols: 2,
    color: '#f59e0b',
    cssWidth: '152.4mm',
    fontRange: '20–34px title',
    use: 'Feature / mid-page anchor, 5–7 paras',
    maxHighlights: 4,
    maxImages: 3,
    component: ArticleBlock6in2col,
  },
  'BLOCK-08A': {
    label: '7.5-inch · 3 col',
    inches: 7.5,
    cols: 3,
    color: '#ef4444',
    cssWidth: '152.4mm',
    fontRange: '20–34px title',
    use: 'Major story with large image, 6–8 paras',
    maxHighlights: 4,
    maxImages: 3,
    component: ArticleBlock6in2col,
  },
  'BLOCK-09A': {
    label: '9-inch · 3 col',
    inches: 9,
    cols: 3,
    color: '#8b5cf6',
    cssWidth: '228.6mm',
    fontRange: '28–44px title',
    use: 'Lead story, above-fold, 8+ paras, multi-image',
    maxHighlights: 5,
    maxImages: 3,
    component: ArticleBlock9in3col,
  },
  'BLOCK-12A': {
    label: '12-inch · 4 col',
    inches: 12,
    cols: 4,
    color: '#ec4899',
    cssWidth: '304.8mm',
    fontRange: '32–52px title',
    use: 'Banner / splash story, largest headline, 3 images',
    maxHighlights: 5,
    maxImages: 3,
    component: ArticleBlock12in4col,
  },
}

const BLOCK_ORDER = ACTIVE_BLOCK_CODES.filter((code) => BLOCK_META[code])

const CATEGORIES = ['general', 'political', 'crime', 'sports', 'business', 'entertainment']

// ─── Default sample props per block ──────────────────────────────────────────

const DEFAULT_PROPS = {
  'BLOCK-TOP8x7': { ...(BLOCK_SAMPLES['BLOCK-TOP8x7']?.props || {}) },
  'BLOCK-02A': {
    title: 'పోలీసులు ముగ్గురు నిందితులను అరెస్టు చేశారు',
    subtitle: 'స్థానిక',
    category: 'crime',
    dateline: 'హైదరాబాద్',
    highlights: [],
    images: [],
    paragraphs: [
      'నిన్న రాత్రి జరిగిన దొంగతనం కేసులో పోలీసులు ముగ్గురు నిందితులను అదుపులోకి తీసుకున్నారు.',
      'వారిపై వివిధ సెక్షన్ల కింద కేసు నమోదు చేశారు.',
    ],
  },
  'BLOCK-03A': {
    title: 'రాష్ట్రంలో వర్షాలు తీవ్రంగా కురిశాయి',
    subtitle: 'వాతావరణ హెచ్చరిక',
    category: 'general',
    dateline: 'అమరావతి',
    titleColor: '',
    imageObjectPosition: '50% 25%',
    highlights: ['16 జిల్లాల్లో అలర్ట్', 'ఎన్డీఆర్ఎఫ్ బృందాలు సిద్ధం'],
    images: [{ src: 'https://placehold.co/180x240/334155/ffffff?text=Photo', alt: '', caption: 'ప్రతినిధి ఫోటో' }],
    paragraphs: [
      'గత 24 గంటల్లో రాష్ట్రవ్యాప్తంగా భారీ వర్షాలు కురిశాయి.',
      'పలు జిల్లాల్లో వరదలు పొంగిపొర్లుతున్నాయి.',
      'ప్రభుత్వం రెడ్ అలర్ట్ జారీ చేసింది.',
      'ఎన్డీఆర్ఎఫ్ బృందాలు ప్రభావిత ప్రాంతాలలో విస్తరించాయి.',
    ],
  },
  'BLOCK-04A': {
    title: 'కేంద్రం కొత్త వ్యవసాయ పథకాన్ని ప్రకటించింది',
    subtitle: 'వ్యవసాయ రంగానికి ప్రోత్సాహం',
    category: 'political',
    dateline: 'న్యూ ఢిల్లీ',
    highlights: ['రూ.1.5 లక్షల కోట్లు', 'కోటి మంది రైతులకు ప్రయోజనం'],
    images: [
      { url: 'https://placehold.co/200x130/1a3a6b/ffffff?text=చిత్రం+1', caption: 'పంట కోత సమయంలో రైతులు' },
      { url: 'https://placehold.co/200x130/16A085/ffffff?text=చిత్రం+2', caption: 'నీటిపారుదల ప్రాజెక్ట్ ప్రారంభం' },
    ],
    paragraphs: [
      'కేంద్ర ప్రభుత్వం శుక్రవారం వ్యవసాయ రంగానికి సంబంధించిన సమగ్ర పథకాన్ని ప్రకటించింది.',
      'ఈ పథకం కింద కోటి మందికి పైగా రైతులకు లబ్ది చేకూరనుంది.',
      'రూ.1.5 లక్షల కోట్ల విలువైన ఈ ప్యాకేజీలో సేద్యపు నీటి సౌకర్యాలు, నూతన సాంకేతికత బదిలీ ఉన్నాయి.',
      'ఇది రైతుల ఆదాయాన్ని రెట్టింపు చేయడానికి సహాయపడుతుందని మంత్రి వివరించారు.',
      'వ్యవసాయ శాఖ మంత్రి పథకం వివరాలను మీడియాకు తెలిపారు.',
    ],
  },
  'BLOCK-06A': {
    title: 'తెలంగాణలో సాంకేతిక పెట్టుబడులు రూ.2 లక్షల కోట్లు దాటాయి',
    subtitle: 'హైదరాబాద్ పారిశ్రామిక విస్తరణ',
    category: 'business',
    dateline: 'హైదరాబాద్',
    highlights: ['500 స్టార్టప్‌లకు అనుమతి', 'ఐటీ ఉద్యోగాలు 40% పెరిగాయి', 'అంతర్జాతీయ కంపెనీల ఆసక్తి'],
    images: [],
    paragraphs: [
      'హైదరాబాద్‌లో సాంకేతిక పరిశ్రమ అభివృద్ధి వేగంగా జరుగుతోంది.',
      'గత ఆర్థిక సంవత్సరంలో రూ.2 లక్షల కోట్లకు పైగా పెట్టుబడులు వచ్చాయి.',
      'ఇందులో అమెరికా, జపాన్, కొరియా దేశాల నుండి వచ్చిన విదేశీ పెట్టుబడులు ఎక్కువగా ఉన్నాయి.',
      'మైక్రోసాఫ్ట్, గూగుల్, అమెజాన్ కంపెనీలు తమ కార్యాలయాలను మరింత విస్తరిస్తున్నాయి.',
      'ఐటీ రంగంలో 40 శాతం ఉద్యోగాలు పెరిగాయని అధికారిక లెక్కలు చెప్తున్నాయి.',
      'ముఖ్యమంత్రి ఈ పెట్టుబడులను ఆహ్వానిస్తూ మరిన్ని రాయితీలు ప్రకటించారు.',
    ],
  },
  'BLOCK-08A': {
    title: 'రాష్ట్రపతి ఎన్నిక: ఎన్డీఏ అభ్యర్థి ఘనవిజయం',
    subtitle: 'ఇండియా కూటమి అభ్యర్థిపై 3 లక్షల ఓట్ల తేడా',
    category: 'political',
    dateline: 'న్యూ ఢిల్లీ',
    highlights: ['ఎన్డీఏ అభ్యర్థికి 6.78 లక్షల ఓట్లు', 'కూటమి అభ్యర్థికి 3.80 లక్షల ఓట్లు'],
    images: [
      { url: 'https://placehold.co/400x250/1a1a2e/ffffff?text=Photo', caption: 'ఫలితాలు ప్రకటించిన తర్వాత వేడుకలు' },
    ],
    paragraphs: [
      'భారత రాష్ట్రపతి ఎన్నికలో ఎన్డీఏ అభ్యర్థి భారీ మెజారిటీతో విజయం సాధించారు.',
      'ఎన్నికల కమిషన్ గురువారం రాత్రి అధికారికంగా ఫలితాలు ప్రకటించింది.',
      'బిజెపి నేతృత్వంలోని ఎన్డీఏ సంకీర్ణం ఈ విజయాన్ని వేడుకలతో స్వాగతించింది.',
      'నూతన రాష్ట్రపతి వచ్చే నెల 25న ప్రమాణ స్వీకారం చేయనున్నారు.',
      'ఈ ఎన్నిక దేశంలో ప్రజాస్వామ్యం బలంగా ఉందని నిరూపించిందని నేతలు అభిప్రాయపడ్డారు.',
    ],
  },
  'BLOCK-09A': {
    title: 'ఆంధ్రప్రదేశ్ రాజధాని అమరావతి నిర్మాణం మళ్ళీ ప్రారంభం',
    subtitle: 'సుప్రీంకోర్టు ఆదేశాల నేపథ్యంలో పనులు వేగవంతం',
    category: 'political',
    dateline: 'అమరావతి',
    highlights: ['రూ.50,000 కోట్ల ప్రాజెక్ట్', '2027 నాటికి తొలిదశ పూర్తి', 'సింగపూర్ నమూనాలో రాజధాని'],
    images: [
      { url: 'https://placehold.co/360x220/0f3460/ffffff?text=అమరావతి', caption: 'అమరావతి నిర్మాణ ప్రాంతంలో తాజా దృశ్యం' },
      { url: 'https://placehold.co/360x220/16213e/ffffff?text=Master+Plan', caption: 'రాజధాని మాస్టర్ ప్లాన్ మ్యాప్' },
    ],
    paragraphs: [
      'ఆంధ్రప్రదేశ్ రాజధాని అమరావతి నిర్మాణం మళ్ళీ ముమ్మరంగా ప్రారంభమైంది.',
      'సుప్రీంకోర్టు ఆదేశాల నేపథ్యంలో నిర్మాణ సంస్థలు పని వేగాన్ని పెంచాయి.',
      'రూ.50,000 కోట్ల అంచనా వ్యయంతో రాజధాని నిర్మాణం జరుగుతోంది.',
      '2027 నాటికి తొలి దశ పనులు పూర్తి చేయాలని ప్రభుత్వం లక్ష్యంగా నిర్ణయించింది.',
      'సింగపూర్ నమూనాలో తీర్చిదిద్దే ఈ రాజధాని అభివృద్ధికి అంతర్జాతీయ నిధులు లభించాయి.',
      'కేంద్రం కూడా ప్రత్యేక ప్యాకేజీ ద్వారా అమరావతి నిర్మాణాన్ని వేగవంతం చేయాలని నిర్ణయించింది.',
      'ముఖ్యమంత్రి శనివారం నిర్మాణ ప్రాంతాన్ని పరిశీలించి పనుల పురోగతిని సమీక్షించారు.',
    ],
  },
  'BLOCK-12A': {
    title: 'భారత్-పాకిస్తాన్ సమగ్ర శాంతి చర్చలు తిరిగి మొదలయ్యాయి',
    subtitle: 'అంతర్జాతీయ మధ్యవర్తిత్వంతో చారిత్రాత్మక సమావేశం — బంధం పునరుద్ధరణకు అంగీకారం',
    category: 'political',
    dateline: 'ఇస్లామాబాద్ / న్యూ ఢిల్లీ',
    highlights: ['రెండు దేశాల విదేశాంగ మంత్రులు భేటీ', '25 ఏళ్ళ తర్వాత అత్యున్నత స్థాయి చర్చలు', 'వాణిజ్య సంబంధాల పునరుద్ధరణ'],
    images: [
      { url: 'https://placehold.co/340x210/1a1a2e/ffffff?text=శాంతి+చర్చలు', caption: 'ఇస్లామాబాద్‌లో జరిగిన సమావేశం' },
      { url: 'https://placehold.co/340x210/16213e/ffffff?text=Handshake', caption: 'విదేశాంగ మంత్రుల హస్తధూళనం' },
      { url: 'https://placehold.co/340x210/0f3460/ffffff?text=UN+Talks', caption: 'యూఎన్ ప్రతినిధులతో సంప్రదింపులు' },
    ],
    paragraphs: [
      'దీర్ఘకాలం పాటు స్తంభించిన భారత్-పాకిస్తాన్ సంబంధాలు మళ్ళీ కొత్తమలుపు తిరిగాయి.',
      'ఇస్లామాబాద్‌లో గురువారం జరిగిన సమావేశంలో రెండు దేశాల విదేశాంగ మంత్రులు కలిశారు.',
      '25 ఏళ్ళ తర్వాత జరిగిన ఈ అత్యున్నత స్థాయి చర్చలను అంతర్జాతీయ సమాజం ఆహ్వానించింది.',
      'కాశ్మీర్ వివాదం పక్కన పెట్టి ముందుగా వాణిజ్య సంబంధాలు పునరుద్ధరించాలని అంగీకరించాయి.',
      'ఈ నిర్ణయంతో ఉభయ దేశాల ప్రజల మధ్య వీసా సడలింపులు అమలవుతాయని అధికారులు తెలిపారు.',
      'యూఎన్ సెక్రటరీ జనరల్ ఈ పురోగతిని "చారిత్రాత్మకం" అని అభివర్ణించారు.',
      'మరుసటి సమావేశం ఢిల్లీలో జరపాలని నిర్ణయించారు, తేదీ ఖరారు కావాల్సి ఉంది.',
    ],
  },
}

// ─── Tiny UI helpers ──────────────────────────────────────────────────────────

const S = {
  label: { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, display: 'block' },
  input: {
    width: '100%',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#f1f5f9',
    fontSize: 12,
    padding: '6px 8px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#f1f5f9',
    fontSize: 12,
    padding: '6px 8px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    resize: 'vertical',
    outline: 'none',
    lineHeight: 1.5,
  },
  select: {
    width: '100%',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#f1f5f9',
    fontSize: 12,
    padding: '6px 8px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
  },
  fieldGroup: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    padding: '8px 0 6px',
    borderBottom: '1px solid #1e293b',
    marginBottom: 12,
  },
  btn: (color = '#6366f1') => ({
    background: color,
    color: '#fff',
    border: 'none',
    borderRadius: 5,
    padding: '5px 10px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  }),
  btnGhost: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: 5,
    padding: '4px 8px',
    fontSize: 11,
    cursor: 'pointer',
  },
}

// ─── Props editor panel ───────────────────────────────────────────────────────

function PropsEditor({ blockCode, props, onChange }) {
  const meta = BLOCK_META[blockCode]

  const set = (key, val) => onChange({ ...props, [key]: val })

  // paragraphs as newline-separated textarea
  const parasText = (props.paragraphs || []).join('\n\n')
  const setParas = txt => set('paragraphs', txt.split(/\n{2,}/).map(s => s.trim()).filter(Boolean))

  // highlights as newline-separated
  const hlText = (props.highlights || []).join('\n')
  const setHl = txt => set('highlights', txt.split('\n').map(s => s.trim()).filter(Boolean))

  // image url/caption helpers
  const setImageField = (idx, field, val) => {
    const imgs = [...(props.images || [])]
    imgs[idx] = { ...imgs[idx], [field]: val }
    set('images', imgs)
  }
  const addImage = () => set('images', [...(props.images || []), { url: '', caption: '' }])
  const removeImage = idx => set('images', (props.images || []).filter((_, i) => i !== idx))

  return (
    <div style={{ padding: '0 16px 24px' }}>

      {/* ── Basic fields ── */}
      <div style={S.sectionTitle}>Content</div>

      <div style={S.fieldGroup}>
        <label style={S.label}>Title</label>
        <textarea
          rows={2}
          style={S.textarea}
          value={props.title || ''}
          onChange={e => set('title', e.target.value)}
        />
      </div>

      <div style={S.fieldGroup}>
        <label style={S.label}>Subtitle / Deck</label>
        <input style={S.input} value={props.subtitle || ''} onChange={e => set('subtitle', e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={S.label}>Category</label>
          <select style={S.select} value={props.category || 'general'} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={S.label}>Dateline</label>
          <input style={S.input} value={props.dateline || ''} onChange={e => set('dateline', e.target.value)} />
        </div>
      </div>

      {/* ── Highlights ── */}
      {meta.maxHighlights > 0 && (
        <div style={S.fieldGroup}>
          <label style={S.label}>Highlights (one per line, max {meta.maxHighlights})</label>
          <textarea
            rows={3}
            style={S.textarea}
            value={hlText}
            onChange={e => setHl(e.target.value)}
            placeholder="ముఖ్యాంశం 1&#10;ముఖ్యాంశం 2"
          />
        </div>
      )}

      {/* ── Paragraphs ── */}
      <div style={S.fieldGroup}>
        <label style={S.label}>Paragraphs (blank line = new paragraph)</label>
        <textarea
          rows={10}
          style={{ ...S.textarea, lineHeight: 1.6 }}
          value={parasText}
          onChange={e => setParas(e.target.value)}
        />
      </div>

      {/* ── Images ── */}
      {meta.maxImages > 0 && (
        <div style={S.fieldGroup}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ ...S.label, marginBottom: 0 }}>Images (max {meta.maxImages})</label>
            {(props.images || []).length < meta.maxImages && (
              <button style={S.btn('#0ea5e9')} onClick={addImage}>+ Add</button>
            )}
          </div>
          {(props.images || []).map((img, idx) => (
            <div key={idx} style={{ background: '#1e293b', borderRadius: 6, padding: 8, marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: '#64748b' }}>Image {idx + 1}</span>
                <button style={S.btnGhost} onClick={() => removeImage(idx)}>✕</button>
              </div>
              <input
                style={{ ...S.input, marginBottom: 6 }}
                placeholder="Image URL"
                value={img.url || ''}
                onChange={e => setImageField(idx, 'url', e.target.value)}
              />
              <input
                style={S.input}
                placeholder="Caption"
                value={img.caption || ''}
                onChange={e => setImageField(idx, 'caption', e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Reset ── */}
      <button
        style={{ ...S.btnGhost, width: '100%', marginTop: 4, padding: '7px', textAlign: 'center' }}
        onClick={() => onChange({ ...DEFAULT_PROPS[blockCode] })}
      >
        ↺ Reset to defaults
      </button>
    </div>
  )
}

// ─── Block rules panel ────────────────────────────────────────────────────────

function BlockRules({ blockCode }) {
  const meta = BLOCK_META[blockCode]
  if (!meta) return null
  const rows = [
    { label: 'Block Code', val: blockCode },
    { label: 'Size', val: `${meta.inches} inches tall` },
    { label: 'Columns', val: `${meta.cols} column${meta.cols > 1 ? 's' : ''}` },
    { label: 'Layout Style', val: meta.layout || (meta.cols === 1 ? 'single-column' : 'multi-column balanced') },
    { label: 'CSS Width', val: meta.cssWidth },
    { label: 'Title font range', val: meta.fontRange },
    { label: 'Max highlights', val: `${meta.maxHighlights}` },
    { label: 'Max images', val: `${meta.maxImages}` },
    { label: 'Component file', val: `ArticleBlock${meta.inches === 8 ? '6' : meta.inches}in${meta.cols === 1 && meta.inches === 4 ? '2' : meta.cols}col.jsx` },
    { label: 'Page placement', val: meta.use },
  ]
  return (
    <div style={{ padding: '0 16px 24px' }}>
      <div style={S.sectionTitle}>Block Rules</div>
      {rows.map(r => (
        <div key={r.label} style={{ marginBottom: 10 }}>
          <div style={{ ...S.label, marginBottom: 2 }}>{r.label}</div>
          <div style={{
            background: '#1e293b',
            borderRadius: 5,
            padding: '5px 8px',
            color: '#e2e8f0',
            fontSize: 12,
            fontFamily: r.label === 'Component file' || r.label === 'CSS Width' ? 'monospace' : 'inherit',
          }}>{r.val}</div>
        </div>
      ))}

      {/* BLOCK-04A specific: adaptive layout flow diagram */}
      {blockCode === 'BLOCK-04A' && (
        <>
          <div style={{ ...S.sectionTitle, marginTop: 16 }}>Adaptive Layout Flow</div>
          {/* Full-width title + subtitle row */}
          <div style={{ background: '#1e293b', borderRadius: 5, padding: '6px 8px', marginBottom: 4, textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: '#10b981', fontSize: 11 }}>TITLE (big · accent colour · auto-fit 20–44px)</div>
            <div style={{ color: '#64748b', fontSize: 10 }}>Centre-aligned · accent border-bottom · full width</div>
          </div>
          <div style={{ background: '#1e293b', borderRadius: 5, padding: '5px 8px', marginBottom: 6, textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: '#10b981', fontSize: 11 }}>SUBTITLE (accent colour · 12px)</div>
            <div style={{ color: '#64748b', fontSize: 10 }}>Centre-aligned · full width</div>
          </div>
          {/* 3-column grid diagram */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
            {[
              { head: 'COL 1', lines: ['► Highlights (top)', 'DATELINE article…', '…article continues'], note: 'always present' },
              { head: 'COL 2', lines: ['📷 Image 1', '…caption…', '…article continues'], note: 'image optional' },
              { head: 'COL 3', lines: ['📷 Image 2', '…caption…', '…article continues'], note: '2 images only', dim: true },
            ].map((c, i) => (
              <div key={i} style={{ flex: 1, background: '#1e293b', borderRadius: 5, padding: '5px 6px', opacity: c.dim ? 0.55 : 1, borderTop: `2px solid #10b981` }}>
                <div style={{ fontWeight: 700, color: '#10b981', fontSize: 10, marginBottom: 3 }}>{c.head}</div>
                {c.lines.map((ln, j) => (
                  <div key={j} style={{ fontSize: 9, color: '#94a3b8', marginBottom: 2 }}>{ln}</div>
                ))}
                <div style={{ fontSize: 8, color: '#475569', marginTop: 3, fontStyle: 'italic' }}>{c.note}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', padding: '4px 8px', background: '#1e293b', borderRadius: 5 }}>
            Bottom text balanced · 2 imgs → 3 col · else 2 col · dateline bold in col 1
          </div>
        </>
      )}

      <div style={{ ...S.sectionTitle, marginTop: 16 }}>Layout Promotion Rules</div>
      <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.7 }}>
        <div style={{ marginBottom: 6, padding: '6px 8px', background: '#1e293b', borderRadius: 5 }}>
          <span style={{ color: '#ec4899', fontWeight: 700 }}>Rank 1 (Lead)</span> → BLOCK-12A (banner)
        </div>
        <div style={{ marginBottom: 6, padding: '6px 8px', background: '#1e293b', borderRadius: 5 }}>
          <span style={{ color: '#8b5cf6', fontWeight: 700 }}>Rank 2</span> → BLOCK-09A (3-col lead)
        </div>
        <div style={{ marginBottom: 6, padding: '6px 8px', background: '#1e293b', borderRadius: 5 }}>
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>Rank 3–4</span> → BLOCK-06A (feature)
        </div>
        <div style={{ marginBottom: 6, padding: '6px 8px', background: '#1e293b', borderRadius: 5 }}>
          <span style={{ color: '#10b981', fontWeight: 700 }}>Mid stories</span> → BLOCK-04A (regular)
        </div>
        <div style={{ padding: '6px 8px', background: '#1e293b', borderRadius: 5 }}>
          <span style={{ color: '#0ea5e9', fontWeight: 700 }}>Bottom 20%</span> → BLOCK-03A / BLOCK-02A (brief)
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BlockStudio() {
  const [activeCode, setActiveCode] = useState('BLOCK-04A')
  const [zoom, setZoom] = useState(0.65)
  const [rightTab, setRightTab] = useState('rules') // 'edit' | 'rules' — open on rules by default
  const [propsMap, setPropsMap] = useState(() => {
    const m = {}
    BLOCK_ORDER.forEach(c => { m[c] = { ...DEFAULT_PROPS[c] } })
    return m
  })

  const meta = BLOCK_META[activeCode]
  const BlockComp = meta.component
  const currentProps = propsMap[activeCode]

  const handlePropsChange = useCallback((code, newProps) => {
    setPropsMap(prev => ({ ...prev, [code]: newProps }))
  }, [])

  return (
    <>
      <Head>
        <title>Block Design Studio | ePaper</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Mandali&display=swap" rel="stylesheet" />
      </Head>

      <div style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, sans-serif",
        background: '#020617',
        color: '#e2e8f0',
      }}>

        {/* ══ LEFT — block selector ══ */}
        <aside style={{
          width: 200,
          flexShrink: 0,
          background: '#0f172a',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #1e293b',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #1e293b' }}>
            <Link href="/admin/epaper" style={{ fontSize: 10, color: '#475569', textDecoration: 'none', display: 'block', marginBottom: 8 }}>
              ← ePaper Home
            </Link>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>Block Studio</div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>Select a block to edit</div>
          </div>

          {/* Block list */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
            {BLOCK_ORDER.map(code => {
              const m = BLOCK_META[code]
              if (!m) return null
              const isActive = activeCode === code
              return (
                <button
                  key={code}
                  onClick={() => setActiveCode(code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 14px',
                    background: isActive ? '#1e293b' : 'transparent',
                    borderLeft: `3px solid ${isActive ? m.color : 'transparent'}`,
                    border: 'none',
                    borderLeft: `3px solid ${isActive ? m.color : 'transparent'}`,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{
                    width: 28, height: 28,
                    borderRadius: 6,
                    background: isActive ? m.color : '#1e293b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 800,
                    color: isActive ? '#fff' : '#64748b',
                    flexShrink: 0,
                    letterSpacing: '-0.03em',
                  }}>
                    {m.inches}in
                  </span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#f1f5f9' : '#94a3b8', lineHeight: 1.2 }}>{code}</div>
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>{m.cols} col · {m.inches}in</div>
                  </div>
                </button>
              )
            })}
          </nav>

          {/* Zoom */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: '#64748b' }}>Zoom</span>
              <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range" min={0.2} max={1} step={0.05} value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              style={{ width: '100%', accentColor: meta.color }}
            />
          </div>
        </aside>

        {/* ══ CENTER — live preview ══ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0f172a' }}>

          {/* Top bar */}
          <div style={{
            background: '#0f172a',
            borderBottom: '1px solid #1e293b',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}>
            <span style={{
              background: meta.color,
              color: '#fff',
              fontWeight: 800,
              fontSize: 12,
              padding: '4px 12px',
              borderRadius: 6,
              letterSpacing: '0.03em',
            }}>
              {activeCode}
            </span>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{meta.label}</span>
              <span style={{ fontSize: 11, color: '#475569', marginLeft: 10 }}>{meta.cssWidth} · {meta.fontRange}</span>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 10, color: '#334155' }}>
              Live preview — edits apply instantly
            </div>
          </div>

          {/* Canvas */}
          <div style={{ flex: 1, overflow: 'auto', padding: '32px 24px', display: 'flex', justifyContent: 'flex-start' }}>
            {/* Newspaper background */}
            <div style={{
              background: '#fffef9',
              boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
              transformOrigin: 'top left',
              transform: `scale(${zoom})`,
              // avoid collapsing the parent when scaled down
              marginRight: `calc(${meta.cssWidth} * ${zoom} - ${meta.cssWidth})`,
              marginBottom: `calc(600px * ${zoom} - 600px)`,
              flexShrink: 0,
            }}>
              <BlockComp {...currentProps} />
            </div>
          </div>
        </div>

        {/* ══ RIGHT — editor / rules tabs ══ */}
        <aside style={{
          width: 300,
          flexShrink: 0,
          background: '#0f172a',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #1e293b',
          overflow: 'hidden',
        }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
            {[
              { id: 'edit', label: 'Edit Content' },
              { id: 'rules', label: 'Block Rules' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setRightTab(t.id)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: rightTab === t.id ? `2px solid ${meta.color}` : '2px solid transparent',
                  color: rightTab === t.id ? '#f1f5f9' : '#64748b',
                  fontSize: 12,
                  fontWeight: rightTab === t.id ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', paddingTop: 12 }}>
            {rightTab === 'edit'
              ? <PropsEditor
                  key={activeCode}
                  blockCode={activeCode}
                  props={currentProps}
                  onChange={p => handlePropsChange(activeCode, p)}
                />
              : <BlockRules blockCode={activeCode} />
            }
          </div>
        </aside>

      </div>
    </>
  )
}
