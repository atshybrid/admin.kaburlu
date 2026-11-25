import { useCallback, useEffect, useMemo, useState } from 'react'
import calendarApi from '../../../lib/api/services/calendarApi'
import { Button, FormField, Input, Switch, Spinner, toast } from '../../ui'

const CALENDAR_APP_ORIGIN = process.env.NEXT_PUBLIC_CALENDAR_APP_URL || 'http://localhost:3005'

const DEFAULT_FORM = {
  enabled: false,
  taglineTe: 'ప్రతి ఇంటికీ పంచాంగం',
  bookPhone: '',
  logoUrl: '',
  calendarDomains: '',
  studioAdminKey: '',
  defaultsJson: '{\n  "style": "traditional",\n  "paper": "a3",\n  "defaultFormat": "monthly",\n  "publicFormats": ["monthly", "bimonthly", "yearly"]\n}',
}

function domainsToText(domains) {
  if (!domains) return ''
  if (Array.isArray(domains)) return domains.join('\n')
  try {
    const p = typeof domains === 'string' ? JSON.parse(domains) : domains
    return Array.isArray(p) ? p.join('\n') : ''
  } catch {
    return ''
  }
}

export default function TenantCalendarTab({ tenantContext }) {
  const tenantId = tenantContext?.tenant?.id
  const slug = tenantContext?.tenant?.slug || ''
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [suggestedHost, setSuggestedHost] = useState('')
  const [years, setYears] = useState([])

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const { data } = await calendarApi.getConfig(tenantId)
      const c = data.config || {}
      setSuggestedHost(data.suggestedHost || '')
      setYears(data.years || [])
      setForm({
        enabled: !!c.enabled,
        taglineTe: c.taglineTe || '',
        bookPhone: c.bookPhone || '',
        logoUrl: c.logoUrl || '',
        calendarDomains: domainsToText(c.calendarDomains) || data.suggestedHost || '',
        studioAdminKey: c.studioAdminKey || '',
        defaultsJson: JSON.stringify(c.defaults || {}, null, 2),
      })
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Calendar config load failed')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    load()
  }, [load])

  const publicUrl = useMemo(() => {
    const lines = form.calendarDomains.split(/\n/).map((s) => s.trim()).filter(Boolean)
    const host = lines[0] || suggestedHost
    if (host && !host.includes('localhost')) {
      return `https://${host}`
    }
    return `${CALENDAR_APP_ORIGIN}/?tenant=${encodeURIComponent(slug)}`
  }, [form.calendarDomains, suggestedHost, slug])

  const studioUrl = useMemo(() => {
    return `${CALENDAR_APP_ORIGIN}/studio?tenant=${encodeURIComponent(slug)}`
  }, [slug])

  const adminSettingsUrl = useMemo(() => {
    if (typeof window === 'undefined' || !tenantId) return ''
    return `${window.location.origin}/admin/tenants/${tenantId}/calendar`
  }, [tenantId])

  const save = async () => {
    if (!tenantId) return
    let defaults = {}
    try {
      defaults = form.defaultsJson.trim() ? JSON.parse(form.defaultsJson) : {}
    } catch {
      toast.error('Defaults must be valid JSON')
      return
    }
    const calendarDomains = form.calendarDomains
      .split(/\n/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    setSaving(true)
    try {
      await calendarApi.saveConfig(tenantId, {
        enabled: form.enabled,
        taglineTe: form.taglineTe,
        bookPhone: form.bookPhone,
        logoUrl: form.logoUrl,
        calendarDomains,
        studioAdminKey: form.studioAdminKey || null,
        defaults,
      })
      toast.success('Calendar settings saved')
      await load()
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">తెలుగు పంచాంగ క్యాలెండర్</h2>
            <p className="text-sm text-slate-500 mt-1">
              Public: <code className="text-xs bg-slate-100 px-1 rounded">calendar.&lt;your-domain&gt;</code> — ads, rates, slots, logo.
              Layout / per-page ads: Calendar Studio.
            </p>
          </div>
          <Switch checked={form.enabled} onChange={(v) => setForm((f) => ({ ...f, enabled: v }))} label="Enabled" />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <FormField label="Calendar hostnames (one per line)">
          <textarea
            className="w-full min-h-[72px] rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
            value={form.calendarDomains}
            onChange={(e) => setForm((f) => ({ ...f, calendarDomains: e.target.value }))}
            placeholder={suggestedHost || 'calendar.example.com'}
          />
        </FormField>
        <FormField label="Tagline (Telugu)">
          <Input value={form.taglineTe} onChange={(e) => setForm((f) => ({ ...f, taglineTe: e.target.value }))} />
        </FormField>
        <FormField label="Ad booking phone">
          <Input value={form.bookPhone} onChange={(e) => setForm((f) => ({ ...f, bookPhone: e.target.value }))} />
        </FormField>
        <FormField label="Logo URL (public header)">
          <Input value={form.logoUrl} onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))} />
        </FormField>
        <FormField label="Studio admin key (x-admin-key)">
          <Input
            type="password"
            value={form.studioAdminKey}
            onChange={(e) => setForm((f) => ({ ...f, studioAdminKey: e.target.value }))}
            placeholder="Strong secret for /studio saves"
          />
        </FormField>
        <FormField label="Default style / formats (JSON)">
          <textarea
            className="w-full min-h-[140px] rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
            value={form.defaultsJson}
            onChange={(e) => setForm((f) => ({ ...f, defaultsJson: e.target.value }))}
          />
          <p className="text-xs text-slate-500 mt-1">
            Public site shows only <code className="bg-slate-100 px-1 rounded">defaultFormat</code> (e.g. monthly / bimonthly / yearly).
            Studio still uses <code className="bg-slate-100 px-1 rounded">publicFormats</code> to edit all layouts.
          </p>
        </FormField>
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save calendar setup'}
        </Button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <h3 className="font-medium text-slate-900">Calendar controls (admin only)</h3>
        <p className="text-xs text-slate-500">
          Public calendar site does not show studio or settings buttons — open them from here after saving setup.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Public view (readers)
          </a>
          <a
            href={studioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800"
          >
            Calendar Studio
          </a>
          {adminSettingsUrl ? (
            <a
              href={adminSettingsUrl}
              className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 text-blue-900 px-3 py-2 text-sm hover:bg-blue-100"
            >
              This settings tab
            </a>
          ) : null}
        </div>
        <p className="text-xs text-slate-500">
          Studio: set layout template, side ads, rates per slot, book ads — then save. Years in DB:{' '}
          {years.length ? years.map((y) => y.year).join(', ') : 'none yet (created on first open)'}.
        </p>
      </section>
    </div>
  )
}
