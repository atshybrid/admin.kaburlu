/**
 * Single-tenant wallet — balance, settings, recharge, transactions
 */

import { useCallback, useEffect, useState } from 'react'
import { tenantWalletApi } from '../../../lib/api/services/tenantWalletApi'
import {
  normalizeWalletRow,
  normalizeTransactionList,
  walletStatusColor,
} from '../../../lib/tenantWallet/normalize'
import { formatWalletError } from '../../../lib/tenantWallet/walletErrors'
import { billingDayLabel, walletOperationalLabel } from '../../../lib/tenantWallet/displayLabels'
import {
  Button,
  FormField,
  Input,
  Modal,
  Select,
  Spinner,
  StatCard,
  StatusBadge,
  toast,
} from '../../ui'

const FEE_PRESETS = [
  { label: 'Small paper — ₹8,000 + GST', base: 8000 },
  { label: 'Big paper — ₹12,000 + GST', base: 12000 },
  { label: 'Custom', base: null },
]

export default function TenantWalletPanel({ tenantId, tenantName, tenantSlug, prgiNumber, embedded, onUpdated }) {
  const [loading, setLoading] = useState(true)
  const [row, setRow] = useState(null)
  const [txns, setTxns] = useState([])
  const [txLoading, setTxLoading] = useState(false)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [rechargeOpen, setRechargeOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [feePreset, setFeePreset] = useState('8000')
  const [customFee, setCustomFee] = useState('8000')
  const [gstPercent, setGstPercent] = useState('18')
  const [billingDay, setBillingDay] = useState('1')
  const [rechargeAmount, setRechargeAmount] = useState('')
  const [rechargeNote, setRechargeNote] = useState('')

  const loadWallet = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const raw = await tenantWalletApi.getWallet(tenantId)
      setRow(normalizeWalletRow(raw))
    } catch (err) {
      toast.error(formatWalletError(err, 'Failed to load wallet'))
      setRow(null)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const loadTxns = useCallback(async () => {
    if (!tenantId) return
    setTxLoading(true)
    try {
      const raw = await tenantWalletApi.getTransactions(tenantId, { page: 1, pageSize: 30 })
      setTxns(normalizeTransactionList(raw))
    } catch {
      setTxns([])
    } finally {
      setTxLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    loadWallet()
    loadTxns()
  }, [loadWallet, loadTxns])

  const openSettings = () => {
    const base = row?.monthlyPlatformFeeMinor ? row.monthlyPlatformFeeMinor / 100 : 8000
    const preset = base === 12000 ? '12000' : base === 8000 ? '8000' : 'custom'
    setFeePreset(preset)
    setCustomFee(String(base))
    setGstPercent(String(row?.monthlyPlatformFeeGstPercent ?? 18))
    setBillingDay(String(row?.monthlyPlatformFeeBillingDay ?? 1))
    setSettingsOpen(true)
  }

  const handleSaveSettings = async () => {
    const base =
      feePreset === 'custom'
        ? Number(customFee)
        : feePreset === '12000'
          ? 12000
          : 8000
    if (!Number.isFinite(base) || base < 0) {
      toast.error('Enter a valid monthly fee')
      return
    }
    const day = Number(billingDay)
    if (!Number.isInteger(day) || day < 1 || day > 28) {
      toast.error('Billing day must be 1–28')
      return
    }
    setSaving(true)
    try {
      await tenantWalletApi.updateSettings(tenantId, {
        monthlyPlatformFeeRupees: base,
        monthlyPlatformFeeGstPercent: Number(gstPercent) || 18,
        monthlyPlatformFeeBillingDay: day,
      })
      toast.success('Monthly fee updated')
      setSettingsOpen(false)
      await loadWallet()
      onUpdated?.()
    } catch (err) {
      toast.error(formatWalletError(err, 'Settings update failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleRecharge = async () => {
    const amount = Number(rechargeAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid recharge amount')
      return
    }
    setSaving(true)
    try {
      await tenantWalletApi.recharge(tenantId, {
        amountRupees: amount,
        description: rechargeNote.trim() || 'Manual top-up',
      })
      toast.success('Wallet recharged')
      setRechargeOpen(false)
      setRechargeAmount('')
      setRechargeNote('')
      await loadWallet()
      await loadTxns()
      onUpdated?.()
    } catch (err) {
      toast.error(formatWalletError(err, 'Recharge failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleProcessFee = async () => {
    if (!confirm('Deduct this month\'s platform fee from this tenant\'s wallet now?')) return
    setSaving(true)
    try {
      const res = await tenantWalletApi.processMonthlyFee({ tenantId })
      const skipped = res?.result?.skipped || res?.skipped
      if (skipped) {
        toast.info(res?.result?.reason || res?.reason || 'Already charged this month')
      } else {
        toast.success('Monthly fee processed')
      }
      await loadWallet()
      await loadTxns()
      onUpdated?.()
    } catch (err) {
      toast.error(formatWalletError(err, 'Monthly fee failed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!row) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
        Wallet not found for this tenant.
      </div>
    )
  }

  const monthlyTotal = row.formattedMonthlyTotal || '—'
  const suggestedMin = row.monthlyFeeTotalMinor
    ? (row.monthlyFeeTotalMinor / 100).toFixed(0)
    : '9440'
  const subtitle = [tenantSlug || row.tenantSlug, prgiNumber || row.prgiNumber ? `PRGI ${prgiNumber || row.prgiNumber}` : null]
    .filter(Boolean)
    .join(' · ')
  const settingsGstPreview = (() => {
    const base =
      feePreset === 'custom' ? Number(customFee) : feePreset === '12000' ? 12000 : 8000
    if (!Number.isFinite(base) || base < 0) return null
    const gst = Number(gstPercent) || 0
    const total = base * (1 + gst / 100)
    return `₹${total.toLocaleString('en-IN', { maximumFractionDigits: 0 })} / month (incl. ${gst}% GST)`
  })()

  return (
    <div className="space-y-6">
      {!embedded ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{tenantName || row.tenantName}</h2>
            {subtitle ? <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p> : null}
          </div>
          <StatusBadge status={row.status} color={walletStatusColor(row.status)} />
        </div>
      ) : (
        <div className="flex items-center justify-end">
          <StatusBadge status={row.status} color={walletStatusColor(row.status)} />
        </div>
      )}

      {!row.canOperate && row.message ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {row.message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Wallet balance" value={row.formattedBalance} />
        <StatCard title="Monthly fee (incl. GST)" value={monthlyTotal} />
        <StatCard
          title="Platform fee deduct day"
          value={billingDayLabel(row.monthlyPlatformFeeBillingDay || 1)}
        />
        <StatCard
          title="Account status"
          value={walletOperationalLabel(row.canOperate)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setRechargeOpen(true)}>
          Manual recharge
        </Button>
        <Button size="sm" variant="outline" onClick={openSettings}>
          Monthly fee settings
        </Button>
        <Button size="sm" variant="outline" loading={saving} onClick={handleProcessFee}>
          Run monthly deduction
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { loadWallet(); loadTxns() }}>
          Refresh
        </Button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Recent transactions</h3>
        {txLoading ? (
          <Spinner />
        ) : !txns.length ? (
          <p className="text-sm text-slate-500">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Reference</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {txns.map((tx, i) => (
                  <tr key={tx.createdAt ? `${tx.createdAt}-${i}` : i} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      }) : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-medium ${tx.direction === 'IN' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {tx.displayType || tx.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600 max-w-[200px] truncate" title={tx.referenceLabel !== '—' ? tx.referenceLabel : undefined}>
                      {tx.referenceLabel}
                    </td>
                    <td className={`px-3 py-2 text-right text-xs font-semibold tabular-nums ${tx.direction === 'IN' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {tx.direction === 'IN' ? '+' : '−'}{tx.formattedAmount}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-slate-500 tabular-nums">
                      {tx.formattedBalanceAfter}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Monthly platform fee"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSaveSettings}>Save settings</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Set base fee before GST. Deduction each month = base + GST%.
          </p>
          <FormField label="Fee preset">
            <Select value={feePreset} onChange={(e) => setFeePreset(e.target.value)}>
              {FEE_PRESETS.map((p) => (
                <option key={p.label} value={p.base == null ? 'custom' : String(p.base)}>
                  {p.label}
                </option>
              ))}
            </Select>
          </FormField>
          {feePreset === 'custom' ? (
            <FormField label="Custom base (₹)">
              <Input
                type="number"
                min={0}
                value={customFee}
                onChange={(e) => setCustomFee(e.target.value)}
              />
            </FormField>
          ) : null}
          <FormField label="GST %">
            <Input
              type="number"
              min={0}
              max={100}
              value={gstPercent}
              onChange={(e) => setGstPercent(e.target.value)}
            />
          </FormField>
          <FormField label="Monthly deduction day" hint="Day 1–28 of each month (platform fee auto-deduct)">
            <Select value={billingDay} onChange={(e) => setBillingDay(e.target.value)}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={String(d)}>
                  {billingDayLabel(d)}
                </option>
              ))}
            </Select>
          </FormField>
          {settingsGstPreview ? (
            <p className="text-sm text-slate-600 rounded-lg bg-slate-50 px-3 py-2">
              Estimated deduction: <strong>{settingsGstPreview}</strong>
              {billingDay ? ` on ${billingDayLabel(billingDay)}` : null}
            </p>
          ) : null}
        </div>
      </Modal>

      <Modal
        isOpen={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
        title="Manual recharge"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRechargeOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleRecharge}>Recharge wallet</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            100% credited to wallet (no gateway fee). Suggested minimum for 1 month:{' '}
            <strong>₹{suggestedMin}</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            {[5000, 9440, 10000, 14160, 15000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setRechargeAmount(String(amt))}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                ₹{amt.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
          <FormField label="Amount (₹)" required>
            <Input
              type="number"
              min={1}
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
              placeholder="10000"
            />
          </FormField>
          <FormField label="Description">
            <Input
              value={rechargeNote}
              onChange={(e) => setRechargeNote(e.target.value)}
              placeholder="June top-up"
            />
          </FormField>
        </div>
      </Modal>
    </div>
  )
}
