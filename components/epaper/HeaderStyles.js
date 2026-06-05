/**
 * Shared ePaper Header Style components.
 *
 * Usage:
 *   import { MAIN_STYLES, SUB_STYLES, getMainStyle, getSubStyle } from '@/components/epaper/HeaderStyles'
 *
 *   // Render page-1 masthead:
 *   const MainComp = getMainStyle(headerStyleNumber)  // 1-10
 *   <MainComp s={settings} pt="tabloid" />
 *
 *   // Render page-2+ running header:
 *   const SubComp = getSubStyle(subHeaderStyleNumber) // 1-10
 *   <SubComp s={settings} pt="broadsheet" />
 *
 * `settings` shape (all strings):
 *   paperName, paperNameEn, sectionName, date, volume, issue,
 *   price, publishedAreas, logoUrl, adUrl, accentColor, pageNumber
 *   Style 2 also: runningCommentText, runningCommentAuthor, rightArticleTitle,
 *   rightArticlePoints, websiteUrl, tagline, paperNameImageUrl, adLeftUrl, adRightUrl
 *   subHeaderLogoUrl (sub style 1 center logo; API in production)
 */
import React from 'react'
import MainPageHeaderStyle2 from './MainPageHeaderStyle2'
import { HEADER_STYLE_UI_HINTS } from '../../lib/epaper/headerStyleUiHints'
import { getHeaderStyleCatalogCache } from '../../lib/epaper/headerStyleCatalog'
import { pickHeaderMediaUrl } from '../../lib/epaper/headerMediaUrl'
import { mainHeaderMetrics, mainTitleFont, subHeaderMetrics, subFontSizes } from '../../lib/epaper/headerTypography'

function styleMetaFromCatalog(type, number) {
  const n = Number(number) || 1
  const cache = getHeaderStyleCatalogCache()
  const list = type === 'SUB' ? cache?.subHeaders : cache?.mainHeaders
  const row = list?.find((s) => s.number === n)
  const key = row?.key || (type === 'SUB' ? `sub_header_style${n}` : `main_style${n}`)
  const hints = HEADER_STYLE_UI_HINTS[key] || {}
  return {
    number: n,
    key,
    name: row?.name || `Style ${n}`,
    nameTe: row?.nameTe,
    slug: row?.slug,
    color: hints.color || '#64748b',
  }
}

const FONT_TEL  = 'Mandali, Georgia, serif'
const FONT_SANS = "'Inter', system-ui, sans-serif"
const ac = s => (s && s.accentColor) || '#dc2626'

function FullHeaderImage({ url, bg = '#fff' }) {
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: bg }}>
      <img
        src={url}
        alt=""
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
        }}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HEADER STYLES (10) — 1st page masthead
// pt = 'tabloid' | 'broadsheet'
// Container fills 100% width × 100% height of the slot
// ═══════════════════════════════════════════════════════════════════════════════

