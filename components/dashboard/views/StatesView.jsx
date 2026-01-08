/**
 * Modern States View (MVP Pattern - View Layer)
 */

import { useState } from 'react'
import { useStates } from '../../../hooks/useLocations'
import {
  DataTable,
  Button,
  Modal,
  SlidePanel,
  Card,
  CardRow,
  FormField,
  Input,
  ConfirmDialog,
  Dropdown,
  DropdownItem,
  toast,
  IconEdit,
  IconTrash,
  IconMoreVertical
} from '../../ui'

export default function ModernStatesView() {
  const {
    states,
    loading,
    error,
    fetch,
    create,
    update,
    remove,
    selected,
    setSelected,
    isCreating,
    isEditing,
    openCreate,
    closeCreate,
    openEdit,
    closeEdit,
    operationLoading
  } = useStates()

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [formData, setFormData] = useState({ name: '', code: '' })
  const [formError, setFormError] = useState('')

  const resetForm = () => {
    setFormData({ name: '', code: '' })
    setFormError('')
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setFormError('Name is required')
      return
    }

    const result = await create(formData)
    if (result.success) {
      toast.success('State created successfully')
      resetForm()
    } else {
      setFormError(result.error)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setFormError('Name is required')
      return
    }

    const result = await update(selected.id, formData)
    if (result.success) {
      toast.success('State updated successfully')
      resetForm()
    } else {
      setFormError(result.error)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await remove(deleteTarget.id)
    if (result.success) {
      toast.success('State deleted successfully')
    } else {
      toast.error(result.error)
    }
    setDeleteTarget(null)
  }

  const handleOpenEdit = (row) => {
    setFormData({ name: row.name || '', code: row.code || '' })
    openEdit(row)
  }

  const columns = [
    {
      header: 'State Name',
      accessor: 'name',
      render: (value) => <span className="font-medium text-gray-900">{value}</span>
    },
    {
      header: 'Code',
      accessor: 'code',
      render: (value) => value || <span className="text-gray-400">—</span>
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
        leftIcon={<IconEdit className="w-3.5 h-3.5" />}
        onClick={() => handleOpenEdit(row)}
      >
        Edit
      </Button>
      <Dropdown
        trigger={
          <button className="p-1.5 rounded-lg hover:bg-gray-100">
            <IconMoreVertical className="w-4 h-4 text-gray-500" />
          </button>
        }
      >
        {({ close }) => (
          <DropdownItem
            icon={<IconTrash className="w-4 h-4" />}
            danger
            onClick={() => { setDeleteTarget(row); close() }}
          >
            Delete
          </DropdownItem>
        )}
      </Dropdown>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">States</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage states for location hierarchy
        </p>
      </div>

      <DataTable
        columns={columns}
        data={states}
        loading={loading}
        error={error}
        searchable
        searchPlaceholder="Search states..."
        onRefresh={fetch}
        onCreate={openCreate}
        createLabel="Add State"
        actions={renderActions}
        emptyTitle="No states found"
        emptySubtitle="Add your first state to get started"
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreating}
        onClose={() => { closeCreate(); resetForm() }}
        title="Add New State"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="default" onClick={() => { closeCreate(); resetForm() }}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} loading={operationLoading}>
              Create
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="State Name" required>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))}
              placeholder="e.g., Telangana"
            />
          </FormField>
          <FormField label="State Code">
            <Input
              value={formData.code}
              onChange={(e) => setFormData(d => ({ ...d, code: e.target.value }))}
              placeholder="e.g., TS"
            />
          </FormField>
          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => { closeEdit(); resetForm() }}
        title="Edit State"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="default" onClick={() => { closeEdit(); resetForm() }}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdate} loading={operationLoading}>
              Save Changes
            </Button>
          </div>
        }
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <FormField label="State Name" required>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))}
              placeholder="e.g., Telangana"
            />
          </FormField>
          <FormField label="State Code">
            <Input
              value={formData.code}
              onChange={(e) => setFormData(d => ({ ...d, code: e.target.value }))}
              placeholder="e.g., TS"
            />
          </FormField>
          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete State"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        loading={operationLoading}
      />
    </div>
  )
}
