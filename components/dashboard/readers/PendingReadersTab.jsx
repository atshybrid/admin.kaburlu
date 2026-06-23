/**
 * Pending govt official / public figure approvals
 */

import { useCallback, useEffect, useState } from 'react'
import { readersAdminApi } from '../../../lib/api/services/readersAdminApi'
import { normalizePendingList } from '../../../lib/readers/normalize'
import { formatReaderAdminError } from '../../../lib/readers/readerErrors'
import PersonaBadge from './PersonaBadge'
import ApprovalStatusBadge from './ApprovalStatusBadge'
import RejectReaderModal from './RejectReaderModal'
import { EmptyState, Spinner, toast } from '../../ui'

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export default function PendingReadersTab({ refreshKey = 0, onChanged }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [rejectFor, setRejectFor] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = await readersAdminApi.listPending()
      setRows(normalizePendingList(raw))
    } catch (err) {
      toast.error(formatReaderAdminError(err, 'Failed to load pending queue'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const handleApprove = async (row) => {
    const userId = row.userId
    if (!userId) return
    setBusyId(userId)
    try {
      await readersAdminApi.approve(userId)
      toast.success(`${row.displayName} approved`)
      await load()
      onChanged?.()
    } catch (err) {
      toast.error(formatReaderAdminError(err, 'Approve failed'))
    } finally {
      setBusyId(null)
    }
  }

  const handleRejectConfirm = async (reason) => {
    const userId = rejectFor?.userId
    if (!userId) return
    setBusyId(userId)
    try {
      await readersAdminApi.reject(userId, reason)
      toast.success('Application rejected')
      setRejectFor(null)
      await load()
      onChanged?.()
    } catch (err) {
      toast.error(formatReaderAdminError(err, 'Reject failed'))
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!rows.length) {
    return (
      <EmptyState
        title="No pending approvals"
        subtitle="Government officials and public figures awaiting verification will appear here."
      />
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-900 text-left text-[11px] uppercase tracking-wider text-slate-300">
              <th className="px-4 py-3 font-semibold">Person</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Persona</th>
              <th className="px-4 py-3 font-semibold">Details</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Applied</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const profile = row.readerProfile || {}
              const busy = busyId === row.userId
              return (
                <tr key={row.userId} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{row.displayName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{row.userId}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{row.email || '—'}</div>
                    <div className="text-xs text-slate-400">{row.mobileNumber || 'No mobile'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <PersonaBadge persona={profile.persona} label={profile.personaLabel} />
                    {profile.subRoleLabel ? (
                      <div className="text-xs text-slate-500 mt-1">{profile.subRoleLabel}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px]">
                    {profile.departmentName && <div>Dept: {profile.departmentName}</div>}
                    {profile.organizationName && <div>Org: {profile.organizationName}</div>}
                    {profile.authProvider && (
                      <div className="text-slate-400">via {profile.authProvider}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ApprovalStatusBadge status={profile.approvalStatus} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleApprove(row)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setRejectFor(row)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <RejectReaderModal
        isOpen={!!rejectFor}
        reader={rejectFor}
        onClose={() => setRejectFor(null)}
        onConfirm={handleRejectConfirm}
        busy={!!busyId}
      />
    </>
  )
}
