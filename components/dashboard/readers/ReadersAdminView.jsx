/**
 * Naa Kaburlu Readers — Super Admin
 */

import { useState } from 'react'
import { useLayout } from '../DashboardLayout'
import { hasRole } from '../../../utils/roleUtils'
import { Button } from '../../ui'
import CreateReaderModal from './CreateReaderModal'
import PendingReadersTab from './PendingReadersTab'
import AllReadersTab from './AllReadersTab'
import FeedsConfigTab from './FeedsConfigTab'

const TABS = [
  { key: 'pending', label: 'Pending approvals' },
  { key: 'all', label: 'All readers' },
  { key: 'feeds', label: 'Feeds config' },
]

export default function ReadersAdminView() {
  const { user } = useLayout()
  const [activeTab, setActiveTab] = useState('pending')
  const [createOpen, setCreateOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const bump = () => setRefreshKey((n) => n + 1)

  if (!hasRole(user, ['SUPER_ADMIN', 'SUPERADMIN'])) {
    return (
      <div className="max-w-lg mx-auto mt-16 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-rose-900">Super admin only</h2>
        <p className="text-sm text-rose-700 mt-2">
          Reader management is restricted to SUPER_ADMIN accounts.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-[1440px]">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Super Admin · Naa Kaburlu
          </p>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight mt-1">
            Readers
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Add readers, citizen reporters, government officials, and public figures. Approve or
            reject verified personas and upgrade readers to citizen reporters.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="shrink-0">
          Add reader
        </Button>
      </header>

      <nav className="flex flex-wrap gap-6 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'pending' ? (
        <PendingReadersTab refreshKey={refreshKey} onChanged={bump} />
      ) : null}
      {activeTab === 'all' ? (
        <AllReadersTab refreshKey={refreshKey} onChanged={bump} />
      ) : null}
      {activeTab === 'feeds' ? <FeedsConfigTab refreshKey={refreshKey} /> : null}

      <CreateReaderModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          bump()
          setActiveTab('pending')
        }}
      />
    </div>
  )
}
