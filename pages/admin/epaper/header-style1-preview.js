import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { getToken } from '../../../utils/auth'

const SAMPLE_SETTINGS = {
  domainName: 'www.manatelangana.news',
  tenantName: 'Mana Telangana',
  logoText: 'మన తెలంగాణ',
  logoUrl: '',
  headerAdUrl: '',
  qrCodeUrl: '',
  publishedAreaText: 'Hyderabad, Karimnagar, Warangal, Khammam, Nalgonda, Mahabubnagar, Nizamabad',
  sampatikaLabel: 'సంపుటి',
  sampatikaValue: '14',
  sanchikaLabel: 'సంచిక',
  sanchikaValue: '236',
  issueDay: '25',
  issueMonthText: 'ఫిబ్రవరి',
  issueYear: '2026',
  priceLabel: 'వెల',
  priceValue: '₹5.00',
}

function readAny(obj, paths, fallback = '') {
  for (const path of paths) {
    const value = String(path)
      .split('.')
      .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj)
    if (value !== undefined && value !== null && value !== '') return value
  }
  return fallback
}

function parseSettings(config) {
  const paperSellCost = readAny(config, ['designConfig.paperSellCost', 'paperSellCost', 'pagePrice', 'header.priceValue'], '')

  return {
    domainName: String(readAny(config, ['domainName', 'designConfig.domainName', 'domain', 'epaperDomain', 'settings.domainName'], SAMPLE_SETTINGS.domainName)),
    tenantName: String(readAny(config, ['tenantName', 'name', 'header.tenantName', 'settings.tenantName'], SAMPLE_SETTINGS.tenantName)),
    logoText: String(readAny(config, ['designConfig.headerData', 'logoText', 'newspaperName', 'header.logoText', 'settings.logoText'], SAMPLE_SETTINGS.logoText)),
    logoUrl: String(readAny(config, ['designConfig.headerLogoUrl', 'logoUrl', 'header.logoUrl', 'branding.logoUrl'], SAMPLE_SETTINGS.logoUrl)),
    headerAdUrl: String(readAny(config, ['designConfig.headerRightImageUrl', 'headerAdUrl', 'header.adUrl', 'ads.headerAdUrl'], SAMPLE_SETTINGS.headerAdUrl)),
    qrCodeUrl: String(readAny(config, ['designConfig.headerLeftImageUrl', 'designConfig.subHeaderImageUrl', 'qrCodeUrl', 'header.qrCodeUrl', 'branding.qrCodeUrl'], SAMPLE_SETTINGS.qrCodeUrl)),
    publishedAreaText: String(readAny(config, ['designConfig.subHeaderData', 'publishedAreaText', 'publishedFromText', 'header.publishedAreaText', 'settings.publishedAreaText'], SAMPLE_SETTINGS.publishedAreaText)),
    sampatikaLabel: String(readAny(config, ['sampatikaLabel', 'header.sampatikaLabel'], SAMPLE_SETTINGS.sampatikaLabel)),
    sampatikaValue: String(readAny(config, ['designConfig.startVolumeNumber', 'sampatikaValue', 'valueNumber', 'header.sampatikaValue'], SAMPLE_SETTINGS.sampatikaValue)),
    sanchikaLabel: String(readAny(config, ['sanchikaLabel', 'header.sanchikaLabel'], SAMPLE_SETTINGS.sanchikaLabel)),
    sanchikaValue: String(readAny(config, ['designConfig.issueStartNumber', 'designConfig.issueNumber', 'sanchikaValue', 'issueNumber', 'header.sanchikaValue'], SAMPLE_SETTINGS.sanchikaValue)),
    issueDay: String(readAny(config, ['issueDay', 'header.issueDay'], SAMPLE_SETTINGS.issueDay)),
    issueMonthText: String(readAny(config, ['issueMonthText', 'header.issueMonthText'], SAMPLE_SETTINGS.issueMonthText)),
    issueYear: String(readAny(config, ['issueYear', 'header.issueYear'], SAMPLE_SETTINGS.issueYear)),
    priceLabel: String(readAny(config, ['priceLabel', 'header.priceLabel'], SAMPLE_SETTINGS.priceLabel)),
    priceValue: String(paperSellCost ? `Rs.${paperSellCost}` : readAny(config, ['priceValue', 'pagePrice', 'header.priceValue'], SAMPLE_SETTINGS.priceValue)),
  }
}

export default function HeaderStyle1PreviewPage() {
  const router = useRouter()
  const [tenantId, setTenantId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [settings, setSettings] = useState(SAMPLE_SETTINGS)

  useEffect(() => {
    const tenantFromQuery = String(router.query?.tenantId || '')
    if (tenantFromQuery) setTenantId(tenantFromQuery)
  }, [router.query?.tenantId])

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (tenantId.trim()) params.set('tenantId', tenantId.trim())
      const token = getToken()?.token
      const res = await fetch(`/api/admin/epaper/design-config?${params.toString()}`, {
        headers: {
          accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok) throw new Error(`Failed to load settings: ${res.status}`)
      const json = await res.json()
      setSettings({ ...SAMPLE_SETTINGS, ...parseSettings(json) })
    } catch (e) {
      setError(e?.message || 'Using sample data, settings load failed')
      setSettings(SAMPLE_SETTINGS)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const infoDate = useMemo(() => {
    return `${settings.issueMonthText} ${settings.issueDay}, ${settings.issueYear}`
  }, [settings.issueDay, settings.issueMonthText, settings.issueYear])

  return (
    <DashboardLayout title="Header Style1 Preview">
      <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
        <div className="max-w-[1400px] mx-auto space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap gap-2 items-end justify-between">
            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tenant ID (optional)</label>
                <input value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="border rounded px-3 py-2 text-sm w-[320px]" placeholder="tenantId" />
              </div>
              <button onClick={loadSettings} disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                {loading ? 'Loading...' : 'Load Settings'}
              </button>
            </div>
            <div className="text-xs text-slate-500">Header Style1 (sample + backend settings)</div>
          </div>

          {error ? <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{error}</div> : null}

          <div className="bg-white border border-slate-300 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-300">
              <div className="flex items-center gap-3">
                <div className="w-[20%] shrink-0">
                  <div className="relative h-[90px] w-full border border-slate-300 bg-white rounded overflow-hidden">
                    {settings.qrCodeUrl ? (
                      <Image src={settings.qrCodeUrl} alt="Header Left" fill sizes="20vw" className="object-cover" unoptimized />
                    ) : null}
                  </div>
                </div>

                <div className="w-[60%] min-w-0">
                  <div className="relative h-[90px] w-full border border-slate-300 bg-white rounded overflow-hidden">
                    {settings.logoUrl ? (
                      <Image src={settings.logoUrl} alt="Header Logo" fill sizes="60vw" className="object-contain p-2" unoptimized />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-[28px] font-extrabold text-blue-700 tracking-tight px-3 text-center truncate">{settings.logoText}</div>
                    )}
                  </div>
                </div>

                <div className="w-[20%] shrink-0">
                  <div className="relative h-[90px] w-full border border-slate-300 bg-white rounded overflow-hidden">
                    {settings.headerAdUrl ? (
                      <Image src={settings.headerAdUrl} alt="Header Right" fill sizes="20vw" className="object-cover" unoptimized />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-orange-600 text-white text-sm px-4 py-1.5 flex items-center justify-between gap-3">
              <div className="truncate">Published from: <span className="font-semibold">{settings.publishedAreaText}</span> · {infoDate}</div>
              <div className="shrink-0 font-semibold">{settings.priceLabel}: {settings.priceValue}</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
