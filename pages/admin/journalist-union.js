/**
 * Admin — Journalist Union page
 * Route: /admin/journalist-union
 */
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import JournalistUnionView from '../../components/dashboard/JournalistUnionView'

export default function JournalistUnionPage() {
  return (
    <DashboardLayout title="Journalist Union">
      <JournalistUnionView />
    </DashboardLayout>
  )
}
