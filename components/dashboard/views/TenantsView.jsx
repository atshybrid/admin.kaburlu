/**
 * Modern Tenants View (MVP Pattern - View Layer)
 * Complete redesign with new UI components
 */

import { useState } from 'react'
import { useRouter } from 'next/router'
import { useTenants } from '../../../hooks/useTenants'
import {
  DataTable,
  Badge,
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
  ConfirmDialog,
  toast,
  IconEdit,
  IconTrash,
  IconEye,
  IconMoreVertical,
  IconExternalLink,
  IconPlus
} from '../../ui'
import { useStates } from '../../../hooks/useLocations'

export default function ModernTenantsView() {
  const router = useRouter()
  const {
    tenants,
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
    query,
    setQuery,
    slugify,
    verifyTenant
  } = useTenants()

  const { states } = useStates()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [verifyTarget, setVerifyTarget] = useState(null)

  // Form state for create
  const [formData, setFormData] = useState({
    name: '',
    prgiNumber: '',
    stateId: ''
  })
  const [formError, setFormError] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!formData.name.trim()) {
      setFormError('Name is required')
      return
    }
    if (!formData.stateId) {
      setFormError('State is required')
      return
    }

    const result = await create({
      name: formData.name.trim(),
      slug: slugify(formData.name),
      prgiNumber: formData.prgiNumber.trim() || undefined,
      stateId: formData.stateId
    })

    if (result.success) {
      toast.success('Tenant created successfully')
      setFormData({ name: '', prgiNumber: '', stateId: '' })
    } else {
      setFormError(result.error)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await remove(deleteTarget.id)
    if (result.success) {
      toast.success('Tenant deleted successfully')
    } else {
      toast.error(result.error)
    }
    setDeleteTarget(null)
  }

  const handleVerify = async (status, remark) => {
    if (!verifyTarget) return
    const result = await verifyTenant(verifyTarget.id, { prgiStatus: status, remark })
    if (result.success) {
      toast.success('Status updated successfully')
    } else {
      toast.error(result.error)
    }
    setVerifyTarget(null)
  }

  // Table columns
  const columns = [
    {
      header: 'Tenant',
      accessor: 'name',
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{row.slug}</p>
        </div>
      )
    },
    {
      header: 'PRGI Number',
      accessor: 'prgiNumber',
      render: (value) => value || <span className="text-gray-400">—</span>
    },
    {
      header: 'Domains',
      accessor: 'domains',
      sortable: false,
      render: (domains) => {
        if (!domains?.length) return <span className="text-gray-400">No domains</span>
        return (
          <div className="flex flex-wrap gap-1">
            {domains.slice(0, 2).map((d, i) => (
              <Badge
                key={i}
                variant={d.status === 'ACTIVE' ? 'success' : d.status === 'PENDING' ? 'warning' : 'default'}
                size="xs"
              >
                {d.domain}
              </Badge>
            ))}
            {domains.length > 2 && (
              <Badge variant="secondary" size="xs">+{domains.length - 2}</Badge>
            )}
          </div>
        )
      }
    },
    {
      header: 'Language',
      accessor: 'entity',
      render: (entity) => entity?.language?.name || <span className="text-gray-400">—</span>
    },
    {
      header: 'Status',
      accessor: 'prgiStatus',
      render: (value, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setVerifyTarget(row) }}
          className="hover:opacity-80 transition-opacity"
        >
          <StatusBadge status={value || 'pending'} />
        </button>
      )
    }
  ]

  // Row actions
  const renderActions = (row) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="primary"
        size="xs"
        onClick={() => router.push(`/dashboard/tenants/${row.id}`)}
      >
        Manage
      </Button>
      <Dropdown
        trigger={
          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <IconMoreVertical className="w-4 h-4 text-gray-500" />
          </button>
        }
      >
        {({ close }) => (
          <>
            <DropdownItem
              icon={<IconEye className="w-4 h-4" />}
              onClick={() => { setSelected(row); close() }}
            >
              Quick View
            </DropdownItem>
            <DropdownItem
              icon={<IconExternalLink className="w-4 h-4" />}
              onClick={() => { router.push(`/dashboard/tenants/${row.id}`); close() }}
            >
              Full Details
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
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tenants</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage all tenants, their domains, and configurations
        </p>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={tenants}
        loading={loading}
        error={error}
        searchable
        searchPlaceholder="Search tenants by name, slug, or PRGI..."
        onRefresh={fetch}
        onCreate={openCreate}
        createLabel="Add Tenant"
        actions={renderActions}
        onRowClick={(row) => router.push(`/dashboard/tenants/${row.id}`)}
        emptyTitle="No tenants found"
        emptySubtitle="Get started by creating your first tenant"
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreating}
        onClose={closeCreate}
        title="Create New Tenant"
        subtitle="Add a new tenant to your platform"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="default" onClick={closeCreate}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={operationLoading}
            >
              Create Tenant
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Tenant Name" required>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))}
              placeholder="e.g., Kaburlu Media"
            />
          </FormField>

          <FormField label="PRGI Number" hint="Optional registration number">
            <Input
              value={formData.prgiNumber}
              onChange={(e) => setFormData(d => ({ ...d, prgiNumber: e.target.value }))}
              placeholder="e.g., PRGI-TS-2025-01987"
            />
          </FormField>

          <FormField label="State" required>
            <Select
              value={formData.stateId}
              onChange={(e) => setFormData(d => ({ ...d, stateId: e.target.value }))}
              placeholder="Select a state"
            >
              {states.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </FormField>

          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}
        </form>
      </Modal>

      {/* Quick View Panel */}
      <SlidePanel
        isOpen={!!selected && !isCreating}
        onClose={() => setSelected(null)}
        title={selected?.name}
        subtitle={`Slug: ${selected?.slug}`}
        width="md"
        footer={
          <div className="flex justify-between">
            <Button
              variant="outline-danger"
              onClick={() => { setDeleteTarget(selected); setSelected(null) }}
            >
              Delete
            </Button>
            <Button
              variant="primary"
              onClick={() => { router.push(`/dashboard/tenants/${selected?.id}`); setSelected(null) }}
            >
              Full Details
            </Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-6">
            <Card title="Basic Information">
              <div className="space-y-1">
                <CardRow label="Name" value={selected.name} />
                <CardRow label="Slug" value={selected.slug} />
                <CardRow label="PRGI Number" value={selected.prgiNumber} />
                <CardRow label="Status" value={<StatusBadge status={selected.prgiStatus} />} />
              </div>
            </Card>

            <Card title="Domains">
              {selected.domains?.length > 0 ? (
                <div className="space-y-2">
                  {selected.domains.map((d, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                      <div>
                        <p className="text-sm font-medium">{d.domain}</p>
                        <p className="text-xs text-gray-500">
                          {d.isPrimary ? 'Primary' : 'Secondary'}
                        </p>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No domains configured</p>
              )}
            </Card>

            {selected.entity && (
              <Card title="Entity">
                <div className="space-y-1">
                  <CardRow label="Business Name" value={selected.entity.businessName} />
                  <CardRow label="Language" value={selected.entity.language?.name} />
                  <CardRow label="Country" value={selected.entity.country} />
                </div>
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
        title="Delete Tenant"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={operationLoading}
      />

      {/* Verify Status Modal */}
      <Modal
        isOpen={!!verifyTarget}
        onClose={() => setVerifyTarget(null)}
        title="Update PRGI Status"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Update verification status for <strong>{verifyTarget?.name}</strong>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="success"
              onClick={() => handleVerify('VERIFIED', '')}
              loading={operationLoading}
            >
              Verify
            </Button>
            <Button
              variant="warning"
              onClick={() => handleVerify('PENDING', '')}
              loading={operationLoading}
            >
              Mark Pending
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
