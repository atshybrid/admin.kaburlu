import { useState } from 'react'
import { tenantLifecycleApi } from '../../lib/api/services/tenantLifecycleApi'
import { tenantAvailability } from '../../lib/tenant/isActiveTenant'
import { Button, FormField, Input, Modal, toast } from '../ui'

function AvailabilityPill({ tenant }) {
  const a = tenantAvailability(tenant)
  const styles = {
    active: 'bg-emerald-100 text-emerald-800',
    suspended: 'bg-amber-100 text-amber-800',
    deleted: 'bg-rose-100 text-rose-800',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${styles[a] || 'bg-slate-100 text-slate-600'}`}>
      {a}
    </span>
  )
}

export function TenantAvailabilityBadge({ tenant }) {
  return <AvailabilityPill tenant={tenant} />
}

export default function TenantLifecycleActions({ tenant, onDone, compact }) {
  const [modal, setModal] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const availability = tenantAvailability(tenant)

  const run = async (action) => {
    setBusy(true)
    try {
      if (action === 'suspend') {
        await tenantLifecycleApi.suspend(tenant.id, reason.trim() || undefined)
        toast.success('Tenant suspended')
      } else if (action === 'unsuspend') {
        await tenantLifecycleApi.unsuspend(tenant.id)
        toast.success('Tenant unsuspended — re-activate domains manually')
      } else if (action === 'delete') {
        await tenantLifecycleApi.softDelete(tenant.id, reason.trim() || undefined)
        toast.success('Tenant soft-deleted (hidden from public)')
      } else if (action === 'restore') {
        await tenantLifecycleApi.restore(tenant.id)
        toast.success('Tenant restored — re-activate domains manually')
      }
      setModal(null)
      setReason('')
      onDone?.()
    } catch (err) {
      toast.error(err.message || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  const open = (type) => {
    setReason('')
    setModal(type)
  }

  const stop = (e) => e.stopPropagation()

  return (
    <div className={`flex flex-wrap justify-end gap-1 ${compact ? '' : ''}`} onClick={stop}>
      {availability === 'active' ? (
        <>
          <Button type="button" size="sm" variant="ghost" onClick={() => open('suspend')}>
            Suspend
          </Button>
          <Button type="button" size="sm" variant="ghost" className="text-rose-700" onClick={() => open('delete')}>
            Delete
          </Button>
        </>
      ) : null}
      {availability === 'suspended' ? (
        <>
          <Button type="button" size="sm" variant="ghost" onClick={() => run('unsuspend')} disabled={busy}>
            Unsuspend
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => open('restore')}>
            Restore
          </Button>
        </>
      ) : null}
      {availability === 'deleted' ? (
        <Button type="button" size="sm" variant="primary" onClick={() => open('restore')}>
          Restore
        </Button>
      ) : null}

      <Modal
        isOpen={modal === 'suspend' || modal === 'delete'}
        onClose={() => setModal(null)}
        title={modal === 'suspend' ? 'Suspend tenant' : 'Soft delete tenant'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button
              loading={busy}
              variant={modal === 'delete' ? 'primary' : 'primary'}
              className={modal === 'delete' ? 'bg-rose-600 hover:bg-rose-700' : ''}
              onClick={() => run(modal === 'suspend' ? 'suspend' : 'delete')}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 mb-4">
          {modal === 'suspend'
            ? 'Domains will be marked unavailable. Public APIs will return no data for this newspaper.'
            : 'Tenant hidden from lists. Domain resolution blocked. This is reversible via Restore.'}
        </p>
        <FormField label="Reason (optional)">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Short note for audit" />
        </FormField>
      </Modal>

      <Modal
        isOpen={modal === 'restore'}
        onClose={() => setModal(null)}
        title="Restore tenant"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button loading={busy} onClick={() => run('restore')}>Restore</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Clears suspend/delete flags. You must manually set each domain back to <strong>ACTIVE</strong> in tenant admin.
        </p>
      </Modal>
    </div>
  )
}
