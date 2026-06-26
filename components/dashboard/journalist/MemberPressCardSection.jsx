/**
 * Press / Union ID card — generate, regenerate, download
 */

import { useState } from 'react'
import {
  generateUnionIdCard,
  regenerateUnionIdCard,
  formatDocActionError,
} from '../../../lib/journalist/memberDocumentActions'
import { unionAdminApi } from '../../../lib/api/services/unionAdminApi'
import { pressCard, formatDate, membershipStatusKey, pressIdDisplay } from '../../../lib/journalist/memberDisplay'
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
  const [downloading, setDownloading] = useState(false)

  if (!member) return null

  const approved = membershipStatusKey(member) === 'approved'
  const card = pressCard(member)
  const readiness = idCardReadiness(member)
  const blockReason = idCardBlockReason(member)
  const canDownload = member.canDownloadIdCard !== false

  const handleGenerate = async () => {
    if (!profileId) return
    setGenerating(true)
    try {
      const res = await generateUnionIdCard(profileId)
      const parsed = parseApproveIdCardResult(res)
      if (parsed.generated || res?.idCard?.status === 'PROCESSING') {
        toast.success(parsed.message || res?.message || 'ID card generation started')
      } else {
        toast.error(parsed.message || res?.message || 'Generate failed')
      }
      onRefresh?.()
    } catch (err) {
      toast.error(formatDocActionError(err, 'ID card generate failed'))
    } finally {
      setGenerating(false)
    }
  }

  const handleRegeneratePdf = async () => {
    if (!profileId) return
    setRegenerating(true)
    try {
      await regenerateUnionIdCard(profileId)
      toast.success('ID card regeneration started')
      onRefresh?.()
    } catch (err) {
      toast.error(formatDocActionError(err, 'PDF regenerate failed'))
    } finally {
      setRegenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!profileId) return
    setDownloading(true)
    try {
      const name = pressIdDisplay(member) || 'union-member'
      await unionAdminApi.downloadIdCard(profileId, `${name.replace(/\s+/g, '-')}-id-card.pdf`)
    } catch (err) {
      toast.error(err.message || 'Download blocked — approve all required documents first')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Card title="Union ID card">
      {!approved ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Step 7: Approve <strong>membership</strong> first. Then generate the ID card after KYC approval.
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
          <strong>ID card blocked:</strong> {blockReason}
        </p>
      ) : null}

      {card?.pdfUrl || approved ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            loading={generating}
            disabled={!readiness.ready || !approved}
            onClick={handleGenerate}
          >
            {card?.pdfUrl ? 'Regenerate card' : 'Generate ID card'}
          </Button>
          {card?.pdfUrl ? (
            <>
              <Button size="sm" variant="secondary" loading={regenerating} onClick={handleRegeneratePdf}>
                Regenerate PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                loading={downloading}
                disabled={!canDownload}
                onClick={handleDownload}
              >
                Download PDF
              </Button>
            </>
          ) : null}
        </div>
      ) : null}

      {card?.pdfUrl ? (
        <div className="mt-4 space-y-2">
          <CardRow label="Press ID" value={pressIdDisplay(member) || '—'} />
          <CardRow label="Card status" value={card.status || '—'} />
          <CardRow label="Expiry" value={formatDate(card.expiryDate)} />
        </div>
      ) : null}

      {member.canDownloadIdCard === false ? (
        <p className="mt-2 text-xs text-amber-700">
          Download blocked until all required documents are approved.
        </p>
      ) : null}
    </Card>
  )
}
