/**
 * Reporter subscription billing day — per tenant
 * GET/PATCH /tenants/:tenantId/reporter-billing-settings
 */
import { useCallback, useEffect, useState } from 'react'
import { reporterBillingApi } from '../../../lib/api/services/reporterBillingApi'
import { formatWalletError } from '../../../lib/tenantWallet/walletErrors'
import { billingDayLabel } from '../../../lib/tenantWallet/displayLabels'
import { useLayout } from '../../dashboard/DashboardLayout'
import { hasRole } from '../../../utils/roleUtils'
import { Button, FormField, Select, Spinner, toast } from '../../ui'

export default function TenantReporterBillingTab({ tenantContext }) {
  const { user } = useLayout()
  const isSuperAdmin = hasRole(user, ['SUPER_ADMIN', 'SUPERADMIN'])
  const tenant = tenantContext?.tenant
  const tenantId = tenant?.id || tenantContext?.tenantId

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [billingDay, setBillingDay] = useState('1')
  const [savedDay, setSavedDay] = useState('1')
  const [locked, setLocked] = useState(false)
  const [serverLocked, setServerLocked] = useState(false)
  const [meta, setMeta] = useState(null)

  const minDay = meta?.billingDayRange?.min ?? 1
  const maxDay = meta?.billingDayRange?.max ?? 28
  const dayOptions = Array.from({ length: maxDay - minDay + 1 }, (_, i) => minDay + i)

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const data = await reporterBillingApi.get(tenantId)
      const rb = data?.reporterBilling || data?.data?.reporterBilling || {}
      const m = data?.meta || data?.data?.meta || null
      const day = String(rb.subscriptionBillingDayOfMonth ?? m?.defaultBillingDay ?? 1)
      setBillingDay(day)
      setSavedDay(day)
      setServerLocked(Boolean(rb.subscriptionBillingDayLocked))
      setLocked(Boolean(rb.subscriptionBillingDayLocked))
      setMeta(m)
    } catch (err) {
      toast.error(formatWalletError(err, 'Failed to load reporter billing settings'))
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    load()
  }, [load])

  const hasChanges =
    billingDay !== savedDay || (isSuperAdmin && locked !== serverLocked)

  const handleSave = async () => {
    const day = Number(billingDay)
    if (!Number.isInteger(day) || day < minDay || day > maxDay) {
      toast.error(`Billing day must be ${minDay}–${maxDay}`)
      return
    }

    const body = { subscriptionBillingDayOfMonth: day }
    if (isSuperAdmin) {
      body.subscriptionBillingDayLocked = locked
    }

    setSaving(true)
    try {
      await reporterBillingApi.patch(tenantId, body)
      toast.success('Reporter billing settings updated')
      await load()
      tenantContext?.refreshTenant?.()
    } catch (err) {
      toast.error(formatWalletError(err, 'Failed to update billing settings'))
    } finally {
      setSaving(false)
    }
  }

  if (!tenantId) {
    return <p className="text-sm text-slate-500 p-4">Tenant not loaded.</p>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner />
      </div>
    )
  }

  const tenantAdminBlocked = serverLocked && !isSuperAdmin

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Reporter Subscription Billing</h2>
        <p className="text-sm text-slate-500 mt-1">
          Choose which day of the month reporter subscription dues become visible.
          Before that day, reporters will not see a pending monthly subscription charge.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Current due day</p>
          <p className="text-lg font-semibold text-slate-900 mt-1">{billingDayLabel(Number(savedDay))}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Lock status</p>
          <p className="text-lg font-semibold text-slate-900 mt-1">
            {serverLocked ? 'Locked by Super Admin' : 'Tenant can change'}
          </p>
        </div>
      </div>

      {serverLocked && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          Billing day is locked by Super Admin
          {!isSuperAdmin && ' — contact Super Admin to request a change'}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
        <FormField
          label="Subscription due day"
          hint={`Reporters see monthly dues from this day each month (${minDay}–${maxDay})`}
        >
          <Select
            value={billingDay}
            onChange={(e) => setBillingDay(e.target.value)}
            disabled={tenantAdminBlocked}
          >
            {dayOptions.map((d) => (
              <option key={d} value={String(d)}>
                {billingDayLabel(d)}
              </option>
            ))}
          </Select>
        </FormField>

        {isSuperAdmin && (
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 rounded border-slate-300"
              checked={locked}
              onChange={(e) => setLocked(e.target.checked)}
            />
            <span>
              <span className="text-sm font-medium text-slate-900">Lock billing day</span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Tenant admin cannot change the day while locked
              </span>
            </span>
          </label>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {hasChanges ? (
            <span className="text-xs text-amber-600">Unsaved changes</span>
          ) : (
            <span className="text-xs text-slate-400">All changes saved</span>
          )}
          <Button onClick={handleSave} disabled={saving || tenantAdminBlocked || !hasChanges}>
            {saving ? 'Saving…' : 'Save settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
