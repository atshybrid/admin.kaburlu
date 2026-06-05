/**
 * Political / Union Surveys — Super Admin
 * Route: /admin/union-surveys
 */
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import UnionSurveysView from '../../components/dashboard/unionSurveys/UnionSurveysView'

export default function UnionSurveysPage() {
  return (
    <DashboardLayout title="Political Surveys">
      <UnionSurveysView />
    </DashboardLayout>
  )
}
