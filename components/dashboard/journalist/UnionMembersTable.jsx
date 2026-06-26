/**
 * Union members — clean table (queue + directory)
 */

import {
  memberName,
  memberMobile,
  memberDesignation,
  memberNewspaper,
  memberLocation,
  membershipStatusKey,
  membershipPending,
  memberPendingSummary,
  pressIdDisplay,
  docUrl,
  surveySummary,
} from '../../../lib/journalist/memberDisplay'
import { docEffectiveStatus } from '../../../lib/journalist/idCardFlow'
import { insuranceStatusMeta } from '../../../lib/journalist/insuranceFlow'

const DOC_KEYS = ['photo', 'aadhaar', 'pan', 'workingIdCard']
const DOC_SHORT = { photo: 'Photo', aadhaar: 'Aadhaar', pan: 'PAN', workingIdCard: 'W.ID' }

function Avatar({ row }) {
  const photo = docUrl(row, 'photo')
  const initial = (memberName(row) || '?').charAt(0).toUpperCase()
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
      />
    )
  }
  return (
    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
      {initial}
    </div>
  )
}

function DocPill({ status }) {
  const colors = {
    APPROVED: 'bg-emerald-100 text-emerald-800',
    PENDING: 'bg-amber-100 text-amber-800',
    REJECTED: 'bg-rose-100 text-rose-800',
    NOT_UPLOADED: 'bg-slate-100 text-slate-500',
  }
  const label =
    status === 'NOT_UPLOADED' ? '—' : status === 'APPROVED' ? '✓' : status === 'PENDING' ? '…' : '✕'
  return (
    <span
      className={`inline-flex w-7 h-7 items-center justify-center rounded-md text-[10px] font-bold ${colors[status] || colors.NOT_UPLOADED}`}
      title={status}
    >
      {label}
    </span>
  )
}

function MembershipBadge({ row }) {
  const pending = membershipPending(row)
  const key = membershipStatusKey(row)
  if (pending) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">
        Pending
      </span>
    )
  }
  if (key === 'approved') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800">
        Approved
      </span>
    )
  }
  if (key === 'rejected') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-100 text-rose-800">
        Rejected
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
      {key}
    </span>
  )
}

function InsuranceBadge({ lane }) {
  if (!lane?.status) return <span className="text-slate-300 text-xs">—</span>
  const meta = insuranceStatusMeta(lane.status)
  const colorMap = {
    green: 'bg-emerald-50 text-emerald-700',
    yellow: 'bg-amber-50 text-amber-700',
    gray: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${colorMap[meta.color] || colorMap.gray}`}>
      {meta.label}
    </span>
  )
}

export default function UnionMembersTable({ rows = [], showDirectoryCols = false, onOpenReview }) {
  if (!rows.length) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 px-4 py-3 sticky left-0 bg-slate-50/95 z-10">
                Member
              </th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 px-3 py-3">
                Status
              </th>
              <th className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 px-2 py-3">
                <span className="sr-only">Documents</span>
                <span aria-hidden>KYC</span>
              </th>
              {!showDirectoryCols ? (
                <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 px-3 py-3">
                  Needs action
                </th>
              ) : (
                <>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 px-3 py-3">
                    Survey
                  </th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 px-3 py-3">
                    Insurance
                  </th>
                </>
              )}
              <th className="text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">
                &nbsp;
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-slate-50/70 z-[1] border-r border-slate-100">
                  <div className="flex items-center gap-3 min-w-[200px] max-w-[280px]">
                    <Avatar row={row} />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate text-sm">{memberName(row)}</p>
                      <p className="text-xs text-slate-500 tabular-nums">{memberMobile(row)}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {memberDesignation(row)} · {memberNewspaper(row)}
                      </p>
                      {pressIdDisplay(row) ? (
                        <p className="text-[11px] text-brand font-medium mt-0.5 truncate">
                          {pressIdDisplay(row)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>

                <td className="px-3 py-3 align-middle">
                  <MembershipBadge row={row} />
                </td>

                <td className="px-2 py-3 align-middle">
                  <div className="flex items-center justify-center gap-1" title="Photo · Aadhaar · PAN · Working ID">
                    {DOC_KEYS.map((key) => (
                      <DocPill key={key} status={docEffectiveStatus(row?.documents?.[key])} />
                    ))}
                  </div>
                  <p className="text-[9px] text-center text-slate-400 mt-1 hidden sm:block">
                    {DOC_KEYS.map((k) => DOC_SHORT[k][0]).join(' ')}
                  </p>
                </td>

                {!showDirectoryCols ? (
                  <td className="px-3 py-3 align-middle">
                    <p className="text-xs text-slate-600 max-w-[180px] leading-snug">
                      {memberPendingSummary(row)}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5 max-w-[200px]">
                      {memberLocation(row)}
                    </p>
                  </td>
                ) : (
                  <>
                    <td className="px-3 py-3 align-middle text-xs text-slate-600">
                      {surveySummary(row) || '—'}
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <div className="flex flex-col gap-1">
                        <InsuranceBadge lane={row?.insurance?.accidental} />
                        <InsuranceBadge lane={row?.insurance?.health} />
                      </div>
                    </td>
                  </>
                )}

                <td className="px-4 py-3 text-right align-middle">
                  <button
                    type="button"
                    onClick={() => onOpenReview?.(row)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
