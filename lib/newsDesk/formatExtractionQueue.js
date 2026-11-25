/** Human labels for NewsDeskJobQueue status on review UI. */

const QUEUE_LABELS = {
  PENDING: 'Waiting in queue',
  LOCKED: 'Worker running',
  SUCCEEDED: 'Done',
  FAILED: 'Failed',
  DEAD: 'Dead — retry extraction',
}

export function formatQueueStatusLabel(status) {
  const s = String(status || '').toUpperCase()
  return QUEUE_LABELS[s] || s.replace(/_/g, ' ').toLowerCase()
}

export function buildExtractionQueueSummary({ queue, extractionStatus, workerEnabled = true }) {
  if (!queue && extractionStatus !== 'EXTRACTION_PENDING') return null
  const lines = []
  if (queue?.status) {
    lines.push(`Queue · ${formatQueueStatusLabel(queue.status)}`)
  }
  if (queue?.attempts != null) {
    lines.push(`Attempt ${queue.attempts}/${queue.maxAttempts ?? 5}`)
  }
  if (queue?.lockedAt && queue.status === 'LOCKED') {
    lines.push(`Locked ${new Date(queue.lockedAt).toLocaleTimeString()}`)
  } else if (queue?.runAfter && queue.status === 'PENDING') {
    const runAfter = new Date(queue.runAfter)
    if (runAfter > new Date()) {
      lines.push(`Next run ~${runAfter.toLocaleTimeString()}`)
    }
  }
  if (queue?.lastError) {
    lines.push(queue.lastError.slice(0, 160))
  }
  if (extractionStatus === 'EXTRACTION_PENDING' && workerEnabled === false) {
    lines.push('Extraction worker off — use “Run extraction now”')
  }
  return lines.length ? lines.join(' · ') : null
}