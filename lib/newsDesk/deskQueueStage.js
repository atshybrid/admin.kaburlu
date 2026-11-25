/**
 * One clear desk stage per row — for queue UI (not raw pipeline enums).
 */

export function deriveDeskQueueStage(row) {
  const extraction = String(row?.extractionStatus || '').toUpperCase()
  const jobStatus = String(row?.syndicationStatus || 'DRAFT').toUpperCase()
  const tenants = Array.isArray(row?.targetTenants) ? row.targetTenants : []
  const liveCount = tenants.filter((t) => t.published).length
  const totalTargets = tenants.length
  const allLive = totalTargets > 0 && liveCount === totalTargets
  const anyLive = liveCount > 0

  if (extraction === 'EXTRACTION_FAILED') {
    return {
      id: 'failed',
      tab: 'queue',
      label: 'Failed — open & retry',
      labelTe: 'విఫలమైంది',
      color: 'red',
      step: 1,
      totalSteps: 3,
    }
  }

  if (extraction === 'EXTRACTION_PENDING' || extraction === '') {
    return {
      id: 'extracting',
      tab: 'queue',
      label: 'In queue — extracting',
      labelTe: 'క్యూ · విశ్లేషణ',
      color: 'amber',
      step: 1,
      totalSteps: 3,
    }
  }

  if (jobStatus === 'PUBLISHED' || anyLive || allLive) {
    return {
      id: 'published',
      tab: 'published',
      label: totalTargets ? `Published · ${liveCount}/${totalTargets} live` : 'Published',
      labelTe: 'ప్రచురించబడింది',
      color: 'green',
      step: 3,
      totalSteps: 3,
    }
  }

  // Extraction OK — waiting for publish / review
  return {
    id: 'ready',
    tab: 'queue',
    label: anyLive ? `Publishing · ${liveCount}/${totalTargets} live` : 'Ready to publish',
    labelTe: 'ప్రచురణకు సిద్ధం',
    color: 'blue',
    step: 2,
    totalSteps: 3,
  }
}

export function filterRowsByDeskTab(rows, tab) {
  if (!tab || tab === 'all') return rows
  return rows.filter((row) => deriveDeskQueueStage(row).tab === tab)
}

export function countRowsByDeskTab(rows) {
  let queue = 0
  let published = 0
  for (const row of rows) {
    const t = deriveDeskQueueStage(row).tab
    if (t === 'published') published += 1
    else queue += 1
  }
  return { queue, published, all: rows.length }
}