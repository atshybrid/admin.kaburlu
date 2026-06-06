/**
 * Journalist Union — members list + professional table
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchPendingQueue, fetchMemberDirectory } from '../../../lib/journalist/fetchMemberLists'
import { formatJournalistApiError } from '../../../lib/journalist/memberErrors'
import { memberName, membershipPending, hasPendingDocuments } from '../../../lib/journalist/memberDisplay'
import { useUnionSettings } from './useUnionSettings'
import MemberReviewPanel from './MemberReviewPanel'
import MemberApprovalTable from './MemberApprovalTable'
import { Button, Input, SlidePanel, Spinner } from '../../ui'

const PAGE_SIZE = 50
const QUEUE_FETCH_LIMIT = 100

const QUEUE_FILTERS = [
  { id: 'all', label: 'All', status: 'all_pending' },
  { id: 'membership', label: 'Membership', status: 'pending_membership' },
  { id: 'documents', label: 'Documents', status: 'pending_documents' },
]

function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            value === opt.id
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {opt.label}
          {opt.count != null ? (
            <span className="ml-1 text-slate-400 tabular-nums">{opt.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

export default function JournalistUnionMembers({ variant = 'queue', refreshToken = 0 }) {
  const isQueue = variant === 'queue'
  const { unionName, settingsReady } = useUnionSettings()

  const [allRows, setAllRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [apiTotal, setApiTotal] = useState(0)

  const [queueFilter, setQueueFilter] = useState('all')
  const [membershipFilter, setMembershipFilter] = useState('ALL')
  const [surveyFilter, setSurveyFilter] = useState('ALL')
  const [insuranceAccFilter, setInsuranceAccFilter] = useState('ALL')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [selectedId, setSelectedId] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)

  // Reset pagination when switching queue ↔ directory
  useEffect(() => {
    setPage(1)
    setQueueFilter('all')
  }, [variant])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const queueStatus = QUEUE_FILTERS.find((f) => f.id === queueFilter)?.status || 'all_pending'
      const parsed = isQueue
        ? await fetchPendingQueue({
            unionName,
            page: 1,
            limit: QUEUE_FETCH_LIMIT,
            q: search,
            status: queueStatus,
          })
        : await fetchMemberDirectory({
            unionName,
            page,
            limit: PAGE_SIZE,
            q: search,
            membershipStatus: membershipFilter,
            surveyStatus: surveyFilter,
            insuranceAccidental: insuranceAccFilter,
          })

      setAllRows(parsed.items)
      setApiTotal(parsed.total)
      setTotalPages(isQueue ? 1 : parsed.totalPages)
    } catch (err) {
      setError(formatJournalistApiError(err, 'Failed to load members'))
      setAllRows([])
      setApiTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [isQueue, page, unionName, search, queueFilter, membershipFilter, surveyFilter, insuranceAccFilter])

  useEffect(() => {
    load()
  }, [load, refreshToken])

  const filterCounts = useMemo(
    () => ({
      all: allRows.length,
      membership: allRows.filter((r) => membershipPending(r)).length,
      documents: allRows.filter((r) => hasPendingDocuments(r)).length,
    }),
    [allRows]
  )

  const openReview = (row) => {
    if (!row?.id) return
    setSelectedId(row.id)
    setPanelOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            {isQueue ? 'Approval queue' : 'Member directory'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {unionName}
            {!settingsReady ? ' · loading…' : null}
            <span className="mx-1.5 text-slate-300">|</span>
            <span className="tabular-nums">{apiTotal}</span>{' '}
            {search ? `matching "${search}"` : 'total'}
            {!isQueue && totalPages > 1 ? (
              <span>
                {' '}
                · page {page}/{totalPages}
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setSearch(searchInput)
              if (!isQueue) setPage(1)
            }}
          >
            <Input
              placeholder="Search name, mobile…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-white h-9 text-sm w-48 sm:w-56"
            />
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>
          <Button variant="ghost" size="sm" onClick={load} loading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      {isQueue ? (
        <Segmented
          value={queueFilter}
          onChange={setQueueFilter}
          options={QUEUE_FILTERS.map((f) => ({
            ...f,
            count: filterCounts[f.id],
          }))}
        />
      ) : (
        <div className="space-y-2">
          <Segmented
            value={membershipFilter}
            onChange={(id) => {
              setMembershipFilter(id)
              setPage(1)
            }}
            options={[
              { id: 'ALL', label: 'All' },
              { id: 'PENDING', label: 'Pending' },
              { id: 'APPROVED', label: 'Approved' },
            ]}
          />
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            {showAdvanced ? 'Hide' : 'Show'} survey & insurance filters
          </button>
          {showAdvanced ? (
            <div className="flex flex-wrap gap-3 pt-1">
              <select
                value={surveyFilter}
                onChange={(e) => {
                  setSurveyFilter(e.target.value)
                  setPage(1)
                }}
                className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700"
              >
                <option value="ALL">All surveys</option>
                <option value="PENDING">Survey review pending</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select
                value={insuranceAccFilter}
                onChange={(e) => {
                  setInsuranceAccFilter(e.target.value)
                  setPage(1)
                }}
                className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700"
              >
                <option value="ALL">All insurance</option>
                <option value="LOCKED_SURVEY_REQUIRED">Locked</option>
                <option value="UNLOCKED_CAN_APPLY">Ready</option>
                <option value="ACTIVE">Active</option>
              </select>
            </div>
          ) : null}
        </div>
      )}

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-col items-center py-24">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-slate-500">Loading members…</p>
        </div>
      ) : allRows.length === 0 ? (
        <div className="text-center py-20 rounded-lg border border-dashed border-slate-200">
          <p className="text-slate-600 font-medium">No members found</p>
          <p className="text-sm text-slate-400 mt-1">Try a different filter or search term.</p>
        </div>
      ) : (
        <MemberApprovalTable
          rows={allRows}
          showDirectoryCols={!isQueue}
          onRefresh={load}
          onOpenReview={openReview}
        />
      )}

      {!isQueue && totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3 text-sm text-slate-600">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}

      <SlidePanel
        isOpen={panelOpen}
        onClose={() => {
          setPanelOpen(false)
          setSelectedId(null)
        }}
        title="Member profile"
        subtitle={memberName(allRows.find((r) => r.id === selectedId) || {})}
        width="xl"
      >
        {selectedId ? <MemberReviewPanel profileId={selectedId} onUpdated={load} /> : null}
      </SlidePanel>
    </div>
  )
}
