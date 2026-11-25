import { useCallback, useEffect, useMemo, useState } from 'react'
import { adsApi } from '../../lib/api/tenantApi'
import { domainSettingsApi } from '../../lib/api/services/domainSettingsApi'
import { getToken } from '../../utils/auth'
import WebnewsAdsLivePreview from './WebnewsAdsLivePreview'
import {
  WEBNEWS_AD_PLACEMENTS,
  DEFAULT_WEBNEWS_PLACEMENT_SETTINGS,
  PLACEMENT_FLAG_KEY,
  getPlacementById,
  formatAdSchedule,
  toDatetimeLocal,
  fromDatetimeLocal,
  parsePlacementSize,
  DEFAULT_WEBNEWS_POPUP_SETTINGS,
  normalizePopupSettings,
} from '../../lib/webnewsAdPlacements'

const V2_PLACEMENT_IDS = new Set(WEBNEWS_AD_PLACEMENTS.map((p) => p.id))

function emptyCampaign(placement = 'header') {
  return {
    placement,
    title: '',
    imageUrl: '',
    clickUrl: '',
    enabled: true,
    priority: 10,
    startsAt: '',
    endsAt: '',
    imageWidth: '',
    imageHeight: '',
  }
}

function campaignFromAd(ad) {
  if (!ad) return emptyCampaign()
  const meta = ad.meta && typeof ad.meta === 'object' ? ad.meta : {}
  return {
    placement: ad.placement || 'header',
    title: ad.title || '',
    imageUrl: ad.imageUrl || '',
    clickUrl: ad.clickUrl || '',
    enabled: ad.enabled !== false,
    priority: ad.priority ?? 0,
    startsAt: toDatetimeLocal(ad.startsAt),
    endsAt: toDatetimeLocal(ad.endsAt),
    imageWidth: meta.imageWidth != null ? String(meta.imageWidth) : '',
    imageHeight: meta.imageHeight != null ? String(meta.imageHeight) : '',
  }
}

function normalizePlacements(raw = {}) {
  return { ...DEFAULT_WEBNEWS_PLACEMENT_SETTINGS, ...raw }
}

function pickTopCampaign(ads, placement) {
  return [...ads]
    .filter((a) => a.placement === placement && a.enabled !== false)
    .sort((a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0))[0]
}

