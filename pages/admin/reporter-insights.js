/**
 * Reporter Insights — print split, web views, monthly work report
 * Route: /admin/reporter-insights
 */
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ReporterInsightsView from '../../components/dashboard/reporterInsights/ReporterInsightsView'

export default function ReporterInsightsPage() {
  return (
    <DashboardLayout title="Reporter Insights">
      <ReporterInsightsView />
    </DashboardLayout>
  )
}
