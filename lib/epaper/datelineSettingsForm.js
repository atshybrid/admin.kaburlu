const TE_MONTHS = [
  'జనవరి',
  'ఫిబ్రవరి',
  'మార్చి',
  'ఏప్రిల్',
  'మే',
  'జూన్',
  'జూలై',
  'ఆగస్టు',
  'సెప్టెంబర్',
  'అక్టోబర్',
  'నవంబర్',
  'డిసెంబర్',
]

export const DATELINE_PRESETS = [
  {
    id: 'te_market_v1',
    label: 'Market (default)',
    orderTe: 'మొదట ప్రాంతం → తేదీ → చివర పేపర్ పేరు',
    example: 'కరీంనగర్, 12 నవంబర్ 26 ప్రజా దినపత్రిక',
  },
  {
    id: 'te_legacy_paren',
    label: 'Legacy (parentheses)',
    orderTe: 'మొదట ప్రాంతం → తేదీ → చివర (పేపర్ పేరు brackets లో)',
    example: 'సంగారెడ్డి, నవంబర్ 27 (ప్రశ్న ఆయుధం న్యూస్)',
  },
  {
    id: 'place_date_y4',
    label: 'Place + date only',
    orderTe: 'మొదట ప్రాంతం → తేదీ (4-digit year) — paper name లేదు',
    example: 'గుంటూరు, 5 జూన్ 2026',
  },
  {
    id: 'custom',
    label: 'Custom template',
    orderTe: 'మీరు రాసిన క్రమం',
    example: '{{paper}} | {{place}} | {{day}} {{monthTe}} {{year2}}',
  },
]

export const DATELINE_DATE_SOURCES = [
  {
    id: 'edition_ist',
    label: 'Edition day (IST)',
    hint: 'Business date / newsroom window — default for ePaper & feed',
  },
  {
    id: 'story_from_raw',
    label: 'Story date (when present)',
    hint: 'Reporter text లో date ఉంటే అది వాడుతుంది',
  },
]

export const DATELINE_PARTS = [
  { id: 'place', label: 'Place', labelTe: 'ప్రాంతం', fragment: '{{place}}' },
  { id: 'date', label: 'Date', labelTe: 'తేదీ (day + month + year)', fragment: '{{day}} {{monthTe}} {{year2}}' },
  { id: 'paper', label: 'Paper name', labelTe: 'పేపర్ పేరు (native)', fragment: '{{paper}}' },
]

export const DEFAULT_CUSTOM_PART_ORDER = ['place', 'date', 'paper']

export const DEFAULT_DATELINE_FORM = {
  preset: 'te_market_v1',
  dateSource: 'edition_ist',
  customTemplate: '',
  customPartOrder: [...DEFAULT_CUSTOM_PART_ORDER],
}

/** Build API customTemplate from 1st / 2nd / 3rd chip order. */
export function templateFromPartOrder(order) {
  const valid = new Set(DATELINE_PARTS.map((p) => p.id))
  const seq = (Array.isArray(order) ? order : []).filter((id) => valid.has(id))
  const unique = [...new Set(seq)]
  if (unique.length !== 3) {
    return templateFromPartOrder(DEFAULT_CUSTOM_PART_ORDER)
  }
  const frags = unique.map((id) => DATELINE_PARTS.find((p) => p.id === id)?.fragment || '')
  return frags.filter(Boolean).join(', ')
}

export function parsePartOrderFromTemplate(template) {
  const t = String(template || '').trim()
  if (!t) return [...DEFAULT_CUSTOM_PART_ORDER]
  const ranked = DATELINE_PARTS.map((p) => {
    let idx = -1
    if (p.id === 'date') idx = t.search(/\{\{\s*day\s*\}\}/)
    else if (p.id === 'place') idx = t.indexOf('{{place}}')
    else idx = t.indexOf('{{paper}}')
    return { id: p.id, idx }
  })
    .filter((x) => x.idx >= 0)
    .sort((a, b) => a.idx - b.idx)
    .map((x) => x.id)
  return ranked.length === 3 ? ranked : [...DEFAULT_CUSTOM_PART_ORDER]
}

function parseYmd(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || '').trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  return { y, m: mo, d, monthTe: TE_MONTHS[mo - 1], year2: String(y).slice(-2), year4: String(y) }
}

