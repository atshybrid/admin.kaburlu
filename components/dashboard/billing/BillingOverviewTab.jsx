import { useCallback, useEffect, useState } from 'react'
import { platformBillingApi } from '../../../lib/api/services/platformBillingApi'
import { istMonthBounds, minorToInr, rupeesLabel } from '../../../lib/billing/dateRange'
import BillingDateRangeBar from './BillingDateRangeBar'
import { Button, Spinner, StatCard, toast } from '../../ui'

function unwrapData(res) {
  return res?.data ?? res
}

export default function BillingOverviewTab({ tenantId, onNavigateReporters }) {
  const bounds = istMonthBounds()
  const [from, setFrom] = useState(bounds.from)
  const [to, setTo] = useState(bounds.to)
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState(null)

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await platformBillingApi.getDashboard(tenantId, { from, to })
      setDashboard(unwrapData(res))
    } catch (err) {
      toast.error(err.message || 'Failed to load billing dashboard')
      setDashboard(null)
    } finally {
      setLoading(false)
    }
  }, [tenantId, from, to])

  useEffect(() => {
    load()
  }, [load])

  const wallet = dashboard?.wallet
  const ledger = dashboard?.walletLedger
  const platformFee = dashboard?.platformFee || wallet?.monthlyFee
  const dues = dashboard?.reporterDues
  const sub = dashboard?.subscriptionSummary

  return (
    <div className="space-y-5">
      <BillingDateRangeBar
        from={from}
        to={to}
        onFrom={setFrom}
        onTo={setTo}
        onApply={load}
        loading={loading}
      />

      {loading && !dashboard ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : null}

      {dashboard ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Wallet balance"
              value={wallet?.formatted?.balance || minorToInr(wallet?.balanceMinor)}
              description={`Status: ${wallet?.status || '—'}`}
            />
            <StatCard
              title="Platform monthly (incl. GST)"
              value={platformFee?.formatted?.total || minorToInr(platformFee?.totalMinor)}
              description={
                platformFee
                  ? `Base ${minorToInr(platformFee.baseMinor)} + GST ${platformFee.gstPercent ?? 0}%`
                  : undefined
              }
            />
            <StatCard
              title="Recharges (range)"
              value={ledger ? minorToInr(ledger.rechargeTotalMinor) : '—'}
            />
            <StatCard
              title="Platform fees (range)"
              value={ledger ? minorToInr(ledger.platformFeeTotalMinor) : '—'}
            />
            <StatCard
              title="Reporter credits (range)"
              value={ledger ? minorToInr(ledger.reporterCreditTotalMinor) : '—'}
            />
            <StatCard
              title="Reporter dues"
              value={dues ? rupeesLabel(dues.totalDueRupees) : '—'}
              description={dues ? `${dues.reportersWithDues} reporters with dues` : undefined}
            />
            <StatCard
              title="Subscriptions on"
              value={sub ? `${sub.on ?? sub.active ?? 0} on / ${sub.off ?? 0} off` : '—'}
            />
            <StatCard
              title="Billing day"
              value={dashboard.reporterBillingDayOfMonth ? `Day ${dashboard.reporterBillingDayOfMonth}` : '—'}
            />
          </div>

          {ledger?.byReferenceType?.length > 0 ? (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-800">
                Ledger by type (selected range)
              </div>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500 bg-white">
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Reference</th>
                    <th className="px-4 py-2 text-right">Count</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledger.byReferenceType.map((row) => (
                    <tr key={`${row.type}-${row.referenceType}`}>
                      <td className="px-4 py-2">{row.type}</td>
                      <td className="px-4 py-2 text-slate-600">{row.referenceType}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{row.count}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium">
                        {minorToInr(row.totalMinor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {dues?.top?.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-amber-900">Top reporter dues</h3>
                <Button type="button" size="sm" variant="outline" onClick={() => onNavigateReporters?.('due')}>
                  View all due
                </Button>
              </div>
              <ul className="text-sm text-amber-950 space-y-1">
                {dues.top.slice(0, 8).map((row) => (
                  <li key={row.reporterId || row.id}>
                    {row.fullName || row.name || row.mobileNumber} — {rupeesLabel(row.dueAmountRupees)} due
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
