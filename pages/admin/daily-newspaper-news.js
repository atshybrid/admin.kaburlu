/**
 * Get Daily Newspaper News — tenant feed + copy for print desk
 * Route: /admin/daily-newspaper-news
 */
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DailyNewspaperNewsView from '../../components/dashboard/dailyNewspaperNews/DailyNewspaperNewsView'

export default function DailyNewspaperNewsPage() {
  return (
    <DashboardLayout title="Daily Newspaper News">
      <DailyNewspaperNewsView />
    </DashboardLayout>
  )
}
