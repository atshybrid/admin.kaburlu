/**
 * Header slot sizes — aligned with GET /epaper/paper-page-specs (API source of truth).
 *
 * Broadsheet: 15″ trim · print 14″ wide · main 3″ · sub 1″
 * Tabloid:    11″ trim · print 10.5″ wide · main 2.5″ · sub 0.7″
 */
export const HEADER_SPECS = {
  broadsheet: {
    pageWidthIn: 15,
    marginIn: 0.5,
    contentWidthIn: 14,
    mainHeightIn: 3,
    subHeightIn: 1,
  },
  tabloid: {
    pageWidthIn: 11,
    marginIn: 0.25,
    contentWidthIn: 10.5,
    mainHeightIn: 2.5,
    subHeightIn: 0.7,
  },
}

/** Recommended professional combo (Eenadu / Andhra Jyothy style) */
export const RECOMMENDED_HEADER_STYLES = {
  page1Main: 2,
  page2PlusSub: 2,
}

export const FONTS = {
  telugu: "'Mandali', 'Noto Sans Telugu', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

export const DEFAULT_SETTINGS = {
  paperName: 'భారత్ దర్శన్',
  paperNameEn: 'MIRROR OF INDIA',
  sectionName: 'రాజకీయాలు',
  publishedAreas: 'Hyderabad • Warangal • Karimnagar • Khammam',
  date: '03 జూన్ 2026, మంగళవారం',
  volume: '21',
  issue: '106',
  price: '₹6.00',
  pageNumber: '2',
  accentColor: '#dc2626',
  tagline: 'మన భాష.. మన పత్రిక',
  websiteUrl: 'www.teluguprabha.net',
  runningCommentText: 'జర్నలిజం పడలు\nప్రారంభించిన అమెరికా\nఅనుకూల భాషనే\nపెట్టిన పలక',
  runningCommentAuthor: '- సి.ఎన్.రంగనాథ్',
  rightArticleTitle: 'కరోనా విజృంభణపై కేంద్ర అప్రమత్తం',
  rightArticlePoints: 'నిశితంగా గమనిస్తున్నామని\nకేంద్ర ఆరోగ్య శాఖ\nదేశంలో కరోనా పెరుగుదల',
  headerLogoUrl: '',
  subHeaderLogoUrl: '',
  adLeftUrl: '',
  adRightUrl: '',
  paperNameImageUrl: '',
  /** When no custom logo URL, show this in main style 2 center */
  useDemoLogo: true,
  demoLogoUrl:
    'https://picsum.photos/seed/kaburlu-masthead/900/220',
  demoArticleThumbUrl:
    'https://picsum.photos/seed/kaburlu-news/400/280',
  astrologyDay: 'మంగళవారం',
  astrologyTithi: 'శుక్ల పక్షం · ద్వాదశి',
  astrologyGoodTime: '6:30 — 8:15 AM',
  astrologyRahuKalam: '3:00 — 4:30 PM',
  astrologyYamagandam: '12:00 — 1:30 PM',
  astrologyGulika: '1:30 — 3:00 PM',
  goldRate: '₹72,450',
  silverRate: '₹85,200',
  goldChange: '+₹120',
  silverChange: '-₹80',
  machiMata: 'మనస్సును శాంతపరచుకోండి — అప్పుడు సరైన నిర్ణయం వస్తుంది.',
  machiMataAuthor: '— పెద్దమనుషుల మాట',
  twitterHandle: '@kaburlu_reader',
  twitterComment: 'ఈ వార్త చాలా బాగుంది — మా నగరానికి ప్రత్యేక ప్రాముఖ్యం!',
  twitterLikes: '2.4K',
  weatherLines: 'హైదరాబాద్: 34°C · ఎండ\nవరంగల్: 36°C · వేడి\nకరీంనగర్: 33°C · మేఘాలు',
  petrolRate: '₹109.86',
  dieselRate: '₹97.42',
  cngRate: '₹75.00',
}
