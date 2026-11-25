/**
 * Domain Settings — theme controls (preview = ThemeDualPreview above this block).
 */
import { V2LayoutPicker } from './V2LayoutPicker'
import WebnewsTypographyPicker from './WebnewsTypographyPicker'
import AppearanceStepCard from './AppearanceStepCard'
import { WEBNEWS_V2_LAYOUTS, webnewsLocalPreviewUrl } from '../../lib/newsThemeCatalog'

const MAST_OPTIONS = [
  { value: 'centered', label: 'Logo center (classic)' },
  { value: 'left', label: 'Logo left' },
  { value: 'banner', label: 'Full-width brand bar' },
  { value: 'boxed', label: 'Boxed nameplate' },
  { value: 'ornate', label: 'Ornate center' },
]

const NAV_OPTIONS = [
  { value: 'plain', label: 'Plain underline' },
  { value: 'pills', label: 'Pills (rounded)' },
  { value: 'underline', label: 'Thin underline' },
  { value: 'solid', label: 'Solid dark bar' },
  { value: 'brand', label: 'Brand color bar' },
]

const LOGO_DISPLAY = [
  { value: 'te-name', label: 'Telugu name only' },
  { value: 'image', label: 'Logo image only' },
  { value: 'both', label: 'Image + name' },
]

const LOGO_ALIGN = [
  { value: 'left', label: 'Logo left (all themes)' },
  { value: 'center', label: 'Logo center (all themes)' },
  { value: 'right', label: 'Logo right (all themes)' },
]

function ColorRow({ label, value, onChange, hint }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      <div className="flex gap-2 items-center">
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} className="h-9 w-14 rounded border border-slate-200" />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-xs px-2 py-1.5 border rounded-lg"
          placeholder="#RRGGBB"
        />
      </div>
      {hint && <p className="text-[10px] text-slate-500 mt-0.5">{hint}</p>}
    </div>
  )
}

