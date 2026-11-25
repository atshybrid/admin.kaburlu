import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import NewsDeskCreateView from '../../../components/dashboard/newsDesk/NewsDeskCreateView'

/** Alias for create — matches `newsRoomPaths(base).post` used by News Desk UI. */
export default function NewsDeskPostPage() {
  return (
    <DashboardLayout title="Create News Desk intake">
      <NewsDeskCreateView basePath="/admin/news-desk" />
    </DashboardLayout>
  )
}