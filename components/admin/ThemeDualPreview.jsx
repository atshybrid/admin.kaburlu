'use client'

/**
 * Instant admin preview — exact Webnews iframe (v2) + fallback mock.
 */
import { useMemo } from 'react'
import ThemeExactIframe from './ThemeExactIframe'

function HomeBodyMock({ layout, primary, accent, surface, text }) {
  if (layout === 'bold') {
    return (
      <div className="px-2 pb-3 space-y-2">
        <div className="rounded-lg p-3 text-white text-[11px] font-bold leading-snug" style={{ background: primary }}>
          బ్రేకింగ్ లీడ్ శీర్షిక — Bold layout
        </div>
        <div className="h-16 rounded" style={{ background: text + '18' }} />
        <div className="grid grid-cols-2 gap-1">
          <div className="h-10 rounded" style={{ background: surface, border: `1px solid ${text}15` }} />
          <div className="h-10 rounded" style={{ background: surface, border: `1px solid ${text}15` }} />
        </div>
      </div>
    )
  }
  if (layout === 'magazine') {
    return (
      <div className="px-2 pb-3 space-y-2">
        <div className="h-20 rounded-2xl" style={{ background: `linear-gradient(135deg, ${primary}44, ${accent}33)` }} />
        <div className="flex gap-1 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shrink-0 w-24 h-14 rounded-xl" style={{ background: surface, border: `1px solid ${text}12` }} />
          ))}
        </div>
      </div>
    )
  }
  if (layout === 'minimal') {
    return (
      <div className="px-3 pb-3 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border-b py-1.5" style={{ borderColor: text + '15' }}>
            <div className="h-2 rounded w-full mb-1" style={{ background: text + '22' }} />
            <div className="h-1.5 rounded w-2/3" style={{ background: text + '10' }} />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="px-2 pb-3 grid grid-cols-3 gap-1">
      <div className="col-span-1 space-y-1">
        <div className="h-8 rounded" style={{ background: accent + '33' }} />
        <div className="h-6 rounded" style={{ background: surface }} />
      </div>
      <div className="col-span-2 h-20 rounded" style={{ background: primary + '22', border: `1px solid ${primary}44` }} />
      <div className="col-span-3 grid grid-cols-4 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 rounded-sm" style={{ background: text + '0d' }} />
        ))}
      </div>
    </div>
  )
}

