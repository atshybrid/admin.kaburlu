/**
 * Journalist Union View — Main Component
 * Combines all union management tabs in a single page
 */

import { useState } from 'react'
import ApplicationsTab   from './journalist/ApplicationsTab'
import MembersTab        from './journalist/MembersTab'
import CardsTab          from './journalist/CardsTab'
import RenewalsTab       from './journalist/RenewalsTab'
import KycTab            from './journalist/KycTab'
import ComplaintsTab     from './journalist/ComplaintsTab'
import AnnouncementsTab  from './journalist/AnnouncementsTab'
import InsuranceTab      from './journalist/InsuranceTab'
import CommitteeTab      from './journalist/CommitteeTab'
import SettingsTab       from './journalist/SettingsTab'

const TABS = [
  { key: 'applications',  label: 'Applications',  emoji: '📋' },
  { key: 'members',       label: 'Members',       emoji: '👥' },
  { key: 'cards',         label: 'Press Cards',   emoji: '🪪' },
  { key: 'renewals',      label: 'Renewals',      emoji: '🔄' },
  { key: 'kyc',           label: 'KYC',           emoji: '🔍' },
  { key: 'complaints',    label: 'Complaints',    emoji: '⚠️' },
  { key: 'announcements', label: 'Announcements', emoji: '📢' },
  { key: 'insurance',     label: 'Insurance',     emoji: '🛡️' },
  { key: 'committee',     label: 'Committee',     emoji: '🏛️' },
  { key: 'settings',      label: 'Settings',      emoji: '⚙️' },
]

const TAB_CONTENT = {
  applications:  <ApplicationsTab />,
  members:       <MembersTab />,
  cards:         <CardsTab />,
  renewals:      <RenewalsTab />,
  kyc:           <KycTab />,
  complaints:    <ComplaintsTab />,
  announcements: <AnnouncementsTab />,
  insurance:     <InsuranceTab />,
  committee:     <CommitteeTab />,
  settings:      <SettingsTab />,
}

export default function JournalistUnionView() {
  const [activeTab, setActiveTab] = useState('applications')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Journalist Union</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage applications, press cards, KYC, complaints, insurance and committee
        </p>
      </div>

      {/* Tab bar — horizontally scrollable on mobile */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-1.5 py-3 px-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'text-brand after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand after:rounded-full'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {TAB_CONTENT[activeTab]}
      </div>
    </div>
  )
}
