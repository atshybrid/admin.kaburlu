/**
 * Renewals Tab — Journalist Union Admin
 * Lists cards with pending renewals; approve to extend +1 year
 */

import { useState, useEffect, useCallback } from 'react'
import { journalistApi } from '../../../lib/api/services/journalistApi'
import {
  DataTable,
  StatusBadge,
  Button,
  ConfirmDialog,
  toast,
} from '../../ui'

function fmt(v) {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (isNaN(d)) return v
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  } catch { return v }
}

export default function RenewalsTab() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(null) // { cardId, name }
  const [approving, setApproving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await journalistApi.listRenewals()
      setItems(Array.isArray(data) ? data : data?.renewals ?? data?.data ?? [])
    } catch (err) {
      toast.error(err.message || 'Failed to load renewals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleApprove = async () => {
    if (!confirm) return
    setApproving(true)
    try {
      await journalistApi.approveRenewal(confirm.cardId)
      toast.success('Renewal approved — card extended by 1 year')
      setConfirm(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Renewal approval failed')
    } finally {
      setApproving(false)
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
      header: 'Press ID',
      accessor: 'journalistProfile',
      render: (v) => (
        <span className="font-mono text-sm text-brand">{v?.pressId || '—'}</span>
      )
    },
    {
      header: 'Card No.',
      accessor: 'cardNumber',
      render: (v) => <span className="font-mono text-sm">{v || '—'}</span>
    },
    {
      header: 'Current Expiry',
      accessor: 'expiryDate',
      render: (v) => (
        <span className={`text-sm font-medium ${new Date(v) < new Date() ? 'text-red-600' : 'text-orange-500'}`}>
          {fmt(v)}
        </span>
      )
    },
    {
      header: 'Renewal Requested',
      accessor: 'pendingRenewalAt',
      render: (v) => <span className="text-xs text-gray-400">{fmt(v)}</span>
    },
    {
      header: 'Renewals',
      accessor: 'renewalCount',
      render: (v) => <span className="text-sm text-gray-500">{v ?? 0}</span>
    },
    {
      header: '',
      accessor: 'id',
      render: (_, row) => (
        <Button
          variant="primary"
          size="xs"
          onClick={() => setConfirm({
            cardId: row.id,
            name: row.journalistProfile?.user?.profile?.fullName || row.journalistProfile?.user?.mobileNumber || 'member'
          })}
        >
          Approve Renewal
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Cards with pending renewal requests</p>
        <Button variant="ghost" size="sm" onClick={load} loading={loading}>Refresh</Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No pending renewal requests"
        rowKey="id"
      />

      <ConfirmDialog
        open={!!confirm}
        title="Approve Renewal"
        message={`Approve renewal for ${confirm?.name}? Their card will be extended by 1 year.`}
        confirmLabel="Approve"
        onConfirm={handleApprove}
        onCancel={() => setConfirm(null)}
        loading={approving}
        variant="primary"
      />
    </div>
  )
}
