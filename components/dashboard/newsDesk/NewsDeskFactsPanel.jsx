import { StatusBadge } from '../../ui'
import { extractionStatusColor, formatPipelineLabel } from '../../../lib/newsDesk/statusBadges'
import { shouldPollExtraction } from '../../../lib/newsDesk/extractionPolling'
import { TELUGU_READER_CLASS } from '../../../lib/newsDesk/teluguTypography'

function SectionTitle({ children }) {
  return <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{children}</h4>
}

function ChipList({ items }) {
  if (!Array.isArray(items) || !items.length) return <p className="text-sm text-slate-400">—</p>
  return (
    <ul className="flex flex-wrap gap-1.5 mt-2">
      {items.map((item, i) => (
        <li
          key={`chip-${i}`}
          className="inline-flex max-w-full rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-800 leading-snug"
        >
          {String(item)}
        </li>
      ))}
    </ul>
  )
}

function FactText({ value }) {
  if (value == null || value === '') return <p className="text-sm text-slate-400 mt-2">—</p>
  return <p className={`mt-2 ${TELUGU_READER_CLASS} text-sm sm:text-[15px]`}>{String(value)}</p>
}

function LocationItems({ items }) {
  if (!Array.isArray(items) || !items.length) return <p className="text-sm text-slate-400">—</p>
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((item, i) => (
        <li key={`loc-${i}`} className="flex gap-2 text-sm text-slate-800">
          <span className="text-slate-400 shrink-0">›</span>
          <span className={TELUGU_READER_CLASS}>{String(item)}</span>
        </li>
      ))}
    </ul>
  )
}

function ExcerptList({ items }) {
  if (!Array.isArray(items) || !items.length) return <p className="text-sm text-slate-400">—</p>
  return (
    <div className="mt-2 space-y-3">
      {items.map((item, i) => (
        <blockquote
          key={`ex-${i}`}
          className={`border-l-2 border-slate-200 pl-3 ${TELUGU_READER_CLASS} text-sm`}
        >
          {String(item)}
        </blockquote>
      ))}
    </div>
  )
}

export default function NewsDeskFactsPanel({ factsPayload, extractionStatus, failure, queue }) {
  const facts = factsPayload || {}

  return (
    <div className="min-h-0">
      <section className="rounded-lg border border-slate-200/80 bg-white flex flex-col">
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/40">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Extracted facts</h2>
            <p className="text-xs text-slate-500 mt-0.5">AI output — verify before publish</p>
          </div>
          <StatusBadge
            status={formatPipelineLabel(extractionStatus || 'Unknown')}
            color={extractionStatusColor(extractionStatus)}
          />
        </header>

        <div className="px-4 py-4 space-y-5 flex-1">
          {failure?.message ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-900">
              <p className="font-medium text-xs uppercase tracking-wide">Extraction issue</p>
              <p className="mt-1">{failure.message}</p>
            </div>
          ) : null}

          {shouldPollExtraction(extractionStatus) ? (
            <p className="text-sm text-amber-900 bg-amber-50/90 border border-amber-100 rounded-md px-3 py-2">
              Extraction in progress — this page refreshes automatically.
              {queue?.status ? (
                <span className="block mt-1 text-xs text-amber-800/90">
                  Queue {queue.status}
                  {queue.attempts != null ? ` · attempt ${queue.attempts}/${queue.maxAttempts ?? 5}` : null}
                </span>
              ) : null}
            </p>
          ) : null}

          {!factsPayload && extractionStatus !== 'EXTRACTION_PENDING' ? (
            <p className="text-sm text-slate-500">No structured facts available yet.</p>
          ) : null}

          {factsPayload ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <SectionTitle>Event</SectionTitle>
                  <FactText value={facts.event} />
                </div>
                <div>
                  <SectionTitle>Category</SectionTitle>
                  <FactText value={facts.category} />
                </div>
              </div>

              <div>
                <SectionTitle>People</SectionTitle>
                <ChipList items={facts.persons} />
              </div>

              <div>
                <SectionTitle>Organizations</SectionTitle>
                <ChipList items={facts.organizations} />
              </div>

              <div>
                <SectionTitle>Locations</SectionTitle>
                <LocationItems items={facts.locations} />
              </div>

              <div>
                <SectionTitle>Key facts</SectionTitle>
                <div className="mt-2 space-y-2">
                  {Array.isArray(facts.keyFacts) && facts.keyFacts.length ? (
                    facts.keyFacts.map((item, i) => (
                      <div key={`kf-${i}`} className="rounded-md bg-slate-50 px-3 py-2.5 border border-slate-100">
                        <p className={TELUGU_READER_CLASS}>{String(item)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">—</p>
                  )}
                </div>
              </div>

              <div>
                <SectionTitle>Dates & numbers</SectionTitle>
                <ChipList items={facts.datesAndNumbers} />
              </div>

              {facts.sourceAttribution ? (
                <div>
                  <SectionTitle>Source attribution</SectionTitle>
                  <FactText value={facts.sourceAttribution} />
                </div>
              ) : null}

              {Array.isArray(facts.missingInformation) && facts.missingInformation.length ? (
                <div className="rounded-md border border-amber-200 bg-amber-50/80 px-3 py-3">
                  <SectionTitle>Missing information</SectionTitle>
                  <ul className="mt-2 space-y-1 text-sm text-amber-950 list-disc pl-4">
                    {facts.missingInformation.map((item, i) => (
                      <li key={`miss-${i}`}>{String(item)}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <SectionTitle>Source excerpts</SectionTitle>
                <ExcerptList items={facts.sourceExcerpts} />
              </div>

              {Array.isArray(facts.interpretations) && facts.interpretations.length ? (
                <div>
                  <SectionTitle>Interpretations</SectionTitle>
                  <ExcerptList items={facts.interpretations} />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}