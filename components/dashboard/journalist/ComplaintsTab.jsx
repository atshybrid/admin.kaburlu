/**
 * Complaints Tab — Journalist Union Admin
 * List complaints; update status and add admin note
 */

import { useState, useEffect, useCallback } from 'react'
import { journalistApi } from '../../../lib/api/services/journalistApi'
import {
  DataTable,
  StatusBadge,
  Button,
  Modal,
  FormField,
  Input,
  Select,
  Dropdown,
  DropdownItem,
  toast,
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

const STATUS_COLOR = {
  OPEN: 'yellow',
  IN_PROGRESS: 'blue',
  CLOSED: 'gray',
}

export default function ComplaintsTab() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter]   = useState('OPEN')

  // Edit modal
  const [editTarget, setEditTarget]   = useState(null)
  const [editForm, setEditForm]       = useState({ status: 'IN_PROGRESS', adminNote: '' })
  const [editLoading, setEditLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await journalistApi.listComplaints(filter !== 'ALL' ? { status: filter } : {})
      setItems(Array.isArray(data) ? data : data?.complaints ?? data?.data ?? [])
    } catch (err) {
      toast.error(err.message || 'Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const openEdit = (row) => {
    setEditTarget(row)
    setEditForm({ status: row.status || 'IN_PROGRESS', adminNote: row.adminNote || '' })
  }

  const handleUpdate = async () => {
    if (!editTarget) return
    setEditLoading(true)
    try {
      await journalistApi.updateComplaint(editTarget.id, editForm)
      toast.success('Complaint updated')
      setEditTarget(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Update failed')
    } finally {
      setEditLoading(false)
    }
  }

  const columns = [
    {
      header: 'Member',
      accessor: 'journalistProfile',
      render: (v) => (
        <div>
          <p className="font-medium text-gray-900">{v?.user?.profile?.fullName || '—'}</p>
          <p className="text-xs text-gray-500">{v?.user?.mobileNumber || '—'}</p>
        </div>
      )
    },
    {
      header: 'Title',
      accessor: 'title',
      render: (v) => <span className="font-medium text-gray-800 text-sm">{v || '—'}</span>
    },
    {
      header: 'Location',
      accessor: 'location',
      render: (v) => <span className="text-sm text-gray-500">{v || '—'}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (v) => <StatusBadge color={STATUS_COLOR[v] || 'gray'} label={v} />
    },
    {
      header: 'Admin Note',
      accessor: 'adminNote',
      render: (v) => <span className="text-xs text-gray-500 max-w-xs truncate block">{v || '—'}</span>
    },
    {
      header: 'Filed',
      accessor: 'createdAt',
      render: (v) => <span className="text-xs text-gray-400">{fmt(v)}</span>
    },
    {
      header: '',
      accessor: 'id',
      render: (_, row) => (
        <Dropdown trigger={<button className="p-1 rounded hover:bg-gray-100"><IconMoreVertical className="w-4 h-4 text-gray-500" /></button>}>
          <DropdownItem onClick={() => openEdit(row)}>Update Status</DropdownItem>
        </Dropdown>
      )
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {['OPEN', 'IN_PROGRESS', 'CLOSED', 'ALL'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-brand text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'IN_PROGRESS' ? 'In Progress' : s.charAt(0) + s.slice(1).toLowerCase()}
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
        emptyMessage="No complaints found"
        rowKey="id"
      />

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Update Complaint">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded p-3">
            <p className="font-medium text-gray-800 text-sm">{editTarget?.title}</p>
            <p className="text-gray-500 text-sm mt-1">{editTarget?.description}</p>
            {editTarget?.location && (
              <p className="text-xs text-gray-400 mt-1">Location: {editTarget.location}</p>
            )}
          </div>
          <FormField label="Status">
            <Select
              value={editForm.status}
              onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
              options={[
                { value: 'OPEN', label: 'Open' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'CLOSED', label: 'Closed' },
              ]}
            />
          </FormField>
          <FormField label="Admin Note">
            <Input
              placeholder="Update note for the member…"
              value={editForm.adminNote}
              onChange={(e) => setEditForm(f => ({ ...f, adminNote: e.target.value }))}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button variant="primary" loading={editLoading} onClick={handleUpdate}>Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
