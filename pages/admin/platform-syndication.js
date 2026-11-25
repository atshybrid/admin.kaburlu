/**
 * Legacy platform syndication — desk users use News Desk (new API flow) by default.
 * Append ?legacy=1 to open the old multi-tenant publish workflow.
 */
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import SyndicationView from '../../components/dashboard/syndication/SyndicationView'
import { useLayout } from '../../components/dashboard/DashboardLayout'
import { canAccessNewsDesk } from '../../lib/syndication/platformRoles'
import { Spinner } from '../../components/ui'

function PlatformSyndicationInner() {
  const router = useRouter()
  const { user } = useLayout()
  const legacy = router.query?.legacy === '1'

  useEffect(() => {
    if (!router.isReady || legacy) return
    if (canAccessNewsDesk(user)) {
      router.replace('/admin/news-desk')
    }
  }, [router, router.isReady, legacy, user])

  if (!router.isReady) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!legacy && canAccessNewsDesk(user)) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  const jobId = typeof router.query?.jobId === 'string' ? router.query.jobId : ''
  return <SyndicationView initialJobId={jobId} />
}

export default function PlatformSyndicationPage() {
  return (
    <DashboardLayout title="Platform Syndication">
      <PlatformSyndicationInner />
    </DashboardLayout>
  )
}