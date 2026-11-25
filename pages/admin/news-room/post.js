import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import NewsDeskCreateView from '../../../components/dashboard/newsDesk/NewsDeskCreateView'

export default function NewsRoomPostPage() {
  return (
    <DashboardLayout title="News Room — New post">
      <NewsDeskCreateView basePath="/admin/news-room" />
    </DashboardLayout>
  )
}