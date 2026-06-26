/**
 * Tenant detail tab — platform wallet for one newspaper
 */
import { useLayout } from '../../dashboard/DashboardLayout'
import { hasRole } from '../../../utils/roleUtils'
import TenantWalletPanel from '../../dashboard/tenantWallet/TenantWalletPanel'

export default function TenantWalletTab({ tenantContext }) {
  const { user } = useLayout()
  const tenant = tenantContext?.tenant
  const tenantId = tenant?.id || tenantContext?.tenantId

  if (!hasRole(user, ['SUPER_ADMIN', 'SUPERADMIN'])) {
    return (
      <div className="max-w-lg rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <h3 className="font-semibold text-rose-900">Super admin only</h3>
        <p className="text-sm text-rose-700 mt-2">Platform wallet is managed by Super Admin.</p>
      </div>
    )
  }

  if (!tenantId) {
    return <p className="text-sm text-slate-500 p-4">Tenant not loaded.</p>
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Platform Wallet</h2>
        <p className="text-sm text-slate-500">Prepaid balance, monthly fee, and recharge for this newspaper.</p>
      </div>
      <TenantWalletPanel
        tenantId={tenantId}
        tenantName={tenant?.name || tenant?.slug}
        tenantSlug={tenant?.slug}
        prgiNumber={tenant?.prgiNumber}
        embedded
      />
    </div>
  )
}
