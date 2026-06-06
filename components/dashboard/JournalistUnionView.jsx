/**
 * Journalist Union — Super Admin
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
import DjfwWorkflowBanner from './journalist/DjfwWorkflowBanner'
import UnionSurveysTab from './journalist/UnionSurveysTab'
import InsuranceMembersTab from './journalist/InsuranceMembersTab'
import ElectionsTab from './journalist/ElectionsTab'

const TABS = [
  { key: 'members', label: 'Members' },
  { key: 'surveys', label: 'Surveys' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'elections', label: 'Elections' },
  { key: 'committee', label: 'Committee' },
  { key: 'cards', label: 'Press cards' },
  { key: 'settings', label: 'Settings' },
]

const MORE = [
  { key: 'renewals', label: 'Renewals' },
  { key: 'complaints', label: 'Complaints' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'union-admins', label: 'Union admins' },
]

export default function JournalistUnionView() {
  const [activeTab, setActiveTab] = useState('members')
  const [memberView, setMemberView] = useState('pending')
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const bumpRefresh = () => setRefreshKey((n) => n + 1)
  const isMore = MORE.some((t) => t.key === activeTab)

  const handleWorkflowGo = (key) => {
    if (key === 'queue') {
      setActiveTab('members')
      setMemberView('pending')
      return
    }
    setActiveTab(key)
  }

  return (
    <div className="space-y-5 max-w-[1440px]">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Super Admin
          </p>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight mt-1">
            Journalist Union
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Approve members, KYC documents, and generate union ID cards from one table.
          </p>
        </div>
        <Button onClick={() => setAddMemberOpen(true)} size="sm" className="shrink-0">
          Add member
        </Button>
      </header>

      <DjfwWorkflowBanner
        activeTab={activeTab === 'members' && memberView === 'pending' ? 'queue' : activeTab}
        onGoTo={handleWorkflowGo}
      />

      <nav className="flex flex-wrap items-center gap-6 border-b border-slate-200">
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
        <select
          value={isMore ? activeTab : ''}
          onChange={(e) => e.target.value && setActiveTab(e.target.value)}
          className={`pb-3 text-sm font-medium border-b-2 -mb-px bg-transparent cursor-pointer ${
            isMore ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500'
          }`}
        >
          <option value="">{isMore ? MORE.find((t) => t.key === activeTab)?.label : 'More'}</option>
          {MORE.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </nav>

      {activeTab === 'members' ? (
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {[
            { id: 'pending', label: 'Pending queue' },
            { id: 'all', label: 'All members' },
          ].map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setMemberView(v.id)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md ${
                memberView === v.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="min-h-[320px]">
        {activeTab === 'members' ? (
          <JournalistUnionMembers
            key={memberView}
            variant={memberView === 'pending' ? 'queue' : 'directory'}
            refreshToken={refreshKey}
          />
        ) : null}
        {activeTab === 'surveys' ? <UnionSurveysTab /> : null}
        {activeTab === 'insurance' ? <InsuranceMembersTab refreshToken={refreshKey} /> : null}
        {activeTab === 'elections' ? <ElectionsTab /> : null}
        {activeTab === 'committee' ? <CommitteeTab /> : null}
        {activeTab === 'cards' ? <CardsTab refreshToken={refreshKey} /> : null}
        {activeTab === 'renewals' ? <RenewalsTab /> : null}
        {activeTab === 'complaints' ? <ComplaintsTab /> : null}
        {activeTab === 'announcements' ? <AnnouncementsTab /> : null}
        {activeTab === 'union-admins' ? <UnionAdminsTab /> : null}
        {activeTab === 'settings' ? <SettingsTab /> : null}
      </div>

      <AddMemberModal
        isOpen={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        onCreated={() => {
          bumpRefresh()
          setActiveTab('members')
          setMemberView('pending')
        }}
      />
    </div>
  )
}
