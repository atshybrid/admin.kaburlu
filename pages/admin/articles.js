/**
 * Articles Management Page
 * /admin/articles route
 * Accessible to Super Admins, Tenant Admins, and Reporters
 * Uses role-based layouts for different user types
 */
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ArticlesListView from '../../components/dashboard/ArticlesListView'

export default function ArticlesPage() {
  return (
    <DashboardLayout>
      <ArticlesListView />
    </DashboardLayout>
  )
}
