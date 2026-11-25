function Step({ label, ok, active, hint }) {
  return (
    <div className="flex items-start gap-2 min-w-0 flex-1">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          ok ? 'bg-emerald-100 text-emerald-800' : active ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-500'
        }`}
        aria-hidden
      >
        {ok ? '✓' : '·'}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-800 truncate">{label}</p>
        {hint ? <p className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">{hint}</p> : null}
      </div>
    </div>
  )
}

export default function NewsDeskWorkflowSteps({ steps }) {
  return (
    <ol className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-2 lg:gap-4 list-none p-0 m-0">
      {steps.map((s, i) => (
        <li key={s.key} className="flex items-stretch gap-2 min-w-0 flex-1">
          <Step label={s.label} ok={s.ok} active={s.active} hint={s.hint} />
          {i < steps.length - 1 ? (
            <span className="hidden sm:block w-px self-stretch bg-slate-200 shrink-0 mx-0.5" aria-hidden />
          ) : null}
        </li>
      ))}
    </ol>
  )
}