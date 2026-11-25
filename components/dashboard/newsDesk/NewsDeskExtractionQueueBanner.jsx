import { useState } from 'react'
import newsDeskApi, { formatNewsDeskError } from '../../../lib/api/services/newsDeskApi'
import { buildExtractionQueueSummary, formatQueueStatusLabel } from '../../../lib/newsDesk/formatExtractionQueue'
import { shouldPollExtraction } from '../../../lib/newsDesk/extractionPolling'
import { Button, Spinner, toast } from '../../ui'

export default function NewsDeskExtractionQueueBanner({
  jobId,
  extractionStatus,
  queue,
  onRefresh,
}) {
  const [kicking, setKicking] = useState(false)
  const pending = shouldPollExtraction(extractionStatus)
  if (!pending && extractionStatus !== 'EXTRACTION_FAILED') return null

  const summary = buildExtractionQueueSummary({ queue, extractionStatus })
  const statusLabel = queue?.status ? formatQueueStatusLabel(queue.status) : 'No queue row'

  const onProcessNow = async () => {
    if (!jobId || kicking) return
    setKicking(true)
    try {
      const res = await newsDeskApi.processExtractionNow(jobId)
      if (res?.code === 'ALREADY_SUCCEEDED') {
        toast.success('Facts already extracted')
      } else if (res?.code === 'EXTRACTION_IN_PROGRESS') {
        toast.info('Extraction already running')
      } else {
        toast.success('Extraction run finished — refreshing…')
      }
      onRefresh?.()
    } catch (error) {
      toast.error(formatNewsDeskError(error))
    } finally {
      setKicking(false)
    }
  }

  return (
    <div
      className={
        extractionStatus === 'EXTRACTION_FAILED'
          ? 'rounded-lg border border-rose-200 bg-rose-50/90 px-4 py-3'
          : 'rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-3'
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            Fact extraction queue · {statusLabel}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            {summary ||
              'Snapshot saved — AI facts worker ఈ jobను queueలో process చేస్తుంది. ఈ పేజీ auto-refresh అవుతుంది.'}
          </p>
          {pending ? (
            <p className="text-[11px] text-amber-900/80 mt-2">
              Publish web / live URLs కోసం extraction పూర్తి కావాలి. కింద ప్రివ్యూ snapshot టెక్స్ట్ తో ఉంటుంది.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button type="button" size="sm" variant="outline" disabled={kicking} onClick={onProcessNow}>
            {kicking ? <Spinner size="sm" className="mr-1" /> : null}
            Run extraction now
          </Button>
        </div>
      </div>
    </div>
  )
}