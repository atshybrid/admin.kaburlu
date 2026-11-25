import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import NewsDeskDashboardView from '../../../components/dashboard/newsDesk/NewsDeskDashboardView'

export default function NewsRoomPostsPage() {
  return (
    <DashboardLayout title="News Room — Posts">
      <NewsDeskDashboardView basePath="/admin/news-room" />
    </DashboardLayout>
  )
}