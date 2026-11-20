import { StatusBadge } from '../../ui'
import { extractionStatusColor, formatPipelineLabel } from '../../../lib/newsDesk/statusBadges'
import { shouldPollExtraction } from '../../../lib/newsDesk/extractionPolling'

function FactList({ label, items }) {
  if (!Array.isArray(items) || !items.length) return null
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-violet-800/80">{label}</h4>
      <ul className="mt-2 space-y-1.5 text-sm text-slate-700 list-disc pl-5">
        {items.map((item, i) => (
          <li key={`${label}-${i}`}>{String(item)}</li>
        ))}
      </ul>
    </div>
  )
}

function FactBlock({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-violet-800/80">{label}</h4>
      <p className="mt-1.5 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{String(value)}</p>
    </div>
  )
}

export default function NewsDeskFactsPanel({ factsPayload, extractionStatus, failure }) {
  const facts = factsPayload || {}

  return (
    <section className="rounded-2xl border border-violet-200 bg-gradient-to-b from-violet-50/80 to-white p-6 space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">AI extraction</p>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">Machine-extracted facts</h2>
          <p className="text-xs text-violet-900/70 mt-1 max-w-xl">
            For editorial review only — not verified or approved for publication.
          </p>
        </div>
        <StatusBadge
          status={formatPipelineLabel(extractionStatus || 'Unknown')}
          color={extractionStatusColor(extractionStatus)}
        />
      </header>

      {failure?.message && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <p className="font-semibold">Extraction issue</p>
          <p className="mt-1">{failure.message}</p>
          {failure.queueStatus && (
            <p className="text-xs text-rose-700 mt-1">Queue: {failure.queueStatus}</p>
          )}
        </div>
      )}

      {shouldPollExtraction(extractionStatus) && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          Extraction in progress. This page will refresh automatically.
        </p>
      )}

      {!factsPayload && extractionStatus !== 'EXTRACTION_PENDING' && (
        <p className="text-sm text-slate-500">No structured facts available yet.</p>
      )}

      {factsPayload && (
        <div className="grid gap-5 md:grid-cols-2">
          <FactBlock label="Event" value={facts.event} />
          <FactBlock label="Category (extracted)" value={facts.category} />
          <FactList label="Persons" items={facts.persons} />
          <FactList label="Organizations" items={facts.organizations} />
          <FactList label="Locations" items={facts.locations} />
          <FactList label="Key facts" items={facts.keyFacts} />
          <FactList label="Dates and numbers" items={facts.datesAndNumbers} />
          <FactBlock label="Source attribution (extracted)" value={facts.sourceAttribution} />
          <FactList label="Missing information" items={facts.missingInformation} />
          <FactList label="Source excerpts" items={facts.sourceExcerpts} />
          <FactList label="Interpretations" items={facts.interpretations} />
        </div>
      )}
    </section>
  )
}