import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { hasRole } from '../../../utils/roleUtils'
import { useLayout } from '../DashboardLayout'
import BillingOverviewTab from './BillingOverviewTab'
import BillingWalletTab from './BillingWalletTab'
import BillingReportersTab from './BillingReportersTab'
import BillingSettingsTab from './BillingSettingsTab'
import { Button } from '../../ui'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'reporters', label: 'Reporters' },
  { id: 'settings', label: 'Settings' },
]

export default function BillingTenantHub({ tenantId, tenantName, tenantSlug, prgiNumber }) {
  const router = useRouter()
  const { user } = useLayout()
  const [reporterBucket, setReporterBucket] = useState('all')

  const tab = useMemo(() => {
    const t = String(router.query.tab || 'overview').toLowerCase()
    return TABS.some((x) => x.id === t) ? t : 'overview'
  }, [router.query.tab])

  const setTab = (id) => {
    router.replace(
      { pathname: router.pathname, query: { ...router.query, tab: id } },
      undefined,
      { shallow: true },
    )
  }

  if (!hasRole(user, ['SUPER_ADMIN', 'SUPERADMIN'])) {
    return (
      <div className="max-w-lg mx-auto mt-16 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-rose-900">Super admin only</h2>
      </div>
    )
  }

  const tenantMeta = { name: tenantName, slug: tenantSlug, prgiNumber }

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Platform billing console
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{tenantName || 'Tenant'}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {[tenantSlug, prgiNumber ? `PRGI ${prgiNumber}` : null, tenantId].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/tenant-wallets">
            <Button variant="outline" size="sm">← All wallets</Button>
          </Link>
          <Link href={`/admin/tenants/${tenantId}`}>
            <Button variant="ghost" size="sm">Tenant admin</Button>
          </Link>
        </div>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-slate-200 pb-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-brand text-brand'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'overview' ? (
        <BillingOverviewTab
          tenantId={tenantId}
          onNavigateReporters={(bucket) => {
            setReporterBucket(bucket)
            setTab('reporters')
          }}
        />
      ) : null}
      {tab === 'wallet' ? <BillingWalletTab tenantId={tenantId} tenantMeta={tenantMeta} /> : null}
      {tab === 'reporters' ? (
        <BillingReportersTab
          tenantId={tenantId}
          tenantSlug={tenantSlug}
          tenantName={tenantName}
          initialBucket={reporterBucket}
        />
      ) : null}
      {tab === 'settings' ? <BillingSettingsTab tenantId={tenantId} /> : null}
    </div>
  )
}
