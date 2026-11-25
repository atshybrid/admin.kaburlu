import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import newsDeskApi, { formatNewsDeskError } from '../../../../lib/api/services/newsDeskApi'
import { StatCard, Spinner, toast } from '../../../ui'
import { IconBarChart, IconClock, IconFileText, IconAlertCircle } from '../../../ui/icons'
import NewsDeskPublishedList from './NewsDeskPublishedList'
import NewsDeskRecentIntakesList from './NewsDeskRecentIntakesList'
import NewsDeskSection from '../NewsDeskSection'

export default function NewsDeskAnalyticsPanel() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [recentIntakes, setRecentIntakes] = useState([])
  const [published, setPublished] = useState([])
  const [listsLoading, setListsLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setListsLoading(true)
    try {
      const analyticsRes = await newsDeskApi.getAnalytics()
      setData(analyticsRes?.analytics || analyticsRes)
      setLoading(false)

      const [jobsRes, pubRes] = await Promise.allSettled([
        newsDeskApi.listJobs({ page: 1, pageSize: 10, sort: 'createdAt', order: 'desc' }),
        newsDeskApi.listPublishedArticles({ limit: 15 }),
      ])
      if (jobsRes.status === 'fulfilled') setRecentIntakes(jobsRes.value?.items || [])
      else toast.error(formatNewsDeskError(jobsRes.reason))
      if (pubRes.status === 'fulfilled') setPublished(pubRes.value?.items || [])
    } catch (error) {
      toast.error(formatNewsDeskError(error))
      setData(null)
    } finally {
      setLoading(false)
      setListsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  if (!data) {
    return (
      <p className="text-sm text-slate-600">Analytics unavailable. Confirm News Desk admin routes are deployed.</p>
    )
  }

  const ext = data.extraction || {}
  const webCount = data.publishedWebArticleRows ?? data.publishedWebArticles ?? null

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500">
        Metrics updated {data.generatedAt ? new Date(data.generatedAt).toLocaleString() : '—'}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pipeline jobs" value={data.pipelineTotal ?? '—'} icon={<IconFileText className="w-5 h-5" />} />
        <StatCard title="Last 7 days intake" value={data.jobsCreatedLast7Days ?? '—'} icon={<IconClock className="w-5 h-5" />} />
        <StatCard title="Facts succeeded" value={ext.factsSucceeded ?? '—'} icon={<IconBarChart className="w-5 h-5" />} />
        <StatCard title="Extraction issues" value={ext.queueDead ?? '—'} icon={<IconAlertCircle className="w-5 h-5" />} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Published syndication jobs" value={data.publishedSyndicationJobs ?? '—'} icon={<IconFileText className="w-5 h-5" />} />
        <StatCard
          title="Tenant web publishes (desk)"
          value={webCount ?? '—'}
          description="Rows with webArticleId in syndication"
          icon={<IconBarChart className="w-5 h-5" />}
        />
      </div>

      {data.pipelineByStatus ? (
        <NewsDeskSection title="Pipeline by status" subtitle="Syndication job counts">
          <dl className="grid gap-2 sm:grid-cols-2">
            {Object.entries(data.pipelineByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between text-sm border-b border-slate-100 py-1.5">
                <dt className="text-slate-600">{status}</dt>
                <dd className="font-medium text-slate-900 tabular-nums">{count}</dd>
              </div>
            ))}
          </dl>
        </NewsDeskSection>
      ) : null}

      <NewsDeskSection
        title="Recent intakes"
        subtitle="Latest desk submissions"
        action={
          <Link href="/admin/news-desk" className="text-xs font-medium text-brand hover:underline">
            View all →
          </Link>
        }
        unpadded
      >
        <NewsDeskRecentIntakesList items={recentIntakes} loading={listsLoading} />
      </NewsDeskSection>

      <NewsDeskSection title="Published to tenants (web)" subtitle="Articles live on publisher sites" unpadded>
        <NewsDeskPublishedList
          items={published}
          loading={listsLoading}
          emptyHint="No web publishes linked yet — publish from legacy syndication or desk publish flow."
        />
      </NewsDeskSection>

      <button type="button" onClick={load} className="text-sm text-brand font-medium hover:underline">
        Refresh metrics &amp; lists
      </button>
    </div>
  )
}