import { useCallback, useEffect, useState } from 'react'
import { platformBillingApi } from '../../../lib/api/services/platformBillingApi'
import { istMonthBounds, rupeesLabel } from '../../../lib/billing/dateRange'
import {
  downloadReporterSubscriptionsCsv,
  monthsDueCount,
  outstandingMonthsList,
  reporterDisplayName,
  reporterMobile,
  reporterDueRupees,
  reporterTotalPayable,
} from '../../../lib/billing/reporterSubscriptionRow'
import { downloadReporterSubscriptionsPdf } from '../../../lib/billing/reporterSubscriptionsPdf'
import BillingDateRangeBar from './BillingDateRangeBar'
import { Button, FormField, Input, Modal, Select, Spinner, toast } from '../../ui'

const BUCKETS = [
  { id: 'all', label: 'All' },
  { id: 'due', label: 'Due' },
  { id: 'pending', label: 'Pending' },
  { id: 'complete', label: 'Paid up' },
  { id: 'off', label: 'Off' },
]

function bucketBadge(bucket) {
  const map = {
    due: 'bg-amber-100 text-amber-800',
    pending: 'bg-sky-100 text-sky-800',
    complete: 'bg-emerald-100 text-emerald-800',
    off: 'bg-slate-200 text-slate-700',
  }
  return map[bucket] || 'bg-slate-100 text-slate-700'
}

