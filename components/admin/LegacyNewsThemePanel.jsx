/**
 * @deprecated UI removed from Domain Settings — legacy stack only. Keep for one-off tools until 04-news API retires.
 * Legacy publisher themes (style1–5) — preview + PATCH domain settings.themeStyle
 */
import { useCallback, useEffect, useState } from 'react'
import { getToken } from '../../utils/auth'
import { getDomainSettings, patchDomainSettings } from '../../lib/domainSettingsApi'
import {
  NEWS_THEME_CATALOG,
  normalizeThemeStyleId,
  legacyNewsApiSupports,
  webnewsLocalPreviewUrl,
} from '../../lib/newsThemeCatalog'
import { ThemeStylePicker } from './ThemeStylePicker'

function getApiBase() {
  if (typeof window !== 'undefined') return '/api/proxy'
  return (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/$/, '') + '/api/v1'
}

export function LegacyNewsThemePanel({
  tenantId,
  tenantSlug,
  themeVersion = 'v2',
  /** When true, parent owns save (Domain Settings) — hide local save */
  embedded = false,
  value,
  onChange,
}) {
  const [domainId, setDomainId] = useState(null)
  const [themeStyle, setThemeStyle] = useState('style1')
  const [loading, setLoading] = useState(!embedded)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const effectiveStyle = embedded ? normalizeThemeStyleId(value) : themeStyle
  const setStyle = embedded ? onChange : setThemeStyle

  const loadDomain = useCallback(async () => {
    if (embedded || !tenantId) return
    setLoading(true)
    try {
      const t = getToken()
      const res = await fetch(`${getApiBase()}/tenants/${tenantId}/domains`, {
        headers: { Authorization: `Bearer ${t?.token || ''}` },
      })
      if (!res.ok) throw new Error('Could not load domains')
      const data = await res.json()
      const list = data?.domains || data?.items || data || []
      const primary = list.find((d) => d.isPrimary) || list[0]
      if (!primary?.id) return
      setDomainId(primary.id)
      const settings = await getDomainSettings({
        tenantId,
        domainId: primary.id,
        token: t?.token,
      })
      const cfg = settings?.settings || settings?.effective || settings || {}
      setThemeStyle(normalizeThemeStyleId(cfg.themeStyle))
    } catch (e) {
      setMsg(e.message || 'Load failed')
    } finally {
      setLoading(false)
    }
  }, [tenantId, embedded])

  useEffect(() => {
    loadDomain()
  }, [loadDomain])

  const saveThemeStyle = async () => {
    if (!tenantId || !domainId) {
      setMsg('Add a primary domain first (Domains tab).')
      return
    }
    setSaving(true)
    setMsg('')
    try {
      const t = getToken()
      await patchDomainSettings({
        tenantId,
        domainId,
        token: t?.token,
        data: { themeStyle: effectiveStyle },
      })
      setMsg('Legacy theme saved — refresh consumer site.')
      setTimeout(() => setMsg(''), 4000)
    } catch (e) {
      setMsg(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const support = legacyNewsApiSupports(effectiveStyle)
  const meta = NEWS_THEME_CATALOG.find((x) => x.id === effectiveStyle)
  const preview = webnewsLocalPreviewUrl(tenantSlug)

  if (loading) {
    return (
      <div className="h-24 flex items-center justify-center text-sm text-slate-500">
        Loading legacy theme…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ThemeStylePicker
        value={effectiveStyle}
        onChange={(id) => setStyle?.(id)}
        tenantSlug={tenantSlug}
        showPreviewLinks
        v2Active={themeVersion === 'v2'}
      />

      {meta && (
        <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100">
          <strong>{meta.label}</strong> — {meta.description}
          {support.catalogOnly && (
            <span className="block mt-1 text-amber-700">
              Backend homepage API: partial — prefer v2 layout for Samayam / Call Kaburlu look-alikes (magazine / minimal).
            </span>
          )}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {!embedded && (
          <button
            type="button"
            onClick={saveThemeStyle}
            disabled={saving || !domainId}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save legacy theme'}
          </button>
        )}
        {tenantSlug && (
          <a href={preview} target="_blank" rel="noreferrer" className="text-sm text-brand font-medium underline">
            Preview Webnews (v2)
          </a>
        )}
      </div>

      {msg && <p className="text-xs text-slate-700">{msg}</p>}
    </div>
  )
}