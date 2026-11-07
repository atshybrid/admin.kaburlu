import { NEWS_THEME_CATALOG } from '../../lib/newsThemeCatalog'

export function ThemeStylePicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {NEWS_THEME_CATALOG.map((theme) => {
        const selected = value === theme.id
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.id)}
            className={`text-left rounded-xl border-2 p-4 transition-all ${
              selected
                ? 'border-brand bg-brand/5 shadow-md ring-2 ring-brand/20'
                : 'border-slate-200 hover:border-slate-300 hover:shadow-sm bg-white'
            }`}
          >
            <div
              className="h-16 rounded-lg mb-3 flex items-end p-2 gap-1"
              style={{
                background: `linear-gradient(135deg, ${theme.previewColors.primary} 0%, ${theme.previewColors.secondary} 100%)`,
              }}
            >
              <span className="text-[10px] font-bold text-white/90 uppercase tracking-wide">{theme.publisher}</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">{theme.label}</h4>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{theme.description}</p>
              </div>
              {selected && (
                <span className="shrink-0 text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {theme.features.map((f) => (
                <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {f}
                </span>
              ))}
            </div>
            <div className="flex gap-1.5 mt-3">
              {Object.values(theme.previewColors).map((c) => (
                <span key={c} className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ background: c }} />
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}
