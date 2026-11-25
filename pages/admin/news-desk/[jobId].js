import { useRouter } from 'next/router'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import NewsDeskDetailView from '../../../components/dashboard/newsDesk/NewsDeskDetailView'

export default function NewsDeskDetailPage() {
  const router = useRouter()
  const jobId = typeof router.query.jobId === 'string' ? router.query.jobId : ''

  return (
    <DashboardLayout title="News Desk review">
      {router.isReady && jobId ? (
        <NewsDeskDetailView jobId={jobId} basePath="/admin/news-desk" />
      ) : null}
    </DashboardLayout>
  )
}