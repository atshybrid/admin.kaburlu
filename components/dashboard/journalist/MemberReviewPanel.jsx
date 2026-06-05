/**
 * Union member review — profile, KYC images, document + membership actions
 */

import { useState, useEffect } from 'react'
import { journalistApi } from '../../../lib/api/services/journalistApi'
import {
  DOC_KEYS,
  memberMobile,
  memberName,
  membershipPending,
  membershipStatusKey,
  reviewableDocKeys,
  formatDate,
  pressIdDisplay,
  pressCard,
  memberDesignation,
  memberNewspaper,
  memberLocation,
  memberTypeLabel,
} from '../../../lib/journalist/memberDisplay'
import { formatJournalistApiError } from '../../../lib/journalist/memberErrors'
import MemberInsuranceSection from './MemberInsuranceSection'
import PartyChip from '../politicalParties/PartyChip'
import Link from 'next/link'
import {
  Button,
  Card,
  CardRow,
  FormField,
  Input,
  Modal,
  StatusBadge,
  toast,
} from '../../ui'

function DocCard({ docKey, doc, label, onApprove, onReject, saving }) {
  const url = doc?.url
  const canReview = Boolean(url) && doc?.status === 'PENDING'
  const isPdf = url && /\.pdf($|\?)/i.test(url)

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-800 capitalize">{label}</span>
        {doc?.status ? (
          <StatusBadge
            label={doc.status}
            color={doc.status === 'APPROVED' ? 'green' : doc.status === 'PENDING' ? 'yellow' : 'gray'}
          />
        ) : (
          <StatusBadge label="Missing" color="gray" />
        )}
      </div>

      <div className="p-3 min-h-[120px] flex items-center justify-center bg-gray-50/50">
        {!url ? (
          <p className="text-xs text-gray-400">Not uploaded</p>
        ) : isPdf ? (
          <a href={url} target="_blank" rel="noreferrer" className="text-sm text-brand font-medium underline">
            Open PDF
          </a>
        ) : (
          <a href={url} target="_blank" rel="noreferrer" className="block w-full">
            <img
              src={url}
              alt={label}
              className="max-h-52 w-full object-contain rounded border border-gray-100 bg-white"
            />
          </a>
        )}
      </div>

      {canReview ? (
        <div className="flex gap-2 p-3 border-t border-gray-100">
          <Button size="sm" className="flex-1" loading={saving} onClick={() => onApprove(docKey)}>
            Approve
          </Button>
          <Button size="sm" variant="danger" className="flex-1" loading={saving} onClick={() => onReject(docKey)}>
            Reject
          </Button>
        </div>
      ) : url ? (
        <p className="px-3 pb-3 text-xs text-gray-500">
          <a href={url} target="_blank" rel="noreferrer" className="text-brand underline">
            Open full size
          </a>
        </p>
      ) : null}
    </div>
  )
}

