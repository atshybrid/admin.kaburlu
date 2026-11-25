/**
 * Tenant Detail Page with Tabs
 * /admin/tenants/[id]/[[...tab]]
 */
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '../../../../components/dashboard/DashboardLayout'
import TenantDetailLayout from '../../../../components/admin/TenantDetailLayout'
import { 
  TenantOverviewTab, 
  TenantEntityTab, 
  ModernDomainsTab,
  TenantCategoriesTab,
  TenantPaymentsTab,
  TenantSettingsTab,
  TenantIdCardsTab,
  TenantPagesTab,
  TenantReportersTab,
  TenantAdminsTab,
  TenantAdsTab,
  TenantEpaperTab,
  TenantDomainSettingsTab,
  TenantEditionsTab,
  TenantWalletTab,
  TenantReporterBillingTab,
} from '../../../../components/admin/tabs'

/** Old tenant-theme tabs — single Webnews config in Domain Settings */
const LEGACY_TAB_REDIRECT = {
  branding: 'domain-settings',
  seo: 'domain-settings',
  homepage: 'domain-settings',
}

function TenantDetailContent() {
  const router = useRouter()
  const { id, tab } = router.query
  
  // Get active tab from URL or default to overview
  const activeTab = Array.isArray(tab) ? tab[0] : (tab || 'overview')

  useEffect(() => {
    if (!id) return
    const target = LEGACY_TAB_REDIRECT[activeTab]
    if (target) {
      router.replace(`/admin/tenants/${id}/${target}`)
    }
  }, [id, activeTab, router])

  // Render the appropriate tab content based on context
  const renderTabContent = (tenantContext) => {
    if (LEGACY_TAB_REDIRECT[activeTab]) {
      return (
        <div className="p-6 text-sm text-slate-500">Redirecting to Domain Settings…</div>
      )
    }

    switch (activeTab) {
      case 'overview':
        return <TenantOverviewTab tenantContext={tenantContext} />
      case 'entity':
        return <TenantEntityTab tenantContext={tenantContext} />
      case 'domains':
        return <ModernDomainsTab tenantId={id} />
      case 'categories':
        return <TenantCategoriesTab tenantContext={tenantContext} />
      case 'admins':
        return <TenantAdminsTab tenantContext={tenantContext} />
      case 'reporters':
        return <TenantReportersTab tenantContext={tenantContext} />
      case 'epaper':
        return <TenantEpaperTab tenantContext={tenantContext} />
      case 'editions':
        return <TenantEditionsTab tenantContext={tenantContext} />
      case 'domain-settings':
        return <TenantDomainSettingsTab tenantContext={tenantContext} />
      default:
        return <TenantOverviewTab tenantContext={tenantContext} />
    }
  }

  if (!id) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-sm text-yellow-700">Loading tenant...</p>
        </div>
      </div>
    )
  }

  return (
    <TenantDetailLayout tenantId={id} activeTab={activeTab} renderContent={renderTabContent} />
  )
}

export default function TenantDetailPage() {
  return (
    <DashboardLayout title="Tenant settings">
      <TenantDetailContent />
    </DashboardLayout>
  )
}

