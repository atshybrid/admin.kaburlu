import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import NewsDeskSettingsView from '../../../components/dashboard/newsDesk/settings/NewsDeskSettingsView'

export default function NewsDeskSettingsPage() {
  return (
    <DashboardLayout title="News Desk settings">
      <NewsDeskSettingsView basePath="/admin/news-desk" />
    </DashboardLayout>
  )
}