/**
 * Platform billing hub — SUPER_ADMIN
 * /admin/billing/[tenantId]?tab=overview|wallet|reporters|settings
 */
import { useRouter } from 'next/router'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import BillingTenantHub from '../../../components/dashboard/billing/BillingTenantHub'
import { useEffect, useState } from 'react'
import { tenantsApi } from '../../../lib/api/tenantApi'
import { Spinner } from '../../../components/ui'

export default function BillingTenantPage() {
  const router = useRouter()
  const tenantId = String(router.query.tenantId || '')
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await tenantsApi.get(tenantId)
        const row = res?.data ?? res
        if (!cancelled) setTenant(row)
      } catch {
        if (!cancelled) setTenant(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tenantId])

  if (!router.isReady || loading) {
    return (
      <DashboardLayout title="Billing">
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  const name = tenant?.name || tenant?.entity?.name || 'Tenant'
  const slug = tenant?.slug || ''
  const prgi = tenant?.prgiNumber || tenant?.entity?.prgiNumber || ''

  return (
    <DashboardLayout title={`Billing · ${name}`}>
      <BillingTenantHub tenantId={tenantId} tenantName={name} tenantSlug={slug} prgiNumber={prgi} />
    </DashboardLayout>
  )
}
