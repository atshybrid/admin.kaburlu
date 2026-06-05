/**
 * BLOCK-04A smart title: Telugu clitic groups, per-line sizes, one impact verb.
 */

import { colonHighlightColor, hslFromSeed } from './block04Color'
import {
  BLOCK_04A_TITLE_FIT,
  BLOCK_04A_TITLE_RULES,
  BLOCK_04A_COLON_GOLDEN_RULE,
} from './block04LockedRules'
import {
  computeColonBalancedLineSizes,
  shrinkLineSizesToFit,
  titleLineFitsColumn,
} from './block04TitleFit'

export { BLOCK_04A_TITLE_RULES, BLOCK_04A_COLON_GOLDEN_RULE }

const TELUGU_CLITICS = new Set([
  'ను', 'ని', 'కు', 'లో', 'తో', 'గా', 'నుండి', 'నుంచి', 'వద్ద', 'పై', 'వల్ల',
  'కోసం', 'మీద', 'లోని', 'ద్వారా', 'కంటే', 'తోనూ', 'లేదా', 'మరియు', 'అయితే',
  'కూడా', 'మాత్రమే', 'గురించి', 'వైపు', 'అయినా', 'అయిన', 'అని', 'అన్న', 'అన్నారు',
])

const CLITIC_RE = new RegExp(
  `^(${[...TELUGU_CLITICS].sort((a, b) => b.length - a.length).join('|')})$`
)

/** Telugu headline “action” endings (verbs / participles) — not names. */
const TELUGU_ACTION_PATTERNS = [
  /ించిన$/,
  /ించారు$/,
  /ించింది$/,
  /చున్న$/,
  /చేసిన$/,
  /చేశారు$/,
  /చేసారు$/,
  /చేసింది$/,
  /ప్రకటించిన$/,
  /ప్రకటించారు$/,
  /తీసుకున్న$/,
  /మాట్లాడిన$/,
  /మాట్లాడారు$/,
  /అయ్యారు$/,
  /అయ్యింది$/,
  /అయిన$/,
  /ఉన్నారు$/,
  /ఉన్నట్లు$/,
  /జరిగిన$/,
  /జరిగింది$/,
  /ప్రారంభించిన$/,
  /ముగించిన$/,
  /గర్తీకరించిన$/,
  /సమావేశమయ్యారు$/,
  /చూపించిన$/,
  /అందించిన$/,
  /పొందిన$/,
  /వచ్చిన$/,
  /వెళ్లిన$/,
  /బహుమతిచ్చిన$/,
]

const SECONDARY_LINE_RATIO = 0.78
/** Non-highlight line when colon rule applies (shorter side stays larger). */
const COLON_NORMAL_LINE_RATIO = 0.72
const COLON_MIN_SIZE_GAP_PX = 8
const COLON_CHAR_RE = /[:：]/

/** Gap between deck lines — newspaper tight (0–2px). */
export function colonTitleGapPx(size1, size2) {
  const max = Math.max(size1 || 38, size2 || 38)
  const diff = Math.abs((size1 || 38) - (size2 || 38))
  const gap = diff > 14 ? 2 : diff > 6 ? 1 : 0
  return Math.max(
    BLOCK_04A_TITLE_FIT.lineGapMinPx,
    Math.min(BLOCK_04A_TITLE_FIT.lineGapMaxPx, gap)
  )
}

/** Optional pull when line 2 is a short deck under a long line 1. */
export function colonTitleLineStackPx(size1, size2) {
  return 0
}

/**
 * Pull line 2 up under line 1 when deck is very short (e.g. colon after-side "సీఎం").
 */
export function colonTitleLine2TuckPx(size1, line2Text) {
  const t = String(line2Text || '').trim()
  if (!t) return 0
  const words = t.split(/\s+/).filter(Boolean).length
  if (words > 4 || t.length > 18) return 0
  const base = size1 || 38
  const tuck = base * (words <= 1 ? 0.14 : words <= 2 ? 0.1 : 0.06)
  return Math.round(Math.min(tuck, base * 0.22))
}

/** Tight newspaper leading — avoid tall line boxes between decks. */
export function colonTitleLineHeightPx(fontSizePx) {
  const fs = Math.max(fontSizePx, 26)
  if (fs >= 34) return 1
  return Math.min(1.06, 1.02 + 4 / fs)
}

/** Single-line display text for wide blocks (colon hidden, parts joined). */
export function wideDisplayTitle(text) {
  const colon = analyzeColonTitle(text)
  if (colon?.displayTitleLines?.length) {
    return colon.displayTitleLines.join(' ').replace(/\s+/g, ' ').trim()
  }
  return String(text || '').trim()
}

