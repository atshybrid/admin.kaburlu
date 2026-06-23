/**
 * All readers — search, filters, upgrade to citizen reporter
 */

import { useCallback, useEffect, useState } from 'react'
import { readersAdminApi } from '../../../lib/api/services/readersAdminApi'
import { normalizeReaderList } from '../../../lib/readers/normalize'
import { formatReaderAdminError } from '../../../lib/readers/readerErrors'
import PersonaBadge from './PersonaBadge'
import ApprovalStatusBadge from './ApprovalStatusBadge'
import ReaderDetailPanel from './ReaderDetailPanel'
import { Button, EmptyState, FormField, Input, Select, Spinner, toast } from '../../ui'

const PAGE_SIZE = 50

const PERSONA_FILTER = [
  { value: '', label: 'All personas' },
  { value: 'reader', label: 'Reader' },
  { value: 'citizen_reporter', label: 'Citizen Reporter' },
  { value: 'govt_official', label: 'Government Official' },
  { value: 'public_figure', label: 'Public Figure' },
]

const STATUS_FILTER = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING_APPROVAL', label: 'Pending approval' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'SUSPENDED', label: 'Suspended' },
]

export default function AllReadersTab({ refreshKey = 0, onChanged }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [persona, setPersona] = useState('')
  const [approvalStatus, setApprovalStatus] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [selected, setSelected] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: String(PAGE_SIZE), role: 'READER' }
      if (search.trim()) params.q = search.trim()
      if (persona) params.persona = persona
      if (approvalStatus) params.approvalStatus = approvalStatus

      const raw = await readersAdminApi.list(params)
      const parsed = normalizeReaderList(raw)
      setRows(parsed.items)
      setHasMore(!!parsed.pageInfo?.hasMore)
    } catch (err) {
      toast.error(formatReaderAdminError(err, 'Failed to load readers'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [search, persona, approvalStatus])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const openRow = (row) => {
    setSelected(row)
    setPanelOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px] max-w-md">
          <FormField label="Search">
            <div className="flex gap-2">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Name, email, mobile…"
                onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
              />
              <Button variant="outline" size="sm" onClick={() => setSearch(searchInput)}>
                Search
              </Button>
            </div>
          </FormField>
        </div>
        <FormField label="Persona">
          <Select value={persona} onChange={(e) => setPersona(e.target.value)}>
            {PERSONA_FILTER.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Status">
          <Select value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value)}>
            {STATUS_FILTER.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : !rows.length ? (
        <EmptyState title="No readers found" subtitle="Try a different search or filter." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-900 text-left text-[11px] uppercase tracking-wider text-slate-300">
                <th className="px-4 py-3 font-semibold">Person</th>
                <th className="px-4 py-3 font-semibold">Mobile</th>
                <th className="px-4 py-3 font-semibold">Persona</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold text-right">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const profile = row.readerProfile || {}
                return (
                  <tr
                    key={row.userId}
                    className="hover:bg-slate-50/80 cursor-pointer"
                    onClick={() => openRow(row)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{row.displayName}</div>
                      <div className="text-xs text-slate-400">{row.email || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.mobileNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <PersonaBadge persona={profile.persona} label={profile.personaLabel} />
                    </td>
                    <td className="px-4 py-3">
                      <ApprovalStatusBadge status={profile.approvalStatus} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{row.role || 'READER'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openRow(row) }}>
                        Manage
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {hasMore ? (
            <p className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100">
              Showing first {PAGE_SIZE} results — refine search to narrow down.
            </p>
          ) : null}
        </div>
      )}

      <ReaderDetailPanel
        open={panelOpen}
        reader={selected}
        onClose={() => setPanelOpen(false)}
        onChanged={() => {
          load()
          onChanged?.()
        }}
      />
    </div>
  )
}
