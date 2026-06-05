/**
 * Journalist Union — Super Admin (all API modules)
 */

import { useState } from 'react'
import { Button } from '../ui'
import AddMemberModal from './journalist/AddMemberModal'
import JournalistUnionMembers from './journalist/JournalistUnionMembers'
import SettingsTab from './journalist/SettingsTab'
import ComplaintsTab from './journalist/ComplaintsTab'
import CardsTab from './journalist/CardsTab'
import RenewalsTab from './journalist/RenewalsTab'
import UnionAdminsTab from './journalist/UnionAdminsTab'
import CommitteeTab from './journalist/CommitteeTab'
import AnnouncementsTab from './journalist/AnnouncementsTab'

const TABS = [
  { key: 'queue', label: 'Review queue', group: 'members' },
  { key: 'members', label: 'All members', group: 'members' },
  { key: 'cards', label: 'Press cards', group: 'ops' },
  { key: 'renewals', label: 'Renewals', group: 'ops' },
  { key: 'complaints', label: 'Complaints', group: 'ops' },
  { key: 'committee', label: 'Committee', group: 'ops' },
  { key: 'announcements', label: 'Announcements', group: 'ops' },
  { key: 'union-admins', label: 'Union admins', group: 'ops' },
  { key: 'settings', label: 'Settings', group: 'config' },
]

export default function JournalistUnionView() {
  const [activeTab, setActiveTab] = useState('queue')
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const bumpRefresh = () => setRefreshKey((n) => n + 1)

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Journalist Union</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Super Admin — review queue, members, KYC, membership, insurance, press cards, complaints,
            committee, and union settings (live API v1).
          </p>
        </div>
        <Button onClick={() => setAddMemberOpen(true)} className="shrink-0 shadow-sm">
          + Add member
        </Button>
      </header>

      <nav className="flex gap-1 p-1 bg-slate-100 rounded-xl w-full overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="min-h-[320px]">
        {activeTab === 'queue' ? (
          <JournalistUnionMembers variant="queue" refreshToken={refreshKey} />
        ) : null}
        {activeTab === 'members' ? (
          <JournalistUnionMembers variant="directory" refreshToken={refreshKey} />
        ) : null}
        {activeTab === 'cards' ? <CardsTab refreshToken={refreshKey} /> : null}
        {activeTab === 'renewals' ? <RenewalsTab /> : null}
        {activeTab === 'complaints' ? <ComplaintsTab /> : null}
        {activeTab === 'committee' ? <CommitteeTab /> : null}
        {activeTab === 'announcements' ? <AnnouncementsTab /> : null}
        {activeTab === 'union-admins' ? <UnionAdminsTab /> : null}
        {activeTab === 'settings' ? <SettingsTab /> : null}
      </div>

      <AddMemberModal
        isOpen={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        onCreated={() => {
          bumpRefresh()
          setActiveTab('queue')
        }}
      />
    </div>
  )
}