/** Golden rule: colon in title → break at colon; shorter side (before/after) gets colour; widths balanced. */
export function analyzeColonTitle(title) {
  const raw = String(title || '').trim()
  const match = raw.match(COLON_CHAR_RE)
  if (!match || match.index == null) return null

  const colonIdx = match.index
  const beforeRaw = raw.slice(0, colonIdx).trim()
  const afterRaw = raw.slice(colonIdx + 1).trim()
  const beforeUnits = tokenizeTeluguTitle(beforeRaw)
  const afterUnits = tokenizeTeluguTitle(afterRaw)

  if (!beforeUnits.length && !afterUnits.length) return null

  const beforeCount = beforeUnits.length
  const afterCount = afterUnits.length
  const highlightSide = beforeCount < afterCount ? 'before' : afterCount < beforeCount ? 'after' : 'after'

  const line1Display = beforeRaw || ''
  const line2Display = afterRaw || ''

  return {
    hasColon: true,
    beforeRaw,
    afterRaw,
    beforeCount,
    afterCount,
    highlightSide,
    hideColon: true,
    /** Shown in UI — colon character omitted */
    displayTitleLines: line2Display ? [line1Display, line2Display] : [line1Display],
    /** Legacy alias */
    titleLines: line2Display ? [line1Display, line2Display] : [line1Display],
    unitSplitIndex: beforeUnits.length,
  }
}

export function colonLineSizes(primaryPx, minPx, highlightSide) {
  const highlightPx = Math.round(primaryPx)
  let normalPx = Math.max(minPx, Math.round(primaryPx * COLON_NORMAL_LINE_RATIO))
  if (highlightPx - normalPx < COLON_MIN_SIZE_GAP_PX) {
    normalPx = Math.max(minPx, highlightPx - COLON_MIN_SIZE_GAP_PX)
  }
  if (highlightSide === 'before') {
    return [highlightPx, normalPx]
  }
  return [normalPx, highlightPx]
}

function findEqualTwoLineSize(line1, line2, columnPx, minPx, maxPx, fitMinPx = 26) {
  let size = minPx
  if (columnPx > 0) {
    for (let s = maxPx; s >= fitMinPx; s--) {
      if (titleLineFitsColumn(line1, s, columnPx) && titleLineFitsColumn(line2, s, columnPx)) {
        size = s
        break
      }
    }
    return shrinkLineSizesToFit([line1, line2], [size, size], columnPx, fitMinPx)
  }
  size = Math.max(fitMinPx, Math.min(maxPx, Math.round(maxPx * 0.88)))
  return [size, size]
}

/**
 * Main title only. Colon → 2 lines, colon hidden. Subtitle present → equal line sizes.
 * No subtitle → width-balanced colon lines + fewer-word colour.
 */
export function applyMainTitleRules(layout, text, opts = {}) {
  const minPx = opts.minPx ?? 26
  const fitMinPx = opts.fitMinPx ?? 26
  const maxPx = opts.maxPx ?? 58
  const columnPx = opts.columnPx ?? 0
  const hasSubtitle = !!opts.hasSubtitle
  const preferSingleLine = !!opts.preferSingleLine
  const skipColonResplit = !!opts.skipColonResplit

  if (preferSingleLine && layout.lines === 1 && (layout.titleLines?.length || 0) === 1) {
    return layout
  }

  if (skipColonResplit) {
    if (hasSubtitle && (layout.titleLines?.length || 0) >= 2) {
      const [l1, l2] = layout.titleLines
      const equal = findEqualTwoLineSize(l1, l2, columnPx, minPx, maxPx, fitMinPx)
      return {
        ...layout,
        lineSizes: equal,
        lineGapPx: colonTitleGapPx(equal[0], equal[1]),
        lineStackPx: colonTitleLineStackPx(equal[0], equal[1]),
        fontSizePx: equal[0],
        lines: 2,
      }
    }
    return layout
  }

  const colon = analyzeColonTitle(text)
  if (!colon || colon.displayTitleLines.length < 2) {
    if (hasSubtitle && (layout.titleLines?.length || 0) >= 2) {
      const [l1, l2] = layout.titleLines
      const equal = findEqualTwoLineSize(l1, l2, columnPx, minPx, maxPx, fitMinPx)
      return {
        ...layout,
        lineSizes: equal,
        lineGapPx: colonTitleGapPx(equal[0], equal[1]),
        lineStackPx: colonTitleLineStackPx(equal[0], equal[1]),
        fontSizePx: equal[0],
        lines: 2,
      }
    }
    return layout
  }

  const [l1, l2] = colon.displayTitleLines
  let lineSizes

  if (hasSubtitle) {
    lineSizes = findEqualTwoLineSize(l1, l2, columnPx, minPx, maxPx, fitMinPx)
  } else if (columnPx > 0) {
    lineSizes = computeColonBalancedLineSizes({
      line1: l1,
      line2: l2,
      columnPx,
      minPx,
      maxPx,
      highlightSide: colon.highlightSide,
    })
  } else {
    const primaryGuess = Math.max(
      ...(layout.lineSizes || [layout.fontSizePx]).filter((n) => Number.isFinite(n)),
      layout.fontSizePx || minPx
    )
    lineSizes = colonLineSizes(primaryGuess, minPx, colon.highlightSide)
  }

  lineSizes = shrinkLineSizesToFit([l1, l2], lineSizes, columnPx, fitMinPx)

  const lineGapPx = colonTitleGapPx(lineSizes[0], lineSizes[1])
  const lineStackPx = colonTitleLineStackPx(lineSizes[0], lineSizes[1])
  const highlightIdx = colon.highlightSide === 'before' ? 0 : 1

  return {
    ...layout,
    titleLines: colon.displayTitleLines,
    lineSizes,
    lineGapPx,
    lineStackPx,
    fontSizePx: lineSizes[highlightIdx],
    lines: 2,
    colonAccent: true,
    hideColon: true,
    highlightSide: colon.highlightSide,
    hasSubtitle,
  }
}

