/**
 * Union members — professional admin table
 * Membership · KYC docs · ID card generate/regenerate
 */

import { useState } from 'react'
import { journalistApi } from '../../../lib/api/services/journalistApi'
import { formatJournalistApiError } from '../../../lib/journalist/memberErrors'
import {
  DOC_KEYS,
  memberName,
  memberMobile,
  memberDesignation,
  memberNewspaper,
  memberLocation,
  membershipStatusKey,
  membershipPending,
  docUrl,
  pressIdDisplay,
  pressCard,
  formatDate,
  surveySummary,
} from '../../../lib/journalist/memberDisplay'
import {
  docEffectiveStatus,
  idCardReadiness,
  idCardBlockReason,
  parseApproveIdCardResult,
} from '../../../lib/journalist/idCardFlow'
import { isDocReviewable } from '../../../lib/journalist/memberDisplay'
import { insuranceStatusMeta } from '../../../lib/journalist/insuranceFlow'
import { toast } from '../../ui'

const DOC_SHORT = { photo: 'Photo', aadhaar: 'Aadhaar', pan: 'PAN', workingIdCard: 'W.ID' }

function StatusDot({ status }) {
  const map = {
    APPROVED: 'bg-emerald-500',
    PENDING: 'bg-amber-400',
    REJECTED: 'bg-rose-500',
    NOT_UPLOADED: 'bg-slate-300',
    approved: 'bg-emerald-500',
    pending: 'bg-amber-400',
    rejected: 'bg-rose-500',
  }
  const label =
    status === 'NOT_UPLOADED'
      ? 'Missing'
      : typeof status === 'string'
        ? status.charAt(0) + status.slice(1).toLowerCase()
        : status
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${map[status] || 'bg-slate-300'}`} />
      {label}
    </span>
  )
}

function DocCell({ row, docKey, savingKey, onDocAction }) {
  const url = docUrl(row, docKey)
  const st = docEffectiveStatus(row?.documents?.[docKey])
  const canReview = isDocReviewable(row?.documents?.[docKey])
  const busy = savingKey === `${row.id}:${docKey}`

  return (
    <div className="flex flex-col items-center gap-2 py-1">
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" title="View document">
          <img
            src={url}
            alt=""
            className="w-9 h-9 rounded-md object-cover ring-1 ring-slate-200 hover:ring-slate-400 transition-shadow"
          />
        </a>
      ) : (
        <div className="w-9 h-9 rounded-md bg-slate-50 ring-1 ring-slate-100 flex items-center justify-center">
          <span className="text-[9px] text-slate-400 font-medium">—</span>
        </div>
      )}
      <StatusDot status={st} />
      {canReview ? (
        <div className="flex gap-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => onDocAction(row.id, docKey, 'approve')}
            className="h-6 w-6 rounded border border-slate-200 text-slate-600 text-xs hover:bg-slate-900 hover:text-white hover:border-slate-900 disabled:opacity-40 transition-colors"
            title="Approve"
          >
            ✓
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDocAction(row.id, docKey, 'reject')}
            className="h-6 w-6 rounded border border-slate-200 text-slate-400 text-xs hover:bg-rose-600 hover:text-white hover:border-rose-600 disabled:opacity-40 transition-colors"
            title="Reject"
          >
            ✕
          </button>
        </div>
      ) : null}
    </div>
  )
}

function IdCardCell({ row, cardBusy, onGenerate, onRegenerate }) {
  const approved = membershipStatusKey(row) === 'approved'
  const card = pressCard(row)
  const readiness = idCardReadiness(row)
  const block = idCardBlockReason(row)
  const busy = cardBusy === row.id

  if (!approved) {
    return <span className="text-[11px] text-slate-400">Pending membership</span>
  }

  if (card?.pdfUrl) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <a
          href={card.pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-medium text-slate-900 underline underline-offset-2 hover:text-slate-600"
        >
          Download PDF
        </a>
        <button
          type="button"
          disabled={busy}
          onClick={() => onRegenerate(row.id)}
          className="text-[11px] text-slate-500 hover:text-slate-900 disabled:opacity-40"
        >
          {busy ? 'Working…' : 'Regenerate'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1 max-w-[140px]">
      <button
        type="button"
        disabled={busy || !readiness.ready}
        onClick={() => onGenerate(row.id)}
        title={block || 'Generate union ID card'}
        className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
      >
        {busy ? 'Generating…' : 'Generate card'}
      </button>
      {!readiness.ready && block ? (
        <span className="text-[10px] text-slate-400 text-right leading-tight">{block}</span>
      ) : null}
    </div>
  )
}

export default function MemberApprovalTable({
  rows = [],
  showDirectoryCols = false,
  onRefresh,
  onOpenReview,
}) {
  const [savingKey, setSavingKey] = useState(null)
  const [membershipSaving, setMembershipSaving] = useState(null)
  const [cardBusy, setCardBusy] = useState(null)

  const handleDoc = async (profileId, docKey, action) => {
    setSavingKey(`${profileId}:${docKey}`)
    try {
      const res = await journalistApi.updateMemberDocuments(profileId, { [docKey]: action })
      toast.success(res?.message || `${DOC_SHORT[docKey]} ${action}d`)
      onRefresh?.()
    } catch (err) {
      toast.error(formatJournalistApiError(err, 'Document update failed'))
    } finally {
      setSavingKey(null)
    }
  }

  const handleMembership = async (profileId, approved) => {
    setMembershipSaving(profileId)
    try {
      const res = await journalistApi.approveMembership(profileId, {
        approved,
        generateIdCard: approved,
      })
      if (approved) {
        const info = parseApproveIdCardResult(res)
        if (info.generated) toast.success(info.message)
        else if (info.skipped) toast.error(info.message)
        else {
          toast.success(res?.message || 'Membership approved')
          if (info.message) toast.error(info.message)
        }
      } else {
        toast.success(res?.message || 'Membership rejected')
      }
      onRefresh?.()
    } catch (err) {
      toast.error(formatJournalistApiError(err, 'Membership action failed'))
    } finally {
      setMembershipSaving(null)
    }
  }

  const handleGenerateCard = async (profileId) => {
    setCardBusy(profileId)
    try {
      const res = await journalistApi.generatePressCard({ profileId })
      const info = parseApproveIdCardResult(res)
      if (info.generated) toast.success(info.message)
      else toast.error(info.message || 'Generate failed — approve all required KYC docs')
      onRefresh?.()
    } catch (err) {
      toast.error(formatJournalistApiError(err, 'ID card generate failed'))
    } finally {
      setCardBusy(null)
    }
  }

  const handleRegenerateCard = async (profileId) => {
    setCardBusy(profileId)
    try {
      await journalistApi.regenerateMemberPdf(profileId)
      toast.success('ID card PDF regenerated')
      onRefresh?.()
    } catch (err) {
      toast.error(formatJournalistApiError(err, 'Regenerate failed'))
    } finally {
      setCardBusy(null)
    }
  }

  if (!rows.length) return null

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="bg-slate-900 text-left">
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-300 sticky left-0 bg-slate-900 z-10">
                Member
              </th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-300 text-center">
                Status
              </th>
              {DOC_KEYS.map((k) => (
                <th
                  key={k}
                  className="px-2 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-300 text-center"
                >
                  {DOC_SHORT[k]}
                </th>
              ))}
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-300 text-right">
                ID Card
              </th>
              {showDirectoryCols ? (
                <>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                    Survey
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                    Insurance
                  </th>
                </>
              ) : null}
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-300 text-right">
                Review
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const needsMembership = membershipPending(row)
              const memBusy = membershipSaving === row.id
              const memKey = membershipStatusKey(row)
              const acc = insuranceStatusMeta(row?.insurance?.accidental?.status)
              const health = insuranceStatusMeta(row?.insurance?.health?.status)

              return (
                <tr
                  key={row.id}
                  className={`border-t border-slate-100 hover:bg-slate-50/60 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                >
                  <td className="px-4 py-3 sticky left-0 bg-inherit z-[1] border-r border-slate-100">
                    <div className="flex gap-3 items-center min-w-[220px]">
                      {docUrl(row, 'photo') ? (
                        <img
                          src={docUrl(row, 'photo')}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-semibold">
                          {(memberName(row) || '?').charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{memberName(row)}</p>
                        <p className="text-xs text-slate-500 tabular-nums">{memberMobile(row)}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {memberDesignation(row)} · {memberNewspaper(row)}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{memberLocation(row)}</p>
                        {pressIdDisplay(row) ? (
                          <p className="text-[10px] font-mono text-slate-600 mt-0.5">
                            {pressIdDisplay(row)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3 text-center align-middle">
                    <div className="flex flex-col items-center gap-2">
                      <StatusDot status={memKey} />
                      {needsMembership ? (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={memBusy}
                            onClick={() => handleMembership(row.id, true)}
                            className="px-2 py-1 text-[11px] font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={memBusy}
                            onClick={() => handleMembership(row.id, false)}
                            className="px-2 py-1 text-[11px] font-medium rounded-md border border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-700 disabled:opacity-40"
                          >
                            Reject
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>

                  {DOC_KEYS.map((key) => (
                    <td key={key} className="px-2 py-2 text-center align-middle">
                      <DocCell
                        row={row}
                        docKey={key}
                        savingKey={savingKey}
                        onDocAction={handleDoc}
                      />
                    </td>
                  ))}

                  <td className="px-3 py-3 text-right align-middle">
                    <IdCardCell
                      row={row}
                      cardBusy={cardBusy}
                      onGenerate={handleGenerateCard}
                      onRegenerate={handleRegenerateCard}
                    />
                  </td>

                  {showDirectoryCols ? (
                    <>
                      <td className="px-3 py-3 text-[11px] text-slate-600 align-middle">
                        {surveySummary(row) || '—'}
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="space-y-0.5 text-[10px] text-slate-500 leading-snug">
                          <p>Acc: {acc.label}</p>
                          <p>Health: {health.label}</p>
                        </div>
                      </td>
                    </>
                  ) : null}

                  <td className="px-4 py-3 text-right align-middle">
                    <button
                      type="button"
                      onClick={() => onOpenReview?.(row)}
                      className="text-[11px] font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2"
                    >
                      Open profile
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
