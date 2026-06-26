/**
 * Union member review — profile, KYC images, document + membership actions
 */

import { useState, useEffect, useRef } from 'react'
import { unionAdminApi } from '../../../lib/api/services/unionAdminApi'
import {
  patchMemberDocuments,
  approveMembership,
  fetchUnionMember,
  formatDocActionError,
} from '../../../lib/journalist/memberDocumentActions'
import {
  DOC_KEYS,
  memberMobile,
  memberName,
  membershipPending,
  membershipStatusKey,
  reviewableDocKeys,
  formatDate,
  pressIdDisplay,
  memberTypeLabel,
} from '../../../lib/journalist/memberDisplay'
import { formatJournalistApiError, shouldSilenceMemberLoadError } from '../../../lib/journalist/memberErrors'
import MemberInsuranceSection from './MemberInsuranceSection'
import MemberPressCardSection from './MemberPressCardSection'
import MemberProfileEdit from './MemberProfileEdit'
import { docEffectiveStatus, parseApproveIdCardResult } from '../../../lib/journalist/idCardFlow'
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
  const effectiveStatus = docEffectiveStatus(doc)
  const canReview = effectiveStatus === 'PENDING'
  const isPdf = url && /\.pdf($|\?)/i.test(url)

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-800 capitalize">{label}</span>
        <StatusBadge
          label={effectiveStatus === 'NOT_UPLOADED' ? 'Missing' : effectiveStatus}
          color={
            effectiveStatus === 'APPROVED'
              ? 'green'
              : effectiveStatus === 'PENDING'
                ? 'yellow'
                : effectiveStatus === 'REJECTED'
                  ? 'red'
                  : 'gray'
          }
        />
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