/* 1 — Classic 3-Col  (Left ad | Center logo only | Right ad) + Info bar */
export function MainStyle1({ s, pt }) {
  const m = mainHeaderMetrics(pt)
  const leftAd = s.adLeftUrl || ''
  const rightAd = s.adRightUrl || s.adUrl || ''
  /** Style 1 center: headerLogoUrl only — no masthead text */
  const centerLogo = s.headerLogoUrl || s.logoUrl || ''
  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', fontFamily: FONT_TEL }}>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ width: m.sideWidthPct, borderRight: '0.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: m.sidePad }}>
          {leftAd
            ? <img src={leftAd} style={{ display: 'block', width: '100%', height: '100%', maxHeight: m.logoMaxHeightPct, objectFit: pt === 'broadsheet' ? 'cover' : 'contain', objectPosition: 'center center' }} alt="" />
            : <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'grid', placeItems: 'center', fontSize: m.metaFont, color: '#94a3b8', fontFamily: FONT_SANS }}>Left Ad</div>}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', padding: 0, overflow: 'hidden', background: '#fff', minWidth: 0 }}>
          {centerLogo ? (
            <img src={centerLogo} style={{ display: 'block', width: '100%', height: '100%', maxHeight: m.logoMaxHeightPct, objectFit: 'contain', objectPosition: 'center center' }} alt="" />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'grid', placeItems: 'center', fontSize: m.metaFont, color: '#94a3b8', fontFamily: FONT_SANS }}>Logo</div>
          )}
        </div>
        <div style={{ width: m.sideWidthPct, borderLeft: '0.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: m.sidePad }}>
          {rightAd
            ? <img src={rightAd} style={{ display: 'block', width: '100%', height: '100%', maxHeight: m.logoMaxHeightPct, objectFit: pt === 'broadsheet' ? 'cover' : 'contain', objectPosition: 'center center' }} alt="" />
            : <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'grid', placeItems: 'center', fontSize: m.metaFont, color: '#94a3b8', fontFamily: FONT_SANS }}>Right Ad</div>}
        </div>
      </div>
      <div style={{ background: ac(s), color: '#fff', padding: `${m.infoBarPadY}px ${m.infoBarPadX}px`, fontSize: m.infoBarFont, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, fontFamily: FONT_SANS }}>
        <span>{s.publishedAreas}</span>
        <span style={{ fontWeight: 700 }}>{s.date} · {s.volume} · {s.issue} · వెల {s.price}</span>
      </div>
    </div>
  )
}

/* 2 — Telugu Prabha pin layout (left comment | center logo | right article) */
export function MainStyle2(props) {
  return <MainPageHeaderStyle2 {...props} />
}

/* 3 — Minimal White, left-aligned */
export function MainStyle3({ s, pt }) {
  const nfs = mainTitleFont(pt, 72, 54)
  const meta = mainHeaderMetrics(pt)
  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', borderTop: `4px solid ${ac(s)}`, fontFamily: FONT_TEL }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: nfs, fontWeight: 900, color: '#111', lineHeight: 1.0 }}>{s.paperName}</div>
          <div style={{ fontSize: meta.metaFont, color: '#64748b', marginTop: 2, fontFamily: FONT_SANS, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{s.paperNameEn}</div>
        </div>
        <div style={{ textAlign: 'right', fontFamily: FONT_SANS, fontSize: meta.metaFont, color: '#475569', lineHeight: 1.7, flexShrink: 0 }}>
          <div style={{ fontWeight: 700, color: '#111' }}>{s.date}</div>
          <div>{s.volume} · {s.issue}</div>
          <div style={{ color: ac(s), fontWeight: 700 }}>{s.price}</div>
        </div>
      </div>
      <div style={{ height: 1, background: '#e2e8f0', flexShrink: 0 }} />
      <div style={{ background: '#f8fafc', color: '#64748b', padding: `${meta.infoBarPadY}px ${meta.infoBarPadX}px`, fontSize: meta.infoBarFont, fontFamily: FONT_SANS, flexShrink: 0 }}>{s.publishedAreas}</div>
    </div>
  )
}

/* 4 — Red / Crimson Banner */
export function MainStyle4({ s, pt }) {
  const nfs = mainTitleFont(pt, 78, 58)
  const meta = mainHeaderMetrics(pt)
  return (
    <div style={{ width: '100%', height: '100%', background: ac(s), display: 'flex', flexDirection: 'column', fontFamily: FONT_TEL }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: nfs, fontWeight: 900, color: '#fff', lineHeight: 1.0, textAlign: 'center', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>{s.paperName}</div>
      </div>
      <div style={{ background: 'rgba(0,0,0,0.3)', color: '#fecaca', padding: `${meta.infoBarPadY}px ${meta.infoBarPadX}px`, fontSize: meta.infoBarFont, display: 'flex', justifyContent: 'space-between', flexShrink: 0, fontFamily: FONT_SANS }}>
        <span>{s.publishedAreas}</span>
        <span style={{ color: '#fff', fontWeight: 700 }}>{s.date} · {s.price}</span>
      </div>
    </div>
  )
}

/* 5 — Split: Name 65% + Ad 35% */
export function MainStyle5({ s, pt }) {
  const nfs = mainTitleFont(pt, 64, 46)
  const meta = mainHeaderMetrics(pt)
  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', fontFamily: FONT_TEL }}>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: '0 0 64%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4px 16px', borderRight: `3px solid ${ac(s)}` }}>
          <div style={{ fontSize: nfs, fontWeight: 900, color: '#0f172a', lineHeight: 1.0 }}>{s.paperName}</div>
          <div style={{ fontSize: meta.metaFont, color: '#64748b', marginTop: 3, fontFamily: FONT_SANS }}>{s.date} · {s.volume} · {s.issue}</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
          {s.adUrl
            ? <img src={s.adUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="" />
            : <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'grid', placeItems: 'center', fontSize: 11, color: '#94a3b8', fontFamily: FONT_SANS }}>Advertisement</div>}
        </div>
      </div>
      <div style={{ background: ac(s), color: '#fff', padding: `${meta.infoBarPadY}px ${meta.infoBarPadX}px`, fontSize: meta.infoBarFont, display: 'flex', justifyContent: 'space-between', flexShrink: 0, fontFamily: FONT_SANS }}>
        <span>{s.publishedAreas}</span>
        <span style={{ fontWeight: 700 }}>వెల: {s.price}</span>
      </div>
    </div>
  )
}

