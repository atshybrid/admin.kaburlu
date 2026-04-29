/**
 * KYC Tab — Journalist Union Admin
 * View submitted KYC docs; verify or reject with reason
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
  Dropdown,
  DropdownItem,
  toast,
  IconEye,
  IconMoreVertical,
} from '../../ui'

function fmt(v) {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (isNaN(d)) return v
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  } catch { return v }
}

function DocImage({ url, label }) {
  if (!url) return <p className="text-gray-400 text-sm">{label}: not uploaded</p>
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">{label}</p>
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt={label} className="max-h-48 rounded border object-contain w-full" />
      </a>
    </div>
  )
}

export default function KycTab() {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting]       = useState(false)
  const [verifying, setVerifying]       = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await journalistApi.listKyc()
      setItems(Array.isArray(data) ? data : data?.profiles ?? data?.data ?? [])
    } catch (err) {
      toast.error(err.message || 'Failed to load KYC list')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleVerify = async (profileId) => {
    setVerifying(profileId)
    try {
      await journalistApi.verifyKyc(profileId)
      toast.success('KYC verified')
      load()
    } catch (err) {
      toast.error(err.message || 'Verification failed')
    } finally {
      setVerifying(null)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    setRejecting(true)
    try {
      await journalistApi.rejectKyc(rejectTarget.id, rejectReason.trim())
      toast.success('KYC rejected')
      setRejectTarget(null)
      setRejectReason('')
      load()
    } catch (err) {
      toast.error(err.message || 'Rejection failed')
    } finally {
      setRejecting(false)
    }
  }

  const columns = [
    {
      header: 'Member',
      accessor: 'user',
      render: (v, row) => (
        <div>
          <p className="font-medium text-gray-900">{v?.profile?.fullName || '—'}</p>
          <p className="text-xs text-gray-500">{v?.mobileNumber || '—'}</p>
        </div>
      )
    },
    {
      header: 'Press ID',
      accessor: 'pressId',
      render: (v) => <span className="font-mono text-sm text-brand">{v || '—'}</span>
    },
    {
      header: 'Aadhaar Last 4',
      accessor: 'aadhaarNumber',
      render: (v) => <span className="text-sm">{v ? `XXXX XXXX ${v}` : '—'}</span>
    },
    {
      header: 'Photo',
      accessor: 'photoUrl',
      render: (v) => (
        <StatusBadge color={v ? 'green' : 'gray'} label={v ? 'Uploaded' : 'Missing'} />
      )
    },
    {
      header: 'Aadhaar',
      accessor: 'aadhaarUrl',
      render: (v) => (
        <StatusBadge color={v ? 'green' : 'gray'} label={v ? 'Uploaded' : 'Missing'} />
      )
    },
    {
      header: 'KYC Status',
      accessor: 'kycVerified',
      render: (v) => <StatusBadge color={v ? 'green' : 'yellow'} label={v ? 'Verified' : 'Pending'} />
    },
    {
      header: '',
      accessor: 'id',
      render: (_, row) => (
        <Dropdown trigger={<button className="p-1 rounded hover:bg-gray-100"><IconMoreVertical className="w-4 h-4 text-gray-500" /></button>}>
          <DropdownItem icon={<IconEye />} onClick={() => { setSelected(row); setPanelOpen(true) }}>
            View Docs
          </DropdownItem>
          {!row.kycVerified && (
            <>
              <DropdownItem
                onClick={() => handleVerify(row.id)}
                disabled={verifying === row.id}
                className="text-green-600"
              >
                {verifying === row.id ? 'Verifying…' : 'Verify KYC'}
              </DropdownItem>
              <DropdownItem
                onClick={() => { setRejectTarget(row); setRejectReason('') }}
                className="text-red-600"
              >
                Reject KYC
              </DropdownItem>
            </>
          )}
        </Dropdown>
      )
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={load} loading={loading}>Refresh</Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No KYC submissions found"
        rowKey="id"
      />

      {/* Docs panel */}
      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title="KYC Documents" width="md">
        {selected && (
          <div className="space-y-4 p-4">
            <Card title="Work Details">
              <CardRow label="Current Newspaper"  value={selected.currentNewspaper || '—'} />
              <CardRow label="Current Designation" value={selected.currentDesignation || '—'} />
              <CardRow label="Joining Date"        value={fmt(selected.joiningDate)} />
              <CardRow label="Experience"          value={selected.totalExperienceYears ? `${selected.totalExperienceYears} years` : '—'} />
              <CardRow label="Additional Info"     value={selected.additionalInfo || '—'} />
            </Card>
            <div className="space-y-3">
              <DocImage url={selected.photoUrl}      label="Photo" />
              <DocImage url={selected.aadhaarUrl}    label="Aadhaar Front" />
              <DocImage url={selected.aadhaarBackUrl} label="Aadhaar Back" />
            </div>
            {!selected.kycVerified && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  loading={verifying === selected.id}
                  onClick={() => { handleVerify(selected.id); setPanelOpen(false) }}
                >
                  Verify KYC
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

      {/* Reject modal */}
      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject KYC">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Reject KYC for <strong>{rejectTarget?.user?.profile?.fullName || rejectTarget?.user?.mobileNumber}</strong>?
          </p>
          <FormField label="Reason">
            <Input
              placeholder="Reason for KYC rejection…"
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
