/**
 * Modern Users View (MVP Pattern - View Layer)
 */

import { useState } from 'react'
import { useUsers } from '../../../hooks/useUsers'
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
  IconEdit,
  IconTrash,
  IconEye,
  IconMoreVertical
} from '../../ui'

export default function ModernUsersView() {
  const {
    users,
    loading,
    error,
    fetch,
    create,
    remove,
    selected,
    setSelected,
    isCreating,
    openCreate,
    closeCreate,
    operationLoading,
    updateStatus
  } = useUsers()

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [formData, setFormData] = useState({
    mobileNumber: '',
    email: '',
    roleId: ''
  })
  const [formError, setFormError] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!formData.mobileNumber && !formData.email) {
      setFormError('Mobile number or email is required')
      return
    }

    const result = await create(formData)
    if (result.success) {
      toast.success('User created successfully')
      setFormData({ mobileNumber: '', email: '', roleId: '' })
    } else {
      setFormError(result.error)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await remove(deleteTarget.id)
    if (result.success) {
      toast.success('User deleted successfully')
    } else {
      toast.error(result.error)
    }
    setDeleteTarget(null)
  }

  const handleStatusChange = async (userId, status) => {
    const result = await updateStatus(userId, status)
    if (result.success) {
      toast.success('Status updated')
    } else {
      toast.error(result.error)
    }
  }

  const columns = [
    {
      header: 'Mobile',
      accessor: 'mobileNumber',
      render: (value) => (
        <span className="font-medium text-gray-900">{value || '—'}</span>
      )
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (value) => value || <span className="text-gray-400">—</span>
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (role) => role?.name || <span className="text-gray-400">—</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => <StatusBadge status={value || 'active'} />
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      type: 'date'
    }
  ]

  const renderActions = (row) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="xs"
        leftIcon={<IconEye className="w-3.5 h-3.5" />}
        onClick={() => setSelected(row)}
      >
        View
      </Button>
      <Dropdown
        trigger={
          <button className="p-1.5 rounded-lg hover:bg-gray-100">
            <IconMoreVertical className="w-4 h-4 text-gray-500" />
          </button>
        }
      >
        {({ close }) => (
          <>
            <DropdownItem
              onClick={() => { handleStatusChange(row.id, 'ACTIVE'); close() }}
            >
              Activate
            </DropdownItem>
            <DropdownItem
              onClick={() => { handleStatusChange(row.id, 'SUSPENDED'); close() }}
            >
              Suspend
            </DropdownItem>
            <DropdownItem
              icon={<IconTrash className="w-4 h-4" />}
              danger
              onClick={() => { setDeleteTarget(row); close() }}
            >
              Delete
            </DropdownItem>
          </>
        )}
      </Dropdown>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage user accounts and permissions
        </p>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        error={error}
        searchable
        searchPlaceholder="Search by mobile, email..."
        onRefresh={fetch}
        onCreate={openCreate}
        createLabel="Add User"
        actions={renderActions}
        emptyTitle="No users found"
        emptySubtitle="Add your first user to get started"
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreating}
        onClose={closeCreate}
        title="Add New User"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="default" onClick={closeCreate}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} loading={operationLoading}>
              Create User
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Mobile Number">
            <Input
              type="tel"
              value={formData.mobileNumber}
              onChange={(e) => setFormData(d => ({ ...d, mobileNumber: e.target.value }))}
              placeholder="+91 9876543210"
            />
          </FormField>

          <FormField label="Email">
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(d => ({ ...d, email: e.target.value }))}
              placeholder="user@example.com"
            />
          </FormField>

          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}
        </form>
      </Modal>

      {/* Detail Panel */}
      <SlidePanel
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="User Details"
        subtitle={selected?.email || selected?.mobileNumber}
      >
        {selected && (
          <div className="space-y-6">
            <Card title="Account Information">
              <div className="space-y-1">
                <CardRow label="Mobile Number" value={selected.mobileNumber} />
                <CardRow label="Email" value={selected.email} />
                <CardRow label="Status" value={<StatusBadge status={selected.status} />} />
                <CardRow label="Created" value={selected.createdAt ? new Date(selected.createdAt).toLocaleString() : null} />
              </div>
            </Card>

            {selected.role && (
              <Card title="Role & Permissions">
                <CardRow label="Role" value={selected.role.name} />
                <CardRow
                  label="Permissions"
                  value={
                    Array.isArray(selected.role.permissions)
                      ? selected.role.permissions.join(', ') || 'None'
                      : 'None'
                  }
                />
              </Card>
            )}
          </div>
        )}
      </SlidePanel>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete this user? This action cannot be undone.`}
        confirmText="Delete"
        loading={operationLoading}
      />
    </div>
  )
}