/* 6 — Traditional Telugu Ornament */
export function MainStyle6({ s, pt }) {
  const nfs = mainTitleFont(pt, 72, 54)
  const meta = mainHeaderMetrics(pt)
  return (
    <div style={{ width: '100%', height: '100%', background: '#fffbf0', display: 'flex', flexDirection: 'column', borderTop: `3px double ${ac(s)}`, borderBottom: `3px double ${ac(s)}`, fontFamily: FONT_TEL }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', height: 1, background: `linear-gradient(to right, transparent 0%, ${ac(s)} 20%, ${ac(s)} 80%, transparent 100%)` }} />
        <div style={{ background: '#fffbf0', padding: '0 24px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: nfs, fontWeight: 900, color: '#7c2d12', lineHeight: 1.0 }}>{s.paperName}</div>
          <div style={{ fontSize: meta.metaFont, color: '#92400e', letterSpacing: '0.15em', marginTop: 2, fontFamily: FONT_SANS }}>{s.publishedAreas}</div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #fcd34d', background: '#fef9c3', padding: `${meta.infoBarPadY}px ${meta.infoBarPadX}px`, fontSize: meta.infoBarFont, display: 'flex', justifyContent: 'space-between', flexShrink: 0, fontFamily: FONT_SANS, color: '#854d0e' }}>
        <span>{s.date} · {s.volume} · {s.issue}</span>
        <span style={{ fontWeight: 700 }}>వెల: {s.price}</span>
      </div>
    </div>
  )
}

/* 7 — Black / Gold Premium */
export function MainStyle7({ s, pt }) {
  const nfs = mainTitleFont(pt, 76, 56)
  const meta = mainHeaderMetrics(pt)
  return (
    <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', flexDirection: 'column', fontFamily: FONT_TEL }}>
      <div style={{ height: 3, background: 'linear-gradient(to right, #b45309, #fbbf24, #b45309)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: nfs, fontWeight: 900, color: '#fbbf24', lineHeight: 1.05, textAlign: 'center', letterSpacing: '0.02em' }}>{s.paperName}</div>
        <div style={{ fontSize: meta.metaFont, color: '#78716c', marginTop: 4, fontFamily: FONT_SANS, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{s.paperNameEn}</div>
      </div>
      <div style={{ height: 1, background: '#44403c', flexShrink: 0 }} />
      <div style={{ background: '#1c1917', color: '#a8a29e', padding: `${meta.infoBarPadY}px ${meta.infoBarPadX}px`, fontSize: meta.infoBarFont, display: 'flex', justifyContent: 'space-between', flexShrink: 0, fontFamily: FONT_SANS }}>
        <span>{s.publishedAreas}</span>
        <span style={{ color: '#fbbf24', fontWeight: 700 }}>{s.date} · {s.price}</span>
      </div>
    </div>
  )
}

/* 8 — Blue Gradient */
export function MainStyle8({ s, pt }) {
  const nfs = mainTitleFont(pt, 74, 55)
  const meta = mainHeaderMetrics(pt)
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 60%, #60a5fa 100%)', display: 'flex', flexDirection: 'column', fontFamily: FONT_TEL }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: nfs, fontWeight: 900, color: '#fff', lineHeight: 1.05, textAlign: 'center', textShadow: '0 2px 16px rgba(0,0,0,0.25)' }}>{s.paperName}</div>
      </div>
      <div style={{ background: 'rgba(0,0,0,0.25)', color: '#bfdbfe', padding: `${meta.infoBarPadY}px ${meta.infoBarPadX}px`, fontSize: meta.infoBarFont, display: 'flex', justifyContent: 'space-between', flexShrink: 0, fontFamily: FONT_SANS }}>
        <span>{s.publishedAreas}</span>
        <span style={{ color: '#fff', fontWeight: 700 }}>{s.date} · {s.volume} · {s.price}</span>
      </div>
    </div>
  )
}

/* 9 — Heavy Rules / Newspaper Gothic */
export function MainStyle9({ s, pt }) {
  const nfs = mainTitleFont(pt, 72, 52)
  const meta = mainHeaderMetrics(pt)
  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', borderTop: '6px solid #111', fontFamily: FONT_TEL }}>
      <div style={{ height: 2, background: ac(s), flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: nfs, fontWeight: 900, color: '#111', lineHeight: 1.0, textAlign: 'center' }}>{s.paperName}</div>
        <div style={{ fontSize: meta.metaFont, color: '#475569', marginTop: 3, fontFamily: FONT_SANS, letterSpacing: '0.12em' }}>{s.date} · {s.volume} · {s.issue}</div>
      </div>
      <div style={{ height: 2, background: '#111', flexShrink: 0 }} />
      <div style={{ background: '#111', color: '#e2e8f0', padding: `${meta.infoBarPadY}px ${meta.infoBarPadX}px`, fontSize: meta.infoBarFont, display: 'flex', justifyContent: 'space-between', flexShrink: 0, fontFamily: FONT_SANS }}>
        <span>{s.publishedAreas}</span>
        <span style={{ fontWeight: 700 }}>వెల: {s.price}</span>
      </div>
    </div>
  )
}

/* 10 — Modern Color Stripe + Logo */
export function MainStyle10({ s, pt }) {
  const nfs = mainTitleFont(pt, 70, 52)
  const meta = mainHeaderMetrics(pt)
  const logoH = Math.max(28, Math.round(56 * meta.ratio))
  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', fontFamily: FONT_TEL }}>
      <div style={{ height: 7, background: `linear-gradient(to right, ${ac(s)}, #7c3aed, #0ea5e9)`, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 16 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          {s.logoUrl && <img src={s.logoUrl} style={{ height: logoH, maxHeight: meta.logoMaxHeightPct, objectFit: 'contain', flexShrink: 0 }} alt="" />}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: nfs, fontWeight: 900, color: '#0f172a', lineHeight: 1.0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.paperName}</div>
            <div style={{ fontSize: meta.metaFont, color: '#64748b', fontFamily: FONT_SANS, marginTop: 2 }}>{s.publishedAreas}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontFamily: FONT_SANS, fontSize: meta.metaFont, color: '#475569', lineHeight: 1.8, flexShrink: 0 }}>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.date}</div>
          <div>{s.volume} · {s.issue}</div>
          <div style={{ fontWeight: 700, color: ac(s) }}>{s.price}</div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB HEADER STYLES (10) — page 2+ running header
// ═══════════════════════════════════════════════════════════════════════════════

/** Sub header fonts scale with automation slot height (0.75in / 0.60in). */
function subFS(pt, big = false) {
  const { big: b, sm } = subFontSizes(pt)
  return big ? b : sm
}

/* 1 — Page (left) | Logo (center) | Date (right) */
export function SubStyle1({ s, pt }) {
  const m = subHeaderMetrics(pt)
  const big = m.bigFont
  const sm = m.smFont
  /** Sub style 1 center = subHeaderLogoUrl only; else paper name text (not main P1 logo). */
  const logoUrl = pickHeaderMediaUrl(s.subHeaderLogoUrl)
  const pageLabel = s.pageNumber ? `పేజీ ${s.pageNumber}` : 'పేజీ 2'
  const dateText = s.date || ''

  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', fontFamily: FONT_SANS }}>
      <div style={{ height: m.rulePx, background: '#111', flexShrink: 0 }} />
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          padding: `0 ${m.padX}px`,
          gap: m.gap,
          minHeight: 0,
        }}
      >
        <div style={{ justifySelf: 'start', fontWeight: 700, fontSize: big, color: '#111', fontFamily: FONT_TEL, whiteSpace: 'nowrap', lineHeight: 1.1 }}>
          {pageLabel}
        </div>

        <div style={{ justifySelf: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: m.logoMaxWidthPct, height: '100%', minWidth: 0 }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: m.logoMaxHeightPct,
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                objectPosition: 'center center',
              }}
            />
          ) : (
            <span style={{ fontWeight: 800, fontSize: big, color: '#0f172a', fontFamily: FONT_TEL, lineHeight: 1.05, textAlign: 'center' }}>
              {s.paperName || 'కాబుర్లు టుడే'}
            </span>
          )}
        </div>

        <div style={{ justifySelf: 'end', fontSize: sm, color: '#475569', fontFamily: FONT_TEL, textAlign: 'right', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
          {dateText}
        </div>
      </div>
      <div style={{ height: m.rulePx, background: '#111', flexShrink: 0 }} />
    </div>
  )
}

