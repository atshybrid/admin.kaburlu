import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ReportersMapView from '../../components/dashboard/reportersMap/ReportersMapView'

export default function ReportersMapPage() {
  return (
    <DashboardLayout title="Reporter Coverage Map">
      <ReportersMapView />
    </DashboardLayout>
  )
}