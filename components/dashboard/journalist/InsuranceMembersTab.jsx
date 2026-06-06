/**
 * DJFW Insurance — card list from GET /journalist/admin/members
 * Filter by accidental / health status; open MemberReviewPanel for assign/unlock
 */

import { useState, useEffect, useCallback } from 'react'
import { fetchMemberDirectory } from '../../../lib/journalist/fetchMemberLists'
import { formatJournalistApiError } from '../../../lib/journalist/memberErrors'
import {
  memberName,
  memberMobile,
  memberLocation,
  pressIdDisplay,
} from '../../../lib/journalist/memberDisplay'
import { insuranceStatusMeta } from '../../../lib/journalist/insuranceFlow'
import { useUnionSettings } from './useUnionSettings'
import MemberReviewPanel from './MemberReviewPanel'
import { Button, Input, SlidePanel, Spinner, StatusBadge } from '../../ui'

const PAGE_SIZE = 20

const ACC_FILTERS = [
  { id: 'ALL', label: 'All accidental' },
  { id: 'LOCKED_SURVEY_REQUIRED', label: 'Locked (survey)' },
  { id: 'UNLOCKED_CAN_APPLY', label: 'Ready to assign' },
  { id: 'ACTIVE', label: 'Active' },
]

const HEALTH_FILTERS = [
  { id: 'ALL', label: 'All health' },
  { id: 'LOCKED_REQUIRES_ACCIDENTAL', label: 'Needs accidental' },
  { id: 'LOCKED_SURVEY_REQUIRED', label: 'Locked (survey)' },
  { id: 'UNLOCKED_CAN_APPLY', label: 'Ready to assign' },
  { id: 'ACTIVE', label: 'Active' },
]

function InsuranceLaneBadge({ lane }) {
  const meta = insuranceStatusMeta(lane?.status)
  return <StatusBadge label={meta.label} color={meta.color} />
}

function InsuranceMemberCard({ row, onOpen }) {
  const acc = row?.insurance?.accidental
  const health = row?.insurance?.health

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(row)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(row)}
      className="rounded-xl border border-gray-200 bg-white p-4 hover:border-brand/30 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">{memberName(row)}</h3>
          <p className="text-sm text-gray-500">{memberMobile(row)}</p>
          {pressIdDisplay(row) ? (
            <p className="text-xs font-mono text-brand mt-0.5">{pressIdDisplay(row)}</p>
          ) : null}
        </div>
        <span className="text-sm font-medium text-brand">Manage →</span>
      </div>

      <p className="text-xs text-gray-500 mt-2 truncate">{memberLocation(row)}</p>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
          <p className="text-[10px] font-bold uppercase text-slate-500">Accidental</p>
          <div className="mt-1">
            <InsuranceLaneBadge lane={acc} />
          </div>
          {acc?.nextStep ? (
            <p className="text-[10px] text-slate-500 mt-1 leading-tight">{acc.nextStep}</p>
          ) : null}
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
          <p className="text-[10px] font-bold uppercase text-slate-500">Health</p>
          <div className="mt-1">
            <InsuranceLaneBadge lane={health} />
          </div>
          {health?.nextStep ? (
            <p className="text-[10px] text-slate-500 mt-1 leading-tight">{health.nextStep}</p>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default function InsuranceMembersTab({ refreshToken = 0 }) {
  const { unionName } = useUnionSettings()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [accFilter, setAccFilter] = useState('UNLOCKED_CAN_APPLY')
  const [healthFilter, setHealthFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [selectedId, setSelectedId] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const parsed = await fetchMemberDirectory({
        unionName,
        page,
        limit: PAGE_SIZE,
        q: search,
        membershipStatus: 'APPROVED',
        insuranceAccidental: accFilter,
        insuranceHealth: healthFilter,
      })
      setRows(parsed.items)
      setTotal(parsed.total)
      setTotalPages(parsed.totalPages)
    } catch (err) {
      setError(formatJournalistApiError(err, 'Failed to load members'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [unionName, page, search, accFilter, healthFilter])

  useEffect(() => {
    load()
  }, [load, refreshToken])

  const readyCount = rows.filter((r) => r?.insurance?.accidental?.status === 'UNLOCKED_CAN_APPLY').length
  const activeAcc = rows.filter((r) => r?.insurance?.accidental?.status === 'ACTIVE').length

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
        <strong>Why insurance?</strong> Party surveys unlock accidental cover; accidental must be active
        before health. Use <em>Ready to assign</em> filter → open member → PATCH benefits (manual unlock)
        or POST insurance (assign LIC policy). Survey approval auto-unlocks when configured.
      </div>

      <div className="flex flex-col lg:flex-row gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <form
          className="flex gap-2 flex-1"
          onSubmit={(e) => {
            e.preventDefault()
            setSearch(searchInput)
            setPage(1)
          }}
        >
          <Input
            placeholder="Name, mobile, press ID…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="bg-white"
          />
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>
        <Button variant="ghost" size="sm" onClick={load} loading={loading}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-white px-4 py-3">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500">Matching members</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-2xl font-bold text-green-900">{readyCount}</p>
          <p className="text-xs text-green-800">Ready (this page)</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-2xl font-bold text-blue-900">{activeAcc}</p>
          <p className="text-xs text-blue-800">Active accidental (page)</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-slate-500">Accidental filter</p>
        <div className="flex flex-wrap gap-2">
          {ACC_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setAccFilter(f.id)
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                accFilter === f.id
                  ? 'bg-brand text-white'
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-slate-500">Health filter</p>
        <div className="flex flex-wrap gap-2">
          {HEALTH_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setHealthFilter(f.id)
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                healthFilter === f.id
                  ? 'bg-brand text-white'
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-center text-gray-500 py-12 border border-dashed rounded-xl">
          No approved members match these insurance filters
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rows.map((row) => (
            <InsuranceMemberCard
              key={row.id}
              row={row}
              onOpen={(r) => {
                setSelectedId(r.id)
                setPanelOpen(true)
              }}
            />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
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
            disabled={page >= totalPages}
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
        title="Insurance & benefits"
        subtitle={memberName(rows.find((r) => r.id === selectedId) || {})}
        width="xl"
      >
        {selectedId ? (
          <MemberReviewPanel profileId={selectedId} onUpdated={load} initialSection="insurance" />
        ) : null}
      </SlidePanel>
    </div>
  )
}
