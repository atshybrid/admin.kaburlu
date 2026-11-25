import { WEBNEWS_V2_LAYOUTS } from '../../lib/newsThemeCatalog'
import { ThemeChromePreview } from './ThemeDualPreview'

export function V2LayoutPicker({ value, onChange, disabled, previewProps = {} }) {
  const base = {
    nameTe: previewProps.nameTe || 'అక్షర జ్యోతి',
    tagline: previewProps.tagline || '',
    logoUrl: previewProps.logoUrl,
    logoDisplay: previewProps.logoDisplay || 'te-name',
    logoHeight: previewProps.logoHeight || 48,
    mastStyle: previewProps.mastStyle || 'centered',
    navStyle: previewProps.navStyle || 'plain',
    primary: previewProps.primary || '#B3121B',
    accent: previewProps.accent || '#F2B705',
    bg: previewProps.bg || '#FAF7F2',
    surface: previewProps.surface || '#FFFFFF',
    text: previewProps.text || '#1A1A1A',
    headingFont: previewProps.headingFont || 'Ramabhadra',
    bodyFont: previewProps.bodyFont || 'Noto Sans Telugu',
    showTicker: previewProps.showTicker !== false,
    festivalOn: previewProps.festivalOn,
    navItems: previewProps.navItems,
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {WEBNEWS_V2_LAYOUTS.map((layout) => {
        const selected = value === layout.id
        return (
          <button
            key={layout.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(layout.id)}
            className={`text-left rounded-xl border-2 p-2 transition-all disabled:opacity-50 overflow-hidden ${
              selected
                ? 'border-indigo-500 bg-indigo-50 shadow-sm ring-2 ring-indigo-200'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="h-[130px] mb-2 rounded-lg overflow-hidden border border-slate-200/80">
              <ThemeChromePreview
                {...base}
                layout={layout.id}
                primary={previewProps.primary || layout.previewColors.primary}
                accent={previewProps.accent || layout.previewColors.accent}
                compact
              />
            </div>
            <p className="text-sm font-semibold text-slate-900 px-1">{layout.label}</p>
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 px-1">{layout.description}</p>
          </button>
        )
      })}
    </div>
  )
}