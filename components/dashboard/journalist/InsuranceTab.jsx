/**
 * Insurance Tab — Journalist Union Admin
 * Assign ACCIDENTAL/HEALTH insurance; update; view history per member
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

const defaultAssignForm = {
  type: 'ACCIDENTAL',
  policyNumber: '',
  insurer: '',
  coverAmount: '',
  validFrom: '',
  validTo: '',
}

export default function InsuranceTab() {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)

  // Assign modal
  const [assignTarget, setAssignTarget]   = useState(null)
  const [assignForm, setAssignForm]       = useState(defaultAssignForm)
  const [assigning, setAssigning]         = useState(false)

  // Edit modal
  const [editTarget, setEditTarget]       = useState(null)
  const [editForm, setEditForm]           = useState({})
  const [editLoading, setEditLoading]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await journalistApi.listInsurance()
      setItems(Array.isArray(data) ? data : data?.insurances ?? data?.data ?? [])
    } catch (err) {
      toast.error(err.message || 'Failed to load insurance records')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAssign = async () => {
    if (!assignTarget) return
    setAssigning(true)
    try {
      await journalistApi.assignMemberInsurance(assignTarget.journalistProfileId, {
        type: assignForm.type || 'ACCIDENTAL',
        policyNumber: assignForm.policyNumber,
        insurer: assignForm.insurer,
        coverAmount: Number(assignForm.coverAmount) || 0,
        validFrom: assignForm.validFrom,
        validTo: assignForm.validTo,
      })
      toast.success('Insurance assigned')
      setAssignTarget(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Assign failed')
    } finally {
      setAssigning(false)
    }
  }

  const handleEdit = async () => {
    if (!editTarget) return
    setEditLoading(true)
    try {
      await journalistApi.updateInsurance(editTarget.id, {
        ...editForm,
        coverAmount: Number(editForm.coverAmount) || 0,
      })
      toast.success('Insurance updated')
      setEditTarget(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Update failed')
    } finally {
      setEditLoading(false)
    }
  }

  const openEdit = (row) => {
    setEditTarget(row)
    setEditForm({
      type: row.type,
      policyNumber: row.policyNumber || '',
      insurer: row.insurer || '',
      coverAmount: String(row.coverAmount || ''),
      validFrom: row.validFrom ? new Date(row.validFrom).toISOString().split('T')[0] : '',
      validTo: row.validTo ? new Date(row.validTo).toISOString().split('T')[0] : '',
    })
  }

  const columns = [
    {
      header: 'Member',
      accessor: 'journalistProfile',
      render: (v) => (
        <div>
          <p className="font-medium text-gray-900">{v?.user?.profile?.fullName || '—'}</p>
          <p className="text-xs text-gray-500">{v?.pressId || v?.user?.mobileNumber || '—'}</p>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (v) => (
        <StatusBadge
          color={v === 'ACCIDENTAL' ? 'blue' : 'purple'}
          label={v}
        />
      )
    },
    {
      header: 'Policy No.',
      accessor: 'policyNumber',
      render: (v) => <span className="font-mono text-sm">{v || '—'}</span>
    },
    {
      header: 'Insurer',
      accessor: 'insurer',
      render: (v) => <span className="text-sm text-gray-600">{v || '—'}</span>
    },
    {
      header: 'Cover Amount',
      accessor: 'coverAmount',
      render: (v) => <span className="text-sm font-medium">₹{(v || 0).toLocaleString('en-IN')}</span>
    },
    {
      header: 'Valid Until',
      accessor: 'validTo',
      render: (v) => (
        <span className={`text-sm ${new Date(v) < new Date() ? 'text-red-500' : 'text-gray-600'}`}>
          {fmt(v)}
        </span>
      )
    },
    {
      header: 'Active',
      accessor: 'isActive',
      render: (v) => <StatusBadge color={v ? 'green' : 'gray'} label={v ? 'Active' : 'Inactive'} />
    },
    {
      header: '',
      accessor: 'id',
      render: (_, row) => (
        <Dropdown trigger={<button className="p-1 rounded hover:bg-gray-100"><IconMoreVertical className="w-4 h-4 text-gray-500" /></button>}>
          <DropdownItem icon={<IconEye />} onClick={() => { setSelected(row); setPanelOpen(true) }}>View</DropdownItem>
          <DropdownItem onClick={() => openEdit(row)}>Edit Policy</DropdownItem>
          <DropdownItem
            onClick={() => {
              setAssignTarget({ ...row.journalistProfile, journalistProfileId: row.journalistProfile?.id })
              setAssignForm(defaultAssignForm)
            }}
          >
            Add Another Policy
          </DropdownItem>
        </Dropdown>
      )
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={load} loading={loading}>Refresh</Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No insurance records found"
        rowKey="id"
      />

      {/* Detail panel */}
      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title="Insurance Details" width="md">
        {selected && (
          <div className="space-y-4 p-4">
            <Card title="Policy">
              <CardRow label="Type"          value={selected.type} />
              <CardRow label="Policy No."    value={selected.policyNumber || '—'} />
              <CardRow label="Insurer"       value={selected.insurer || '—'} />
              <CardRow label="Cover Amount"  value={`₹${(selected.coverAmount || 0).toLocaleString('en-IN')}`} />
              <CardRow label="Valid From"    value={fmt(selected.validFrom)} />
              <CardRow label="Valid To"      value={fmt(selected.validTo)} />
              <CardRow label="Status"        value={<StatusBadge color={selected.isActive ? 'green' : 'gray'} label={selected.isActive ? 'Active' : 'Inactive'} />} />
            </Card>
          </div>
        )}
      </SlidePanel>

      {/* Assign modal */}
      <Modal open={!!assignTarget} onClose={() => setAssignTarget(null)} title="Assign Insurance">
        <InsuranceForm form={assignForm} setForm={setAssignForm} />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setAssignTarget(null)}>Cancel</Button>
          <Button variant="primary" loading={assigning} onClick={handleAssign}>Assign</Button>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Insurance Policy">
        <InsuranceForm form={editForm} setForm={setEditForm} />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setEditTarget(null)}>Cancel</Button>
          <Button variant="primary" loading={editLoading} onClick={handleEdit}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}

function InsuranceForm({ form, setForm }) {
  return (
    <div className="space-y-3">
      <FormField label="Type">
        <Select
          value={form.type}
          onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
          options={[
            { value: 'ACCIDENTAL', label: 'Accidental' },
            { value: 'HEALTH', label: 'Health' },
          ]}
        />
      </FormField>
      <FormField label="Policy Number">
        <Input
          placeholder="e.g. LIC/ACC/2026/00421"
          value={form.policyNumber}
          onChange={(e) => setForm(f => ({ ...f, policyNumber: e.target.value }))}
        />
      </FormField>
      <FormField label="Insurer">
        <Input
          placeholder="e.g. LIC of India"
          value={form.insurer}
          onChange={(e) => setForm(f => ({ ...f, insurer: e.target.value }))}
        />
      </FormField>
      <FormField label="Cover Amount (₹)">
        <Input
          type="number"
          placeholder="500000"
          value={form.coverAmount}
          onChange={(e) => setForm(f => ({ ...f, coverAmount: e.target.value }))}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Valid From">
          <Input type="date" value={form.validFrom} onChange={(e) => setForm(f => ({ ...f, validFrom: e.target.value }))} />
        </FormField>
        <FormField label="Valid To">
          <Input type="date" value={form.validTo} onChange={(e) => setForm(f => ({ ...f, validTo: e.target.value }))} />
        </FormField>
      </div>
    </div>
  )
}
