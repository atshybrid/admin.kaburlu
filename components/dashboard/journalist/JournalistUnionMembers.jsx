/**
 * Journalist Union — members UI (API-driven)
 * Queue: GET /journalist/admin/members/pending
 * Directory: GET /journalist/admin/members
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchPendingQueue, fetchMemberDirectory } from '../../../lib/journalist/fetchMemberLists'
import { formatJournalistApiError } from '../../../lib/journalist/memberErrors'
import {
  memberName,
  memberMobile,
  memberDesignation,
  memberNewspaper,
  memberLocation,
  memberTypeLabel,
  membershipStatusKey,
  documentsSummary,
  pressIdDisplay,
  formatDate,
  membershipPending,
  hasPendingDocuments,
  docUrl,
  surveySummary,
  insuranceStatus,
} from '../../../lib/journalist/memberDisplay'
import { useUnionSettings } from './useUnionSettings'
import MemberReviewPanel from './MemberReviewPanel'
import { Button, Input, SlidePanel, StatusBadge, Spinner } from '../../ui'

const PAGE_SIZE = 20
const QUEUE_FETCH_LIMIT = 100

const QUEUE_FILTERS = [
  { id: 'all', label: 'All pending', status: 'all_pending' },
  { id: 'membership', label: 'Membership', status: 'pending_membership' },
  { id: 'documents', label: 'Documents', status: 'pending_documents' },
]

const MEMBERSHIP_FILTERS = [
  { id: 'ALL', label: 'All members' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
]

function MemberAvatar({ row }) {
  const url = docUrl(row, 'photo')
  if (!url) {
    return (
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 text-sm font-semibold shrink-0">
        {(memberName(row) || '?').charAt(0).toUpperCase()}
      </div>
    )
  }
  return (
    <img
      src={url}
      alt=""
      className="w-11 h-11 rounded-full object-cover border border-gray-200 shrink-0 bg-gray-50"
    />
  )
}

function QueueFilterChips({ value, onChange, counts }) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUEUE_FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            value === f.id
              ? 'bg-brand text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
          }`}
        >
          {f.label}
          {counts[f.id] != null ? (
            <span className={`ml-1.5 ${value === f.id ? 'text-white/90' : 'text-gray-400'}`}>
              {counts[f.id]}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

function MemberRowCard({ row, isQueue, onReview }) {
  const docs = documentsSummary(row)
  const pending = Array.isArray(row.pendingActions) ? row.pendingActions : []

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onReview(row)}
      onKeyDown={(e) => e.key === 'Enter' && onReview(row)}
      className="group flex gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-brand/30 hover:shadow-md transition-all cursor-pointer text-left w-full"
    >
      <MemberAvatar row={row} />

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 truncate">{memberName(row)}</h3>
            <p className="text-sm text-gray-500">{memberMobile(row)}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end">
            <StatusBadge status={membershipStatusKey(row)} />
            {docs.pending > 0 ? (
              <StatusBadge label={`${docs.pending} doc`} color="yellow" />
            ) : docs.approved >= 4 ? (
              <StatusBadge label="KYC OK" color="green" />
            ) : null}
          </div>
        </div>

        <p className="mt-2 text-sm text-gray-700">
          <span className="font-medium">{memberDesignation(row)}</span>
          <span className="text-gray-400 mx-1">·</span>
          {memberNewspaper(row)}
        </p>

        <p className="mt-1 text-xs text-gray-500 truncate">{memberLocation(row)}</p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
          <span>{memberTypeLabel(row)}</span>
          <span>Applied {formatDate(row.createdAt)}</span>
          {!isQueue && pressIdDisplay(row) ? (
            <span className="font-mono text-brand">{pressIdDisplay(row)}</span>
          ) : null}
          {!isQueue && surveySummary(row) ? (
            <span>Survey: {surveySummary(row)}</span>
          ) : null}
          {!isQueue ? (
            <span>
              Ins: {insuranceStatus(row, 'accidental')} / {insuranceStatus(row, 'health')}
            </span>
          ) : null}
        </div>

        {isQueue && pending.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {pending.map((a) => (
              <span
                key={a}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-100"
              >
                {a === 'MEMBERSHIP' ? 'Approve membership' : a}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="hidden sm:flex items-center shrink-0">
        <span className="text-sm font-medium text-brand group-hover:underline">Review →</span>
      </div>
    </article>
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
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [selectedId, setSelectedId] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [dataSource, setDataSource] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setDataSource(null)
    try {
      const queueStatus =
        QUEUE_FILTERS.find((f) => f.id === queueFilter)?.status || 'all_pending'

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
          })

      setAllRows(parsed.items)
      setApiTotal(parsed.total)
      setTotalPages(isQueue ? 1 : parsed.totalPages)
      setDataSource(parsed.source || null)
    } catch (err) {
      setError(formatJournalistApiError(err, 'Failed to load members'))
      setAllRows([])
      setApiTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [isQueue, page, unionName, search, queueFilter, membershipFilter])

  useEffect(() => {
    load()
  }, [load, refreshToken])

  const filterCounts = useMemo(() => {
    const membership = allRows.filter((r) => membershipPending(r)).length
    const documents = allRows.filter((r) => hasPendingDocuments(r)).length
    return { all: allRows.length, membership, documents }
  }, [allRows])

  const displayRows = allRows

  const openReview = (row) => {
    if (!row?.id) return
    setSelectedId(row.id)
    setPanelOpen(true)
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {isQueue ? 'Review queue' : 'Member directory'}
          </p>
          <p className="text-sm font-medium text-slate-800 mt-0.5 truncate">
            {unionName}
            {!settingsReady ? (
              <span className="text-slate-400 font-normal"> · loading…</span>
            ) : null}
          </p>
        </div>

        <form
          className="flex gap-2 flex-1 lg:max-w-md"
          onSubmit={(e) => {
            e.preventDefault()
            setSearch(searchInput)
            if (!isQueue) setPage(1)
          }}
        >
          <Input
            placeholder="Name, mobile, newspaper…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="bg-white"
          />
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        <Button variant="ghost" size="sm" onClick={load} loading={loading} className="shrink-0">
          Refresh
        </Button>
      </div>

      {/* Stats — queue only */}
      {isQueue ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="text-2xl font-bold text-gray-900">{apiTotal}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total pending (API)</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3">
            <p className="text-2xl font-bold text-amber-900">{filterCounts.membership}</p>
            <p className="text-xs text-amber-800/80 mt-0.5">Need membership</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-3">
            <p className="text-2xl font-bold text-blue-900">{filterCounts.documents}</p>
            <p className="text-xs text-blue-800/80 mt-0.5">Need documents</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="text-2xl font-bold text-gray-900">{displayRows.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Showing (filtered)</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{apiTotal}</span> members
          {totalPages > 1 ? ` · page ${page} of ${totalPages}` : null}
        </p>
      )}

      {isQueue ? (
        <QueueFilterChips
          value={queueFilter}
          onChange={(id) => {
            setQueueFilter(id)
          }}
          counts={filterCounts}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {MEMBERSHIP_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setMembershipFilter(f.id)
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                membershipFilter === f.id
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {dataSource && dataSource !== 'pending' && dataSource !== 'members' ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Loaded via fallback API ({dataSource}). If counts look wrong, check union name in Settings.
        </p>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-gray-500">Loading members…</p>
        </div>
      ) : displayRows.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
          <p className="text-gray-600 font-medium">No members found</p>
          <p className="text-sm text-gray-400 mt-1">
            {isQueue ? 'Queue is empty or filters hide all rows on this page.' : 'Try another search.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {displayRows.map((row) => (
            <li key={row.id}>
              <MemberRowCard row={row} isQueue={isQueue} onReview={openReview} />
            </li>
          ))}
        </ul>
      )}

      {!isQueue && totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} / {totalPages}
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

      {isQueue && apiTotal > QUEUE_FETCH_LIMIT ? (
        <p className="text-xs text-center text-gray-400">
          Showing first {QUEUE_FETCH_LIMIT} of {apiTotal}. Use search to narrow results.
        </p>
      ) : null}

      <SlidePanel
        isOpen={panelOpen}
        onClose={() => {
          setPanelOpen(false)
          setSelectedId(null)
        }}
        title={isQueue ? 'Review application' : 'Member profile'}
        subtitle={memberName(allRows.find((r) => r.id === selectedId) || {})}
        width="xl"
      >
        {selectedId ? <MemberReviewPanel profileId={selectedId} onUpdated={load} /> : null}
      </SlidePanel>
    </div>
  )
}