/** @deprecated use applyMainTitleRules */
export function applyColonGoldenRule(layout, text, minPx = 26, columnPx = 0, maxPx = 58, opts = {}) {
  return applyMainTitleRules(layout, text, {
    minPx,
    columnPx,
    maxPx,
    hasSubtitle: opts.hasSubtitle,
  })
}

export function buildColonHighlightSegments(lineText, opts) {
  const parts = String(lineText || '').split(/(\s+)/)
  const segments = []
  const accentColor = colonHighlightColor(opts.title, opts.category)

  for (const part of parts) {
    if (!part) continue
    if (/^\s+$/.test(part)) {
      segments.push({ text: part, impact: false })
      continue
    }
    const impact = !!opts.highlight
    segments.push({
      text: part,
      impact,
      color: impact ? accentColor : undefined,
    })
  }

  return segments
}

/** Common Telugu surnames / family names (headline person). */
const SURNAME_RE = /(గౌడ్|రెడ్డి|రావు|శర్మ|కుమార్|నాయుడు|చౌదరి|వర్మ|సింహ్|యాదవ్|నాయక్|పండే|మూర్తి|బాబు|చంద్|లాల్)$/

export function normalizeTitleWord(word) {
  return String(word || '')
    .replace(/[\u200C\u200D\uFEFF]/g, '')
    .trim()
}

export function isTitleWidow(titleLines) {
  if (!titleLines || titleLines.length < 2) return false
  const last = titleLines[titleLines.length - 1].trim()
  const units = last.split(/\s+/).filter(Boolean)
  if (units.length === 1 && last.length < 8) return true
  const words = last.split(/\s+/).filter((w) => !TELUGU_CLITICS.has(w))
  return words.length <= 1 && titleLines.length > 1
}

export function tokenizeTeluguTitle(title) {
  const raw = String(title || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  const units = []
  for (const w of raw) {
    if (units.length > 0 && (TELUGU_CLITICS.has(w) || CLITIC_RE.test(w))) {
      units[units.length - 1] = `${units[units.length - 1]} ${w}`
    } else {
      units.push(w)
    }
  }
  return units
}

export function unitDisplayWords(unit) {
  return String(unit || '')
    .split(/\s+/)
    .filter((w) => w && !TELUGU_CLITICS.has(w) && !CLITIC_RE.test(w))
    .map(normalizeTitleWord)
}

export function isBlock04DefaultInkTitle(titleColor, titleColorEnabled) {
  const raw = String(titleColor || '').trim()
  const enabled =
    titleColorEnabled === true
    || titleColorEnabled === 'true'
    || titleColorEnabled === 1
    || raw === 'true'
    || String(titleColorEnabled).toLowerCase() === 'yes'
  if (enabled) return false
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(raw)) return false
  return true
}

/**
 * Score word as headline “action” (verb/participle), not a person’s name.
 */
/** First unit index that is the news verb (after the person’s name phrase). */
export function findActionUnitIndex(units) {
  const idx = units.findIndex((u) =>
    unitDisplayWords(u).some((w) => scoreActionWord(w) >= 40)
  )
  return idx === -1 ? units.length : idx
}

