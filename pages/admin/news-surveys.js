/**
 * News Surveys — Super Admin
 * Route: /admin/news-surveys
 */
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import NewsSurveysView from '../../components/dashboard/newsSurveys/NewsSurveysView'

export default function NewsSurveysPage() {
  return (
    <DashboardLayout title="News Surveys">
      <NewsSurveysView />
    </DashboardLayout>
  )
}
