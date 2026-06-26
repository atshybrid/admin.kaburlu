/**
 * Super Admin — Tenant Platform Wallet
 * Route: /admin/tenant-wallets
 */
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import TenantWalletView from '../../components/dashboard/tenantWallet/TenantWalletView'

export default function TenantWalletsPage() {
  return (
    <DashboardLayout title="Tenant Wallet System">
      <TenantWalletView />
    </DashboardLayout>
  )
}
