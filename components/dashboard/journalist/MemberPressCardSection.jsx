/**
 * Press / Union ID card — why missing + generate / regenerate actions
 */

import { useState } from 'react'
import { journalistApi } from '../../../lib/api/services/journalistApi'
import { formatJournalistApiError } from '../../../lib/journalist/memberErrors'
import { pressCard, formatDate, membershipStatusKey } from '../../../lib/journalist/memberDisplay'
import {
  docEffectiveStatus,
  idCardReadiness,
  idCardBlockReason,
  parseApproveIdCardResult,
} from '../../../lib/journalist/idCardFlow'
import { Button, Card, CardRow, StatusBadge, toast } from '../../ui'

const DOC_LABELS = {
  photo: 'Photo',
  aadhaar: 'Aadhaar',
  pan: 'PAN',
  workingIdCard: 'Working ID',
}

export default function MemberPressCardSection({ profileId, member, onRefresh }) {
  const [generating, setGenerating] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  if (!member) return null

  const approved = membershipStatusKey(member) === 'approved'
  const card = pressCard(member)
  const readiness = idCardReadiness(member)
  const blockReason = idCardBlockReason(member)

  const handleGenerate = async () => {
    if (!profileId) return
    setGenerating(true)
    try {
      const res = await journalistApi.generatePressCard({ profileId })
      const parsed = parseApproveIdCardResult(res)
      if (parsed.generated) {
        toast.success(parsed.message)
      } else {
        toast.error(parsed.message || 'Generate failed')
      }
      onRefresh?.()
    } catch (err) {
      toast.error(formatJournalistApiError(err, 'ID card generate failed'))
    } finally {
      setGenerating(false)
    }
  }

  const handleRegeneratePdf = async () => {
    if (!profileId) return
    setRegenerating(true)
    try {
      await journalistApi.regenerateMemberPdf(profileId)
      toast.success('PDF regenerated')
      onRefresh?.()
    } catch (err) {
      toast.error(formatJournalistApiError(err, 'PDF regenerate failed'))
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <Card title="Union ID card">
      {!approved ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Approve <strong>membership</strong> first. ID card is created after membership + required KYC
          documents are approved.
        </p>
      ) : null}

      <div className="mt-3 space-y-2">
        <p className="text-xs font-semibold uppercase text-slate-500">Required for ID card</p>
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {readiness.required.map((key) => {
            const d = member.documents?.[key]
            const st = docEffectiveStatus(d)
            const color =
              st === 'APPROVED' ? 'green' : st === 'PENDING' ? 'yellow' : st === 'REJECTED' ? 'red' : 'gray'
            return (
              <li
                key={key}
                className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5 text-xs flex justify-between gap-1"
              >
                <span>{DOC_LABELS[key]}</span>
                <StatusBadge label={st === 'NOT_UPLOADED' ? 'Missing' : st} color={color} />
              </li>
            )
          })}
        </ul>
      </div>

      {approved && !readiness.ready && blockReason ? (
        <p className="mt-3 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <strong>ID card blocked:</strong> {blockReason}. Use ✓ in the table or Approve all documents
          above.
        </p>
      ) : null}

      {card?.pdfUrl ? (
        <div className="mt-4 space-y-2">
          <CardRow label="Card no." value={card.cardNumber || '—'} />
          <CardRow label="Status" value={card.status || '—'} />
          <CardRow label="Expiry" value={formatDate(card.expiryDate)} />
          <CardRow
            label="PDF"
            value={
              <a href={card.pdfUrl} target="_blank" rel="noreferrer" className="text-brand underline text-sm">
                Download ID card
              </a>
            }
          />
          <Button size="sm" variant="secondary" loading={regenerating} onClick={handleRegeneratePdf}>
            Regenerate PDF
          </Button>
        </div>
      ) : approved ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-gray-600">
            Membership is approved but no ID card PDF yet.
            {readiness.ready
              ? ' All required documents are approved — generate now.'
              : ' Complete document approvals first.'}
          </p>
          <Button
            size="sm"
            loading={generating}
            disabled={!readiness.ready}
            onClick={handleGenerate}
          >
            Generate ID card
          </Button>
        </div>
      ) : null}

      {member.canDownloadIdCard === false && card?.pdfUrl ? (
        <p className="mt-2 text-xs text-gray-500">
          Member app download may stay locked until all required documents show APPROVED in API.
        </p>
      ) : null}
    </Card>
  )
}
