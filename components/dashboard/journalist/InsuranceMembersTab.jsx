/**
 * Insurance — pending applications queue + member directory
 */

import { useState, useEffect, useCallback } from 'react'
import { insuranceApplicationApi } from '../../../lib/api/services/insuranceApplicationApi'
import { fetchMemberDirectory } from '../../../lib/journalist/fetchMemberLists'
import { formatJournalistApiError } from '../../../lib/journalist/memberErrors'
import { applicationStatusMeta } from '../../../lib/journalist/insuranceApplicationDisplay'
import {
  memberName,
  memberMobile,
  pressIdDisplay,
} from '../../../lib/journalist/memberDisplay'
import { useUnionSettings } from './useUnionSettings'
import MemberReviewPanel from './MemberReviewPanel'
import { Button, Input, SlidePanel, Spinner, StatusBadge } from '../../ui'

const PAGE_SIZE = 20

const TYPE_FILTERS = [
  { id: '', label: 'All types' },
  { id: 'ACCIDENTAL', label: 'Accidental' },
  { id: 'HEALTH', label: 'Health' },
]

function applicationToMemberFallback(item) {
  if (item?.member && typeof item.member === 'object') return item.member
  return {
    id: item.profileId || item.memberId,
    fullName: item.fullName,
    mobileNumber: item.mobile || item.mobileNumber,
  }
}

function ApplicationRow({ item, onOpen }) {
  const meta = applicationStatusMeta(item.status || 'SUBMITTED')
  const name = item.fullName || memberName(item.member || item) || item.memberName || '—'
  const mobile = item.mobile || memberMobile(item.member || item)

  return (
    <tr className="hover:bg-slate-50/70 border-t border-slate-100">
      <td className="px-4 py-3">
        <p className="font-medium text-sm text-slate-900">{name}</p>
        <p className="text-xs text-slate-500 tabular-nums">{mobile}</p>
        {pressIdDisplay(item.member || item) ? (
          <p className="text-[11px] text-brand mt-0.5">{pressIdDisplay(item.member || item)}</p>
        ) : null}
      </td>
      <td className="px-3 py-3 text-xs font-medium text-slate-700">
        {item.type === 'HEALTH' ? 'Health' : 'Accidental'}
      </td>
      <td className="px-3 py-3">
        <StatusBadge label={meta.label} color={meta.color} />
      </td>
      <td className="px-3 py-3 text-xs text-slate-500">
        {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('en-IN') : '—'}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={() =>
            onOpen(
              item.profileId || item.memberId || item.member?.id,
              applicationToMemberFallback(item)
            )
          }
          className="text-xs font-medium text-slate-900 underline underline-offset-2 hover:text-brand"
        >
          Review
        </button>
      </td>
    </tr>
  )
}

export default function InsuranceMembersTab({ refreshToken = 0 }) {
  const { unionName } = useUnionSettings()

  const [view, setView] = useState('applications')
  const [applications, setApplications] = useState([])
  const [appLoading, setAppLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [selectedId, setSelectedId] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const loadApplications = useCallback(async () => {
    setAppLoading(true)
    try {
      const params = { status: 'SUBMITTED', page: 1, limit: 50 }
      if (typeFilter) params.type = typeFilter
      const raw = await insuranceApplicationApi.listPending(params)
      const items = raw?.items || raw?.data?.items || raw?.data || []
      setApplications(Array.isArray(items) ? items : [])
    } catch (err) {
      setApplications([])
      if (err?.status !== 404) setError(formatJournalistApiError(err, 'Failed to load applications'))
    } finally {
      setAppLoading(false)
    }
  }, [typeFilter])

  const loadMembers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const parsed = await fetchMemberDirectory({
        unionName,
        page,
        limit: PAGE_SIZE,
        q: search,
        membershipStatus: 'APPROVED',
      })
      setRows(parsed.items)
      setTotalPages(parsed.totalPages)
    } catch (err) {
      setError(formatJournalistApiError(err, 'Failed to load members'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [unionName, page, search])

  useEffect(() => {
    loadApplications()
  }, [loadApplications, refreshToken])

  useEffect(() => {
    if (view === 'members') loadMembers()
  }, [view, loadMembers, refreshToken])

  const openMember = (id, row = null) => {
    if (!id) return
    setSelectedId(id)
    setSelectedMember(row)
    setPanelOpen(true)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-4 py-4">
        <p className="text-sm text-slate-700">
          <strong>Insurance flow:</strong> KYC docs approved → member submits application form →
          you approve form → assign policy → upload insurance card.
        </p>
      </div>

      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        {[
          { id: 'applications', label: `Pending forms (${applications.length})` },
          { id: 'members', label: 'All members' },
        ].map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md ${
              view === v.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'applications' ? (
        <>
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.id || 'all'}
                type="button"
                onClick={() => setTypeFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  typeFilter === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
            <Button variant="ghost" size="sm" onClick={loadApplications} loading={appLoading}>
              Refresh
            </Button>
          </div>

          {appLoading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : applications.length === 0 ? (
            <p className="text-center text-slate-500 py-12 border border-dashed rounded-xl">
              No insurance applications awaiting review
            </p>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-semibold">Member</th>
                    <th className="px-3 py-3 font-semibold">Type</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Submitted</th>
                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((item) => (
                    <ApplicationRow
                      key={item.id || `${item.profileId}-${item.type}`}
                      item={item}
                      onOpen={openMember}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          <form
            className="flex gap-2 max-w-md"
            onSubmit={(e) => {
              e.preventDefault()
              setSearch(searchInput)
              setPage(1)
            }}
          >
            <Input
              placeholder="Search name, mobile, press ID…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button type="submit" variant="secondary" size="sm">Search</Button>
          </form>

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : null}

          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : rows.length === 0 ? (
            <p className="text-center text-slate-500 py-12 border border-dashed rounded-xl">No members found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => openMember(row.id, row)}
                  className="text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <p className="font-medium text-slate-900">{memberName(row)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{memberMobile(row)}</p>
                  <div className="flex gap-2 mt-2">
                    <StatusBadge
                      label={row?.insurance?.accidental?.status === 'ACTIVE' ? 'Acc active' : 'Acc —'}
                      color={row?.insurance?.accidental?.status === 'ACTIVE' ? 'green' : 'gray'}
                    />
                    <StatusBadge
                      label={row?.insurance?.health?.status === 'ACTIVE' ? 'Health active' : 'Health —'}
                      color={row?.insurance?.health?.status === 'ACTIVE' ? 'green' : 'gray'}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex justify-center gap-3">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-slate-600 self-center">{page} / {totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}

      <SlidePanel
        isOpen={panelOpen}
        onClose={() => {
          setPanelOpen(false)
          setSelectedId(null)
          setSelectedMember(null)
        }}
        title="Insurance review"
        width="xl"
      >
        {selectedId ? (
          <MemberReviewPanel
            profileId={selectedId}
            initialMember={selectedMember}
            onUpdated={() => { loadApplications(); loadMembers() }}
            initialSection="insurance"
          />
        ) : null}
      </SlidePanel>
    </div>
  )
}