/* 2 — Full Color Bar */
export function SubStyle2({ s, pt }) {
  const big = subFS(pt, true); const sm = subFS(pt)
  return (
    <div style={{ width: '100%', height: '100%', background: ac(s), display: 'flex', alignItems: 'center', padding: '0 14px', justifyContent: 'space-between', fontFamily: FONT_SANS }}>
      <div style={{ fontWeight: 800, fontSize: big, color: '#fff', fontFamily: FONT_TEL }}>{s.sectionName}</div>
      <div style={{ fontSize: sm, color: 'rgba(255,255,255,0.85)' }}>{s.paperName} — {s.date}</div>
      <div style={{ fontWeight: 700, fontSize: big, color: '#fff' }}>Page {s.pageNumber}</div>
    </div>
  )
}

/* 3 — Top Rule Accent */
export function SubStyle3({ s, pt }) {
  const big = subFS(pt, true); const sm = subFS(pt)
  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', borderTop: `3px solid ${ac(s)}`, fontFamily: FONT_SANS }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 14px', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 700, fontSize: big, color: '#111', fontFamily: FONT_TEL }}>{s.sectionName}</div>
        <div style={{ fontSize: sm, color: '#64748b' }}>{s.date}</div>
        <div style={{ fontWeight: 700, fontSize: big, color: ac(s) }}>{s.pageNumber}</div>
      </div>
    </div>
  )
}

