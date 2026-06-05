/**
 * Super Admin — Indian Political Parties
 * Route: /admin/political-parties
 */
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import PoliticalPartiesView from '../../components/dashboard/politicalParties/PoliticalPartiesView'

export default function PoliticalPartiesPage() {
  return (
    <DashboardLayout title="Political Parties">
      <PoliticalPartiesView />
    </DashboardLayout>
  )
}
