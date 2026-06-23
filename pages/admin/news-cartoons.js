/**
 * Short News Cartoons — Platform editorial
 * Route: /admin/news-cartoons
 */
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import NewsCartoonsView from '../../components/dashboard/newsCartoons/NewsCartoonsView'

export default function NewsCartoonsPage() {
  return (
    <DashboardLayout title="News Cartoons">
      <NewsCartoonsView />
    </DashboardLayout>
  )
}
