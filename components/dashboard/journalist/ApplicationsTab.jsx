/**
 * Applications Tab — Journalist Union Admin
 * Lists applications by status; supports approve / reject actions
 */

import { useState, useEffect, useCallback } from 'react'
import { journalistApi } from '../../../lib/api/services/journalistApi'
import {
  DataTable,
  StatusBadge,
  Button,
  SlidePanel,
  Modal,
  Card,
  CardRow,
  FormField,
  Input,
  Select,
  ConfirmDialog,
  Dropdown,
  DropdownItem,
  toast,
  Tabs,
  IconEye,
  IconMoreVertical,
} from '../../ui'

const STATUS_COLORS = {
  PENDING: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
}

function fmt(v) {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (isNaN(d)) return v
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  } catch { return v }
}

export default function ApplicationsTab() {
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)

  // Approve modal
  const [approveTarget, setApproveTarget] = useState(null)
  const [pressId, setPressId]             = useState('')
  const [approving, setApproving]         = useState(false)

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting]       = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await journalistApi.listApplications({ status: statusFilter })
      setItems(Array.isArray(data) ? data : data?.applications ?? data?.data ?? [])
    } catch (err) {
      toast.error(err.message || 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const handleApprove = async () => {
    if (!approveTarget) return
    setApproving(true)
    try {
      await journalistApi.approveApplication(approveTarget.id, pressId.trim())
      toast.success('Application approved')
      setApproveTarget(null)
      setPressId('')
      load()
    } catch (err) {
      toast.error(err.message || 'Approve failed')
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    setRejecting(true)
    try {
      await journalistApi.rejectApplication(rejectTarget.id, rejectReason.trim())
      toast.success('Application rejected')
      setRejectTarget(null)
      setRejectReason('')
      load()
    } catch (err) {
      toast.error(err.message || 'Reject failed')
    } finally {
      setRejecting(false)
    }
  }

  const columns = [
    {
      header: 'Journalist',
      accessor: 'user',
      render: (v, row) => (
        <div>
          <p className="font-medium text-gray-900">{v?.profile?.fullName || '—'}</p>
          <p className="text-xs text-gray-500">{v?.mobileNumber || '—'}</p>
        </div>
      )
    },
    {
      header: 'Designation',
      accessor: 'designation',
      render: (v) => <span className="text-sm text-gray-700">{v || '—'}</span>
    },
    {
      header: 'Organisation',
      accessor: 'organization',
      render: (v) => <span className="text-sm text-gray-700">{v || '—'}</span>
    },
    {
      header: 'District',
      accessor: 'district',
      render: (v) => <span className="text-sm text-gray-500">{v || '—'}</span>
    },
    {
      header: 'Union',
      accessor: 'unionName',
      render: (v) => <span className="text-xs text-gray-500">{v || '—'}</span>
    },
    {
      header: 'Applied',
      accessor: 'createdAt',
      render: (v) => <span className="text-xs text-gray-400">{fmt(v)}</span>
    },
    {
      header: 'Status',
      accessor: 'approved',
      render: (v, row) => (
        <StatusBadge
          color={row.rejected ? 'red' : v ? 'green' : 'yellow'}
          label={row.rejected ? 'Rejected' : v ? 'Approved' : 'Pending'}
        />
      )
    },
    {
      header: '',
      accessor: 'id',
      render: (v, row) => (
        <Dropdown trigger={<button className="p-1 rounded hover:bg-gray-100"><IconMoreVertical className="w-4 h-4 text-gray-500" /></button>}>
          <DropdownItem
            icon={<IconEye />}
            onClick={() => { setSelected(row); setPanelOpen(true) }}
          >
            View Details
          </DropdownItem>
          {!row.approved && !row.rejected && (
            <>
              <DropdownItem
                onClick={() => { setApproveTarget(row); setPressId('') }}
                className="text-green-600"
              >
                Approve
              </DropdownItem>
              <DropdownItem
                onClick={() => { setRejectTarget(row); setRejectReason('') }}
                className="text-red-600"
              >
                Reject
              </DropdownItem>
            </>
          )}
        </Dropdown>
      )
    }
  ]

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-brand text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
        <Button variant="ghost" size="sm" onClick={load} loading={loading} className="ml-auto">
          Refresh
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No applications found"
        rowKey="id"
      />

      {/* Detail panel */}
      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Application Details"
        width="md"
      >
        {selected && (
          <div className="space-y-4 p-4">
            <Card title="Applicant">
              <CardRow label="Name"        value={selected.user?.profile?.fullName || '—'} />
              <CardRow label="Mobile"      value={selected.user?.mobileNumber || '—'} />
              <CardRow label="Designation" value={selected.designation || '—'} />
              <CardRow label="Organisation" value={selected.organization || '—'} />
              <CardRow label="Union"       value={selected.unionName || '—'} />
              <CardRow label="State"       value={selected.state || '—'} />
              <CardRow label="District"    value={selected.district || '—'} />
              <CardRow label="Mandal"      value={selected.mandal || '—'} />
              <CardRow label="Press ID"    value={selected.pressId || '—'} />
              <CardRow label="Applied"     value={fmt(selected.createdAt)} />
            </Card>
            {!selected.approved && !selected.rejected && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => { setPanelOpen(false); setApproveTarget(selected); setPressId('') }}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => { setPanelOpen(false); setRejectTarget(selected); setRejectReason('') }}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </SlidePanel>

      {/* Approve modal */}
      <Modal
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        title="Approve Application"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Approve <strong>{approveTarget?.user?.profile?.fullName || approveTarget?.user?.mobileNumber}</strong>?
          </p>
          <FormField label="Press ID (optional)">
            <Input
              placeholder="e.g. TWJF-2026-001"
              value={pressId}
              onChange={(e) => setPressId(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setApproveTarget(null)}>Cancel</Button>
            <Button variant="primary" loading={approving} onClick={handleApprove}>Approve</Button>
          </div>
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject Application"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Reject <strong>{rejectTarget?.user?.profile?.fullName || rejectTarget?.user?.mobileNumber}</strong>?
          </p>
          <FormField label="Reason">
            <Input
              placeholder="Reason for rejection…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={rejecting} onClick={handleReject}>Reject</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
