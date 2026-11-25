/** Queue vs Published — primary desk navigation (replaces confusing KPI-only filters). */
export default function NewsDeskQueueTabs({ active, counts = {}, onChange }) {
  const tabs = [
    { id: 'queue', label: 'Queue', hint: 'Intake & not yet live', count: counts.queue },
    { id: 'published', label: 'Published', hint: 'Live on papers', count: counts.published },
    { id: 'all', label: 'All', hint: 'Full list', count: counts.all },
  ]

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div
        className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/80 w-full sm:w-auto"
        role="tablist"
        aria-label="News desk queue"
      >
        {tabs.map((t) => {
          const on = active === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                on
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => onChange?.(t.id)}
            >
              {t.label}
              {t.count != null ? (
                <span
                  className={`ml-1.5 tabular-nums text-xs ${on ? 'text-brand font-semibold' : 'text-slate-400'}`}
                >
                  {t.count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-slate-500 max-w-md">
        <span className="font-medium text-slate-700">Flow:</span> New post →{' '}
        <span className="text-amber-700">Queue</span> (extract) →{' '}
        <span className="text-blue-700">Ready</span> →{' '}
        <span className="text-emerald-700">Published</span>.
      </p>
    </div>
  )
}