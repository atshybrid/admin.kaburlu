import { useCallback, useEffect, useState } from 'react'
import newsDeskApi, { formatNewsDeskError } from '../../../../lib/api/services/newsDeskApi'
import { loadNewsDeskTenants } from '../../../../lib/newsDesk/tenantList'
import { Button, Spinner, Switch, toast } from '../../../ui'
import NewsDeskSection from '../NewsDeskSection'

export default function NewsDeskStaffPanel() {
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [items, setItems] = useState([])
  const [roles, setRoles] = useState([])
  const [tenants, setTenants] = useState([])
  const [drafts, setDrafts] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [staffRes, rolesRes, tenantRows] = await Promise.all([
        newsDeskApi.listStaff(),
        newsDeskApi.getAssignableRoles(),
        loadNewsDeskTenants().catch(() => []),
      ])
      setItems(staffRes?.items || [])
      setRoles(rolesRes?.roles || [])
      setTenants(tenantRows)
      const next = {}
      ;(staffRes?.items || []).forEach((row) => {
        next[row.userId] = {
          roleName: row.roleName,
          syndicationEnabled: row.syndicationEnabled,
          allowedTenantIds: row.allowedTenantIds || [],
        }
      })
      setDrafts(next)
    } catch (error) {
      toast.error(formatNewsDeskError(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const updateDraft = (userId, patch) => {
    setDrafts((prev) => ({ ...prev, [userId]: { ...prev[userId], ...patch } }))
  }

  const toggleTenant = (userId, tenantId) => {
    const cur = drafts[userId]?.allowedTenantIds || []
    const next = cur.includes(tenantId) ? cur.filter((id) => id !== tenantId) : [...cur, tenantId]
    updateDraft(userId, { allowedTenantIds: next })
  }

  const saveRow = async (userId) => {
    const d = drafts[userId]
    if (!d) return
    setSavingId(userId)
    try {
      await newsDeskApi.patchStaff(userId, {
        roleName: d.roleName,
        syndicationEnabled: d.syndicationEnabled,
        allowedTenantIds: d.allowedTenantIds,
      })
      toast.success('Operator updated')
      await load()
    } catch (error) {
      toast.error(formatNewsDeskError(error))
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return (
    <NewsDeskSection
      title="Team & access"
      subtitle="Syndication toggle, desk role, and tenant scope for intake (single tenant = no picker on create)"
      unpadded
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3">Operator</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Syndicate</th>
              <th className="px-4 py-3">Tenant scope</th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const d = drafts[row.userId] || {}
              return (
                <tr key={row.userId} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{row.fullName || row.mobileNumber || row.userId}</p>
                    <p className="text-xs text-slate-500">{row.mobileNumber || row.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      value={d.roleName || row.roleName}
                      onChange={(e) => updateDraft(row.userId, { roleName: e.target.value })}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={d.syndicationEnabled !== false}
                      onChange={(checked) => updateDraft(row.userId, { syndicationEnabled: checked })}
                      aria-label="Syndication access"
                    />
                    <p className="text-xs text-slate-500 mt-1">{d.syndicationEnabled !== false ? 'Yes' : 'No'}</p>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {tenants.slice(0, 40).map((t) => (
                        <label key={t.id} className="flex items-center gap-2 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={(d.allowedTenantIds || []).includes(t.id)}
                            onChange={() => toggleTenant(row.userId, t.id)}
                          />
                          <span className="truncate">{t.name || t.slug}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Button type="button" size="sm" disabled={savingId === row.userId} onClick={() => saveRow(row.userId)}>
                      {savingId === row.userId ? '…' : 'Save'}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!items.length ? (
          <p className="p-6 text-sm text-slate-500">No desk operators found. Assign NEWS_DESK role on Users first.</p>
        ) : null}
      </div>
    </NewsDeskSection>
  )
}