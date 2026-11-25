/**
 * kaburlu-Webnews v2 — consumer theme entry point (legacy style1–5 not managed here).
 */
import Link from 'next/link'
import { THEME_ADMIN_SOURCES, webnewsLocalPreviewUrl } from '../../lib/newsThemeCatalog'

export function NewsWebsiteThemeOverview({ tenantId, tenantSlug, themeVersion = 'v2' }) {
  const v2 = themeVersion === 'v2'
  const preview = webnewsLocalPreviewUrl(tenantSlug)

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">News website theme (v2)</h3>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Consumer site = <strong>kaburlu-Webnews</strong> (Classic · Magazine · Bold · Minimal).
            Domain Settings → Appearance లో layout, colors, header, contact — Save తో live site.
          </p>
        </div>
        {tenantSlug && (
          <a
            href={preview}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-xs font-semibold text-brand underline"
          >
            Open Webnews preview
          </a>
        )}
      </div>

      <div className={`rounded-lg border p-3 ${v2 ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
        <p className="text-xs font-bold text-indigo-950 uppercase tracking-wide">kaburlu-Webnews v2</p>
        <ul className="text-xs text-slate-700 mt-2 space-y-1 list-disc list-inside">
          <li>Layouts: classic · magazine · bold · minimal</li>
          <li>Classic presets, festival/mourning, Telugu fonts</li>
          <li>Smart homepage feed from categories + dateline</li>
        </ul>
        {tenantId && (
          <Link href={`/admin/tenants/${tenantId}/domain-settings`} className="inline-block mt-2 text-xs font-medium text-brand underline">
            Domain Settings → Appearance
          </Link>
        )}
      </div>

      <details className="text-xs text-slate-600">
        <summary className="cursor-pointer font-medium text-slate-800">Where each setting is saved</summary>
        <ul className="mt-2 space-y-1">
          {THEME_ADMIN_SOURCES.filter((s) => s.id !== 'homepage-legacy').map((s) => (
            <li key={s.id}>
              <strong>{s.label}</strong> — {s.saves}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}