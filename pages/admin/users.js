/**
 * Admin Users Page
 * /admin/users route
 */
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import UsersView from '../../components/dashboard/UsersView'

export default function AdminUsers() {
  return (
    <DashboardLayout title="Users">
      <UsersView />
    </DashboardLayout>
  )
}
