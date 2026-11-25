/** Numbered section card for Domain Settings → Appearance */
export default function AppearanceStepCard({ step, title, hint, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className}`}>
      <header className="flex gap-3 items-start px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white"
          aria-hidden
        >
          {step}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {hint ? <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{hint}</p> : null}
        </div>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}