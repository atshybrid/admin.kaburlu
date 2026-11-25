import { useEffect, useId } from 'react'
import {
  TELUGU_BODY_FONTS,
  TELUGU_FONT_PRESETS,
  TELUGU_HEADING_FONTS,
  TELUGU_PREVIEW_SAMPLE,
  googleFontsHref,
  isTeluguContentSite,
} from '../../lib/webnewsTeluguFonts'

function FontSelect({ label, hint, value, onChange, options }) {
  return (
    <label className="block text-xs text-slate-700">
      <span className="font-semibold text-slate-900">{label}</span>
      {hint && <span className="block text-[10px] text-slate-500 font-normal mb-1">{hint}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
            {o.hint ? ` — ${o.hint}` : ''}
          </option>
        ))}
      </select>
    </label>
  )
}

/**
 * Heading + body Google Telugu fonts → Webnews --font-head / --font-body
 */
export default function WebnewsTypographyPicker({
  headingFont,
  bodyFont,
  onHeadingFontChange,
  onBodyFontChange,
  defaultLanguage = 'te',
  supportedLanguages = ['te'],
  compact = false,
}) {
  const linkId = useId().replace(/:/g, '')
  const telugu = isTeluguContentSite(defaultLanguage, supportedLanguages)

  useEffect(() => {
    const href = googleFontsHref(headingFont, bodyFont)
    let el = document.getElementById(linkId)
    if (!el) {
      el = document.createElement('link')
      el.id = linkId
      el.rel = 'stylesheet'
      document.head.appendChild(el)
    }
    el.href = href
    return () => {
      const node = document.getElementById(linkId)
      if (node) node.remove()
    }
  }, [headingFont, bodyFont, linkId])

  const applyPreset = (p) => {
    onHeadingFontChange(p.headingFont)
    onBodyFontChange(p.bodyFont)
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-600">
        {telugu ? (
          <>
            <strong>Telugu tenant</strong> — శీర్షికకు <em>heading</em>, కథనం/UIకు <em>body</em> font. Webnews Google Fonts load చేసి{' '}
            <code className="font-mono text-[10px]">--font-head</code> / <code className="font-mono text-[10px]">--font-body</code> apply చేస్తుంది.
          </>
        ) : (
          <>English-primary tenant — Telugu fonts కూడా పని చేస్తాయి (bilingual).</>
        )}
      </p>

      {!compact && (
        <div className="flex flex-wrap gap-2">
          {TELUGU_FONT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-colors ${
                headingFont === p.headingFont && bodyFont === p.bodyFont
                  ? 'border-brand bg-brand/10 text-brand font-semibold'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FontSelect
          label="Heading font (మాస్తకం, శీర్షికలు)"
          hint="Ramabhadra, Mandali, NTR…"
          value={headingFont}
          onChange={onHeadingFontChange}
          options={TELUGU_HEADING_FONTS}
        />
        <FontSelect
          label="Body font (కథనం, మెను)"
          hint="Noto Sans Telugu recommended"
          value={bodyFont}
          onChange={onBodyFontChange}
          options={TELUGU_BODY_FONTS}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Live preview</p>
        <p
          className="text-lg leading-snug"
          style={{ fontFamily: `'${headingFont}', system-ui, sans-serif`, color: '#1a1a1a' }}
        >
          {TELUGU_PREVIEW_SAMPLE.headline}
        </p>
        <p
          className="text-sm leading-relaxed text-slate-700"
          style={{ fontFamily: `'${bodyFont}', system-ui, sans-serif` }}
        >
          {TELUGU_PREVIEW_SAMPLE.body}
        </p>
        <p className="text-[10px] text-slate-400 font-mono">
          Google: {googleFontsHref(headingFont, bodyFont).replace('https://fonts.googleapis.com/css2?', '')}
        </p>
      </div>
    </div>
  )
}