import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import NewsDeskDashboardView from '../../../components/dashboard/newsDesk/NewsDeskDashboardView'

export default function NewsDeskPage() {
  return (
    <DashboardLayout title="News Desk">
      <NewsDeskDashboardView basePath="/admin/news-desk" />
    </DashboardLayout>
  )
}