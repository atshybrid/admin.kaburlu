import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import NewsDeskSettingsView from '../../../components/dashboard/newsDesk/settings/NewsDeskSettingsView'

export default function NewsRoomSettingsPage() {
  return (
    <DashboardLayout title="News Room — Settings">
      <NewsDeskSettingsView basePath="/admin/news-room" />
    </DashboardLayout>
  )
}