/**
 * Shared ePaper article block samples — used by Block Templates studio and Block style workbench.
 */
import ArticleBlock2in1col from '../../components/epaper/ArticleBlock2in1col'
import ArticleBlock3in1col from '../../components/epaper/ArticleBlock3in1col'
import ArticleBlock4in2col from '../../components/epaper/ArticleBlock4in2col'
import ArticleBlock6in2col from '../../components/epaper/ArticleBlock6in2col'
import ArticleBlock9in3col from '../../components/epaper/ArticleBlock9in3col'
import ArticleBlock12in4col from '../../components/epaper/ArticleBlock12in4col'
import ArticleBlockMainPageTop from '../../components/epaper/ArticleBlockMainPageTop'
import { ACTIVE_BLOCK_CODES } from './epaperActiveBlocks'
import { BLOCK_TOP8X7_DIMENSIONS } from './mainPageTopBlockRules'

export const BLOCK_SAMPLES = {
  'BLOCK-TOP8x7': {
    label: '8×7 in · Main page top',
    description:
      'Front-page hero 8×7in — Style 1 (stroke title) or Style 2 (green band + yellow callout). Studio: /admin/epaper/main-page-top-blocks',
    category: 'political',
    component: ArticleBlockMainPageTop,
    nativeW: BLOCK_TOP8X7_DIMENSIONS.nativeWidthPx,
    nativeH: BLOCK_TOP8X7_DIMENSIONS.nativeHeightPx,
    props: {
      title: 'చంద్రబాబు',
      titleKicker: 'అవినీతికి అడ్డుగా దిట్టరించిన',
      subtitle: '',
      category: 'political',
      highlights: [
        'అసెంబ్లీలో కేసీఆర్‌పై వ్యంగ్య చిత్రాల ప్రదర్శన',
        'అవినీతికి అడ్డుగా నిలబడతామని హామీ',
        'ప్రజా ప్రయోజనాలకు అనుగుణంగా నిర్ణయాలు',
        'రాష్ట్ర అభివృద్ధికి ప్రత్యేక దృష్టి',
        'ప్రజల నమ్మకాన్ని కేటాయించి పని చేస్తాము',
        'ప్రతిపక్ష విమర్శలపై స్పందన',
        'బడ్జెట్ సమావేశాల్లో కీలక ప్రకటనలు',
        'అవినీతి నిర్మూలనకు కట్టుదిట్ట చర్యలు',
      ],
      images: [{ src: '/epaper/main-page-hero-sample.png', alt: 'Subject PNG' }],
      paragraphs: [
        'అమరావతి: అసెంబ్లీ బడ్జెట్ సమావేశాల్లో ముఖ్యమంత్రి చంద్రబాబు నాయుడు ప్రజా ప్రయోజనాలకు అనుగుణంగా నిర్ణయాలు తీసుకుంటామని హామీ ఇచ్చారు. రాష్ట్ర అభివృద్ధికి అడ్డుకాగల ప్రతి అవినీతి పద్ధతికి వ్యతిరేకంగా పోరాడతామని చెప్పారు.',
        'ప్రభుత్వం పారదర్శకతతో పని చేస్తుందని, ప్రజల నమ్మకాన్ని కేటాయించి పని చేయాలని ఆయన పునరుద్ఘాటించారు. ఈ సందర్భంగా అసెంబ్లీలో కేసీఆర్‌పై వ్యంగ్య చిత్రాలను ప్రదర్శించిన విషయం మీద తీవ్ర విమర్శలు వెల్లవయ్యాయి.',
        '“ప్రజల నమ్మకాన్ని కేటాయించి పని చేస్తాము” అని ముఖ్యమంత్రి అన్నారు.',
        'ఈ సమావేశంలో పలు కేంద్ర పథకాల అమలుపై సమీక్ష జరిగింది. జిల్లా స్థాయిలో అభివృద్ధి కార్యక్రమాలను వేగవంతం చేయాలని ఆదేశాలు జారీ చేశారు.',
        'ప్రతిపక్ష నాయకులు ప్రభుత్వ విధానాలపై ప్రశ్నలు లేవనెత్తారు. ముఖ్యమంత్రి వారి ఆరోపణలకు స్పష్టమైన సమాధానాలు ఇచ్చారు.',
      ],
      quoteText: '“ప్రజల నమ్మకాన్ని కేటాయించి పని చేస్తాము” అని ముఖ్యమంత్రి అన్నారు.',
      quoteAttribution: '— CM Chandrababu Naidu',
      continuedPage: '2',
    },
  },
  'BLOCK-02A': {
    label: '2-inch · 1 column',
    description: 'Brief / News-in-brief. Short headline, 1–2 sentences only.',
    category: 'general',
    component: ArticleBlock2in1col,
    nativeW: 192,
    props: {
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
  },
  'BLOCK-03A': {
    label: '3-inch · 1 column',
    description: 'Brief slot (~4in max height). Title colour API or hash; dashed highlight rows; float photo.',
    category: 'general',
    component: ArticleBlock3in1col,
    nativeW: 288,
    props: {
      title: 'రాష్ట్రంలో వర్షాలు తీవ్రంగా కురిశాయి',
      subtitle: 'వాతావరణం',
      category: 'general',
      titleColor: '',
      imageObjectPosition: '52% 22%',
      dateline: 'అమరావతి',
      highlights: ['16 జిల్లాల్లో అలర్ట్', 'ఎన్డీఆర్ఎఫ్ బృందాలు సిద్ధం'],
      images: [{ src: 'https://placehold.co/180x240/334155/ffffff?text=Photo', alt: '', caption: 'ప్రతినిధి ఫోటో' }],
      paragraphs: [
        'గత 24 గంటల్లో రాష్ట్రవ్యాప్తంగా భారీ వర్షాలు కురిశాయి.',
        'పలు జిల్లాల్లో వరదలు పొంగిపొర్లుతున్నాయి.',
        'ప్రభుత్వం రెడ్ అలర్ట్ జారీ చేసింది.',
        'ఎన్డీఆర్ఎఫ్ బృందాలు ప్రభావిత ప్రాంతాలలో విస్తరించాయి.',
      ],
    },
  },
  'BLOCK-04A': {
    label: '4-inch · 2 column',
    description: 'Style 1: regular title (no bold), photo, centered headline bullets + dashed underline, H&J body.',
    category: 'political',
    component: ArticleBlock4in2col,
    nativeW: 384,
    props: {
      title: 'కేంద్రం కొత్త వ్యవసాయ పథకాన్ని ప్రకటించింది',
      subtitle: 'వ్యవసాయ రంగానికి ప్రోత్సాహం',
      category: 'political',
      titleColor: 'true',
      titleColorEnabled: true,
      imageObjectPosition: '50% 30%',
      dateline: 'న్యూ ఢిల్లీ',
      highlights: ['రూ.1.5 లక్షల కోట్లు', 'కోటి మంది రైతులకు ప్రయోజనం'],
      images: [{ src: 'https://placehold.co/360x180/1a3a6b/ffffff?text=Photo', alt: '', caption: '' }],
      paragraphs: [
        'కేంద్ర ప్రభుత్వం శుక్రవారం వ్యవసాయ రంగానికి సంబంధించిన సమగ్ర పథకాన్ని ప్రకటించింది.',
        'ఈ పథకం కింద కోటి మందికి పైగా రైతులకు లబ్ది చేకూరనుంది.',
        'రూ.1.5 లక్షల కోట్ల విలువైన ఈ ప్యాకేజీలో సేద్యపు నీటి సౌకర్యాలు, నూతన సాంకేతికత బదిలీ ఉన్నాయి.',
        'ఇది రైతుల ఆదాయాన్ని రెట్టింపు చేయడానికి సహాయపడుతుందని మంత్రి వివరించారు.',
      ],
    },
  },
  'BLOCK-06A': {
    label: '6-inch · 2 column',
    description: 'Feature story / mid-page anchor. Centered title, col1 highlights, 2-col body.',
    category: 'political',
    component: ArticleBlock6in2col,
    nativeW: 576,
    props: {
      blockCode: 'BLOCK-06A',
      title: 'తెలంగాణలో సాంకేతిక పెట్టుబడులు రూ.2 లక్షల కోట్లు దాటాయి',
      subtitle: 'హైదరాబాద్ పారిశ్రామిక విస్తరణ',
      category: 'business',
      dateline: 'హైదరాబాద్',
      highlights: [
        '500 స్టార్టప్‌లకు అనుమతి',
        'ఐటీ ఉద్యోగాలు 40% పెరిగాయి',
        'అంతర్జాతీయ కంపెనీల ఆసక్తి',
      ],
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
  },
  'BLOCK-08A': {
    label: '7.5-inch · 3 column',
    description:
      'Major story — col1: highlights (if any) + body · col2: image + body · col3: 2nd image top + body OR body from top · all 3 bottoms align.',
    category: 'political',
    component: ArticleBlock6in2col,
    nativeW: 720,
    props: {
      blockCode: 'BLOCK-08A',
      title: 'రాష్ట్రపతి ఎన్నిక: ఎన్డీఏ అభ్యర్థి ఘనవిజయం',
      subtitle: 'ఇండియా కూటమి అభ్యర్థిపై 3 లక్షల ఓట్ల తేడా',
      category: 'political',
      dateline: 'న్యూ ఢిల్లీ',
      highlights: [
        'ఎన్డీఏ అభ్యర్థికి 6.78 లక్షల ఓట్లు',
        'కూటమి అభ్యర్థికి 3.80 లక్షల ఓట్లు',
        'నూతన రాష్ట్రపతి ప్రమాణ స్వీకారం',
      ],
      images: [
        { url: 'https://placehold.co/400x250/1a1a2e/ffffff?text=Photo', caption: 'రాష్ట్రపతి ఎన్నిక ఫలితాలు ప్రకటించిన తర్వాత వేడుకలు' },
      ],
      paragraphs: [
        'భారత రాష్ట్రపతి ఎన్నికలో ఎన్డీఏ అభ్యర్థి భారీ మెజారిటీతో విజయం సాధించారు.',
        'ఇండియా కూటమి అభ్యర్థిపై దాదాపు 3 లక్షల ఓట్ల తేడాతో గెలిచారు.',
        'ఎన్నికల కమిషన్ గురువారం రాత్రి అధికారికంగా ఫలితాలు ప్రకటించింది.',
        'బిజెపి నేతృత్వంలోని ఎన్డీఏ సంకీర్ణం ఈ విజయాన్ని వేడుకలతో స్వాగతించింది.',
        'నూతన రాష్ట్రపతి వచ్చే నెల 25న ప్రమాణ స్వీకారం చేయనున్నారు.',
        'ఈ ఎన్నిక దేశంలో ప్రజాస్వామ్యం బలంగా ఉందని నిరూపించిందని నేతలు అభిప్రాయపడ్డారు.',
      ],
    },
  },
  'BLOCK-09A': {
    label: '9-inch · 3 column',
    description: 'Lead / above-fold story. Bold headline, byline, 8+ paragraphs, multi-image.',
    category: 'political',
    component: ArticleBlock9in3col,
    nativeW: 864,
    props: {
      title: 'ఆంధ్రప్రదేశ్ రాజధాని అమరావతి నిర్మాణం మళ్ళీ ప్రారంభం',
      subtitle: 'సుప్రీంకోర్టు ఆదేశాల నేపథ్యంలో పనులు వేగవంతం',
      category: 'political',
      dateline: 'అమరావతి',
      highlights: [
        'రూ.50,000 కోట్ల ప్రాజెక్ట్',
        '2027 నాటికి తొలిదశ పూర్తి',
        '33 గ్రామాల భూ సమీకరణ',
        'సింగపూర్ నమూనాలో రాజధాని',
      ],
      images: [
        { url: 'https://placehold.co/360x220/0f3460/ffffff?text=అమరావతి', caption: 'అమరావతి నిర్మాణ ప్రాంతంలో తాజా దృశ్యం' },
        { url: 'https://placehold.co/360x220/16213e/ffffff?text=Master+Plan', caption: 'రాజధాని మాస్టర్ ప్లాన్ మ్యాప్' },
      ],
      paragraphs: [
        'ఆంధ్రప్రదేశ్ రాజధాని అమరావతి నిర్మాణం మళ్ళీ ముమ్మరంగా ప్రారంభమైంది.',
        'సుప్రీంకోర్టు ఆదేశాల నేపథ్యంలో నిర్మాణ సంస్థలు పని వేగాన్ని పెంచాయి.',
        'రూ.50,000 కోట్ల అంచనా వ్యయంతో రాజధాని నిర్మాణం జరుగుతోంది.',
        '2027 నాటికి తొలి దశ పనులు పూర్తి చేయాలని ప్రభుత్వం లక్ష్యంగా నిర్ణయించింది.',
        '33 గ్రామాల రైతులు భూమి ఇచ్చిన ప్రాంతంలో ప్రభుత్వ కార్యాలయాలు నిర్మిస్తున్నారు.',
        'సింగపూర్ నమూనాలో తీర్చిదిద్దే ఈ రాజధాని అభివృద్ధికి అంతర్జాతీయ నిధులు లభించాయి.',
        'కేంద్రం కూడా ప్రత్యేక ప్యాకేజీ ద్వారా అమరావతి నిర్మాణాన్ని వేగవంతం చేయాలని నిర్ణయించింది.',
        'ముఖ్యమంత్రి శనివారం నిర్మాణ ప్రాంతాన్ని పరిశీలించి పనుల పురోగతిని సమీక్షించారు.',
      ],
    },
  },
  'BLOCK-12A': {
    label: '12-inch · 4 column',
    description:
      'Lead / banner. 08A engine: col1 points, col2 img1+img2, col3 img3, col4 img4–6 stacked, threaded 4-col body (max 6 photos).',
    category: 'political',
    component: ArticleBlock12in4col,
    nativeW: 1153,
    props: {
      title: 'భారత్-పాకిస్తాన్ సమగ్ర శాంతి చర్చలు తిరిగి మొదలయ్యాయి',
      subtitle: 'అంతర్జాతీయ మధ్యవర్తిత్వంతో చారిత్రాత్మక సమావేశం: బంధం పునరుద్ధరణకు అంగీకారం',
      category: 'political',
      dateline: 'ఇస్లామాబాద్ / న్యూ ఢిల్లీ',
      highlights: [
        'రెండు దేశాల విదేశాంగ మంత్రులు భేటీ',
        '25 ఏళ్ళ తర్వాత అత్యున్నత స్థాయి చర్చలు',
        'వాణిజ్య సంబంధాల పునరుద్ధరణ',
        'అంతర్జాతీయ సమాజం హర్షం',
      ],
      images: [
        { url: 'https://placehold.co/340x210/1a1a2e/ffffff?text=శాంతి+చర్చలు', caption: 'ఇస్లామాబాద్‌లో జరిగిన సమావేశం' },
        { url: 'https://placehold.co/340x210/16213e/ffffff?text=Handshake', caption: 'విదేశాంగ మంత్రుల హస్తధూళనం' },
        { url: 'https://placehold.co/340x210/0f3460/ffffff?text=UN+Talks', caption: 'యూఎన్ ప్రతినిధులతో సంప్రదింపులు' },
      ],
      paragraphs: [
        'దీర్ఘకాలం పాటు స్తంభించిన భారత్-పాకిస్తాన్ సంబంధాలు మళ్ళీ కొత్తమలుపు తిరిగాయి.',
        'ఇస్లామాబాద్‌లో గురువారం జరిగిన సమావేశంలో రెండు దేశాల విదేశాంగ మంత్రులు కలిశారు.',
        '25 ఏళ్ళ తర్వాత జరిగిన ఈ అత్యున్నత స్థాయి చర్చలను అంతర్జాతీయ సమాజం ఆహ్వానించింది.',
        'అమెరికా, చైనా, సౌదీ అరేబియా మధ్యవర్తిత్వంతో ఈ సమావేశం జరిగింది.',
        'కాశ్మీర్ వివాదం పక్కన పెట్టి ముందుగా వాణిజ్య సంబంధాలు పునరుద్ధరించాలని ఉభయ పక్షాలు అంగీకరించాయి.',
        'ఈ నిర్ణయంతో ఉభయ దేశాల ప్రజల మధ్య వీసా సడలింపులు అమలవుతాయని అధికారులు తెలిపారు.',
        'ఆర్థిక రంగంలో సహకారం పెంచుకోవాలని కూడా ఇరు వర్గాలు సూచ్యంగా అంగీకరించాయి.',
        'యూఎన్ సెక్రటరీ జనరల్ ఈ పురోగతిని "చారిత్రాత్మకం" అని అభివర్ణించారు.',
        'మరుసటి సమావేశం ఢిల్లీలో జరపాలని నిర్ణయించారు, తేదీ ఖరారు కావాల్సి ఉంది.',
      ],
    },
  },
}

/** Sidebar / workbench — only active blocks (02A, 03A, 09A temporarily off). */
export const BLOCK_ORDER = ACTIVE_BLOCK_CODES

export const BLOCK_COLORS = {
  'BLOCK-TOP8x7': '#dc2626',
  'BLOCK-02A': '#6366f1',
  'BLOCK-03A': '#0ea5e9',
  'BLOCK-04A': '#10b981',
  'BLOCK-06A': '#f59e0b',
  'BLOCK-08A': '#ef4444',
  'BLOCK-09A': '#8b5cf6',
  'BLOCK-12A': '#ec4899',
}

/** Column count label for UI badges */
export function getBlockColLabel(code) {
  if (code === 'BLOCK-TOP8x7') return 'hero · 2 col'
  if (code === 'BLOCK-02A' || code === 'BLOCK-03A') return '1 col'
  if (code === 'BLOCK-12A') return '4 col'
  if (code === 'BLOCK-09A' || code === 'BLOCK-08A') return '3 col'
  return '2 col'
}
