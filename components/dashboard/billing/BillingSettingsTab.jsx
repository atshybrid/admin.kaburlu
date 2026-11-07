import { useEffect, useState } from 'react'
import Link from 'next/link'
import { platformBillingApi } from '../../../lib/api/services/platformBillingApi'
import { reporterBillingApi } from '../../../lib/api/services/reporterBillingApi'
import { Button, FormField, Select, Spinner, Switch, toast } from '../../ui'

export default function BillingSettingsTab({ tenantId }) {
  const [flags, setFlags] = useState({ deactivated: false, excludeFromActiveList: false })
  const [billingDay, setBillingDay] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [dash, billing] = await Promise.all([
          platformBillingApi.getDashboard(tenantId, {}).catch(() => null),
          reporterBillingApi.get(tenantId).catch(() => null),
        ])
        if (cancelled) return
        const data = dash?.data ?? dash
        const wb = data?.walletBillingFlags
        if (wb) {
          setFlags({
            deactivated: Boolean(wb.deactivated),
            excludeFromActiveList: Boolean(wb.excludeFromActiveList),
          })
        }
        const b = billing?.data ?? billing
        if (b?.subscriptionBillingDayOfMonth) {
          setBillingDay(Number(b.subscriptionBillingDayOfMonth) || 1)
        } else if (data?.reporterBillingDayOfMonth) {
          setBillingDay(Number(data.reporterBillingDayOfMonth) || 1)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tenantId])

  const saveFlags = async () => {
    setSaving(true)
    try {
      await platformBillingApi.patchWalletBillingFlags(tenantId, flags)
      toast.success('Wallet billing flags saved')
    } catch (err) {
      toast.error(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const activateScheduled = async () => {
    try {
      await platformBillingApi.activateScheduledSubscriptions(tenantId)
      toast.success('Scheduled activations processed')
    } catch (err) {
      toast.error(err.message || 'Activation failed')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="rounded-xl border border-slate-200 p-5 space-y-4 bg-white">
        <h3 className="font-semibold text-slate-900">Platform wallet billing</h3>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-800">Deactivate wallet billing</p>
            <p className="text-xs text-slate-500">Stops monthly platform fee runs for this tenant</p>
          </div>
          <Switch
            checked={flags.deactivated}
            onChange={(v) => setFlags((f) => ({ ...f, deactivated: v }))}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-800">Exclude from active list</p>
            <p className="text-xs text-slate-500">Hide from active wallet marketing list</p>
          </div>
          <Switch
            checked={flags.excludeFromActiveList}
            onChange={(v) => setFlags((f) => ({ ...f, excludeFromActiveList: v }))}
          />
        </div>
        <Button type="button" loading={saving} onClick={saveFlags}>
          Save wallet flags
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 p-5 space-y-3 bg-white">
        <h3 className="font-semibold text-slate-900">Reporter subscriptions</h3>
        <p className="text-sm text-slate-600">
          Reporter billing day: <strong>{billingDay}</strong> of month
        </p>
        <Link
          href={`/admin/tenants/${tenantId}/reporter-billing`}
          className="text-sm text-brand font-medium hover:underline"
        >
          Open reporter billing settings →
        </Link>
        <Button type="button" variant="outline" onClick={activateScheduled}>
          Activate scheduled subscriptions
        </Button>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
        Default reporter pricing (base + GST + gateway) — edit in tenant admin when pricing UI is added.
        API: <code className="text-xs">GET/PATCH /tenants/:id/reporter-pricing</code>
      </div>
    </div>
  )
}
