import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import NewsDeskDetailView from '../../../components/dashboard/newsDesk/NewsDeskDetailView'
import { useRouter } from 'next/router'

export default function NewsRoomDetailPage() {
  const router = useRouter()
  const jobId = router.query.jobId
  return (
    <DashboardLayout title="News Room — Review">
      <NewsDeskDetailView jobId={jobId} basePath="/admin/news-room" />
    </DashboardLayout>
  )
}