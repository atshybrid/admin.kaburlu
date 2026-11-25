/**
 * Google Fonts — Telugu news sites (matches kaburlu-Webnews lib/theme.ts weight rules).
 */

export const TELUGU_HEADING_FONTS = [
  { value: 'Ramabhadra', label: 'Ramabhadra', hint: 'పత్రికా శీర్షికలు (default)' },
  { value: 'Mandali', label: 'Mandali', hint: 'సాఫ్ట్ హెడ్లైన్' },
  { value: 'NTR', label: 'NTR', hint: 'బోల్డ్ TV స్టైల్' },
  { value: 'Suranna', label: 'Suranna', hint: 'క్లాసిక్ లుక్' },
  { value: 'Mallanna', label: 'Mallanna', hint: 'డిస్ప్లే' },
  { value: 'Gurajada', label: 'Gurajada', hint: 'సాంప్రదాయం' },
  { value: 'Anek Telugu', label: 'Anek Telugu', hint: 'మాగజైన్' },
  { value: 'Sree Krushnadevaraya', label: 'Sree Krushnadevaraya', hint: 'ఆలంకారికం' },
]

export const TELUGU_BODY_FONTS = [
  { value: 'Noto Sans Telugu', label: 'Noto Sans Telugu', hint: 'బెస్ట్ బॉडీ (default)' },
  { value: 'Noto Serif Telugu', label: 'Noto Serif Telugu', hint: 'సీరియఫ్ ఆర్టికల్' },
  { value: 'Mandali', label: 'Mandali', hint: 'సులభ చదవడం' },
  { value: 'Hind Guntur', label: 'Hind Guntur', hint: 'కాంపాక్ట్ UI' },
  { value: 'Anek Telugu', label: 'Anek Telugu', hint: 'వైవిధ్యం' },
]

/** Quick pairs — one click in admin */
export const TELUGU_FONT_PRESETS = [
  { id: 'patrika', label: 'పత్రికా — Ramabhadra + Noto Sans', headingFont: 'Ramabhadra', bodyFont: 'Noto Sans Telugu' },
  { id: 'readable', label: 'చదవడానికి సులభం — Mandali', headingFont: 'Mandali', bodyFont: 'Noto Sans Telugu' },
  { id: 'breaking', label: 'బ్రేకింగ్ TV — NTR', headingFont: 'NTR', bodyFont: 'Mandali' },
  { id: 'classic-serif', label: 'క్లాసిక్ సీరియఫ్', headingFont: 'Suranna', bodyFont: 'Noto Serif Telugu' },
  { id: 'magazine', label: 'మాగజైన్ — Anek', headingFont: 'Anek Telugu', bodyFont: 'Noto Sans Telugu' },
]

const MULTI_WEIGHT = new Set(['Noto Sans Telugu', 'Noto Serif Telugu', 'Anek Telugu', 'Hind Guntur'])

/** Google Fonts CSS2 URL (heading + body) */
export function googleFontsHref(headingFont, bodyFont) {
  const fams = Array.from(new Set([headingFont, bodyFont].filter(Boolean)))
  const q = fams
    .map((f) => `family=${f.replace(/ /g, '+')}${MULTI_WEIGHT.has(f) ? ':wght@400;700' : ''}`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${q}&family=Noto+Sans+Symbols+2&display=swap`
}

export function isTeluguContentSite(defaultLanguage, supportedLanguages) {
  if (defaultLanguage === 'te') return true
  return Array.isArray(supportedLanguages) && supportedLanguages.includes('te')
}

export function resolveTeluguFontsFromConfig(cfg, { defaultLanguage = 'en', supportedLanguages = ['en'] } = {}) {
  const theme = cfg?.theme || {}
  const typo = theme.typography || {}
  let headingFont = theme.headingFont || typo.headingFont || 'Ramabhadra'
  let bodyFont = theme.bodyFont || typo.bodyFont || typo.fontFamily?.split(',')[0]?.trim() || 'Noto Sans Telugu'
  const latinUi = new Set(['Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat', 'Nunito', 'Raleway'])
  if (isTeluguContentSite(defaultLanguage, supportedLanguages) && latinUi.has(bodyFont)) {
    bodyFont = 'Noto Sans Telugu'
    if (latinUi.has(headingFont) || headingFont === bodyFont) headingFont = 'Ramabhadra'
  }
  return { headingFont, bodyFont }
}

export const TELUGU_PREVIEW_SAMPLE = {
  headline: 'తెలంగాణలో భారీ వర్షాలు — జాగ్రత్తలు',
  body: 'హైదరాబాద్: రాష్ట్రంలో వర్షాలు కురుస్తున్నాయి. అధికారులు జాగ్రత్తలు తీసుకున్నారు.',
}