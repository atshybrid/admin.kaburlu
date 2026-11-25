import Link from 'next/link'

export default function NewsDeskPageHeader({
  eyebrow = 'News Desk',
  title,
  description,
  backHref,
  backLabel = 'Back',
  actions,
  hideEyebrow = false,
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 pb-1 border-b border-slate-200/80">
      <div className="min-w-0 flex-1">
        {backHref ? (
          <Link href={backHref} className="text-xs font-medium text-brand hover:underline">
            ← {backLabel}
          </Link>
        ) : null}
        {!hideEyebrow && eyebrow ? (
          <p
            className={`text-[11px] font-semibold uppercase tracking-widest text-slate-500 ${
              backHref ? 'mt-2' : ''
            }`}
          >
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h1 className="text-2xl font-semibold text-slate-900 mt-1 tracking-tight">{title}</h1>
        ) : null}
        {description ? <p className="text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
    </header>
  )
}