function collapseSpaces(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .trim()
}

function applyTemplate(template, tokens) {
  let out = String(template || '')
  for (const [key, value] of Object.entries(tokens)) {
    out = out.split(`{{${key}}}`).join(value)
  }
  return collapseSpaces(out.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, ''))
}

export function datelineSettingsFromTenantData(settings) {
  const block = settings?.newsroom?.dateline || settings?.datelineFormat || {}
  const preset = DATELINE_PRESETS.some((p) => p.id === block.preset) ? block.preset : DEFAULT_DATELINE_FORM.preset
  const dateSource = block.dateSource === 'story_from_raw' ? 'story_from_raw' : 'edition_ist'
  const customTemplate = block.customTemplate != null ? String(block.customTemplate) : ''
  const customPartOrder =
    preset === 'custom'
      ? parsePartOrderFromTemplate(customTemplate)
      : [...DEFAULT_CUSTOM_PART_ORDER]
  return {
    preset,
    dateSource,
    customTemplate: preset === 'custom' ? customTemplate || templateFromPartOrder(customPartOrder) : '',
    customPartOrder,
  }
}

export function datelineSettingsToPatch(form, existingSettings = {}) {
  const newsroom = { ...(existingSettings.newsroom || {}) }
  newsroom.dateline = {
    preset: form.preset || DEFAULT_DATELINE_FORM.preset,
    dateSource: form.dateSource === 'story_from_raw' ? 'story_from_raw' : 'edition_ist',
    customTemplate:
      form.preset === 'custom'
        ? String(form.customTemplate || templateFromPartOrder(form.customPartOrder)).trim() || null
        : null,
  }
  return { newsroom }
}

/** Client preview (same rules as API formatter). */
export function formatDatelinePreview({ form, paperNativeName, businessDateYmd, place = 'కరీంనగర్' }) {
  const preset = form?.preset || DEFAULT_DATELINE_FORM.preset
  const paper = String(paperNativeName || 'ఆజాద్ తెలంగాణ').trim()
  const dateParts = parseYmd(businessDateYmd)
  if (!dateParts) return '—'

  const { d: day, monthTe, year2, year4 } = dateParts
  const tokens = { place, paper, day: String(day), monthTe, year2, year4 }

  if (preset === 'custom') {
    const tpl = form.customTemplate || templateFromPartOrder(form.customPartOrder)
    return applyTemplate(tpl, tokens) || '—'
  }
  if (preset === 'te_legacy_paren') {
    const head = place ? `${place}, ` : ''
    const paperPart = paper ? ` (${paper})` : ''
    return collapseSpaces(`${head}${monthTe} ${day}${paperPart}`)
  }
  if (preset === 'place_date_y4') {
    if (!place) return collapseSpaces(`${day} ${monthTe} ${year4}`)
    return collapseSpaces(`${place}, ${day} ${monthTe} ${year4}`)
  }
  const datePart = `${day} ${monthTe} ${year2}`
  const withPlace = place ? `${place}, ${datePart}` : datePart
  if (!paper) return withPlace
  return collapseSpaces(`${withPlace} ${paper}`)
}

export function formatDatelinePreviewNoPlace({ form, paperNativeName, businessDateYmd }) {
  const preset = form?.preset || DEFAULT_DATELINE_FORM.preset
  const paper = String(paperNativeName || 'ఆజాద్ తెలంగాణ').trim()
  const dateParts = parseYmd(businessDateYmd)
  if (!dateParts) return '—'
  const { d: day, monthTe, year2, year4 } = dateParts
  if (preset === 'custom') {
    const tpl = form.customTemplate || templateFromPartOrder(form.customPartOrder)
    const out = applyTemplate(tpl, { place: '', paper, day: String(day), monthTe, year2, year4 })
    return out || collapseSpaces(`${day} ${monthTe} ${year2} ${paper}`.trim())
  }
  if (preset === 'place_date_y4') return collapseSpaces(`${day} ${monthTe} ${year4}`)
  const datePart = `${day} ${monthTe} ${year2}`
  if (!paper) return datePart
  return collapseSpaces(`${datePart} ${paper}`)
}