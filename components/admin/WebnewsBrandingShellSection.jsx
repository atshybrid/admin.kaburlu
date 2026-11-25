import WebnewsThemeBindingsPanel from './WebnewsThemeBindingsPanel'
import AppearanceStepCard from './AppearanceStepCard'
import { WEBNEWS_FOOTER_STYLES, WEBNEWS_RADIUS_OPTIONS } from '../../lib/webnewsThemeBindings'

/**
 * Bottom of Appearance — assets + chrome wired to Webnews v2.
 */
export default function WebnewsBrandingShellSection({
  logoSlot,
  faviconSlot,
  footerStyle,
  onFooterStyleChange,
  showTopBar,
  onShowTopBarChange,
  borderColor,
  onBorderColorChange,
  radius,
  onRadiusChange,
  showCustomCss,
  customCss,
  onCustomCssChange,
}) {
  return (
  <AppearanceStepCard step="7" title="Logo, favicon & footer" hint="Upload assets + footer/top bar chrome. Ticker is step 3.">
    <div className="space-y-5">
      <WebnewsThemeBindingsPanel compact />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{logoSlot}{faviconSlot}</div>

      <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4 space-y-4">
        <p className="text-xs font-semibold text-slate-800">Footer &amp; top bar</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-xs text-slate-700">
            <span className="font-semibold block mb-1">Footer style</span>
            <select
              value={footerStyle}
              onChange={(e) => onFooterStyleChange(e.target.value)}
              className="w-full border rounded-lg px-2 py-2 text-sm bg-white"
            >
              {WEBNEWS_FOOTER_STYLES.map((o) => (
                <option key={o.value} value={o.value}>{o.label} — {o.hint}</option>
              ))}
            </select>
          </label>

          <label className="text-xs text-slate-700">
            <span className="font-semibold block mb-1">Card corner radius</span>
            <select
              value={radius}
              onChange={(e) => onRadiusChange(e.target.value)}
              className="w-full border rounded-lg px-2 py-2 text-sm bg-white"
            >
              {WEBNEWS_RADIUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-xs text-slate-700">
          <span className="font-semibold">Border color</span>
          <span className="flex gap-2 items-center mt-1">
            <input type="color" value={borderColor || '#E3DCD0'} onChange={(e) => onBorderColorChange(e.target.value)} className="h-9 w-14 rounded border" />
            <input
              type="text"
              value={borderColor || ''}
              onChange={(e) => onBorderColorChange(e.target.value)}
              className="flex-1 font-mono text-xs px-2 py-1.5 border rounded-lg"
              placeholder="#E3DCD0"
            />
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showTopBar} onChange={(e) => onShowTopBarChange(e.target.checked)} />
          Top utility bar (date, పంచాంగం, shortcuts)
        </label>
      </div>

      {showCustomCss && (
        <div className="rounded-lg border border-slate-100 p-3 space-y-2">
          <p className="text-xs font-semibold text-slate-800">Custom CSS (advanced)</p>
          <textarea
            value={customCss || ''}
            onChange={(e) => onCustomCssChange(e.target.value)}
            rows={4}
            className="w-full font-mono text-xs border rounded-lg p-2 bg-white"
            placeholder=":root { } .site-header { }"
          />
        </div>
      )}
    </div>
  </AppearanceStepCard>
  )
}