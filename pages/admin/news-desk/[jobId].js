import { useEffect } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import NewsDeskDetailView from '../../../components/dashboard/newsDesk/NewsDeskDetailView'

const RESERVED_SLUGS = new Set(['post', 'create', 'settings'])

export default function NewsDeskDetailPage() {
  const router = useRouter()
  const jobId = typeof router.query.jobId === 'string' ? router.query.jobId : ''

  useEffect(() => {
    if (!router.isReady || !jobId) return
    if (RESERVED_SLUGS.has(jobId)) {
      router.replace(`/admin/news-desk/${jobId}`)
    }
  }, [router, jobId])

  if (!router.isReady || !jobId || RESERVED_SLUGS.has(jobId)) {
    return (
      <DashboardLayout title="News Desk review">
        <div className="flex justify-center py-16 text-sm text-slate-500">Loading…</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="News Desk review">
      <NewsDeskDetailView jobId={jobId} basePath="/admin/news-desk" />
    </DashboardLayout>
  )
}