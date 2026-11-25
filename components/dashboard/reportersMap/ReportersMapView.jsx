import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { tenantsApi } from '../../../lib/api/tenantApi'
import { fetchReportersCoverage } from '../../../lib/api/reportersCoverageApi'
import { filterActiveTenants } from '../../../lib/tenant/isActiveTenant'
import { getAuthUser } from '../../../utils/auth'
import { getUserTenantId, isSuperAdmin } from '../../../utils/roleUtils'
import { FormField, Select, Spinner, toast } from '../../ui'

const TelanganaReporterMap = dynamic(() => import('../../reporter-map/TelanganaReporterMap'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-white">
      <Spinner />
    </div>
  ),
})

function unwrapTenants(raw) {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.items)) return raw.items
  if (Array.isArray(raw?.data?.items)) return raw.data.items
  if (Array.isArray(raw?.data)) return raw.data
  return []
}

export default function ReportersMapView() {
  const authUser = useMemo(() => getAuthUser(), [])
  const superAdmin = isSuperAdmin(authUser)
  const lockedTenantId = superAdmin ? null : getUserTenantId(authUser)

  const [tenants, setTenants] = useState([])
  const [tenantId, setTenantId] = useState(lockedTenantId || '')
  const [loading, setLoading] = useState(true)
  const [reporters, setReporters] = useState([])
  const [papers, setPapers] = useState(undefined)
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    if (!superAdmin) return
    tenantsApi
      .list(true)
      .then((res) => setTenants(filterActiveTenants(unwrapTenants(res))))
      .catch(() => toast.error('Tenants load avvaledu'))
  }, [superAdmin])

  const loadCoverage = useCallback(async () => {
    setLoading(true)
    try {
      const tid = superAdmin ? tenantId || null : lockedTenantId
      const res = await fetchReportersCoverage(tid ? { tenantId: tid } : {})
      const rows = Array.isArray(res.reporters) ? res.reporters : Array.isArray(res.data?.reporters) ? res.data.reporters : []
      setReporters(rows)
      const paperList = Array.isArray(res.papers)
        ? res.papers
        : Array.isArray(res.meta?.papers)
          ? res.meta.papers
          : [...new Set(rows.map((r) => r.paper).filter(Boolean))].sort()
      setPapers(paperList.length ? paperList : undefined)
      setMeta(res.meta || null)
    } catch (e) {
      toast.error(e?.message || 'Coverage load failed')
      setReporters([])
    } finally {
      setLoading(false)
    }
  }, [superAdmin, tenantId, lockedTenantId])

  useEffect(() => {
    loadCoverage()
  }, [loadCoverage])

  return (
    <div className="space-y-4">
      {superAdmin ? (
        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <FormField label="Paper (tenant)" className="min-w-[220px]">
            <Select value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
              <option value="">All papers</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || t.id}
                </option>
              ))}
            </Select>
          </FormField>
          <p className="text-xs text-slate-500">Super admin — all tenants on map when “All papers” selected.</p>
        </div>
      ) : null}

      {meta?.unmappedCount > 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {meta.unmappedCount} active mandal reporter(s) ki geo mandal map avvaledu — Reporter tab lo mandal assign/fix
          cheyyandi.
        </p>
      ) : null}

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-slate-200 bg-white">
          <Spinner />
        </div>
      ) : (
        <TelanganaReporterMap reporters={reporters} papers={papers} />
      )}
    </div>
  )
}