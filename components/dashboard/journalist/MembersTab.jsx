/**
 * Members Tab — Journalist Union Admin
 * Lists approved members, view details + press card info
 */

import { useState, useEffect, useCallback } from 'react'
import { journalistApi } from '../../../lib/api/services/journalistApi'
import {
  DataTable,
  StatusBadge,
  Button,
  SlidePanel,
  Card,
  CardRow,
  Input,
  FormField,
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

export default function MembersTab() {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await journalistApi.listMembers(search ? { search } : {})
      setItems(Array.isArray(data) ? data : data?.members ?? data?.data ?? [])
    } catch (err) {
      toast.error(err.message || 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  const handleSearch = (e) => {
    e.preventDefault()
    load()
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
      render: (v) => (
        <span className={`font-mono text-sm ${v ? 'text-brand' : 'text-gray-400'}`}>{v || 'Not assigned'}</span>
      )
    },
    {
      header: 'Designation',
      accessor: 'designation',
      render: (v) => <span className="text-sm">{v || '—'}</span>
    },
    {
      header: 'Organisation',
      accessor: 'organization',
      render: (v) => <span className="text-sm text-gray-600">{v || '—'}</span>
    },
    {
      header: 'District',
      accessor: 'district',
      render: (v) => <span className="text-sm text-gray-500">{v || '—'}</span>
    },
    {
      header: 'KYC',
      accessor: 'kycVerified',
      render: (v) => <StatusBadge color={v ? 'green' : 'yellow'} label={v ? 'Verified' : 'Pending'} />
    },
    {
      header: 'Card',
      accessor: 'card',
      render: (v) => v
        ? <StatusBadge color={v.status === 'ACTIVE' ? 'green' : 'red'} label={v.status} />
        : <StatusBadge color="gray" label="No Card" />
    },
    {
      header: 'Approved',
      accessor: 'approvedAt',
      render: (v) => <span className="text-xs text-gray-400">{fmt(v)}</span>
    },
    {
      header: '',
      accessor: 'id',
      render: (_, row) => (
        <Dropdown trigger={<button className="p-1 rounded hover:bg-gray-100"><IconMoreVertical className="w-4 h-4 text-gray-500" /></button>}>
          <DropdownItem icon={<IconEye />} onClick={() => { setSelected(row); setPanelOpen(true) }}>
            View Details
          </DropdownItem>
        </Dropdown>
      )
    }
  ]

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
        <Input
          placeholder="Search name / mobile / press ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="secondary" size="sm">Search</Button>
        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(''); load() }}
          >
            Clear
          </Button>
        )}
      </form>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No members found"
        rowKey="id"
      />

      {/* Detail panel */}
      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Member Profile"
        width="md"
      >
        {selected && (
          <div className="space-y-4 p-4">
            <Card title="Personal">
              <CardRow label="Name"         value={selected.user?.profile?.fullName || '—'} />
              <CardRow label="Mobile"       value={selected.user?.mobileNumber || '—'} />
              <CardRow label="Press ID"     value={selected.pressId || '—'} />
              <CardRow label="Designation"  value={selected.designation || '—'} />
              <CardRow label="Organisation" value={selected.organization || '—'} />
              <CardRow label="Union"        value={selected.unionName || '—'} />
              <CardRow label="State"        value={selected.state || '—'} />
              <CardRow label="District"     value={selected.district || '—'} />
              <CardRow label="Mandal"       value={selected.mandal || '—'} />
              <CardRow label="Approved On"  value={fmt(selected.approvedAt)} />
            </Card>

            {selected.card && (
              <Card title="Press Card">
                <CardRow label="Card No."  value={selected.card.cardNumber || '—'} />
                <CardRow label="Status"    value={<StatusBadge color={selected.card.status === 'ACTIVE' ? 'green' : 'red'} label={selected.card.status} />} />
                <CardRow label="Expiry"    value={fmt(selected.card.expiryDate)} />
                <CardRow label="Renewals"  value={selected.card.renewalCount ?? '0'} />
                {selected.card.pdfUrl && (
                  <CardRow label="PDF" value={
                    <a href={selected.card.pdfUrl} target="_blank" rel="noreferrer" className="text-brand underline text-sm">
                      Download PDF
                    </a>
                  } />
                )}
              </Card>
            )}

            {selected.insurances?.length > 0 && (
              <Card title="Insurance">
                {selected.insurances.map((ins) => (
                  <div key={ins.id} className="py-2 border-b last:border-0 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">{ins.type}</span>
                      <StatusBadge color={ins.isActive ? 'green' : 'gray'} label={ins.isActive ? 'Active' : 'Inactive'} />
                    </div>
                    <p className="text-gray-500">{ins.insurer} — ₹{(ins.coverAmount || 0).toLocaleString('en-IN')}</p>
                    <p className="text-gray-400 text-xs">{fmt(ins.validFrom)} → {fmt(ins.validTo)}</p>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}
      </SlidePanel>
    </div>
  )
}
