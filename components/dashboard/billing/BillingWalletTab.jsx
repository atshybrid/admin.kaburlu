import { useCallback, useEffect, useState } from 'react'
import { platformBillingApi } from '../../../lib/api/services/platformBillingApi'
import { istMonthBounds, minorToInr } from '../../../lib/billing/dateRange'
import { normalizeTransactionList } from '../../../lib/tenantWallet/normalize'
import TenantWalletPanel from '../tenantWallet/TenantWalletPanel'
import BillingDateRangeBar from './BillingDateRangeBar'
import { Spinner, toast } from '../../ui'

export default function BillingWalletTab({ tenantId, tenantMeta }) {
  const bounds = istMonthBounds()
  const [from, setFrom] = useState(bounds.from)
  const [to, setTo] = useState(bounds.to)
  const [loading, setLoading] = useState(false)
  const [txns, setTxns] = useState([])

  const loadTxns = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await platformBillingApi.getWalletTransactions(tenantId, {
        from,
        to,
        page: 1,
        pageSize: 100,
      })
      const list = res?.data ?? res?.items ?? res?.transactions
      setTxns(normalizeTransactionList(Array.isArray(list) ? { data: list } : res))
    } catch (err) {
      toast.error(err.message || 'Failed to load transactions')
      setTxns([])
    } finally {
      setLoading(false)
    }
  }, [tenantId, from, to])

  useEffect(() => {
    loadTxns()
  }, [loadTxns])

  return (
    <div className="space-y-6">
      <TenantWalletPanel
        tenantId={tenantId}
        tenantName={tenantMeta?.name}
        tenantSlug={tenantMeta?.slug}
        prgiNumber={tenantMeta?.prgiNumber}
        embedded
        onUpdated={loadTxns}
      />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">Wallet transactions (dated)</h3>
        <BillingDateRangeBar
          from={from}
          to={to}
          onFrom={setFrom}
          onTo={setTo}
          onApply={loadTxns}
          loading={loading}
        />
        {loading ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Reference</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {txns.map((tx, i) => (
                  <tr key={tx.id || i}>
                    <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="px-3 py-2">{tx.displayType || tx.type}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{tx.referenceLabel}</td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {tx.formattedAmount || minorToInr(tx.amountMinor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!txns.length ? (
              <p className="text-center py-8 text-slate-500 text-sm">No transactions in this range.</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
