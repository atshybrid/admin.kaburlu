/**
 * News Banners — Super Admin
 * Route: /admin/news-banners
 */
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import NewsBannersView from '../../components/dashboard/newsBanners/NewsBannersView'

export default function NewsBannersPage() {
  return (
    <DashboardLayout title="News Banners">
      <NewsBannersView />
    </DashboardLayout>
  )
}
