import { StatusBadge } from '../../ui'
import { pipelineStatusColor, formatPipelineLabel } from '../../../lib/newsDesk/statusBadges'

function formatJsonHint(value) {
  if (value == null) return null
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function attributionLabel(attr) {
  if (!attr || typeof attr !== 'object') return '—'
  const parts = []
  if (attr.type) parts.push(String(attr.type))
  if (attr.platform) parts.push(String(attr.platform))
  if (attr.customText) parts.push(String(attr.customText))
  return parts.length ? parts.join(' · ') : '—'
}

export default function NewsDeskOriginalPanel({ snapshot, categoryName, pipeline }) {
  if (!snapshot) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Original snapshot could not be loaded.</p>
      </section>
    )
  }

  const urls = snapshot.imageRefs?.urls || []

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Original submission</p>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            {snapshot.headline || 'Untitled intake'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable snapshot · accepted {snapshot.acceptedAt ? new Date(snapshot.acceptedAt).toLocaleString() : '—'}
          </p>
        </div>
        {pipeline?.status && (
          <StatusBadge status={formatPipelineLabel(pipeline.status)} color={pipelineStatusColor(pipeline.status)} />
        )}
      </header>

      <dl className="grid gap-3 sm:grid-cols-2 text-sm">
        <div>
          <dt className="text-slate-500">Category</dt>
          <dd className="font-medium text-slate-900 mt-0.5">{categoryName || snapshot.categoryId || '—'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Source URL</dt>
          <dd className="mt-0.5 break-all">
            {snapshot.sourceUrl ? (
              <a href={snapshot.sourceUrl} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                {snapshot.sourceUrl}
              </a>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Source attribution</dt>
          <dd className="font-medium text-slate-900 mt-0.5">{attributionLabel(snapshot.sourceAttribution)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Location hint</dt>
          <dd className="font-medium text-slate-900 mt-0.5 whitespace-pre-wrap">{formatJsonHint(snapshot.locationHint) || '—'}</dd>
        </div>
      </dl>

      <article>
        <h3 className="text-sm font-semibold text-slate-800">Article body</h3>
        <div className="mt-2 rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
          {snapshot.articleText}
        </div>
      </article>

      {urls.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Images ({urls.length})</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {urls.map((url, i) => (
              <figure key={`${url}-${i}`} className="rounded-xl border border-slate-200 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-40 object-cover bg-slate-100" />
                <figcaption className="px-2 py-1 text-xs text-slate-500">Order {i + 1}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}