/* 4 — Dark Strip */
export function SubStyle4({ s, pt }) {
  const big = subFS(pt, true); const sm = subFS(pt)
  return (
    <div style={{ width: '100%', height: '100%', background: '#1e293b', display: 'flex', alignItems: 'center', padding: '0 14px', justifyContent: 'space-between', fontFamily: FONT_SANS }}>
      <div style={{ fontWeight: 700, fontSize: big, color: '#f8fafc', fontFamily: FONT_TEL }}>{s.sectionName}</div>
      <div style={{ fontSize: sm, color: '#94a3b8' }}>{s.paperName} · {s.date}</div>
      <div style={{ fontWeight: 700, fontSize: big, color: '#94a3b8' }}>Pg {s.pageNumber}</div>
    </div>
  )
}

/* 5 — Left Section Flag */
export function SubStyle5({ s, pt }) {
  const big = subFS(pt, true); const sm = subFS(pt)
  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', alignItems: 'stretch', borderBottom: '1px solid #e2e8f0', fontFamily: FONT_SANS }}>
      <div style={{ background: ac(s), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 18px', fontWeight: 800, fontSize: big, fontFamily: FONT_TEL, flexShrink: 0, minWidth: 120 }}>
        {s.sectionName}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: sm, color: '#475569' }}>
        {s.paperName} · {s.date}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', fontWeight: 700, fontSize: big, color: '#111', flexShrink: 0 }}>
        Pg {s.pageNumber}
      </div>
    </div>
  )
}

