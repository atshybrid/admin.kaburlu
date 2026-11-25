/**
 * Reporter drawer — payment orders, history, cancel, recharge, exemption.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { reportersApi } from '../../../lib/api/tenantApi'
import { platformBillingApi } from '../../../lib/api/services/platformBillingApi'

function formatMoney(paise) {
  if (paise == null) return '—'
  return `₹${(Number(paise) / 100).toFixed(2)}`
}

function statusClass(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'PAID' || s === 'SUCCESS') return 'bg-emerald-100 text-emerald-800'
  if (s === 'PENDING') return 'bg-sky-100 text-sky-800'
  if (s === 'EXEMPTED') return 'bg-violet-100 text-violet-800'
  if (s === 'EXPIRED') return 'bg-slate-200 text-slate-700'
  return 'bg-amber-100 text-amber-900'
}

function parseYm(ym) {
  if (!ym) return { year: '', month: '' }
  const [y, m] = String(ym).split('-')
  return { year: y || '', month: m ? String(Number(m)) : '' }
}

export default function ReporterSubscriptionsPanel({ tenantId, reporterId, subscriptionActive }) {
  const [payments, setPayments] = useState([])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [filter, setFilter] = useState('all')
  const [exemptYm, setExemptYm] = useState('')
  const [exemptReason, setExemptReason] = useState('')
  const [rechargeRupees, setRechargeRupees] = useState('')

  const load = useCallback(async () => {
    if (!tenantId || !reporterId) return
    setLoading(true)
    setErr('')
    try {
      const [hist, st] = await Promise.all([
        reportersApi.getPayments(tenantId, reporterId),
        reportersApi.getPaymentStatus(tenantId, reporterId).catch(() => null),
      ])
      setPayments(Array.isArray(hist?.payments) ? hist.payments : [])
      setStatus(st)
    } catch (e) {
      setErr(e.message || 'Failed to load payments')
      setPayments([])
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }, [tenantId, reporterId])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    if (filter === 'all') return payments
    return payments.filter((p) => String(p.type) === filter)
  }, [payments, filter])

  const pending = status?.pendingPayment || status?.pendingPaymentDetail

  async function cancelOrders() {
    if (!window.confirm('Cancel all PENDING Razorpay orders for this reporter?')) return
    setBusy('cancel')
    setErr('')
    try {
      await platformBillingApi.cancelPendingPayments(tenantId, reporterId, 'cancelled_by_tenant_admin')
      setMsg('Pending orders expired')
      await load()
    } catch (e) {
      setErr(e.message || 'Cancel failed')
    } finally {
      setBusy('')
    }
  }

  async function createRechargeOrder() {
    setBusy('recharge')
    setErr('')
    setMsg('')
    try {
      const rupees = Number(rechargeRupees)
      const body = { forceRotate: true }
      if (Number.isFinite(rupees) && rupees >= 0) {
        await platformBillingApi.rotateOrder(tenantId, reporterId, {
          forceRotate: true,
          monthlySubscriptionAmount: rupees,
        })
      } else {
        await reportersApi.createPaymentOrder(tenantId, reporterId, {
          mode: 'MONTHLY_SUBSCRIPTION',
          forceRotate: true,
        })
      }
      setMsg('New payment order created — reporter can pay in app')
      await load()
    } catch (e) {
      setErr(e.message || 'Could not create order')
    } finally {
      setBusy('')
    }
  }

  async function submitExempt() {
    const { year, month } = parseYm(exemptYm)
    const y = Number(year)
    const m = Number(month)
    if (!y || !m) {
      setErr('Pick month for exemption (YYYY-MM)')
      return
    }
    setBusy('exempt')
    setErr('')
    try {
      await reportersApi.exemptPayment(tenantId, reporterId, {
        year: y,
        month: m,
        reason: exemptReason.trim() || 'Waived by tenant admin',
      })
      setMsg(`${exemptYm} exempted`)
      setExemptReason('')
      await load()
    } catch (e) {
      setErr(e.message || 'Exempt failed')
    } finally {
      setBusy('')
    }
  }

  async function revertExempt() {
    const { year, month } = parseYm(exemptYm)
    const y = Number(year)
    const m = Number(month)
    if (!y || !m) {
      setErr('Pick month to revert exemption')
      return
    }
    if (!window.confirm(`Revert exemption for ${exemptYm}?`)) return
    setBusy('revert')
    setErr('')
    try {
      await reportersApi.revertPaymentExemption(tenantId, reporterId, { year: y, month: m })
      setMsg(`Exemption reverted for ${exemptYm}`)
      await load()
    } catch (e) {
      setErr(e.message || 'Revert failed')
    } finally {
      setBusy('')
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500 py-8 text-center">Loading subscription data…</p>
  }

  return (
    <div className="space-y-4">
      {err && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">{err}</div>}
      {msg && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2">{msg}</div>}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border bg-slate-50 p-3">
          <div className="text-[10px] uppercase text-slate-500">Access status</div>
          <div className="font-semibold text-slate-900 mt-0.5">{status?.paymentStatus || '—'}</div>
          <div className="text-slate-600 mt-1">
            Subscription billing: {subscriptionActive ? 'ON' : 'OFF'}
          </div>
        </div>
        <div className="rounded-lg border bg-slate-50 p-3">
          <div className="text-[10px] uppercase text-slate-500">Outstanding</div>
          <div className="font-semibold text-slate-900 mt-0.5">
            {status?.totalAmountRupees != null ? `₹${status.totalAmountRupees}` : '—'}
          </div>
          <div className="text-slate-600 mt-1">
            {(status?.outstanding || []).length} due item(s)
          </div>
        </div>
      </div>

      {pending?.orderId && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs space-y-1">
          <div className="font-semibold text-sky-900">Active pending order</div>
          <div>Order: <span className="font-mono">{pending.orderId}</span></div>
          <div>Amount: {formatMoney(pending.amount)}</div>
          {pending.expiresAt && (
            <div>Expires: {new Date(pending.expiresAt).toLocaleString()}</div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!!busy}
          onClick={load}
          className="px-3 py-1.5 text-sm rounded-lg border bg-white hover:bg-slate-50"
        >
          Refresh
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={cancelOrders}
          className="px-3 py-1.5 text-sm rounded-lg border border-amber-200 text-amber-900 bg-amber-50"
        >
          {busy === 'cancel' ? '…' : 'Cancel pending orders'}
        </button>
      </div>

      <div className="rounded-xl border p-3 space-y-2 bg-white">
        <div className="text-sm font-semibold text-slate-900">Manual recharge (new order)</div>
        <p className="text-[11px] text-slate-500">
          Creates / rotates Razorpay order for due months. Optional: set monthly ₹ before order.
        </p>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-xs text-slate-600">Monthly fee (₹)</label>
            <input
              type="number"
              min="0"
              value={rechargeRupees}
              onChange={(e) => setRechargeRupees(e.target.value)}
              placeholder="e.g. 500"
              className="block mt-1 border rounded-lg px-2 py-1.5 text-sm w-28"
            />
          </div>
          <button
            type="button"
            disabled={!!busy}
            onClick={createRechargeOrder}
            className="px-3 py-2 text-sm rounded-lg bg-brand text-white font-medium"
          >
            {busy === 'recharge' ? 'Creating…' : 'Create payment order'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border p-3 space-y-2 bg-white">
        <div className="text-sm font-semibold text-slate-900">Exemption (waive month)</div>
        <div className="flex flex-wrap gap-2 items-end">
          <input
            type="month"
            value={exemptYm}
            onChange={(e) => setExemptYm(e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm"
          />
          <input
            value={exemptReason}
            onChange={(e) => setExemptReason(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1 min-w-[140px] border rounded-lg px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            disabled={!!busy}
            onClick={submitExempt}
            className="px-3 py-1.5 text-sm rounded-lg bg-violet-600 text-white"
          >
            {busy === 'exempt' ? '…' : 'Exempt month'}
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={revertExempt}
            className="px-3 py-1.5 text-sm rounded-lg border"
          >
            {busy === 'revert' ? '…' : 'Revert exempt'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-900">Full history</h4>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-xs border rounded-lg px-2 py-1"
        >
          <option value="all">All types</option>
          <option value="MONTHLY_SUBSCRIPTION">Monthly</option>
          <option value="ONBOARDING">Onboarding</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border max-h-[320px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Period</th>
              <th className="text-left p-2">Amount</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Order</th>
              <th className="text-left p-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-slate-500 text-center">
                  No transactions — use “Create payment order” if reporter has dues
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-t align-top">
                  <td className="p-2">{p.type}</td>
                  <td className="p-2">{p.year && p.month ? `${p.year}-${String(p.month).padStart(2, '0')}` : '—'}</td>
                  <td className="p-2">{formatMoney(p.amount)}</td>
                  <td className="p-2">
                    <span className={`px-1.5 py-0.5 rounded ${statusClass(p.status)}`}>{p.status}</span>
                    {p.status === 'EXEMPTED' && p.exemptedReason && (
                      <div className="text-[10px] text-slate-500 mt-0.5 max-w-[120px] truncate" title={p.exemptedReason}>
                        {p.exemptedReason}
                      </div>
                    )}
                  </td>
                  <td className="p-2 font-mono text-[10px] max-w-[100px] truncate" title={p.razorpayOrderId || ''}>
                    {p.razorpayOrderId || '—'}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}