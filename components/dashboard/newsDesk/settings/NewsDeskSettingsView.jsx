import { useState } from 'react'
import Link from 'next/link'
import { useLayout } from '../../DashboardLayout'
import NewsDeskAccessGate from '../NewsDeskAccessGate'
import NewsDeskAnalyticsPanel from './NewsDeskAnalyticsPanel'
import NewsDeskStaffPanel from './NewsDeskStaffPanel'
import NewsDeskRoutingRulesPanel from './NewsDeskRoutingRulesPanel'
import NewsDeskPageShell from '../NewsDeskPageShell'
import NewsDeskPageHeader from '../NewsDeskPageHeader'
import NewsDeskSettingsTabs from '../NewsDeskSettingsTabs'
import { Button } from '../../../ui'
import { canManageNewsDeskStaff } from '../../../../lib/newsDesk/adminRoles'
import { DEFAULT_NEWS_ROOM_BASE, newsRoomPaths } from '../../../../lib/newsDesk/paths'

const TABS = [
  { id: 'analytics', label: 'Analytics' },
  { id: 'team', label: 'Team & access', adminOnly: true },
  { id: 'routing', label: 'Routing rules', adminOnly: true },
]

export default function NewsDeskSettingsView({ basePath = DEFAULT_NEWS_ROOM_BASE }) {
  const paths = newsRoomPaths(basePath)
  const { user } = useLayout()
  const isAdmin = canManageNewsDeskStaff(user)
  const [tab, setTab] = useState('analytics')

  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin)

  return (
    <NewsDeskAccessGate user={user}>
      <NewsDeskPageShell>
        <NewsDeskPageHeader
          backHref={paths.posts}
          backLabel="All posts"
          title="Settings & analytics"
          description="Operator scope, syndication access, routing rules, and pipeline metrics."
          actions={
            <Link href={paths.post}>
              <Button type="button" size="sm">
                New post
              </Button>
            </Link>
          }
        />

        <NewsDeskSettingsTabs tabs={visibleTabs} activeId={tab} onChange={setTab} />

        <div className="pt-2">
          {tab === 'analytics' && <NewsDeskAnalyticsPanel />}
          {tab === 'team' && isAdmin && <NewsDeskStaffPanel />}
          {tab === 'routing' && isAdmin && <NewsDeskRoutingRulesPanel />}
        </div>
      </NewsDeskPageShell>
    </NewsDeskAccessGate>
  )
}