/**
 * Image subject classification (shared by visual analysis + crop engine).
 */

const SUBJECT_PATTERNS = {
  crime: [
    /crime|murder|dead|body|blood|fire|accident|rape|assault|attack|injur|kill|వేట|హత్య|మృత|రక్త|అగ్ని|దాడి/i,
  ],
  sensitive: [
    /crime|murder|dead|body|blood|shock|వేట|హత్య|మృత|రక్త/i,
  ],
  politician: [
    /minister|cm|mla|mp|chief|leader|modi|kcr|revanth|bjp|congress|trs|మంత్రి|సీఎం|నేత|అధినేత/i,
  ],
  emotional: [
    /portrait|face|person|woman|man|mother|father|family|గుండె|ముఖం|మహిళ|పురుష|కుటుంబ/i,
  ],
  logo: [
    /logo|symbol|emblem|badge|party mark|పార్టీ|చిహ్నం|ప్రతీక/i,
  ],
  symbolic: [
    /logo|symbol|party|bjp|congress|trs|emblem|flag|లోటస్|జండా/i,
  ],
  crowd: [
    /crowd|rally|meeting|march|protest| Sabha|gathering|సభ|ర్యాలీ|జనసమూహ/i,
  ],
  event: [
    /crowd|rally|meeting|conference|సభ|సమావేశ/i,
  ],
  infrastructure: [
    /solar|factory|plant|road|bridge|building|construction|power|grid|సౌర|రోడ్|భవన|ప్లాంట్/i,
  ],
  landscape: [/landscape|panorama|skyline|horizon|విస్తీర్ణ/i],
  infographic: [/chart|map|graph|diagram|infographic|పటం|గ్రాఫ్/i],
}

export function detectImageShape(width, height) {
  const w = Number(width) || 0
  const h = Number(height) || 0
  if (w < 8 || h < 8) return 'unknown'
  const ratio = w / h
  if (ratio < 0.8) return 'portrait'
  if (ratio <= 1.2) return 'square'
  return 'landscape'
}

function haystack(image = {}, article = {}) {
  return [image.alt, image.caption, image.tags, image.subject, article.title, article.category]
    .filter(Boolean)
    .join(' ')
}

export function matchImageSubject(image = {}, article = {}) {
  const text = haystack(image, article)
  for (const [subject, patterns] of Object.entries(SUBJECT_PATTERNS)) {
    if (patterns.some((re) => re.test(text))) return subject
  }
  const shape = detectImageShape(image.width, image.height)
  if (shape === 'landscape') return 'infrastructure'
  if (shape === 'portrait') return 'emotional'
  if (shape === 'square') return 'symbolic'
  return 'general'
}