/** Index of surname unit (e.g. గౌడ్ + ను) within the name phrase. */
export function findSurnameUnitIndex(units, nameEnd) {
  for (let i = nameEnd - 1; i >= 0; i--) {
    const words = unitDisplayWords(units[i])
    if (words.some((w) => SURNAME_RE.test(w))) return i
  }
  return Math.max(1, nameEnd - 1)
}

/**
 * Person-name phrase before the verb: prefix / given / middle / surname(+ను).
 * @returns {{ nameEnd: number, parts: Array<{ unit: string, role: string }> }}
 */
export function analyzeTitleNamePhrase(units) {
  const nameEnd = findActionUnitIndex(units)
  const parts = []

  units.slice(0, nameEnd).forEach((unit, i) => {
    const words = unitDisplayWords(unit)
    const hasSurname = words.some((w) => SURNAME_RE.test(w))
    const hasClitic = unit.split(/\s+/).some((w) => TELUGU_CLITICS.has(w))

    let role = 'given'
    if (i === 0 && words[0]?.length <= 4 && !hasSurname) role = 'prefix'
    else if (hasSurname) role = 'surname'
    else if (i === nameEnd - 1 && nameEnd > 2) role = 'surname'
    else if (i > 0 && i < nameEnd - 1) role = 'middle'
    if (hasClitic && hasSurname) role = 'surname'

    parts.push({ unit, role })
  })

  return { nameEnd, parts }
}

/**
 * Line-break candidates: (1) full name then news, (2) given names then surname+news.
 */
export function getOrderedSplitIndices(units, title = '') {
  const nameEnd = findActionUnitIndex(units)
  const list = []
  const seen = new Set()

  const add = (split, priority) => {
    if (split < 1 || split >= units.length || seen.has(split)) return
    seen.add(split)
    list.push({ split, priority })
  }

  const colon = analyzeColonTitle(title)
  if (colon && colon.unitSplitIndex >= 1 && colon.unitSplitIndex < units.length) {
    add(colon.unitSplitIndex, 120)
  }

  add(nameEnd, 100)

  if (nameEnd >= 2) {
    add(findSurnameUnitIndex(units, nameEnd), 85)
  }

  for (let s = nameEnd - 1; s >= 1; s--) add(s, 15 + s)

  return list.sort((a, b) => b.priority - a.priority)
}

export function scoreActionWord(word) {
  const w = normalizeTitleWord(word)
  if (!w || w.length < 4) return 0
  if (TELUGU_CLITICS.has(w)) return 0

  let score = 0
  for (const re of TELUGU_ACTION_PATTERNS) {
    if (re.test(w)) score += 60
  }

  if (score > 0) {
    score += Math.min(12, Math.floor(w.length / 2))
  } else if (w.length <= 5) {
    score -= 30
  }

  return score
}

/**
 * Exactly one impact word: the top-ranked action verb (e.g. సన్మానించిన).
 * Names (సుధా, శ్రీనివాస్, లక్ష్మి) are not highlighted.
 * @returns {Set<string>}
 */
export function pickImpactWords(units) {
  const ranked = []
  const nameEnd = findActionUnitIndex(units)

  units.slice(nameEnd).forEach((unit, offset) => {
    const unitIdx = nameEnd + offset
    unitDisplayWords(unit).forEach((word) => {
      const score = scoreActionWord(word)
      if (score < 40) return
      ranked.push({ word, score, unitIdx })
    })
  })

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.unitIdx - a.unitIdx
  })

  if (!ranked.length) return new Set()
  return new Set([ranked[0].word])
}

export function impactWordColor(word, title, category = 'general') {
  return hslFromSeed(`${word}|${title}|${category}|impact`, 62, 34)
}

export function buildLineSegments(lineText, impactWords, opts) {
  const parts = String(lineText || '').split(/(\s+)/)
  const segments = []
  const impactNorm = new Set([...impactWords].map(normalizeTitleWord))

  for (const part of parts) {
    if (!part) continue
    if (/^\s+$/.test(part)) {
      segments.push({ text: part, impact: false })
      continue
    }
    const key = normalizeTitleWord(part)
    const impact = opts.accent && impactNorm.has(key)
    segments.push({
      text: part,
      impact,
      color: impact ? impactWordColor(key, opts.title, opts.category) : undefined,
    })
  }

  return segments
}

export function lineFontSizes(primaryPx, minPx) {
  const primary = primaryPx
  const secondary = Math.max(minPx, Math.round(primaryPx * SECONDARY_LINE_RATIO))
  return { primary, secondary }
}
