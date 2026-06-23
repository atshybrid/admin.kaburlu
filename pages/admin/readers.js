/**
 * Super Admin — Naa Kaburlu Readers
 * Route: /admin/readers
 */
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ReadersAdminView from '../../components/dashboard/readers/ReadersAdminView'

export default function ReadersAdminPage() {
  return (
    <DashboardLayout title="Readers">
      <ReadersAdminView />
    </DashboardLayout>
  )
}
