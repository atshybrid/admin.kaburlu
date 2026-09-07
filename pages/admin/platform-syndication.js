/**
 * Platform Syndication desk
 * Route: /admin/platform-syndication
 */
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import SyndicationView from '../../components/dashboard/syndication/SyndicationView'

export default function PlatformSyndicationPage() {
  return (
    <DashboardLayout title="Platform Syndication">
      <SyndicationView />
    </DashboardLayout>
  )
}
