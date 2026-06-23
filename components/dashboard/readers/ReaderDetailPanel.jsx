/**
 * Reader detail — approve, reject, link mobile, upgrade
 */

import { useState } from 'react'
import { readersAdminApi } from '../../../lib/api/services/readersAdminApi'
import { formatReaderAdminError } from '../../../lib/readers/readerErrors'
import PersonaBadge from './PersonaBadge'
import ApprovalStatusBadge from './ApprovalStatusBadge'
import RejectReaderModal from './RejectReaderModal'
import { Button, FormField, Input, SlidePanel, toast } from '../../ui'

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

export default function ReaderDetailPanel({ open, reader, onClose, onChanged }) {
  const [busy, setBusy] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [mobileInput, setMobileInput] = useState('')

  if (!reader) return null

  const profile = reader.readerProfile || {}
  const userId = reader.userId
  const isPending = profile.approvalStatus === 'PENDING_APPROVAL'
  const canUpgrade =
    reader.canUpgradeToCitizenReporter ||
    (reader.role === 'READER' && profile.persona === 'reader')

  const run = async (fn, successMsg) => {
    setBusy(true)
    try {
      await fn()
      toast.success(successMsg)
      onChanged?.()
      onClose?.()
    } catch (err) {
      toast.error(formatReaderAdminError(err, 'Action failed'))
    } finally {
      setBusy(false)
    }
  }

  const handleApprove = () =>
    run(() => readersAdminApi.approve(userId), 'Approved')

  const handleReject = async (reason) => {
    setBusy(true)
    try {
      await readersAdminApi.reject(userId, reason)
      toast.success('Rejected')
      setRejectOpen(false)
      onChanged?.()
      onClose?.()
    } catch (err) {
      toast.error(formatReaderAdminError(err, 'Reject failed'))
    } finally {
      setBusy(false)
    }
  }

  const handleLinkMobile = async () => {
    const mobile = digitsOnly(mobileInput)
    if (mobile.length < 10) {
      toast.error('Enter a valid 10-digit mobile')
      return
    }
    await run(() => readersAdminApi.linkMobile(userId, mobile), 'Mobile linked')
  }

  const handleUpgrade = () =>
    run(
      () => readersAdminApi.upgradeCitizenReporter(userId),
      'Upgraded to Citizen Reporter',
    )

  return (
    <>
      <SlidePanel
        open={open}
        onClose={onClose}
        title={reader.displayName}
        subtitle={reader.email || reader.mobileNumber || userId}
        width="md"
      >
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <PersonaBadge persona={profile.persona} label={profile.personaLabel} />
            <ApprovalStatusBadge status={profile.approvalStatus} />
          </div>

          <dl className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt className="text-xs text-slate-400 uppercase tracking-wide">User ID</dt>
              <dd className="font-mono text-slate-700 break-all">{userId}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400 uppercase tracking-wide">Mobile</dt>
              <dd className="text-slate-800">{reader.mobileNumber || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400 uppercase tracking-wide">Email</dt>
              <dd className="text-slate-800">{reader.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400 uppercase tracking-wide">Role</dt>
              <dd className="text-slate-800">{reader.role || 'READER'}</dd>
            </div>
            {profile.subRoleLabel ? (
              <div>
                <dt className="text-xs text-slate-400 uppercase tracking-wide">Sub-role</dt>
                <dd className="text-slate-800">{profile.subRoleLabel}</dd>
              </div>
            ) : null}
            {profile.departmentName ? (
              <div>
                <dt className="text-xs text-slate-400 uppercase tracking-wide">Department</dt>
                <dd className="text-slate-800">{profile.departmentName}</dd>
              </div>
            ) : null}
            {profile.organizationName ? (
              <div>
                <dt className="text-xs text-slate-400 uppercase tracking-wide">Organization</dt>
                <dd className="text-slate-800">{profile.organizationName}</dd>
              </div>
            ) : null}
            {profile.rejectionReason ? (
              <div>
                <dt className="text-xs text-slate-400 uppercase tracking-wide">Rejection reason</dt>
                <dd className="text-rose-700">{profile.rejectionReason}</dd>
              </div>
            ) : null}
          </dl>

          {isPending ? (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <Button onClick={handleApprove} loading={busy} variant="success" size="sm">
                Approve
              </Button>
              <Button
                onClick={() => setRejectOpen(true)}
                disabled={busy}
                variant="outline-danger"
                size="sm"
              >
                Reject
              </Button>
            </div>
          ) : null}

          {!reader.mobileNumber ? (
            <div className="rounded-lg border border-slate-200 p-4 space-y-3">
              <p className="text-sm font-medium text-slate-800">Link mobile</p>
              <FormField label="Mobile number">
                <Input
                  value={mobileInput}
                  onChange={(e) => setMobileInput(digitsOnly(e.target.value).slice(0, 10))}
                  placeholder="9876543210"
                />
              </FormField>
              <Button onClick={handleLinkMobile} loading={busy} size="sm">
                Link mobile
              </Button>
            </div>
          ) : null}

          {canUpgrade && reader.role !== 'CITIZEN_REPORTER' ? (
            <div className="rounded-lg border border-sky-100 bg-sky-50/50 p-4">
              <p className="text-sm font-medium text-slate-800">Citizen reporter upgrade</p>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Grants short-news create permission and media upload.
              </p>
              <Button onClick={handleUpgrade} loading={busy} size="sm">
                Upgrade to citizen reporter
              </Button>
            </div>
          ) : null}
        </div>
      </SlidePanel>

      <RejectReaderModal
        isOpen={rejectOpen}
        reader={reader}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
        busy={busy}
      />
    </>
  )
}