export default function BillingReportersTab({ tenantId, tenantSlug, tenantName, initialBucket = 'all' }) {
  const bounds = istMonthBounds()
  const [from, setFrom] = useState(bounds.from)
  const [to, setTo] = useState(bounds.to)
  const [bucket, setBucket] = useState(initialBucket)
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [editRow, setEditRow] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    subscriptionActive: true,
    monthlySubscriptionAmount: '',
    subscriptionActivationDate: '',
  })
  const [exportingPdf, setExportingPdf] = useState(false)

  useEffect(() => {
    setBucket(initialBucket)
  }, [initialBucket])

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await platformBillingApi.getReportersSubscriptions(tenantId, { bucket, from, to })
      const data = res?.data ?? res
      const list = data?.reporters ?? data?.items ?? []
      setRows(Array.isArray(list) ? list : [])
    } catch (err) {
      toast.error(err.message || 'Failed to load reporters')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [tenantId, bucket, from, to])

  useEffect(() => {
    load()
  }, [load])

  const openEdit = (row) => {
    setEditRow(row)
    setForm({
      subscriptionActive: row.subscriptionActive !== false,
      monthlySubscriptionAmount: String(row.monthlySubscriptionAmountRupees ?? row.monthlySubscriptionAmount ?? ''),
      subscriptionActivationDate: row.subscriptionActivationDate
        ? String(row.subscriptionActivationDate).slice(0, 10)
        : '',
    })
  }

  const saveSubscription = async () => {
    if (!editRow?.reporterId && !editRow?.id) return
    const reporterId = editRow.reporterId || editRow.id
    setSaving(true)
    try {
      const body = {
        subscriptionActive: form.subscriptionActive,
      }
      const amt = Number(form.monthlySubscriptionAmount)
      if (Number.isFinite(amt) && amt >= 0) body.monthlySubscriptionAmount = amt
      if (form.subscriptionActivationDate) {
        body.subscriptionActivationDate = new Date(`${form.subscriptionActivationDate}T00:00:00.000Z`).toISOString()
      }
      await platformBillingApi.patchReporterSubscription(tenantId, reporterId, body)
      toast.success('Subscription updated')
      setEditRow(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const cancelPending = async (row) => {
    const reporterId = row.reporterId || row.id
    if (!confirm('Cancel all pending payment orders for this reporter?')) return
    try {
      await platformBillingApi.cancelPendingPayments(tenantId, reporterId)
      toast.success('Pending payments expired')
      load()
    } catch (err) {
      toast.error(err.message || 'Cancel failed')
    }
  }

  const rotateOrder = async (row) => {
    const reporterId = row.reporterId || row.id
    const input = window.prompt('Monthly amount (₹) before new order:', String(row.monthlySubscriptionAmountRupees || 500))
    if (input === null) return
    const amount = Number(input)
    try {
      await platformBillingApi.rotateOrder(tenantId, reporterId, {
        forceRotate: true,
        ...(Number.isFinite(amount) ? { monthlySubscriptionAmount: amount } : {}),
      })
      toast.success('New order created')
      load()
    } catch (err) {
      toast.error(err.message || 'Rotate order failed')
    }
  }

  return (
    <div className="space-y-4">
      <BillingDateRangeBar from={from} to={to} onFrom={setFrom} onTo={setTo} onApply={load} loading={loading} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {BUCKETS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBucket(b.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                bucket === b.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!rows.length || loading}
            onClick={() => {
              downloadReporterSubscriptionsCsv(rows, { tenantSlug, tenantName, bucket, from, to })
              toast.success(`Exported ${rows.length} row(s) to CSV`)
            }}
          >
            Export CSV
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!rows.length || loading || exportingPdf}
            loading={exportingPdf}
            onClick={async () => {
              setExportingPdf(true)
              try {
                await downloadReporterSubscriptionsPdf(rows, { tenantSlug, tenantName, bucket, from, to })
                toast.success(`Exported ${rows.length} row(s) to PDF`)
              } catch (err) {
                toast.error(err?.message || 'PDF export failed')
              } finally {
                setExportingPdf(false)
              }
            }}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-900 text-left text-[11px] uppercase tracking-wider text-slate-300">
                <th className="px-4 py-3">Reporter</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Bucket</th>
                <th className="px-4 py-3">Months due</th>
                <th className="px-4 py-3">Base ₹</th>
                <th className="px-4 py-3">Total payable</th>
                <th className="px-4 py-3">Due ₹</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const id = row.reporterId || row.id
                const name = reporterDisplayName(row)
                const mobile = reporterMobile(row) || '—'
                const total = reporterTotalPayable(row)
                const dueCount = monthsDueCount(row)
                const monthLabels = outstandingMonthsList(row)
                return (
                  <tr key={id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{name}</div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">{mobile}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bucketBadge(row.bucket)}`}>
                        {row.bucket || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold tabular-nums text-slate-900">{dueCount || '—'}</div>
                      {monthLabels.length ? (
                        <div className="text-[11px] text-slate-500 max-w-[10rem] truncate" title={monthLabels.join(', ')}>
                          {monthLabels.join(', ')}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{rupeesLabel(row.monthlySubscriptionAmountRupees)}</td>
                    <td className="px-4 py-3 tabular-nums">{total !== '' && total != null ? rupeesLabel(total) : '—'}</td>
                    <td className="px-4 py-3 tabular-nums text-amber-800 font-medium">
                      {reporterDueRupees(row) !== '' ? rupeesLabel(reporterDueRupees(row)) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button type="button" size="sm" variant="ghost" onClick={() => openEdit(row)}>
                        Edit
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => cancelPending(row)}>
                        Cancel pending
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => rotateOrder(row)}>
                        New order
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!rows.length ? (
            <p className="text-center py-10 text-slate-500">No reporters in this bucket.</p>
          ) : null}
        </div>
      )}

      <Modal
        isOpen={Boolean(editRow)}
        onClose={() => setEditRow(null)}
        title="Reporter subscription"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditRow(null)}>Cancel</Button>
            <Button loading={saving} onClick={saveSubscription}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Subscription active">
            <Select
              value={form.subscriptionActive ? 'true' : 'false'}
              onChange={(e) => setForm((f) => ({ ...f, subscriptionActive: e.target.value === 'true' }))}
            >
              <option value="true">On</option>
              <option value="false">Off</option>
            </Select>
          </FormField>
          <FormField label="Monthly amount (₹)">
            <Input
              type="number"
              min={0}
              value={form.monthlySubscriptionAmount}
              onChange={(e) => setForm((f) => ({ ...f, monthlySubscriptionAmount: e.target.value }))}
            />
          </FormField>
          <FormField label="Activation date (optional)" hint="Future date = scheduled start">
            <Input
              type="date"
              value={form.subscriptionActivationDate}
              onChange={(e) => setForm((f) => ({ ...f, subscriptionActivationDate: e.target.value }))}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  )
}
