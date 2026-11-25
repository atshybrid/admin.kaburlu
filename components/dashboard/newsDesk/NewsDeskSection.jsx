export default function NewsDeskSection({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = '',
  unpadded = false,
}) {
  const hasBar = Boolean(title || subtitle || action)

  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className}`.trim()}>
      {hasBar ? (
        <header className="flex items-start justify-between gap-3 px-4 py-2.5 border-b border-slate-100 bg-white">
          <div className="min-w-0">
            {title ? <h2 className="text-sm font-semibold text-slate-900">{title}</h2> : null}
            {subtitle ? <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={`${unpadded ? '' : 'p-4 md:p-5'} ${bodyClassName}`.trim()}>{children}</div>
    </section>
  )
}