export default function MemberReviewPanel({ profileId, onUpdated, initialSection, initialMember = null }) {
  const [member, setMember] = useState(initialMember)
  const [loading, setLoading] = useState(false)
  const [detailUnavailable, setDetailUnavailable] = useState(false)
  const [docSaving, setDocSaving] = useState(false)
  const [membershipSaving, setMembershipSaving] = useState(false)

  const [approveOpen, setApproveOpen] = useState(false)
  const [generateIdCard, setGenerateIdCard] = useState(true)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [uploading, setUploading] = useState(null)
  const skipDetailFetchRef = useRef(false)
  const loadSeqRef = useRef(0)

  const listFallback = () => initialMember || member

  const load = async () => {
    if (!profileId) return
    const fallback = listFallback()
    if (skipDetailFetchRef.current && fallback) {
      setMember({ ...fallback, _fromListFallback: true })
      setDetailUnavailable(true)
      return
    }

    const seq = ++loadSeqRef.current
    setLoading(true)
    try {
      const data = await fetchUnionMember(profileId, fallback)
      if (seq !== loadSeqRef.current) return
      setMember(data)
      setDetailUnavailable(Boolean(data?._fromListFallback))
      if (data?._fromListFallback) skipDetailFetchRef.current = true
    } catch (err) {
      if (seq !== loadSeqRef.current) return
      if (fallback) {
        setMember({ ...fallback, _fromListFallback: true })
        setDetailUnavailable(true)
        skipDetailFetchRef.current = true
      } else if (!shouldSilenceMemberLoadError(err)) {
        toast.error(formatJournalistApiError(err, 'Failed to load member'))
        setMember(null)
        setDetailUnavailable(false)
      } else {
        setMember(null)
        setDetailUnavailable(false)
      }
    } finally {
      if (seq === loadSeqRef.current) setLoading(false)
    }
  }

  const handleProfileSaved = (updated) => {
    if (updated && typeof updated === 'object') {
      setMember((m) => ({ ...m, ...updated, _fromListFallback: false }))
      setDetailUnavailable(false)
    }
    onUpdated?.()
  }

  useEffect(() => {
    skipDetailFetchRef.current = false
    if (initialMember) setMember(initialMember)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId])

  useEffect(() => {
    if (!loading && member && initialSection === 'insurance') {
      document.getElementById('member-insurance')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [loading, member, initialSection])

  const refresh = async () => {
    await load()
    onUpdated?.()
  }

  const updateDocuments = async (keys, action) => {
    if (!profileId || !keys?.length) return
    setDocSaving(true)
    try {
      const res = await patchMemberDocuments(profileId, keys, action)
      toast.success(res?.message || `Documents ${action}d`)
      await refresh()
    } catch (err) {
      toast.error(formatDocActionError(err, `Document ${action} failed`))
    } finally {
      setDocSaving(false)
    }
  }

  const handleApproveMembership = async () => {
    if (!profileId) return
    setMembershipSaving(true)
    try {
      const res = await approveMembership(profileId, {
        approved: true,
        generateIdCard,
      })
      const idCardInfo = parseApproveIdCardResult(res)
      if (idCardInfo.generated) {
        toast.success(idCardInfo.message)
      } else if (idCardInfo.skipped) {
        toast.error(idCardInfo.message)
      } else {
        toast.success(res?.message || 'Membership approved')
        if (generateIdCard) toast.error(idCardInfo.message)
      }
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
      const res = await approveMembership(profileId, {
        approved: false,
        reason: rejectReason.trim() || undefined,
      })
      toast.success(res?.message || 'Membership rejected')
      setRejectOpen(false)
      setRejectReason('')
      await refresh()
    } catch (err) {
      toast.error(formatDocActionError(err, 'Reject failed'))
    } finally {
      setMembershipSaving(false)
    }
  }

  const handleUpload = async (docKey, file) => {
    if (!file || !profileId) return
    const labels = { photo: 'Photo', aadhaar: 'Aadhaar', pan: 'PAN', workingIdCard: 'Working ID' }
    setUploading(docKey)
    try {
      const fd = new FormData()
      if (docKey === 'photo') {
        fd.append('file', file)
        await unionAdminApi.uploadPhoto(profileId, fd)
      } else {
        fd.append('document', docKey)
        fd.append('file', file)
        await unionAdminApi.uploadDocument(profileId, fd)
      }
      toast.success(`${labels[docKey] || docKey} uploaded — pending approval`)
      await refresh()
    } catch (err) {
      toast.error(formatDocActionError(err, 'Upload failed'))
    } finally {
      setUploading(null)
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
  const docLabels = {
    photo: 'Photo',
    aadhaar: 'Aadhaar',
    pan: 'PAN',
    workingIdCard: 'Working ID',
  }

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{memberName(member)}</h3>
        <p className="text-sm text-slate-500 tabular-nums">{memberMobile(member)}</p>
      </div>

      {detailUnavailable ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Full profile could not load from the server (backend <code className="text-[11px]">User.mobile</code> bug).
          Showing list data — use <strong>Edit profile</strong> below to update details and save.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={membershipStatusKey(member)} />
        {member.pendingActions?.map((a) => {
          const label = String(a)
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
          return <StatusBadge key={a} label={label} color="yellow" />
        })}
      </div>

      <MemberProfileEdit
        profileId={profileId}
        member={member}
        onSaved={handleProfileSaved}
      />

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

      <Card title="Upload documents (admin)">
        <p className="text-xs text-slate-500 mb-3">
          Step 3–4: Upload on behalf of member. Status becomes PENDING until you approve.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {DOC_KEYS.map((key) => (
            <label
              key={key}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50"
            >
              <span className="font-medium text-slate-700">{docLabels[key]}</span>
              <span className="text-xs text-brand">
                {uploading === key ? 'Uploading…' : 'Choose file'}
              </span>
              <input
                type="file"
                accept="image/*,.pdf,application/pdf"
                className="hidden"
                disabled={Boolean(uploading)}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(key, file)
                  e.target.value = ''
                }}
              />
            </label>
          ))}
        </div>
      </Card>

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

      <Card title="Account details">
        <CardRow label="Member type" value={memberTypeLabel(member)} />
        <CardRow label="Press ID" value={pressIdDisplay(member) || '—'} />
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

      <MemberPressCardSection profileId={profileId} member={member} onRefresh={refresh} />

      <MemberInsuranceSection
        profileId={profileId}
        member={member}
        onRefresh={refresh}
        forceLoadApplications={initialSection === 'insurance'}
      />

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