export function ThemeChromePreview({
  compact = false,
  nameTe,
  tagline,
  logoUrl,
  logoDisplay,
  logoHeight,
  mastStyle,
  navStyle,
  layout,
  primary,
  accent,
  bg,
  surface,
  text,
  headingFont = 'Ramabhadra',
  bodyFont = 'Noto Sans Telugu',
  showTicker,
  festivalOn,
  navItems,
}) {
  const showImg = logoDisplay !== 'te-name' && logoUrl
  const showTe = logoDisplay !== 'image'
  const items = (navItems?.length ? navItems.slice(0, compact ? 4 : 6) : [{ label: 'హోమ్' }, { label: 'తెలంగాణ' }, { label: 'రాజకీయం' }]).map(
    (it) => it.label || 'లింక్',
  )
  const mastJustify = mastStyle === 'left' ? 'flex-start' : mastStyle === 'banner' ? 'space-between' : 'center'
  const fs = compact ? 11 : 13
  const logoH = compact ? Math.max(28, logoHeight * 0.65) : logoHeight

  return (
    <div
      className="rounded-lg border overflow-hidden h-full flex flex-col"
      style={{
        background: bg,
        color: text,
        fontFamily: `'${bodyFont}', system-ui, sans-serif`,
        fontSize: fs,
        borderColor: text + '20',
        '--font-head': `'${headingFont}', system-ui, sans-serif`,
        '--font-body': `'${bodyFont}', system-ui, sans-serif`,
      }}
    >
      {festivalOn && (
        <div className="h-1 shrink-0" style={{ background: `linear-gradient(90deg, ${primary}, ${accent})` }} />
      )}
      {showTicker && (
        <div className="flex gap-1 px-2 py-0.5 text-[9px] border-b shrink-0" style={{ borderColor: text + '18', background: accent + '15' }}>
          <b style={{ color: primary }}>బ్రేకింగ్</b>
          <span className="truncate opacity-80">తాజా శీర్షిక…</span>
        </div>
      )}
      <div className="px-2 py-1 flex justify-between text-[8px] opacity-60 shrink-0">
        <span>తేదీ</span>
        <span>పంచాంగం</span>
      </div>
      <div
        className="px-2 py-2 flex items-center shrink-0"
        style={{
          justifyContent: mastJustify,
          gap: 8,
          background: mastStyle === 'banner' ? primary : 'transparent',
          color: mastStyle === 'banner' ? '#fff' : text,
        }}
      >
        <div className="flex flex-col items-center gap-0.5" style={{ alignItems: mastStyle === 'left' ? 'flex-start' : 'center' }}>
          <div className="flex items-center gap-1 flex-wrap justify-center">
            {showImg && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" style={{ maxHeight: logoH, maxWidth: compact ? 100 : 180 }} />
            )}
            {showTe && (
              <span
                className="font-bold leading-tight"
                style={{
                  color: mastStyle === 'banner' ? '#fff' : primary,
                  fontSize: compact ? 14 : Math.min(20, 10 + logoHeight / 5),
                  fontFamily: `'${headingFont}', system-ui, sans-serif`,
                }}
              >
                {nameTe || 'అక్షర జ్యోతి'}
              </span>
            )}
          </div>
          {tagline && !compact && <span className="text-[9px] opacity-70 text-center max-w-[200px]">{tagline}</span>}
        </div>
      </div>
      <div
        className="flex gap-0.5 overflow-x-auto px-1 py-1 shrink-0"
        style={{
          background: navStyle === 'brand' ? primary : navStyle === 'solid' ? text : 'transparent',
          color: navStyle === 'brand' || navStyle === 'solid' ? '#fff' : text,
        }}
      >
        {items.map((lab, i) => (
          <span
            key={i}
            className="whitespace-nowrap px-1.5 py-0.5 text-[9px]"
            style={{
              borderRadius: navStyle === 'pills' ? 99 : 0,
              borderBottom: navStyle === 'plain' && i === 0 ? `2px solid ${accent}` : 'none',
            }}
          >
            {lab}
          </span>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <HomeBodyMock layout={layout} primary={primary} accent={accent} surface={surface} text={text} />
      </div>
    </div>
  )
}

export default function ThemeDualPreview(props) {
  const { liveUrl, layoutLabel, v2Enabled, tenantSlug, nameTe, logoHeight } = props

  const previewPayload = useMemo(
    () => ({
      layout: props.layout,
      mast: props.mastStyle,
      nav: props.navStyle,
      colors: {
        primary: props.primary,
        accent: props.accent,
        bg: props.bg,
        surface: props.surface,
        text: props.text,
        muted: props.text,
        border: props.border,
      },
      logoUrl: props.logoUrl,
      festivalLogoUrl: props.festivalLogoUrl,
      logoDisplay: props.logoDisplay,
      logoHeightPx: logoHeight,
      logoAlign: props.logoAlign,
      rightImageUrl: props.headerRightImageUrl,
      showTicker: props.showTicker,
      festivalOn: props.festivalOn,
      mode: props.webnewsMode || 'normal',
      nameTe,
      headingFont: props.headingFont,
      bodyFont: props.bodyFont,
      showTopBar: props.showTopBar,
      showTicker: props.showTicker,
      footerStyle: props.footerStyle,
      radius: props.radius,
    }),
    [props, logoHeight, nameTe],
  )

  return (
    <div className="rounded-xl border-2 border-brand/30 bg-gradient-to-b from-slate-50 to-white p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-900">Live preview</p>
          <p className="text-[11px] text-slate-600">
            Real Webnews CSS (classic / magazine / bold / minimal). Changes here are instant; production needs{' '}
            <strong>Save domain settings</strong>.{' '}
            <a href={liveUrl} target="_blank" rel="noreferrer" className="text-brand underline">
              Open :3002
            </a>
          </p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-white border">
          {layoutLabel || 'classic'} {v2Enabled ? '· v2' : '· legacy mock'}
        </span>
      </div>

      {v2Enabled ? (
        <ThemeExactIframe
          tenantSlug={tenantSlug}
          previewPayload={previewPayload}
          fallbackProps={{ ...props, compact: false }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_140px] gap-4 items-stretch">
          <div className="h-[260px]">
            <ThemeChromePreview {...props} compact={false} />
          </div>
          <div className="mx-auto w-[132px] h-[234px] rounded-[20px] border-[3px] border-slate-800 p-[3px]">
            <ThemeChromePreview {...props} compact />
          </div>
        </div>
      )}
    </div>
  )
}