export default function MemberReviewPanel({ profileId, onUpdated }) {
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(false)
  const [docSaving, setDocSaving] = useState(false)
  const [membershipSaving, setMembershipSaving] = useState(false)

  const [approveOpen, setApproveOpen] = useState(false)
  const [generateIdCard, setGenerateIdCard] = useState(true)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const load = async () => {
    if (!profileId) return
    setLoading(true)
    try {
      const data = await journalistApi.getMember(profileId)
      setMember(data)
    } catch (err) {
      toast.error(formatJournalistApiError(err, 'Failed to load member'))
      setMember(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId])

  const refresh = async () => {
    await load()
    onUpdated?.()
  }

  const updateDocuments = async (keys, action) => {
    if (!profileId || !keys?.length) return
    setDocSaving(true)
    try {
      const body = Object.fromEntries(keys.map((k) => [k, action]))
      const res = await journalistApi.updateMemberDocuments(profileId, body)
      toast.success(res?.message || `Documents ${action}d`)
      await refresh()
    } catch (err) {
      toast.error(err.message || `Document ${action} failed`)
    } finally {
      setDocSaving(false)
    }
  }

  const handleApproveMembership = async () => {
    if (!profileId) return
    setMembershipSaving(true)
    try {
      const res = await journalistApi.approveMembership(profileId, {
        approved: true,
        generateIdCard,
      })
      toast.success(res?.message || 'Membership approved')
      setApproveOpen(false)
      await refresh()
    } catch (err) {
      toast.error(err.message || 'Membership approval failed')
    } finally {
      setMembershipSaving(false)
    }
  }

  const handleRejectMembership = async () => {
    if (!profileId) return
    setMembershipSaving(true)
    try {
      const res = await journalistApi.approveMembership(profileId, {
        approved: false,
        reason: rejectReason.trim() || undefined,
      })
      toast.success(res?.message || 'Membership rejected')
      setRejectOpen(false)
      setRejectReason('')
      await refresh()
    } catch (err) {
      toast.error(err.message || 'Reject failed')
    } finally {
      setMembershipSaving(false)
    }
  }

  if (loading && !member) {
    return <p className="text-sm text-gray-500">Loading profile…</p>
  }

  if (!member) {
    return <p className="text-sm text-gray-500">Member not found.</p>
  }

  const docsToReview = reviewableDocKeys(member)
  const needsMembership = membershipPending(member)
  const card = pressCard(member)
  const docLabels = {
    photo: 'Photo',
    aadhaar: 'Aadhaar',
    pan: 'PAN',
    workingIdCard: 'Working ID',
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={membershipStatusKey(member)} />
        {member.pendingActions?.map((a) => (
          <StatusBadge key={a} label={a} color="yellow" />
        ))}
      </div>

      {needsMembership || docsToReview.length > 0 ? (
        <div className="rounded-lg border border-brand/20 bg-brand/5 p-3 flex flex-wrap gap-2">
          {needsMembership ? (
            <>
              <Button size="sm" onClick={() => setApproveOpen(true)}>
                Approve membership
              </Button>
              <Button size="sm" variant="danger" onClick={() => setRejectOpen(true)}>
                Reject membership
              </Button>
            </>
          ) : null}
          {docsToReview.length > 0 ? (
            <>
              <Button size="sm" variant="secondary" loading={docSaving} onClick={() => updateDocuments(docsToReview, 'approve')}>
                Approve all documents
              </Button>
              <Button size="sm" variant="danger" loading={docSaving} onClick={() => updateDocuments(docsToReview, 'reject')}>
                Reject all documents
              </Button>
            </>
          ) : null}
        </div>
      ) : null}

      <Card title="KYC documents">
        <div className="grid gap-4 sm:grid-cols-2">
          {DOC_KEYS.map((key) => (
            <DocCard
              key={key}
              docKey={key}
              doc={member.documents?.[key]}
              label={docLabels[key] || key}
              saving={docSaving}
              onApprove={(k) => updateDocuments([k], 'approve')}
              onReject={(k) => updateDocuments([k], 'reject')}
            />
          ))}
        </div>
        {member.aadhaarBackUrl ? (
          <div className="mt-4 rounded-lg border border-gray-200 p-3">
            <p className="text-xs font-medium text-gray-600 mb-2">Aadhaar (back)</p>
            <a href={member.aadhaarBackUrl} target="_blank" rel="noreferrer">
              <img
                src={member.aadhaarBackUrl}
                alt="Aadhaar back"
                className="max-h-48 rounded border object-contain w-full bg-gray-50"
              />
            </a>
          </div>
        ) : null}
      </Card>

      <Card title="Profile">
        <CardRow label="Name" value={memberName(member)} />
        <CardRow label="Mobile" value={memberMobile(member)} />
        <CardRow label="Father" value={member.fatherName || '—'} />
        <CardRow label="Member type" value={memberTypeLabel(member)} />
        <CardRow label="Press ID" value={pressIdDisplay(member) || '—'} />
        <CardRow label="Designation" value={memberDesignation(member)} />
        <CardRow label="Newspaper" value={memberNewspaper(member)} />
        <CardRow label="Publisher mobile" value={member.publisherMobileNumber || '—'} />
        <CardRow label="Location" value={memberLocation(member)} />
        <CardRow label="Union" value={member.unionName || '—'} />
        <CardRow label="Linked tenant" value={member.linkedTenantName || '—'} />
        <CardRow label="Applied" value={formatDate(member.createdAt)} />
        <CardRow label="Updated" value={formatDate(member.updatedAt)} />
      </Card>

      {member.survey ? (
        <Card title="Party survey">
          <CardRow label="Overall" value={member.survey.overallStatus || '—'} />
          <CardRow
            label="Progress"
            value={`${member.survey.completedCount ?? 0} / ${member.survey.totalCampaigns ?? 0} campaigns`}
          />
          {Array.isArray(member.survey.campaigns) && member.survey.campaigns.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {member.survey.campaigns.map((c) => (
                <li
                  key={c.partyCode || c.campaignId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 p-2 border border-gray-100"
                >
                  <PartyChip
                    party={{
                      partyCode: c.partyCode,
                      displayName: c.displayName,
                      primaryColor: c.primaryColor,
                      secondaryColor: c.secondaryColor,
                      symbolUrl: c.symbolUrl,
                    }}
                    size="sm"
                  />
                  <StatusBadge label={c.status || '—'} color={c.status === 'COMPLETED' ? 'green' : 'gray'} />
                </li>
              ))}
            </ul>
          ) : member.survey.overallStatus === 'NO_CAMPAIGNS' ? (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md p-2 mt-2">
              No campaigns assigned — create & assign in{' '}
              <Link href="/admin/union-surveys" className="text-brand font-medium underline">
                Political Surveys
              </Link>
              , or use insurance admin unlock.
            </p>
          ) : null}
        </Card>
      ) : null}

      <MemberInsuranceSection profileId={profileId} member={member} onRefresh={refresh} />

      {card?.pdfUrl ? (
        <Card title="Press card">
          <CardRow label="Card no." value={card.cardNumber || '—'} />
          <CardRow label="Status" value={card.status || '—'} />
          <CardRow label="Expiry" value={formatDate(card.expiryDate)} />
          <CardRow
            label="PDF"
            value={
              <a href={card.pdfUrl} target="_blank" rel="noreferrer" className="text-brand underline text-sm">
                Download
              </a>
            }
          />
        </Card>
      ) : null}

      <Button size="sm" variant="ghost" onClick={refresh} loading={loading}>
        Refresh
      </Button>

      <Modal
        isOpen={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="Approve membership"
        footer={
          <>
            <Button variant="ghost" onClick={() => setApproveOpen(false)}>Cancel</Button>
            <Button loading={membershipSaving} onClick={handleApproveMembership}>Approve</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 mb-4">
          Approve <strong>{memberName(member)}</strong> for {member.unionName}?
        </p>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={generateIdCard}
            onChange={(e) => setGenerateIdCard(e.target.checked)}
            className="rounded border-gray-300"
          />
          Generate press / ID card
        </label>
      </Modal>

      <Modal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject membership"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={membershipSaving} onClick={handleRejectMembership}>Reject</Button>
          </>
        }
      >
        <FormField label="Reason (optional)">
          <Input
            placeholder="Reason for rejection…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </FormField>
      </Modal>
    </div>
  )
}