/* 6 — Center Paper Name */
export function SubStyle6({ s, pt }) {
  const big = subFS(pt, true); const sm = subFS(pt)
  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', borderBottom: '2px solid #111', fontFamily: FONT_TEL }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <div style={{ fontSize: sm, color: '#64748b', fontFamily: FONT_SANS }}>{s.sectionName} · {s.date}</div>
        <div style={{ fontWeight: 900, fontSize: big, color: '#111' }}>{s.paperName}</div>
        <div style={{ fontSize: sm, color: '#64748b', fontFamily: FONT_SANS }}>పేజీ {s.pageNumber}</div>
      </div>
    </div>
  )
}

/* 7 — Bold Underlined Section */
export function SubStyle7({ s, pt }) {
  const big = subFS(pt, true); const sm = subFS(pt)
  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', fontFamily: FONT_SANS }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 14px', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ borderBottom: `3px solid ${ac(s)}`, paddingBottom: 1 }}>
          <span style={{ fontWeight: 800, fontSize: big, color: '#111', fontFamily: FONT_TEL }}>{s.sectionName}</span>
        </div>
        <div style={{ fontSize: sm, color: '#64748b', textAlign: 'center' }}>{s.paperName} · {s.date}</div>
        <div style={{ fontWeight: 700, fontSize: sm + 1, color: '#475569' }}>P.{s.pageNumber}</div>
      </div>
      <div style={{ height: 1, background: '#e2e8f0', flexShrink: 0 }} />
    </div>
  )
}

/* 8 — Fully Bordered Box */
export function SubStyle8({ s, pt }) {
  const big = subFS(pt, true); const sm = subFS(pt)
  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', alignItems: 'stretch', border: '1px solid #111', boxSizing: 'border-box', fontFamily: FONT_SANS }}>
      <div style={{ borderRight: '1px solid #111', display: 'flex', alignItems: 'center', padding: '0 14px', fontWeight: 700, fontSize: big, color: '#111', fontFamily: FONT_TEL, flexShrink: 0 }}>
        {s.sectionName}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: sm, color: '#64748b' }}>
        {s.paperName} — {s.date}
      </div>
      <div style={{ borderLeft: '1px solid #111', display: 'flex', alignItems: 'center', padding: '0 14px', fontWeight: 700, fontSize: big, color: '#111', flexShrink: 0 }}>
        {s.pageNumber}
      </div>
    </div>
  )
}

/* 9 — Two-Tone Split */
export function SubStyle9({ s, pt }) {
  const big = subFS(pt, true); const sm = subFS(pt)
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'stretch', fontFamily: FONT_SANS }}>
      <div style={{ width: '42%', background: ac(s), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: big, color: '#fff', fontFamily: FONT_TEL }}>
        {s.sectionName}
      </div>
      <div style={{ flex: 1, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', fontSize: sm, color: '#475569' }}>
        <span>{s.date}</span>
        <span style={{ fontWeight: 700, color: '#111' }}>పేజీ {s.pageNumber}</span>
      </div>
    </div>
  )
}

