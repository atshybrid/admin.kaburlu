/**
 * All tenants — platform wallet overview (Super Admin)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useLayout } from '../DashboardLayout'
import { hasRole } from '../../../utils/roleUtils'
import { tenantWalletApi } from '../../../lib/api/services/tenantWalletApi'
import { normalizeWalletList, walletStatusColor } from '../../../lib/tenantWallet/normalize'
import { formatWalletError } from '../../../lib/tenantWallet/walletErrors'
import { billingDayLabel } from '../../../lib/tenantWallet/displayLabels'
import TenantWalletPanel from './TenantWalletPanel'
import {
  Button,
  Input,
  SlidePanel,
  Spinner,
  StatCard,
  StatusBadge,
  toast,
} from '../../ui'

function tenantSubtitle(row) {
  const parts = []
  if (row.tenantSlug) parts.push(row.tenantSlug)
  if (row.prgiNumber) parts.push(`PRGI ${row.prgiNumber}`)
  return parts.join(' · ')
}

export default function TenantWalletView() {
  const { user } = useLayout()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: 1, pageSize: 100 }
      if (statusFilter) params.status = statusFilter
      const raw = await tenantWalletApi.listWallets(params)
      setItems(normalizeWalletList(raw).items)
    } catch (err) {
      toast.error(formatWalletError(err, 'Failed to load wallets'))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) => {
      const hay = [row.tenantName, row.tenantSlug, row.prgiNumber].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [items, search])

  if (!hasRole(user, ['SUPER_ADMIN', 'SUPERADMIN'])) {
    return (
      <div className="max-w-lg mx-auto mt-16 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-rose-900">Super admin only</h2>
        <p className="text-sm text-rose-700 mt-2">Tenant wallet system requires SUPER_ADMIN access.</p>
      </div>
    )
  }

  const openTenant = (row) => {
    setSelected(row)
    setPanelOpen(true)
  }

  const runAllMonthly = async () => {
    if (!confirm('Run monthly platform fee for ALL tenants?')) return
    setBulkBusy(true)
    try {
      await tenantWalletApi.processMonthlyFee({})
      toast.success('Monthly fee job completed')
      load()
    } catch (err) {
      toast.error(formatWalletError(err, 'Bulk monthly fee failed'))
    } finally {
      setBulkBusy(false)
    }
  }

  const runBackfill = async () => {
    if (!confirm('Backfill reporter payment credits for all tenants?')) return
    setBulkBusy(true)
    try {
      await tenantWalletApi.backfillReporterCredits({})
      toast.success('Backfill started')
      load()
    } catch (err) {
      toast.error(formatWalletError(err, 'Backfill failed'))
    } finally {
      setBulkBusy(false)
    }
  }

  const active = items.filter((i) => i.status === 'ACTIVE').length
  const expired = items.filter((i) => i.status === 'EXPIRED').length

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Super Admin · Billing
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Tenant Wallet System</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Prepaid wallets for all newspapers — manual recharge, monthly platform fee (₹8,000 / ₹12,000 +
            GST), and transaction history.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" loading={bulkBusy} onClick={runBackfill}>
            Backfill reporter credits
          </Button>
          <Button variant="outline" size="sm" loading={bulkBusy} onClick={runAllMonthly}>
            Process all monthly fees
          </Button>
          <Button variant="ghost" size="sm" onClick={load} loading={loading}>
            Refresh
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total tenants" value={items.length} />
        <StatCard title="Active wallets" value={active} />
        <StatCard title="Expired / locked" value={expired} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, slug, or PRGI…"
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {['', 'ACTIVE', 'EXPIRED'].map((s) => (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {s === 'ACTIVE' ? 'Active' : s === 'EXPIRED' ? 'Expired' : 'All status'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-900 text-left text-[11px] uppercase tracking-wider text-slate-300">
                <th className="px-4 py-3 font-semibold">Newspaper</th>
                <th className="px-4 py-3 font-semibold">Balance</th>
                <th className="px-4 py-3 font-semibold">Monthly fee</th>
                <th className="px-4 py-3 font-semibold">Fee day</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => {
                const sub = tenantSubtitle(row)
                return (
                  <tr
                    key={row.tenantId}
                    className="hover:bg-slate-50/80 cursor-pointer"
                    onClick={() => openTenant(row)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{row.tenantName}</div>
                      {sub ? <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div> : null}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 tabular-nums">{row.formattedBalance}</td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums">{row.formattedMonthlyTotal}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {billingDayLabel(row.monthlyPlatformFeeBillingDay || 1)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} color={walletStatusColor(row.status)} />
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); openTenant(row) }}
                      >
                        Manage
                      </Button>
                      <Link
                        href={`/admin/tenants/${row.tenantId}/tenant-wallet`}
                        className="text-xs text-brand hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Tenant page
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!filtered.length ? (
            <p className="text-center py-12 text-slate-500 text-sm">
              {search ? 'No newspapers match your search.' : 'No wallets found.'}
            </p>
          ) : null}
        </div>
      )}

      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Tenant wallet"
        subtitle={selected?.tenantName}
        width="lg"
      >
        {selected?.tenantId ? (
          <TenantWalletPanel
            tenantId={selected.tenantId}
            tenantName={selected.tenantName}
            tenantSlug={selected.tenantSlug}
            prgiNumber={selected.prgiNumber}
            embedded
            onUpdated={load}
          />
        ) : null}
      </SlidePanel>
    </div>
  )
}
