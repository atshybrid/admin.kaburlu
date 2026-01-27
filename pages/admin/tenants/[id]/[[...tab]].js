/**
 * Tenant Detail Page with Tabs
 * /admin/tenants/[id]/[[...tab]]
 */
import { useRouter } from 'next/router'
import DashboardLayout from '../../../../components/dashboard/DashboardLayout'
import TenantDetailLayout from '../../../../components/admin/TenantDetailLayout'
import { 
  TenantOverviewTab, 
  TenantEntityTab, 
  ModernDomainsTab,
  TenantCategoriesTab,
  TenantBrandingTab,
  TenantHomepageTab,
  TenantPaymentsTab,
  TenantSettingsTab,
  TenantIdCardsTab,
  TenantPagesTab,
  TenantReportersTab,
  TenantAdsTab,
  TenantEpaperTab,
  TenantDomainSettingsTab,
  TenantEditionsTab
} from '../../../../components/admin/tabs'

function TenantDetailContent() {
  const router = useRouter()
  const { id, tab } = router.query
  
  // Get active tab from URL or default to overview
  const activeTab = Array.isArray(tab) ? tab[0] : (tab || 'overview')
  
  // Render the appropriate tab content based on context
  const renderTabContent = (tenantContext) => {
    switch (activeTab) {
      case 'overview':
        return <TenantOverviewTab tenantContext={tenantContext} />
      case 'entity':
        return <TenantEntityTab tenantContext={tenantContext} />
      case 'domains':
        return <ModernDomainsTab tenantId={id} />
      case 'categories':
        return <TenantCategoriesTab tenantContext={tenantContext} />
      case 'branding':
        return <TenantBrandingTab tenantContext={tenantContext} />
      case 'homepage':
        return <TenantHomepageTab tenantContext={tenantContext} />
      case 'ads':
        return <TenantAdsTab tenantContext={tenantContext} />
      case 'payments':
        return <TenantPaymentsTab tenantContext={tenantContext} />
      case 'settings':
        return <TenantSettingsTab tenantContext={tenantContext} />
      case 'id-cards':
        return <TenantIdCardsTab tenantContext={tenantContext} />
      case 'pages':
        return <TenantPagesTab tenantContext={tenantContext} />
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
  const router = useRouter()
  const { id } = router.query
  
  return (
    <DashboardLayout title={`Tenant ${id || ''}`}>
      <TenantDetailContent />
    </DashboardLayout>
  )
}