export default function WebnewsAdsStudio({ tenant, domains = [] }) {
  const primaryDomain =
    domains.find((d) => d.isPrimary && !String(d.domain || '').startsWith('epaper.')) ||
    domains.find((d) => d.kind === 'NEWS' || d.type === 'NEWS') ||
    domains.find((d) => !String(d.domain || '').startsWith('epaper.'))

  const domainId = primaryDomain?.id
  const tenantSlug = tenant?.slug

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [campaignSaving, setCampaignSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [selectedPlacement, setSelectedPlacement] = useState('header')
  const [privateAds, setPrivateAds] = useState(false)
  const [adsenseClient, setAdsenseClient] = useState('')
  const [adManagerCode, setAdManagerCode] = useState('')
  const [adsenseSlots, setAdsenseSlots] = useState({})
  const [placements, setPlacements] = useState(() => normalizePlacements())
  const [popupSettings, setPopupSettings] = useState(() => ({ ...DEFAULT_WEBNEWS_POPUP_SETTINGS }))

  const [campaigns, setCampaigns] = useState([])
  const [adAnalytics, setAdAnalytics] = useState({ byAd: {}, totals: { impressions: 0, clicks: 0, ctr: null } })
  const [editingCampaignId, setEditingCampaignId] = useState(null)
  const [campaignForm, setCampaignForm] = useState(() => emptyCampaign('header'))

  const v2Campaigns = useMemo(
    () => campaigns.filter((a) => V2_PLACEMENT_IDS.has(a.placement)),
    [campaigns],
  )

  const slotCampaigns = useMemo(
    () =>
      v2Campaigns
        .filter((a) => a.placement === selectedPlacement)
        .sort((a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0)),
    [v2Campaigns, selectedPlacement],
  )

  const selectedMeta = getPlacementById(selectedPlacement)
  const recommended =
    selectedPlacement === 'popup'
      ? parsePlacementSize('600×800') || { w: 600, h: 800 }
      : parsePlacementSize(selectedMeta?.desktop)

  const loadAll = useCallback(async () => {
    if (!tenant?.id) return
    setLoading(true)
    setError('')
    try {
      const [adsList, analytics] = await Promise.all([
        adsApi.list(tenant.id).catch(() => []),
        adsApi.analytics(tenant.id, 30).catch(() => null),
      ])
      const list = Array.isArray(adsList) ? adsList : adsList.ads || []
      setCampaigns(list)
      if (analytics?.byAd) {
        setAdAnalytics({
          byAd: analytics.byAd,
          totals: analytics.totals || { impressions: 0, clicks: 0, ctr: null },
        })
      }

      if (domainId) {
        const cfg = await domainSettingsApi.get(tenant.id, domainId)
        const ads = cfg?.ads || {}
        const intAds = cfg?.integrations?.ads || {}
        setPrivateAds(ads.privateAds === true)
        setAdsenseClient(intAds.adsenseClientId || ads.adsenseClient || '')
        setAdManagerCode(intAds.adManagerNetworkCode || '')
        setAdsenseSlots(
          ads.adsenseSlots && typeof ads.adsenseSlots === 'object' ? { ...ads.adsenseSlots } : {},
        )
        const place =
          ads.settings?.placements && typeof ads.settings.placements === 'object'
            ? ads.settings.placements
            : {}
        setPlacements(normalizePlacements(place))
        const pop =
          ads.settings?.popup && typeof ads.settings.popup === 'object' ? ads.settings.popup : {}
        setPopupSettings(normalizePopupSettings(pop))
      }
    } catch (e) {
      setError(e.message || 'Failed to load ads settings')
    } finally {
      setLoading(false)
    }
  }, [tenant?.id, domainId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    const top = pickTopCampaign(v2Campaigns, selectedPlacement)
    setEditingCampaignId(top?.id || null)
    setCampaignForm(top ? campaignFromAd(top) : emptyCampaign(selectedPlacement))
  }, [selectedPlacement, loading, v2Campaigns])

  const uploadBanner = async (file) => {
    if (!tenant?.id || !domainId) {
      setError('Upload కోసం primary news domain అవసరం.')
      return
    }
    if (!file?.type?.startsWith('image/')) {
      setError('Image file (JPG/PNG/WebP) select చేయండి.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image 5MB కంటే తక్కువ ఉండాలి.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const token = getToken()
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', `tenants/${tenant.id}/domains/${domainId}/ads/${selectedPlacement}`)
      fd.append('kind', 'image')
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: token?.token ? { Authorization: `Bearer ${token.token}` } : {},
        body: fd,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || data.error || 'Upload failed')
      const url = data.url || data.publicUrl || data.location
      if (!url) throw new Error('No URL returned from upload')
      setCampaignForm((f) => ({ ...f, imageUrl: url }))
      setSuccess('Image uploaded — preview iframe చూడండి')
      setTimeout(() => setSuccess(''), 2500)
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  const applyRecommendedSize = () => {
    if (!recommended) return
    setCampaignForm((f) => ({
      ...f,
      imageWidth: String(recommended.w),
      imageHeight: String(recommended.h),
    }))
  }

  const saveGlobal = async () => {
    if (!tenant?.id || !domainId) {
      setError('Primary news domain లేకుండా save చేయలేము.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await domainSettingsApi.update(tenant.id, domainId, {
        ads: {
          privateAds,
          adsenseClient: adsenseClient || null,
          adsenseSlots,
          settings: { placements, popup: normalizePopupSettings(popupSettings) },
        },
        integrations: {
          ads: { adsenseClientId: adsenseClient || null },
        },
      })
      setSuccess('AdSense / platform settings saved')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const saveCampaign = async () => {
    if (!tenant?.id) return
    if (!campaignForm.imageUrl?.trim()) {
      setError('Private ad కి banner image upload లేదా URL అవసరం.')
      return
    }
    setCampaignSaving(true)
    setError('')
    try {
      const meta = {}
      if (campaignForm.imageWidth) meta.imageWidth = Number(campaignForm.imageWidth)
      if (campaignForm.imageHeight) meta.imageHeight = Number(campaignForm.imageHeight)
      const payload = {
        placement: campaignForm.placement,
        title: campaignForm.title || null,
        imageUrl: campaignForm.imageUrl.trim(),
        clickUrl: campaignForm.clickUrl || null,
        enabled: campaignForm.enabled,
        visibility: 'PRIVATE',
        priority: Number(campaignForm.priority) || 0,
        startsAt: fromDatetimeLocal(campaignForm.startsAt),
        endsAt: fromDatetimeLocal(campaignForm.endsAt),
        meta: Object.keys(meta).length ? meta : null,
      }
      if (editingCampaignId) {
        await adsApi.update(tenant.id, editingCampaignId, payload)
      } else {
        const created = await adsApi.create(tenant.id, payload)
        setEditingCampaignId(created.id)
      }
      if (domainId && !privateAds) {
        await domainSettingsApi.update(tenant.id, domainId, {
          ads: {
            privateAds: true,
            adsenseClient: adsenseClient || null,
            adsenseSlots,
            settings: { placements, popup: normalizePopupSettings(popupSettings) },
          },
        })
        setPrivateAds(true)
      }
      if (campaignForm.placement === 'popup') {
        setPopupSettings((p) => normalizePopupSettings({ ...p, enabled: true }))
      }
      setSuccess('Private ad saved — live site లో reflect అవుతుంది (private ads ON)')
      setTimeout(() => setSuccess(''), 3000)
      await loadAll()
    } catch (e) {
      setError(e.message)
    } finally {
      setCampaignSaving(false)
    }
  }

  const deleteCampaign = async () => {
    if (!editingCampaignId || !tenant?.id) return
    if (!window.confirm('This private ad delete చేయాలా?')) return
    setCampaignSaving(true)
    try {
      await adsApi.delete(tenant.id, editingCampaignId)
      setEditingCampaignId(null)
      setCampaignForm(emptyCampaign(selectedPlacement))
      await loadAll()
    } catch (e) {
      setError(e.message)
    } finally {
      setCampaignSaving(false)
    }
  }

  const startNewCampaignForSlot = () => {
    setEditingCampaignId(null)
    setCampaignForm(emptyCampaign(selectedPlacement))
  }

  const placementStatus = (id) => {
    const slot = adsenseSlots[id]
    const active = v2Campaigns.filter((a) => a.placement === id && a.enabled !== false)
    const flagKey = PLACEMENT_FLAG_KEY[id]
    let placementOn = true
    if (flagKey === 'inFeedEvery') placementOn = (placements.inFeedEvery || 0) > 0
    else if (flagKey === 'inArticleEvery') placementOn = (placements.inArticleEvery || 0) > 0
    else if (flagKey && placements[flagKey] !== undefined) placementOn = !!placements[flagKey]
    if (!placementOn) return { tone: 'slate', label: 'Off' }
    if (active.length) return { tone: 'green', label: `Private (${active.length})` }
    if (slot) return { tone: 'blue', label: 'AdSense' }
    return { tone: 'slate', label: 'Empty' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">{success}</div>
      )}

      {!privateAds && v2Campaigns.some((a) => a.enabled !== false) && (
        <div className="p-3 bg-amber-50 border border-amber-300 text-amber-950 text-sm rounded-lg">
          <strong>Ads site లో కనిపించవు</strong> — “Enable private ads on live site” OFF ఉంది. Save AdSense & toggles లో ON చేసి save చేయండి (లేదా private ad save చేస్తే automatic ON అవుతుంది).
        </div>
      )}

      {/* Step 1 — pick slot */}
      <section className="bg-white rounded-xl border p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">1. Slot ఎంచుకోండి</h3>
        <div className="flex flex-wrap gap-2">
          {WEBNEWS_AD_PLACEMENTS.map((p) => {
            const st = placementStatus(p.id)
            const active = selectedPlacement === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlacement(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  active ? 'bg-brand text-white border-brand' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {p.nameTe}
                <span className="ml-1 opacity-75">({st.label})</span>
              </button>
            )
          })}
        </div>
        {selectedMeta && (
          <p className="text-xs text-slate-600">
            <strong>{selectedMeta.name}</strong> — Desktop <span className="font-mono">{selectedMeta.desktop}</span>, Mobile{' '}
            <span className="font-mono">{selectedMeta.mobile}</span> · {selectedMeta.page}
          </p>
        )}
      </section>

      {/* Step 2 — live preview */}
      <section>
        <h3 className="text-sm font-semibold text-slate-900 mb-2">2. Live preview (నిజ Webnews theme)</h3>
        <WebnewsAdsLivePreview
          tenantSlug={tenantSlug}
          highlightPosition={selectedPlacement}
          draft={{
            imageUrl: campaignForm.imageUrl,
            title: campaignForm.title,
          }}
        />
      </section>

      {selectedPlacement === 'popup' && (
        <section className="bg-white rounded-xl border border-violet-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Popup ప్రవర్తన (site open తర్వాత modal)</h3>
          <p className="text-xs text-slate-600">
            Private popup మాత్రమే (AdSense policy). ✕ బటన్ వెంటనే కనిపిస్తుంది. Auto-close సెకన్లు 0 అయితే manual మాత్రమే. Campaign start/end dates పైన ఉన్న షెడ్యూల్ ప్రకారమే banner కనిపిస్తుంది.
          </p>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={popupSettings.enabled}
              onChange={(e) => setPopupSettings({ ...popupSettings, enabled: e.target.checked })}
              className="rounded w-4 h-4"
            />
            Site లో popup ON
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <MotionLabeledInput
              label="Page load తర్వాత (సెకన్లు)"
              type="number"
              value={String(popupSettings.delaySec)}
              onChange={(v) => setPopupSettings({ ...popupSettings, delaySec: v, trigger: 'delay' })}
            />
            <MotionLabeledInput
              label="Auto-close (సెకన్లు, 0=ఆఫ్)"
              type="number"
              value={String(popupSettings.autoCloseSec)}
              onChange={(v) => setPopupSettings({ ...popupSettings, autoCloseSec: v })}
            />
            <MotionLabeledInput
              label="మళ్లీ చూపేది (గంటలు)"
              type="number"
              value={String(popupSettings.frequencyHours)}
              onChange={(v) => setPopupSettings({ ...popupSettings, frequencyHours: v })}
            />
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Desktop style</label>
              <select
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={popupSettings.desktopStyle}
                onChange={(e) => setPopupSettings({ ...popupSettings, desktopStyle: e.target.value })}
              >
                <option value="modal">Modal (center)</option>
                <option value="corner">Corner card</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Mobile style</label>
              <select
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={popupSettings.mobileStyle}
                onChange={(e) => setPopupSettings({ ...popupSettings, mobileStyle: e.target.value })}
              >
                <option value="bottom-sheet">Bottom sheet (≤30%)</option>
                <option value="corner">Corner</option>
              </select>
            </div>
            <MotionLabeledInput
              label="రోజుకు గరిష్ట popup"
              type="number"
              value={String(popupSettings.maxPerDay)}
              onChange={(v) => setPopupSettings({ ...popupSettings, maxPerDay: v })}
            />
          </div>
          <MotionFieldset legend="ఏ pages లో">
            <div className="flex flex-wrap gap-3 text-sm">
              {['home', 'category', 'article', 'daily'].map((pg) => (
                <label key={pg} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={popupSettings.pages?.includes(pg)}
                    onChange={(e) => {
                      const next = new Set(popupSettings.pages || [])
                      if (e.target.checked) next.add(pg)
                      else next.delete(pg)
                      setPopupSettings({ ...popupSettings, pages: [...next] })
                    }}
                  />
                  {pg}
                </label>
              ))}
            </div>
          </MotionFieldset>
          <button
            type="button"
            onClick={saveGlobal}
            disabled={saving || !domainId}
            className="px-4 py-2 bg-violet-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save popup settings'}
          </button>
        </section>
      )}

      {/* Step 3 — configure */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="bg-white rounded-xl border p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">3a. Private ad (ఈ slot)</h3>
            {slotCampaigns.length > 1 && (
              <select
                className="text-xs border rounded-lg px-2 py-1"
                value={editingCampaignId || ''}
                onChange={(e) => {
                  const id = e.target.value
                  const ad = slotCampaigns.find((a) => a.id === id)
                  setEditingCampaignId(id || null)
                  setCampaignForm(ad ? campaignFromAd(ad) : emptyCampaign(selectedPlacement))
                }}
              >
                {slotCampaigns.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title || a.id} (pri {a.priority ?? 0})
                  </option>
                ))}
              </select>
            )}
          </div>

          <fieldset className="rounded-lg border-2 border-violet-200 bg-violet-50/60 p-4 space-y-3">
            <legend className="text-sm font-bold text-violet-900 px-1">ప్రచార కాలం (Start / End)</legend>
            <p className="text-xs text-violet-800">
              ఖాళీ start = వెంటనే live. ఖాళీ end = ముగియదు. ఈ range లో మాత్రమే site + preview లో కనిపిస్తుంది.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MotionLabeledInput
                label="ప్రారంభ తేదీ & సమయం (IST)"
                type="datetime-local"
                value={campaignForm.startsAt}
                onChange={(v) => setCampaignForm({ ...campaignForm, startsAt: v })}
              />
              <MotionLabeledInput
                label="ముగింపు తేదీ & సమయం (IST)"
                type="datetime-local"
                value={campaignForm.endsAt}
                onChange={(v) => setCampaignForm({ ...campaignForm, endsAt: v })}
              />
            </div>
          </fieldset>

          {editingCampaignId && adAnalytics.byAd?.[editingCampaignId] && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 flex flex-wrap gap-4">
              <span>
                30-day impressions:{' '}
                <strong>{adAnalytics.byAd[editingCampaignId].impressions ?? 0}</strong>
              </span>
              <span>
                Clicks: <strong>{adAnalytics.byAd[editingCampaignId].clicks ?? 0}</strong>
              </span>
              <span>
                CTR:{' '}
                <strong>
                  {adAnalytics.byAd[editingCampaignId].ctr != null
                    ? `${adAnalytics.byAd[editingCampaignId].ctr}%`
                    : '—'}
                </strong>
              </span>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={privateAds}
              onChange={(e) => setPrivateAds(e.target.checked)}
              className="rounded border-slate-300 w-4 h-4"
            />
            Site లో private ads ON (live సైట్‌కి తప్పనిసరి)
          </label>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-3">
            <p className="text-xs font-medium text-slate-700">
              {selectedPlacement === 'popup' ? 'పాపప్ బ్యానర్ (modal లో responsive)' : 'Banner image'}
            </p>
            {recommended && (
              <p className="text-[11px] text-slate-500">
                Recommended upload: <strong>{recommended.w}×{recommended.h}px</strong>
                <button type="button" onClick={applyRecommendedSize} className="ml-2 text-brand underline">
                  Apply to size fields
                </button>
              </p>
            )}
            <input
              type="url"
              value={campaignForm.imageUrl}
              onChange={(e) => setCampaignForm({ ...campaignForm, imageUrl: e.target.value })}
              placeholder="https://… or upload below"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <div className="flex flex-wrap items-center gap-3">
              <label className="px-3 py-1.5 text-xs font-medium bg-brand text-white rounded-lg cursor-pointer hover:opacity-90">
                {uploading ? 'Uploading…' : 'Upload banner'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) uploadBanner(f)
                    e.target.value = ''
                  }}
                />
              </label>
              {campaignForm.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={campaignForm.imageUrl} alt="" className="h-14 w-auto rounded border object-contain max-w-[200px]" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MotionLabeledInput
                label="Display width (px)"
                value={campaignForm.imageWidth}
                onChange={(v) => setCampaignForm({ ...campaignForm, imageWidth: v })}
                placeholder={recommended?.w || 'auto'}
              />
              <MotionLabeledInput
                label="Display height (px)"
                value={campaignForm.imageHeight}
                onChange={(v) => setCampaignForm({ ...campaignForm, imageHeight: v })}
                placeholder={recommended?.h || 'auto'}
              />
            </div>
          </div>

          <MotionLabeledInput
            label="Sponsor title"
            value={campaignForm.title}
            onChange={(v) => setCampaignForm({ ...campaignForm, title: v })}
          />
          <MotionLabeledInput
            label="Click URL"
            value={campaignForm.clickUrl}
            onChange={(v) => setCampaignForm({ ...campaignForm, clickUrl: v })}
            placeholder="https://advertiser.com"
          />

          <div className="grid grid-cols-2 gap-3">
            <MotionLabeledInput
              label="Priority (overlap లో ఎక్కువ = ముందు)"
              type="number"
              value={campaignForm.priority}
              onChange={(v) => setCampaignForm({ ...campaignForm, priority: v })}
            />
            <label className="flex items-center gap-2 text-sm pt-6">
              <input
                type="checkbox"
                checked={campaignForm.enabled}
                onChange={(e) => setCampaignForm({ ...campaignForm, enabled: e.target.checked })}
              />
              Enabled
            </label>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={saveCampaign}
              disabled={campaignSaving}
              className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {campaignSaving ? 'Saving…' : editingCampaignId ? 'Update private ad' : 'Save private ad'}
            </button>
            <button type="button" onClick={startNewCampaignForSlot} className="px-3 py-2 border rounded-lg text-sm">
              + Another ad (same slot)
            </button>
            {editingCampaignId && (
              <button type="button" onClick={deleteCampaign} className="px-3 py-2 text-sm text-red-600">
                Delete
              </button>
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl border p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">3b. Google AdSense (fallback)</h3>
          <p className="text-xs text-slate-500">
            Private ad లేకుండా / schedule లేనిప్పుడు AdSense fill అవుతుంది. Slot ID save చేయడం global save తో పాటు.
          </p>
          <MotionLabeledInput
            label="Publisher ID (ca-pub-…)"
            value={adsenseClient}
            onChange={setAdsenseClient}
            mono
          />
          <MotionLabeledInput
            label={`AdSense slot ID — ${selectedPlacement}`}
            value={adsenseSlots[selectedPlacement] || ''}
            onChange={(v) => setAdsenseSlots((s) => ({ ...s, [selectedPlacement]: v.trim() }))}
            mono
            placeholder="1234567890"
          />
          <MotionLabeledInput
            label="Ad Manager network (read-only)"
            value={adManagerCode}
            onChange={() => {}}
            readOnly
            hint="Domain → Integrations"
          />
          <button
            type="button"
            onClick={saveGlobal}
            disabled={saving || !domainId}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save AdSense & toggles'}
          </button>
        </section>
      </div>

      {v2Campaigns.length > 0 && (
        <section className="bg-white rounded-xl border p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Ads history & analytics (last 30 days)</h3>
            <div className="flex flex-wrap gap-3 text-xs text-slate-600">
              <span>
                Impressions:{' '}
                <strong className="text-slate-900">{adAnalytics.totals?.impressions ?? 0}</strong>
              </span>
              <span>
                Clicks: <strong className="text-slate-900">{adAnalytics.totals?.clicks ?? 0}</strong>
              </span>
              <span>
                CTR:{' '}
                <strong className="text-slate-900">
                  {adAnalytics.totals?.ctr != null ? `${adAnalytics.totals.ctr}%` : '—'}
                </strong>
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Site లో ad load/click తర్వాత metrics update అవుతాయి. Row click చేస్తే edit form లో start/end + analytics చూడండి.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b">
                  <th className="pb-2 pr-2">Title</th>
                  <th className="pb-2 pr-2">Slot</th>
                  <th className="pb-2 pr-2">Start (IST)</th>
                  <th className="pb-2 pr-2">End (IST)</th>
                  <th className="pb-2 pr-2">Impr.</th>
                  <th className="pb-2 pr-2">Clicks</th>
                  <th className="pb-2 pr-2">CTR</th>
                  <th className="pb-2 pr-2">Created</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {v2Campaigns.map((ad) => {
                  const sched = formatAdSchedule(ad.startsAt, ad.endsAt)
                  const m = adAnalytics.byAd?.[ad.id] || { impressions: 0, clicks: 0, ctr: null }
                  return (
                    <tr
                      key={ad.id}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => {
                        setSelectedPlacement(ad.placement)
                        setEditingCampaignId(ad.id)
                        setCampaignForm(campaignFromAd(ad))
                      }}
                    >
                      <td className="py-2 pr-2 font-medium">{ad.title || '—'}</td>
                      <td className="py-2 pr-2 font-mono text-xs">{ad.placement}</td>
                      <td className="py-2 pr-2 text-xs whitespace-nowrap">
                        {ad.startsAt ? formatIstDisplay(ad.startsAt) : '—'}
                      </td>
                      <td className="py-2 pr-2 text-xs whitespace-nowrap">
                        {ad.endsAt ? formatIstDisplay(ad.endsAt) : '—'}
                      </td>
                      <td className="py-2 pr-2 text-xs tabular-nums">{m.impressions ?? 0}</td>
                      <td className="py-2 pr-2 text-xs tabular-nums">{m.clicks ?? 0}</td>
                      <td className="py-2 pr-2 text-xs tabular-nums">
                        {m.ctr != null ? `${m.ctr}%` : '—'}
                      </td>
                      <td className="py-2 pr-2 text-xs whitespace-nowrap text-slate-500">
                        {ad.createdAt ? formatIstDisplay(ad.createdAt) : '—'}
                      </td>
                      <td className="py-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            sched.tone === 'amber'
                              ? 'bg-amber-100 text-amber-900'
                              : sched.tone === 'slate'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-green-100 text-green-900'
                          }`}
                        >
                          {sched.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

function formatIstDisplay(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

/** React requires PascalCase — lowercase tags render as unknown HTML elements (fields were invisible). */
function MotionFieldset({ legend, children }) {
  return (
    <fieldset className="rounded-lg border border-slate-200 p-3">
      <legend className="text-xs font-semibold text-slate-800 px-1">{legend}</legend>
      {children}
    </fieldset>
  )
}

function MotionLabeledInput({ label, hint, value, onChange, type = 'text', placeholder, mono, readOnly }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        readOnly={readOnly}
        onChange={readOnly ? undefined : (e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg text-sm ${mono ? 'font-mono' : ''} ${readOnly ? 'bg-slate-50 text-slate-500' : 'bg-white'}`}
      />
      {hint && <p className="text-[10px] text-slate-500 mt-0.5">{hint}</p>}
    </div>
  )
}