/**
 * Press Cards Tab — Journalist Union Admin
 * Generate card for approved member, regenerate PDF, update card details
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

export default function CardsTab() {
  const [members, setMembers]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)

  // Generate card modal (for approved members without a card)
  const [genTarget, setGenTarget]     = useState(null)
  const [genLoading, setGenLoading]   = useState(false)
  const [genForm, setGenForm]         = useState({ expiryDate: '', cardType: 'ANNUAL' })

  // Update card modal
  const [editTarget, setEditTarget]   = useState(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editForm, setEditForm]       = useState({ status: 'ACTIVE', expiryDate: '' })

  // Regen loading
  const [regenId, setRegenId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await journalistApi.listMembers()
      setMembers(Array.isArray(data) ? data : data?.members ?? data?.data ?? [])
    } catch (err) {
      toast.error(err.message || 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleGenerate = async () => {
    if (!genTarget) return
    setGenLoading(true)
    try {
      await journalistApi.generateCard(genTarget.id, genForm)
      toast.success('Press card generated')
      setGenTarget(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Generate failed')
    } finally {
      setGenLoading(false)
    }
  }

  const handleRegenerate = async (cardId) => {
    setRegenId(cardId)
    try {
      await journalistApi.regenerateCard(cardId)
      toast.success('PDF regenerated')
      load()
    } catch (err) {
      toast.error(err.message || 'Regenerate failed')
    } finally {
      setRegenId(null)
    }
  }

  const handleUpdateCard = async () => {
    if (!editTarget) return
    setEditLoading(true)
    try {
      await journalistApi.updateCard(editTarget.card.id, editForm)
      toast.success('Card updated')
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
      status: row.card?.status || 'ACTIVE',
      expiryDate: row.card?.expiryDate
        ? new Date(row.card.expiryDate).toISOString().split('T')[0]
        : ''
    })
  }

  const columns = [
    {
      header: 'Member',
      accessor: 'user',
      render: (v, row) => (
        <div>
          <p className="font-medium text-gray-900">{v?.profile?.fullName || '—'}</p>
          <p className="text-xs text-gray-500">{row.pressId || v?.mobileNumber || '—'}</p>
        </div>
      )
    },
    {
      header: 'Card No.',
      accessor: 'card',
      render: (v) => (
        <span className={`font-mono text-sm ${v ? 'text-brand' : 'text-gray-400'}`}>
          {v?.cardNumber || 'No card yet'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'card',
      render: (v) => v
        ? <StatusBadge color={v.status === 'ACTIVE' ? 'green' : v.status === 'EXPIRED' ? 'red' : 'yellow'} label={v.status} />
        : <StatusBadge color="gray" label="Not Generated" />
    },
    {
      header: 'Expiry',
      accessor: 'card',
      render: (v) => <span className="text-sm text-gray-500">{fmt(v?.expiryDate)}</span>
    },
    {
      header: 'Renewals',
      accessor: 'card',
      render: (v) => <span className="text-sm text-gray-500">{v?.renewalCount ?? '—'}</span>
    },
    {
      header: '',
      accessor: 'id',
      render: (_, row) => (
        <Dropdown trigger={<button className="p-1 rounded hover:bg-gray-100"><IconMoreVertical className="w-4 h-4 text-gray-500" /></button>}>
          <DropdownItem icon={<IconEye />} onClick={() => { setSelected(row); setPanelOpen(true) }}>
            View
          </DropdownItem>
          {!row.card && (
            <DropdownItem onClick={() => { setGenTarget(row); setGenForm({ expiryDate: '', cardType: 'ANNUAL' }) }}>
              Generate Card
            </DropdownItem>
          )}
          {row.card && (
            <>
              <DropdownItem onClick={() => openEdit(row)}>
                Edit Card
              </DropdownItem>
              <DropdownItem
                onClick={() => handleRegenerate(row.card.id)}
                disabled={regenId === row.card.id}
              >
                {regenId === row.card.id ? 'Regenerating…' : 'Regenerate PDF'}
              </DropdownItem>
              {row.card.pdfUrl && (
                <DropdownItem onClick={() => window.open(row.card.pdfUrl, '_blank')}>
                  Download PDF
                </DropdownItem>
              )}
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
        data={members}
        loading={loading}
        emptyMessage="No members found"
        rowKey="id"
      />

      {/* Detail panel */}
      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title="Card Details" width="md">
        {selected?.card && (
          <div className="space-y-4 p-4">
            <Card title="Press Card">
              <CardRow label="Card No."   value={selected.card.cardNumber} />
              <CardRow label="Status"     value={<StatusBadge color={selected.card.status === 'ACTIVE' ? 'green' : 'red'} label={selected.card.status} />} />
              <CardRow label="Expiry"     value={fmt(selected.card.expiryDate)} />
              <CardRow label="Renewals"   value={selected.card.renewalCount ?? 0} />
              <CardRow label="Pending Renewal" value={selected.card.pendingRenewal ? 'Yes' : 'No'} />
              <CardRow label="Issued"     value={fmt(selected.card.createdAt)} />
            </Card>
            {selected.card.pdfUrl && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(selected.card.pdfUrl, '_blank')}
              >
                Download PDF
              </Button>
            )}
          </div>
        )}
        {!selected?.card && selected && (
          <div className="p-6 text-center text-gray-500">
            No press card issued yet.
            <div className="mt-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => { setPanelOpen(false); setGenTarget(selected); setGenForm({ expiryDate: '', cardType: 'ANNUAL' }) }}
              >
                Generate Card
              </Button>
            </div>
          </div>
        )}
      </SlidePanel>

      {/* Generate card modal */}
      <Modal open={!!genTarget} onClose={() => setGenTarget(null)} title="Generate Press Card">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Generate card for <strong>{genTarget?.user?.profile?.fullName || genTarget?.pressId || '—'}</strong>
          </p>
          <FormField label="Expiry Date">
            <Input
              type="date"
              value={genForm.expiryDate}
              onChange={(e) => setGenForm(f => ({ ...f, expiryDate: e.target.value }))}
            />
          </FormField>
          <FormField label="Card Type">
            <Select
              value={genForm.cardType}
              onChange={(e) => setGenForm(f => ({ ...f, cardType: e.target.value }))}
              options={[
                { value: 'ANNUAL', label: 'Annual' },
                { value: 'LIFETIME', label: 'Lifetime' },
              ]}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setGenTarget(null)}>Cancel</Button>
            <Button variant="primary" loading={genLoading} onClick={handleGenerate}>Generate</Button>
          </div>
        </div>
      </Modal>

      {/* Edit card modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Press Card">
        <div className="space-y-4">
          <FormField label="Status">
            <Select
              value={editForm.status}
              onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'SUSPENDED', label: 'Suspended' },
                { value: 'EXPIRED', label: 'Expired' },
              ]}
            />
          </FormField>
          <FormField label="Expiry Date">
            <Input
              type="date"
              value={editForm.expiryDate}
              onChange={(e) => setEditForm(f => ({ ...f, expiryDate: e.target.value }))}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button variant="primary" loading={editLoading} onClick={handleUpdateCard}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