export default function WhitelabelThemeStudio({
  webnewsLayout,
  onLayoutChange,
  webnewsThemeVersion,
  onEnableV2,
  classicPreset,
  onClassicPresetChange,
  tenantSlug,
  tenantNameTe,
  tagline,
  previewUrl,
  logoUrl,
  logoDisplay,
  onLogoDisplayChange,
  logoHeight,
  onLogoHeightChange,
  mastStyle,
  onMastStyleChange,
  logoAlign,
  onLogoAlignChange,
  headerRightImageUrl,
  onHeaderRightImageUrlChange,
  headerRightImageHref,
  onHeaderRightImageHrefChange,
  festivalLogoUrl,
  onFestivalLogoUrlChange,
  onUploadHeaderRightImage,
  onUploadFestivalLogo,
  uploadingHeaderRight,
  uploadingFestivalLogo,
  navStyle,
  onNavStyleChange,
  primaryColor,
  onPrimaryColorChange,
  secondaryColor,
  onSecondaryColorChange,
  accentColor,
  onAccentColorChange,
  bgColor,
  onBgColorChange,
  surfaceColor,
  onSurfaceColorChange,
  textColor,
  onTextColorChange,
  headingFont,
  bodyFont,
  onHeadingFontChange,
  onBodyFontChange,
  defaultLanguage,
  supportedLanguages,
  showTicker,
  onShowTickerChange,
  festivalThemes,
  onFestivalThemesChange,
  webnewsMode,
  onModeChange,
  menuItems,
  contactEmail,
  onContactEmailChange,
  contactPhone,
  onContactPhoneChange,
  contactWhatsapp,
  onContactWhatsappChange,
  contactAddress,
  onContactAddressChange,
  contactHours,
  onContactHoursChange,
}) {
  const layoutMeta = WEBNEWS_V2_LAYOUTS.find((l) => l.id === webnewsLayout)

  return (
    <div className="space-y-4">
      <details className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
        <summary className="font-semibold cursor-pointer text-slate-900">Quick guide</summary>
        <p className="mt-2">
          Live preview పైన → steps 1–6 → step 7 logo/favicon → <b>Save domain settings</b>. Webnews v2 homepage rails auto; పాత Homepage tab లేదు.
        </p>
      </details>

      <AppearanceStepCard step="1" title="Webnews v2" hint="kaburlu-Webnews consumer site — v2 on చేసి Save.">
        <div className="flex flex-wrap items-center gap-3">
          {webnewsThemeVersion === 'v2' ? (
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 border border-emerald-200">
              v2 active
            </span>
          ) : (
            <>
              <span className="text-xs text-slate-600">v2 off</span>
              {typeof onEnableV2 === 'function' && (
                <button type="button" onClick={onEnableV2} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand text-white">
                  Enable v2
                </button>
              )}
            </>
          )}
        </div>
      </AppearanceStepCard>

      <AppearanceStepCard
        step="2"
        title="Homepage layout"
        hint={`${layoutMeta?.label || webnewsLayout}: ${layoutMeta?.description || ''}`}
      >
          <V2LayoutPicker
            value={webnewsLayout}
            onChange={onLayoutChange}
            disabled={webnewsThemeVersion !== 'v2'}
            previewProps={{
              nameTe: tenantNameTe,
              tagline,
              logoUrl,
              logoDisplay,
              logoHeight,
              mastStyle,
              navStyle,
              primary: primaryColor,
              accent: accentColor,
              bg: bgColor,
              surface: surfaceColor,
              text: textColor,
              headingFont,
              bodyFont,
              showTicker,
              festivalOn: festivalThemes && webnewsMode === 'normal',
              navItems: menuItems,
            }}
          />
        {webnewsLayout === 'classic' && (
          <label className="block text-xs text-slate-600 mt-4 max-w-xs">
            Classic preset
            <select value={classicPreset} onChange={(e) => onClassicPresetChange(e.target.value)} className="mt-1 w-full border rounded-lg px-2 py-2 text-sm bg-white">
              <option value="auto">Auto</option>
              <option value="patrika">Patrika</option>
              <option value="vaarta">Vaarta</option>
              <option value="darpanam">Darpanam</option>
              <option value="prabha">Prabha</option>
              <option value="jyothi">Jyothi</option>
            </select>
          </label>
        )}
      </AppearanceStepCard>

      <AppearanceStepCard step="3" title="Header & chrome" hint="Masthead + menu look. Custom links → Navigation tab.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="grid grid-cols-1 gap-3">
              <label className="text-xs text-slate-600">
                Logo display
                <select value={logoDisplay} onChange={(e) => onLogoDisplayChange(e.target.value)} className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm">
                  {LOGO_DISPLAY.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-600">
                Logo max height: <b>{logoHeight}px</b> (recommended 48–72, wide logos ≤96)
                <input type="range" min={32} max={120} value={logoHeight} onChange={(e) => onLogoHeightChange(Number(e.target.value))} className="w-full mt-1" />
              </label>
              <label className="text-xs text-slate-600">
                Logo position (classic / magazine / bold / minimal)
                <select value={logoAlign || 'center'} onChange={(e) => onLogoAlignChange(e.target.value)} className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm">
                  {LOGO_ALIGN.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-600">
                Masthead layout (Classic ornament style)
                <select value={mastStyle} onChange={(e) => onMastStyleChange(e.target.value)} className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm">
                  {MAST_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500">Ornate/boxed — classic layout lo matrame extra chrome</span>
              </label>
              <div className="border rounded-lg p-3 bg-slate-50 space-y-2">
                <p className="text-[11px] font-semibold text-slate-800">Header right image (optional)</p>
                <p className="text-[10px] text-slate-500">Sponsor badge, award, partner logo — mast right side</p>
                <input
                  type="url"
                  value={headerRightImageUrl || ''}
                  onChange={(e) => onHeaderRightImageUrlChange(e.target.value)}
                  placeholder="https://… image URL"
                  className="w-full text-xs border rounded-lg px-2 py-1.5"
                />
                {onUploadHeaderRightImage && (
                  <label className="inline-flex items-center gap-2 text-xs text-brand cursor-pointer">
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && onUploadHeaderRightImage(e.target.files[0])} />
                    {uploadingHeaderRight ? 'Uploading…' : 'Upload image'}
                  </label>
                )}
                <input
                  type="url"
                  value={headerRightImageHref || ''}
                  onChange={(e) => onHeaderRightImageHrefChange(e.target.value)}
                  placeholder="Optional click link (https://…)"
                  className="w-full text-xs border rounded-lg px-2 py-1.5"
                />
              </div>
              <div className="border rounded-lg p-3 bg-slate-50 space-y-2">
                <p className="text-[11px] font-semibold text-slate-800">Festival logo (optional)</p>
                <p className="text-[10px] text-slate-500">Auto festival ON + live festival roju — normal logo badulu idi</p>
                <input
                  type="url"
                  value={festivalLogoUrl || ''}
                  onChange={(e) => onFestivalLogoUrlChange(e.target.value)}
                  placeholder="https://… festival logo"
                  className="w-full text-xs border rounded-lg px-2 py-1.5"
                />
                {onUploadFestivalLogo && (
                  <label className="inline-flex items-center gap-2 text-xs text-brand cursor-pointer">
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && onUploadFestivalLogo(e.target.files[0])} />
                    {uploadingFestivalLogo ? 'Uploading…' : 'Upload festival logo'}
                  </label>
                )}
              </div>
          </div>
          <div className="space-y-4">
            <label className="block text-xs text-slate-600">
              Navigation style
              <select value={navStyle} onChange={(e) => onNavStyleChange(e.target.value)} className="mt-1 w-full border rounded-lg px-2 py-2 text-sm bg-white">
                {NAV_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-3">
              <p className="text-xs font-semibold text-slate-800">Festival &amp; ticker</p>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={festivalThemes} onChange={(e) => onFestivalThemesChange(e.target.checked)} />
                Auto festival themes
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showTicker} onChange={(e) => onShowTickerChange(e.target.checked)} />
                Breaking ticker on home
              </label>
              <select value={webnewsMode} onChange={(e) => onModeChange(e.target.value)} className="w-full text-sm border rounded-lg px-2 py-2 bg-white">
                <option value="normal">Site mode: Normal</option>
                <option value="mourning">Mourning</option>
              </select>
            </div>
          </div>
        </div>
      </AppearanceStepCard>

      <AppearanceStepCard step="4" title="Brand colors" hint="Hex → Webnews CSS variables">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ColorRow label="Primary (brand)" value={primaryColor} onChange={onPrimaryColorChange} hint="Masthead, links, buttons" />
        <ColorRow label="Accent (highlights)" value={accentColor} onChange={onAccentColorChange} hint="Breaking, festival, hover" />
        <ColorRow label="Secondary" value={secondaryColor} onChange={onSecondaryColorChange} hint="Muted brand / footer" />
        <ColorRow label="Page background" value={bgColor} onChange={onBgColorChange} />
        <ColorRow label="Surface (cards)" value={surfaceColor} onChange={onSurfaceColorChange} />
        <ColorRow label="Body text" value={textColor} onChange={onTextColorChange} />
      </div>
      </AppearanceStepCard>

      <AppearanceStepCard step="5" title="Typography" hint="Google Telugu fonts — headlines & body">
        <WebnewsTypographyPicker
          compact
          headingFont={headingFont}
          bodyFont={bodyFont}
          onHeadingFontChange={onHeadingFontChange}
          onBodyFontChange={onBodyFontChange}
          defaultLanguage={defaultLanguage}
          supportedLanguages={supportedLanguages}
        />
      </AppearanceStepCard>

      <AppearanceStepCard step="6" title="Contact" hint="Footer & /contact page">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input type="email" placeholder="Email" value={contactEmail} onChange={(e) => onContactEmailChange(e.target.value)} className="text-sm border rounded-lg px-3 py-2" />
          <input type="tel" placeholder="Phone" value={contactPhone} onChange={(e) => onContactPhoneChange(e.target.value)} className="text-sm border rounded-lg px-3 py-2" />
          <input type="tel" placeholder="WhatsApp (with country code)" value={contactWhatsapp} onChange={(e) => onContactWhatsappChange(e.target.value)} className="text-sm border rounded-lg px-3 py-2" />
          <input type="text" placeholder="Office hours e.g. 9am–6pm Mon–Sat" value={contactHours} onChange={(e) => onContactHoursChange(e.target.value)} className="text-sm border rounded-lg px-3 py-2" />
          <textarea placeholder="Address (Telugu / English)" value={contactAddress} onChange={(e) => onContactAddressChange(e.target.value)} className="text-sm border rounded-lg px-3 py-2 md:col-span-2 min-h-[72px]" />
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          Local preview:{' '}
          <a href={previewUrl || webnewsLocalPreviewUrl(tenantSlug)} className="text-brand underline" target="_blank" rel="noreferrer">
            {previewUrl || webnewsLocalPreviewUrl(tenantSlug)}
          </a>
        </p>
      </AppearanceStepCard>
    </div>
  )
}