/* 10 — Traditional Telugu Double Border */
export function SubStyle10({ s, pt }) {
  const big = subFS(pt, true); const sm = subFS(pt)
  return (
    <div style={{ width: '100%', height: '100%', background: '#fffbf0', display: 'flex', flexDirection: 'column', borderTop: `2px double ${ac(s)}`, borderBottom: `2px double ${ac(s)}`, fontFamily: FONT_TEL }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 14px', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 800, fontSize: big, color: '#7c2d12' }}>{s.sectionName}</div>
        <div style={{ fontSize: sm, color: '#92400e', fontFamily: FONT_SANS, textAlign: 'center' }}>{s.paperName} · {s.date}</div>
        <div style={{ fontWeight: 700, fontSize: sm + 1, color: '#7c2d12', fontFamily: FONT_SANS }}>పే.{s.pageNumber}</div>
      </div>
    </div>
  )
}

// ─── Style registries ──────────────────────────────────────────────────────────

const MAIN_COMPONENTS = {
  1: MainStyle1,
  2: MainPageHeaderStyle2,
  3: MainStyle3,
  4: MainStyle4,
  5: MainStyle5,
  6: MainStyle6,
  7: MainStyle7,
  8: MainStyle8,
  9: MainStyle9,
  10: MainStyle10,
}

const SUB_COMPONENTS = {
  1: SubStyle1,
  2: SubStyle2,
  3: SubStyle3,
  4: SubStyle4,
  5: SubStyle5,
  6: SubStyle6,
  7: SubStyle7,
  8: SubStyle8,
  9: SubStyle9,
  10: SubStyle10,
}

export const MAIN_STYLES = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => {
    const meta = styleMetaFromCatalog('MAIN', i + 1)
    return [
      meta.key,
      {
        label: meta.name,
        nameTe: meta.nameTe,
        slug: meta.slug,
        number: meta.number,
        color: meta.color,
        component: MAIN_COMPONENTS[meta.number] || MainStyle1,
      },
    ]
  })
)

export const SUB_STYLES = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => {
    const meta = styleMetaFromCatalog('SUB', i + 1)
    return [
      meta.key,
      {
        label: meta.name,
        nameTe: meta.nameTe,
        slug: meta.slug,
        number: meta.number,
        color: meta.color,
        component: SUB_COMPONENTS[meta.number] || SubStyle1,
      },
    ]
  })
)

/**
 * Get main header component by style number (1-10).
 * Falls back to MainStyle1 for unknown numbers.
 */
export function getMainStyle(num) {
  const Base = MAIN_STYLES[`main_style${num}`]?.component || MainStyle1
  return wrapMainComponent(Base)
}

/**
 * Get sub header component by style key (sub_header_style1) or number (1-10).
 */
export function getSubStyleByKey(keyOrNum) {
  const raw = String(keyOrNum || '').trim()
  const byKey = SUB_STYLES[raw]?.component
  if (byKey) return wrapSubComponent(byKey)
  const num = Number(raw.replace(/\D/g, '')) || Number(raw) || 1
  return getSubStyle(num)
}

function wrapSubComponent(Base) {
  return function SubWithImageRule(props) {
    const stripUrl = pickHeaderMediaUrl(props?.s?.subHeaderImageUrl)
    if (stripUrl) {
      return <FullHeaderImage url={stripUrl} bg="#fff" />
    }
    return <Base {...props} />
  }
}

/**
 * Get main header component by style key (main_style1) or number (1-10).
 */
export function getMainStyleByKey(keyOrNum) {
  const raw = String(keyOrNum || '').trim()
  const byKey = MAIN_STYLES[raw]?.component
  if (byKey) return wrapMainComponent(byKey)
  const num = Number(raw.replace(/\D/g, '')) || Number(raw) || 1
  return getMainStyle(num)
}

function wrapMainComponent(Base) {
  return function MainWithImageRule(props) {
    if (props?.s?.mainHeaderImageUrl) {
      return <FullHeaderImage url={props.s.mainHeaderImageUrl} bg="#fff" />
    }
    return <Base {...props} />
  }
}

/**
 * Get sub header component by style number (1-10).
 * Falls back to SubStyle1 for unknown numbers.
 */
export function getSubStyle(num) {
  const Base = SUB_STYLES[`sub_header_style${num}`]?.component || SubStyle1
  return wrapSubComponent(Base)
}
