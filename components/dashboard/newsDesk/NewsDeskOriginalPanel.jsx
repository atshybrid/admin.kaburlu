import { StatusBadge } from '../../ui'
import { pipelineStatusColor, formatPipelineLabel } from '../../../lib/newsDesk/statusBadges'
import { formatLocationHintDisplay } from '../../../lib/newsDesk/locationHint'
import { TELUGU_HEADLINE_CLASS, TELUGU_READER_CLASS } from '../../../lib/newsDesk/teluguTypography'
import NewsDeskTenantChips from './NewsDeskTenantChips'

function MetaRow({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3 py-2 border-b border-slate-100 last:border-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:w-36 shrink-0">
        {label}
      </dt>
      <dd className="text-sm text-slate-900 min-w-0">{children}</dd>
    </div>
  )
}

function attributionLabel(attr) {
  if (!attr || typeof attr !== 'object') return '—'
  const parts = []
  if (attr.type) parts.push(String(attr.type))
  if (attr.platform) parts.push(String(attr.platform))
  if (attr.customText) parts.push(String(attr.customText))
  return parts.length ? parts.join(' · ') : '—'
}

export default function NewsDeskOriginalPanel({ snapshot, categoryName, pipeline, targetTenants = [] }) {
  if (!snapshot) {
    return (
      <section className="rounded-lg border border-slate-200/80 bg-white p-5">
        <p className="text-sm text-slate-500">Original snapshot could not be loaded.</p>
      </section>
    )
  }

  const urls = snapshot.imageRefs?.urls || []

  return (
    <section className="rounded-lg border border-slate-200/80 bg-white flex flex-col">
      <header className="flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/40">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Original submission</h2>
          <p className="text-xs text-slate-500 mt-0.5">Immutable intake snapshot</p>
        </div>
        {pipeline?.status ? (
          <StatusBadge status={formatPipelineLabel(pipeline.status)} color={pipelineStatusColor(pipeline.status)} />
        ) : null}
      </header>

      <div className="px-4 py-4 space-y-4">
        {snapshot.headline ? <p className={TELUGU_HEADLINE_CLASS}>{snapshot.headline}</p> : null}

        <dl className="rounded-md border border-slate-100 bg-slate-50/50 px-3">
          <MetaRow label="Target publishers">
            <div>
              <NewsDeskTenantChips tenants={targetTenants} showAll compact />
              <p className="text-[11px] text-slate-500 mt-1">
                ఈ కథనం కింది పత్రిక(ల)లో ప్రచురించడానికి రూట్ చేయబడింది
              </p>
            </div>
          </MetaRow>
          <MetaRow label="Category">{categoryName || snapshot.categoryId || '—'}</MetaRow>
          <MetaRow label="Submitted">
            {snapshot.acceptedAt ? new Date(snapshot.acceptedAt).toLocaleString() : '—'}
          </MetaRow>
          <MetaRow label="Attribution">{attributionLabel(snapshot.sourceAttribution)}</MetaRow>
          <MetaRow label="Location">{formatLocationHintDisplay(snapshot.locationHint) || '—'}</MetaRow>
          <MetaRow label="Source URL">
            {snapshot.sourceUrl ? (
              <a
                href={snapshot.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand font-normal hover:underline break-all text-sm"
              >
                {snapshot.sourceUrl}
              </a>
            ) : (
              '—'
            )}
          </MetaRow>
        </dl>

        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Article body</h3>
          <div className={`mt-2 ${TELUGU_READER_CLASS} whitespace-pre-wrap`}>{snapshot.articleText || '—'}</div>
        </div>

        {urls.length > 0 ? (
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Images ({urls.length})
            </h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {urls.map((url, i) => (
                <figure key={`${url}-${i}`} className="rounded-md border border-slate-200 overflow-hidden bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-36 object-cover" />
                  <figcaption className="px-2 py-1 text-[10px] text-slate-500">#{i + 1}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}