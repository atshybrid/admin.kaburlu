/**
 * Dashboard Page - Now using the modernized DashboardPro layout
 */
import DashboardPro from '../components/dashboard/DashboardPro'

export default function Dashboard({ initialTab }) {
  return <DashboardPro initialTab={initialTab} />
}
