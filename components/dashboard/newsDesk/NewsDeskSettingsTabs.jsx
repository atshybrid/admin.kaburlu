export default function NewsDeskSettingsTabs({ tabs, activeId, onChange }) {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-slate-200" aria-label="News Desk settings sections">
      {tabs.map((t) => {
        const active = t.id === activeId
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={[
              'relative px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
            aria-current={active ? 'page' : undefined}
          >
            {t.label}
            {active ? (
              <span className="absolute inset-x-1 -bottom-px h-0.5 bg-brand rounded-full" aria-hidden />
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}