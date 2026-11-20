import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import NewsDeskCreateView from '../../../components/dashboard/newsDesk/NewsDeskCreateView'

export default function NewsDeskCreatePage() {
  return (
    <DashboardLayout title="Create News Desk intake">
      <NewsDeskCreateView />
    </DashboardLayout>
  )
}